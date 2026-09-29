import { useEffect, useState, useCallback, useMemo } from 'react';
import { getMyForms, updateFormStatus, type TeleForm } from '../../services/teleService';
import api from '../../services/api';
import { calculateComponentCost } from '../../utils/billingCalculator';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Mail, Building2,
  Filter, Printer, MessageCircle, XCircle, Calculator,
  Sparkles, ShieldCheck, Plus, Trash2, MapPin, Package,
  Layers, CheckCircle2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-dark-100 text-dark-600 border border-dark-200',
  TELECONFERENCE_QUEUED: 'bg-brand-50 text-brand-700 border border-brand-100',
  MEETING_SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-100',
  MEETING_COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  FOLLOW_UP: 'bg-amber-50 text-amber-700 border border-amber-100',
  DEAL: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  DATA_INPUT: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-100',
  EXPIRED: 'bg-rose-50 text-rose-700 border border-rose-100',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Konsultasi Masuk',
  TELECONFERENCE_QUEUED: 'Antrian Konsultasi',
  MEETING_SCHEDULED: 'Jadwal Meet Dibuat',
  MEETING_COMPLETED: 'Konsultasi Selesai',
  FOLLOW_UP: 'Tahap Follow Up',
  DEAL: 'Deal / Disepakati',
  DATA_INPUT: 'Pengumpulan Berkas',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Tidak Aktif',
};

type OptionalCost = {
  name: string;
  amount: number;
};

