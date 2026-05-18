import { Briefcase, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { Commission } from '../../../types';

interface StructuralCommissionsTableProps {
    commissions: Commission[];
    isLoading: boolean;
}

export const StructuralCommissionsTable = ({
    commissions,
    isLoading
}: StructuralCommissionsTableProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900">Riwayat Insentif Struktural</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Periode</th>
                            <th className="px-6 py-4">Omset Dasar</th>
                            <th className="px-6 py-4">Nominal Insentif</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Update Terakhir</th>
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
                                        <Briefcase className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Belum ada insentif struktural yang tercatat.</p>
                                </td>
                            </tr>
                        ) : (
                            commissions.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-gray-900">{c.period}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {formatRupiah(c.base_omset || 0)}
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
                                        {new Date(c.updated_at || c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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
