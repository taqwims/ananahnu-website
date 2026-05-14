import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Clock, CheckSquare, Square } from 'lucide-react';
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

export default function MyInvoices() {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [paying, setPaying] = useState(false);
    const [reminding, setReminding] = useState<number | null>(null);
    const currentUser = useAuthStore(state => state.user);
    const isCoordinator = currentUser?.role === 'KOORDINATOR';

    useEffect(() => {
        fetchInvoices();
        loadSnapJs();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/billing/my-invoices?status=UNPAID');
            setInvoices(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === invoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(invoices.map(i => i.id));
        }
    };

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
            (window as any).snap.pay(snapToken, {
                onSuccess: () => {
                    toast.success("Pembayaran berhasil!");
                    fetchInvoices();
                    setSelectedIds([]);
                },
                onPending: () => {
                    toast("Menunggu pembayaran...", { icon: '⏳' });
                    fetchInvoices();
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
            toast.success("Pengingat berhasil dikirim ke konsultan.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal mengirim pengingat");
        } finally {
            setReminding(null);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{isCoordinator ? 'Tagihan Tim & Saya' : 'Tagihan Saya'}</h1>
                    <p className="text-gray-500 text-sm">
                        {isCoordinator 
                            ? 'Daftar tagihan sertifikasi Anda dan tim konsultan Anda.' 
                            : 'Daftar tagihan sertifikasi (Self Declare Fasilitasi (Gratis)) yang perlu dilunasi.'}
                    </p>
                </div>
                {selectedIds.length > 0 && (
                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="glass-button bg-brand-600 text-white flex items-center gap-2 px-6 py-3 shadow-lg shadow-brand-200 hover:scale-105 active:scale-95 transition-all"
                    >
                        {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                        Bayar Kolektif ({selectedIds.length} SH) - {formatRupiah(totalSelected)}
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">
                                    <button onClick={toggleAll} className="text-brand-600">
                                        {selectedIds.length === invoices.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Klien / Detail</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Produk</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Tanggal Tagihan</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Nominal</th>
                                {isCoordinator && <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Konsultan</th>}
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={isCoordinator ? 7 : 6} className="px-6 py-12 text-center text-gray-400">
                                        Tidak ada tagihan tertunggak.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inv.id) ? 'bg-brand-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelect(inv.id)} className="text-brand-600">
                                                {selectedIds.includes(inv.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </td>
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
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                                <Clock className="w-3 h-3" />
                                                Belum Bayar
                                            </span>
                                            {isCoordinator && inv.payer?.id !== currentUser?.id && (
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
