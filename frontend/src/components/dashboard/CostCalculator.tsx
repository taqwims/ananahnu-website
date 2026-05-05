import { useState, useEffect } from 'react';
import { Loader2, Calculator, Save } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../utils/format';

type Props = {
    submissionId: string;
    onSaved?: () => void;
    readOnly?: boolean;
};

export default function CostCalculator({ submissionId, onSaved, readOnly = false }: Props) {
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Master data
    const [categories, setCategories] = useState<any[]>([]);
    const [scales, setScales] = useState<any[]>([]);
    const [agencies, setAgencies] = useState<any[]>([]);
    const [components, setComponents] = useState<any[]>([]);

    // Form state
    const [categoryId, setCategoryId] = useState('');
    const [scaleId, setScaleId] = useState('');
    const [agencyId, setAgencyId] = useState('');
    const [productCount, setProductCount] = useState(1);
    const [branchCount, setBranchCount] = useState(1);
    const [mandays, setMandays] = useState(1);
    const [savedData, setSavedData] = useState<any>(null);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [cRes, sRes, aRes, compRes, detailRes] = await Promise.all([
                    api.get('/billing-config/product-categories'),
                    api.get('/billing-config/business-scales'),
                    api.get('/billing-config/halal-agencies'),
                    api.get('/billing-config/components'),
                    api.get(`/submissions/${submissionId}/cost-detail`).catch(() => ({ data: null }))
                ]);
                setCategories(cRes.data || []);
                setScales(sRes.data || []);
                setAgencies(aRes.data || []);
                setComponents(compRes.data || []);

                if (detailRes.data && detailRes.data.id) {
                    setSavedData(detailRes.data);
                    setCategoryId(detailRes.data.product_category_id?.toString() || '');
                    setScaleId(detailRes.data.business_scale_id?.toString() || '');
                    setAgencyId(detailRes.data.halal_agency_id?.toString() || '');
                    setProductCount(detailRes.data.product_count || 1);
                    setBranchCount(detailRes.data.branch_count || 1);
                    setMandays(detailRes.data.mandays || 1);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMasterData();
    }, [submissionId]);

    // Calculate dynamic cost based on components
    const calculateCost = () => {
        let total = 0;
        const breakdown: any[] = [];

        components.forEach(comp => {
            let amount = comp.base_amount;
            let formula = '';
            
            if (comp.type === 'PER_MANDAY') {
                amount = comp.base_amount * mandays;
                formula = `${mandays} Mandays x Rp ${comp.base_amount.toLocaleString()}`;
            } else if (comp.type === 'PER_CABANG') {
                amount = comp.base_amount * branchCount;
                formula = `${branchCount} Cabang x Rp ${comp.base_amount.toLocaleString()}`;
            } else if (comp.type === 'PER_PRODUK') {
                amount = comp.base_amount * productCount;
                formula = `${productCount} Produk x Rp ${comp.base_amount.toLocaleString()}`;
            } else {
                formula = `Tetap`;
            }

            total += amount;
            breakdown.push({
                name: comp.name,
                formula,
                total: amount
            });
        });

        return { total, breakdown };
    };

    const handleSave = async () => {
        setSaving(true);
        const { total, breakdown } = calculateCost();
        
        const payload = {
            product_category_id: parseInt(categoryId) || null,
            business_scale_id: parseInt(scaleId) || null,
            halal_agency_id: parseInt(agencyId) || null,
            product_count: productCount,
            branch_count: branchCount,
            mandays: mandays,
            total_amount: total,
            cost_breakdown_data: JSON.stringify(breakdown)
        };

        try {
            await api.post(`/submissions/${submissionId}/cost-detail`, payload);
            setSavedData(payload);
            alert("Rincian biaya berhasil disimpan!");
            if (onSaved) onSaved();
        } catch (err) {
            console.error(err);
            alert("Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-600" /></div>;

    const { total, breakdown } = calculateCost();
    const canEdit = user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN';
    const isEditable = !readOnly && canEdit;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
            {/* Form Input */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-brand-500" />
                    Form Perhitungan Biaya
                </h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Produk</label>
                        <select 
                            className="glass-input" 
                            value={categoryId} 
                            onChange={e => setCategoryId(e.target.value)}
                            disabled={!isEditable}
                        >
                            <option value="">Pilih Kelompok Produk</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Skala Usaha</label>
                        <select 
                            className="glass-input" 
                            value={scaleId} 
                            onChange={e => setScaleId(e.target.value)}
                            disabled={!isEditable}
                        >
                            <option value="">Pilih Skala Usaha</option>
                            {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Produk</label>
                            <input 
                                type="number" 
                                min="1" 
                                className="glass-input" 
                                value={productCount} 
                                onChange={e => setProductCount(parseInt(e.target.value) || 0)}
                                disabled={!isEditable}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Pabrik/Cabang</label>
                            <input 
                                type="number" 
                                min="1" 
                                className="glass-input" 
                                value={branchCount} 
                                onChange={e => setBranchCount(parseInt(e.target.value) || 0)}
                                disabled={!isEditable}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Lembaga Pemeriksa Halal (LPH)</label>
                            <select 
                                className="glass-input" 
                                value={agencyId} 
                                onChange={e => setAgencyId(e.target.value)}
                                disabled={!isEditable}
                            >
                                <option value="">Pilih LPH</option>
                                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estimasi Mandays</label>
                            <input 
                                type="number" 
                                min="1" 
                                className="glass-input" 
                                value={mandays} 
                                onChange={e => setMandays(parseInt(e.target.value) || 0)}
                                disabled={!isEditable}
                            />
                        </div>
                    </div>

                    {isEditable && (
                        <button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="w-full mt-4 glass-button bg-brand-600 text-white hover:bg-brand-700 flex justify-center items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Hasil Perhitungan
                        </button>
                    )}
                </div>
            </div>

            {/* Live Result Details */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Detail Hasil Perhitungan</h3>
                <div className="space-y-2 text-sm">
                    {breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                            <div>
                                <p className="font-medium text-gray-700">{item.name}</p>
                                {item.formula !== 'Tetap' && <p className="text-xs text-gray-500">{item.formula}</p>}
                            </div>
                            <span className="font-semibold text-gray-900">
                                {formatRupiah(item.total)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t-2 border-brand-100 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Grand Total</span>
                    <span className="text-xl font-black text-brand-600">
                        {formatRupiah(total)}
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-4 italic">
                    *Perhitungan biaya dapat menyesuaikan kebijakan masing-masing LPH (batas atas merujuk aturan Kaban).
                </p>
            </div>
        </div>
    );
}
