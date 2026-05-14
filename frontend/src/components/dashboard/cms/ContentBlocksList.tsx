import { Edit } from 'lucide-react';
import type { ContentBlock } from '../../../types';

interface ContentBlocksListProps {
    blocks: ContentBlock[];
    onEdit: (item: ContentBlock) => void;
}

export const ContentBlocksList = ({ blocks, onEdit }: ContentBlocksListProps) => {
    return (
        <div className="grid gap-4">
            {blocks.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Belum ada content blocks.</p>
            ) : (
                blocks.map(b => (
                    <div key={b.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center hover:bg-gray-50 bg-white transition-colors">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-black text-brand-600 font-mono uppercase tracking-widest">{b.section_key}</h3>
                            <p className="text-sm font-bold text-gray-800 mt-1">{b.title || '(No title)'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md mt-0.5">{b.body || '(Empty content)'}</p>
                        </div>
                        <button onClick={() => onEdit(b)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg shrink-0 transition-colors">
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};
