import { Link } from 'react-router-dom';
import { Users, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { Commission } from '../../../types';
import { useAuthStore } from '../../../store/authStore';

interface CommissionsTableProps {
    commissions: Commission[];
    isLoading: boolean;
}

export const CommissionsTable = ({
    commissions,
    isLoading
}: CommissionsTableProps) => {
    const currentUser = useAuthStore(state => state.user);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">Daftar Advisor & Komisi</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nama Advisor</th>
                            <th className="px-6 py-4">Submission / Pengajuan</th>
                            <th className="px-6 py-4">Detail Pengajuan</th>
                            <th className="px-6 py-4">Nominal</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    Memuat data...
                                </td>
                            </tr>
                        ) : commissions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Users className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-semibold">Belum ada komisi/insentif yang tercatat.</p>
                                    <p className="text-gray-400 text-xs mt-1">Insentif akan muncul setelah pembayaran pengajuan atau aktivitas selesai.</p>
                                </td>
                            </tr>
                        ) : (
                            commissions.map((c) => {
                                const advisorName = c.referred?.full_name || c.user?.full_name || (c.submission as any)?.user?.full_name || currentUser?.full_name || '-';
                                const advisorId = c.referred_id || c.user_id || (c.submission as any)?.user_id || currentUser?.id;
                                const subId = c.submission?.id || c.submission_id;

                                return (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{advisorName}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">#{advisorId ? advisorId.slice(0, 8) : 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800 truncate max-w-[180px]">
                                                    {c.submission?.client?.business_name || (subId ? 'Pengajuan Sertifikasi' : 'Registrasi Referral')}
                                                </span>
                                                {c.submission?.tracking_number && (
                                                    <span className="text-[10px] font-mono text-gray-400 mt-0.5">#{c.submission.tracking_number}</span>
                                                )}
                                                {c.submission?.service_type && (
                                                    <span className="text-[9px] text-brand-600 font-black uppercase tracking-wider mt-0.5">{c.submission.service_type}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {subId ? (
                                                <Link 
                                                    to={`/dashboard/submissions/${subId}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-200 rounded-xl text-xs font-bold transition-all shadow-sm group/btn"
                                                    title="Lihat Detail Pengajuan"
                                                >
                                                    <span>Buka Detail</span>
                                                    <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium italic">-</span>
                                            )}
                                        </td>
                                    <td className="px-6 py-4 font-black text-gray-900">{formatRupiah(c.amount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {c.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {c.status === 'PAID' ? 'Dibayar' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                        {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                            );
                        })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
