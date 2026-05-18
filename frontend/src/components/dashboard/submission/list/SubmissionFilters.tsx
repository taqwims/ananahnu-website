import { Search, Filter, LayoutGrid } from 'lucide-react';

interface SubmissionFiltersProps {
    search: string;
    setSearch: (s: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    isGrouped: boolean;
    setIsGrouped: (v: boolean) => void;
    statusOrder: string[];
}

export const SubmissionFilters = ({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isGrouped,
    setIsGrouped,
    statusOrder
}: SubmissionFiltersProps) => {
    return (
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between shadow-lg border border-white/40">
            <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari Bisnis, Nama Klien, Advisor..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/50 rounded-xl border border-gray-100">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        {statusOrder.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setIsGrouped(!isGrouped)}
                    className={`p-2.5 rounded-xl border transition-all ${isGrouped ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-brand-300'}`}
                    title={isGrouped ? "Nonaktifkan Pengelompokan" : "Aktifkan Pengelompokan"}
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
