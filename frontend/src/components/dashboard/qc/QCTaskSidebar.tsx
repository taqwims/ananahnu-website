import { useState, useMemo } from 'react';
import { Search, ShieldCheck, Maximize2, Minimize2, Calendar, Clock } from 'lucide-react';
import type { Submission } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface QCTaskSidebarProps {
    submissions: Submission[];
    activeSubId: string | null;
    setActiveSubId: (id: string | null) => void;
    search: string;
    setSearch: (s: string) => void;
    isFocusMode: boolean;
    setIsFocusMode: (v: boolean) => void;
    title?: string;
    showAuditTabs?: boolean;
}

export const QCTaskSidebar = ({
    submissions,
    activeSubId,
    setActiveSubId,
    search,
    setSearch,
    isFocusMode,
    setIsFocusMode,
    title = 'Tugas QC',
    showAuditTabs = false
}: QCTaskSidebarProps) => {
    const [auditTab, setAuditTab] = useState<'pending' | 'scheduled'>('pending');

    const pendingCount = useMemo(() => {
        return submissions.filter(s => !s.audit_date).length;
    }, [submissions]);

    const scheduledCount = useMemo(() => {
        return submissions.filter(s => !!s.audit_date).length;
    }, [submissions]);

    const filteredList = useMemo(() => {
        if (!showAuditTabs) return submissions;
        return submissions.filter(s => {
            const hasDate = !!s.audit_date;
            return auditTab === 'scheduled' ? hasDate : !hasDate;
        });
    }, [submissions, showAuditTabs, auditTab]);

    return (
        <div className={`w-80 flex flex-col glass-panel p-0 overflow-hidden border-white/60 shadow-xl transition-all ${activeSubId ? 'hidden xl:flex' : 'flex w-full sm:w-80'}`}>
            <div className="p-4 border-b border-gray-100 space-y-4 bg-white/40">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-600" />
                    {title}
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari Bisnis..."
                        className="w-full pl-10 pr-4 py-2 bg-white/60 border-none rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {showAuditTabs && (
                    <div className="flex bg-gray-100/80 p-0.5 rounded-xl border border-gray-250/60 text-[10px] font-black uppercase tracking-wider">
                        <button
                            onClick={() => setAuditTab('pending')}
                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                                auditTab === 'pending'
                                    ? 'bg-white text-gray-800 shadow-sm font-black'
                                    : 'text-gray-400 hover:text-gray-800'
                            }`}
                        >
                            <Clock className="w-3 h-3 text-amber-500" />
                            Belum Audit ({pendingCount})
                        </button>
                        <button
                            onClick={() => setAuditTab('scheduled')}
                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                                auditTab === 'scheduled'
                                    ? 'bg-white text-gray-800 shadow-sm font-black'
                                    : 'text-gray-400 hover:text-gray-800'
                            }`}
                        >
                            <Calendar className="w-3 h-3 text-emerald-500" />
                            Terjadwal ({scheduledCount})
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${isFocusMode ? 'bg-brand-600 text-white shadow-lg' : 'bg-white/60 text-gray-500 hover:bg-white hover:text-brand-600 shadow-sm border border-white/80'}`}
                >
                    {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    {isFocusMode ? 'Normal View' : 'Focus Mode QC'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {filteredList.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic text-sm font-medium">
                        {showAuditTabs ? 'Tidak ada antrian audit' : 'Tidak ada antrian QC'}
                    </div>
                ) : (
                    filteredList.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setActiveSubId(sub.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all group ${activeSubId === sub.id
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]'
                                    : 'hover:bg-white/80 text-gray-700'
                                }`}
                        >
                            <div className="flex flex-wrap gap-1.5 items-start mb-1">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${activeSubId === sub.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'
                                    }`}>
                                    {formatServiceType(sub.service_type)}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                                    sub.status === 'SIDANG_FATWA' 
                                        ? (activeSubId === sub.id ? 'bg-amber-400/30 text-white' : 'bg-amber-100 text-amber-700')
                                        : sub.status === 'QC_OFFICER'
                                            ? (activeSubId === sub.id ? 'bg-purple-400/30 text-white' : 'bg-purple-100 text-purple-700')
                                            : (activeSubId === sub.id ? 'bg-blue-400/30 text-white' : 'bg-blue-100 text-blue-700')
                                }`}>
                                    {sub.status === 'SIDANG_FATWA' ? 'FATWA' : sub.status === 'QC_OFFICER' ? 'DISTRIBUSI' : 'REVIEW'}
                                </span>
                                <span className={`text-[8px] font-medium ml-auto ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-400'}`}>
                                    #{sub.id.split('-')[0]}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm truncate">{sub.client?.business_name}</h3>
                            <p className={`text-[10px] truncate ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-500'}`}>
                                {sub.client?.client_name}
                            </p>
                            {sub.audit_date && (
                                <p className={`text-[9px] font-bold mt-1 flex items-center gap-1 ${activeSubId === sub.id ? 'text-brand-100' : 'text-emerald-600'}`}>
                                    <Calendar className="w-3 h-3" />
                                    Jadwal: {new Date(sub.audit_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
