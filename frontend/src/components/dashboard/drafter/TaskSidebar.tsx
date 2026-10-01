import { useState, useMemo } from 'react';
import { FileText, Search, Maximize2, Minimize2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Submission } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface TaskSidebarProps {
    submissions: Submission[];
    activeSubId: string | null;
    setActiveSubId: (id: string | null) => void;
    search: string;
    setSearch: (s: string) => void;
    isFocusMode: boolean;
    setIsFocusMode: (v: boolean) => void;
}

export const TaskSidebar = ({
    submissions,
    activeSubId,
    setActiveSubId,
    search,
    setSearch,
    isFocusMode,
    setIsFocusMode
}: TaskSidebarProps) => {
    const [filterTab, setFilterTab] = useState<'ALL' | 'AUDIT' | 'REVISION'>('ALL');

    const auditCount = useMemo(() => {
        return submissions.filter(s => s.service_type === 'REGULER' && (!s.audit_result_1_url || s.audit_date)).length;
    }, [submissions]);

    const revisionCount = useMemo(() => {
        return submissions.filter(s => s.has_been_returned || s.reject_note).length;
    }, [submissions]);

    const displayedSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            if (filterTab === 'AUDIT') {
                return sub.service_type === 'REGULER' && (!sub.audit_result_1_url || sub.audit_date);
            }
            if (filterTab === 'REVISION') {
                return sub.has_been_returned || sub.reject_note;
            }
            return true;
        });
    }, [submissions, filterTab]);

    return (
        <div className={`w-80 flex flex-col glass-panel p-0 overflow-hidden border-white/60 shadow-xl transition-all ${activeSubId ? 'hidden xl:flex' : 'flex w-full sm:w-80'}`}>
            <div className="p-4 border-b border-gray-100 space-y-3 bg-white/50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        Tugas Drafting
                    </h2>
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-black rounded-lg border border-brand-100">
                        {submissions.length} Total
                    </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl text-[10px] font-bold">
                    <button
                        onClick={() => setFilterTab('ALL')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                            filterTab === 'ALL'
                                ? 'bg-white text-gray-900 shadow-xs font-black'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Semua ({submissions.length})
                    </button>
                    <button
                        onClick={() => setFilterTab('AUDIT')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                            filterTab === 'AUDIT'
                                ? 'bg-amber-500 text-white shadow-xs font-black'
                                : 'text-amber-700 hover:bg-amber-100/50'
                        }`}
                    >
                        Hasil Audit ({auditCount})
                    </button>
                    <button
                        onClick={() => setFilterTab('REVISION')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                            filterTab === 'REVISION'
                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                : 'text-rose-600 hover:bg-rose-100/50'
                        }`}
                    >
                        Revisi ({revisionCount})
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari bisnis atau pemilik..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200/80 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${isFocusMode ? 'bg-brand-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:text-brand-600 border border-gray-200/70'}`}
                >
                    {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    {isFocusMode ? 'Normal View' : 'Focus Mode'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {displayedSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic text-xs space-y-1">
                        <p className="font-bold">Tidak ada tugas pada filter ini</p>
                        <p className="text-[10px]">Silakan periksa tab lainnya.</p>
                    </div>
                ) : (
                    displayedSubmissions.map(sub => {
                        const isReguler = sub.service_type === 'REGULER';
                        const isAuditDone = isReguler && Boolean(sub.audit_result_1_url);
                        const needsAuditResult = isReguler && Boolean(sub.audit_date) && !sub.audit_result_1_url;

                        return (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSubId(sub.id)}
                                className={`w-full text-left p-3 rounded-2xl transition-all border ${activeSubId === sub.id
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-200/50 border-brand-600 scale-[1.01]'
                                        : 'bg-white/80 hover:bg-white text-gray-700 border-gray-100 hover:border-brand-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1.5 gap-1">
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                        activeSubId === sub.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700 border border-brand-100'
                                    }`}>
                                        {formatServiceType(sub.service_type)}
                                    </span>
                                    
                                    {sub.has_been_returned || sub.reject_note ? (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                                            <AlertCircle className="w-2.5 h-2.5" /> REVISI
                                        </span>
                                    ) : needsAuditResult ? (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 animate-pulse">
                                            ⚠️ BUTUH HASIL
                                        </span>
                                    ) : isAuditDone ? (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> HASIL SIAP
                                        </span>
                                    ) : (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                            BARU
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-xs truncate text-gray-900 group-hover:text-brand-600">
                                    {sub.client?.business_name || 'Tanpa Nama Usaha'}
                                </h3>
                                <p className={`text-[10px] truncate ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-500'}`}>
                                    {sub.client?.client_name || '-'}
                                </p>

                                {isReguler && sub.audit_date && (
                                    <div className={`mt-2 pt-2 border-t flex items-center gap-1.5 text-[9px] font-bold ${
                                        activeSubId === sub.id ? 'border-white/20 text-brand-100' : 'border-gray-100 text-amber-700'
                                    }`}>
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        <span>Audit: {new Date(sub.audit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        {sub.lph_name && <span className="opacity-75">• {sub.lph_name}</span>}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};
