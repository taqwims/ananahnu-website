import { FileText, Search, Maximize2, Minimize2 } from 'lucide-react';
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
    return (
        <div className={`w-80 flex flex-col glass-panel p-0 overflow-hidden border-white/60 shadow-xl transition-all ${activeSubId ? 'hidden xl:flex' : 'flex w-full sm:w-80'}`}>
            <div className="p-4 border-b border-gray-100 space-y-4 bg-white/40">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-600" />
                    Tugas Saya
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
                <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${isFocusMode ? 'bg-brand-600 text-white shadow-lg' : 'bg-white/60 text-gray-500 hover:bg-white hover:text-brand-600 shadow-sm border border-white/80'}`}
                >
                    {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    {isFocusMode ? 'Normal View' : 'Focus Mode'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {submissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic text-sm">
                        Tidak ada tugas pengerjaan
                    </div>
                ) : (
                    submissions.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setActiveSubId(sub.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all group ${activeSubId === sub.id
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]'
                                    : 'hover:bg-white/80 text-gray-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${activeSubId === sub.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'
                                    }`}>
                                    {formatServiceType(sub.service_type)}
                                </span>
                                <span className={`text-[8px] font-medium ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-400'}`}>
                                    #{sub.id.split('-')[0]}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm truncate">{sub.client?.business_name}</h3>
                            <p className={`text-[10px] truncate ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-500'}`}>
                                {sub.client?.client_name}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
