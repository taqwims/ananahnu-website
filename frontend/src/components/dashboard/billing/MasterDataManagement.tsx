import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { TabKey } from '../../../hooks/useBillingConfig';

interface MasterDataManagementProps {
    activeTab: TabKey;
    formData: any;
    setFormData: (v: any) => void;
    editingId: number | null;
    onSave: () => Promise<void>;
    onReset: () => void;
    onEdit: (item: any) => void;
    onDelete: (endpoint: string, id: number) => void;
    
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
    businessTypes,
    products,
    scales,
    schemes
}: MasterDataManagementProps) => {
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

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {editingId ? 'Edit' : 'Tambah'} {activeTab === 'schemes' ? 'Skema Penjualan' : activeTab === 'business_types' ? 'Jenis Bidang' : activeTab === 'products' ? 'Jenis Produk' : 'Skala Usaha'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{editingId ? 'Perbarui data yang sudah ada.' : 'Lengkapi data di bawah ini untuk menambahkan master data baru.'}</p>
                    </div>
                    {editingId && (
                        <button onClick={onReset} className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all">
                            <X className="w-4 h-4" /> Batal Edit
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {activeTab === 'products' && (
                            <div className="md:col-span-2">
                                <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-brand-700" value={formData.businessTypeId} onChange={e => setFormData({ ...formData, businessTypeId: e.target.value })}>
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
                    <div className="flex gap-2 w-full md:w-auto">
                        {editingId && (
                            <button onClick={onReset} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">
                                Batal
                            </button>
                        )}
                        <button onClick={onSave} disabled={!formData.name} className="px-6 py-3 bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 rounded-xl shadow-md shadow-brand-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all whitespace-nowrap flex-1 justify-center">
                            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Update Data' : 'Tambah Data'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Nama</th>
                            {activeTab === 'products' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Bidang</th>}
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail / Deskripsi</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {getList().length === 0 ? (
                            <tr><td colSpan={activeTab === 'products' ? 4 : 3} className="py-8 text-center text-gray-400">Belum ada data</td></tr>
                        ) : getList().map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 group">
                                <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                {activeTab === 'products' && (
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100 shadow-sm">
                                            {item.business_type?.name || 'Unknown'}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-gray-500">{item.description || <span className="text-gray-300 italic">Kosong</span>}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDelete(getEndpoint(), item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
