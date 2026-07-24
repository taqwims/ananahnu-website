import { Search, Filter, LayoutGrid } from 'lucide-react';

interface SubmissionFiltersProps {
    search: string;
    setSearch: (s: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    serviceTypeFilter?: string;
    setServiceTypeFilter?: (s: string) => void;
    businessTypeFilter?: string;
    setBusinessTypeFilter?: (s: string) => void;
    isGrouped: boolean;
    setIsGrouped: (v: boolean) => void;
    statusOrder: string[];
}

export const SubmissionFilters = ({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    serviceTypeFilter = '',
    setServiceTypeFilter,
    businessTypeFilter = '',
    setBusinessTypeFilter,
    isGrouped,
    setIsGrouped,
    statusOrder
}: SubmissionFiltersProps) => {
    return (
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between shadow-lg border border-white/40">
            <div className="flex-1 min-w-[240px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari Bisnis, Klien, Tracking..."
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-medium"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter Layanan */}
                {setServiceTypeFilter && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-gray-100 shadow-2xs">
                        <Filter className="w-3.5 h-3.5 text-brand-600" />
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none"
                            value={serviceTypeFilter}
                            onChange={(e) => setServiceTypeFilter(e.target.value)}
                        >
                            <option value="">Semua Layanan</option>
                            <option value="SELF_DECLARE">Self Declare</option>
                            <option value="REGULER">Reguler</option>
                        </select>
                    </div>
                )}

                {/* Filter Skala Usaha */}
                {setBusinessTypeFilter && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-gray-100 shadow-2xs">
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none"
                            value={businessTypeFilter}
                            onChange={(e) => setBusinessTypeFilter(e.target.value)}
                        >
                            <option value="">Semua Skala Usaha</option>
                            <option value="MIKRO">Mikro</option>
                            <option value="KECIL">Kecil</option>
                            <option value="MENENGAH">Menengah</option>
                            <option value="BESAR">Besar</option>
                        </select>
                    </div>
                )}

                {/* Filter Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-gray-100 shadow-2xs">
                    <select
                        className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none"
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
                    <LayoutGrid className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
