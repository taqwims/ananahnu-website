import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, DollarSign, Tag, ToggleLeft, ToggleRight, Pencil, X } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah } from '../../utils/format';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal';
type ProductCategory = { id: number; name: string; description: string; business_type_id: number; business_type?: { id: number; name: string } };
type BusinessScale = { id: number; name: string; description: string };
type BillingComponent = { id: number; name: string; category: string; type: string; base_amount: number; is_mandatory: boolean; province_id?: number; regency_id?: number; district_id?: number; business_type_id?: number; product_category_id?: number; sales_scheme_id?: number; data_source: string; business_scale_id?: number; sales_scheme?: {id: number, name: string} };
type SalesScheme = { id: number; name: string; description: string };
type BusinessType = { id: number; name: string; description: string };

type MainTab = 'master_data' | 'components' | 'settings';
type TabKey = 'schemes' | 'business_types' | 'products' | 'scales' | 'components';

const COMPONENT_CATEGORIES = ['REGISTRASI', 'LPH', 'PENETAPAN', 'PENDAMPINGAN', 'BPJPH', 'MUI', 'OPSIONAL'] as const;
const COMPONENT_TYPES = ['FIXED', 'PER_MANDAY', 'PER_CABANG', 'PER_PRODUK'] as const;

export default function BillingConfigAdmin() {
    const [loading, setLoading] = useState(true);
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('components');
    const [activeTab, setActiveTab] = useState<TabKey>('components');

    const [products, setProducts] = useState<ProductCategory[]>([]);
    const [scales, setScales] = useState<BusinessScale[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [regencies, setRegencies] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [components, setComponents] = useState<BillingComponent[]>([]);
    const [schemes, setSchemes] = useState<SalesScheme[]>([]);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
    const [editingId, setEditingId] = useState<number | null>(null);

    // Simple add form
    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemType, setNewItemType] = useState('FIXED');
    const [newItemCategory, setNewItemCategory] = useState('OPSIONAL');
    const [newItemMandatory, setNewItemMandatory] = useState(false);
    const [newItemBusinessTypeId, setNewItemBusinessTypeId] = useState('');
    const [newItemProductCategoryId, setNewItemProductCategoryId] = useState('');
    const [newItemSalesSchemeId, setNewItemSalesSchemeId] = useState('');
    const [newItemDataSource, setNewItemDataSource] = useState('ORGANIK');
    const [newItemBusinessScaleId, setNewItemBusinessScaleId] = useState('');

    const [newItemProvinceId, setNewItemProvinceId] = useState('');
    const [newItemRegencyId, setNewItemRegencyId] = useState('');
    const [newItemDistrictId, setNewItemDistrictId] = useState('');
    
    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'danger'
    });

    // Fetch regencies when province changes
    useEffect(() => {
        if (newItemProvinceId) {
            api.get(`/geography/regencies/${newItemProvinceId}`).then(res => setRegencies(res.data || []));
        } else {
            setRegencies([]);
            setNewItemRegencyId('');
        }
    }, [newItemProvinceId]);

    // Fetch districts when regency changes
    useEffect(() => {
        if (newItemRegencyId) {
            api.get(`/geography/districts/${newItemRegencyId}`).then(res => setDistricts(res.data || []));
        } else {
            setDistricts([]);
            setNewItemDistrictId('');
        }
    }, [newItemRegencyId]);

    // Fetch districts when regency changes
    useEffect(() => {
        if (newItemRegencyId) {
            api.get(`/geography/districts/${newItemRegencyId}`).then(res => setDistricts(res.data || []));
        } else {
            setDistricts([]);
            setNewItemDistrictId('');
        }
    }, [newItemRegencyId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, sRes, cRes, scRes, btRes, provRes] = await Promise.all([
                api.get('/billing-config/product-categories'),
                api.get('/billing-config/business-scales'),
                api.get('/billing-config/components'),
                api.get('/billing-config/sales-schemes').catch(() => ({ data: [] })),
                api.get('/billing-config/business-types').catch(() => ({ data: [] })),
                api.get('/geography/provinces').catch(() => ({ data: [] })),
            ]);
            const sysRes = await api.get('/system-settings').catch(() => ({ data: {} }));
            setProducts(pRes.data || []);
            setScales(sRes.data || []);
            setComponents(cRes.data || []);
            setSchemes(scRes.data || []);
            setBusinessTypes(btRes?.data || []);
            setProvinces(provRes?.data || []);
            setSystemSettings(sysRes?.data || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async () => {
        if (!newItemName) return;
        try {
            const payload: any = { name: newItemName, description: newItemDesc };
            let endpoint = '';
            
            if (activeTab === 'products') {
                endpoint = '/billing-config/product-categories';
                payload.business_type_id = parseInt(newItemBusinessTypeId);
            } else if (activeTab === 'scales') {
                endpoint = '/billing-config/business-scales';
            } else if (activeTab === 'schemes') {
                endpoint = '/billing-config/sales-schemes';
            } else if (activeTab === 'business_types') {
                endpoint = '/billing-config/business-types';
            } else if (activeTab === 'components') {
                endpoint = '/billing-config/components';
                payload.category = newItemCategory;
                payload.type = newItemType;
                payload.base_amount = parseFloat(newItemAmount) || 0;
                payload.is_mandatory = newItemMandatory;
                payload.business_type_id = newItemBusinessTypeId ? parseInt(newItemBusinessTypeId) : null;
                payload.product_category_id = newItemProductCategoryId ? parseInt(newItemProductCategoryId) : null;
                payload.province_id = newItemProvinceId ? parseInt(newItemProvinceId) : null;
                payload.regency_id = newItemRegencyId ? parseInt(newItemRegencyId) : null;
                payload.district_id = newItemDistrictId ? parseInt(newItemDistrictId) : null;
                payload.sales_scheme_id = newItemSalesSchemeId ? parseInt(newItemSalesSchemeId) : null;
                payload.data_source = newItemDataSource;
                payload.business_scale_id = newItemBusinessScaleId ? parseInt(newItemBusinessScaleId) : null;
            }

            if (editingId) {
                await api.put(`${endpoint}/${editingId}`, payload);
            } else {
                await api.post(endpoint, payload);
            }

            resetForm();
            fetchData();
            toast.success(editingId ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
        } catch (err) {
            console.error(err);
            toast.error("Gagal menyimpan data");
        }
    };

    const resetForm = () => {
        setNewItemName(''); setNewItemDesc(''); setNewItemAmount('');
        setNewItemCategory('OPSIONAL'); setNewItemMandatory(false);
        setNewItemBusinessTypeId(''); setNewItemProductCategoryId(''); 
        setNewItemSalesSchemeId(''); setNewItemDataSource('ORGANIK'); setNewItemBusinessScaleId('');
        setNewItemProvinceId(''); setNewItemRegencyId(''); setNewItemDistrictId('');
        setEditingId(null);
    };


    const handleDeleteMaster = async (endpoint: string, id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Data',
            message: 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`${endpoint}/${id}`);
                    fetchData();
                    toast.success('Data berhasil dihapus');
                } catch { 
                    toast.error('Gagal menghapus data'); 
                }
            }
        });
    };


    const handleEditMaster = (item: any) => {
        setNewItemName(item.name);
        setNewItemDesc(item.description || '');
        setEditingId(item.id);
        
        if (activeTab === 'products') {
            setNewItemBusinessTypeId(item.business_type_id?.toString() || '');
        } else if (activeTab === 'components') {
            setNewItemAmount(item.base_amount.toString());
            setNewItemCategory(item.category);
            setNewItemType(item.type);
            setNewItemMandatory(item.is_mandatory);
            setNewItemBusinessTypeId(item.business_type_id?.toString() || '');
            setNewItemProductCategoryId(item.product_category_id?.toString() || '');
            setNewItemProvinceId(item.province_id?.toString() || '');
            setNewItemRegencyId(item.regency_id?.toString() || '');
            setNewItemDistrictId(item.district_id?.toString() || '');
            setNewItemSalesSchemeId(item.sales_scheme_id?.toString() || '');
            setNewItemDataSource(item.data_source || 'ORGANIK');
            setNewItemBusinessScaleId(item.business_scale_id?.toString() || '');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;


    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl">
                            <DollarSign className="w-6 h-6 text-brand-600" />
                        </div>
                        Master Biaya &amp; Klasifikasi
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Atur skema harga, komponen biaya, dan klasifikasi produk dengan mudah</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'components', label: 'Komponen Biaya', icon: Plus },
                        { key: 'master_data', label: 'Klasifikasi & Master', icon: Tag },
                        { key: 'settings', label: 'Pengaturan Global', icon: Tag },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setActiveMainTab(tab.key as MainTab);
                                if (tab.key === 'master_data') setActiveTab('business_types');
                                else setActiveTab('components');
                            }}
                            className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                                activeMainTab === tab.key ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sub Tabs for Master Data */}
                {activeMainTab === 'master_data' && (
                    <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl w-full xl:w-auto">
                        {[
                            { key: 'business_types', label: 'Bidang' },
                            { key: 'products', label: 'Produk' },
                            { key: 'scales', label: 'Skala Usaha' },
                            { key: 'schemes', label: 'Skema' },
                        ].map(sub => (
                            <button
                                key={sub.key}
                                onClick={() => setActiveTab(sub.key as TabKey)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 xl:flex-none text-center ${
                                    activeTab === sub.key ? 'bg-white text-brand-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ==================== SYSTEM SETTINGS TAB ==================== */}
            {activeMainTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Pengaturan Sistem Global</h3>
                            <p className="text-xs text-gray-500 mt-1">Konfigurasi pengaturan yang berlaku secara global pada sistem.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga Default Self Declare Mandiri (Rp)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                        value={systemSettings['SD_MANDIRI_COST'] || ''}
                                        onChange={e => setSystemSettings(p => ({...p, 'SD_MANDIRI_COST': e.target.value}))}
                                        placeholder="Contoh: 280000"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Digunakan sebagai harga default untuk layanan Self Declare Mandiri.</p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={async () => {
                                        try {
                                            await api.put('/system-settings', { key: 'SD_MANDIRI_COST', value: systemSettings['SD_MANDIRI_COST'] || '280000' });
                                            toast.success("Pengaturan berhasil disimpan");
                                        } catch (err) {
                                            toast.error("Gagal menyimpan pengaturan");
                                        }
                                    }} 
                                    className="px-6 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-md shadow-brand-200 hover:bg-brand-700 transition-all"
                                >
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </div>
                    </div>
                    <ConfirmModal 
                        isOpen={confirmModal.isOpen}
                        onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                        title={confirmModal.title}
                        message={confirmModal.message}
                        onConfirm={confirmModal.onConfirm}
                        variant={confirmModal.variant}
                    />
                </div>
            )}



            {/* ==================== COMPONENTS TAB ==================== */}
            {activeTab === 'components' && activeMainTab === 'components' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya Baru'}</h3>
                                <p className="text-xs text-gray-500 mt-1">Komponen akan ditambahkan sebagai biaya tambahan dalam kalkulasi proposal.</p>
                            </div>
                            {editingId && (
                                <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    <X className="w-4 h-4" /> Batal Edit
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> Informasi Komponen
                                </h4>
                                <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Komponen *</label>
                                        <input type="text" placeholder="Misal: Biaya Transportasi" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
                                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>
                                                {COMPONENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipe Kalkulasi</label>
                                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                                                {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Nominal (Rp) *</label>
                                        <input type="number" placeholder="0" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> Aturan &amp; Wilayah (Opsional)
                                </h4>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Provinsi</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemProvinceId} onChange={e => setNewItemProvinceId(e.target.value)}>
                                            <option value="">Semua Provinsi</option>
                                            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Kabupaten</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50 disabled:bg-gray-100" value={newItemRegencyId} onChange={e => setNewItemRegencyId(e.target.value)} disabled={!newItemProvinceId}>
                                            <option value="">Semua Kabupaten</option>
                                            {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Kecamatan</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50 disabled:bg-gray-100" value={newItemDistrictId} onChange={e => setNewItemDistrictId(e.target.value)} disabled={!newItemRegencyId}>
                                            <option value="">Semua Kecamatan</option>
                                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Batasi Bidang</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemBusinessTypeId} onChange={e => { setNewItemBusinessTypeId(e.target.value); setNewItemProductCategoryId(''); }}>
                                            <option value="">Semua Bidang</option>
                                            {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Batasi Produk</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemProductCategoryId} onChange={e => setNewItemProductCategoryId(e.target.value)}>
                                            <option value="">Semua Produk</option>
                                            {products
                                                .filter(p => !newItemBusinessTypeId || p.business_type_id === parseInt(newItemBusinessTypeId))
                                                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Skema Penjualan</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemSalesSchemeId} onChange={e => setNewItemSalesSchemeId(e.target.value)}>
                                            <option value="">Semua Skema</option>
                                            {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Sumber Data</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemDataSource} onChange={e => setNewItemDataSource(e.target.value)}>
                                            <option value="ORGANIK">Organik (Konsultan)</option>
                                            <option value="MARKETING">Marketing (Partner)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Skala Usaha</label>
                                        <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={newItemBusinessScaleId} onChange={e => setNewItemBusinessScaleId(e.target.value)}>
                                            <option value="">Semua Skala</option>
                                            {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <label onClick={() => setNewItemMandatory(!newItemMandatory)} className="flex items-center gap-3 cursor-pointer group bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-colors">
                                {newItemMandatory ? <ToggleRight className="w-6 h-6 text-brand-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />}
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${newItemMandatory ? 'text-brand-700' : 'text-gray-600'}`}>Wajib (Mandatory)</span>
                                    <span className="text-[10px] text-gray-500 leading-none">Akan otomatis terpilih di kalkulator</span>
                                </div>
                            </label>
                            <div className="flex gap-3">
                                {editingId && (
                                    <button onClick={resetForm} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">
                                        Batal
                                    </button>
                                )}
                                <button onClick={handleCreate} disabled={!newItemName} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-md shadow-brand-200 transition-all">
                                    {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Update Komponen' : 'Simpan Komponen'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Tipe</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sifat</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batasan Wilayah / Klasifikasi</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {components.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-gray-400">Belum ada komponen biaya.</td></tr>
                                ) : components.map(c => (
                                    <tr key={c.id} className="hover:bg-brand-50/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{c.name}</div>
                                            <div className="mt-1"><span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">{c.type}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shadow-sm ${
                                                c.category === 'REGISTRASI' ? 'bg-blue-100 text-blue-700' :
                                                c.category === 'PENETAPAN' ? 'bg-purple-100 text-purple-700' :
                                                c.category === 'PENDAMPINGAN' ? 'bg-green-100 text-green-700' :
                                                c.category === 'BPJPH' ? 'bg-indigo-100 text-indigo-700' :
                                                c.category === 'MUI' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {c.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-gray-900">{formatRupiah(c.base_amount)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.is_mandatory ? (
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md w-fit border border-brand-100">
                                                    <Tag className="w-3 h-3" /> WAJIB
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md w-fit border border-gray-200">
                                                    OPSIONAL
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                    {c.district_id ? 'Kecamatan (Satu Daerah)' : c.regency_id ? 'Kabupaten (Satu Daerah)' : c.province_id ? provinces.find(p => p.id === c.province_id)?.name || `#${c.province_id}` : 'Semua Wilayah'}
                                                </span>
                                                {(c.business_type_id || c.product_category_id) && (
                                                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                                                    {c.business_type_id ? businessTypes.find(bt => bt.id === c.business_type_id)?.name : 'Semua Bidang'} 
                                                    {c.product_category_id ? ` • ${products.find(p => p.id === c.product_category_id)?.name}` : ''}
                                                </span>
                                            )}
                                            {(c.sales_scheme_id || c.business_scale_id) && (
                                                <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                                    {c.sales_scheme_id ? schemes.find(s => s.id === c.sales_scheme_id)?.name : 'Semua Skema'} 
                                                    {c.business_scale_id ? ` • ${scales.find(s => s.id === c.business_scale_id)?.name}` : ''}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${c.data_source === 'MARKETING' ? 'bg-amber-400' : 'bg-green-400'}`}></span>
                                                Sumber: {c.data_source || 'ORGANIK'}
                                            </span>
                                        </div>
                                    </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditMaster(c)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMaster('/billing-config/components', c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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
            )}

            {/* ==================== SIMPLE MASTER DATA TABS ==================== */}
            {activeMainTab === 'master_data' && (
                <div className="space-y-6 animate-in fade-in">
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
                                <button onClick={resetForm} className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    <X className="w-4 h-4" /> Batal Edit
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {activeTab === 'products' && (
                                    <div className="md:col-span-2">
                                        <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-brand-700" value={newItemBusinessTypeId} onChange={e => setNewItemBusinessTypeId(e.target.value)}>
                                            <option value="">Pilih Bidang (Parent)...</option>
                                            {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <input type="text" placeholder="Nama..." value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                </div>
                                <div>
                                    <input type="text" placeholder="Deskripsi..." value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                {editingId && (
                                    <button onClick={resetForm} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">
                                        Batal
                                    </button>
                                )}
                                <button onClick={handleCreate} disabled={!newItemName} className="px-6 py-3 bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 rounded-xl shadow-md shadow-brand-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all whitespace-nowrap flex-1 justify-center">
                                    {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Update Data' : 'Tambah Data'}
                                </button>
                            </div>
                        </div>
                    </div>

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
                                {activeTab === 'schemes' && schemes.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada data</td></tr>}
                                {activeTab === 'schemes' && schemes.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 group">
                                        <td className="px-6 py-4 font-bold text-gray-800">{s.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{s.description || <span className="text-gray-300 italic">Kosong</span>}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEditMaster(s)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMaster('/billing-config/sales-schemes', s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {activeTab === 'business_types' && businessTypes.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada data</td></tr>}
                                {activeTab === 'business_types' && businessTypes.map(bt => (
                                    <tr key={bt.id} className="hover:bg-gray-50/50 group">
                                        <td className="px-6 py-4 font-bold text-gray-800">{bt.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{bt.description || <span className="text-gray-300 italic">Kosong</span>}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEditMaster(bt)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMaster('/billing-config/business-types', bt.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {activeTab === 'products' && products.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">Belum ada data</td></tr>}
                                {activeTab === 'products' && products.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 group">
                                        <td className="px-6 py-4 font-bold text-gray-800">{p.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100 shadow-sm">
                                                {p.business_type?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{p.description || <span className="text-gray-300 italic">Kosong</span>}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEditMaster(p)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMaster('/billing-config/product-categories', p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {activeTab === 'scales' && scales.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada data</td></tr>}
                                {activeTab === 'scales' && scales.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 group">
                                        <td className="px-6 py-4 font-bold text-gray-800">{s.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{s.description || <span className="text-gray-300 italic">Kosong</span>}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => handleEditMaster(s)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteMaster('/billing-config/business-scales', s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
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
            )}
        </div>
    );
}
