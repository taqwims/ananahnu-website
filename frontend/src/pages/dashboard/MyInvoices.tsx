import { useState, useEffect, useCallback } from 'react';
import { Loader2, CreditCard, Clock, CheckSquare, Square, CheckCircle, Receipt, History, Ticket, Tag, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah, formatServiceType } from '../../utils/format';
import { loadSnapJs, isSnapReady } from '../../utils/midtrans';
import type { Voucher } from '../../types/voucher';
import { voucherService } from '../../services/voucherService';
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
        consultant?: {
            full_name: string;
            id: string;
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

    // Voucher State for Invoices
    const [invoiceVoucherCode, setInvoiceVoucherCode] = useState('');
    const [invoiceAppliedVoucher, setInvoiceAppliedVoucher] = useState<Voucher | null>(null);
    const [invoiceValidatingVoucher, setInvoiceValidatingVoucher] = useState(false);
    const [invoiceVoucherError, setInvoiceVoucherError] = useState<string | null>(null);

    const currentUser = useAuthStore(state => state.user);
    const isCoordinator = currentUser?.role === 'HALAL_MANAGER' || 
                          currentUser?.role === 'HALAL_DIRECTOR' || 
                          currentUser?.role === 'FINANCE' || 
                          currentUser?.role === 'ADMIN_KEUANGAN' || 
                          currentUser?.role === 'DIRECTOR';

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

    // Calculate Voucher Discount
    let invoiceVoucherDiscount = 0;
    if (invoiceAppliedVoucher && totalSelected > 0) {
        if (invoiceAppliedVoucher.discount_type === 'PERCENTAGE') {
            invoiceVoucherDiscount = (invoiceAppliedVoucher.discount_value / 100) * totalSelected;
            if (invoiceAppliedVoucher.max_discount && invoiceAppliedVoucher.max_discount > 0) {
                invoiceVoucherDiscount = Math.min(invoiceVoucherDiscount, invoiceAppliedVoucher.max_discount);
            }
        } else {
            invoiceVoucherDiscount = invoiceAppliedVoucher.discount_value;
        }
        invoiceVoucherDiscount = Math.min(totalSelected, Math.round(invoiceVoucherDiscount));
    }
    const finalPayAmount = Math.max(0, totalSelected - invoiceVoucherDiscount);

    const handleCheckInvoiceVoucher = async () => {
        const code = invoiceVoucherCode.trim().toUpperCase();
        if (!code) {
            setInvoiceVoucherError('Masukkan kode voucher');
            return;
        }
        setInvoiceValidatingVoucher(true);
        setInvoiceVoucherError(null);
        try {
            const res = await voucherService.validate({
                code,
                amount: totalSelected,
                service_type: 'ALL'
            });
            if (res.valid && res.voucher) {
                setInvoiceAppliedVoucher(res.voucher);
                toast.success(`Voucher "${res.voucher.code}" berhasil diterapkan!`);
            } else {
                setInvoiceAppliedVoucher(null);
                setInvoiceVoucherError(res.message || 'Kode voucher tidak valid atau tidak memenuhi syarat');
                toast.error(res.message || 'Kode voucher tidak valid');
            }
        } catch (err: any) {
            setInvoiceAppliedVoucher(null);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Kode voucher tidak valid atau kedaluwarsa';
            setInvoiceVoucherError(msg);
            toast.error(msg);
        } finally {
            setInvoiceValidatingVoucher(false);
        }
    };

    const handleRemoveInvoiceVoucher = () => {
        setInvoiceAppliedVoucher(null);
        setInvoiceVoucherCode('');
        setInvoiceVoucherError(null);
        toast.success('Voucher dibatalkan');
    };

    const handlePay = async () => {
        if (selectedIds.length === 0) return;

        setPaying(true);
        try {
            const res = await api.post('/billing/pay-bulk', {
                invoice_ids: selectedIds,
                voucher_code: invoiceAppliedVoucher ? invoiceAppliedVoucher.code : undefined
            });

            const method = res.data.method;
            const snapToken = res.data.snap_token;
            const snapUrl = res.data.snap_url;
            const paymentId = res.data.id;

            const onPaymentSuccess = async () => {
                toast.success("Pembayaran berhasil!");
                if (invoiceAppliedVoucher) {
                    try {
                        await voucherService.apply({
                            code: invoiceAppliedVoucher.code,
                            amount: invoiceVoucherDiscount,
                            reference_type: 'INVOICE',
                            reference_no: `INV-PAY-${paymentId}`,
                            user_name: currentUser?.full_name,
                            user_phone: currentUser?.phone
                        });
                    } catch (vErr) {
                        console.error('Failed to log voucher usage on invoice pay:', vErr);
                    }
                }
                try {
                    await api.post(`/payments/${paymentId}/sync`);
                } catch (e) {
                    console.error("Failed to sync payment status", e);
                }
                fetchInvoices(activeTab);
                setSelectedIds([]);
                setInvoiceAppliedVoucher(null);
                setInvoiceVoucherCode('');
            };

            if (method === 'MAYAR') {
                if (snapUrl) {
                    window.open(snapUrl, '_blank');
                    toast.success("Halaman pembayaran Mayar.id telah dibuka di tab baru.");
                }
                fetchInvoices(activeTab);
                setSelectedIds([]);
            } else {
                // Midtrans Snap flow
                if (!isSnapReady()) {
                    await loadSnapJs();
                }

                if ((window as any).snap && snapToken) {
                    (window as any).snap.pay(snapToken, {
                        onSuccess: onPaymentSuccess,
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
                } else if (snapUrl) {
                    window.open(snapUrl, '_blank');
                }
            }
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
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isCoordinator ? 'Tagihan Self Declare (Semua Agent & Tim)' : 'Tagihan Self Declare'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isCoordinator 
                            ? 'Daftar tagihan & riwayat pembayaran sertifikasi Self Declare seluruh advisor & agent.' 
                            : 'Daftar tagihan & riwayat pelunasan sertifikasi Self Declare.'}
                    </p>
                </div>

                {activeTab === 'UNPAID' && (
                    <div className="flex items-center gap-3">
                        {unpaidInvoices.length > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedIds(unpaidInvoices.map(i => i.id));
                                }}
                                disabled={paying || unpaidInvoices.length === 0}
                                className="glass-button bg-emerald-600 text-white flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Pilih Semua ({unpaidInvoices.length})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Voucher & Collective Payment Summary Box */}
            {activeTab === 'UNPAID' && selectedIds.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-600 text-white">
                                    {selectedIds.length} Tagihan Terpilih
                                </span>
                                <span className="text-xs text-gray-500">Subtotal: <strong className="text-gray-800">{formatRupiah(totalSelected)}</strong></span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 mt-1">
                                Pembayaran Kolektif Tagihan Self Declare
                            </p>
                        </div>

                        {/* Total & Action */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-xs text-gray-500 block">Total Tagihan Dibayar:</span>
                                {invoiceVoucherDiscount > 0 && (
                                    <span className="text-xs line-through text-gray-400 mr-2">
                                        {formatRupiah(totalSelected)}
                                    </span>
                                )}
                                <span className="text-xl font-black text-teal-700">
                                    {formatRupiah(finalPayAmount)}
                                </span>
                            </div>
                            <button
                                onClick={handlePay}
                                disabled={paying}
                                className="glass-button bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 px-6 py-3 shadow-lg shadow-teal-200 hover:scale-105 active:scale-95 transition-all text-sm font-bold rounded-xl"
                            >
                                {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                Bayar Sekarang
                            </button>
                        </div>
                    </div>

                    {/* Voucher Claim Section */}
                    <div className="pt-3 border-t border-teal-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-teal-600" />
                            <span className="text-xs font-semibold text-teal-900">Punya Kode Voucher / Diskon?</span>
                        </div>

                        {invoiceAppliedVoucher ? (
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-teal-300 shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                                <div className="text-xs">
                                    <span className="font-bold text-teal-900 font-mono tracking-wider">{invoiceAppliedVoucher.code}</span>
                                    <span className="text-teal-700 ml-2 font-semibold">(-{formatRupiah(invoiceVoucherDiscount)})</span>
                                </div>
                                <button
                                    onClick={handleRemoveInvoiceVoucher}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Hapus voucher"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Ticket className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="KODE VOUCHER"
                                        value={invoiceVoucherCode}
                                        onChange={(e) => {
                                            setInvoiceVoucherCode(e.target.value.toUpperCase());
                                            setInvoiceVoucherError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCheckInvoiceVoucher();
                                            }
                                        }}
                                        className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold tracking-wider rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white uppercase placeholder:text-gray-400 placeholder:font-sans placeholder:tracking-normal"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCheckInvoiceVoucher}
                                    disabled={invoiceValidatingVoucher || !invoiceVoucherCode.trim()}
                                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                                >
                                    {invoiceValidatingVoucher ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        'Klaim'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    {invoiceVoucherError && (
                        <p className="text-xs text-red-500 font-medium text-right">{invoiceVoucherError}</p>
                    )}
                </div>
            )}

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
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                                        {activeTab === 'PAID' ? 'Tanggal Pembayaran' : 'Tanggal Tagihan'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Nominal</th>
                                    {isCoordinator && <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Advisor / Agent</th>}
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
                                                <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                                    {activeTab === 'PAID' ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-emerald-700 font-bold">
                                                                {inv.updated_at ? new Date(inv.updated_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                                }) : new Date(inv.created_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                                })}
                                                            </span>
                                                            {inv.updated_at && (
                                                                <span className="text-[10px] text-gray-400">
                                                                    {new Date(inv.updated_at).toLocaleTimeString('id-ID', {
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })} WIB
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        new Date(inv.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-black text-brand-600">
                                                    {formatRupiah(inv.amount)}
                                                </td>
                                                {isCoordinator && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-800">
                                                                {inv.payer?.full_name || inv.submission?.consultant?.full_name || 'Halal Agent'}
                                                            </span>
                                                            {inv.payer?.id === currentUser?.id && (
                                                                <span className="text-[10px] text-brand-600 font-semibold">(Saya)</span>
                                                            )}
                                                        </div>
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
