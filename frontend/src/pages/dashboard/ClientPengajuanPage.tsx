import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
    Building2, 
    UserCheck, 
    CheckCircle2, 
    ArrowRight, 
    AlertCircle, 
    Search, 
    Loader2, 
    HelpCircle, 
    Sparkles, 
    FileCheck,
    Layers,
    MapPin,
    Tag,
    Calculator,
    Package,
    Ticket,
    X,
    Percent,
    ShieldCheck,
    Lock,
    Hash
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import FileUpload from '../../components/dashboard/FileUpload';
import type { FormFieldConfig } from '../../types';
import type { Voucher } from '../../types/voucher';
import { voucherService } from '../../services/voucherService';
import { resolveFileUrl, formatRupiah } from '../../utils/format';
import PrivacyConsentModal from '../../components/common/PrivacyConsentModal';

interface AdvisorInfo {
    id: string;
    full_name: string;
    referral_code: string;
    role: string;
    phone?: string;
    avatar_url?: string;
}

interface MasterOption {
    id: number;
    name: string;
    business_type_id?: number;
}

export default function ClientPengajuanPage() {
    const navigate = useNavigate();
    const currentUser = useAuthStore(state => state.user);

    // ==========================================
    // 1. INFORMASI PELAKU USAHA (Kontak & KTP)
    // ==========================================
    const [clientName, setClientName] = useState(currentUser?.full_name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [nik, setNik] = useState('');
    const [ktpUrl, setKtpUrl] = useState('');

    // ==========================================
    // 2. INFORMASI USAHA & OPERASIONAL (Harga & Layanan)
    // ==========================================
    const [businessName, setBusinessName] = useState('');
    const [nib, setNib] = useState('');
    const [nibFileUrl, setNibFileUrl] = useState('');
    const [businessScaleId, setBusinessScaleId] = useState<string>('');
    const [businessTypeId, setBusinessTypeId] = useState<string>('');
    const [productCategoryId, setProductCategoryId] = useState<string>('');
    const [productName, setProductName] = useState('');
    const [productCount, setProductCount] = useState<number>(1);
    const [branchCount, setBranchCount] = useState<number>(1);
    const [address, setAddress] = useState(currentUser?.address || '');
    const [provinceId, setProvinceId] = useState<string>(currentUser?.province_id ? String(currentUser.province_id) : '');
    const [regencyId, setRegencyId] = useState<string>(currentUser?.regency_id ? String(currentUser.regency_id) : '');
    const [productPhotoUrl, setProductPhotoUrl] = useState('');

    // Master Data States
    const [businessScales, setBusinessScales] = useState<MasterOption[]>([]);
    const [businessTypes, setBusinessTypes] = useState<MasterOption[]>([]);
    const [productCategories, setProductCategories] = useState<MasterOption[]>([]);
    const [provinces, setProvinces] = useState<MasterOption[]>([]);
    const [regencies, setRegencies] = useState<MasterOption[]>([]);

    // ==========================================
    // 3. PENUNJUKAN HALAL ADVISOR
    // ==========================================
    const [advisorCode, setAdvisorCode] = useState('');
    const [advisorInfo, setAdvisorInfo] = useState<AdvisorInfo | null>(null);
    const [checkingAdvisor, setCheckingAdvisor] = useState(false);
    const [advisorCheckError, setAdvisorCheckError] = useState<string | null>(null);

    // ==========================================
    // 4. KLAIM VOUCHER / KODE PROMO
    // ==========================================
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [checkingVoucher, setCheckingVoucher] = useState(false);
    const [voucherError, setVoucherError] = useState<string | null>(null);

    // Dynamic Form Fields Configured by Admin
    const [formConfigs, setFormConfigs] = useState<FormFieldConfig[]>([]);
    const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
    const [loadingConfigs, setLoadingConfigs] = useState(true);

    // Consent & Privacy Policy states
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Submit state
    const [submitting, setSubmitting] = useState(false);

    // Load Master Data & Admin Form Configurations
    useEffect(() => {
        setLoadingConfigs(true);
        Promise.all([
            api.get('/form-config/CLIENT_SUBMISSION').catch(() => ({ data: [] })),
            api.get('/billing-config/business-scales').catch(() => ({ data: [] })),
            api.get('/billing-config/business-types').catch(() => ({ data: [] })),
            api.get('/billing-config/product-categories').catch(() => ({ data: [] })),
            api.get('/geography/provinces').catch(() => ({ data: [] })),
        ])
        .then(([cfgRes, scaleRes, typeRes, catRes, provRes]) => {
            setFormConfigs(cfgRes.data || []);
            setBusinessScales(scaleRes.data || []);
            setBusinessTypes(typeRes.data || []);
            setProductCategories(catRes.data || []);
            setProvinces(provRes.data || []);

            // Set default scale if available
            if (scaleRes.data && scaleRes.data.length > 0 && !businessScaleId) {
                setBusinessScaleId(String(scaleRes.data[0].id));
            }
        })
        .finally(() => setLoadingConfigs(false));
    }, []);

    // Load Regencies when Province changes
    useEffect(() => {
        if (provinceId) {
            api.get(`/geography/regencies/${provinceId}`)
                .then(res => setRegencies(res.data || []))
                .catch(() => setRegencies([]));
        } else {
            setRegencies([]);
        }
    }, [provinceId]);

    // Check Advisor Code Lookup
    const handleCheckAdvisor = async (codeToCheck?: string) => {
        const code = (codeToCheck !== undefined ? codeToCheck : advisorCode).trim();
        if (!code) {
            setAdvisorInfo(null);
            setAdvisorCheckError(null);
            return;
        }

        setCheckingAdvisor(true);
        setAdvisorCheckError(null);
        try {
            const res = await api.get(`/auth/advisors/lookup?code=${encodeURIComponent(code)}`);
            setAdvisorInfo(res.data);
            toast.success(`Advisor terhubung: ${res.data.full_name}`);
        } catch (err: any) {
            setAdvisorInfo(null);
            const errMsg = err.response?.data?.error || 'Nomor registrasi advisor tidak ditemukan.';
            setAdvisorCheckError(errMsg);
        } finally {
            setCheckingAdvisor(false);
        }
    };

    // Auto-verify advisor on debounce if user stops typing
    useEffect(() => {
        if (!advisorCode.trim()) {
            setAdvisorInfo(null);
            setAdvisorCheckError(null);
            return;
        }
        const timer = setTimeout(() => {
            handleCheckAdvisor(advisorCode);
        }, 600);
        return () => clearTimeout(timer);
    }, [advisorCode]);

    // Check Voucher Code
    const handleCheckVoucher = async () => {
        const code = voucherCode.trim().toUpperCase();
        if (!code) {
            setVoucherError('Masukkan kode voucher terlebih dahulu');
            return;
        }
        setCheckingVoucher(true);
        setVoucherError(null);
        try {
            const res = await voucherService.validate({
                code,
                amount: 1000000,
                service_type: 'PENDING_CONSULTATION'
            });
            if (res.valid && res.voucher) {
                setAppliedVoucher(res.voucher);
                toast.success(`Voucher "${res.voucher.code}" berhasil diterapkan!`);
            } else {
                setAppliedVoucher(null);
                setVoucherError(res.message || 'Kode voucher tidak valid atau sudah kedaluwarsa');
                toast.error(res.message || 'Kode voucher tidak valid');
            }
        } catch (err: any) {
            setAppliedVoucher(null);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Kode voucher tidak valid atau kedaluwarsa';
            setVoucherError(msg);
            toast.error(msg);
        } finally {
            setCheckingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode('');
        setVoucherError(null);
        toast.success('Voucher berhasil dibatalkan');
    };

    const handleDynamicFieldChange = (fieldKey: string, value: string) => {
        setDynamicValues(prev => ({ ...prev, [fieldKey]: value }));
    };

    // Filter dynamic custom fields (exclude standard core fields that have dedicated UI inputs)
    const standardKeys = [
        'business_name', 'client_name', 'nik', 'phone', 'address', 'product_name', 
        'ktp', 'nib', 'nib_file', 'foto_produk', 'advisor_code', 
        'business_scale', 'business_type', 'product_category', 'product_count', 'branch_count'
    ];
    const extraCustomFields = formConfigs.filter(f => !standardKeys.includes(f.field_key) && (f.is_active !== false));

    // Filter product categories by selected business type if applicable
    const filteredCategories = businessTypeId
        ? productCategories.filter(cat => !cat.business_type_id || String(cat.business_type_id) === businessTypeId)
        : productCategories;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validations
        if (!clientName.trim()) {
            toast.error("Nama penanggung jawab / pemilik usaha wajib diisi.");
            return;
        }
        if (!phone.trim()) {
            toast.error("Nomor WhatsApp/HP aktif wajib diisi.");
            return;
        }
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15 || !/^(\+62|62|08)[0-9]{8,13}$/.test(cleanPhone)) {
            toast.error("Format nomor WhatsApp tidak valid (contoh: 08123456789 atau +628123456789).");
            return;
        }
        if (!businessName.trim()) {
            toast.error("Nama usaha / merek dagang wajib diisi.");
            return;
        }

        if (!agreedPrivacy) {
            toast.error("Harap centang persetujuan Kebijakan Privasi & Penggunaan Data sebelum mengirim pengajuan.");
            return;
        }

        // Strict NIK validation if filled
        if (nik.trim()) {
            const cleanNik = nik.replace(/\D/g, '');
            if (cleanNik.length !== 16) {
                toast.error("NIK harus terdiri dari tepat 16 digit angka.");
                return;
            }
        }

        // Strict NIB validation if filled
        if (nib.trim()) {
            const cleanNib = nib.replace(/\D/g, '');
            if (cleanNib.length !== 13) {
                toast.error("NIB harus terdiri dari tepat 13 digit angka.");
                return;
            }
        }

        // Check required fields from Admin config
        for (const cfg of formConfigs) {
            if (cfg.is_active === false) continue;
            if (cfg.is_required) {
                if (cfg.field_key === 'client_name' && !clientName.trim()) {
                    toast.error(`${cfg.field_label} wajib diisi.`);
                    return;
                }
                if (cfg.field_key === 'phone' && !phone.trim()) {
                    toast.error(`${cfg.field_label} wajib diisi.`);
                    return;
                }
                if (cfg.field_key === 'nik') {
                    if (!nik.trim()) {
                        toast.error(`${cfg.field_label} wajib diisi.`);
                        return;
                    }
                    if (nik.replace(/\D/g, '').length !== 16) {
                        toast.error(`${cfg.field_label} harus tepat 16 digit angka.`);
                        return;
                    }
                }
                if (cfg.field_key === 'ktp' && !ktpUrl.trim()) {
                    toast.error(`${cfg.field_label} wajib diunggah.`);
                    return;
                }
                if (cfg.field_key === 'business_name' && !businessName.trim()) {
                    toast.error(`${cfg.field_label} wajib diisi.`);
                    return;
                }
                if (cfg.field_key === 'nib') {
                    if (!nib.trim()) {
                        toast.error(`${cfg.field_label} wajib diisi.`);
                        return;
                    }
                    if (nib.replace(/\D/g, '').length !== 13) {
                        toast.error(`${cfg.field_label} harus tepat 13 digit angka.`);
                        return;
                    }
                }
                if (cfg.field_key === 'address' && !address.trim()) {
                    toast.error(`${cfg.field_label} wajib diisi.`);
                    return;
                }
                // Custom fields check
                if (!standardKeys.includes(cfg.field_key) && !dynamicValues[cfg.field_key]?.trim()) {
                    toast.error(`${cfg.field_label} wajib diisi.`);
                    return;
                }
            }
        }

        setSubmitting(true);
        try {
            // Prepare field_values array
            const fieldValuesPayload: any[] = [];

            // Add standard document URLs if uploaded with flexible key lookup
            if (ktpUrl) {
                const ktpCfg = formConfigs.find(f => ['ktp', 'dokumen_ktp', 'foto_ktp', 'file_ktp', 'ktp_file'].includes(f.field_key));
                if (ktpCfg) fieldValuesPayload.push({ form_field_id: ktpCfg.id, file_url: ktpUrl });
            }
            if (nibFileUrl) {
                const nibCfg = formConfigs.find(f => ['nib_file', 'dokumen_nib', 'file_nib', 'nib_doc', 'nib_url'].includes(f.field_key));
                if (nibCfg) fieldValuesPayload.push({ form_field_id: nibCfg.id, file_url: nibFileUrl });
            }
            if (productPhotoUrl) {
                const photoCfg = formConfigs.find(f => ['foto_produk', 'product_photo', 'product_photo_url', 'foto_produk_url', 'dokumen_produk'].includes(f.field_key));
                if (photoCfg) fieldValuesPayload.push({ form_field_id: photoCfg.id, file_url: productPhotoUrl });
            }

            // Add extra custom fields
            for (const [key, val] of Object.entries(dynamicValues)) {
                const cfg = formConfigs.find(f => f.field_key === key);
                if (cfg && val) {
                    if (cfg.input_type === 'FILE_UPLOAD') {
                        fieldValuesPayload.push({ form_field_id: cfg.id, file_url: val });
                    } else if (cfg.input_type === 'LINK') {
                        fieldValuesPayload.push({ form_field_id: cfg.id, link_value: val });
                    } else {
                        fieldValuesPayload.push({ form_field_id: cfg.id, text_value: val });
                    }
                }
            }

            const payload = {
                client_data: {
                    business_name: businessName,
                    client_name: clientName,
                    nik: nik,
                    phone: phone,
                    address: address,
                    product_name: productName,
                    nib: nib,
                    ktp_url: ktpUrl || undefined,
                    nib_file_url: nibFileUrl || undefined,
                    product_photo_url: productPhotoUrl || undefined,
                    service_type: 'PENDING_CONSULTATION',
                    advisor_code: advisorInfo ? advisorInfo.referral_code : (advisorCode.trim() || undefined),
                    facilitator_id: advisorInfo ? advisorInfo.id : undefined,
                    business_scale_id: businessScaleId ? Number(businessScaleId) : undefined,
                    business_type_id: businessTypeId ? Number(businessTypeId) : undefined,
                    product_category_id: productCategoryId ? Number(productCategoryId) : undefined,
                    product_count: Number(productCount) || 1,
                    branchCount: Number(branchCount) || 1,
                    branch_count: Number(branchCount) || 1,
                    province_id: provinceId ? Number(provinceId) : undefined,
                    regency_id: regencyId ? Number(regencyId) : undefined,
                    voucher_code: appliedVoucher ? appliedVoucher.code : undefined,
                },
                field_values: fieldValuesPayload
            };

            const res = await api.post('/submissions/create-full', payload);

            if (appliedVoucher) {
                try {
                    await voucherService.apply({
                        code: appliedVoucher.code,
                        amount: 0,
                        reference_type: 'SUBMISSION',
                        reference_no: res.data.tracking_number || res.data.id,
                        submission_id: res.data.id,
                        user_name: clientName,
                        user_phone: phone
                    });
                } catch (vErr) {
                    console.error('Gagal mencatat pemakaian voucher:', vErr);
                }
            }

            toast.success('Pengajuan berhasil dibuat! Data usaha Anda telah tersimpan.');
            navigate(`/dashboard/submissions/${res.data.id}`);
        } catch (err: any) {
            console.error("Gagal membuat pengajuan", err);
            toast.error(err.response?.data?.error || err.message || 'Gagal membuat pengajuan');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 px-4 sm:px-6 py-6 pb-24">
            {/* Header Title Banner */}
            <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/10 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest border border-white/20">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Pendaftaran Sertifikasi Halal
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Form Pengajuan Pelaku Usaha
                    </h1>
                    <p className="text-white/80 text-sm max-w-2xl font-medium leading-relaxed">
                        Lengkapi informasi pelaku usaha dan rincian operasional usaha Anda di bawah ini. Data usaha akan digunakan untuk perhitungan estimasi harga dan penentuan jalur sertifikasi oleh Halal Advisor.
                    </p>
                </div>
            </div>

            {loadingConfigs && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    <span>Memuat konfigurasi formulir pengajuan...</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Security and Privacy Notice Banner */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-emerald-700" /> Keamanan & Kerahasiaan Data Klien Terjamin
                            </h4>
                            <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed font-medium">
                                NIK, berkas KTP, dan dokumen legalitas usaha Anda dienkripsi secara aman sesuai standar regulasi Pelindungan Data Pribadi (UU PDP).
                            </p>
                        </div>
                    </div>
                    <span className="hidden md:inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-white text-emerald-750 px-2.5 py-1 rounded-lg border border-emerald-200">
                        256-Bit SSL Encrypted
                    </span>
                </div>

                {/* ========================================================= */}
                {/* CARD 1: INFORMASI PELAKU USAHA (Kontak, KTP, NIK)         */}
                {/* ========================================================= */}
                <div className="bg-white rounded-3xl border border-blue-100/80 p-6 sm:p-8 shadow-sm space-y-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">1. Informasi Pelaku Usaha</h2>
                                <p className="text-xs text-gray-500 font-medium">Identitas pemilik atau penanggung jawab legal pengajuan</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                            Identitas Pemilik
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nama Penanggung Jawab */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Nama Pemilik / Penanggung Jawab <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                placeholder="Nama lengkap sesuai KTP"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Nomor WhatsApp / HP */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Nomor WhatsApp / Kontak Aktif <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                inputMode="tel"
                                maxLength={15}
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white font-mono"
                                placeholder="Contoh: 081234567890"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, '').slice(0, 15))}
                                required
                            />
                        </div>

                        {/* NIK */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5 text-gray-400" /> NIK Penanggung Jawab (16 Digit)
                                </label>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    nik.length === 16 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {nik.length}/16 Digit
                                </span>
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={16}
                                className={`glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white font-mono tracking-wider ${
                                    nik && nik.length !== 16 ? 'border-amber-300 ring-1 ring-amber-100' : ''
                                }`}
                                placeholder="Masukkan 16 digit nomor NIK (KTP)"
                                value={nik}
                                onChange={e => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            />
                        </div>

                        {/* Upload Foto KTP */}
                        <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-150 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-gray-900">
                                    Foto e-KTP Penanggung Jawab
                                </label>
                                {ktpUrl && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" /> Terunggah
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Format JPG, PNG, atau PDF (Maksimal 2MB).
                            </p>
                            <FileUpload
                                subfolder="ktp"
                                label={ktpUrl ? "Ganti Foto KTP" : "Unggah Foto e-KTP"}
                                onUploadSuccess={url => setKtpUrl(url)}
                            />
                            {ktpUrl && (
                                <a 
                                    href={resolveFileUrl(ktpUrl)} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                                >
                                    <FileCheck className="w-3.5 h-3.5" /> Lihat file KTP terunggah
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* CARD 2: INFORMASI USAHA & OPERASIONAL (Penentuan Harga)    */}
                {/* ========================================================= */}
                <div className="bg-white rounded-3xl border border-indigo-100/80 p-6 sm:p-8 shadow-sm space-y-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">2. Informasi Usaha & Operasional</h2>
                                <p className="text-xs text-gray-500 font-medium">Data profil dan kapasitas usaha untuk menentukan estimasi harga & skema layanan</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                            <Calculator className="w-3.5 h-3.5" /> Penentu Harga Layanan
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nama Usaha */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Nama Usaha / Merek Dagang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                placeholder="Contoh: CV Berkah Abadi, Kopi Kenangan, Dapur Halal"
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                required
                            />
                        </div>

                        {/* NIB (Nomor & File) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5 text-gray-400" /> Nomor Induk Berusaha (NIB)
                                </label>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    nib.length === 13 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {nib.length}/13 Digit
                                </span>
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={13}
                                className={`glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white font-mono tracking-wider ${
                                    nib && nib.length !== 13 ? 'border-amber-300 ring-1 ring-amber-100' : ''
                                }`}
                                placeholder="Masukkan 13 digit nomor NIB OSS jika ada"
                                value={nib}
                                onChange={e => setNib(e.target.value.replace(/\D/g, '').slice(0, 13))}
                            />
                        </div>

                        {/* Upload Dokumen NIB */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700">
                                    Dokumen NIB OSS (Opsional)
                                </label>
                                {nibFileUrl && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" /> Terunggah
                                    </span>
                                )}
                            </div>
                            <FileUpload
                                subfolder="nib"
                                label={nibFileUrl ? "Ganti Dokumen NIB" : "Unggah File NIB (PDF/Gambar)"}
                                onUploadSuccess={url => setNibFileUrl(url)}
                            />
                            {nibFileUrl && (
                                <a 
                                    href={resolveFileUrl(nibFileUrl)} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                                >
                                    <FileCheck className="w-3.5 h-3.5" /> Lihat berkas NIB
                                </a>
                            )}
                        </div>

                        {/* Skala Usaha */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Skala Usaha (Komponen Biaya)
                            </label>
                            <select
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                value={businessScaleId}
                                onChange={e => setBusinessScaleId(e.target.value)}
                            >
                                <option value="">-- Pilih Skala Usaha --</option>
                                {businessScales.map(scale => (
                                    <option key={scale.id} value={scale.id}>{scale.name}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-400 font-medium">Contoh: Usaha Mikro (omzet &le; Rp2M), Usaha Kecil, Menengah, Besar</p>
                        </div>

                        {/* Jenis Usaha / Kategori Bisnis */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-indigo-600" /> Jenis Usaha / Bidang Bisnis
                            </label>
                            <select
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                value={businessTypeId}
                                onChange={e => {
                                    setBusinessTypeId(e.target.value);
                                    setProductCategoryId('');
                                }}
                            >
                                <option value="">-- Pilih Jenis Usaha --</option>
                                {businessTypes.map(bt => (
                                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Kategori Produk */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-indigo-600" /> Kategori Produk
                            </label>
                            <select
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                value={productCategoryId}
                                onChange={e => setProductCategoryId(e.target.value)}
                            >
                                <option value="">-- Pilih Kategori Produk --</option>
                                {filteredCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Nama Produk / Varian */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Nama Produk / Varian yang Diajukan
                            </label>
                            <input
                                type="text"
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                placeholder="Contoh: Aneka Keripik Singkong, Roti Manis, Sambal Kemasan"
                                value={productName}
                                onChange={e => setProductName(e.target.value)}
                            />
                        </div>

                        {/* Jumlah Produk */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Jumlah Produk / Menu / Varian
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                placeholder="1"
                                value={productCount}
                                onChange={e => setProductCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                            <p className="text-[10px] text-gray-400 font-medium">Berapa varian produk yang akan disertifikasi halal</p>
                        </div>

                        {/* Jumlah Cabang / Pabrik */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Jumlah Cabang / Outlet / Pabrik
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                placeholder="1"
                                value={branchCount}
                                onChange={e => setBranchCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                            <p className="text-[10px] text-gray-400 font-medium">Jumlah lokasi outlet/dapur produksi yang beroperasi</p>
                        </div>

                        {/* Wilayah Provinsi & Kabupaten/Kota */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Provinsi Lokasi Usaha
                            </label>
                            <select
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                value={provinceId}
                                onChange={e => {
                                    setProvinceId(e.target.value);
                                    setRegencyId('');
                                }}
                            >
                                <option value="">-- Pilih Provinsi --</option>
                                {provinces.map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Kota / Kabupaten Lokasi Usaha
                            </label>
                            <select
                                className="glass-input text-xs font-bold w-full bg-gray-50/50 focus:bg-white"
                                value={regencyId}
                                onChange={e => setRegencyId(e.target.value)}
                                disabled={!provinceId}
                            >
                                <option value="">-- Pilih Kota / Kabupaten --</option>
                                {regencies.map(reg => (
                                    <option key={reg.id} value={reg.id}>{reg.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Alamat Lengkap Usaha */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                Alamat Lengkap Fasilitas / Tempat Usaha
                            </label>
                            <textarea
                                rows={2}
                                className="w-full p-3 rounded-2xl border border-gray-200 text-xs font-medium bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                            />
                        </div>

                        {/* Foto Produk / Kemasan */}
                        <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-150 space-y-3 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-gray-900">
                                    Foto Produk / Kemasan Berlabel (Opsional)
                                </label>
                                {productPhotoUrl && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" /> Terunggah
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Unggah foto produk atau kemasan untuk membantu advisor mengidentifikasi bahan dan proses sertifikasi.
                            </p>
                            <FileUpload
                                subfolder="products"
                                label={productPhotoUrl ? "Ganti Foto Produk" : "Unggah Foto Produk / Brosur"}
                                onUploadSuccess={url => setProductPhotoUrl(url)}
                            />
                            {productPhotoUrl && (
                                <a 
                                    href={resolveFileUrl(productPhotoUrl)} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                                >
                                    <FileCheck className="w-3.5 h-3.5" /> Lihat foto produk terunggah
                                </a>
                            )}
                        </div>

                        {/* Extra Custom Form Fields configured dynamically by Admin */}
                        {extraCustomFields.map(field => (
                            <div key={field.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-150 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-gray-900">
                                        {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                                    </label>
                                    {dynamicValues[field.field_key] && field.input_type === 'FILE_UPLOAD' && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3" /> Terunggah
                                        </span>
                                    )}
                                </div>
                                {field.description && (
                                    <p className="text-[11px] text-gray-500 font-medium">{field.description}</p>
                                )}

                                {field.input_type === 'FILE_UPLOAD' ? (
                                    <>
                                        <FileUpload
                                            subfolder="custom"
                                            label={dynamicValues[field.field_key] ? `Ganti ${field.field_label}` : `Unggah ${field.field_label}`}
                                            onUploadSuccess={url => handleDynamicFieldChange(field.field_key, url)}
                                        />
                                        {dynamicValues[field.field_key] && (
                                            <a 
                                                href={resolveFileUrl(dynamicValues[field.field_key])} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                                            >
                                                <FileCheck className="w-3.5 h-3.5" /> Lihat file terunggah
                                            </a>
                                        )}
                                    </>
                                ) : field.input_type === 'LINK' ? (
                                    <input
                                        type="url"
                                        className="glass-input text-xs font-bold w-full bg-white"
                                        placeholder="https://..."
                                        value={dynamicValues[field.field_key] || ''}
                                        onChange={e => handleDynamicFieldChange(field.field_key, e.target.value)}
                                        required={field.is_required}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="glass-input text-xs font-bold w-full bg-white"
                                        placeholder={`Masukkan ${field.field_label}`}
                                        value={dynamicValues[field.field_key] || ''}
                                        onChange={e => handleDynamicFieldChange(field.field_key, e.target.value)}
                                        required={field.is_required}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ========================================================= */}
                {/* CARD 3: PENUNJUKAN HALAL ADVISOR (Opsional)                */}
                {/* ========================================================= */}
                <div className="bg-white rounded-3xl border border-purple-100/80 p-6 sm:p-8 shadow-sm space-y-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">3. Penunjukan Pendamping Halal (Halal Advisor)</h2>
                                <p className="text-xs text-gray-500 font-medium">Opsional: Hubungkan pengajuan dengan Halal Advisor rekanan Anda</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                            Opsional
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-150 space-y-2">
                            <p className="text-xs text-purple-900 font-bold flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                Punya Nomor Registrasi Halal Advisor?
                            </p>
                            <p className="text-xs text-purple-700/80 font-medium leading-relaxed">
                                Jika Anda sudah berkonsultasi atau direkomendasikan oleh Halal Advisor tertentu, masukkan nomor registrasi advisor di bawah ini. Pengajuan Anda akan otomatis terhubung ke advisor tersebut.
                                Jika Anda belum memiliki advisor, <strong>kosongkan kolom ini</strong> dan tim Marketing kami yang akan merekomendasikan advisor terbaik untuk Anda.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">
                                Nomor Registrasi / Kode Halal Advisor (Opsional)
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        className="glass-input text-xs font-black uppercase tracking-wider w-full pl-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="Contoh: RF-ADVISOR01 atau kode konsonan"
                                        value={advisorCode}
                                        onChange={e => setAdvisorCode(e.target.value.toUpperCase())}
                                    />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCheckAdvisor()}
                                    disabled={checkingAdvisor || !advisorCode.trim()}
                                    className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {checkingAdvisor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Cek Advisor
                                </button>
                            </div>
                        </div>

                        {/* Advisor Verified Status Card */}
                        {advisorInfo && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                                        {advisorInfo.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-gray-900">{advisorInfo.full_name}</p>
                                            <span className="text-[10px] font-black uppercase bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-md">
                                                Halal Advisor Terverifikasi
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            No. Registrasi: <span className="font-bold text-gray-700">{advisorInfo.referral_code}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Terhubung
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Advisor Check Error */}
                        {advisorCheckError && (
                            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-medium animate-fadeIn">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span>{advisorCheckError}</span>
                            </div>
                        )}

                        {/* Empty Advisor Info State */}
                        {!advisorCode.trim() && (
                            <p className="text-[11px] text-gray-400 font-medium italic">
                                * Kolom nomor registrasi advisor dikosongkan. Pengajuan akan diteruskan ke Manager Marketing untuk penunjukan advisor.
                            </p>
                        )}
                    </div>
                </div>

                {/* ========================================================= */}
                {/* CARD 4: KLAIM KODE VOUCHER / DISKON (Opsional)            */}
                {/* ========================================================= */}
                <div className="bg-white rounded-3xl border border-emerald-100/80 p-6 sm:p-8 shadow-sm space-y-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">4. Kode Promo & Voucher Diskon</h2>
                                <p className="text-xs text-gray-500 font-medium">Opsional: Masukkan voucher promo untuk mendapatkan potongan biaya sertifikasi</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            Hemat Biaya
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">
                                Masukkan Kode Voucher
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        className="glass-input text-xs font-black uppercase tracking-wider w-full pl-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="Contoh: ANA-2026 atau REGULER50"
                                        value={voucherCode}
                                        onChange={e => {
                                            setVoucherCode(e.target.value.toUpperCase());
                                            setVoucherError(null);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCheckVoucher();
                                            }
                                        }}
                                    />
                                    <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCheckVoucher}
                                    disabled={checkingVoucher || !voucherCode.trim()}
                                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {checkingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                                    Terapkan
                                </button>
                            </div>
                        </div>

                        {/* Applied Voucher Status Card */}
                        {appliedVoucher && (
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between animate-fadeIn">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                                        <Percent className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-mono font-black text-emerald-950">{appliedVoucher.code}</p>
                                            <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                                                {appliedVoucher.discount_type === 'PERCENTAGE' 
                                                    ? `${appliedVoucher.discount_value}% DISKON`
                                                    : `POTONGAN ${formatRupiah(appliedVoucher.discount_value)}`}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                            {appliedVoucher.name || 'Voucher Promo Terpasang'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveVoucher}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Hapus Voucher"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Voucher Check Error */}
                        {voucherError && (
                            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-medium animate-fadeIn">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span>{voucherError}</span>
                            </div>
                        )}

                        {!appliedVoucher && !voucherCode.trim() && (
                            <p className="text-[11px] text-gray-400 font-medium italic">
                                * Punya kode voucher diskon dari event, promosi, atau mitra? Masukkan di atas untuk mendapatkan potongan harga.
                            </p>
                        )}
                    </div>
                </div>

                {/* CONSENT & DATA PRIVACY AGREEMENT CARD */}
                <div className="p-6 rounded-3xl bg-white border border-emerald-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-emerald-800">
                            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Persetujuan & Perlindungan Data Pengajuan</h4>
                                <p className="text-[11px] text-gray-500 font-medium">Standar kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-xs font-bold text-brand-600 hover:text-brand-800 underline cursor-pointer"
                        >
                            Baca Kebijakan Privasi
                        </button>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Dengan mengirimkan formulir ini, Anda memberikan persetujuan kepada HalalCore untuk memproses dokumen legalitas, data produk, dan informasi identitas penanggung jawab hanya untuk keperluan administrasi sertifikasi halal resmi (BPJPH & LPH).
                    </p>

                    <label className="flex items-start gap-3 pt-3 border-t border-gray-100 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={agreedPrivacy}
                            onChange={(e) => setAgreedPrivacy(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 transition-all cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                            Saya telah membaca, memahami, dan menyetujui <span onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-brand-600 underline font-bold">Kebijakan Privasi & Penggunaan Data Pribadi</span> serta kebenaran dokumen yang saya lampirkan. <span className="text-red-500">*</span>
                        </span>
                    </label>
                </div>

                {/* SUBMIT BUTTON BAR */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        disabled={submitting || !agreedPrivacy}
                        className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menyimpan Pengajuan...
                            </>
                        ) : (
                            <>
                                <span>Kirim Pengajuan Sertifikasi Halal</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Privacy & Data Usage Policy Modal */}
            <PrivacyConsentModal
                isOpen={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                onAccept={() => setAgreedPrivacy(true)}
            />
        </div>
    );
}
