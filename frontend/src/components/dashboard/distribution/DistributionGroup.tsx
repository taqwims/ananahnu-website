import { CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatServiceType } from '../../../utils/format';
import type { Submission } from '../../../types';

interface DistributionGroupProps {
    group: any;
    selectedIDs: string[];
    onToggleSelection: (id: string) => void;
    onToggleGroup: (ids: string[], isAllSelected: boolean) => void;
    index: number;
}

export const DistributionGroup = ({
    group,
    selectedIDs,
    onToggleSelection,
    onToggleGroup,
    index
}: DistributionGroupProps) => {
    const isAllSelected = group.submissions.every((s: Submission) => selectedIDs.includes(s.id));

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-4"
        >
            <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-black shrink-0">
                    {group.coordinator.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="text-lg font-black text-gray-800 tracking-tight truncate">{group.coordinator}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{group.submissions.length} Pengajuan</p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:block">Pilih Semua</span>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={isAllSelected}
                        onChange={() => onToggleGroup(group.submissions.map((s: any) => s.id), isAllSelected)}
                    />
                </div>
            </div>

            <div className="hidden md:block glass-panel overflow-hidden border border-white/40 shadow-lg">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Bisnis & Klien</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Konsultan</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelengkapan Data</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {group.submissions.map((sub: Submission) => (
                            <tr key={sub.id} className={`group hover:bg-brand-50/30 transition-all ${selectedIDs.includes(sub.id) ? 'bg-brand-50/50' : ''}`}>
                                <td className="p-4 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                        checked={selectedIDs.includes(sub.id)}
                                        onChange={() => onToggleSelection(sub.id)}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800 group-hover:text-brand-700 transition-colors">{sub.client?.business_name}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">{sub.client?.client_name || 'Tanpa Nama Klien'}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                            sub.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {formatServiceType(sub.service_type)}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {sub.client?.facilitator?.full_name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-700 truncate">{sub.client?.facilitator?.full_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {sub.client?.nib && !sub.client.nib.startsWith('DRAFT-') ? (
                                        <div className="flex items-center gap-1.5 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-xs font-bold">NIB Valid</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-amber-500">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-bold italic">NIB Pending</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="text-xs text-gray-600 font-medium">
                                        {new Date(sub.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <a 
                                        href={`/dashboard/submissions/${sub.id}`} 
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-black text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Review <ChevronRight className="w-3 h-3" />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid md:hidden grid-cols-1 gap-4">
                {group.submissions.map((sub: Submission) => (
                    <div 
                        key={sub.id} 
                        className={`glass-panel p-4 border border-white/40 shadow-md relative transition-all ${selectedIDs.includes(sub.id) ? 'bg-brand-50/50 border-brand-200' : ''}`}
                        onClick={() => onToggleSelection(sub.id)}
                    >
                        <div className="absolute top-4 right-4">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                                checked={selectedIDs.includes(sub.id)}
                                readOnly
                            />
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="font-bold text-gray-800 leading-tight pr-8">{sub.client?.business_name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{sub.client?.client_name}</div>
                                <div className="mt-2">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                        sub.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                        {formatServiceType(sub.service_type)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {sub.client?.facilitator?.full_name?.charAt(0)}
                                    </div>
                                    <span className="text-[11px] font-medium text-gray-600">{sub.client?.facilitator?.full_name}</span>
                                </div>
                                <a 
                                    href={`/dashboard/submissions/${sub.id}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-black text-brand-600 flex items-center gap-1"
                                >
                                    Detail <ChevronRight className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
