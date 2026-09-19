import { useState, useEffect, useMemo } from 'react';
import { Calculator, Sparkles, CheckCircle2, PlusCircle } from 'lucide-react';
import api from '../../../../services/api';
import type { BillingComponent } from '../../../../types';
import { calculateComponentCost } from '../../../../utils/billingCalculator';

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
    const { total, breakdown, activeMandayComponents } = useMemo(() => {
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
                ],
                activeMandayComponents: []
            };
        }

        let currentTotal = 0;
        const currentBreakdown: any[] = [];

        // 1. Mandatory Components from Master Biaya
        // De-duplicate variants of the same component (e.g. regional vs general) by normalized base name
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

            const normName = (comp.name || '').replace(/\s*\([^)]*(?:khusus|provinsi|wilayah|regional|jakarta|umum)[^)]*\)/gi, '').trim().toUpperCase();
            const dedupeKey = `${cat}::${normName}`;

            const existing = categoryMap.get(dedupeKey);
            if (!existing || score > existing.score) {
                categoryMap.set(dedupeKey, { ...comp, score });
            }
        });

        const branchCount = Math.max(1, parseInt(clientData.branch_count) || 1);
        const productCount = Math.max(1, parseInt(clientData.product_count) || 1);

        Array.from(categoryMap.values()).forEach(comp => {
            const customQty = optionalQuantities[comp.id] || 1;
            const calc = calculateComponentCost(comp.type, comp.base_amount, comp.product_tiers, productCount, branchCount, customQty);

            const baseAmount = calc.totalAmount;
            let itemTotal = baseAmount;
            let discountAmount = 0;
            if (comp.discount_percent && comp.discount_percent > 0) {
                discountAmount = baseAmount * (comp.discount_percent / 100);
                itemTotal = baseAmount - discountAmount;
            }

            currentBreakdown.push({
                name: comp.name + calc.multiplierLabel,
                category: comp.category.toUpperCase(),
                unit_cost: calc.unitCost,
                multiplier: calc.multiplier > 1 ? calc.multiplier : null,
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
            const calc = calculateComponentCost(comp.type, comp.base_amount, comp.product_tiers, productCount, branchCount, optQty);

            const baseAmount = calc.totalAmount;
            let itemTotal = baseAmount;
            let discountAmount = 0;
            if (comp.discount_percent && comp.discount_percent > 0) {
                discountAmount = baseAmount * (comp.discount_percent / 100);
                itemTotal = baseAmount - discountAmount;
            }

            currentBreakdown.push({
                name: comp.name + calc.multiplierLabel + ' [Opsional]',
                category: comp.category ? comp.category.toUpperCase() : 'OPSIONAL',
                unit_cost: calc.unitCost,
                multiplier: calc.multiplier > 1 ? calc.multiplier : null,
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
            if (comp.district_id && comp.district_id.toString() !== clientData.district_id?.toString()) return;
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

        const pendType = bestPend?.type || (serviceType === 'REGULER' ? 'PER_CABANG' : 'FIXED');
        const qty = (bestPend && optionalQuantities[bestPend.id]) || 1;
        const pendCalc = calculateComponentCost(pendType, finalPrice, bestPend?.product_tiers, productCount, branchCount, qty);

        const basePendTotal = pendCalc.totalAmount;
        if (finalPrice > 0) {
            currentBreakdown.push({
                name: dispName + pendCalc.multiplierLabel,
                category: 'PENDAMPINGAN',
                unit_cost: pendCalc.unitCost,
                multiplier: pendCalc.multiplier > 1 ? pendCalc.multiplier : null,
                total: basePendTotal,
            });
            currentTotal += basePendTotal;

            if (pendDiscountPercent > 0) {
                const discAmount = basePendTotal * (pendDiscountPercent / 100);
                currentBreakdown.push({
                    name: `Diskon ${dispName} (${pendDiscountPercent}%)`,
                    category: 'DISKON',
                    unit_cost: -(discAmount / pendCalc.multiplier),
                    multiplier: pendCalc.multiplier > 1 ? pendCalc.multiplier : null,
                    total: -discAmount,
                });
                currentTotal -= discAmount;
            }
        }

        // Collect components needing quantity input
        const mandayList: any[] = [];
        if (bestPend && (bestPend.type || '').includes('PER_MANDAY') && finalPrice > 0) {
            mandayList.push(bestPend);
        }
        Array.from(categoryMap.values()).forEach(comp => {
            if ((comp.type || '').includes('PER_MANDAY')) {
                mandayList.push(comp);
            }
        });

        return { total: currentTotal, breakdown: currentBreakdown, activeMandayComponents: mandayList };
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
                            <div className="flex items-center gap-2 truncate max-w-[220px]">
                                <span className="truncate" title={item.name}>{item.name}</span>
                                {item.category && item.category !== 'SELF_DECLARE' && (
                                    <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase shrink-0 ${
                                        item.category === 'LPH' ? 'bg-purple-100 text-purple-700' :
                                        item.category === 'PENDAMPINGAN' ? 'bg-emerald-100 text-emerald-700' :
                                        item.category === 'BPJPH' ? 'bg-indigo-100 text-indigo-700' :
                                        item.category === 'MUI' ? 'bg-amber-100 text-amber-700' :
                                        item.category === 'PERSYARATAN_LAIN' ? 'bg-blue-100 text-blue-700' :
                                        item.category === 'DISKON' ? 'bg-rose-100 text-rose-700' :
                                        'bg-gray-200 text-gray-700'
                                    }`}>
                                        {item.category === 'PERSYARATAN_LAIN' ? 'PERSYARATAN LAIN' : item.category}
                                    </span>
                                )}
                            </div>
                            <span className={`font-mono font-bold whitespace-nowrap ${
                                item.total < 0 ? 'text-emerald-600' : 'text-gray-900'
                            }`}>
                                {item.total === 0 ? 'Gratis' : formatCurrency(item.total)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Quantity Inputs for PER_MANDAY components */}
            {activeMandayComponents && activeMandayComponents.length > 0 && serviceType !== 'SELF_DECLARE' && (
                <div className="space-y-2 pt-3 border-t border-gray-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                        Kuantitas Komponen (Per Kuantitas / Manday):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {activeMandayComponents.map((comp: any) => (
                            <div key={comp.id} className="flex items-center justify-between p-2 rounded-xl border bg-gray-50 border-gray-150 text-xs">
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-semibold text-gray-700 truncate">{comp.name}</span>
                                    <span className="text-[10px] text-gray-400">{formatCurrency(comp.base_amount)} / kuantitas</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] text-gray-500 font-bold">Qty:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={optionalQuantities[comp.id] || 1}
                                        onChange={e => handleQtyChange(comp.id, parseInt(e.target.value) || 1)}
                                        className="w-14 px-1.5 py-1 bg-white border border-gray-205 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
