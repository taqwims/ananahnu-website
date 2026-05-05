import { useState, useEffect } from 'react';
import { Loader2, FileText, CheckCircle2, Clock, Filter } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah } from '../../utils/format';

interface Invoice {
    id: number;
    submission_id: string;
    payer_id: string;
    amount: number;
    status: string;
    service_type: string;
    created_at: string;
    paid_at?: string;
    payer?: {
        full_name: string;
    };
    submission?: {
        client?: {
            business_name: string;
        };
    };
}

export default function InvoiceList() {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [page, statusFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '20');
            if (statusFilter) params.set('status', statusFilter);
            
            const res = await api.get(`/billing/all-invoices?${params}`);
            setInvoices(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-600" />
                        Daftar Semua Tagihan
                    </h1>
                    <p className="text-gray-500 text-sm">Monitor seluruh tagihan sertifikasi koordinator dan klien.</p>
                </div>
            </div>

            <div className="glass-panel p-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select 
                        className="glass-input text-sm w-48"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">Semua Status</option>
                        <option value="UNPAID">Belum Bayar</option>
                        <option value="PAID">Lunas</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Detail Tagihan</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Pembayar (Payer)</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Nominal</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        Tidak ada data tagihan.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">
                                                {inv.submission?.client?.business_name || 'Manual Billing'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tight">
                                                ID: #{inv.id} | {inv.service_type}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                                                    {inv.payer?.full_name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-700">{inv.payer?.full_name || 'System'}</p>
                                                    <p className="text-[10px] text-gray-400">Coordinator / Payer</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-brand-600">
                                            {formatRupiah(inv.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                inv.status === 'PAID' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {inv.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {inv.status === 'PAID' ? 'Lunas' : 'Tertunda'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            <div>Dibuat: {new Date(inv.created_at).toLocaleDateString('id-ID')}</div>
                                            {inv.paid_at && (
                                                <div className="text-green-600 font-medium">Lunas: {new Date(inv.paid_at).toLocaleDateString('id-ID')}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && total > 20 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>Menampilkan {invoices.length} dari {total} data</span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sblmnya
                            </button>
                            <button 
                                disabled={page * 20 >= total}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Beriktnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
