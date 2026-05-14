import { Plus, Navigation, Trash2 } from 'lucide-react';
import type { District } from '../../../types';

interface DistrictListProps {
    districts: District[];
    onDelete: (id: number) => void;
    showAdd: boolean;
    setShowAdd: (v: boolean) => void;
    newName: string;
    setNewName: (v: string) => void;
    onAdd: () => void;
}

export const DistrictList = ({
    districts,
    onDelete,
    showAdd,
    setShowAdd,
    newName,
    setNewName,
    onAdd
}: DistrictListProps) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Kecamatan</h2>
                <button onClick={() => { setShowAdd(true); setNewName(''); }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Tambah Kecamatan
                </button>
            </div>

            {showAdd && (
                <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-brand-100 shadow-sm animate-in zoom-in-95">
                    <input className="flex-1 bg-transparent text-sm outline-none px-2" autoFocus placeholder="Masukkan nama kecamatan baru..." value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onAdd()} />
                    <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                    <button onClick={onAdd} className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition-colors">Simpan</button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2">
                {districts.length === 0 && !showAdd && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <Navigation className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Belum ada data kecamatan.</p>
                    </div>
                )}
                {districts.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl group hover:border-gray-200 transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                <Navigation className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="font-medium text-gray-700">{d.name}</span>
                        </div>
                        <button onClick={() => onDelete(d.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
