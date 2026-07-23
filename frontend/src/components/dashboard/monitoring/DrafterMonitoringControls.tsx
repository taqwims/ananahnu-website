import { Search, Calendar } from 'lucide-react';
import type { TabType, ServiceFilter } from '../../../hooks/useDrafterMonitoring';
import { MONTH_OPTIONS } from '../../../hooks/useDrafterMonitoring';

interface DrafterMonitoringControlsProps {
    activeTab: TabType;
    setActiveTab: (v: TabType) => void;
    stats: { ongoing: number, completed: number };
    search: string;
    setSearch: (v: string) => void;
    serviceFilter: ServiceFilter;
    setServiceFilter: (v: ServiceFilter) => void;
    selectedMonth: string;
    setSelectedMonth: (v: string) => void;
    selectedYear: string;
    setSelectedYear: (v: string) => void;
}

export const DrafterMonitoringControls = ({
    activeTab,
    setActiveTab,
    stats,
    search,
    setSearch,
    serviceFilter,
    setServiceFilter,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
}: DrafterMonitoringControlsProps) => {
    const years = ['ALL', '2024', '2025', '2026', '2027'];

    return (
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
            <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full sm:w-fit shrink-0">
                <TabButton active={activeTab === 'ongoing'} label="Sedang Berjalan" count={stats.ongoing} onClick={() => setActiveTab('ongoing')} />
                <TabButton active={activeTab === 'completed'} label="Telah Selesai" count={stats.completed} onClick={() => setActiveTab('completed')} />
            </div>

            <div className="flex flex-col md:flex-row gap-3 flex-1 flex-wrap">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Cari Drafter atau Nama Bisnis..."
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Month & Year Filter */}
                <div className="flex items-center gap-2 bg-white border border-gray-100 p-1 rounded-2xl shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 py-1.5 px-2 outline-none cursor-pointer"
                    >
                        {MONTH_OPTIONS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 py-1.5 px-2 outline-none cursor-pointer border-l border-gray-100"
                    >
                        <option value="ALL">Semua Tahun</option>
                        {years.filter(y => y !== 'ALL').map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Service Type Filter */}
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
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                active ? 'bg-gray-100 text-brand-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
            {label}
        </button>
    );
}
