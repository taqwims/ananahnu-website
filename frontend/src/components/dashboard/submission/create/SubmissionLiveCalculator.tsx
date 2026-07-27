import { useState, useEffect, useMemo } from 'react';
import { Calculator, Sparkles, CheckCircle2, PlusCircle } from 'lucide-react';
import api from '../../../../services/api';
import type { BillingComponent } from '../../../../types';

interface SubmissionLiveCalculatorProps {
    clientData: any;
    setClientData: (v: any) => void;
}

export const SubmissionLiveCalculator = ({ clientData, setClientData }: SubmissionLiveCalculatorProps) => {
    const [masterComponents, setMasterComponents] = useState<BillingComponent[]>([]);
    const [salesSchemePrice, setSalesSchemePrice] = useState<any | null>(null);
    const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const serviceType = clientData.service_type || 'SELF_DECLARE';
    const selectedOptionalIds: number[] = clientData.selected_optional_ids || [];
    const optionalQuantities: Record<number, number> = clientData.optional_quantities || {};

    // Fetch billing components and settings
    useEffect(() => {
        const fetchPricingData = async () => {
            setLoading(true);
            try {
                const [compRes, sysRes] = await Promise.all([
                    api.get('/billing-config/components', {
                        params: { service_type: serviceType }
                    }).catch(() => ({ data: [] })),
                    api.get('/system-settings').catch(() => ({ data: {} }))
                ]);

                setMasterComponents(compRes.data || []);

                const settingsMap: Record<string, string> = {};
                if (sysRes.data && Array.isArray(sysRes.data)) {
                    sysRes.data.forEach((s: any) => { settingsMap[s.key] = s.value; });
                } else if (sysRes.data && typeof sysRes.data === 'object') {
                    Object.assign(settingsMap, sysRes.data);
                }
                setSystemSettings(settingsMap);

                // Fetch default sales scheme price (Direct Sale / ID 1) if REGULER
                if (serviceType === 'REGULER') {
                    const spRes = await api.get('/billing-config/sales-scheme-prices', {
                        params: { sales_scheme_id: 1 }
                    }).catch(() => ({ data: [] }));
                    if (spRes.data && spRes.data.length > 0) {
                        setSalesSchemePrice(spRes.data[0]);
                    }
                } else {
                    setSalesSchemePrice(null);
                }
            } catch (err) {
                console.error('Failed to load live pricing data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPricingData();
    }, [serviceType]);

    // Optional components list
    const optionalComponents = useMemo(() => {
        return masterComponents.filter(comp => {
            if (!comp || comp.is_mandatory) return false;
            const compSt = comp.service_type || 'REGULER';
            if (compSt !== 'BOTH' && compSt !== 'ALL' && serviceType && compSt !== serviceType) return false;
            if (comp.category?.toUpperCase() === 'PENDAMPINGAN') return false;
            return true;
        });
    }, [masterComponents, serviceType]);

    const toggleOptional = (id: number) => {
        let updated: number[];
        const updatedQuantities = { ...optionalQuantities };
        if (selectedOptionalIds.includes(id)) {
            updated = selectedOptionalIds.filter(x => x !== id);
        } else {
            updated = [...selectedOptionalIds, id];
            if (!updatedQuantities[id] || updatedQuantities[id] < 1) {
                updatedQuantities[id] = 1;
            }
        }
        setClientData({
            ...clientData,
            selected_optional_ids: updated,
            optional_quantities: updatedQuantities
        });
    };

    const handleQtyChange = (id: number, qty: number) => {
        const val = Math.max(1, qty);
        setClientData({
            ...clientData,
            optional_quantities: {
                ...optionalQuantities,
                [id]: val
            }
        });
    };

    // Compute cost breakdown reactively
    const { total, breakdown } = useMemo(() => {
        if (serviceType === 'SELF_DECLARE') {
            return {
                total: 0,
                breakdown: [
                    {
                        name: 'Program Self Declare (Fasilitasi / Gratis)',
                        category: 'SELF_DECLARE',
                        unit_cost: 0,
                        total: 0,
                    }
                ]
            };
        }

        let currentTotal = 0;
        const currentBreakdown: any[] = [];

        // 1. Mandatory Components from Master Biaya
        const categoryMap = new Map<string, any>();

        masterComponents.forEach(comp => {
            if (!comp || !comp.category || !comp.is_mandatory) return;
            const compSt = comp.service_type || 'REGULER';
            if (compSt !== 'BOTH' && compSt !== 'ALL' && serviceType && compSt !== serviceType) return;
            const cat = comp.category.toUpperCase();
            if (cat === 'PENDAMPINGAN') return;

            // Match filters
            if (comp.province_id && comp.province_id.toString() !== clientData.province_id?.toString()) return;
            if (comp.regency_id && comp.regency_id.toString() !== clientData.regency_id?.toString()) return;
            if (comp.district_id && comp.district_id.toString() !== clientData.district_id?.toString()) return;
            if (comp.business_type_id && comp.business_type_id.toString() !== clientData.business_type_id?.toString()) return;
            if (comp.business_scale_id && comp.business_scale_id.toString() !== clientData.business_scale_id?.toString()) return;
            if (comp.product_category_id && comp.product_category_id.toString() !== clientData.product_category_id?.toString()) return;

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
            let multiplier = 1;
            let multiplierLabel = '';

            if (comp.type === 'PER_CABANG') {
                multiplier = Math.max(1, parseInt(clientData.branch_count) || 1);
                multiplierLabel = ` (${multiplier} Cabang)`;
            } else if (comp.type === 'PER_PRODUK') {
                multiplier = Math.max(1, parseInt(clientData.product_count) || 1);
                multiplierLabel = ` (${multiplier} Produk)`;
            }

            const baseAmount = comp.base_amount * multiplier;
            let itemTotal = baseAmount;
            let discountAmount = 0;
            if (comp.discount_percent && comp.discount_percent > 0) {
                discountAmount = baseAmount * (comp.discount_percent / 100);
                itemTotal = baseAmount - discountAmount;
            }

            currentBreakdown.push({
                name: comp.name + multiplierLabel,
                category: comp.category.toUpperCase(),
                unit_cost: comp.base_amount,
                multiplier: multiplier > 1 ? multiplier : null,
                total: baseAmount,
            });

            if (discountAmount > 0) {
                currentBreakdown.push({
                    name: `Diskon ${comp.name} (${comp.discount_percent}%)`,
                    category: 'DISKON',
                    unit_cost: -discountAmount,
                    total: -discountAmount,
                });
            }

            currentTotal += itemTotal;
        });

        // 2. Selected Optional Components
        optionalComponents.forEach(comp => {
            if (!selectedOptionalIds.includes(comp.id)) return;
            const optQty = optionalQuantities[comp.id] || 1;
            let multiplier = optQty;
            let multiplierLabel = multiplier > 1 ? ` (${multiplier} Kuantitas)` : '';

            if (comp.type === 'PER_CABANG') {
                multiplier = Math.max(1, parseInt(clientData.branch_count) || 1) * optQty;
                multiplierLabel = ` (${multiplier} Cabang)`;
            } else if (comp.type === 'PER_PRODUK') {
                multiplier = Math.max(1, parseInt(clientData.product_count) || 1) * optQty;
                multiplierLabel = ` (${multiplier} Produk)`;
            }

            const baseAmount = comp.base_amount * multiplier;
            let itemTotal = baseAmount;
            let discountAmount = 0;
            if (comp.discount_percent && comp.discount_percent > 0) {
                discountAmount = baseAmount * (comp.discount_percent / 100);
                itemTotal = baseAmount - discountAmount;
            }

            currentBreakdown.push({
                name: comp.name + multiplierLabel + ' [Opsional]',
                category: comp.category ? comp.category.toUpperCase() : 'OPSIONAL',
                unit_cost: comp.base_amount,
                multiplier: multiplier > 1 ? multiplier : null,
                total: baseAmount,
            });

            if (discountAmount > 0) {
                currentBreakdown.push({
                    name: `Diskon ${comp.name} (${comp.discount_percent}%)`,
                    category: 'DISKON',
                    unit_cost: -discountAmount,
                    total: -discountAmount,
                });
            }

            currentTotal += itemTotal;
        });

        // 3. Pendampingan / SD Mandiri Fee
        let bestPend: any = null;
        let bestPendScore = -1;
        masterComponents.forEach(comp => {
            if (!comp) return;
            const compSt = comp.service_type || 'REGULER';
            if (compSt !== 'BOTH' && compSt !== 'ALL' && serviceType && compSt !== serviceType) return;
            if (serviceType === 'SELF_DECLARE_MANDIRI' && (compSt === 'SELF_DECLARE_MANDIRI' || comp.category?.toUpperCase() === 'PENDAMPINGAN')) {
                // eligible for SD Mandiri
            } else if (comp.category?.toUpperCase() !== 'PENDAMPINGAN') return;

            if (comp.province_id && comp.province_id.toString() !== clientData.province_id?.toString()) return;
            if (comp.regency_id && comp.regency_id.toString() !== clientData.regency_id?.toString()) return;
            if (comp.business_type_id && comp.business_type_id.toString() !== clientData.business_type_id?.toString()) return;
            if (comp.business_scale_id && comp.business_scale_id.toString() !== clientData.business_scale_id?.toString()) return;

            let score = 0;
            if (comp.district_id) score += 1000;
            if (comp.regency_id) score += 100;
            if (comp.province_id) score += 10;
            if (comp.sales_scheme_id) score += 8;
            if (comp.business_scale_id) score += 5;
            if (comp.product_category_id) score += 2;
            if (comp.business_type_id) score += 1;

            if (score > bestPendScore) {
                bestPendScore = score;
                bestPend = comp;
            }
        });

        let finalPrice = 0;
        let dispName = 'Jasa Pendampingan';
        let pendDiscountPercent = 0;

        if (bestPend) {
            finalPrice = bestPend.base_amount;
            dispName = bestPend.name;
            if (bestPend.discount_percent && bestPend.discount_percent > 0) {
                pendDiscountPercent = bestPend.discount_percent;
            }
        } else if (serviceType === 'REGULER' && salesSchemePrice) {
            finalPrice = salesSchemePrice.base_price;
            if (salesSchemePrice.sales_scheme?.name) {
                dispName = salesSchemePrice.sales_scheme.name;
            }
            if (salesSchemePrice.discount_percent > 0) {
                pendDiscountPercent = salesSchemePrice.discount_percent;
            }
        } else if (serviceType === 'SELF_DECLARE_MANDIRI') {
            const sysCost = systemSettings['SD_MANDIRI_COST'];
            finalPrice = sysCost ? parseFloat(sysCost) : 230000;
            dispName = 'Biaya Self Declare Mandiri';
        }

        if (finalPrice > 0) {
            currentBreakdown.push({
                name: dispName,
                category: 'PENDAMPINGAN',
                unit_cost: finalPrice,
                total: finalPrice,
            });
            currentTotal += finalPrice;

            if (pendDiscountPercent > 0) {
                const discAmount = finalPrice * (pendDiscountPercent / 100);
                currentBreakdown.push({
                    name: `Diskon ${dispName} (${pendDiscountPercent}%)`,
                    category: 'DISKON',
                    unit_cost: -discAmount,
                    total: -discAmount,
                });
                currentTotal -= discAmount;
            }
        }

        return { total: currentTotal, breakdown: currentBreakdown };
    }, [masterComponents, salesSchemePrice, systemSettings, serviceType, clientData, selectedOptionalIds, optionalQuantities, optionalComponents]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">Kalkulator Estimasi Biaya</h3>
                        <p className="text-[11px] text-gray-400">Kalkulasi harga real-time berbasis parameter Usaha</p>
                    </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    serviceType === 'REGULER' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : serviceType === 'SELF_DECLARE_MANDIRI'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                }`}>
                    {serviceType === 'REGULER' ? 'REGULER' : serviceType === 'SELF_DECLARE_MANDIRI' ? 'SD MANDIRI' : 'SD FASILITASI'}
                </span>
            </div>

            {/* Total Banner */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4 shadow-inner flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Total Tagihan Estimasi</span>
                    <h4 className="text-xl font-black text-amber-400 mt-0.5">
                        {serviceType === 'SELF_DECLARE' ? 'Rp 0 (Fasilitasi / Gratis)' : formatCurrency(total)}
                    </h4>
                </div>
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>

            {/* Itemized Breakdown List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Rincian Komponen Biaya:</span>
                {loading ? (
                    <div className="py-4 text-center text-xs text-gray-400">Menghitung biaya...</div>
                ) : breakdown.length === 0 ? (
                    <div className="py-3 text-center text-xs text-gray-400 italic">Pilih Skema Layanan & Data Usaha untuk menghitung.</div>
                ) : (
                    breakdown.map((item, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${
                            item.category === 'DISKON' 
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 font-medium'
                                : item.category === 'PENDAMPINGAN'
                                ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold'
                                : 'bg-gray-50 border-gray-150 text-gray-700'
                        }`}>
                            <span className="truncate max-w-[200px]" title={item.name}>{item.name}</span>
                            <span className={`font-mono font-bold whitespace-nowrap ${
                                item.total < 0 ? 'text-emerald-600' : 'text-gray-900'
                            }`}>
                                {item.total === 0 ? 'Gratis' : formatCurrency(item.total)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Optional Components Selection */}
            {optionalComponents.length > 0 && serviceType !== 'SELF_DECLARE' && (
                <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
                        <span>Komponen Tambahan (Opsional):</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {optionalComponents.map(comp => {
                            const isSelected = selectedOptionalIds.includes(comp.id);
                            const qty = optionalQuantities[comp.id] || 1;
                            return (
                                <div 
                                    key={comp.id}
                                    onClick={() => toggleOptional(comp.id)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer select-none ${
                                        isSelected 
                                            ? 'bg-brand-50/80 border-brand-300 text-brand-900 font-semibold shadow-xs' 
                                            : 'bg-gray-50 border-gray-150 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <input 
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer shrink-0 pointer-events-none"
                                        />
                                        <span title={comp.name} className="truncate">{comp.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                        {isSelected && (
                                            <div className="flex items-center gap-1 bg-white border border-brand-200 rounded-lg px-1.5 py-0.5">
                                                <span className="text-[10px] text-gray-400 font-bold mr-1">Qty:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQtyChange(comp.id, qty - 1)}
                                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 font-bold text-gray-600 text-xs"
                                                >-</button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={qty}
                                                    onChange={(e) => handleQtyChange(comp.id, parseInt(e.target.value) || 1)}
                                                    className="w-8 text-center bg-transparent border-none text-xs font-bold text-brand-700 outline-none p-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleQtyChange(comp.id, qty + 1)}
                                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 font-bold text-gray-600 text-xs"
                                                >+</button>
                                            </div>
                                        )}
                                        <span className="font-mono font-bold text-gray-800">
                                            +{formatCurrency(comp.base_amount * (isSelected ? qty : 1))}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Rincian biaya ini akan otomatis disimpan saat pengajuan dibuat.</span>
            </div>
        </div>
    );
};
