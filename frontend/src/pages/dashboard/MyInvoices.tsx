import { useState, useEffect, useCallback } from 'react';
import { Loader2, CreditCard, Clock, CheckSquare, Square, CheckCircle, Receipt, History } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah, formatServiceType } from '../../utils/format';
import { loadSnapJs, isSnapReady } from '../../utils/midtrans';
import toast from 'react-hot-toast';

interface Invoice {
    id: number;
    submission_id: string;
    amount: number;
    status: string;
    service_type: string;
    created_at: string;
    updated_at?: string;
    payment_id?: number;
    submission?: {
        client?: {
            business_name: string;
        };
    };
    payer?: {
        full_name: string;
        id: string;
    };
}

type TabType = 'UNPAID' | 'PAID' | 'ALL';

export default function MyInvoices() {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [paying, setPaying] = useState(false);
    const [reminding, setReminding] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('UNPAID');

    const currentUser = useAuthStore(state => state.user);
    const isCoordinator = currentUser?.role === 'HALAL_MANAGER' || currentUser?.role === 'HALAL_DIRECTOR';

    const fetchInvoices = useCallback(async (tabStatus: TabType) => {
        setLoading(true);
        try {
            const statusQuery = tabStatus === 'ALL' ? '' : tabStatus;
            const res = await api.get(`/billing/my-invoices?status=${statusQuery}`);
            const data: Invoice[] = res.data.data || [];
            setInvoices(data);

            // Auto sync any unpaid invoices that have a payment_id
            if (tabStatus === 'UNPAID' || tabStatus === 'ALL') {
                const pendingPaymentIds = Array.from(
                    new Set(
                        data
                            .filter(inv => inv.status === 'UNPAID' && inv.payment_id)
                            .map(inv => inv.payment_id)
                            .filter((id): id is number => !!id)
                    )
                );
                if (pendingPaymentIds.length > 0) {
                    Promise.all(
                        pendingPaymentIds.map(async (pid) => {
                            try {
                                await api.post(`/payments/${pid}/sync`);
                            } catch (err) {
                                console.error(`Failed to sync payment ${pid}`, err);
                            }
                        })
                    ).then(() => {
                        api.get(`/billing/my-invoices?status=${statusQuery}`).then(reRes => {
                            setInvoices(reRes.data.data || []);
                        }).catch(console.error);
                    });
                }
            }
        } catch (err) {
            console.error(err);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices(activeTab);
        loadSnapJs();
    }, [activeTab, fetchInvoices]);

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
        if (selectedIds.length === unpaidInvoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(unpaidInvoices.map(i => i.id));
        }
    };

    const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
    const totalSelected = invoices
        .filter(i => selectedIds.includes(i.id))
        .reduce((sum, i) => sum + i.amount, 0);

    const handlePay = async () => {
        if (selectedIds.length === 0) return;
        if (!isSnapReady()) {
            toast.error("Midtrans belum siap. Silakan refresh halaman.");
            return;
        }

        setPaying(true);
        try {
            const res = await api.post('/billing/pay-bulk', {
                invoice_ids: selectedIds
            });

            const snapToken = res.data.snap_token;
            const paymentId = res.data.id;
            (window as any).snap.pay(snapToken, {
                onSuccess: async () => {
                    toast.success("Pembayaran berhasil!");
                    try {
                        await api.post(`/payments/${paymentId}/sync`);
                    } catch (e) {
                        console.error("Failed to sync payment status", e);
                    }
                    fetchInvoices(activeTab);
                    setSelectedIds([]);
                },
                onPending: async () => {
                    toast("Menunggu pembayaran...", { icon: '⏳' });
                    try {
                        await api.post(`/payments/${paymentId}/sync`);
                    } catch (e) {
                        console.error("Failed to sync payment status", e);
                    }
                    fetchInvoices(activeTab);
                    setSelectedIds([]);
                },
                onError: () => {
                    toast.error("Pembayaran gagal.");
                },
                onClose: () => {
                    setPaying(false);
                }
            });
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal memproses pembayaran");
        } finally {
            setPaying(false);
        }
    };

    const handleRemind = async (id: number) => {
        setReminding(id);
        try {
            await api.post(`/billing/${id}/remind`);
            toast.success("Pengingat berhasil dikirim ke advisor.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal mengirim pengingat");
        } finally {
            setReminding(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isCoordinator ? 'Tagihan Self Declare (Tim & Saya)' : 'Tagihan Self Declare'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isCoordinator 
                            ? 'Daftar tagihan & riwayat pembayaran sertifikasi Self Declare tim advisor Anda.' 
                            : 'Daftar tagihan & riwayat pelunasan sertifikasi Self Declare.'}
                    </p>
                </div>

                {activeTab === 'UNPAID' && (
                    <div className="flex items-center gap-3">
                        {unpaidInvoices.length > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedIds(unpaidInvoices.map(i => i.id));
                                    setTimeout(() => handlePay(), 100);
                                }}
                                disabled={paying || unpaidInvoices.length === 0}
                                className="glass-button bg-emerald-600 text-white flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                Bayar Semua ({unpaidInvoices.length}) - {formatRupiah(unpaidInvoices.reduce((s, i) => s + i.amount, 0))}
                            </button>
                        )}
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handlePay}
                                disabled={paying}
                                className="glass-button bg-brand-600 text-white flex items-center gap-2 px-6 py-3 shadow-lg shadow-brand-200 hover:scale-105 active:scale-95 transition-all text-sm font-bold"
                            >
                                {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                Bayar Kolektif ({selectedIds.length} SH) - {formatRupiah(totalSelected)}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <button
                    onClick={() => { setActiveTab('UNPAID'); setSelectedIds([]); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'UNPAID'
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <Receipt className="w-4 h-4" />
                    Belum Bayar (Belum Lunas)
                </button>
                <button
                    onClick={() => { setActiveTab('PAID'); setSelectedIds([]); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'PAID'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <History className="w-4 h-4" />
                    Riwayat Pembayaran (Lunas)
                </button>
                <button
                    onClick={() => { setActiveTab('ALL'); setSelectedIds([]); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'ALL'
                            ? 'bg-gray-800 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    Semua Tagihan
                </button>
            </div>

            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                        <p className="text-xs text-gray-400 font-medium">Memuat data tagihan...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {activeTab === 'UNPAID' && (
                                        <th className="px-6 py-4">
                                            <button onClick={toggleAll} className="text-brand-600">
                                                {selectedIds.length === unpaidInvoices.length && unpaidInvoices.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Klien / Detail</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Layanan</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Tanggal Tagihan</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Nominal</th>
                                    {isCoordinator && <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Advisor</th>}
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Status / Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={isCoordinator ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                                            {activeTab === 'PAID' ? 'Belum ada riwayat pembayaran yang lunas.' :
                                             activeTab === 'UNPAID' ? 'Tidak ada tagihan tertunggak.' : 'Belum ada data tagihan.'}
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => {
                                        const isPaid = inv.status === 'PAID';
                                        return (
                                            <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inv.id) ? 'bg-brand-50/30' : ''}`}>
                                                {activeTab === 'UNPAID' && (
                                                    <td className="px-6 py-4">
                                                        {!isPaid ? (
                                                            <button onClick={() => toggleSelect(inv.id)} className="text-brand-600">
                                                                {selectedIds.includes(inv.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                            </button>
                                                        ) : (
                                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{inv.submission?.client?.business_name || 'Unknown Client'}</p>
                                                    <p className="text-xs text-gray-500">#{inv.id} - {inv.service_type}</p>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-600">
                                                    {formatServiceType(inv.service_type)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(inv.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 font-black text-brand-600">
                                                    {formatRupiah(inv.amount)}
                                                </td>
                                                {isCoordinator && (
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-medium text-gray-700">
                                                            {inv.payer?.id === currentUser?.id ? 'Saya' : inv.payer?.full_name || '-'}
                                                        </p>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right flex flex-col items-end gap-2">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                            Lunas (PAID)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                            Belum Bayar
                                                        </span>
                                                    )}
                                                    {!isPaid && isCoordinator && inv.payer?.id !== currentUser?.id && (
                                                        <button
                                                            onClick={() => handleRemind(inv.id)}
                                                            disabled={reminding === inv.id}
                                                            className="text-[10px] text-brand-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {reminding === inv.id ? <Loader2 className="w-2 h-2 animate-spin" /> : <Clock className="w-2 h-2" />}
                                                            Ingatkan
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
