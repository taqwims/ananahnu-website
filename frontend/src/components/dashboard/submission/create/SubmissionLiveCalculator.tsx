import { useState, useEffect, useMemo } from 'react';
import { Calculator, Sparkles, CheckCircle2, PlusCircle, Ticket, Tag, X, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import type { BillingComponent } from '../../../../types';
import type { Voucher } from '../../../../types/voucher';
import { voucherService } from '../../../../services/voucherService';
import { calculateComponentCost } from '../../../../utils/billingCalculator';
import toast from 'react-hot-toast';

interface SubmissionLiveCalculatorProps {
    clientData: any;
    setClientData: (v: any) => void;
}

export const SubmissionLiveCalculator = ({ clientData, setClientData }: SubmissionLiveCalculatorProps) => {
    const [masterComponents, setMasterComponents] = useState<BillingComponent[]>([]);
    const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Voucher State
    const [voucherInput, setVoucherInput] = useState(clientData.voucher_code || '');
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [validatingVoucher, setValidatingVoucher] = useState(false);
    const [voucherError, setVoucherError] = useState<string | null>(null);

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
    const { total, subtotalBeforeVoucher, voucherDiscount, breakdown, activeMandayComponents } = useMemo(() => {
        if (serviceType === 'SELF_DECLARE') {
            return {
                total: 0,
                subtotalBeforeVoucher: 0,
                voucherDiscount: 0,
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

        // 6. Apply Voucher Discount if claimed
        let calculatedVoucherDiscount = 0;
        if (appliedVoucher && currentTotal > 0) {
            if (appliedVoucher.discount_type === 'PERCENTAGE') {
                calculatedVoucherDiscount = (appliedVoucher.discount_value / 100) * currentTotal;
                if (appliedVoucher.max_discount && appliedVoucher.max_discount > 0) {
                    calculatedVoucherDiscount = Math.min(calculatedVoucherDiscount, appliedVoucher.max_discount);
                }
            } else {
                calculatedVoucherDiscount = appliedVoucher.discount_value;
            }
            calculatedVoucherDiscount = Math.min(currentTotal, Math.round(calculatedVoucherDiscount));

            if (calculatedVoucherDiscount > 0) {
                currentBreakdown.push({
                    name: `Voucher Promo (${appliedVoucher.code}) - ${appliedVoucher.name || 'Diskon'}`,
                    category: 'DISKON',
                    unit_cost: -calculatedVoucherDiscount,
                    total: -calculatedVoucherDiscount,
                });
            }
        }

        const finalGrandTotal = Math.max(0, currentTotal - calculatedVoucherDiscount);

        return { 
            total: finalGrandTotal, 
            subtotalBeforeVoucher: currentTotal,
            voucherDiscount: calculatedVoucherDiscount,
            breakdown: currentBreakdown, 
            activeMandayComponents: mandayList 
        };
    }, [masterComponents, systemSettings, serviceType, clientData, selectedOptionalIds, optionalQuantities, optionalComponents, appliedVoucher]);

    const handleApplyVoucher = async () => {
        const code = voucherInput.trim().toUpperCase();
        if (!code) {
            toast.error('Masukkan kode voucher terlebih dahulu');
            return;
        }
        setValidatingVoucher(true);
        setVoucherError(null);
        try {
            const res = await voucherService.validate({
                code,
                amount: subtotalBeforeVoucher,
                service_type: serviceType
            });
            if (res.valid && res.voucher) {
                setAppliedVoucher(res.voucher);
                setClientData({
                    ...clientData,
                    voucher_code: res.voucher.code,
                    discount_amount: res.discount_amount
                });
                toast.success(`Voucher "${res.voucher.code}" berhasil diterapkan!`);
            } else {
                setAppliedVoucher(null);
                setVoucherError(res.message || 'Kode voucher tidak valid');
                toast.error(res.message || 'Kode voucher tidak valid');
            }
        } catch (err: any) {
            setAppliedVoucher(null);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Kode voucher tidak valid atau kedaluwarsa';
            setVoucherError(msg);
            toast.error(msg);
        } finally {
            setValidatingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherInput('');
        setVoucherError(null);
        setClientData({
            ...clientData,
            voucher_code: undefined,
            discount_amount: 0
        });
        toast.success('Voucher berhasil dibatalkan');
    };

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
                        <h3 className="text-sm font-bold text-gray-800">Estimasi Reguler</h3>
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
                    {appliedVoucher && voucherDiscount > 0 && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                            Hemat {formatCurrency(voucherDiscount)} dengan voucher {appliedVoucher.code}
                        </p>
                    )}
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

            {/* Voucher Claim Section for Halal Advisor / Submission Creator */}
            {serviceType !== 'SELF_DECLARE' && (
                <div className="p-3 bg-brand-50/40 rounded-xl border border-brand-100 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                            <Ticket className="w-3.5 h-3.5 text-brand-600" />
                            Klaim Voucher Promo:
                        </span>
                        {appliedVoucher && (
                            <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                Aktif
                            </span>
                        )}
                    </div>

                    {!appliedVoucher ? (
                        <div className="space-y-1">
                            <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Kode voucher (e.g. ANA-2026)"
                                        className="w-full bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-brand-500/20"
                                        value={voucherInput}
                                        onChange={e => {
                                            setVoucherInput(e.target.value.toUpperCase());
                                            setVoucherError(null);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleApplyVoucher();
                                            }
                                        }}
                                    />
                                    <Tag className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApplyVoucher}
                                    disabled={validatingVoucher || !voucherInput.trim() || subtotalBeforeVoucher <= 0}
                                    className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1 transition-all shrink-0"
                                >
                                    {validatingVoucher ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Klaim'}
                                </button>
                            </div>
                            {voucherError && (
                                <p className="text-[10px] text-red-600 font-medium">{voucherError}</p>
                            )}
                        </div>
                    ) : (
                        <div className="p-2 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <div>
                                    <span className="font-mono font-black text-emerald-900">{appliedVoucher.code}</span>
                                    <span className="ml-1 text-[10px] font-bold text-emerald-700">
                                        (-{appliedVoucher.discount_type === 'PERCENTAGE' ? `${appliedVoucher.discount_value}%` : formatCurrency(appliedVoucher.discount_value)})
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveVoucher}
                                className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}

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
