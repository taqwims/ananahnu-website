import { Plus, Building2, Trash2, ChevronRight } from 'lucide-react';
import type { Regency } from '../../../types';

interface RegencyListProps {
    regencies: Regency[];
    onSelect: (r: Regency) => void;
    onDelete: (id: number) => void;
    showAdd: boolean;
    setShowAdd: (v: boolean) => void;
    newName: string;
    setNewName: (v: string) => void;
    onAdd: () => void;
}

export const RegencyList = ({
    regencies,
    onSelect,
    onDelete,
    showAdd,
    setShowAdd,
    newName,
    setNewName,
    onAdd
}: RegencyListProps) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Kabupaten/Kota</h2>
                <button onClick={() => { setShowAdd(true); setNewName(''); }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Tambah Kabupaten
                </button>
            </div>

            {showAdd && (
                <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-brand-100 shadow-sm animate-in zoom-in-95">
                    <input className="flex-1 bg-transparent text-sm outline-none px-2" autoFocus placeholder="Masukkan nama kabupaten/kota baru..." value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onAdd()} />
                    <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                    <button onClick={onAdd} className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition-colors">Simpan</button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2">
                {regencies.length === 0 && !showAdd && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Belum ada data kabupaten di provinsi ini.</p>
                    </div>
                )}
                {regencies.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-white hover:bg-brand-50/50 border border-gray-100 hover:border-brand-200 rounded-xl cursor-pointer group transition-all shadow-sm hover:shadow"
                        onClick={() => onSelect(r)}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                                <Building2 className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-brand-700 transition-colors">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={e => { e.stopPropagation(); onDelete(r.id); }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
