import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Upload, CheckCircle, Loader2, AlertCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { loadSnapJs, isSnapReady } from '../../utils/midtrans';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../utils/format';
import type { Submission, Payment, FormFieldValue } from '../../types';
import FileUpload from './FileUpload';

interface PaymentSectionProps {
    submission: Submission;
    fieldValues?: FormFieldValue[];
    onPaymentSuccess: () => void;
}

export default function PaymentSection({ submission, fieldValues = [], onPaymentSuccess }: PaymentSectionProps) {
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState<'MANUAL' | 'MIDTRANS'>('MIDTRANS');
    const [proofUrl, setProofUrl] = useState('');
    const [amount, setAmount] = useState(submission.cost_detail?.total_amount || 0);
    const [snapLoading, setSnapLoading] = useState(false);
    const [snapError, setSnapError] = useState<string | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(false);

    const user = useAuthStore((state) => state.user);
    const isEditable = user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

    // Sync amount if submission cost detail changes or from invoice
    useEffect(() => {
        if (submission.invoice?.amount) {
            setAmount(submission.invoice.amount);
        } else if (submission.cost_detail?.total_amount) {
            setAmount(submission.cost_detail.total_amount);
        } else if (submission.service_type === 'REGULER') {
            setLoadingConfig(true);
            api.get(`/invoices/submission/${submission.id}`)
                .then(res => {
                    if (res.data && res.data.amount) {
                        setAmount(res.data.amount);
                    }
                })
                .catch(err => console.error("Failed to load invoice amount", err))
                .finally(() => setLoadingConfig(false));
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
    }, [submission, submission.id, submission.cost_detail?.total_amount, submission.service_type]);

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
            alert('Gagal sinkronisasi status. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Pre-load Snap.js when MIDTRANS method is selected
    useEffect(() => {
        if (method === 'MIDTRANS' && !isSnapReady()) {
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
    }, [method]);

    const handlePay = async () => {
        // Prerequisites check
        if (submission.service_type === 'REGULER' && !fieldValues.find(fv => fv.form_field.field_key === 'data_kontrak' && fv.file_url)) {
            alert('Silakan unggah Dokumen Kontrak terlebih dahulu.');
            return;
        }

        setLoading(true);
        try {
            if (method === 'MIDTRANS') {
                // Ensure Snap.js is loaded
                if (!isSnapReady()) {
                    await loadSnapJs();
                }

                const res = await api.post('/payments/midtrans', {
                    submission_id: submission.id,
                    amount: amount,
                    email: user?.email || 'admin@ananahnu.id', // Ensure valid email format
                    customer_name: user?.full_name || submission.client?.business_name || 'Customer',
                    phone: submission.client?.phone || '08123456789',
                });

                const { snap_token: snapToken, snap_url: snapUrl } = res.data;

                // Try Snap popup first
                if (isSnapReady()) {
                    window.snap.pay(snapToken, {
                        onSuccess: function (_result: Record<string, unknown>) {
                            onPaymentSuccess();
                            loadHistory();
                        },
                        onPending: function (_result: Record<string, unknown>) {
                            alert('Pembayaran sedang diproses. Status akan diperbarui secara otomatis.');
                            loadHistory();
                        },
                        onError: function (_result: Record<string, unknown>) {
                            alert('Pembayaran gagal. Silakan coba lagi.');
                            loadHistory();
                        },
                        onClose: function () {
                            // Customer closed the popup without finishing payment
                            loadHistory();
                        },
                    });
                } else if (snapUrl) {
                    // Fallback: redirect to Midtrans payment page
                    window.open(snapUrl, '_blank');
                }
            } else {
                // Manual payment
                if (!proofUrl) {
                    alert('Silakan pilih file bukti pembayaran atau masukkan URL.');
                    setLoading(false);
                    return;
                }

                await api.post('/payments/manual', {
                    submission_id: submission.id,
                    amount: amount,
                    proof_url: proofUrl,
                });
                alert('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');
                onPaymentSuccess();
                loadHistory();
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || 'Gagal membuat pembayaran';
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // Check for existing paid/pending payments
    const paidPayment = paymentHistory.find(p => p.status === 'PAID') || submission.payments?.find(p => p.status === 'PAID');
    const pendingPayment = paymentHistory.find(p => p.status === 'PENDING') || submission.payments?.find(p => p.status === 'PENDING');

    // Show "Payment Completed" state
    if (paidPayment) {
        return (
            <div className="glass-panel p-6 bg-green-50 border-green-200 space-y-4">
                <div className="flex items-center gap-3 text-green-800">
                    <CheckCircle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Pembayaran Selesai</h3>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-green-700">
                        Jumlah: <span className="font-semibold">{formatRupiah(paidPayment.amount)}</span>
                    </p>
                    {paidPayment.payment_type && (
                        <p className="text-sm text-green-700">
                            Metode: <span className="font-semibold capitalize">{paidPayment.payment_type.replace(/_/g, ' ')}</span>
                        </p>
                    )}
                    {paidPayment.paid_at && (
                        <p className="text-sm text-green-600">
                            Dibayar: {new Date(paidPayment.paid_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Show "Waiting for Verification" state (manual payment pending)
    if (pendingPayment && pendingPayment.method === 'MANUAL') {
        return (
            <div className="glass-panel p-6 bg-yellow-50 border-yellow-200 space-y-3">
                <div className="flex items-center gap-3 text-yellow-800">
                    <Clock className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Menunggu Verifikasi</h3>
                </div>
                <p className="text-sm text-yellow-700">Bukti pembayaran manual telah dikirim. Menunggu persetujuan admin.</p>
                <p className="text-sm text-yellow-600">Jumlah: {formatRupiah(pendingPayment.amount)}</p>
            </div>
        );
    }

    // Show "Midtrans Payment Pending" state
    if (pendingPayment && pendingPayment.method === 'MIDTRANS') {
        return (
            <div className="glass-panel p-6 bg-blue-50 border-blue-200 space-y-4">
                <div className="flex items-center gap-3 text-blue-800">
                    <Clock className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Pembayaran Sedang Diproses</h3>
                </div>
                <p className="text-sm text-blue-700">Transaksi online sedang menunggu pembayaran.</p>
                <div className="flex gap-2">
                    {pendingPayment.snap_url && (
                        <a
                            href={pendingPayment.snap_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Lanjutkan Pembayaran
                        </a>
                    )}
                    <button
                        onClick={() => handleSync(pendingPayment.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Refresh Status
                    </button>
                </div>
            </div>
        );
    }

    // Default: Show payment form
    return (
        <div className="glass-panel p-6 space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Pembayaran Diperlukan</h3>
                <p className="text-sm text-gray-500 mt-1">Silakan selesaikan pembayaran untuk melanjutkan proses verifikasi.</p>
            </div>

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

            {/* Method selector */}
            <div className="flex gap-4">
                <button
                    onClick={() => setMethod('MIDTRANS')}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'MIDTRANS'
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-medium text-sm">Bayar Online</span>
                    <span className="text-xs opacity-70">QRIS, Transfer, E-Wallet</span>
                </button>
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
            </div>

            {/* Snap.js loading indicator */}
            {method === 'MIDTRANS' && snapLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Memuat sistem pembayaran...
                </div>
            )}
            {method === 'MIDTRANS' && snapError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {snapError}. Anda akan diarahkan ke halaman pembayaran Midtrans.
                </div>
            )}

            {/* Manual payment: file upload */}
            {method === 'MANUAL' && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Bukti Pembayaran (Transfer)</label>
                    <div className="flex flex-col gap-2">
                        <FileUpload 
                            subfolder="paymentproof" 
                            label="Upload Bukti Transfer"
                            onUploadSuccess={(url) => setProofUrl(url)}
                        />
                        {proofUrl && (
                            <div className="flex items-center gap-2 p-2 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-medium break-all">
                                <CheckCircle className="w-3 h-3 shrink-0" />
                                {proofUrl}
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

            {/* Prerequisites check */}
            {submission.service_type === 'REGULER' && !fieldValues.find(fv => fv.form_field.field_key === 'data_kontrak' && fv.file_url) && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Anda belum mengunggah Dokumen Kontrak. Silakan edit Dokumen & Data di atas terlebih dahulu.</span>
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
                    amount <= 0 ||
                    (submission.service_type === 'REGULER' && !fieldValues.find(fv => fv.form_field.field_key === 'data_kontrak' && fv.file_url))
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
