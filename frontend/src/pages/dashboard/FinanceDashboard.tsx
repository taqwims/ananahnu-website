import { useState, useEffect } from 'react';
import { Receipt, DollarSign, CheckCircle, Clock, Filter, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { Invoice } from '../../types';

export default function FinanceDashboard() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterService, setFilterService] = useState('');

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '20');
            if (filterStatus) params.set('status', filterStatus);
            if (filterService) params.set('service_type', filterService);

            const res = await api.get(`/billing/all-invoices?${params}`);
            setInvoices(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch { setInvoices([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadInvoices(); }, [page, filterStatus, filterService]);

    const markPaid = async (id: number) => {
        if (!confirm('Tandai tagihan ini sebagai LUNAS?')) return;
        try {
            await api.put(`/billing/${id}/mark-paid`);
            loadInvoices();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal update status');
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const totalUnpaid = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-brand-600" />
                    Dashboard Keuangan
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola tagihan sertifikasi halal</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Tagihan</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
                </div>
                <div className="glass-panel p-5 bg-yellow-50/50">
                    <p className="text-xs text-yellow-700 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Belum Lunas
                    </p>
                    <p className="text-2xl font-bold text-yellow-700 mt-1">{formatCurrency(totalUnpaid)}</p>
                </div>
                <div className="glass-panel p-5 bg-green-50/50">
                    <p className="text-xs text-green-700 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Lunas
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalPaid)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-wrap gap-3 items-center">
                <Filter className="w-4 h-4 text-gray-500" />
                <select className="glass-input w-auto text-sm" value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">Semua Status</option>
                    <option value="UNPAID">Belum Lunas</option>
                    <option value="PAID">Lunas</option>
                </select>
                <select className="glass-input w-auto text-sm" value={filterService}
                    onChange={e => { setFilterService(e.target.value); setPage(1); }}>
                    <option value="">Semua Layanan</option>
                    <option value="REGULER">Reguler</option>
                    <option value="SELF_DECLARE">Self Declare</option>
                </select>
            </div>

            {/* Invoice Table */}
            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Belum ada tagihan
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-white/50">
                            <tr className="text-left text-xs text-gray-500 uppercase">
                                <th className="p-4">ID</th>
                                <th className="p-4">Layanan</th>
                                <th className="p-4">Client</th>
                                <th className="p-4 text-right">Jumlah</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-white/30 transition">
                                    <td className="p-4 font-mono text-xs text-gray-600">#{inv.id}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            inv.service_type === 'REGULER'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {inv.service_type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-700">{inv.submission?.client?.business_name || '-'}</td>
                                    <td className="p-4 text-right font-semibold text-gray-800">{formatCurrency(inv.amount)}</td>
                                    <td className="p-4">
                                        {inv.status === 'PAID' ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" /> Lunas
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                                                <Clock className="w-3 h-3" /> Belum Lunas
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">{formatDate(inv.created_at)}</td>
                                    <td className="p-4">
                                        {inv.status === 'UNPAID' && (
                                            <button
                                                onClick={() => markPaid(inv.id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                                            >
                                                Tandai Lunas
                                            </button>
                                        )}
                                        {inv.status === 'PAID' && inv.paid_at && (
                                            <span className="text-xs text-gray-400">
                                                {formatDate(inv.paid_at)}
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
