import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, User, Check, Copy, Trash2, ChevronRight, 
    Clock, CheckCircle, CheckCircle2, FileText, LayoutGrid, XCircle, AlertCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import type { Submission } from '../../../../types';
import { formatServiceType } from '../../../../utils/format';
import type { SortKey, SortOrder } from '../../../../hooks/useSubmissionList';

const STATUS_CONFIG: Record<string, { color: string, icon: any }> = {
    DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
    VERVAL_PENDAMPING: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    QC_OFFICER: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    DRAFTER: { color: 'bg-purple-100 text-purple-700', icon: FileText },
    QC_REVIEW: { color: 'bg-indigo-100 text-indigo-700', icon: Eye },
    SIDANG_FATWA: { color: 'bg-violet-100 text-violet-700', icon: LayoutGrid },
    SH_TERBIT: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
    REVISION: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

function Eye(props: any) { return <EyeIcon {...props} /> } // Helper since Eye is imported but config uses it

interface SubmissionTableProps {
    data: { coordinator: string, submissions: Submission[] }[];
    isGrouped: boolean;
    loading: boolean;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onCopy: (e: React.MouseEvent, text: string, id: string) => void;
    onNavigate: (id: string) => void;
    sortKey: SortKey;
    sortOrder: SortOrder;
    handleSort: (key: SortKey) => void;
    expandedGroups: Record<string, boolean>;
    setExpandedGroups: (v: any) => void;
    copiedId: string | null;
    userRole?: string;
    userId?: string;
}

export const SubmissionTable = ({
    data,
    isGrouped,
    loading,
    onDelete,
    onCopy,
    onNavigate,
    sortKey,
    sortOrder,
    handleSort,
    expandedGroups,
    setExpandedGroups,
    copiedId,
    userRole,
    userId
}: SubmissionTableProps) => {
    if (loading) {
        return (
            <div className="glass-panel p-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
                <p className="mt-4 text-gray-500 font-medium">Memuat data pengajuan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {data.map((group) => (
                <div key={group.coordinator} className="space-y-4">
                    {isGrouped && (
                        <div
                            className="flex items-center gap-4 px-2 cursor-pointer group/header"
                            onClick={() => setExpandedGroups((prev: any) => ({ ...prev, [group.coordinator]: !prev[group.coordinator] }))}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-black group-hover/header:bg-brand-200 transition-colors">
                                {group.coordinator.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.coordinator}</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{group.submissions.length} Pengajuan</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-px w-24 sm:w-48 bg-gradient-to-r from-gray-200 to-transparent"></div>
                                <div className={`p-1.5 rounded-lg transition-colors ${expandedGroups[group.coordinator] ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedGroups[group.coordinator] ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {(expandedGroups[group.coordinator] || !isGrouped) && (
                            <motion.div
                                initial={isGrouped ? { height: 0, opacity: 0 } : false}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="glass-panel overflow-hidden border border-white/40 shadow-xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th onClick={() => handleSort('business_name')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors w-[30%]">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            Bisnis & Layanan <SortIcon currentKey="business_name" activeKey={sortKey} order={sortOrder} />
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('consultant')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            Konsultan <SortIcon currentKey="consultant" activeKey={sortKey} order={sortOrder} />
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('status')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            Status <SortIcon currentKey="status" activeKey={sortKey} order={sortOrder} />
                                                        </div>
                                                    </th>
                                                    <th className="p-4">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. Resi</div>
                                                    </th>
                                                    <th onClick={() => handleSort('created_at')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            Tgl Input <SortIcon currentKey="created_at" activeKey={sortKey} order={sortOrder} />
                                                        </div>
                                                    </th>
                                                    <th className="p-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {group.submissions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-12 text-center text-gray-400 italic text-sm">Tidak ada data</td>
                                                    </tr>
                                                ) : (
                                                    group.submissions.map((sub, idx) => (
                                                        <motion.tr
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.02 }}
                                                            key={sub.id}
                                                            className="group hover:bg-brand-50/30 transition-all cursor-pointer"
                                                            onClick={() => onNavigate(sub.id)}
                                                        >
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700 font-black text-sm group-hover:scale-110 transition-transform shadow-sm">
                                                                        {sub.client?.business_name?.charAt(0) || '?'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-gray-800 group-hover:text-brand-700 transition-colors">{sub.client?.business_name}</div>
                                                                        <div className="text-[10px] text-gray-500 font-medium">{sub.client?.client_name || 'Tanpa Nama Klien'}</div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${sub.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                                                }`}>
                                                                                {formatServiceType(sub.service_type)}
                                                                            </span>
                                                                            {sub.data_source === 'MARKETING' && (
                                                                                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                                                                                    Partner
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                        <User className="w-3 h-3" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-gray-700">{sub.client?.facilitator?.full_name}</div>
                                                                        <div className="text-[10px] text-gray-400 font-medium">Konsultan</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <StatusBadge status={sub.status} />
                                                            </td>
                                                            <td className="p-4">
                                                                {sub.tracking_number ? (
                                                                    <div 
                                                                        onClick={(e) => onCopy(e, sub.tracking_number || '', sub.id)}
                                                                        className="flex items-center gap-2 group/copy w-fit"
                                                                    >
                                                                        <div className="text-xs font-mono font-bold text-brand-600 uppercase tracking-tight group-hover/copy:text-brand-700 transition-colors">
                                                                            {sub.tracking_number}
                                                                        </div>
                                                                        <button
                                                                            className={`p-1 rounded-md transition-all ${copiedId === sub.id ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                                        >
                                                                            {copiedId === sub.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-gray-400">-</div>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-xs text-gray-600 font-medium">
                                                                    {new Date(sub.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400">
                                                                    {new Date(sub.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {(userRole === 'ADMIN' || userRole === 'DIRECTOR' || (sub.status === 'DRAFT' && sub.client?.facilitator_id === userId)) && (
                                                                        <button
                                                                            onClick={(e) => onDelete(e, sub.id)}
                                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                            title="Hapus Pengajuan"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white group-hover:bg-brand-600 group-hover:text-white text-gray-400 shadow-sm transition-all border border-gray-100">
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
};

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-600', icon: Clock };
    const Icon = config.icon;
    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${config.color} shadow-sm border border-black/5`}>
            <Icon className="w-3 h-3" />
            {status.replace(/_/g, ' ')}
        </div>
    );
}

function SortIcon({ currentKey, activeKey, order }: { currentKey: string, activeKey: string, order: 'asc' | 'desc' }) {
    if (currentKey !== activeKey) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return order === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600" /> : <ArrowDown className="w-3 h-3 text-brand-600" />;
}

function EyeIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
