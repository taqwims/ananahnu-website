import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Affiliate } from '../../../types';

interface AffiliatesListProps {
    affiliates: Affiliate[];
    onAdd: () => void;
    onEdit: (item: Affiliate) => void;
    onDelete: (id: number) => void;
}

export const AffiliatesList = ({ affiliates, onAdd, onEdit, onDelete }: AffiliatesListProps) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={onAdd} className="glass-button flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Affiliate
                </button>
            </div>
            {affiliates.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Belum ada affiliate.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {affiliates.map(a => (
                        <div key={a.id} className="p-4 border border-gray-100 rounded-xl bg-white hover:border-brand-100 transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center p-2 shrink-0 border border-gray-100">
                                    {a.logo_url ? (
                                        <img src={a.logo_url} alt={a.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-gray-300 font-bold text-xl uppercase">{a.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 truncate">{a.name}</h3>
                                    {a.website_url && (
                                        <a 
                                            href={a.website_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[10px] text-brand-600 font-bold hover:underline truncate block uppercase tracking-wider"
                                        >
                                            Kunjungi Situs
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(a)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
