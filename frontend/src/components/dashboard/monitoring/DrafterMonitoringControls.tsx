import { Search } from 'lucide-react';
import type { TabType, ServiceFilter } from '../../../hooks/useDrafterMonitoring';

interface DrafterMonitoringControlsProps {
    activeTab: TabType;
    setActiveTab: (v: TabType) => void;
    stats: { ongoing: number, completed: number };
    search: string;
    setSearch: (v: string) => void;
    serviceFilter: ServiceFilter;
    setServiceFilter: (v: ServiceFilter) => void;
}

export const DrafterMonitoringControls = ({
    activeTab,
    setActiveTab,
    stats,
    search,
    setSearch,
    serviceFilter,
    setServiceFilter
}: DrafterMonitoringControlsProps) => {
    return (
        <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
            <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full sm:w-fit">
                <TabButton active={activeTab === 'ongoing'} label="Sedang Berjalan" count={stats.ongoing} onClick={() => setActiveTab('ongoing')} />
                <TabButton active={activeTab === 'completed'} label="Telah Selesai" count={stats.completed} onClick={() => setActiveTab('completed')} />
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Cari Drafter atau Nama Bisnis..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <FilterButton active={serviceFilter === 'ALL'} label="Semua" onClick={() => setServiceFilter('ALL')} />
                    <FilterButton active={serviceFilter === 'REGULER'} label="Reguler" onClick={() => setServiceFilter('REGULER')} />
                    <FilterButton active={serviceFilter === 'SELF_DECLARE'} label="Self Declare" onClick={() => setServiceFilter('SELF_DECLARE')} />
                </div>
            </div>
        </div>
    );
};

function TabButton({ active, label, count, onClick }: { active: boolean, label: string, count: number, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                active ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            {label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {count}
            </span>
        </button>
    );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                active ? 'bg-gray-100 text-brand-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
            {label}
        </button>
    );
}
