import { Plus, Edit, Trash2, Calendar, FileText } from 'lucide-react';
import type { CertifiedProduct } from '../../../types';

interface ProductsListProps {
    products: CertifiedProduct[];
    onAdd: () => void;
    onEdit: (item: CertifiedProduct) => void;
    onDelete: (id: number) => void;
}

export const ProductsList = ({ products, onAdd, onEdit, onDelete }: ProductsListProps) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={onAdd} className="glass-button flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Produk
                </button>
            </div>
            {products.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Belum ada produk bersertifikat.</p>
            ) : (
                <div className="grid gap-4">
                    {products.map(p => (
                        <div key={p.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-start hover:border-brand-100 transition-all bg-white group">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                                <p className="text-sm font-medium text-gray-600">{p.company_name}</p>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">No: {p.certificate_number}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            Berlaku: {new Date(p.valid_until).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(p)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
