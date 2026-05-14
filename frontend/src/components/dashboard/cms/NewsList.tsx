import { Plus, Edit, Trash2 } from 'lucide-react';
import type { News } from '../../../types';

interface NewsListProps {
    news: News[];
    onAdd: () => void;
    onEdit: (item: News) => void;
    onDelete: (id: number) => void;
}

export const NewsList = ({ news, onAdd, onEdit, onDelete }: NewsListProps) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={onAdd} className="glass-button flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Berita
                </button>
            </div>
            {news.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Belum ada berita.</p>
            ) : (
                <div className="grid gap-4">
                    {news.map(n => (
                        <div key={n.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-start hover:border-brand-100 transition-colors bg-white">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800">{n.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{n.content}</p>
                                <div className="flex gap-2 mt-2">
                                    {n.tags && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">{n.tags}</span>}
                                    <span className="text-[10px] text-gray-400 font-mono">{n.slug}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 ml-4 shrink-0">
                                <button onClick={() => onEdit(n)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(n.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
