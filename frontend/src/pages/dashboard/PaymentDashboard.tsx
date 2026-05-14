import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, Filter, Loader2, Eye, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import type { Payment } from '../../types';

export default function PaymentDashboard() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [verifying, setVerifying] = useState<number | null>(null);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '20');
            if (filterStatus) params.set('status', filterStatus);
            if (filterMethod) params.set('method', filterMethod);

            const res = await api.get(`/payments/?${params}`);
            setPayments(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch { setPayments([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadPayments(); }, [page, filterStatus, filterMethod]);

    const verifyPayment = async (id: number, approved: boolean) => {
        if (!confirm(approved ? 'Setujui pembayaran ini?' : 'Tolak pembayaran ini?')) return;
        setVerifying(id);
        try {
            await api.put(`/payments/${id}/verify`, { approved });
            loadPayments();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal verifikasi');
        } finally {
            setVerifying(null);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const pendingCount = payments.filter(p => p.status === 'PENDING').length;
    const paidCount = payments.filter(p => p.status === 'PAID').length;
    const failedCount = payments.filter(p => p.status === 'FAILED').length;
    const totalPendingAmount = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

    const statusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-700',
            PAID: 'bg-green-100 text-green-700',
            FAILED: 'bg-red-100 text-red-700',
        };
        return `px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-brand-600" />
                    Pembayaran
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola dan verifikasi pembayaran sertifikasi</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
                </div>
                <div className="glass-panel p-5 bg-yellow-50/50">
                    <p className="text-xs text-yellow-700 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Menunggu Verifikasi
                    </p>
                    <p className="text-2xl font-bold text-yellow-700 mt-1">{pendingCount}</p>
                    <p className="text-xs text-yellow-600 mt-1">{formatCurrency(totalPendingAmount)}</p>
                </div>
                <div className="glass-panel p-5 bg-green-50/50">
                    <p className="text-xs text-green-700 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Berhasil
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{paidCount}</p>
                </div>
                <div className="glass-panel p-5 bg-red-50/50">
                    <p className="text-xs text-red-700 uppercase tracking-wider flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Gagal
                    </p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{failedCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-wrap gap-3 items-center">
                <Filter className="w-4 h-4 text-gray-500" />
                <select className="glass-input w-auto text-sm" value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">Semua Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                </select>
                <select className="glass-input w-auto text-sm" value={filterMethod}
                    onChange={e => { setFilterMethod(e.target.value); setPage(1); }}>
                    <option value="">Semua Metode</option>
                    <option value="MANUAL">Manual Transfer</option>
                    <option value="MIDTRANS">Midtrans</option>
                </select>
            </div>

            {/* Payment Table */}
            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : payments.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Belum ada pembayaran
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-white/50">
                            <tr className="text-left text-xs text-gray-500 uppercase">
                                <th className="p-4">ID</th>
                                <th className="p-4">Metode</th>
                                <th className="p-4 text-right">Jumlah</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Pembayar</th>
                                <th className="p-4">Nama Usaha (Client)</th>
                                <th className="p-4">Bukti / Link</th>
                                <th className="p-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.map(p => (
                                <tr key={p.id} className="hover:bg-white/30 transition">
                                    <td className="p-4 font-mono text-xs text-gray-600">#{p.id}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            p.method === 'MIDTRANS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {p.method}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-semibold text-gray-800">{formatCurrency(p.amount)}</td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1 ${statusBadge(p.status)}`}>
                                            {statusIcon(p.status)} {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">{formatDate(p.created_at)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-[8px] font-bold">
                                                {p.invoices?.[0]?.payer?.full_name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                                {p.invoices?.[0]?.payer?.full_name || 'System'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="max-w-[200px] truncate text-xs text-gray-600">
                                            {p.invoices && p.invoices.length > 1 
                                                ? `${p.invoices[0]?.submission?.client?.business_name} (+${p.invoices.length - 1} lainnya)`
                                                : p.invoices?.[0]?.submission?.client?.business_name || '-'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {p.proof_url && (
                                            <a href={p.proof_url.startsWith('http') ? p.proof_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${p.proof_url}`} 
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                                                <Eye className="w-3 h-3" /> Bukti
                                            </a>
                                        )}
                                        {p.snap_url && (
                                            <a href={p.snap_url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                <ExternalLink className="w-3 h-3" /> Snap
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {p.status === 'PENDING' && p.method === 'MANUAL' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => verifyPayment(p.id, true)}
                                                    disabled={verifying === p.id}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                                                >
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => verifyPayment(p.id, false)}
                                                    disabled={verifying === p.id}
                                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-50"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        )}
                                        {p.paid_at && (
                                            <span className="text-xs text-gray-400">
                                                {formatDate(p.paid_at)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {total > 20 && (
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                        <span>Halaman {page} dari {Math.ceil(total / 20)}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 rounded-lg bg-white/50 hover:bg-white/80 disabled:opacity-30">←</button>
                            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 rounded-lg bg-white/50 hover:bg-white/80 disabled:opacity-30">→</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
