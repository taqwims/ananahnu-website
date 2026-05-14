import { Search, Loader2, UserPlus } from 'lucide-react';
import type { User } from '../../../types';

interface DistributionControlsProps {
    search: string;
    setSearch: (v: string) => void;
    selectedIDs: string[];
    selectedDrafter: string;
    setSelectedDrafter: (v: string) => void;
    drafters: User[];
    onAssign: () => void;
    assigning: boolean;
}

export const DistributionControls = ({
    search,
    setSearch,
    selectedIDs,
    selectedDrafter,
    setSelectedDrafter,
    drafters,
    onAssign,
    assigning
}: DistributionControlsProps) => {
    return (
        <div className="sticky top-4 z-30 glass-panel p-3 sm:p-4 shadow-xl border border-white/40 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="Cari Bisnis, Klien, Konsultan..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 sm:flex-none text-left sm:text-right px-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Drafter</p>
                    <p className="text-xs text-gray-500">{selectedIDs.length} data terpilih</p>
                </div>
                <select 
                    className="glass-input py-2.5 text-sm w-full sm:w-56 border-brand-100"
                    value={selectedDrafter}
                    onChange={e => setSelectedDrafter(e.target.value)}
                >
                    <option value="">-- Pilih Drafter --</option>
                    {drafters.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                </select>
                <button
                    onClick={onAssign}
                    disabled={assigning || selectedIDs.length === 0 || !selectedDrafter}
                    className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Ditribusikan
                </button>
            </div>
        </div>
    );
};
