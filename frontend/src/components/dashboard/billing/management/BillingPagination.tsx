import { ChevronRight } from 'lucide-react';

interface BillingPaginationProps {
    count: number;
    total: number;
    page: number;
    setPage: (p: number | ((prev: number) => number)) => void;
}

export const BillingPagination = ({ count, total, page, setPage }: BillingPaginationProps) => {
    return (
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Menampilkan {count} data
            </p>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-brand-600 disabled:opacity-30 transition-all"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * 20 >= total}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-brand-600 disabled:opacity-30 transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
