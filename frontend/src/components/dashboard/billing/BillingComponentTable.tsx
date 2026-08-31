import { useState, useMemo } from 'react';
import { Pencil, Trash2, Tag, Search, Filter, RotateCcw, ChevronLeft, ChevronRight, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import ConfirmModal from '../../ui/ConfirmModal';

interface BillingComponentTableProps {
    components: any[];
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    onBulkDelete?: (ids: number[]) => void;
    provinces: any[];
    businessTypes: any[];
    products: any[];
    schemes: any[];
    scales: any[];
}

export const BillingComponentTable = ({
    components,
    onEdit,
    onDelete,
    onBulkDelete,
    provinces,
    businessTypes,
    products,
    schemes,
    scales
}: BillingComponentTableProps) => {
    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterServiceType, setFilterServiceType] = useState('ALL');
    const [filterMandatory, setFilterMandatory] = useState('ALL');
    const [filterBusinessType, setFilterBusinessType] = useState('ALL');
    const [filterProvince, setFilterProvince] = useState('ALL');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Confirm Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: 'single' | 'bulk';
        id?: number;
        ids?: number[];
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'single',
        title: '',
        message: ''
    });

    // Filter Logic
    const filteredComponents = useMemo(() => {
        return components.filter(c => {
            // Search text
            if (searchTerm.trim()) {
                const search = searchTerm.toLowerCase();
                const matchName = c.name?.toLowerCase().includes(search);
                const matchDesc = c.description?.toLowerCase().includes(search);
                const matchField = c.form_field_config?.field_label?.toLowerCase().includes(search);
                if (!matchName && !matchDesc && !matchField) return false;
            }

            // Category
            if (filterCategory !== 'ALL' && c.category !== filterCategory) {
                return false;
            }

            // Service Type
            if (filterServiceType !== 'ALL') {
                const sType = c.service_type || 'REGULER';
                if (sType !== filterServiceType) return false;
            }

            // Mandatory
            if (filterMandatory !== 'ALL') {
                const isMand = filterMandatory === 'MANDATORY';
                if (c.is_mandatory !== isMand) return false;
            }

            // Business Type
            if (filterBusinessType !== 'ALL') {
                if (c.business_type_id !== parseInt(filterBusinessType)) return false;
            }

            // Region / Province Filter
            if (filterProvince !== 'ALL') {
                if (filterProvince === 'NATIONAL') {
                    if (c.province_id || c.regency_id || c.district_id) return false;
                } else if (filterProvince === 'REGIONAL') {
                    if (!c.province_id && !c.regency_id && !c.district_id) return false;
                } else {
                    const provId = parseInt(filterProvince);
                    if (c.province_id !== provId) return false;
                }
            }

            return true;
        });
    }, [components, searchTerm, filterCategory, filterServiceType, filterMandatory, filterBusinessType, filterProvince]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredComponents.length / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);
    
    const paginatedComponents = useMemo(() => {
        const start = (validCurrentPage - 1) * pageSize;
        return filteredComponents.slice(start, start + pageSize);
    }, [filteredComponents, validCurrentPage, pageSize]);

    // Handle Page change
    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    // Filter reset
    const hasActiveFilters = searchTerm !== '' || filterCategory !== 'ALL' || filterServiceType !== 'ALL' || filterMandatory !== 'ALL' || filterBusinessType !== 'ALL' || filterProvince !== 'ALL';
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilterCategory('ALL');
        setFilterServiceType('ALL');
        setFilterMandatory('ALL');
        setFilterBusinessType('ALL');
        setFilterProvince('ALL');
        setCurrentPage(1);
    };

    const handleEditClick = (c: any) => {
        onEdit(c);
        setTimeout(() => {
            const formEl = document.getElementById('billing-form-section') || document.querySelector('form');
            if (formEl) {
                formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    };

    // Selection Handlers
    const isAllCurrentPageSelected = paginatedComponents.length > 0 && paginatedComponents.every(c => selectedIds.includes(c.id));
    const isSomeCurrentPageSelected = paginatedComponents.some(c => selectedIds.includes(c.id)) && !isAllCurrentPageSelected;

    const toggleSelectAllCurrentPage = () => {
        if (isAllCurrentPageSelected) {
            const currentPageIds = new Set(paginatedComponents.map(c => c.id));
            setSelectedIds(selectedIds.filter(id => !currentPageIds.has(id)));
        } else {
            const newIds = new Set([...selectedIds, ...paginatedComponents.map(c => c.id)]);
            setSelectedIds(Array.from(newIds));
        }
    };

    const toggleSelectRow = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Delete Trigger Handlers
    const triggerSingleDelete = (item: any) => {
        setDeleteModal({
            isOpen: true,
            type: 'single',
            id: item.id,
            title: 'Hapus Komponen Biaya',
            message: `Apakah Anda yakin ingin menghapus komponen biaya "${item.name}"? Tindakan ini tidak dapat dibatalkan.`
        });
    };

    const triggerBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDeleteModal({
            isOpen: true,
            type: 'bulk',
            ids: selectedIds,
            title: 'Hapus Massal Komponen Biaya',
            message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} komponen biaya yang dipilih? Tindakan ini tidak dapat dibatalkan.`
        });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.type === 'single' && deleteModal.id) {
            onDelete(deleteModal.id);
            setSelectedIds(selectedIds.filter(id => id !== deleteModal.id));
        } else if (deleteModal.type === 'bulk' && deleteModal.ids) {
            if (onBulkDelete) {
                onBulkDelete(deleteModal.ids);
            } else {
                deleteModal.ids.forEach(id => onDelete(id));
            }
            setSelectedIds([]);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari nama komponen atau deskripsi..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Category */}
                        <select
                            value={filterCategory}
                            onChange={e => {
                                setFilterCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700"
                        >
                            <option value="ALL">Semua Kategori</option>
                            <option value="PENDAMPINGAN">Pendampingan</option>
                            <option value="BPJPH">BPJPH</option>
                            <option value="MUI">MUI</option>
                            <option value="LPH">LPH</option>
                            <option value="PERSYARATAN_LAIN">Persyaratan Lain</option>
                        </select>

                        {/* Service Type */}
                        <select
                            value={filterServiceType}
                            onChange={e => {
                                setFilterServiceType(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700"
                        >
                            <option value="ALL">Semua Layanan</option>
                            <option value="REGULER">Reguler</option>
                            <option value="SELF_DECLARE">SD Fasilitasi</option>
                            <option value="SELF_DECLARE_MANDIRI">SD Mandiri</option>
                        </select>

                        {/* Mandatory / Optional */}
                        <select
                            value={filterMandatory}
                            onChange={e => {
                                setFilterMandatory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700"
                        >
                            <option value="ALL">Semua Sifat</option>
                            <option value="MANDATORY">Wajib</option>
                            <option value="OPTIONAL">Persyaratan Lain</option>
                        </select>

                        {/* Business Type */}
                        <select
                            value={filterBusinessType}
                            onChange={e => {
                                setFilterBusinessType(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700 max-w-[160px] cursor-pointer"
                        >
                            <option value="ALL">Semua Bidang</option>
                            {businessTypes.map(bt => (
                                <option key={bt.id} value={bt.id}>{bt.name}</option>
                            ))}
                        </select>

                        {/* Wilayah / Region */}
                        <select
                            value={filterProvince}
                            onChange={e => {
                                setFilterProvince(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700 max-w-[160px] cursor-pointer"
                        >
                            <option value="ALL">Semua Wilayah</option>
                            <option value="NATIONAL">Nasional (Semua Daerah)</option>
                            <option value="REGIONAL">Khusus Daerah Tertentu</option>
                            {provinces.length > 0 && (
                                <optgroup label="Provinsi Spesifik">
                                    {provinces.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>

                        {/* Reset Filter Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 rounded-xl transition-all"
                                title="Reset Filter"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Action Bar & Results Count */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                    <div className="text-gray-500 font-medium flex items-center gap-2">
                        <span>Menampilkan <strong className="text-gray-800">{filteredComponents.length}</strong> komponen biaya</span>
                        {hasActiveFilters && (
                            <span className="text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md font-bold">
                                Difilter dari {components.length} total
                            </span>
                        )}
                    </div>

                    {/* Bulk Selection Actions */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 bg-red-50/80 border border-red-200 px-3.5 py-1.5 rounded-xl animate-in fade-in slide-in-from-top-1">
                            <span className="text-xs font-bold text-red-700">
                                {selectedIds.length} item dipilih
                            </span>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 underline"
                            >
                                Batal
                            </button>
                            <button
                                onClick={triggerBulkDelete}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus ({selectedIds.length}) Terpilih
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-10 text-center">
                                    <button
                                        onClick={toggleSelectAllCurrentPage}
                                        className="text-gray-400 hover:text-brand-600 transition-colors flex items-center justify-center cursor-pointer"
                                        title={isAllCurrentPageSelected ? "Batalkan pilih semua di halaman ini" : "Pilih semua di halaman ini"}
                                    >
                                        {isAllCurrentPageSelected ? (
                                            <CheckSquare className="w-4 h-4 text-brand-600" />
                                        ) : isSomeCurrentPageSelected ? (
                                            <MinusSquare className="w-4 h-4 text-brand-600" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Tipe</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Diskon</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sifat</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batasan Wilayah / Klasifikasi</th>
                                <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedComponents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Filter className="w-8 h-8 text-gray-300" />
                                            <p className="font-semibold text-gray-500">Tidak ada komponen biaya yang sesuai.</p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={resetFilters}
                                                    className="mt-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg cursor-pointer"
                                                >
                                                    Reset Semua Filter
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedComponents.map(c => {
                                const isSelected = selectedIds.includes(c.id);
                                return (
                                    <tr 
                                        key={c.id} 
                                        className={`transition-colors ${isSelected ? 'bg-brand-50/40' : 'hover:bg-gray-50/70'}`}
                                    >
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => toggleSelectRow(c.id)}
                                                className="text-gray-400 hover:text-brand-600 transition-colors flex items-center justify-center mx-auto cursor-pointer"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-brand-600" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-gray-800">{c.name}</div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">
                                                    {c.type === 'PER_MANDAY' ? 'PER KUANTITAS' : c.type}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-semibold text-blue-600">
                                                    {c.service_type === 'SELF_DECLARE_MANDIRI' ? 'SD MANDIRI' : c.service_type === 'SELF_DECLARE' ? 'SD FASILITASI' : (c.service_type || 'REGULER')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm whitespace-nowrap ${
                                                c.category === 'PENDAMPINGAN' ? 'bg-green-100 text-green-700' :
                                                c.category === 'BPJPH' ? 'bg-indigo-100 text-indigo-700' :
                                                c.category === 'MUI' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {c.category === 'PERSYARATAN_LAIN' ? 'Persyaratan Lain' : c.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="font-black text-gray-900">{formatRupiah(c.base_amount)}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-700">{c.discount_percent ? `${c.discount_percent}%` : '-'}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {c.is_mandatory ? (
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md w-fit border border-brand-100 whitespace-nowrap">
                                                    <Tag className="w-3 h-3" /> WAJIB
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md w-fit border border-gray-200 whitespace-nowrap">
                                                        PERSYARATAN LAIN
                                                    </div>
                                                    {c.form_field_config && (
                                                        <span className="text-[9px] text-blue-600 font-extrabold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md block w-fit truncate max-w-[140px]" title={`Dihubungkan dengan form field: ${c.form_field_config.field_label}`}>
                                                            Form: {c.form_field_config.field_label}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1 text-xs text-gray-600">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
                                                    {c.district_id ? 'Kecamatan (Satu Daerah)' : c.regency_id ? 'Kabupaten (Satu Daerah)' : c.province_id ? provinces.find(p => p.id === c.province_id)?.name || `#${c.province_id}` : 'Semua Wilayah'}
                                                </span>
                                                {(c.business_type_id || c.product_category_id) && (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"></span>
                                                        {c.business_type_id ? businessTypes.find(bt => bt.id === c.business_type_id)?.name : 'Semua Bidang'} 
                                                        {c.product_category_id ? ` • ${products.find(p => p.id === c.product_category_id)?.name}` : ''}
                                                    </span>
                                                )}
                                                {(c.sales_scheme_id || c.business_scale_id) && (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
                                                        {c.sales_scheme_id ? schemes.find(s => s.id === c.sales_scheme_id)?.name : 'Semua Skema'} 
                                                        {c.business_scale_id ? ` • ${scales.find(s => s.id === c.business_scale_id)?.name}` : ''}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                                                    Sumber: Organik
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => handleEditClick(c)} 
                                                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer"
                                                    title="Edit Komponen"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => triggerSingleDelete(c)} 
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                    title="Hapus Komponen"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-gray-50/80 px-6 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                        <span>Baris per halaman:</span>
                        <select
                            value={pageSize}
                            onChange={e => {
                                setPageSize(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="hidden sm:inline">
                            Halaman <strong className="text-gray-800">{validCurrentPage}</strong> dari <strong className="text-gray-800">{totalPages}</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(validCurrentPage - 1)}
                            disabled={validCurrentPage <= 1}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Halaman Sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                if (totalPages <= 7) return true;
                                if (page === 1 || page === totalPages) return true;
                                return Math.abs(page - validCurrentPage) <= 1;
                            })
                            .map((page, idx, array) => {
                                const prevPage = array[idx - 1];
                                const hasGap = prevPage && page - prevPage > 1;

                                return (
                                    <div key={page} className="flex items-center">
                                        {hasGap && <span className="px-1 text-gray-400">...</span>}
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                validCurrentPage === page
                                                    ? 'bg-brand-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                );
                            })}

                        <button
                            onClick={() => handlePageChange(validCurrentPage + 1)}
                            disabled={validCurrentPage >= totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Halaman Selanjutnya"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmDelete}
                title={deleteModal.title}
                message={deleteModal.message}
                confirmText="Ya, Hapus Data"
                cancelText="Batal"
                variant="danger"
            />
        </div>
    );
};