export default function ClientManagement() {
  const user = useAuthStore((state) => state.user);

  // Leads list states
  const [forms, setForms] = useState<TeleForm[]>([]);
  const [totalFormsCount, setTotalFormsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<TeleForm | null>(null);

  // Master Data States for Calculator
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [scales, setScales] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});

  // Dynamic Master Biaya Components
  const [masterComponents, setMasterComponents] = useState<any[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [salesSchemePrice, setSalesSchemePrice] = useState<any | null>(null);

  // Active Calculator Configuration for Selected Client
  const [serviceType, setServiceType] = useState<'REGULER' | 'SELF_DECLARE_MANDIRI' | 'SELF_DECLARE'>('REGULER');
  const [provinceId, setProvinceId] = useState('');
  const [regencyId, setRegencyId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [productId, setProductId] = useState('');
  const [businessScaleId, setBusinessScaleId] = useState('');
  const [salesSchemeId, setSalesSchemeId] = useState('');

  const [branchCount, setBranchCount] = useState(1);
  const [productCount, setProductCount] = useState(1);
  const [optionalQuantities, setOptionalQuantities] = useState<Record<number, number>>({});
  const [selectedOptionalComponentIds, setSelectedOptionalComponentIds] = useState<number[]>([]);
  const [optionalCosts, setOptionalCosts] = useState<OptionalCost[]>([]);
  const [newOptName, setNewOptName] = useState('');
  const [newOptAmount, setNewOptAmount] = useState('');
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [duration, setDuration] = useState('14 - 21 Hari Kerja');
  const [notes, setNotes] = useState('Pendampingan verifikasi bahan baku, penyusunan berkas manual SJPH, dan pendampingan audit hingga terbit sertifikat halal resmi.');
  const [advisorName, setAdvisorName] = useState('Tim HalalCore Indonesia');

  // Load all master reference data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [btRes, pRes, bsRes, provRes, scRes, sysRes] = await Promise.all([
          api.get('/billing-config/business-types').catch(() => ({ data: [] })),
          api.get('/billing-config/product-categories').catch(() => ({ data: [] })),
          api.get('/billing-config/business-scales').catch(() => ({ data: [] })),
          api.get('/geography/provinces').catch(() => ({ data: [] })),
          api.get('/billing-config/sales-schemes').catch(() => ({ data: [] })),
          api.get('/system-settings').catch(() => ({ data: {} }))
        ]);

        setBusinessTypes(btRes.data || []);
        setProducts(pRes.data || []);
        setScales(bsRes.data || []);
        setProvinces(provRes.data || []);
        setSchemes(scRes.data || []);

        const settingsMap: Record<string, string> = {};
        if (sysRes.data && Array.isArray(sysRes.data)) {
          sysRes.data.forEach((s: any) => { settingsMap[s.key] = s.value; });
        } else if (sysRes.data && typeof sysRes.data === 'object') {
          Object.assign(settingsMap, sysRes.data);
        }
        setSystemSettings(settingsMap);
      } catch (err) {
        console.error('Failed to load master configuration', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch consultation leads list
  const fetchForms = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await getMyForms(params);
      setForms(res.data.data || []);
      setTotalFormsCount(res.data.total);
    } catch {
      toast.error('Gagal memuat data konsultasi klien');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchForms();
  };

  // Geography cascading: Province -> Regencies
  useEffect(() => {
    if (provinceId) {
      api.get(`/geography/regencies/${provinceId}`).then(res => setRegencies(res.data || [])).catch(() => setRegencies([]));
    } else {
      setRegencies([]);
      setRegencyId('');
    }
  }, [provinceId]);

  // Geography cascading: Regency -> Districts
  useEffect(() => {
    if (regencyId) {
      api.get(`/geography/districts/${regencyId}`).then(res => setDistricts(res.data || [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
      setDistrictId('');
    }
  }, [regencyId]);

  // Fetch Master Biaya components dynamically based on all selected parameters
  const fetchComponents = useCallback(async () => {
    if (!selectedForm) return;
    setLoadingComponents(true);
    try {
      const params: Record<string, string> = {};
      if (businessTypeId) params.business_type_id = businessTypeId;
      if (productId) params.product_category_id = productId;
      if (businessScaleId) params.business_scale_id = businessScaleId;
      if (provinceId) params.province_id = provinceId;
      if (regencyId) params.regency_id = regencyId;
      if (districtId) params.district_id = districtId;
      if (serviceType) params.service_type = serviceType;
      params.data_source = 'ORGANIK';
      if (salesSchemeId) params.sales_scheme_id = salesSchemeId;
      params.resolve_geography = 'true';

      const promises: [Promise<any>, Promise<any>?] = [
        api.get('/billing-config/components', { params })
      ];

      if (salesSchemeId && serviceType === 'REGULER') {
        const priceParams: Record<string, string> = {
          sales_scheme_id: salesSchemeId,
          is_active: 'true',
          data_source: 'ORGANIK'
        };
        if (businessTypeId) priceParams.business_type_id = businessTypeId;
        if (businessScaleId) priceParams.business_scale_id = businessScaleId;
        promises.push(api.get('/billing-config/scheme-prices', { params: priceParams }));
      }

      const [compRes, priceRes] = await Promise.all(promises);
      setMasterComponents(compRes.data || []);

      if (priceRes && priceRes.data && priceRes.data.length > 0) {
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
      console.error('Failed to load pricing components:', err);
    } finally {
      setLoadingComponents(false);
    }
  }, [selectedForm, businessTypeId, productId, businessScaleId, provinceId, regencyId, districtId, salesSchemeId, serviceType]);

  // Re-fetch master components whenever relevant filter changes in modal
  useEffect(() => {
    if (selectedForm) {
      fetchComponents();
    }
  }, [selectedForm, businessTypeId, productId, businessScaleId, provinceId, regencyId, districtId, salesSchemeId, serviceType, fetchComponents]);

  // Prepopulate Calculator with Client Data
  const handleOpenDetail = (form: TeleForm) => {
    setSelectedForm(form);

    // 1. Determine Initial Service Type
    let detectedType: 'REGULER' | 'SELF_DECLARE_MANDIRI' | 'SELF_DECLARE' = 'SELF_DECLARE_MANDIRI';
    if (form.uses_meat || form.is_catering || form.business_scale === 'MENENGAH' || form.business_scale === 'BESAR' || form.route_type === 'REGULER') {
      detectedType = 'REGULER';
    } else if (form.self_declare_type === 'MANDIRI' || form.route_type === 'SELF_DECLARE') {
      detectedType = 'SELF_DECLARE_MANDIRI';
    } else if (form.route_type === 'SELF_DECLARE_SEHATI') {
      detectedType = 'SELF_DECLARE';
    }
    setServiceType(detectedType);

    // 2. Resolve Province
    const initialProvId = form.province_id ? form.province_id.toString() : '';
    setProvinceId(initialProvId);
    setRegencyId('');
    setDistrictId('');

    // 3. Resolve Business Scale
    const matchedScale = scales.find(
      s => s.code === form.business_scale || s.name?.toLowerCase() === form.business_scale?.toLowerCase()
    );
    setBusinessScaleId(matchedScale ? matchedScale.id.toString() : (scales[0]?.id?.toString() || ''));

    // 4. Resolve Business Type & Product Category
    const matchedBt = businessTypes.find(bt => {
      const lowerBt = (bt.name || '').toLowerCase();
      if (form.is_catering && (lowerBt.includes('katering') || lowerBt.includes('resto') || lowerBt.includes('kuliner'))) return true;
      if (form.uses_meat && (lowerBt.includes('daging') || lowerBt.includes('sembelih') || lowerBt.includes('rph'))) return true;
      if (form.is_amdk && (lowerBt.includes('air') || lowerBt.includes('minum') || lowerBt.includes('amdk'))) return true;
      return false;
    });
    setBusinessTypeId(matchedBt ? matchedBt.id.toString() : (businessTypes[0]?.id?.toString() || ''));

    const matchedProd = products.find(p => {
      const lowerP = (p.name || '').toLowerCase();
      if (form.is_amdk && lowerP.includes('minuman')) return true;
      if (form.uses_meat && (lowerP.includes('daging') || lowerP.includes('makanan'))) return true;
      return lowerP.includes('makanan');
    });
    setProductId(matchedProd ? matchedProd.id.toString() : (products[0]?.id?.toString() || ''));

    // 5. Quantities & Schemes
    setBranchCount(Math.max(1, form.branch_count || 1));
    setProductCount(1);
    setSalesSchemeId(schemes[0]?.id?.toString() || '1');
    setOptionalQuantities({});
    setSelectedOptionalComponentIds([]);
    setOptionalCosts([]);
    setCustomDiscount(0);

    // 6. Notes & Advisor
    if (detectedType === 'REGULER') {
      setDuration('21 - 35 Hari Kerja');
      setNotes('Pendampingan audit lapangan LPH, verifikasi fasilitas produksi, pengujian dokumen bahan kritis, dan sidang fatwa komite halal MUI.');
    } else if (detectedType === 'SELF_DECLARE_MANDIRI') {
      setDuration('7 - 14 Hari Kerja');
      setNotes('Pendampingan intensif verifikasi bahan baku, penyusunan manual SJPH, validasi LP3H, dan percepatan penerbitan sertifikat halal BPJPH.');
    } else {
      setDuration('12 - 21 Hari Kerja');
      setNotes('Program Fasilitasi SEHATI BPJPH khusus UMK dengan produk berisiko rendah dan bahan baku bersertifikat halal.');
    }

    setAdvisorName(form.telemarketer?.full_name || user?.full_name || 'Tim HalalCore Indonesia');
  };

  const handleUpdateStatus = async (formId: string, status: string) => {
    try {
      await updateFormStatus(formId, status);
      toast.success('Status konsultasi diperbarui');
      if (selectedForm && selectedForm.id === formId) {
        setSelectedForm(prev => prev ? { ...prev, status } : null);
      }
      fetchForms();
    } catch {
      toast.error('Gagal memperbarui status');
    }
  };

  const addOptionalCost = () => {
    if (!newOptName || !newOptAmount) return;
    setOptionalCosts([...optionalCosts, { name: newOptName, amount: parseFloat(newOptAmount) }]);
    setNewOptName('');
    setNewOptAmount('');
    toast.success('Biaya opsional ditambahkan');
  };

  const removeOptionalCost = (index: number) => {
    const updated = [...optionalCosts];
    updated.splice(index, 1);
    setOptionalCosts(updated);
  };

  // ─── Reactive Calculation Engine from Master Data ───
  const { total, breakdown, activeMandayComponents } = useMemo(() => {
    if (serviceType === 'SELF_DECLARE') {
      return {
        total: 0,
        breakdown: [
          {
            name: 'Program Self Declare SEHATI (Subsidi BPJPH Rp 0)',
            category: 'SELF_DECLARE',
            unit_cost: 0,
            multiplier: null,
            total: 0,
            is_optional: false
          }
        ],
        activeMandayComponents: []
      };
    }

    let currentTotal = 0;
    const currentBreakdown: any[] = [];

    // 1. Resolve Mandatory Components from Master Biaya with Hierarchical Specificity
    const categoryMap = new Map<string, any>();
    
    masterComponents.forEach(comp => {
      if (!comp || !comp.category || !comp.is_mandatory) return;
      const compSt = comp.service_type || 'REGULER';
      if (compSt !== 'BOTH' && compSt !== 'ALL' && serviceType && compSt !== serviceType) return;
      const cat = comp.category.toUpperCase();
      if (cat === 'PENDAMPINGAN') return;

      if (comp.province_id && comp.province_id.toString() !== provinceId) return;
      if (comp.regency_id && comp.regency_id.toString() !== regencyId) return;
      if (comp.district_id && comp.district_id.toString() !== districtId) return;
      if (comp.business_type_id && comp.business_type_id.toString() !== businessTypeId) return;
      if (comp.product_category_id && comp.product_category_id.toString() !== productId) return;
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

      const normName = (comp.name || '').replace(/\s*\([^)]*(?:khusus|provinsi|wilayah|regional|jakarta|umum)[^)]*\)/gi, '').trim().toUpperCase();
      const dedupeKey = `${cat}::${normName}`;

      const existing = categoryMap.get(dedupeKey);
      if (!existing || score > existing.score) {
        categoryMap.set(dedupeKey, { ...comp, score });
      }
    });

    // 2. Handle PENDAMPINGAN (HalalCore Consulting/Assistance)
    let bestPend: any = null;
    let bestPendScore = -1;
    masterComponents.forEach(comp => {
      if (!comp || comp.category?.toUpperCase() !== 'PENDAMPINGAN') return;
      const compSt = comp.service_type || 'REGULER';
      if (compSt !== 'BOTH' && compSt !== 'ALL' && serviceType && compSt !== serviceType) return;

      if (comp.province_id && comp.province_id.toString() !== provinceId) return;
      if (comp.regency_id && comp.regency_id.toString() !== regencyId) return;
      if (comp.district_id && comp.district_id.toString() !== districtId) return;
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
        bestPend = comp;
      }
    });

    let finalPrice = 0;
    let dispName = 'Jasa Pendampingan & Konsultasi SJPH';
    let dispCategory = 'PENDAMPINGAN';
    let pendDiscountPercent = 0;

    if (bestPend) {
      finalPrice = bestPend.base_amount || bestPend.amount || 0;
      dispName = bestPend.name;
      dispCategory = bestPend.category.toUpperCase();
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
      finalPrice = sysCost ? parseFloat(sysCost) : 1500000;
      dispName = 'Jasa Pendampingan Self Declare Mandiri HalalCore';
      dispCategory = 'PENDAMPINGAN';
    }

    const pendType = bestPend?.type || bestPend?.component_type || (serviceType === 'REGULER' ? 'PER_CABANG' : 'FIXED');
    const pendCustomQty = (bestPend && optionalQuantities[bestPend.id]) || 1;
    const pendCost = calculateComponentCost(
      pendType,
      finalPrice,
      bestPend?.product_tiers,
      productCount,
      branchCount,
      pendCustomQty
    );

    const pendMultiplier = pendCost.multiplier;
    const pendMultiplierLabel = pendCost.multiplierLabel;
    const basePendTotal = pendCost.totalAmount;
    const pendUnitCost = pendCost.unitCost;

    if (finalPrice > 0) {
      currentBreakdown.push({
        name: dispName + pendMultiplierLabel,
        category: dispCategory,
        unit_cost: pendUnitCost,
        multiplier: pendMultiplier > 1 ? pendMultiplier : null,
        total: basePendTotal,
        is_optional: false
      });
      currentTotal += basePendTotal;

      if (pendDiscountPercent > 0) {
        const discAmount = basePendTotal * (pendDiscountPercent / 100);
        currentBreakdown.push({
          name: `Diskon ${dispName} (${pendDiscountPercent}%)`,
          category: 'DISKON',
          unit_cost: -(discAmount / pendMultiplier),
          multiplier: pendMultiplier > 1 ? pendMultiplier : null,
          total: -discAmount,
          is_optional: false
        });
        currentTotal -= discAmount;
      }
    }

    // 3. Add Mandatory Non-Pendampingan Components (BPJPH, Audit LPH, MUI)
    Array.from(categoryMap.values()).forEach(comp => {
      let nameTag = '';
      if (comp.district_id) nameTag = ' [Khusus Kecamatan]';
      else if (comp.regency_id) nameTag = ' [Khusus Wilayah Kab/Kota]';
      else if (comp.province_id) nameTag = ' [Khusus Provinsi]';

      const customQty = optionalQuantities[comp.id] || 1;
      const cost = calculateComponentCost(
        comp.type || comp.component_type || 'FIXED',
        comp.base_amount || comp.amount || 0,
        comp.product_tiers,
        productCount,
        branchCount,
        customQty
      );

      const baseAmount = cost.totalAmount;
      let itemTotal = baseAmount;
      let discountAmount = 0;
      if (comp.discount_percent && comp.discount_percent > 0) {
        discountAmount = baseAmount * (comp.discount_percent / 100);
        itemTotal = baseAmount - discountAmount;
      }

      currentBreakdown.push({
        name: comp.name + nameTag + cost.multiplierLabel,
        category: comp.category.toUpperCase(),
        unit_cost: cost.unitCost,
        multiplier: cost.multiplier > 1 ? cost.multiplier : null,
        total: baseAmount,
        is_optional: false
      });

      if (discountAmount > 0) {
        currentBreakdown.push({
          name: `Diskon ${comp.name} (${comp.discount_percent}%)`,
          category: 'DISKON',
          unit_cost: -(discountAmount / cost.multiplier),
          multiplier: cost.multiplier > 1 ? cost.multiplier : null,
          total: -discountAmount,
          is_optional: false
        });
      }
      currentTotal += itemTotal;
    });

    // Collect manday components that require quantity input
    const mandayList: any[] = [];
    if (bestPend && ((bestPend.type || bestPend.component_type || '').includes('PER_MANDAY')) && finalPrice > 0) {
      mandayList.push(bestPend);
    }
    Array.from(categoryMap.values()).forEach(comp => {
      if ((comp.type || comp.component_type || '').includes('PER_MANDAY')) {
        mandayList.push(comp);
      }
    });

    // 4. Partnership Scheme Discount
    const currentScheme = schemes.find((s: any) => s.id === parseInt(salesSchemeId));
    if (currentScheme && currentScheme.name.toUpperCase() === 'PARTNERSHIP' && serviceType === 'REGULER') {
      const pendItem = currentBreakdown.find(item => item.category === 'PENDAMPINGAN');
      if (pendItem) {
        const discountAmount = pendItem.total * 0.1;
        currentBreakdown.push({
          name: 'Diskon Skema Partnership (10%)',
          category: 'DISKON',
          unit_cost: -(discountAmount / pendMultiplier),
          multiplier: pendMultiplier > 1 ? pendMultiplier : null,
          total: -discountAmount,
          is_optional: false
        });
        currentTotal -= discountAmount;
      }
    }

    // 5. Selected Master Optional Components
    masterComponents.forEach(comp => {
      if (!comp || !comp.category || comp.is_mandatory) return;
      if (comp.category.toUpperCase() === 'PENDAMPINGAN') return;
      const compSt = comp.service_type || 'REGULER';
      if (compSt !== 'BOTH' && compSt !== 'ALL' && serviceType && compSt !== serviceType) return;

      const shouldInclude = selectedOptionalComponentIds.includes(comp.id);
      if (!shouldInclude) return;

      const customQty = optionalQuantities[comp.id] || 1;
      const cost = calculateComponentCost(
        comp.type || comp.component_type || 'FIXED',
        comp.base_amount || comp.amount || 0,
        comp.product_tiers,
        productCount,
        branchCount,
        customQty
      );

      const baseAmount = cost.totalAmount;
      let itemTotal = baseAmount;
      let discountAmount = 0;
      if (comp.discount_percent && comp.discount_percent > 0) {
        discountAmount = baseAmount * (comp.discount_percent / 100);
        itemTotal = baseAmount - discountAmount;
      }

      let nameTag = '';
      if (comp.district_id) nameTag = ' [Khusus Kecamatan]';
      else if (comp.regency_id) nameTag = ' [Khusus Kab/Kota]';
      else if (comp.province_id) nameTag = ' [Khusus Provinsi]';

      currentBreakdown.push({
        id: comp.id,
        name: comp.name + nameTag + cost.multiplierLabel,
        category: comp.category.toUpperCase(),
        unit_cost: cost.unitCost,
        multiplier: cost.multiplier > 1 ? cost.multiplier : null,
        total: baseAmount,
        is_optional: true
      });

      if (discountAmount > 0) {
        currentBreakdown.push({
          name: `Diskon ${comp.name} (${comp.discount_percent}%)`,
          category: 'DISKON',
          unit_cost: -(discountAmount / cost.multiplier),
          multiplier: cost.multiplier > 1 ? cost.multiplier : null,
          total: -discountAmount,
          is_optional: true
        });
      }
      currentTotal += itemTotal;
    });

    // 6. User Custom Optional Costs
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

    // 7. Manual Promo Discount
    if (customDiscount > 0) {
      currentBreakdown.push({
        name: 'Potongan / Diskon Tambahan Khusus',
        category: 'DISKON',
        unit_cost: -customDiscount,
        multiplier: null,
        total: -customDiscount,
        is_optional: false
      });
      currentTotal -= customDiscount;
    }

    return {
      total: Math.max(0, currentTotal),
      breakdown: currentBreakdown,
      activeMandayComponents: mandayList
    };
  }, [
    masterComponents, salesSchemePrice, optionalCosts, salesSchemeId, schemes, branchCount,
    optionalQuantities, productCount, selectedOptionalComponentIds, serviceType, systemSettings,
    provinceId, regencyId, districtId, businessTypeId, productId, businessScaleId, customDiscount
  ]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCleanPhone = (phone: string) => {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const handlePrintEstimate = () => {
    window.print();
  };

  const handleSendWhatsappEstimate = () => {
    if (!selectedForm) return;
    const phone = formatCleanPhone(selectedForm.phone);
    const selectedProv = provinces.find(p => p.id.toString() === provinceId)?.name || selectedForm.province?.name || 'Indonesia';
    const selectedScaleName = scales.find(s => s.id.toString() === businessScaleId)?.name || selectedForm.business_scale;
    const selectedSchemeName = schemes.find(s => s.id.toString() === salesSchemeId)?.name || 'Standard';

    const schemeTitle = serviceType === 'REGULER'
      ? `Sertifikasi Halal Reguler BPJPH (Paket ${selectedSchemeName})`
      : serviceType === 'SELF_DECLARE_MANDIRI'
      ? 'Self Declare Mandiri (Pendampingan HalalCore)'
      : 'Self Declare SEHATI (Subsidi Pemerintah BPJPH)';

    const breakdownText = breakdown
      .map((it, idx) => `${idx + 1}. *${it.name}*: ${formatRupiah(it.total)}`)
      .join('\n');

    const text = `Halo Bapak/Ibu *${selectedForm.name}* (${selectedForm.business_type}),\n\nTerima kasih telah berkonsultasi dengan *HalalCore Indonesia* mengenai bimbingan Sertifikat Halal Resmi BPJPH.\n\nBerikut rincian kalkulasi estimasi biaya penawaran terstandarisasi kami sesuai data usaha Anda:\n━━━━━━━━━━━━━━━━━━\n📋 *Skema Layanan*: ${schemeTitle}\n📍 *Wilayah*: ${selectedProv}\n🏢 *Skala Usaha*: ${selectedScaleName}\n📦 *Spesifikasi*: ${branchCount} Outlet / Fasilitas &bull; ${productCount} Varian Produk (SKU)\n⏱️ *Estimasi Durasi*: ${duration}\n\n*Rincian Komponen Biaya:*\n${breakdownText}\n──────────────────\n💰 *TOTAL ESTIMASI BIAYA: ${formatRupiah(total)}*\n━━━━━━━━━━━━━━━━━━\n📌 *Catatan Layanan:*\n${notes}\n\nJika ada pertanyaan lebih lanjut atau ingin segera memproses penerbitan sertifikat halal, silakan balas pesan WhatsApp ini.\n\nSalam hormat,\n*${advisorName}*\nHalalCore - PT Ana Nahnu Indonesia`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalPages = Math.ceil(totalFormsCount / 15);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-600" /> Manajemen Konsultasi Klien
          </h1>
          <p className="text-dark-500 text-xs sm:text-sm font-medium mt-1">
            Kelola data leads konsultasi halal, hitung estimasi harga dari Master Biaya & Wilayah terintegrasi, dan kirim penawaran resmi.
          </p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-dark-200 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
            placeholder="Cari nama klien, merek usaha, nomor WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
          <select
            className="pl-9 pr-8 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-dark-200 bg-white focus:outline-none focus:border-brand-500 text-dark-700 min-w-[200px]"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Semua Status Konsultasi</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Leads Table ─── */}
      <div className="bg-white rounded-2xl border border-dark-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-dark-700">
            <thead className="bg-dark-50/80 border-b border-dark-100 text-[11px] uppercase tracking-wider text-dark-500 font-bold">
              <tr>
                <th className="py-3.5 px-5">Klien / Pemohon</th>
                <th className="py-3.5 px-4">Kontak WhatsApp</th>
                <th className="py-3.5 px-4">Merek & Usaha</th>
                <th className="py-3.5 px-4">Metode Konsultasi</th>
                <th className="py-3.5 px-4">Status Konsultasi</th>
                <th className="py-3.5 px-4">Tanggal Masuk</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-dark-400">
                    <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs mt-2 font-medium">Memuat data konsultasi klien...</p>
                  </td>
                </tr>
              ) : forms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-dark-400 text-xs font-semibold">
                    Tidak ada data konsultasi klien yang cocok
                  </td>
                </tr>
              ) : (
                forms.map((form, i) => {
                  const cleanPhone = formatCleanPhone(form.phone);
                  return (
                    <motion.tr
                      key={form.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-brand-50/20 transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="py-4 px-5">
                        <p className="text-sm font-bold text-dark-900 leading-tight">{form.name}</p>
                        <p className="text-[10px] text-dark-400 font-mono mt-0.5">ID: {form.id.slice(0, 8)}</p>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
                            title="Chat WhatsApp Klien"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{form.phone}</span>
                          </a>
                          {form.email && (
                            <span className="text-[11px] text-dark-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-dark-400" /> {form.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Business & Scale */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                          <span className="text-xs font-bold text-dark-900 line-clamp-1">{form.business_type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-dark-100 text-dark-700">
                            {form.business_scale.replace('_', ' ')}
                          </span>
                          {form.province?.name && (
                            <span className="text-[10px] text-dark-400 truncate max-w-[120px]">
                              {form.province.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Consultation Method */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-dark-50 text-dark-700 border-dark-200">
                          {form.consultation_method === 'ONLINE_MEET' ? '📹 Video Call Meet' : '💬 Chat WhatsApp'}
                        </span>
                        {form.branch_count > 1 && (
                          <span className="ml-1.5 text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {form.branch_count} Outlet
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold inline-block ${STATUS_COLORS[form.status] || 'bg-dark-100 text-dark-600'}`}>
                          {STATUS_LABELS[form.status] || form.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-[11px] text-dark-500">
                        {new Date(form.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(form)}
                          className="px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold transition-all border border-brand-200/60 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          title="Buka Detail & Estimasi Biaya Real"
                        >
                          <Calculator className="w-3.5 h-3.5 text-brand-600" />
                          <span>Detail & Estimasi</span>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-100 bg-dark-50/40">
            <span className="text-xs text-dark-500 font-semibold">{totalFormsCount} total permohonan konsultasi</span>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === i + 1
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-dark-600 bg-white border border-dark-200 hover:bg-dark-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Comprehensive Consultation Detail & Real Master Pricing Modal ─── */}
      <AnimatePresence>
        {selectedForm && (
          <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 15 }}
              className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-dark-150 flex flex-col custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Sticky Header */}
              <div className="p-4 sm:p-5 border-b border-dark-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-brand-900 flex items-center gap-2">
                      Detail Klien & Kalkulator Estimasi Biaya
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        Master Data Real-Time
                      </span>
                    </h3>
                    <p className="text-[11px] text-dark-500 font-medium">
                      Pemohon: <strong>{selectedForm.name}</strong> &bull; Merek: <strong>{selectedForm.business_type}</strong> &bull; Kontak: <strong>{selectedForm.phone}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintEstimate}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20 flex items-center gap-1.5 cursor-pointer"
                    title="Cetak Surat Penawaran Estimasi Harga"
                  >
                    <Printer className="w-4 h-4 text-gold-300" />
                    <span>Print Penawaran</span>
                  </button>

                  <button
                    onClick={() => setSelectedForm(null)}
                    className="p-2 rounded-xl text-dark-400 hover:text-dark-700 hover:bg-dark-50 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-7 space-y-6 flex-1">
                {/* ─── Row 1: Client Overview & Status Banner ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Client Profile */}
                  <div className="bg-brand-50/40 rounded-2xl p-4 border border-brand-100 space-y-2">
                    <div className="flex items-center gap-2 border-b border-brand-100/80 pb-2">
                      <Building2 className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs font-extrabold text-brand-950 uppercase tracking-wider">
                        Profil Pemohon
                      </h4>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-dark-500">Nama:</span>
                        <span className="font-bold text-dark-900">{selectedForm.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${formatCleanPhone(selectedForm.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" /> {selectedForm.phone}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Email:</span>
                        <span className="font-medium text-dark-800">{selectedForm.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Merek Usaha:</span>
                        <span className="font-extrabold text-brand-900">{selectedForm.business_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Consultation Specs */}
                  <div className="bg-dark-50/60 rounded-2xl p-4 border border-dark-200 space-y-2">
                    <div className="flex items-center gap-2 border-b border-dark-200 pb-2">
                      <ShieldCheck className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-wider">
                        Karakteristik Produk
                      </h4>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-dark-500">Metode Konsul:</span>
                        <span className="font-bold text-dark-900">
                          {selectedForm.consultation_method === 'ONLINE_MEET' ? '📹 Online Meet' : '💬 Chat WA'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Bahan Hewan/Daging:</span>
                        <span className={`font-bold ${selectedForm.uses_meat ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {selectedForm.uses_meat ? 'Ya (Sembelihan)' : 'Tidak'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Restoran/Katering:</span>
                        <span className={`font-bold ${selectedForm.is_catering ? 'text-amber-700' : 'text-dark-700'}`}>
                          {selectedForm.is_catering ? 'Ya' : 'Tidak'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Air Minum / AMDK:</span>
                        <span className={`font-bold ${selectedForm.is_amdk ? 'text-amber-700' : 'text-dark-700'}`}>
                          {selectedForm.is_amdk ? 'Ya' : 'Tidak'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Status Action */}
                  <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-between space-y-2">
                    <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                        Update Status Leads
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] text-emerald-900 font-semibold block">
                        Status Saat Ini: <span className="font-extrabold">{STATUS_LABELS[selectedForm.status] || selectedForm.status}</span>
                      </label>
                      <select
                        value={selectedForm.status}
                        onChange={(e) => handleUpdateStatus(selectedForm.id, e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-white text-dark-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-dark-400">
                      Masuk: {new Date(selectedForm.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* ─── Row 2: Real Master-Data Calculator ─── */}
                <div className="bg-white rounded-3xl border-2 border-brand-100 p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Calculator Header & Service Mode Tabs */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-gold-500" />
                        <h4 className="text-sm font-black text-brand-950 uppercase tracking-wider">
                          Kalkulator Penetapan Biaya Sesuai Master Biaya & Wilayah
                        </h4>
                      </div>
                      {loadingComponents && (
                        <span className="text-xs text-brand-600 font-bold flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menghitung komponen master...
                        </span>
                      )}
                    </div>

                    {/* 3 Core Service Modes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Mode 1: Reguler */}
                      <button
                        type="button"
                        onClick={() => {
                          setServiceType('REGULER');
                          setDuration('21 - 35 Hari Kerja');
                          setNotes('Pendampingan audit lapangan LPH, verifikasi fasilitas produksi, pengujian dokumen bahan kritis, dan sidang fatwa komite halal MUI.');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          serviceType === 'REGULER'
                            ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-xs'
                            : 'border-dark-200 hover:border-brand-300 bg-white'
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 inline-block mb-1">
                          Audit LPH + Fatwa MUI
                        </span>
                        <h5 className="font-extrabold text-dark-900 text-xs">
                          Sertifikasi Halal Reguler
                        </h5>
                        <p className="text-[11px] font-bold text-brand-700 mt-1">
                          Otomatis hitung LPH, BPJPH & Wilayah
                        </p>
                      </button>

                      {/* Mode 2: Self Declare Mandiri */}
                      <button
                        type="button"
                        onClick={() => {
                          setServiceType('SELF_DECLARE_MANDIRI');
                          setDuration('7 - 14 Hari Kerja');
                          setNotes('Pendampingan intensif verifikasi bahan baku, penyusunan manual SJPH, validasi LP3H, dan percepatan penerbitan sertifikat halal BPJPH.');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          serviceType === 'SELF_DECLARE_MANDIRI'
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-dark-200 hover:border-indigo-300 bg-white'
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 inline-block mb-1">
                          Pendampingan Khusus UMK
                        </span>
                        <h5 className="font-extrabold text-dark-900 text-xs">
                          Self Declare Mandiri
                        </h5>
                        <p className="text-[11px] font-bold text-indigo-700 mt-1">
                          Standar Pendampingan HalalCore
                        </p>
                      </button>

                      {/* Mode 3: Self Declare SEHATI */}
                      <button
                        type="button"
                        onClick={() => {
                          setServiceType('SELF_DECLARE');
                          setDuration('12 - 21 Hari Kerja');
                          setNotes('Program Fasilitasi SEHATI BPJPH khusus UMK dengan produk berisiko rendah dan bahan baku bersertifikat halal.');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          serviceType === 'SELF_DECLARE'
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-dark-200 hover:border-emerald-300 bg-white'
                        }`}
                      >
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 inline-block mb-1">
                          Subsidi Pemerintah BPJPH
                        </span>
                        <h5 className="font-extrabold text-dark-900 text-xs">
                          Self Declare (SEHATI)
                        </h5>
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">
                          Gratis Rp 0 (Syarat Kuota BPJPH)
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* ─── Parameter Controls Grid (Wilayah, Kategori, Skala, Volume) ─── */}
                  <div className="bg-dark-50/70 p-4 sm:p-5 rounded-2xl border border-dark-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {/* 1. Provinsi */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-600" /> Provinsi:
                        </label>
                        <select
                          value={provinceId}
                          onChange={(e) => setProvinceId(e.target.value)}
                          className="w-full form-input text-xs font-semibold bg-white"
                        >
                          <option value="">-- Pilih / Semua Provinsi --</option>
                          {provinces.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Kabupaten / Kota */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1">
                          Kabupaten / Kota:
                        </label>
                        <select
                          value={regencyId}
                          onChange={(e) => setRegencyId(e.target.value)}
                          disabled={!provinceId}
                          className="w-full form-input text-xs font-semibold bg-white disabled:bg-dark-100 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Semua Kab/Kota --</option>
                          {regencies.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Kecamatan */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1">
                          Kecamatan:
                        </label>
                        <select
                          value={districtId}
                          onChange={(e) => setDistrictId(e.target.value)}
                          disabled={!regencyId}
                          className="w-full form-input text-xs font-semibold bg-white disabled:bg-dark-100 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Semua Kecamatan --</option>
                          {districts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Skala Usaha */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-brand-600" /> Skala Usaha:
                        </label>
                        <select
                          value={businessScaleId}
                          onChange={(e) => setBusinessScaleId(e.target.value)}
                          className="w-full form-input text-xs font-semibold bg-white"
                        >
                          {scales.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 5. Jenis Usaha */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-brand-600" /> Jenis Usaha:
                        </label>
                        <select
                          value={businessTypeId}
                          onChange={(e) => setBusinessTypeId(e.target.value)}
                          className="w-full form-input text-xs font-semibold bg-white"
                        >
                          {businessTypes.map(bt => (
                            <option key={bt.id} value={bt.id}>{bt.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 6. Kategori Produk */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-brand-600" /> Kategori Produk:
                        </label>
                        <select
                          value={productId}
                          onChange={(e) => setProductId(e.target.value)}
                          className="w-full form-input text-xs font-semibold bg-white"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 7. Skema Penjualan / Paket */}
                      {serviceType === 'REGULER' && (
                        <div>
                          <label className="text-dark-700 font-bold block mb-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Skema Penjualan (Paket):
                          </label>
                          <select
                            value={salesSchemeId}
                            onChange={(e) => setSalesSchemeId(e.target.value)}
                            className="w-full form-input text-xs font-bold text-brand-900 bg-white"
                          >
                            {schemes.map(sc => (
                              <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* 8. Jumlah Cabang */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1">
                          Jumlah Cabang / Outlet:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={branchCount}
                          onChange={(e) => setBranchCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full form-input text-xs font-bold"
                        />
                      </div>

                      {/* 9. Jumlah SKU Produk */}
                      <div>
                        <label className="text-dark-700 font-bold block mb-1">
                          Jumlah Varian Produk (SKU):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={productCount}
                          onChange={(e) => setProductCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full form-input text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Manday inputs if any manday-based component detected */}
                    {activeMandayComponents.length > 0 && (
                      <div className="pt-2 border-t border-dark-200">
                        <label className="text-xs font-extrabold text-brand-950 block mb-2">
                          Penyesuaian Qty / Hari Kerja (Manday) Komponen Terdeteksi:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {activeMandayComponents.map(comp => (
                            <div key={comp.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-dark-200">
                              <span className="text-[11px] font-bold text-dark-800 line-clamp-1 max-w-[160px]">{comp.name}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={optionalQuantities[comp.id] || 1}
                                  onChange={(e) => setOptionalQuantities({
                                    ...optionalQuantities,
                                    [comp.id]: Math.max(1, parseInt(e.target.value) || 1)
                                  })}
                                  className="w-14 px-2 py-1 text-xs border rounded-lg text-center font-bold"
                                />
                                <span className="text-[10px] text-dark-500 font-medium">Hari</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── Real Breakdown Table ─── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-dark-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Rincian Komponen Biaya Terhitung:
                      </span>
                      <span className="text-[11px] text-dark-400 font-medium">
                        {breakdown.length} komponen aktif terhitung otomatis
                      </span>
                    </div>

                    <div className="border border-dark-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-brand-50/60 border-b border-dark-200 text-brand-950 font-extrabold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">No</th>
                            <th className="py-3 px-4">Deskripsi Komponen Master</th>
                            <th className="py-3 px-3">Kategori</th>
                            <th className="py-3 px-3 text-right">Biaya Satuan</th>
                            <th className="py-3 px-3 text-center">Multiplier</th>
                            <th className="py-3 px-4 text-right w-40">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100">
                          {breakdown.map((item, idx) => {
                            const isDiscount = item.category === 'DISKON' || item.total < 0;
                            return (
                              <tr key={idx} className={`hover:bg-brand-50/20 transition-colors ${isDiscount ? 'bg-rose-50/30' : ''}`}>
                                <td className="py-2.5 px-4 text-center font-bold text-dark-400">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className={`font-bold ${isDiscount ? 'text-rose-700' : 'text-dark-900'}`}>
                                    {item.name}
                                  </span>
                                  {item.is_optional && (
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold uppercase">
                                      Opsional
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                    isDiscount ? 'bg-rose-100 text-rose-800' : 'bg-dark-100 text-dark-700'
                                  }`}>
                                    {item.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-dark-700">
                                  {formatRupiah(item.unit_cost)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-semibold text-dark-600">
                                  {item.multiplier ? `${item.multiplier}x` : '1x'}
                                </td>
                                <td className={`py-2.5 px-4 text-right font-mono font-black whitespace-nowrap ${
                                  isDiscount ? 'text-rose-600' : 'text-brand-900'
                                }`}>
                                  {formatRupiah(item.total)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ─── Optional Master Components Selector & Custom Input ─── */}
                  <div className="space-y-3 pt-2">
                    {/* Master Optional Components Checkboxes */}
                    {masterComponents.filter(c => !c.is_mandatory && c.category?.toUpperCase() !== 'PENDAMPINGAN').length > 0 && (
                      <div className="bg-dark-50/50 p-4 rounded-2xl border border-dark-200 space-y-2">
                        <label className="text-xs font-bold text-dark-800 block">
                          Pilih Komponen Tambahan Master Biaya (Opsional):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {masterComponents
                            .filter(c => !c.is_mandatory && c.category?.toUpperCase() !== 'PENDAMPINGAN')
                            .map(comp => {
                              const isChecked = selectedOptionalComponentIds.includes(comp.id);
                              return (
                                <label
                                  key={comp.id}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-500/20'
                                      : 'bg-white border-dark-200 hover:border-dark-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedOptionalComponentIds([...selectedOptionalComponentIds, comp.id]);
                                      } else {
                                        setSelectedOptionalComponentIds(selectedOptionalComponentIds.filter(id => id !== comp.id));
                                      }
                                    }}
                                    className="form-checkbox w-4 h-4 text-brand-600 rounded cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-dark-900 truncate">{comp.name}</p>
                                    <p className="text-[10px] text-dark-500 font-mono">
                                      {formatRupiah(comp.base_amount || comp.amount || 0)}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Quick Add Custom Line Item */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nama komponen kustom (misal: Biaya Uji Lab Bahan / Transport Tambahan)..."
                        value={newOptName}
                        onChange={(e) => setNewOptName(e.target.value)}
                        className="form-input text-xs flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Nominal (IDR)..."
                        value={newOptAmount}
                        onChange={(e) => setNewOptAmount(e.target.value)}
                        className="form-input text-xs w-full sm:w-44 font-mono"
                      />
                      <button
                        type="button"
                        onClick={addOptionalCost}
                        className="px-4 py-2 rounded-xl bg-dark-100 hover:bg-dark-200 text-dark-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Baris Kustom
                      </button>
                    </div>

                    {/* List of custom optional items */}
                    {optionalCosts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {optionalCosts.map((opt, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900"
                          >
                            <span>{opt.name}: {formatRupiah(opt.amount)}</span>
                            <button
                              type="button"
                              onClick={() => removeOptionalCost(idx)}
                              className="text-amber-700 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ─── Notes, Duration, Promo Discount, Advisor ─── */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-dark-100">
                    <div className="md:col-span-8 space-y-3">
                      <div>
                        <label className="form-label font-bold text-dark-900 text-xs">
                          Catatan & Ruang Lingkup Layanan
                        </label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="form-input text-xs resize-none"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 space-y-3">
                      <div>
                        <label className="form-label font-bold text-dark-900 text-xs">
                          Potongan / Diskon Tambahan Khusus (IDR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          value={customDiscount || ''}
                          onChange={(e) => setCustomDiscount(Math.max(0, Number(e.target.value) || 0))}
                          className="form-input text-xs font-mono font-bold text-rose-600"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="form-label font-bold text-dark-900 text-xs">
                          Estimasi Durasi Pengerjaan
                        </label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="form-input text-xs font-semibold text-dark-900"
                          placeholder="Contoh: 14 - 21 Hari Kerja"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ─── Grand Total & Actions Banner ─── */}
                  <div className="p-5 rounded-2xl bg-brand-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                    <div>
                      <span className="text-[11px] text-brand-200 uppercase tracking-widest font-bold block">
                        Total Estimasi Biaya Sertifikasi Halal:
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-gold-300">
                        {formatRupiah(total)}
                      </span>
                      <span className="text-[11px] text-brand-300 block mt-0.5">
                        Tipe: {serviceType === 'REGULER' ? 'Reguler Master' : serviceType === 'SELF_DECLARE_MANDIRI' ? 'Self Declare Mandiri' : 'Self Declare SEHATI (Rp 0)'} &bull; {breakdown.length} Komponen
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleSendWhatsappEstimate}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" /> Kirim Rincian ke WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintEstimate}
                        className="px-4 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-brand-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Cetak / Print Penawaran
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-dark-100 bg-dark-50/50 flex items-center justify-between">
                <span className="text-xs text-dark-500 font-mono">
                  ID Dokumen: EST-HC-{selectedForm.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="btn-secondary text-xs py-2 px-5 font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── PRINTABLE OFFICIAL ESTIMATE DOCUMENT (Formatted for A4 Print) ─── */}
      {selectedForm && (
        <div id="printable-estimate-document" className="hidden print:block font-sans text-slate-900">
          {/* Header Kop Surat Resmi */}
          <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-emerald-900 tracking-tight">
                HALAL CORE INDONESIA
              </h1>
              <p className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                PT Ana Nahnu Indonesia &bull; Pendampingan Sertifikasi Halal Resmi BPJPH
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Website: telemarketing.halalcore.id &bull; Layanan Konsultasi: 0812-3456-7890 &bull; Email: info@halalcore.id
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-xs rounded-lg uppercase tracking-wider">
                Surat Estimasi Biaya
              </span>
              <p className="text-xs font-mono text-slate-600 mt-1">
                No: EST/HC/{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}/{selectedForm.id.slice(0, 6).toUpperCase()}
              </p>
              <p className="text-xs text-slate-500">
                Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer Profile */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider block mb-1">
                Penerima Penawaran / Klien:
              </span>
              <p className="font-extrabold text-sm text-slate-900">{selectedForm.name}</p>
              <p className="text-slate-600">WhatsApp/Telp: {selectedForm.phone}</p>
              <p className="text-slate-600">Email: {selectedForm.email || '-'}</p>
              <p className="text-slate-600">Wilayah: {provinces.find(p => p.id.toString() === provinceId)?.name || selectedForm.province?.name || 'Indonesia'}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider block mb-1">
                Spesifikasi Usaha & Produk:
              </span>
              <p className="font-extrabold text-sm text-slate-900">{selectedForm.business_type}</p>
              <p className="text-slate-600">Skala Usaha: {scales.find(s => s.id.toString() === businessScaleId)?.name || selectedForm.business_scale}</p>
              <p className="text-slate-600">Jumlah Outlet / Cabang: {branchCount} Lokasi</p>
              <p className="text-slate-600">Jumlah Varian Produk: {productCount} SKU</p>
            </div>
          </div>

          {/* Itemized Pricing Table */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              Rincian Komponen Biaya Layanan ({serviceType === 'REGULER' ? 'Sertifikasi Reguler BPJPH' : serviceType === 'SELF_DECLARE_MANDIRI' ? 'Self Declare Mandiri' : 'Self Declare SEHATI'})
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-emerald-900 text-white font-bold">
                <tr>
                  <th className="border border-slate-300 p-2 text-center w-12">No</th>
                  <th className="border border-slate-300 p-2 text-left">Deskripsi Komponen Layanan</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Kategori</th>
                  <th className="border border-slate-300 p-2 text-right w-36">Biaya Satuan</th>
                  <th className="border border-slate-300 p-2 text-right w-36">Total (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {breakdown.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">{it.name}</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{it.category}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{formatRupiah(it.unit_cost)}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">{formatRupiah(it.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-extrabold text-xs">
                <tr>
                  <td colSpan={4} className="border border-slate-300 p-2.5 text-right uppercase text-slate-900">
                    Total Estimasi Biaya Sertifikasi Halal:
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right text-emerald-900 font-mono text-sm">
                    {formatRupiah(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms & Notes */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/30 mb-8 text-[11px] text-slate-700 space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase text-[10px]">Ketentuan & Catatan Layanan:</h4>
            <p>&bull; <strong>Estimasi Durasi Pengerjaan:</strong> {duration} terhitung sejak seluruh berkas dinyatakan lengkap.</p>
            <p>&bull; <strong>Catatan Khusus:</strong> {notes}</p>
            <p>&bull; Surat estimasi ini berlaku selama 14 hari sejak tanggal diterbitkan sebagai acuan penawaran bimbingan sertifikasi halal.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-xs text-center pt-2">
            <div>
              <p className="font-semibold text-slate-500 mb-14">Menyetujui, Klien / Pelaku Usaha</p>
              <p className="font-extrabold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px]">
                ( {selectedForm.name} )
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-500 mb-14">Halal Advisor Telemarketing,</p>
              <p className="font-extrabold text-emerald-900 border-t border-slate-400 pt-1 inline-block min-w-[180px]">
                ( {advisorName} )
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
