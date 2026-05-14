import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { ReferralCommission } from '../../../hooks/useReferralFeeAdmin';

interface CommissionTableProps {
    commissions: ReferralCommission[];
    loading: boolean;
    statusFilter: string;
    onStatusChange: (v: string) => void;
    onMarkAsPaid: (id: string) => void;
}

export const CommissionTable = ({
    commissions,
    loading,
    statusFilter,
    onStatusChange,
    onMarkAsPaid
}: CommissionTableProps) => {
    return (
        <div className="glass-panel overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/20">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/50">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">Daftar Komisi Referral</h3>
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1">Audit Trail Pembayaran Komisi</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Filter Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                    >
                        <option value="">Semua Status</option>
                        <option value="PENDING">Pending (Belum Bayar)</option>
                        <option value="PAID">Paid (Sudah Bayar)</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Referrer (Penerima)</th>
                            <th className="px-8 py-5">Referral (User Baru)</th>
                            <th className="px-8 py-5">Submission / Tracking</th>
                            <th className="px-8 py-5">Besar Komisi</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-8 py-6 h-20 bg-gray-50/10"></td>
                                </tr>
                            ))
                        ) : commissions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-gray-50 rounded-full">
                                            <AlertCircle className="w-10 h-10 opacity-20" />
                                        </div>
                                        <p className="font-bold text-sm">Data komisi referral tidak ditemukan</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            commissions.map((comm) => (
                                <tr key={comm.id} className="hover:bg-brand-50/20 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                {comm.referrer?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">{comm.referrer?.full_name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{comm.referrer?.email}</p>
                                                <p className="text-[10px] text-brand-600 font-black mt-0.5">{comm.referrer?.phone || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-gray-800 font-bold">{comm.referred?.full_name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{comm.referred?.email}</p>
                                        <p className="text-[10px] text-brand-600 font-black mt-0.5">{comm.referred?.phone || '-'}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black font-mono bg-gray-100 text-gray-500 px-3 py-1 rounded-lg self-start mb-2 tracking-widest group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                                                {comm.submission?.tracking_number}
                                            </span>
                                            <span className="text-xs text-gray-600 font-bold truncate max-w-[180px]">
                                                {comm.submission?.client?.business_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-brand-600 tracking-tight">{formatRupiah(comm.amount)}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">Tgl: {new Date(comm.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {comm.status === 'PAID' ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
                                                </span>
                                                {comm.paid_at && (
                                                    <span className="text-[9px] text-emerald-600 font-bold italic ml-1">Paid on {new Date(comm.paid_at).toLocaleDateString('id-ID')}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">
                                                <Clock className="w-3.5 h-3.5" /> PENDING
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {comm.status === 'PENDING' && (
                                            <button
                                                onClick={() => onMarkAsPaid(comm.id)}
                                                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                Bayar Komisi
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
    );
};
