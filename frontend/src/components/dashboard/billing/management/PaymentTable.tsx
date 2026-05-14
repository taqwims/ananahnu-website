import { CheckCircle, XCircle, Clock, Eye, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import type { Payment } from '../../../../types';
import { formatRupiah } from '../../../../utils/format';

interface PaymentTableProps {
    payments: Payment[];
    onVerify: (id: number, approved: boolean) => Promise<void>;
    onSync: (id: number) => Promise<void>;
    verifying: number | null;
}

export const PaymentTable = ({ payments, onVerify, onSync, verifying }: PaymentTableProps) => {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Utama</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode & Payer</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Jumlah</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Verifikasi</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {payments.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data transaksi ditemukan</td></tr>
                    ) : (
                        payments.map(p => (
                            <tr key={p.id} className="hover:bg-brand-50/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-800">
                                            {p.invoices?.[0]?.submission?.client?.business_name || 'Pembayaran Sistem'}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono text-gray-400">#{p.id}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{formatDate(p.created_at)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                            p.method === 'MIDTRANS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {p.method}
                                        </span>
                                        <span className="text-xs text-gray-600 font-medium">{p.invoices?.[0]?.payer?.full_name || 'UMKM'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-brand-600">{formatRupiah(p.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                                        p.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {p.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : 
                                         p.status === 'FAILED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {p.status === 'PENDING' && p.method === 'MANUAL' ? (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => onVerify(p.id, true)}
                                                disabled={verifying === p.id}
                                                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Setujui
                                            </button>
                                            <button 
                                                onClick={() => onVerify(p.id, false)}
                                                disabled={verifying === p.id}
                                                className="px-4 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-3">
                                            {p.proof_url && (
                                                <a href={p.proof_url.startsWith('http') ? p.proof_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${p.proof_url}`} 
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-brand-600 hover:text-white transition-all group/btn"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            )}
                                            {p.snap_url && (
                                                <a href={p.snap_url} target="_blank" rel="noopener noreferrer"
                                                    className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            {p.method === 'MIDTRANS' && p.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => onSync(p.id)}
                                                    disabled={verifying === p.id}
                                                    className="p-2 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                                                    title="Sinkronisasi Status Midtrans"
                                                >
                                                    {verifying === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
