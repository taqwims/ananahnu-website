import { Users, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { ReferralCommission } from '../../../types';

interface ReferralCommissionsTableProps {
    commissions: ReferralCommission[];
    isLoading: boolean;
}

export const ReferralCommissionsTable = ({
    commissions,
    isLoading
}: ReferralCommissionsTableProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">Daftar Konsultan Tereferensikan</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nama Konsultan</th>
                            <th className="px-6 py-4">Submission</th>
                            <th className="px-6 py-4">Nominal</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    Memuat data...
                                </td>
                            </tr>
                        ) : commissions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Users className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Belum ada insentif referal yang tercatat.</p>
                                    <p className="text-gray-400 text-xs mt-1">Insentif akan muncul setelah konsultan referensi Anda menyelesaikan pembayaran tagihan.</p>
                                </td>
                            </tr>
                        ) : (
                            commissions.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">{c.referred?.full_name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">#{c.referred_id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600 font-medium">{c.submission?.client?.business_name || 'Submission'}</span>
                                            <span className="text-[10px] text-brand-600 font-bold uppercase">{c.submission?.service_type}</span>
                                        </div>
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
