import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import type { Payment } from '../../../../types';
import { formatRupiah } from '../../../../utils/format';
import toast from 'react-hot-toast';

interface PaymentTableProps {
    payments: Payment[];
    onVerify: (id: number, approved: boolean) => Promise<void>;
    onSync: (id: number) => Promise<void>;
    verifying: number | null;
}

export const PaymentTable = ({ payments, onVerify, onSync, verifying }: PaymentTableProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const getFullProofUrl = (url: string) => {
        return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${url}`;
    };

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
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Tombol Lihat Bukti Transfer jika ada (Tampil SEBELUM atau sesudah persetujuan) */}
                                        {p.proof_url && (
                                            <button 
                                                onClick={() => setPreviewUrl(getFullProofUrl(p.proof_url!))}
                                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-blue-200/60 shadow-2xs"
                                                title="Pratinjau Bukti Transfer Manual"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Bukti Transfer</span>
                                            </button>
                                        )}

                                        {p.status === 'PENDING' && p.method === 'MANUAL' ? (
                                            <>
                                                <button 
                                                    onClick={() => onVerify(p.id, true)}
                                                    disabled={verifying === p.id}
                                                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-xs flex items-center gap-1"
                                                >
                                                    {verifying === p.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                                    <span>Setujui</span>
                                                </button>
                                                <button 
                                                    onClick={() => onVerify(p.id, false)}
                                                    disabled={verifying === p.id}
                                                    className="px-3.5 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50 border border-red-200/60"
                                                >
                                                    Tolak
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {p.snap_url && (
                                                    <a href={p.snap_url} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                        title="Link Pembayaran Snap"
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
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Modal Pratinjau Bukti Transfer */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-brand-600" /> Pratinjau Bukti Transfer Manual
                            </h3>
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-900/5 min-h-[300px]">
                            {previewUrl.match(/\.(pdf)$/i) ? (
                                <iframe src={previewUrl} className="w-full h-[500px] rounded-xl border border-gray-200" title="Bukti PDF" />
                            ) : (
                                <img 
                                    src={previewUrl} 
                                    alt="Bukti Transfer" 
                                    className="max-h-[60vh] w-auto object-contain rounded-xl shadow-md border border-gray-200" 
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                        toast.error("Gagal memuat gambar bukti transfer");
                                    }}
                                />
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                            >
                                Buka di Tab Baru <ExternalLink className="w-3 h-3" />
                            </a>
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className="px-5 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
