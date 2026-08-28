import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Upload, CheckCircle, Loader2, AlertCircle, Clock, ExternalLink, RefreshCw, Download, Zap } from 'lucide-react';
import api from '../../services/api';
import { loadSnapJs, isSnapReady } from '../../utils/midtrans';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';
import type { Submission, Payment, FormFieldValue } from '../../types';
import FileUpload from './FileUpload';

interface PaymentSectionProps {
    submission: Submission;
    fieldValues?: FormFieldValue[];
    onPaymentSuccess: () => void;
    /** Which invoice to show: 'DP' for 70% initial, 'PELUNASAN' for 30% final. Defaults to 'DP' */
    invoiceType?: 'DP' | 'PELUNASAN' | 'FULL';
}

export default function PaymentSection({ submission, fieldValues: _fieldValues = [], onPaymentSuccess, invoiceType = 'DP' }: PaymentSectionProps) {
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState<'MANUAL' | 'MIDTRANS' | 'MAYAR'>('MIDTRANS');
    const [proofUrl, setProofUrl] = useState('');
    const [amount, setAmount] = useState(0);
    const [snapLoading, setSnapLoading] = useState(false);
    const [snapError, setSnapError] = useState<string | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [activeGateway, setActiveGateway] = useState<'MIDTRANS' | 'MAYAR'>('MIDTRANS');
    const [manualEnabled, setManualEnabled] = useState(true);
    const [bankDetails, setBankDetails] = useState({
        bankName: 'BNI',
        accountNo: '1825073247',
        accountName: 'PT. Ana Nahnu Indonesia'
    });
    // Mode pembayaran: DP (70%) atau Full (100%) — hanya untuk DP invoice
    const [paymentMode, setPaymentMode] = useState<'DP' | 'FULL'>('DP');

    const user = useAuthStore((state) => state.user);
    const isEditable = user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

    // Load active payment settings on mount
    useEffect(() => {
        api.get('/system-settings/public')
            .then(res => {
                const data = res.data || {};
                if (data.PAYMENT_GATEWAY_ACTIVE) {
                    const gw = data.PAYMENT_GATEWAY_ACTIVE.toUpperCase() === 'MAYAR' ? 'MAYAR' : 'MIDTRANS';
                    setActiveGateway(gw);
                    setMethod(gw);
                }
                if (data.PAYMENT_MANUAL_ENABLED !== undefined) {
                    setManualEnabled(data.PAYMENT_MANUAL_ENABLED !== 'false');
                }
                setBankDetails({
                    bankName: data.PAYMENT_BANK_NAME || 'BNI',
                    accountNo: data.PAYMENT_BANK_ACCOUNT_NO || '1825073247',
                    accountName: data.PAYMENT_BANK_ACCOUNT_NAME || 'PT. Ana Nahnu Indonesia'
                });
            })
            .catch(err => console.error("Failed to load public payment settings:", err));
    }, []);

    // Resolve the correct invoice based on invoiceType
    const resolvedInvoice = (() => {
        const allInvoices = submission.invoices || [];
        if (allInvoices.length > 0) {
            const match = allInvoices.find(inv => inv.type === invoiceType);
            if (match) return match;
        }
        return submission.invoice || null;
    })();

    const configuredDPPct = submission.cost_detail?.dp_percentage || resolvedInvoice?.percentage || 70;
    const configuredPelunasanPct = 100 - configuredDPPct;

    // Sync amount from submission.cost_detail (primary source) or resolvedInvoice + paymentMode
    useEffect(() => {
        let total = submission.cost_detail?.total_amount || 0;

        // If cost_detail is not available, infer from resolvedInvoice
        if (total === 0 && resolvedInvoice?.amount) {
            if (resolvedInvoice.type === 'DP') {
                total = resolvedInvoice.amount / (configuredDPPct / 100);
            } else if (resolvedInvoice.type === 'PELUNASAN') {
                total = resolvedInvoice.amount / (configuredPelunasanPct / 100);
            } else {
                total = resolvedInvoice.amount;
            }
        }

        if (total > 0) {
            if (invoiceType === 'PELUNASAN') {
                setAmount(Math.round(total * (configuredPelunasanPct / 100)));
            } else if (invoiceType === 'DP') {
                if (paymentMode === 'FULL') {
                    setAmount(Math.round(total));
                } else {
                    setAmount(Math.round(total * (configuredDPPct / 100)));
                }
            } else {
                setAmount(Math.round(total));
            }
        } else if (submission.service_type === 'SELF_DECLARE_MANDIRI') {
            setLoadingConfig(true);
            api.get('/system-settings/SD_MANDIRI_COST?default=280000')
                .then(res => {
                    const val = parseInt(res.data.value, 10);
                    if (!isNaN(val)) setAmount(val);
                })
                .catch(err => console.error("Failed to load cost config", err))
                .finally(() => setLoadingConfig(false));
        }
    }, [submission, submission.id, submission.cost_detail?.total_amount, submission.service_type, resolvedInvoice, invoiceType, paymentMode, configuredDPPct, configuredPelunasanPct]);

    // Load payment history for this submission
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get(`/payments/submission/${submission.id}`);
            setPaymentHistory(res.data || []);
        } catch (err) {
            console.error('Failed to load payment history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [submission.id]);

    const handleSync = async (paymentId: number) => {
        setLoading(true);
        try {
            await api.post(`/payments/${paymentId}/sync`);
            await loadHistory();
            onPaymentSuccess();
        } catch (err) {
            console.error('Failed to sync payment:', err);
            toast.error('Gagal sinkronisasi status. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPayment = async (paymentId: number) => {
        if (!window.confirm("Apakah Anda yakin ingin membatalkan / mengganti metode pembayaran ini?")) return;
        setLoading(true);
        try {
            await api.post(`/payments/${paymentId}/cancel`);
            toast.success("Transaksi pembayaran berhasil dibatalkan. Silakan pilih metode pembayaran baru.");
            await loadHistory();
            onPaymentSuccess();
        } catch (err: any) {
            console.error('Failed to cancel payment:', err);
            toast.error(err.response?.data?.error || 'Gagal membatalkan transaksi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Auto-sync status in background every 4s when payment is pending (no manual click needed)
    useEffect(() => {
        const pending = paymentHistory.find(p => p.status === 'PENDING');
        if (!pending) return;

        const interval = setInterval(async () => {
            try {
                if (pending.method === 'MIDTRANS' || pending.method === 'MAYAR') {
                    await api.post(`/payments/${pending.id}/sync`);
                }
                await loadHistory();
                onPaymentSuccess();
            } catch (err) {
                console.error('Auto sync payment status error:', err);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [paymentHistory, loadHistory, onPaymentSuccess]);

    // Pre-load Snap.js when MIDTRANS is active
    useEffect(() => {
        if ((method === 'MIDTRANS' || activeGateway === 'MIDTRANS') && !isSnapReady()) {
            setSnapLoading(true);
            loadSnapJs()
                .then(() => {
                    setSnapLoading(false);
                    setSnapError(null);
                })
                .catch((err) => {
                    setSnapLoading(false);
                    setSnapError(err.message);
                });
        }
    }, [method, activeGateway]);

    const handlePay = async () => {
        setLoading(true);
        try {
            // Switch invoice type if necessary before paying
            if (invoiceType === 'DP' && resolvedInvoice?.id) {
                if (paymentMode === 'FULL' && resolvedInvoice.type === 'DP') {
                    await api.put(`/invoices/${resolvedInvoice.id}/switch-full`);
                } else if (paymentMode === 'DP' && resolvedInvoice.type === 'FULL') {
                    await api.put(`/invoices/${resolvedInvoice.id}/switch-dp`);
                }
            }

            if (method === 'MIDTRANS' || method === 'MAYAR') {
                const res = await api.post('/payments/online', {
                    submission_id: submission.id,
                    amount: amount,
                    email: user?.email || 'admin@ananahnu.id',
                    customer_name: user?.full_name || submission.client?.business_name || 'Customer',
                    phone: submission.client?.phone || '08123456789',
                });

                const { gateway, snap_token: snapToken, snap_url: snapUrl, payment_url: paymentUrl } = res.data;

                if (gateway === 'MAYAR') {
                    const targetUrl = paymentUrl || snapUrl;
                    if (targetUrl) {
                        window.open(targetUrl, '_blank');
                        toast.success('Halaman pembayaran Mayar.id telah dibuka di tab baru.');
                    }
                    onPaymentSuccess();
                    loadHistory();
                } else {
                    // Midtrans flow
                    if (isSnapReady() && snapToken) {
                        window.snap.pay(snapToken, {
                            onSuccess: function (_result: Record<string, unknown>) {
                                onPaymentSuccess();
                                loadHistory();
                            },
                            onPending: function (_result: Record<string, unknown>) {
                                toast.success('Pembayaran sedang diproses. Status akan diperbarui secara otomatis.');
                                loadHistory();
                            },
                            onError: function (_result: Record<string, unknown>) {
                                toast.error('Pembayaran gagal. Silakan coba lagi.');
                                loadHistory();
                            },
                            onClose: function () {
                                loadHistory();
                            },
                        });
                    } else if (snapUrl) {
                        window.open(snapUrl, '_blank');
                    }
                }
            } else {
                // Manual payment
                if (!proofUrl) {
                    toast.error('Silakan pilih file bukti pembayaran atau masukkan URL.');
                    setLoading(false);
                    return;
                }

                await api.post('/payments/manual', {
                    submission_id: submission.id,
                    amount: amount,
                    proof_url: proofUrl,
                });
                toast.success('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
                onPaymentSuccess();
                loadHistory();
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || 'Gagal membuat pembayaran';
            toast.error(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const toastId = toast.loading('Mengunduh Invoice...');
            const res = await api.get(`/documents/submissions/${submission.id}/invoice-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${submission.client?.business_name || 'Tagihan'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Invoice berhasil diunduh', { id: toastId });
        } catch (error) {
            toast.error('Gagal mengunduh invoice');
            console.error('Download error:', error);
        }
    };

    // Invoice type display label
    const invoiceLabel = invoiceType === 'PELUNASAN' ? 'Pelunasan (30%)'
        : invoiceType === 'DP' ? 'Down Payment (70%)'
            : 'Pembayaran';

    // Check for existing paid/pending payments or paid invoice
    const foundPayment = paymentHistory.find(p => p.status === 'PAID');
    const isInvoicePaid = resolvedInvoice?.status === 'PAID';
    const paidPayment = foundPayment || (isInvoicePaid ? { amount: resolvedInvoice?.amount || 0, status: 'PAID' } : null);

    const pendingPayment = paymentHistory.find(p => p.status === 'PENDING');

    // Show "Payment Completed" state
    if (paidPayment) {
        return (
            <div className="glass-panel p-6 bg-green-50 border-green-200 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-green-800">
                        <CheckCircle className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Pembayaran Selesai</h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{invoiceLabel}</span>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-green-700">
                        Jumlah: <span className="font-semibold">{formatRupiah('amount' in paidPayment ? paidPayment.amount : 0)}</span>
                    </p>
                    {('payment_type' in paidPayment && paidPayment.payment_type) && (
                        <p className="text-sm text-green-700">
                            Metode: <span className="font-semibold capitalize">{paidPayment.payment_type.replace(/_/g, ' ')}</span>
                        </p>
                    )}
                    {('paid_at' in paidPayment && paidPayment.paid_at) && (
                        <p className="text-sm text-green-600">
                            Dibayar: {new Date(paidPayment.paid_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    )}
                    {isInvoicePaid && !foundPayment && (
                        <p className="text-xs text-green-600 italic">Dikonfirmasi secara manual oleh admin</p>
                    )}
                </div>
                <button
                    onClick={handleDownloadInvoice}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download Invoice
                </button>
            </div>
        );
    }

    // Show "Waiting for Verification" state (manual payment pending)
    if (pendingPayment && pendingPayment.method === 'MANUAL') {
        return (
            <div className="glass-panel p-6 bg-amber-50/80 border border-amber-200/80 rounded-3xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-amber-900">
                        <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-700">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black">Bukti Transfer Manual Terkirim</h3>
                            <p className="text-xs text-amber-700 font-medium">Sedang diverifikasi oleh Admin Finance & Legal</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-200/70 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider">
                        Menunggu Verifikasi
                    </span>
                </div>

                <div className="p-3 bg-white/90 rounded-2xl border border-amber-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold">Total Pembayaran:</span>
                    <span className="text-sm font-black text-amber-900">{formatRupiah(pendingPayment.amount)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {pendingPayment.proof_url && (
                        <a
                            href={pendingPayment.proof_url.startsWith('http') ? pendingPayment.proof_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${pendingPayment.proof_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-4 bg-white hover:bg-amber-100/50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Lihat Bukti Transfer Terupload</span>
                        </a>
                    )}
                    <button
                        onClick={() => handleCancelPayment(pendingPayment.id)}
                        disabled={loading}
                        className="py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        <span>Batal & Ganti Metode</span>
                    </button>
                </div>
            </div>
        );
    }

    // Show "Online Payment Pending" state (Midtrans or Mayar)
    if (pendingPayment && (pendingPayment.method === 'MIDTRANS' || pendingPayment.method === 'MAYAR')) {
        const isMayar = pendingPayment.method === 'MAYAR';
        const handleOpenOnlinePayment = () => {
            if (isMayar) {
                if (pendingPayment.snap_url) {
                    window.open(pendingPayment.snap_url, '_blank');
                } else if (pendingPayment.proof_url) {
                    window.open(pendingPayment.proof_url, '_blank');
                }
            } else {
                if (pendingPayment.snap_token && isSnapReady()) {
                    window.snap.pay(pendingPayment.snap_token, {
                        onSuccess: () => { onPaymentSuccess(); loadHistory(); },
                        onPending: () => { toast.success('Pembayaran sedang diproses.'); loadHistory(); },
                        onError: () => { toast.error('Pembayaran gagal.'); loadHistory(); },
                        onClose: () => { loadHistory(); }
                    });
                } else if (pendingPayment.snap_url) {
                    window.open(pendingPayment.snap_url, '_blank');
                }
            }
        };

        return (
            <div className={`glass-panel p-6 rounded-3xl space-y-5 shadow-md border ${
                isMayar
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200/80'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200/80'
            }`}>
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${isMayar ? 'text-emerald-900' : 'text-blue-900'}`}>
                        <div className={`p-2.5 rounded-2xl ${isMayar ? 'bg-emerald-100/80 text-emerald-700' : 'bg-blue-100/80 text-blue-700'}`}>
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black">
                                Pembayaran {isMayar ? 'Mayar.id' : 'Midtrans'} Online Berlangsung
                            </h3>
                            <p className={`text-xs font-medium ${isMayar ? 'text-emerald-700' : 'text-blue-700'}`}>
                                {isMayar
                                    ? 'QRIS Real-time, Virtual Account Seluruh Bank, E-Wallet & Kartu Kredit'
                                    : 'Virtual Account (BCA, Mandiri, BRI, BNI), QRIS, atau E-Wallet'}
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                        Menunggu Pembayaran
                    </span>
                </div>

                <div className={`p-4 bg-white/90 rounded-2xl border space-y-2 ${isMayar ? 'border-emerald-100' : 'border-blue-100'}`}>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold">Total Tagihan:</span>
                        <span className="text-base font-black text-brand-600">{formatRupiah(pendingPayment.amount)}</span>
                    </div>
                    {pendingPayment.external_id && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">
                                {isMayar ? 'Order / Invoice ID Mayar:' : 'Order ID Midtrans:'}
                            </span>
                            <span className="font-mono font-bold text-gray-700">{pendingPayment.external_id}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        onClick={handleOpenOnlinePayment}
                        className={`flex-1 py-3 px-4 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                            isMayar
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-100'
                        }`}
                    >
                        <Zap className="w-4 h-4" />
                        <span>Buka Menu Pembayaran ({isMayar ? 'Mayar.id' : 'Snap / QRIS / VA'})</span>
                    </button>
                    
                    <button
                        onClick={() => handleSync(pendingPayment.id)}
                        disabled={loading}
                        className="py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Cek Status Pembayaran"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>Cek Status</span>
                    </button>

                    <button
                        onClick={() => handleCancelPayment(pendingPayment.id)}
                        disabled={loading}
                        className="py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Salah pilih metode? Batal & Ganti Metode Pembayaran"
                    >
                        <span>Ganti / Batal Metode</span>
                    </button>
                </div>
            </div>
        );
    }

    // Default: Show payment form
    return (
        <div className="glass-panel p-6 space-y-5">
            <div>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {invoiceType === 'PELUNASAN' ? 'Pelunasan Sertifikat Halal' : 'Pembayaran Diperlukan'}
                    </h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${invoiceType === 'PELUNASAN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>{invoiceLabel}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    {invoiceType === 'PELUNASAN'
                        ? 'Selesaikan pembayaran pelunasan 30% untuk mengunduh Sertifikat Halal Anda.'
                        : 'Silakan selesaikan pembayaran untuk melanjutkan proses verifikasi.'}
                </p>
            </div>

            {/* Toggle DP vs Full Payment */}
            {invoiceType === 'DP' && resolvedInvoice && (resolvedInvoice.type === 'DP' || resolvedInvoice.type === 'FULL') && (
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Mode Pembayaran</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            id="payment-mode-dp"
                            type="button"
                            onClick={() => setPaymentMode('DP')}
                            className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${paymentMode === 'DP'
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 w-full">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMode === 'DP' ? 'border-amber-500' : 'border-gray-300'
                                    }`}>
                                    {paymentMode === 'DP' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                                </div>
                                <span className={`text-sm font-bold ${paymentMode === 'DP' ? 'text-amber-700' : 'text-gray-600'
                                    }`}>Down Payment</span>
                                <span className={`ml-auto text-xs font-black px-2 py-0.5 rounded-full ${paymentMode === 'DP' ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'
                                    }`}>70%</span>
                            </div>
                            <p className="text-xs text-gray-400 ml-6">Bayar sebagian, lunasi saat SH terbit</p>
                        </button>

                        <button
                            id="payment-mode-full"
                            type="button"
                            onClick={() => setPaymentMode('FULL')}
                            className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${paymentMode === 'FULL'
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 w-full">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMode === 'FULL' ? 'border-emerald-500' : 'border-gray-300'
                                    }`}>
                                    {paymentMode === 'FULL' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                                <span className={`text-sm font-bold ${paymentMode === 'FULL' ? 'text-emerald-700' : 'text-gray-600'
                                    }`}>Bayar Penuh</span>
                                <span className={`ml-auto text-xs font-black px-2 py-0.5 rounded-full ${paymentMode === 'FULL' ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'
                                    }`}>100%</span>
                            </div>
                            <p className="text-xs text-gray-400 ml-6">Lunas sekarang, unduh SH langsung</p>
                            {paymentMode === 'FULL' && (
                                <div className="ml-6 flex items-center gap-1 text-emerald-600">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-xs font-semibold">Tidak perlu pelunasan lagi!</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Amount input */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Jumlah Pembayaran</label>
                    <span className="text-xs font-bold text-brand-600">{formatRupiah(amount)}</span>
                </div>
                {loadingConfig ? (
                    <div className="flex items-center gap-2 text-sm text-brand-600">
                        <Loader2 className="w-4 h-4 animate-spin" /> Mengambil tagihan...
                    </div>
                ) : (
                    <input
                        type="number"
                        className={`glass-input ${!isEditable ? 'bg-gray-100 text-gray-500 font-bold cursor-not-allowed' : ''}`}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min={1}
                        readOnly={!isEditable}
                    />
                )}
            </div>

            {/* Cost Breakdown */}
            {submission.cost_detail?.cost_breakdown_data && (
                <div className="mb-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700">Rincian Biaya</h4>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="py-2 px-3 font-semibold text-gray-600">Komponen</th>
                                    <th className="py-2 px-3 font-semibold text-gray-600 text-center">Qty</th>
                                    <th className="py-2 px-3 font-semibold text-gray-600 text-right">Harga</th>
                                    <th className="py-2 px-3 font-semibold text-gray-600 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(() => {
                                    try {
                                        const breakdown = JSON.parse(submission.cost_detail.cost_breakdown_data);
                                        return breakdown.map((item: any, idx: number) => (
                                             <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="py-2 px-3 text-gray-800">{item.name || item.category || item.item_name}</td>
                                                <td className="py-2 px-3 text-gray-600 text-center">{item.multiplier || item.quantity || 1}</td>
                                                <td className="py-2 px-3 text-gray-600 text-right">{formatRupiah(item.unit_cost !== undefined ? item.unit_cost : (item.amount || item.unit_price || 0))}</td>
                                                <td className="py-2 px-3 font-medium text-gray-800 text-right">{formatRupiah(item.total || 0)}</td>
                                            </tr>
                                        ));
                                    } catch (e) {
                                        return null;
                                    }
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Method selector */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => setMethod(activeGateway)}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'MIDTRANS' || method === 'MAYAR'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-medium text-sm">
                        Bayar Online ({activeGateway === 'MAYAR' ? 'Mayar.id' : 'Midtrans'})
                    </span>
                    <span className="text-xs opacity-70">
                        {activeGateway === 'MAYAR' ? 'QRIS, Virtual Account, E-Wallet' : 'QRIS, Transfer, E-Wallet'}
                    </span>
                </button>
                {manualEnabled && (
                    <button
                        onClick={() => setMethod('MANUAL')}
                        className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'MANUAL'
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                    >
                        <Upload className="w-6 h-6" />
                        <span className="font-medium text-sm">Transfer Manual</span>
                        <span className="text-xs opacity-70">Upload bukti transfer</span>
                    </button>
                )}
            </div>

            {/* Snap.js loading indicator for Midtrans */}
            {(method === 'MIDTRANS' || (method !== 'MANUAL' && activeGateway === 'MIDTRANS')) && snapLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Memuat sistem pembayaran...
                </div>
            )}
            {(method === 'MIDTRANS' || (method !== 'MANUAL' && activeGateway === 'MIDTRANS')) && snapError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {snapError}. Anda akan diarahkan ke halaman pembayaran Midtrans.
                </div>
            )}

            {/* Manual payment: file upload */}
            {method === 'MANUAL' && (
                <div className="space-y-3">
                    <div className="bg-brand-50/50 border border-brand-100 p-4 rounded-2xl space-y-2 text-brand-900 text-sm">
                        <p className="font-black text-xs uppercase tracking-wider text-brand-750">Rekening Tujuan Transfer</p>
                        <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                            <span className="text-brand-600">Bank:</span>
                            <span className="col-span-2 text-gray-850">{bankDetails.bankName}</span>
                            
                            <span className="text-brand-600">Nomor Rekening:</span>
                            <span className="col-span-2 text-gray-850 font-mono font-bold select-all">{bankDetails.accountNo}</span>
                            
                            <span className="text-brand-600">Atas Nama:</span>
                            <span className="col-span-2 text-gray-850">{bankDetails.accountName}</span>
                        </div>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">Bukti Pembayaran (Transfer)</label>
                    <div className="flex flex-col gap-2">
                        <FileUpload
                            subfolder="paymentproof"
                            label="Upload Bukti Transfer"
                            onUploadSuccess={(url) => setProofUrl(url)}
                        />
                        {proofUrl && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-medium break-all">
                                    <CheckCircle className="w-3 h-3 shrink-0" />
                                    {proofUrl}
                                </div>
                                {proofUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-brand-100 bg-white">
                                        <img
                                            src={proofUrl.startsWith('http') ? proofUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${proofUrl}`}
                                            alt="Preview Bukti"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="relative flex items-center gap-2 my-1">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Atau Masukkan URL</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                        <input
                            type="text"
                            className="glass-input text-xs"
                            placeholder="https://example.com/bukti-transfer.jpg"
                            value={proofUrl.startsWith('http') || proofUrl.startsWith('/') ? proofUrl : ''}
                            onChange={(e) => setProofUrl(e.target.value)}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400">Pastikan bukti transfer terlihat jelas mencantumkan nominal dan tanggal.</p>
                </div>
            )}

            {amount <= 0 && !loadingConfig && (
                <div className="p-3 bg-yellow-50 text-yellow-700 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Nominal biaya belum ditentukan oleh bagian Keuangan.</span>
                </div>
            )}

            {/* Pay button */}
            <button
                onClick={handlePay}
                disabled={
                    loading ||
                    (method === 'MANUAL' && !proofUrl) ||
                    amount <= 0
                }
                className="w-full glass-button bg-brand-600 text-white hover:bg-brand-700 font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        {amount > 0 ? `Bayar Rp ${amount.toLocaleString('id-ID')}` : 'Belum Ada Tagihan'}
                    </>
                )}
            </button>

            {/* Download Invoice Button */}
            <div className="flex justify-center mt-2">
                <button
                    onClick={handleDownloadInvoice}
                    className="flex items-center gap-2 px-4 py-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg text-sm font-medium transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download Invoice Sementara
                </button>
            </div>

            {/* Payment History */}
            {paymentHistory.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Riwayat Pembayaran</h4>
                    <div className="space-y-2">
                        {paymentHistory.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${p.status === 'PAID' ? 'bg-green-500' :
                                        p.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />
                                    <span className="text-gray-700 capitalize">
                                        {p.method === 'MIDTRANS' ? 'Online' : 'Manual'}
                                        {p.payment_type && ` (${p.payment_type.replace(/_/g, ' ')})`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-800">Rp {p.amount.toLocaleString('id-ID')}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {historyLoading && (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
