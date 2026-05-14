import { Search, Filter } from 'lucide-react';
import type { Role } from '../../../types';

interface UserFiltersProps {
    search: string;
    setSearch: (s: string) => void;
    roleFilter: string;
    setRoleFilter: (r: string) => void;
    roles: Role[];
    onResetPage: () => void;
}

export const UserFilters = ({
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    roles,
    onResetPage
}: UserFiltersProps) => {
    return (
        <div className="glass-panel p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    className="glass-input pl-9 w-full"
                    value={search}
                    onChange={e => { setSearch(e.target.value); onResetPage(); }}
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                    className="glass-input w-auto text-sm" 
                    value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); onResetPage(); }}
                >
                    <option value="">Semua Role</option>
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
