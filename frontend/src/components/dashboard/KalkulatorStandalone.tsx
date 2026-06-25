import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Download, Plus, Trash, BookOpen } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import type { BillingComponent } from '../../types';
import { useAuthStore } from '../../store/authStore';
import logoImg from '../../assets/logo.png';

type Props = {
    onSaveClick?: (data: any) => void;
};

type OptionalCost = {
    name: string;
    amount: number;
};

export default function KalkulatorStandalone({ onSaveClick }: Props) {
    const user = useAuthStore(state => state.user);
    const isAdvisorOrManager = user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER';

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
    const [salesSchemePrice, setSalesSchemePrice] = useState<any | null>(null);

    // Form State
    const [dataSource, setDataSource] = useState('ORGANIK');
    const [salesSchemeId, setSalesSchemeId] = useState('');
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
    const [selectedOptionalComponentIds, setSelectedOptionalComponentIds] = useState<number[]>([]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    };

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
            if (dataSource) {
                params.data_source = dataSource === 'TELEMARKETING' ? 'ORGANIK' : dataSource;
            }
            
            const targetSchemeId = salesSchemeId;
            if (targetSchemeId) params.sales_scheme_id = targetSchemeId;
            
            params.resolve_geography = 'true';

            const promises: [Promise<any>, Promise<any>?] = [
                api.get('/billing-config/components', { params })
            ];

            if (targetSchemeId) {
                const priceParams: Record<string, string> = {
                    sales_scheme_id: targetSchemeId,
                    is_active: 'true'
                };
                if (businessTypeId) priceParams.business_type_id = businessTypeId;
                if (businessScaleId) priceParams.business_scale_id = businessScaleId;
                if (dataSource) priceParams.data_source = dataSource === 'TELEMARKETING' ? 'ORGANIK' : dataSource;
                promises.push(api.get('/billing-config/scheme-prices', { params: priceParams }));
            }

            const [compRes, priceRes] = await Promise.all(promises);

            setMasterComponents(compRes.data || []);

            if (priceRes && priceRes.data && priceRes.data.length > 0) {
                // Sort by specificity
                const prices = priceRes.data;
                prices.sort((a: any, b: any) => {
                    let scoreA = 0;
                    if (a.product_category_id) scoreA += 100;
                    if (a.business_scale_id) scoreA += 10;
                    if (a.business_type_id) scoreA += 1;

                    let scoreB = 0;
                    if (b.product_category_id) scoreB += 100;
                    if (b.business_scale_id) scoreB += 10;
                    if (b.business_type_id) scoreB += 1;

                    return scoreB - scoreA;
                });
                setSalesSchemePrice(prices[0]);
            } else {
                setSalesSchemePrice(null);
            }

        } catch (err) {
            console.error('Failed to load components:', err);
        } finally {
            setLoadingComponents(false);
        }
    }, [businessTypeId, productId, businessScaleId, provinceId, regencyId, districtId, salesSchemeId, dataSource]);

    // Load master data on mount
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [btRes, pRes, bsRes, provRes, scRes] = await Promise.all([
                    api.get('/billing-config/business-types').catch(() => ({ data: [] })),
                    api.get('/billing-config/product-categories').catch(() => ({ data: [] })),
                    api.get('/billing-config/business-scales').catch(() => ({ data: [] })),
                    api.get('/geography/provinces').catch(() => ({ data: [] })),
                    api.get('/billing-config/sales-schemes').catch(() => ({ data: [] }))
                ]);

                setBusinessTypes(btRes.data || []);
                setProducts(pRes.data || []);
                setScales(bsRes.data || []);
                setProvinces(provRes.data || []);
                const schemeList = scRes.data || [];
                setSchemes(schemeList);

                const directSaleScheme = schemeList.find((s: any) => s.name.toLowerCase().includes('direct'));
                if (isAdvisorOrManager) {
                    setDataSource('ORGANIK');
                    if (directSaleScheme) {
                        setSalesSchemeId(directSaleScheme.id.toString());
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMasterData();
    }, []);

    // Re-fetch components when any filter changes
    useEffect(() => {
        if (!loading) fetchComponents();
    }, [businessTypeId, productId, businessScaleId, provinceId, regencyId, districtId, salesSchemeId, dataSource, fetchComponents, loading]);

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
        const categoryMap = new Map<string, any>();
        
        masterComponents.forEach(comp => {
            if (!comp || !comp.category) return;
            const cat = comp.category.toUpperCase();
            if (cat === 'PENDAMPINGAN') return; // Skip PENDAMPINGAN as we use salesSchemePrice
            
            if (!comp.is_mandatory) return;

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

        // Find matching PENDAMPINGAN component name
        let pendampinganName = 'Jasa Pendampingan';
        let bestPendScore = -1;
        masterComponents.forEach(comp => {
            if (!comp || comp.category.toUpperCase() !== 'PENDAMPINGAN') return;

            if (comp.province_id && comp.province_id.toString() !== provinceId) return;
            if (comp.regency_id && comp.regency_id.toString() !== regencyId) return;
            if (comp.business_type_id && comp.business_type_id.toString() !== businessTypeId) return;
            if (comp.business_scale_id && comp.business_scale_id.toString() !== businessScaleId) return;
            if (comp.sales_scheme_id && comp.sales_scheme_id.toString() !== salesSchemeId) return;

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
                pendampinganName = comp.name;
            }
        });

        // Add Jasa Pendampingan from salesSchemePrice if exists
        if (salesSchemePrice) {
            const price = salesSchemePrice.base_price;
            let finalPrice = price;
            if (salesSchemePrice.discount_percent > 0) {
                finalPrice = price - (price * (salesSchemePrice.discount_percent / 100));
            }
            
            currentBreakdown.push({
                name: pendampinganName,
                category: 'JASA',
                unit_cost: finalPrice,
                multiplier: null,
                total: finalPrice,
                is_optional: false
            });
            currentTotal += finalPrice;
        }

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
        const currentScheme = schemes.find((s: any) => s.id === parseInt(salesSchemeId));
        if (currentScheme && currentScheme.name.toUpperCase() === 'PARTNERSHIP') {
            const jaseItem = currentBreakdown.find(item => item.category === 'JASA');
            if (jaseItem) {
                const discountAmount = jaseItem.unit_cost * 0.1;
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

        // 1b. Optional components
        masterComponents.forEach(comp => {
            if (!comp || !comp.category || comp.is_mandatory) return;
            if (comp.category.toUpperCase() === 'PENDAMPINGAN') return;

            const shouldInclude = selectedOptionalComponentIds.includes(comp.id);
            if (!shouldInclude) return;

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
            let nameTag = '';
            if (comp.district_id) nameTag = ' [Khusus Kecamatan]';
            else if (comp.regency_id) nameTag = ' [Khusus Kabupaten]';
            else if (comp.province_id) nameTag = ' [Khusus Provinsi]';
            else if (comp.business_type_id || comp.product_category_id || comp.business_scale_id) nameTag = ' [Khusus Kriteria]';

            currentBreakdown.push({
                id: comp.id,
                name: comp.name + nameTag + multiplierLabel,
                category: comp.category.toUpperCase(),
                unit_cost: comp.base_amount,
                multiplier: multiplier > 1 ? multiplier : null,
                total: itemTotal,
                is_optional: true
            });
            currentTotal += itemTotal;
        });

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
    }, [masterComponents, salesSchemePrice, optionalCosts, salesSchemeId, schemes, branchCount, mandays, productCount, selectedOptionalComponentIds]);

    const handleDownloadPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Gagal membuka jendela cetak. Pastikan pop-up tidak diblokir.");
            return;
        }

        const selectedProv = provinces.find(p => p.id.toString() === provinceId)?.name || '-';
        const selectedReg = regencies.find(r => r.id.toString() === regencyId)?.name || '-';
        const selectedDist = districts.find(d => d.id.toString() === districtId)?.name || '-';
        const selectedType = businessTypes.find(b => b.id.toString() === businessTypeId)?.name || '-';
        const selectedProd = products.find(p => p.id.toString() === productId)?.name || '-';
        const selectedScale = scales.find(s => s.id.toString() === businessScaleId)?.name || '-';
        const selectedScheme = schemes.find(s => s.id.toString() === salesSchemeId)?.name || '-';

        const breakdownRows = breakdown.map((item, idx) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px; font-size: 11px; color: #374151;">${idx + 1}</td>
                <td style="padding: 8px; font-size: 11px; color: #374151;">
                    <div style="font-weight: 600;">${item.name}</div>
                    <span style="font-size: 8px; padding: 1px 4px; background-color: #f3f4f6; color: #4b5563; border-radius: 3px; font-weight: bold; text-transform: uppercase;">${item.category}</span>
                </td>
                <td style="padding: 8px; font-size: 11px; color: #047857; font-weight: bold; text-align: right;">
                    ${item.total < 0 ? `- ${formatCurrency(Math.abs(item.total))}` : formatCurrency(item.total)}
                </td>
            </tr>
        `).join('');

        const content = `
            <html>
            <head>
                <title>Estimasi Biaya Sertifikasi Halal</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; margin: 30px; line-height: 1.4; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #047857; padding-bottom: 15px; }
                    .header h1 { color: #047857; margin: 0; font-size: 20px; }
                    .header p { margin: 3px 0 0 0; color: #6b7280; font-size: 12px; }
                    .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                    .details-box { background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; }
                    .details-box h3 { margin: 0 0 8px 0; font-size: 12px; color: #374151; border-bottom: 1px dashed #d1d5db; padding-bottom: 3px; }
                    .details-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
                    .details-row span:first-child { color: #6b7280; font-weight: 500; }
                    .details-row span:last-child { color: #1f2937; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { background-color: #047857; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; text-align: left; }
                    .total-box { display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
                    .total-box span:first-child { font-size: 14px; font-weight: bold; color: #065f46; }
                    .total-box span:last-child { font-size: 20px; font-weight: 900; color: #047857; }
                    .disclaimer { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; font-size: 10px; font-style: italic; margin-top: 30px; line-height: 1.5; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${logoImg}" style="height: 55px; margin-bottom: 8px; object-fit: contain;" />
                    <h1>ESTIMASI BIAYA SERTIFIKASI HALAL</h1>
                    <p>Dokumen Simulasi Perhitungan Mandiri</p>
                </div>
                
                <div class="details-grid">
                    <div class="details-box">
                        <h3>Informasi Wilayah & Kriteria</h3>
                        <div class="details-row"><span>Provinsi:</span><span>${selectedProv}</span></div>
                        <div class="details-row"><span>Kabupaten:</span><span>${selectedReg}</span></div>
                        <div class="details-row"><span>Kecamatan:</span><span>${selectedDist}</span></div>
                        <div class="details-row"><span>Jenis Bidang:</span><span>${selectedType}</span></div>
                        <div class="details-row"><span>Jenis Produk:</span><span>${selectedProd}</span></div>
                    </div>
                    <div class="details-box">
                        <h3>Skema & Volume</h3>
                        <div class="details-row"><span>Skala Usaha:</span><span>${selectedScale}</span></div>
                        <div class="details-row"><span>Skema Penjualan:</span><span>${selectedScheme}</span></div>
                        <div class="details-row"><span>Sumber Data:</span><span>${dataSource === 'MARKETING' ? 'Marketing (Partner)' : 'Organik'}</span></div>
                        <div class="details-row"><span>Jumlah Cabang:</span><span>${branchCount}</span></div>
                        <div class="details-row"><span>Jumlah Produk:</span><span>${productCount}</span></div>
                        ${!isAdvisorOrManager ? `<div class="details-row"><span>Jumlah Manday:</span><span>${mandays}</span></div>` : ''}
                    </div>
                </div>

                <h3 style="font-size: 13px; color: #374151; margin-bottom: 8px;">Rincian Komponen Biaya</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">No</th>
                            <th>Komponen Biaya</th>
                            <th style="text-align: right; width: 120px;">Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${breakdownRows}
                    </tbody>
                </table>

                <div class="total-box">
                    <span>Estimasi Grand Total</span>
                    <span>${formatCurrency(total)}</span>
                </div>

                <div class="disclaimer">
                    <strong>PENTING (DISCLAIMER):</strong> Perhitungan ini merupakan simulasi estimasi biaya berdasarkan kriteria yang Anda input. Biaya yang tertera di atas <b>belum tentu menjadi harga final</b>. Biaya sesungguhnya dapat disesuaikan kembali tergantung pada keadaan nyata dari fasilitas produksi, kehalalan bahan, dan kompleksitas proses sertifikasi usaha Anda.
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    const handleSave = () => {
        setSaving(true);
        try {
            const data = {
                data_source: dataSource,
                sales_scheme_id: parseInt(salesSchemeId) || null,
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
                breakdown
            };
            if (onSaveClick) {
                onSaveClick(data);
            } else {
                handleDownloadPDF();
                toast.success("Estimasi PDF berhasil digenerate!");
            }
        } catch (e) {
            toast.error("Gagal memproses perhitungan");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-600 w-8 h-8" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 rounded-xl border border-gray-100 shadow-md mt-2 w-full max-w-none">
            {/* Left Column: Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-bold text-brand-700">Form Perhitungan Biaya</h3>
                </div>

                {/* Sumber Data & Skema Selection */}
                {!isAdvisorOrManager && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Sumber Data</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-brand-700"
                                value={dataSource}
                                onChange={e => setDataSource(e.target.value)}
                            >
                                <option value="ORGANIK">Organik / Telemarketing</option>
                                <option value="MARKETING">Marketing (Partner)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Skema Penjualan</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-brand-700"
                                value={salesSchemeId}
                                onChange={e => setSalesSchemeId(e.target.value)}
                            >
                                <option value="">Pilih Skema...</option>
                                {schemes.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Guide Section */}
                <div className="bg-brand-50 border border-brand-100 p-3 rounded-xl flex gap-2 text-brand-850 text-xs">
                    <BookOpen className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold mb-0.5">Panduan Penggunaan Kalkulator</h4>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-[10px] text-brand-700/80">
                            <li>Harga berubah otomatis saat Provinsi, Bidang, atau Produk dipilih.</li>
                            <li>Sistem otomatis menyesuaikan jika ada tarif khusus wilayah.</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-3.5">
                    {/* Provinsi */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Provinsi Fasilitas Produksi</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={provinceId}
                            onChange={e => setProvinceId(e.target.value)}
                        >
                            <option value="">Pilih Provinsi...</option>
                            {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Kabupaten */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Kabupaten / Kota Fasilitas Produksi</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                            value={regencyId}
                            onChange={e => setRegencyId(e.target.value)}
                            disabled={!provinceId}
                        >
                            <option value="">Pilih Kabupaten...</option>
                            {regencies.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    {/* Bidang + Produk */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Bidang</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={businessTypeId}
                                onChange={e => { setBusinessTypeId(e.target.value); setProductId(''); }}
                            >
                                <option value="">Pilih Bidang...</option>
                                {businessTypes.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Produk</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={productId}
                                onChange={e => setProductId(e.target.value)}
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
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Skala Usaha</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={businessScaleId}
                            onChange={e => setBusinessScaleId(e.target.value)}
                        >
                            <option value="">Pilih Skala...</option>
                            {scales.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Kecamatan (opsional) */}
                    {provinceId && regencyId && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Kecamatan (Opsional)</label>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                                value={districtId}
                                onChange={e => setDistrictId(e.target.value)}
                                disabled={!regencyId}
                            >
                                <option value="">Pilih Kecamatan...</option>
                                {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Quantities */}
                    <div className={`grid ${isAdvisorOrManager ? 'grid-cols-2' : 'grid-cols-3'} gap-3 border-t border-gray-100 pt-3.5`}>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jumlah Cabang</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={branchCount}
                                onChange={e => setBranchCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jumlah Produk</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={productCount}
                                onChange={e => setProductCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        {!isAdvisorOrManager && (
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jumlah Manday</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
                                    value={mandays}
                                    onChange={e => setMandays(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </div>
                        )}
                    </div>

                    {/* Optional Components */}
                    {masterComponents.filter(c => c && c.category && !c.is_mandatory && c.category.toUpperCase() !== 'PENDAMPINGAN').length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Komponen Pilihan Master Biaya</label>
                            <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                {masterComponents
                                    .filter(c => c && c.category && !c.is_mandatory && c.category.toUpperCase() !== 'PENDAMPINGAN')
                                    .map(comp => {
                                        const isChecked = selectedOptionalComponentIds.includes(comp.id);
                                        return (
                                            <label key={comp.id} className="flex items-center gap-2 cursor-pointer select-none text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        if (isChecked) {
                                                            setSelectedOptionalComponentIds(selectedOptionalComponentIds.filter(id => id !== comp.id));
                                                        } else {
                                                            setSelectedOptionalComponentIds([...selectedOptionalComponentIds, comp.id]);
                                                        }
                                                    }}
                                                    className="w-3.5 h-3.5 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                                />
                                                <div className="flex-1 text-gray-700 font-medium text-[11px]">{comp.name}</div>
                                                <div className="text-[10px] text-gray-500 font-bold">{formatCurrency(comp.base_amount)}</div>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Biaya Tambahan (Opsional) */}
                    <div className="border-t border-gray-100 pt-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Biaya Tambahan (Opsional)</label>
                        {optionalCosts.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center mb-1.5">
                                <span className="flex-1 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">{opt.name}</span>
                                <span className="w-1/3 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 text-right font-medium">{formatCurrency(opt.amount)}</span>
                                <button onClick={() => removeOptionalCost(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        <div className="flex gap-2 mt-1.5">
                            <input
                                type="text"
                                placeholder="Nama Biaya..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={newOptName}
                                onChange={e => setNewOptName(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Nominal..."
                                className="w-1/3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={newOptAmount}
                                onChange={e => setNewOptAmount(e.target.value)}
                            />
                            <button onClick={addOptionalCost} className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-900 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Download Estimasi Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-brand-700 text-white font-bold py-3 rounded-lg shadow-md shadow-brand-100 hover:bg-brand-800 transition-all flex items-center justify-center gap-1.5 text-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Simpan & Unduh Estimasi (PDF)
                    </button>
                </div>
            </div>

            {/* Right Column: Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-gray-50/50 p-5 rounded-xl border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-bold text-brand-700 mb-4 border-b border-gray-200 pb-2">Detail Hasil Perhitungan</h3>

                    {/* Loading state */}
                    {loadingComponents && (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-xs">Memuat komponen biaya...</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loadingComponents && breakdown.length === 0 && (
                        <div className="text-center py-12 text-gray-400 italic text-xs">
                            Pilih Jenis Bidang, Produk, dan Skala Usaha untuk melihat rincian biaya.
                        </div>
                    )}

                    {/* Breakdown List */}
                    {!loadingComponents && breakdown.length > 0 && (
                        <div className="space-y-2.5">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                <div className="col-span-8">Komponen</div>
                                <div className="col-span-4 text-right">Harga</div>
                            </div>

                            {breakdown.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center py-2 px-3 rounded-lg border bg-white border-gray-100 shadow-sm transition-all">
                                    <div className="col-span-8">
                                        <p className="font-semibold text-xs text-gray-700 leading-tight">
                                            {item.name}
                                        </p>
                                        <span className="text-[8px] px-1 bg-gray-100 text-gray-600 rounded font-bold uppercase">
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <span className={`font-bold text-xs ${
                                            item.category === 'DISKON' ? 'text-red-700' : 'text-brand-700'
                                        }`}>
                                            {item.total < 0 ? `- ${formatCurrency(Math.abs(item.total))}` : formatCurrency(item.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grand Total */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-3.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-600 text-sm">Grand Total</span>
                        <span className="bg-brand-50 text-brand-700 border border-brand-100 px-4 py-2 rounded-xl text-base font-black">
                            {formatCurrency(total)}
                        </span>
                    </div>
                    
                    {/* Disclaimer section */}
                    <div className="bg-amber-50 border border-amber-100 text-amber-900 p-3 rounded-lg text-[10px] leading-relaxed italic">
                        <b>Catatan Penting:</b> Perhitungan di atas adalah estimasi biaya berdasarkan kriteria simulasi. Biaya sesungguhnya belum tentu persis sebesar ini dan dapat disesuaikan kembali tergantung pada keadaan riil dari usaha/fasilitas produksi Anda.
                    </div>
                </div>
            </div>
        </div>
    );
}
