import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Search, Filter, RotateCcw, ChevronLeft, ChevronRight, CheckSquare, Square, MinusSquare } from 'lucide-react';
import type { TabKey } from '../../../hooks/useBillingConfig';
import ConfirmModal from '../../ui/ConfirmModal';

interface MasterDataManagementProps {
    activeTab: TabKey;
    formData: any;
    setFormData: (v: any) => void;
    editingId: number | null;
    onSave: (customPayloads?: any[]) => Promise<void>;
    onReset: () => void;
    onEdit: (item: any) => void;
    onDelete: (endpoint: string, id: number) => void;
    onBulkDelete?: (endpoint: string, ids: number[]) => void;
    
    // Data lists
    businessTypes: any[];
    products: any[];
    scales: any[];
    schemes: any[];
}

export const MasterDataManagement = ({
    activeTab,
    formData,
    setFormData,
    editingId,
    onSave,
    onReset,
    onEdit,
    onDelete,
    onBulkDelete,
    businessTypes,
    products,
    scales,
    schemes
}: MasterDataManagementProps) => {
    const [productRows, setProductRows] = useState<Array<{ name: string; description: string }>>([{ name: '', description: '' }]);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBusinessType, setFilterBusinessType] = useState('ALL');

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
        endpoint: string;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'single',
        endpoint: '',
        title: '',
        message: ''
    });

    useEffect(() => {
        setProductRows([{ name: '', description: '' }]);
        setSelectedIds([]);
        setSearchTerm('');
        setFilterBusinessType('ALL');
        setCurrentPage(1);
    }, [editingId, activeTab]);

    const getEndpoint = () => {
        switch (activeTab) {
            case 'schemes': return '/billing-config/sales-schemes';
            case 'business_types': return '/billing-config/business-types';
            case 'products': return '/billing-config/product-categories';
            case 'scales': return '/billing-config/business-scales';
            default: return '';
        }
    };

    const getList = () => {
        switch (activeTab) {
            case 'schemes': return schemes;
            case 'business_types': return businessTypes;
            case 'products': return products;
            case 'scales': return scales;
            default: return [];
        }
    };

    const handleLocalSave = () => {
        if (activeTab === 'products' && !editingId) {
            const validRows = productRows.filter(r => r.name.trim() !== '');
            if (validRows.length === 0) return;
            onSave(validRows);
        } else {
            onSave();
        }
    };

    const isSaveDisabled = activeTab === 'products' && !editingId
        ? !formData.businessTypeId || productRows.filter(r => r.name.trim() !== '').length === 0
        : !formData.name;

    // Filter Logic for items
    const filteredList = useMemo(() => {
        const rawList = getList();
        return rawList.filter((item: any) => {
            // Search text
            if (searchTerm.trim()) {
                const search = searchTerm.toLowerCase();
                const matchName = item.name?.toLowerCase().includes(search);
                const matchDesc = item.description?.toLowerCase().includes(search);
                const matchParent = item.business_type?.name?.toLowerCase().includes(search);
                if (!matchName && !matchDesc && !matchParent) return false;
            }

            // Products Filter by Business Type
            if (activeTab === 'products' && filterBusinessType !== 'ALL') {
                if (item.business_type_id !== parseInt(filterBusinessType)) return false;
            }

            return true;
        });
    }, [activeTab, getList(), searchTerm, filterBusinessType]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
    const validCurrentPage = Math.min(currentPage, totalPages);

    const paginatedList = useMemo(() => {
        const start = (validCurrentPage - 1) * pageSize;
        return filteredList.slice(start, start + pageSize);
    }, [filteredList, validCurrentPage, pageSize]);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    // Selection Handlers
    const isAllCurrentPageSelected = paginatedList.length > 0 && paginatedList.every((item: any) => selectedIds.includes(item.id));
    const isSomeCurrentPageSelected = paginatedList.some((item: any) => selectedIds.includes(item.id)) && !isAllCurrentPageSelected;

    const toggleSelectAllCurrentPage = () => {
        if (isAllCurrentPageSelected) {
            const currentPageIds = new Set(paginatedList.map((item: any) => item.id));
            setSelectedIds(selectedIds.filter(id => !currentPageIds.has(id)));
        } else {
            const newIds = new Set([...selectedIds, ...paginatedList.map((item: any) => item.id)]);
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

    // Delete Handlers
    const triggerSingleDelete = (item: any) => {
        setDeleteModal({
            isOpen: true,
            type: 'single',
            id: item.id,
            endpoint: getEndpoint(),
            title: 'Hapus Data Master',
            message: `Apakah Anda yakin ingin menghapus "${item.name}"? Tindakan ini tidak dapat dibatalkan.`
        });
    };

    const triggerBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDeleteModal({
            isOpen: true,
            type: 'bulk',
            ids: selectedIds,
            endpoint: getEndpoint(),
            title: 'Hapus Massal Data Master',
            message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data yang dipilih? Tindakan ini tidak dapat dibatalkan.`
        });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.type === 'single' && deleteModal.id) {
            onDelete(deleteModal.endpoint, deleteModal.id);
            setSelectedIds(selectedIds.filter(id => id !== deleteModal.id));
        } else if (deleteModal.type === 'bulk' && deleteModal.ids) {
            if (onBulkDelete) {
                onBulkDelete(deleteModal.endpoint, deleteModal.ids);
            } else {
                deleteModal.ids.forEach(id => onDelete(deleteModal.endpoint, id));
            }
            setSelectedIds([]);
        }
    };

    const getTabTitle = () => {
        switch (activeTab) {
            case 'schemes': return 'Skema Penjualan';
            case 'business_types': return 'Jenis Bidang';
            case 'products': return 'Jenis Produk';
            case 'scales': return 'Skala Usaha';
            default: return '';
        }
    };

    const hasActiveFilters = searchTerm !== '' || (activeTab === 'products' && filterBusinessType !== 'ALL');

    const resetFilters = () => {
        setSearchTerm('');
        setFilterBusinessType('ALL');
        setCurrentPage(1);
    };

    const handleEditClick = (item: any) => {
        onEdit(item);
        setTimeout(() => {
            const formEl = document.getElementById('master-form-section') || document.querySelector('form');
            if (formEl) {
                formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Form */}
            <div id="master-form-section" className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 ${
                editingId ? 'ring-2 ring-brand-500/50 border-brand-200 shadow-brand-50' : 'border-gray-100'
            }`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {editingId && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>}
                            {editingId ? 'Edit' : 'Tambah'} {getTabTitle()}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{editingId ? 'Perbarui data yang sudah ada.' : 'Lengkapi data di bawah ini untuk menambahkan master data baru.'}</p>
                    </div>
                    {editingId && (
                        <button onClick={onReset} className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all cursor-pointer">
                            <X className="w-4 h-4" /> Batal Edit
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-4 items-start">
                    <div className="w-full">
                        {activeTab === 'products' && !editingId ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bidang (Parent)</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-brand-700 cursor-pointer" value={formData.businessTypeId} onChange={e => setFormData({ ...formData, businessTypeId: e.target.value })}>
                                        <option value="">Pilih Bidang...</option>
                                        {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Daftar Produk</label>
                                    {productRows.map((row, index) => (
                                        <div key={index} className="flex gap-3 items-center">
                                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-xs font-bold text-gray-500 flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <input type="text" placeholder="Jenis produk..." value={row.name} onChange={e => {
                                                    const newRows = [...productRows];
                                                    newRows[index].name = e.target.value;
                                                    setProductRows(newRows);
                                                }} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                            </div>
                                            <div className="flex-1">
                                                <input type="text" placeholder="Deskripsi (opsional)..." value={row.description} onChange={e => {
                                                    const newRows = [...productRows];
                                                    newRows[index].description = e.target.value;
                                                    setProductRows(newRows);
                                                }} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                            </div>
                                            {productRows.length > 1 && (
                                                <button type="button" onClick={() => setProductRows(productRows.filter((_, i) => i !== index))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0 cursor-pointer">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => setProductRows([...productRows, { name: '', description: '' }])} className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all font-semibold cursor-pointer">
                                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeTab === 'products' && (
                                    <div className="md:col-span-2">
                                        <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-brand-700 cursor-pointer" value={formData.businessTypeId} onChange={e => setFormData({ ...formData, businessTypeId: e.target.value })}>
                                            <option value="">Pilih Bidang (Parent)...</option>
                                            {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <input type="text" placeholder="Nama..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                </div>
                                <div>
                                    <input type="text" placeholder="Deskripsi..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 w-full justify-end mt-2">
                        {editingId && (
                            <button onClick={onReset} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                                Batal
                            </button>
                        )}
                        <button onClick={handleLocalSave} disabled={isSaveDisabled} className="px-6 py-3 bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 rounded-xl shadow-md shadow-brand-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all whitespace-nowrap justify-center cursor-pointer">
                            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Update Data' : 'Tambah Data'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar for Master Data */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={`Cari nama ${getTabTitle().toLowerCase()} atau deskripsi...`}
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                        />
                    </div>

                    {/* Filter by Bidang if in Products Tab */}
                    <div className="flex items-center gap-2">
                        {activeTab === 'products' && (
                            <select
                                value={filterBusinessType}
                                onChange={e => {
                                    setFilterBusinessType(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700 cursor-pointer"
                            >
                                <option value="ALL">Semua Bidang Usaha</option>
                                {businessTypes.map(bt => (
                                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                                ))}
                            </select>
                        )}

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 rounded-xl transition-all cursor-pointer"
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
                        <span>Menampilkan <strong className="text-gray-800">{filteredList.length}</strong> data {getTabTitle().toLowerCase()}</span>
                        {hasActiveFilters && (
                            <span className="text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md font-bold">
                                Difilter dari {getList().length} total
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
                                className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 underline cursor-pointer"
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

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
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
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                                    {activeTab === 'products' ? 'Jenis Produk' : 'Nama'}
                                </th>
                                {activeTab === 'products' && (
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Bidang Usaha (Parent)
                                    </th>
                                )}
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Detail / Deskripsi
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedList.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'products' ? 5 : 4} className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Filter className="w-8 h-8 text-gray-300" />
                                            <p className="font-semibold text-gray-500">Tidak ada data yang sesuai.</p>
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
                            ) : paginatedList.map((item: any) => {
                                const isSelected = selectedIds.includes(item.id);
                                return (
                                    <tr 
                                        key={item.id} 
                                        className={`transition-colors ${isSelected ? 'bg-brand-50/40' : 'hover:bg-gray-50/70'}`}
                                    >
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => toggleSelectRow(item.id)}
                                                className="text-gray-400 hover:text-brand-600 transition-colors flex items-center justify-center mx-auto cursor-pointer"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-brand-600" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800">
                                            {item.name}
                                        </td>
                                        {activeTab === 'products' && (
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-700 font-bold rounded-lg text-xs">
                                                    {item.business_type?.name || 'Lainnya'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {item.description || <span className="text-gray-300 italic">Kosong</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => handleEditClick(item)} 
                                                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer"
                                                    title="Edit Data"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => triggerSingleDelete(item)} 
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                    title="Hapus Data"
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
