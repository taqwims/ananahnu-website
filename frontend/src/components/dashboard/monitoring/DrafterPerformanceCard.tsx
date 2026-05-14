import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, ArrowUpRight } from 'lucide-react';
import { formatServiceType } from '../../../utils/format';
import type { Submission } from '../../../types';

const STATUS_PROGRESS: Record<string, { label: string, color: string, percent: number }> = {
    DRAFTER: { label: 'Pengerjaan Drafter', color: 'bg-purple-500', percent: 25 },
    QC_REVIEW: { label: 'Review QC', color: 'bg-blue-500', percent: 50 },
    SIDANG_FATWA: { label: 'Sidang Fatwa', color: 'bg-brand-500', percent: 75 },
    SH_TERBIT: { label: 'Selesai (SH Terbit)', color: 'bg-emerald-500', percent: 100 },
};

interface DrafterPerformanceCardProps {
    group: any;
    isExpanded: boolean;
    onToggle: () => void;
    onNavigateSubmission: (id: string) => void;
    index: number;
}

export const DrafterPerformanceCard = ({
    group,
    isExpanded,
    onToggle,
    onNavigateSubmission,
    index
}: DrafterPerformanceCardProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel p-6 border border-white/40 shadow-xl flex flex-col h-full hover:shadow-2xl hover:border-brand-100 transition-all group/card"
        >
            <div 
                className="flex items-center justify-between mb-2 cursor-pointer group/header"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover/card:scale-110 transition-transform">
                        <User className="w-7 h-7" />
                    </div>
                    <div>
                         <h3 className="text-xl font-black text-gray-800 tracking-tight">{group.drafterName}</h3>
                         <div className="flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.submissions.length} Pengajuan Aktif</p>
                         </div>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className="hidden sm:flex flex-col items-end px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                         <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Total SH Terbit</span>
                         <span className="text-sm font-black text-emerald-700 leading-none">{group.analytics.total_sh}</span>
                     </div>
                     <div className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                         <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                     </div>
                 </div>
             </div>

             <AnimatePresence initial={false}>
                 {isExpanded && (
                     <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                     >
                         <div className="pt-6 space-y-4">
                             <div className="grid grid-cols-3 gap-2 pb-4 border-b border-gray-50">
                                 <DrafterStat label="Reguler" value={group.analytics.reguler} color="text-blue-600" bg="bg-blue-50" />
                                 <DrafterStat label="SD Mandiri" value={group.analytics.sd_mandiri} color="text-purple-600" bg="bg-purple-50" />
                                 <DrafterStat label="SD Gratis" value={group.analytics.sd_gratis} color="text-emerald-600" bg="bg-emerald-50" />
                             </div>
                            {group.submissions.map((sub: Submission) => {
                                const progress = STATUS_PROGRESS[sub.status] || { label: sub.status, color: 'bg-gray-400', percent: 0 };
                                const isReguler = sub.service_type === 'REGULER';
                                return (
                                    <div key={sub.id} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all group/item relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-1 h-full ${isReguler ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${isReguler ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {formatServiceType(sub.service_type)}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-gray-400">#{sub.id.split('-')[0]}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 leading-tight pr-8">{sub.client?.business_name}</h4>
                                                <p className="text-[10px] text-gray-500 font-medium">{sub.client?.client_name || 'Tanpa Nama Klien'}</p>
                                            </div>
                                            <button 
                                                onClick={() => onNavigateSubmission(sub.id)}
                                                className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-gray-400">{progress.label}</span>
                                                <span className="text-brand-600">{progress.percent}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress.percent}%` }}
                                                    className={`h-full ${progress.color} rounded-full shadow-sm`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
             
             {!isExpanded && (
                 <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                     <div className="flex -space-x-3 overflow-hidden">
                         {group.submissions.slice(0, 4).map((s: Submission, i: number) => (
                             <div key={s.id} className={`inline-block h-8 w-8 rounded-full ring-4 ring-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${s.service_type === 'REGULER' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                 {i + 1}
                             </div>
                         ))}
                         {group.submissions.length > 4 && (
                             <div className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">
                                 +{group.submissions.length - 4}
                             </div>
                         )}
                     </div>
                     <button 
                         onClick={onToggle}
                         className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-colors"
                     >
                         Lihat List Pekerjaan
                     </button>
                 </div>
             )}
        </motion.div>
    );
};

function DrafterStat({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) {
    return (
        <div className={`p-2 rounded-xl ${bg} flex flex-col items-center justify-center border border-white/50`}>
            <span className={`text-[11px] font-black ${color}`}>{value}</span>
            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
    );
}
