import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OperationalPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export function OperationalPagination({
    currentPage,
    totalPages,
    totalItems,
    perPage,
    onPageChange,
    onPerPageChange
}: OperationalPaginationProps) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-3">
                <span>
                    Menampilkan <strong className="text-gray-800">{startItem}</strong> - <strong className="text-gray-800">{endItem}</strong> dari <strong className="text-gray-800">{totalItems}</strong> data
                </span>
                {onPerPageChange && (
                    <select
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        className="p-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium"
                    >
                        <option value={10}>10 / hal</option>
                        <option value={25}>25 / hal</option>
                        <option value={50}>50 / hal</option>
                    </select>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman Sebelumnya"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                        <button
                            key={idx}
                            onClick={() => onPageChange(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                                currentPage === page
                                    ? 'bg-brand-700 text-white shadow-sm'
                                    : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200'
                            }`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={idx} className="px-1 text-gray-400 font-bold">...</span>
                    )
                ))}

                <button
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman Selanjutnya"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
