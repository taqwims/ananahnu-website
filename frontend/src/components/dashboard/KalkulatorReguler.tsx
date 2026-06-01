import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save, Plus, Trash, BookOpen } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';
import type { BillingComponent } from '../../types';

type Props = {
    submissionId: string;
    onSaved?: () => void;
    readOnly?: boolean;
    salesSchemeId?: number;
    dataSource?: string;
};

type OptionalCost = {
    name: string;
    amount: number;
};

export default function KalkulatorReguler({ submissionId, onSaved, readOnly = false, salesSchemeId, dataSource = 'ORGANIK' }: Props) {
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Master Data
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [scales, setScales] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [regencies, setRegencies] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);

    // Dynamic cost components from master biaya
    const [masterComponents, setMasterComponents] = useState<BillingComponent[]>([]);
    const [loadingComponents, setLoadingComponents] = useState(false);

    // Form State
    const [businessTypeId, setBusinessTypeId] = useState('');
    const [productId, setProductId] = useState('');
    const [businessScaleId, setBusinessScaleId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [regencyId, setRegencyId] = useState('');
    const [districtId, setDistrictId] = useState('');

    // Quantities
    const [branchCount, setBranchCount] = useState(1);
    const [productCount, setProductCount] = useState(1);
    const [mandays, setMandays] = useState(1);

    // Optional costs
    const [optionalCosts, setOptionalCosts] = useState<OptionalCost[]>([]);
    const [newOptName, setNewOptName] = useState('');
    const [newOptAmount, setNewOptAmount] = useState('');

    // Geography cascading
    useEffect(() => {
        if (provinceId) {
            api.get(`/geography/regencies/${provinceId}`).then(res => setRegencies(res.data || []));
        } else {
            setRegencies([]);
            setRegencyId('');
        }
    }, [provinceId]);

    useEffect(() => {
        if (regencyId) {
            api.get(`/geography/districts/${regencyId}`).then(res => setDistricts(res.data || []));
        } else {
            setDistricts([]);
            setDistrictId('');
        }
    }, [regencyId]);

    // Fetch components reactively when filters change
    const fetchComponents = useCallback(async () => {
        setLoadingComponents(true);
        try {
            const params: Record<string, string> = {};
            if (businessTypeId) params.business_type_id = businessTypeId;
            if (productId) params.product_category_id = productId;
            if (businessScaleId) params.business_scale_id = businessScaleId;
            if (provinceId) params.province_id = provinceId;
            if (regencyId) params.regency_id = regencyId;
            if (districtId) params.district_id = districtId;
            if (dataSource) params.data_source = dataSource;
            
            // Target scheme: either the one passed via props, or if marketing, try to find partnership
            const targetSchemeId = salesSchemeId || (dataSource === 'MARKETING' ? schemes.find(s => s.name.toUpperCase() === 'PARTNERSHIP' || s.name.toUpperCase() === 'PARTNER')?.id : null);
            if (targetSchemeId) params.sales_scheme_id = targetSchemeId.toString();
            
            params.resolve_geography = 'true';

            const [compRes] = await Promise.all([
                api.get('/billing-config/components', { params })
            ]);

            setMasterComponents(compRes.data || []);

        } catch (err) {
            console.error('Failed to load components:', err);
        } finally {
            setLoadingComponents(false);
        }
    }, [businessTypeId, productId, businessScaleId, provinceId, regencyId, districtId, salesSchemeId, dataSource, schemes]);

    // Load master data + existing cost detail on mount
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [btRes, pRes, bsRes, provRes, scRes, detailRes] = await Promise.all([
                    api.get('/billing-config/business-types').catch(() => ({ data: [] })),
                    api.get('/billing-config/product-categories').catch(() => ({ data: [] })),
                    api.get('/billing-config/business-scales').catch(() => ({ data: [] })),
                    api.get('/geography/provinces').catch(() => ({ data: [] })),
                    api.get('/billing-config/sales-schemes').catch(() => ({ data: [] })),
                    api.get(`/submissions/${submissionId}/cost-detail`).catch(() => ({ data: null }))
                ]);

                setBusinessTypes(btRes.data || []);
                setProducts(pRes.data || []);
                setScales(bsRes.data || []);
                setProvinces(provRes.data || []);
                setSchemes(scRes.data || []);

                if (detailRes.data && detailRes.data.id) {
                    setBusinessTypeId(detailRes.data.business_type_id?.toString() || '');
                    setProductId(detailRes.data.product_category_id?.toString() || '');
                    setBusinessScaleId(detailRes.data.business_scale_id?.toString() || '');
                    setProvinceId(detailRes.data.province_id?.toString() || '');
                    setRegencyId(detailRes.data.regency_id?.toString() || '');
                    setDistrictId(detailRes.data.district_id?.toString() || '');
                    
                    setBranchCount(detailRes.data.branch_count || 1);
                    setProductCount(detailRes.data.product_count || 1);
                    setMandays(detailRes.data.mandays || 1);

                    if (detailRes.data.cost_breakdown_data) {
                        try {
                            const bd = JSON.parse(detailRes.data.cost_breakdown_data);
                            const optionals = bd.filter((b: any) => b.is_optional);
                            setOptionalCosts(optionals.map((o: any) => ({ name: o.name, amount: o.total })));
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMasterData();
    }, [submissionId]);

    // Re-fetch components when any filter changes (reactive!)
    useEffect(() => {
        if (!loading) fetchComponents();
    }, [businessTypeId, productId, businessScaleId, provinceId, regencyId, districtId, fetchComponents, loading]);

    const addOptionalCost = () => {
        if (!newOptName || !newOptAmount) return;
        setOptionalCosts([...optionalCosts, { name: newOptName, amount: parseFloat(newOptAmount) }]);
        setNewOptName('');
        setNewOptAmount('');
    };

    const removeOptionalCost = (index: number) => {
        const updated = [...optionalCosts];
        updated.splice(index, 1);
        setOptionalCosts(updated);
    };

    // Reactive calculation
    const { total, breakdown } = useMemo(() => {
        let currentTotal = 0;
        const currentBreakdown: any[] = [];



        // 1. Components from master biaya
        // Group by category and pick the most specific one
        const categoryMap = new Map<string, any>();
        
        masterComponents.forEach(comp => {
            if (!comp || !comp.category) return;
            const cat = comp.category.toUpperCase();
            if (cat === 'OPSIONAL') return;

            let score = 0;
            if (comp.district_id) score += 1000;
            if (comp.regency_id) score += 100;
            if (comp.province_id) score += 10;
            if (comp.sales_scheme_id) score += 8;
            if (comp.business_scale_id) score += 5;
            if (comp.product_category_id) score += 2;
            if (comp.business_type_id) score += 1;

            const existing = categoryMap.get(cat);
            if (!existing || score > existing.score) {
                categoryMap.set(cat, { ...comp, score });
            }
        });

        Array.from(categoryMap.values()).forEach(comp => {
            let nameTag = '';
            if (comp.district_id) nameTag = ' [Khusus Kecamatan]';
            else if (comp.regency_id) nameTag = ' [Khusus Kabupaten]';
            else if (comp.province_id) nameTag = ' [Khusus Provinsi]';
            else if (comp.business_type_id || comp.product_category_id || comp.business_scale_id) nameTag = ' [Khusus Kriteria]';

            let multiplier = 1;
            let multiplierLabel = '';
            
            if (comp.type === 'PER_CABANG') {
                multiplier = branchCount;
                multiplierLabel = ` (${branchCount} Cabang)`;
            } else if (comp.type === 'PER_MANDAY') {
                multiplier = mandays;
                multiplierLabel = ` (${mandays} Manday)`;
            } else if (comp.type === 'PER_PRODUK') {
                multiplier = productCount;
                multiplierLabel = ` (${productCount} Produk)`;
            }

            const itemTotal = comp.base_amount * multiplier;

            currentBreakdown.push({
                name: comp.name + nameTag + multiplierLabel,
                category: comp.category.toUpperCase(),
                unit_cost: comp.base_amount,
                multiplier: multiplier > 1 ? multiplier : null,
                total: itemTotal,
                is_optional: false
            });
            currentTotal += itemTotal;
        });

        // 2. Partnership discount on pendampingan
        const currentScheme = schemes.find((s: any) => s.id === (salesSchemeId || -1));
        if (currentScheme && currentScheme.name.toUpperCase() === 'PARTNERSHIP') {
            const lphComp = categoryMap.get('LPH') || categoryMap.get('PENDAMPINGAN');
            if (lphComp) {
                const discountAmount = lphComp.base_amount * 0.1;
                currentBreakdown.push({
                    name: 'Diskon Partnership (10%)',
                    category: 'DISKON',
                    unit_cost: -discountAmount,
                    multiplier: null,
                    total: -discountAmount,
                    is_optional: false
                });
                currentTotal -= discountAmount;
            }
        }

        // 3. Optional Costs
        optionalCosts.forEach(opt => {
            currentBreakdown.push({
                name: opt.name,
                category: 'OPSIONAL',
                unit_cost: opt.amount,
                multiplier: null,
                total: opt.amount,
                is_optional: true
            });
            currentTotal += opt.amount;
        });

        return { total: currentTotal, breakdown: currentBreakdown };
    }, [masterComponents, optionalCosts, salesSchemeId, schemes]);

    const handleSave = async () => {
        setSaving(true);

        const payload = {
            business_type_id: parseInt(businessTypeId) || null,
            product_category_id: parseInt(productId) || null,
            business_scale_id: parseInt(businessScaleId) || null,
            province_id: parseInt(provinceId) || null,
            regency_id: parseInt(regencyId) || null,
            district_id: parseInt(districtId) || null,
            product_count: productCount,
            branch_count: branchCount,
            mandays: mandays,
            total_amount: total,
            cost_breakdown_data: JSON.stringify(breakdown)
        };

        try {
            await api.post(`/submissions/${submissionId}/cost-detail`, payload);
            toast.success("Rincian biaya berhasil disimpan!");
            if (onSaved) onSaved();
        } catch (err) {
            console.error(err);
            toast.error("Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-600" /></div>;

    const canEdit = user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_ADVISOR' || user?.role === 'MARKETING' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR';
    const isEditable = !readOnly && canEdit;
    const canEditOptional = isEditable && (user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl mt-8">
            {/* Left Column: Form */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-brand-700">Form Perhitungan Biaya</h3>

                {/* Data Source Badge */}
                {dataSource && (
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        dataSource === 'MARKETING' ? 'bg-amber-100 text-amber-700' : 
                        dataSource === 'BOTH' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                        Sumber: {dataSource === 'MARKETING' ? 'Marketing (Partner)' : dataSource === 'BOTH' ? 'Semua (Internal & Partner)' : 'Organik (Advisor)'}
                    </div>
                )}

                {/* Guide Section */}
                <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl flex gap-3 text-brand-800 text-sm">
                    <BookOpen className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold mb-1">Panduan Penggunaan Kalkulator</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-brand-700/80">
                            <li>Harga akan <b>berubah otomatis</b> saat Anda memilih kombinasi Provinsi, Bidang, atau Produk.</li>
                            <li>Jika ada <b>Tarif Khusus Wilayah</b> untuk daerah yang Anda pilih, sistem akan menimpa harga umum dengan harga khusus tersebut.</li>
                            <li>Pastikan master data di <b>Master Biaya</b> sudah dikonfigurasi (misal: Biaya LPH khusus DKI Jakarta).</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Provinsi */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Provinsi Fasilitas Produksi</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={provinceId}
                            onChange={e => setProvinceId(e.target.value)}
                            disabled={!isEditable}
                        >
                            <option value="">Pilih Provinsi...</option>
                            {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Kabupaten */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kabupaten / Kota Fasilitas Produksi</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                            value={regencyId}
                            onChange={e => setRegencyId(e.target.value)}
                            disabled={!isEditable || !provinceId}
                        >
                            <option value="">Pilih Kabupaten...</option>
                            {regencies.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    {/* Bidang + Produk */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Bidang</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={businessTypeId}
                                onChange={e => { setBusinessTypeId(e.target.value); setProductId(''); }}
                                disabled={!isEditable}
                            >
                                <option value="">Pilih Bidang...</option>
                                {businessTypes.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Produk</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={productId}
                                onChange={e => setProductId(e.target.value)}
                                disabled={!isEditable}
                            >
                                <option value="">Pilih Produk...</option>
                                {products
                                    .filter((p: any) => !businessTypeId || p.business_type_id === parseInt(businessTypeId))
                                    .map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Skala Usaha */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Skala Usaha</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={businessScaleId}
                            onChange={e => setBusinessScaleId(e.target.value)}
                            disabled={!isEditable}
                        >
                            <option value="">Pilih Skala...</option>
                            {scales.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Kecamatan (opsional) */}
                    {provinceId && regencyId && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kecamatan (Opsional)</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                                value={districtId}
                                onChange={e => setDistrictId(e.target.value)}
                                disabled={!isEditable || !regencyId}
                            >
                                <option value="">Pilih Kecamatan...</option>
                                {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Quantities (Branch, Manday, Product) */}
                    <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Jumlah Cabang</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={branchCount}
                                onChange={e => setBranchCount(Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={!isEditable}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Jumlah Produk</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={productCount}
                                onChange={e => setProductCount(Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={!isEditable}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Jumlah Manday</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={mandays}
                                onChange={e => setMandays(Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={!isEditable}
                            />
                        </div>
                    </div>

                    {/* Biaya Tambahan (Opsional) */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Biaya Tambahan (Opsional)</label>
                        {optionalCosts.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center mb-2">
                                <span className="flex-1 text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100">{opt.name}</span>
                                <span className="w-1/3 text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-right font-medium">{formatRupiah(opt.amount)}</span>
                                {canEditOptional && (
                                    <button onClick={() => removeOptionalCost(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}

                        {canEditOptional && (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    placeholder="Nama Biaya..."
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                    value={newOptName}
                                    onChange={e => setNewOptName(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Nominal..."
                                    className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                    value={newOptAmount}
                                    onChange={e => setNewOptAmount(e.target.value)}
                                />
                                <button onClick={addOptionalCost} className="bg-gray-800 text-white p-2.5 rounded-xl hover:bg-gray-900 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    {isEditable && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-800 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Perhitungan
                        </button>
                    )}
                </div>
            </div>

            {/* Right Column: Breakdown */}
            <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100 flex flex-col">
                <h3 className="text-2xl font-bold text-brand-700 mb-6">Detail Hasil Perhitungan</h3>

                {/* Loading state */}
                {loadingComponents && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                        <p className="text-sm">Memuat komponen biaya...</p>
                    </div>
                )}

                {/* Empty state */}
                {!loadingComponents && breakdown.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-sm italic">Pilih Jenis Bidang, Produk, dan Skala Usaha untuk melihat rincian biaya.</p>
                        </div>
                    </div>
                )}

                {/* Breakdown List */}
                {!loadingComponents && breakdown.length > 0 && (
                    <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <div className="col-span-7">Komponen</div>
                            <div className="col-span-5 text-right">Harga</div>
                        </div>

                        {breakdown.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className={`grid grid-cols-12 gap-2 items-center py-3 px-4 rounded-xl border transition-all ${
                                    item.category === 'DISKON' ? 'bg-red-50 border-red-100' :
                                    item.category === 'OPSIONAL' ? 'bg-gray-50 border-gray-100' :
                                    item.category === 'BASE_PRICE' ? 'bg-brand-50 border-brand-100' :
                                    'bg-white border-gray-100 shadow-sm'
                                }`}>
                                    <div className="col-span-7">
                                        <p className={`font-semibold text-sm ${item.category === 'DISKON' ? 'text-red-700' : 'text-gray-700'}`}>
                                            {item.name}
                                        </p>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                            item.category === 'REGISTRASI' ? 'bg-blue-100 text-blue-600' :
                                            item.category === 'PENETAPAN' ? 'bg-purple-100 text-purple-600' :
                                            item.category === 'PENDAMPINGAN' || item.category === 'LPH' ? 'bg-green-100 text-green-600' :
                                            item.category === 'BPJPH' ? 'bg-indigo-100 text-indigo-600' :
                                            item.category === 'MUI' ? 'bg-amber-100 text-amber-600' :
                                            item.category === 'DISKON' ? 'bg-red-100 text-red-600' :
                                            item.category === 'BASE_PRICE' ? 'bg-brand-100 text-brand-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="col-span-5 text-right">
                                        <span className={`font-bold text-sm ${
                                            item.category === 'DISKON' ? 'text-red-700' : 'text-brand-700'
                                        }`}>
                                            {item.total < 0 ? `- ${formatRupiah(Math.abs(item.total))}` : formatRupiah(item.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grand Total */}
                <div className="mt-8 pt-6 border-t-2 border-gray-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-600 text-lg">Grand Total</span>
                        <span className="bg-brand-50 text-brand-700 border border-brand-100 px-6 py-3 rounded-2xl text-xl font-black">
                            {formatRupiah(total)}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">
                        *Perhitungan biaya mengacu pada Kep Kaban No. 22 Tahun 2024 sebagai tarif batas atas. LPH dapat menyesuaikan biaya sesuai kebijakan masing-masing.
                    </p>
                </div>
            </div>
        </div>
    );
}
