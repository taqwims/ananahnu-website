import { useState, useEffect } from 'react';
import { 
    Headphones, 
    Save, 
    RotateCcw, 
    MessageSquare, 
    Building2, 
    ExternalLink, 
    Share2, 
    CheckCircle2, 
    Copy,
    Info,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemSettings } from '../../../hooks/useSystemSettings';
import { formatWhatsAppUrl } from '../../../utils/format';

export function ContactSettingsTab() {
    const { settings, loading, isSaving, fetchSettings, updateBatch } = useSystemSettings();

    // Form local state
    const [formData, setFormData] = useState({
        // 1. WhatsApp Customer Service (CS) & Bantuan
        CS_PHONE: '',
        CS_NAME: '',
        SUPPORT_EMAIL: '',
        OPERATIONAL_HOURS: '',
        WHATSAPP_DEFAULT_MESSAGE: '',

        // 2. WhatsApp Konsultasi & Marketing
        CONSULTATION_PHONE: '',
        CONSULTATION_MESSAGE: '',
        sameAsCsPhone: true,

        // 3. Perusahaan & Legal
        COMPANY_NAME: '',
        BRAND_NAME: '',
        COMPANY_EMAIL: '',
        COMPANY_PHONE: '',
        COMPANY_ADDRESS: '',
        COMPANY_WEBSITE: '',

        // 4. Media Sosial
        SOCIAL_INSTAGRAM: '',
        SOCIAL_TIKTOK: '',
        SOCIAL_YOUTUBE: '',
        SOCIAL_LINKEDIN: '',
    });

    // Populate from settings when loaded
    useEffect(() => {
        if (!loading && settings) {
            const csPhone = settings['CS_PHONE'] || settings['admin_whatsapp_number'] || settings['cs_phone'] || '6281564955280';
            const consultPhone = settings['CONSULTATION_PHONE'] || settings['consultation_phone'] || csPhone;

            setFormData({
                CS_PHONE: csPhone,
                CS_NAME: settings['CS_NAME'] || settings['cs_name'] || 'Customer Support HalalCore',
                SUPPORT_EMAIL: settings['SUPPORT_EMAIL'] || settings['support_email'] || 'support@halalcore.id',
                OPERATIONAL_HOURS: settings['OPERATIONAL_HOURS'] || settings['operational_hours'] || 'Senin - Jumat, 08:00 - 17:00 WIB',
                WHATSAPP_DEFAULT_MESSAGE: settings['WHATSAPP_DEFAULT_MESSAGE'] || settings['whatsapp_default_message'] || 'Halo Admin HalalCore, saya membutuhkan bantuan terkait pengajuan sertifikasi halal.',

                CONSULTATION_PHONE: consultPhone,
                CONSULTATION_MESSAGE: settings['CONSULTATION_MESSAGE'] || settings['consultation_message'] || 'Halo HalalCore, saya ingin konsultasi mengenai pengurusan Sertifikat Halal untuk usaha saya.',
                sameAsCsPhone: !settings['CONSULTATION_PHONE'] || settings['CONSULTATION_PHONE'] === csPhone,

                COMPANY_NAME: settings['COMPANY_NAME'] || settings['company_name'] || 'PT Ana Nahnu Indonesia',
                BRAND_NAME: settings['BRAND_NAME'] || settings['brand_name'] || 'HalalCore',
                COMPANY_EMAIL: settings['COMPANY_EMAIL'] || settings['company_email'] || 'info@ananahnu.id',
                COMPANY_PHONE: settings['COMPANY_PHONE'] || settings['company_phone'] || '+62 812-3456-7890',
                COMPANY_ADDRESS: settings['COMPANY_ADDRESS'] || settings['company_address'] || 'Jl. Raya Ana Nahnu No. 1, Jakarta',
                COMPANY_WEBSITE: settings['COMPANY_WEBSITE'] || settings['company_website'] || 'https://halalcore.id',

                SOCIAL_INSTAGRAM: settings['SOCIAL_INSTAGRAM'] || settings['social_instagram'] || 'https://instagram.com/halalcore.id',
                SOCIAL_TIKTOK: settings['SOCIAL_TIKTOK'] || settings['social_tiktok'] || 'https://tiktok.com/@halalcore.id',
                SOCIAL_YOUTUBE: settings['SOCIAL_YOUTUBE'] || settings['social_youtube'] || 'https://youtube.com/@halalcore',
                SOCIAL_LINKEDIN: settings['SOCIAL_LINKEDIN'] || settings['social_linkedin'] || 'https://linkedin.com/company/halalcore',
            });
        }
    }, [loading, settings]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'CS_PHONE' && prev.sameAsCsPhone) {
                next.CONSULTATION_PHONE = value;
            }
            if (field === 'sameAsCsPhone') {
                if (value) {
                    next.CONSULTATION_PHONE = prev.CS_PHONE;
                }
            }
            return next;
        });
    };

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} berhasil disalin.`);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Prepare synchronized payload (supporting both UPPERCASE and lowercase keys)
        const csPhoneClean = formData.CS_PHONE.replace(/[^0-9+]/g, '');
        const consultPhoneClean = (formData.sameAsCsPhone ? formData.CS_PHONE : formData.CONSULTATION_PHONE).replace(/[^0-9+]/g, '');

        const payload: Record<string, string> = {
            // CS WhatsApp
            CS_PHONE: formData.CS_PHONE,
            cs_phone: formData.CS_PHONE,
            admin_whatsapp_number: csPhoneClean,
            CS_NAME: formData.CS_NAME,
            cs_name: formData.CS_NAME,
            SUPPORT_EMAIL: formData.SUPPORT_EMAIL,
            support_email: formData.SUPPORT_EMAIL,
            OPERATIONAL_HOURS: formData.OPERATIONAL_HOURS,
            operational_hours: formData.OPERATIONAL_HOURS,
            WHATSAPP_DEFAULT_MESSAGE: formData.WHATSAPP_DEFAULT_MESSAGE,
            whatsapp_default_message: formData.WHATSAPP_DEFAULT_MESSAGE,

            // Konsultasi
            CONSULTATION_PHONE: consultPhoneClean,
            consultation_phone: consultPhoneClean,
            CONSULTATION_MESSAGE: formData.CONSULTATION_MESSAGE,
            consultation_message: formData.CONSULTATION_MESSAGE,

            // Perusahaan & Legal
            COMPANY_NAME: formData.COMPANY_NAME,
            company_name: formData.COMPANY_NAME,
            BRAND_NAME: formData.BRAND_NAME,
            brand_name: formData.BRAND_NAME,
            COMPANY_EMAIL: formData.COMPANY_EMAIL,
            company_email: formData.COMPANY_EMAIL,
            COMPANY_PHONE: formData.COMPANY_PHONE,
            company_phone: formData.COMPANY_PHONE,
            COMPANY_ADDRESS: formData.COMPANY_ADDRESS,
            company_address: formData.COMPANY_ADDRESS,
            COMPANY_WEBSITE: formData.COMPANY_WEBSITE,
            company_website: formData.COMPANY_WEBSITE,

            // Media Sosial
            SOCIAL_INSTAGRAM: formData.SOCIAL_INSTAGRAM,
            social_instagram: formData.SOCIAL_INSTAGRAM,
            SOCIAL_TIKTOK: formData.SOCIAL_TIKTOK,
            social_tiktok: formData.SOCIAL_TIKTOK,
            SOCIAL_YOUTUBE: formData.SOCIAL_YOUTUBE,
            social_youtube: formData.SOCIAL_YOUTUBE,
            SOCIAL_LINKEDIN: formData.SOCIAL_LINKEDIN,
            social_linkedin: formData.SOCIAL_LINKEDIN,
        };

        await updateBatch(payload);
    };

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 font-medium">Memuat pengaturan kontak &amp; CS...</p>
            </div>
        );
    }

    const testCsUrl = formatWhatsAppUrl(formData.CS_PHONE, formData.WHATSAPP_DEFAULT_MESSAGE);
    const testConsultUrl = formatWhatsAppUrl(formData.CONSULTATION_PHONE, formData.CONSULTATION_MESSAGE);

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Top Info Banner & Actions */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
                        <Headphones className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-gray-900">
                            Pengaturan Kontak Resmi, WhatsApp CS &amp; Perusahaan
                        </h2>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">
                            Semua nomor WhatsApp, CS, email bantuan, alamat kantor, dan medsos yang diatur di sini langsung aktif di seluruh sistem.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={() => fetchSettings()}
                        disabled={isSaving}
                        className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Muat ulang pengaturan dari database"
                    >
                        <RotateCcw className="w-4 h-4 text-gray-500" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-brand-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Simpan Semua Kontak</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 1. Customer Service (CS) & WhatsApp Bantuan Pelanggan */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">
                                Customer Service (CS) &amp; WhatsApp Bantuan
                            </h3>
                            <p className="text-xs text-gray-500">
                                Kontak yang tampil di tombol "Hubungi Kami" Sidebar, Halaman Bantuan, dan Dashboard Pelaku Usaha.
                            </p>
                        </div>
                    </div>
                    {testCsUrl && (
                        <a
                            href={testCsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all hover:shadow-xs shrink-0"
                            title="Buka link WhatsApp di tab baru untuk menguji chat"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Uji Link WhatsApp CS</span>
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    {/* Nomor WhatsApp CS */}
                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Nomor WhatsApp CS Resmi <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.CS_PHONE}
                                onChange={(e) => handleChange('CS_PHONE', e.target.value)}
                                placeholder="Contoh: 0815-6495-5280 atau 6281564955280"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(formData.CS_PHONE, 'Nomor CS')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                title="Salin nomor"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Format lokal (08...) atau internasional (628...). Otomatis dikonversi menjadi tautan wa.me resmi.
                        </p>
                    </div>

                    {/* Nama Petugas / Unit CS */}
                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Nama Petugas / Unit CS
                        </label>
                        <input
                            type="text"
                            value={formData.CS_NAME}
                            onChange={(e) => handleChange('CS_NAME', e.target.value)}
                            placeholder="Contoh: Customer Support HalalCore"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-[11px] text-gray-400">
                            Nama identitas helpdesk yang ditampilkan kepada klien.
                        </p>
                    </div>

                    {/* Email Layanan Support */}
                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Email Layanan Bantuan (Support Email) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={formData.SUPPORT_EMAIL}
                                onChange={(e) => handleChange('SUPPORT_EMAIL', e.target.value)}
                                placeholder="Contoh: support@halalcore.id"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(formData.SUPPORT_EMAIL, 'Email Support')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                title="Salin email"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Ditampilkan di Halaman Pusat Bantuan dan bagian kontak resmi pada Dokumen Perjanjian.
                        </p>
                    </div>

                    {/* Jam Layanan CS */}
                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Jam Layanan Operasional CS
                        </label>
                        <input
                            type="text"
                            value={formData.OPERATIONAL_HOURS}
                            onChange={(e) => handleChange('OPERATIONAL_HOURS', e.target.value)}
                            placeholder="Contoh: Senin - Jumat, 08:00 - 17:00 WIB"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-[11px] text-gray-400">
                            Jadwal aktif petugas melayani pertanyaan pelaku usaha.
                        </p>
                    </div>

                    {/* Pesan Default WhatsApp */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Pesan Pembuka Default WhatsApp CS
                        </label>
                        <textarea
                            rows={2}
                            value={formData.WHATSAPP_DEFAULT_MESSAGE}
                            onChange={(e) => handleChange('WHATSAPP_DEFAULT_MESSAGE', e.target.value)}
                            placeholder="Pesan yang otomatis terisi ketika klien mengklik tombol chat WhatsApp..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                        />
                        <p className="text-[11px] text-gray-400">
                            Teks pengantar ini akan otomatis muncul di kolom ketik WhatsApp pengguna saat membuka chat.
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. WhatsApp Konsultasi & Pemasaran (Landing Page & Calon Pelaku Usaha) */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">
                                WhatsApp Konsultasi &amp; Pemasaran (Calon Pelanggan)
                            </h3>
                            <p className="text-xs text-gray-500">
                                Kontak yang digunakan pada tombol "Konsultasi Gratis via WhatsApp" di Landing Page publik.
                            </p>
                        </div>
                    </div>
                    {testConsultUrl && (
                        <a
                            href={testConsultUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-all hover:shadow-xs shrink-0"
                            title="Buka link WhatsApp Konsultasi di tab baru"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Uji Link Konsultasi</span>
                        </a>
                    )}
                </div>

                <div className="space-y-4 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={formData.sameAsCsPhone}
                            onChange={(e) => handleChange('sameAsCsPhone', e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                        <span className="font-bold text-gray-800">
                            Gunakan nomor yang sama dengan WhatsApp CS resmi
                        </span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {!formData.sameAsCsPhone && (
                            <div className="space-y-1.5">
                                <label className="block font-bold text-gray-800">
                                    Nomor WhatsApp Konsultasi Khusus
                                </label>
                                <input
                                    type="text"
                                    value={formData.CONSULTATION_PHONE}
                                    onChange={(e) => handleChange('CONSULTATION_PHONE', e.target.value)}
                                    placeholder="Contoh: 0812-9876-5432"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <div className={`${formData.sameAsCsPhone ? 'md:col-span-2' : ''} space-y-1.5`}>
                            <label className="block font-bold text-gray-800">
                                Pesan Default Konsultasi Calon UMKM
                            </label>
                            <input
                                type="text"
                                value={formData.CONSULTATION_MESSAGE}
                                onChange={(e) => handleChange('CONSULTATION_MESSAGE', e.target.value)}
                                placeholder="Contoh: Halo HalalCore, saya ingin konsultasi mengenai pengurusan Sertifikat Halal."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Identitas Perusahaan, Legal & Alamat Kantor */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900">
                            Identitas Perusahaan, Kantor &amp; Legalitas
                        </h3>
                        <p className="text-xs text-gray-500">
                            Data badan hukum resmi yang dicetak pada Perjanjian Kontrak, Dokumen SJPH, Invoice, dan Footer Website.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Nama Resmi Perusahaan (PT) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.COMPANY_NAME}
                            onChange={(e) => handleChange('COMPANY_NAME', e.target.value)}
                            placeholder="Contoh: PT Ana Nahnu Indonesia"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Nama Merek / Platform (Brand)
                        </label>
                        <input
                            type="text"
                            value={formData.BRAND_NAME}
                            onChange={(e) => handleChange('BRAND_NAME', e.target.value)}
                            placeholder="Contoh: HalalCore"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Email Resmi Kantor / Perusahaan
                        </label>
                        <input
                            type="email"
                            value={formData.COMPANY_EMAIL}
                            onChange={(e) => handleChange('COMPANY_EMAIL', e.target.value)}
                            placeholder="Contoh: info@ananahnu.id"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Nomor Telepon Kantor / Hotline
                        </label>
                        <input
                            type="text"
                            value={formData.COMPANY_PHONE}
                            onChange={(e) => handleChange('COMPANY_PHONE', e.target.value)}
                            placeholder="Contoh: +62 812-3456-7890"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Website Resmi Perusahaan
                        </label>
                        <input
                            type="url"
                            value={formData.COMPANY_WEBSITE}
                            onChange={(e) => handleChange('COMPANY_WEBSITE', e.target.value)}
                            placeholder="Contoh: https://halalcore.id"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3 space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            Alamat Kantor Resmi &amp; Operasional <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={2}
                            value={formData.COMPANY_ADDRESS}
                            onChange={(e) => handleChange('COMPANY_ADDRESS', e.target.value)}
                            placeholder="Contoh: Jl. Raya Ana Nahnu No. 1, Jakarta Timur, DKI Jakarta"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 4. Media Sosial & Tautan Eksternal */}
            <div className="bg-white border border-gray-150 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900">
                            Akun Media Sosial &amp; Kanal Resmi
                        </h3>
                        <p className="text-xs text-gray-500">
                            Tautan akun media sosial yang tampil pada footer halaman publik dan portal umum.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            URL Akun Instagram
                        </label>
                        <input
                            type="url"
                            value={formData.SOCIAL_INSTAGRAM}
                            onChange={(e) => handleChange('SOCIAL_INSTAGRAM', e.target.value)}
                            placeholder="https://instagram.com/halalcore.id"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            URL Akun TikTok
                        </label>
                        <input
                            type="url"
                            value={formData.SOCIAL_TIKTOK}
                            onChange={(e) => handleChange('SOCIAL_TIKTOK', e.target.value)}
                            placeholder="https://tiktok.com/@halalcore.id"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            URL Kanal YouTube
                        </label>
                        <input
                            type="url"
                            value={formData.SOCIAL_YOUTUBE}
                            onChange={(e) => handleChange('SOCIAL_YOUTUBE', e.target.value)}
                            placeholder="https://youtube.com/@halalcore"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block font-bold text-gray-800">
                            URL Profil LinkedIn
                        </label>
                        <input
                            type="url"
                            value={formData.SOCIAL_LINKEDIN}
                            onChange={(e) => handleChange('SOCIAL_LINKEDIN', e.target.value)}
                            placeholder="https://linkedin.com/company/halalcore"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* 5. Dampak Pengaturan & Informasi Keterkaitan */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 text-xs text-slate-700 space-y-3">
                <div className="flex items-center gap-2 font-black text-slate-900">
                    <Info className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Di mana saja kontak ini digunakan di dalam sistem?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <p className="font-bold text-gray-900">Sidebar Dashboard</p>
                        <p className="text-[11px] text-gray-500">Tombol hijau "Hubungi Kami" mengarahkan pengguna langsung ke WhatsApp CS yang diatur di atas.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <p className="font-bold text-gray-900">Pusat Bantuan (/bantuan)</p>
                        <p className="text-[11px] text-gray-500">Nomor WhatsApp CS, Email Support, dan Jam Layanan otomatis disesuaikan secara real-time.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <p className="font-bold text-gray-900">Dokumen Perjanjian</p>
                        <p className="text-[11px] text-gray-500">Email support dan identitas resmi perusahaan tercetak rapi di Lampiran Dokumen Kontrak &amp; SJPH.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <p className="font-bold text-gray-900">Landing Page &amp; Footer</p>
                        <p className="text-[11px] text-gray-500">Nomor konsultasi, alamat kantor, email, dan medsos otomatis menyinkronkan data publik.</p>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Perubahan akan langsung aktif secara instan setelah disimpan.</span>
                </div>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-brand-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Menyimpan...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Simpan Semua Kontak</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
