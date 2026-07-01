import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../../utils/format';

interface SchemePricesPanelProps {
    schemes: any[];
    businessTypes: any[];
    products: any[];
    scales: any[];
}

export const SchemePricesPanel = ({
    schemes,
    businessTypes,
    products,
    scales
}: SchemePricesPanelProps) => {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state
    const [salesSchemeId, setSalesSchemeId] = useState('');
    const [businessTypeId, setBusinessTypeId] = useState('');
    const [businessScaleId, setBusinessScaleId] = useState('');
    const [productCategoryId, setProductCategoryId] = useState('');
    const [dataSource, setDataSource] = useState('ORGANIK');
    const [basePrice, setBasePrice] = useState('');
    const [discountPercent, setDiscountPercent] = useState('0');
    const [description, setDescription] = useState('');

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/billing-config/scheme-prices');
            setConfigs(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat tarif skema");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!salesSchemeId || !basePrice) {
            toast.error("Skema penjualan dan harga dasar harus diisi");
            return;
        }

        setSaving(true);
        const payload = {
            sales_scheme_id: parseInt(salesSchemeId),
            business_type_id: businessTypeId ? parseInt(businessTypeId) : null,
            business_scale_id: businessScaleId ? parseInt(businessScaleId) : null,
            product_category_id: productCategoryId ? parseInt(productCategoryId) : null,
            data_source: dataSource,
            base_price: parseFloat(basePrice),
            discount_percent: parseFloat(discountPercent) || 0,
            description: description,
            is_active: true
        };

        try {
            if (editingId) {
                await api.put(`/billing-config/scheme-prices/${editingId}`, payload);
                toast.success("Tarif skema berhasil diperbarui");
            } else {
                await api.post('/billing-config/scheme-prices', payload);
                toast.success("Tarif skema berhasil ditambahkan");
            }
            resetForm();
            fetchConfigs();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal menyimpan tarif skema");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus tarif skema ini?")) return;
        try {
            await api.delete(`/billing-config/scheme-prices/${id}`);
            toast.success("Tarif skema berhasil dihapus");
            fetchConfigs();
        } catch (err: any) {
            toast.error("Gagal menghapus tarif skema");
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setSalesSchemeId(item.sales_scheme_id?.toString() || '');
        setBusinessTypeId(item.business_type_id?.toString() || '');
        setBusinessScaleId(item.business_scale_id?.toString() || '');
        setProductCategoryId(item.product_category_id?.toString() || '');
        setDataSource(item.data_source || 'ORGANIK');
        setBasePrice(item.base_price?.toString() || '');
        setDiscountPercent(item.discount_percent?.toString() || '0');
        setDescription(item.description || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setSalesSchemeId('');
        setBusinessTypeId('');
        setBusinessScaleId('');
        setProductCategoryId('');
        setDataSource('ORGANIK');
        setBasePrice('');
        setDiscountPercent('0');
        setDescription('');
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600 w-8 h-8" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Form Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingId ? 'Edit Tarif Skema Penjualan' : 'Tambah Tarif Skema Penjualan'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Konfigurasi Harga Dasar Umum untuk pendampingan berdasarkan skema penjualan, bidang usaha, skala, dan kategori produk.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Skema Penjualan *</label>
                            <select
                                value={salesSchemeId}
                                onChange={e => setSalesSchemeId(e.target.value)}
                                className="glass-input w-full"
                                required
                            >
                                <option value="">Pilih Skema...</option>
                                {schemes.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Sumber Data *</label>
                            <select
                                value={dataSource}
                                onChange={e => setDataSource(e.target.value)}
                                className="glass-input w-full"
                                required
                            >
                                <option value="ORGANIK">ORGANIK</option>
                                <option value="MARKETING">MARKETING (Partner)</option>
                                <option value="BOTH">Keduanya (BOTH)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Skala Usaha (Opsional)</label>
                            <select
                                value={businessScaleId}
                                onChange={e => setBusinessScaleId(e.target.value)}
                                className="glass-input w-full"
                            >
                                <option value="">Semua Skala</option>
                                {scales.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Bidang Usaha (Opsional)</label>
                            <select
                                value={businessTypeId}
                                onChange={e => setBusinessTypeId(e.target.value)}
                                className="glass-input w-full"
                            >
                                <option value="">Semua Bidang</option>
                                {businessTypes.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Produk (Opsional)</label>
                            <select
                                value={productCategoryId}
                                onChange={e => setProductCategoryId(e.target.value)}
                                className="glass-input w-full"
                            >
                                <option value="">Semua Produk</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Harga Dasar (Pendampingan) *</label>
                            <input
                                type="number"
                                value={basePrice}
                                onChange={e => setBasePrice(e.target.value)}
                                className="glass-input w-full font-mono"
                                placeholder="Nominal Rp"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Diskon (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={discountPercent}
                                onChange={e => setDiscountPercent(e.target.value)}
                                className="glass-input w-full font-mono"
                                placeholder="0"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi / Keterangan</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="glass-input w-full"
                                placeholder="Keterangan tarif..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-xs"
                            >
                                Batal
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-brand px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-xs"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {editingId ? 'Simpan Perubahan' : 'Tambah Tarif'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Table Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Daftar Tarif Skema Penjualan</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase">Skema</th>
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase">Sumber Data</th>
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase">Kriteria Penjualan</th>
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase">Harga Dasar</th>
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase">Diskon</th>
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase">Keterangan</th>
                                <th className="p-4 font-bold text-xs text-gray-500 uppercase text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {configs.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <span className="font-bold text-gray-800">{item.sales_scheme?.name || `ID: ${item.sales_scheme_id}`}</span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-gray-600">
                                        {item.data_source}
                                    </td>
                                    <td className="p-4 text-xs text-gray-600 space-y-1">
                                        {item.business_scale && (
                                            <div>Skala: <span className="font-semibold text-gray-800">{item.business_scale.name}</span></div>
                                        )}
                                        {item.business_type && (
                                            <div>Bidang: <span className="font-semibold text-gray-800">{item.business_type.name}</span></div>
                                        )}
                                        {item.product_category && (
                                            <div>Produk: <span className="font-semibold text-gray-800">{item.product_category.name}</span></div>
                                        )}
                                        {!item.business_scale && !item.business_type && !item.product_category && (
                                            <span className="text-gray-400 italic">Umum / Semua Kriteria</span>
                                        )}
                                    </td>
                                    <td className="p-4 font-black text-brand-600">
                                        {formatRupiah(item.base_price)}
                                    </td>
                                    <td className="p-4 font-semibold text-gray-700">
                                        {item.discount_percent}%
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 max-w-xs truncate">
                                        {item.description || '-'}
                                    </td>
                                    <td className="p-4 flex gap-1 justify-center">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {configs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400 italic bg-gray-50">
                                        Belum ada data tarif skema penjualan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
