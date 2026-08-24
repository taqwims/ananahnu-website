import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, CheckCircle2, Newspaper, ArrowUpRight,
    FileText, MessageSquare, ClipboardList, Monitor, Award,
    Store, Utensils, Sparkles, Briefcase, Factory, MoreHorizontal,
    Star, Headphones, ShieldCheck, Users, UserCheck, Check,
    PhoneCall, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import type { News, ContentBlock } from '../../types';
import { getMediaUrl } from '../../utils/media';
import { formatWhatsAppUrl } from '../../utils/format';
import heroAdvisorImg from '../../assets/hero-advisors.jpg';
import HalalIndonesiaBadge from '../../components/ui/HalalIndonesiaBadge';

// Testimonials data
const TESTIMONIALS = [
    {
        quote: "Prosesnya mudah, pendampingnya responsif, dan sangat membantu sampai Sertifikat Halal terbit. Terima kasih HalalCore!",
        author: "Ayu Lestari",
        role: "Owner Dapur Ayu",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        rating: 5
    },
    {
        quote: "Dari awal pengumpulan berkas sampai verifikasi SIHALAL didampingi penuh. Sekarang produk katering kami 100% bersertifikat resmi!",
        author: "Budi Santoso",
        role: "Founder Santoso Catering",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        rating: 5
    },
    {
        quote: "Program Self Declare sangat membantu UMKM kami. Advisor HalalCore sabar menjelaskan setiap formulir SJPH hingga lolos.",
        author: "Siti Rahmawati",
        role: "Pemilik Keripik Berkah Jaya",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        rating: 5
    }
];

// Service categories detailed data
const SERVICES_DATA = [
    {
        id: 'reguler',
        title: 'Reguler',
        badge: 'Jalur Reguler',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        desc: 'Pendampingan pembuatan Sertifikat Halal melalui proses reguler dengan pendamping profesional.',
        details: [
            'Pendampingan penuh dari audit hingga sidang fatwa',
            'Pemeriksaan dokumen bahan baku dan manual SJPH',
            'Koordinasi dengan LPH (Lembaga Pemeriksa Halal)',
            'Cocok untuk skala UKM, Menengah, dan Korporasi'
        ],
        ctaText: 'Ajukan Sertifikasi Reguler',
        ctaLink: '/register'
    },
    {
        id: 'self-declare-fasilitasi',
        title: 'Self Declare (Fasilitasi)',
        badge: 'Biaya Rp0 (Subsidi BPJPH)',
        badgeColor: 'bg-amber-100 text-amber-800',
        desc: 'Fasilitasi pendaftaran Self Declare dengan biaya Rp0 (disubsidi BPJPH).',
        details: [
            'Biaya pendaftaran 100% disubsidi oleh BPJPH',
            'Pendampingan oleh Halal Advisor bersertifikat',
            'Proses verifikasi berkas dan bahan baku produk',
            'Khusus untuk pelaku Usaha Mikro dan Kecil (UMK)'
        ],
        ctaText: 'Daftar Self Declare Fasilitasi',
        ctaLink: '/register'
    },
    {
        id: 'self-declare-mandiri',
        title: 'Self Declare (Mandiri)',
        badge: 'Proses Fleksibel',
        badgeColor: 'bg-blue-100 text-blue-800',
        desc: 'Pendampingan Self Declare Mandiri untuk pelaku usaha yang ingin proses lebih mandiri.',
        details: [
            'Panduan mandiri langkah demi langkah via platform',
            'Verifikasi kepatuhan bahan sesuai kriteria BPJPH',
            'Bantuan perbaikan dokumen cepat dan terarah',
            'Dukungan customer support konsultasi'
        ],
        ctaText: 'Mulai Self Declare Mandiri',
        ctaLink: '/register'
    }
];

export default function LandingPage() {
    const [news, setNews] = useState<News[]>([]);
    const [welcomeBlock, setWelcomeBlock] = useState<ContentBlock | null>(null);
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
    const [testimonialIndex, setTestimonialIndex] = useState(0);
    const [selectedService, setSelectedService] = useState<typeof SERVICES_DATA[0] | null>(null);

    // Auto rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    // Fetch dynamic content & public settings (Company phone, etc.)
    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            const [newsRes, welcomeRes, settingsRes] = await Promise.allSettled([
                api.get('/public/cms/news?landing_only=true&limit=3').catch(() => ({ data: [] })),
                api.get('/public/cms/blocks/welcome_message').catch(() => ({ data: null })),
                api.get('/system-settings/public').catch(() => ({ data: {} })),
            ]);

            if (cancelled) return;

            if (newsRes.status === 'fulfilled') {
                const data = newsRes.value.data?.data || newsRes.value.data || [];
                setNews(data);
            }
            if (welcomeRes.status === 'fulfilled') setWelcomeBlock(welcomeRes.value.data);
            if (settingsRes.status === 'fulfilled') setPublicSettings(settingsRes.value.data || {});
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    const whatsappUrl = formatWhatsAppUrl(
        publicSettings['COMPANY_PHONE'],
        "Halo HalalCore, saya ingin konsultasi mengenai pengurusan Sertifikat Halal."
    );

    return (
        <div className="overflow-hidden">
            {/* 1. HERO SECTION */}
            <section id="home" className="relative pt-8 pb-14 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-24 bg-white overflow-hidden">
                {/* Subtle Islamic circular pattern on the left */}
                <svg className="absolute left-0 top-0 h-full w-full sm:w-1/2 lg:w-2/5 opacity-[0.04] pointer-events-none select-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="islamic-circles-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                            <circle cx="25" cy="25" r="23" fill="none" stroke="#004033" strokeWidth="1.5" />
                            <circle cx="0" cy="25" r="23" fill="none" stroke="#004033" strokeWidth="1.5" />
                            <circle cx="50" cy="25" r="23" fill="none" stroke="#004033" strokeWidth="1.5" />
                            <circle cx="25" cy="0" r="23" fill="none" stroke="#004033" strokeWidth="1.5" />
                            <circle cx="25" cy="50" r="23" fill="none" stroke="#004033" strokeWidth="1.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#islamic-circles-pattern)" />
                </svg>

                {/* Top-Right Background Green Shape (Diagonal Angle) */}
                <div
                    className="absolute top-0 right-0 w-1/2 sm:w-2/5 lg:w-[42%] h-full pointer-events-none z-0 overflow-hidden"
                >
                    <div
                        className="absolute top-0 right-0 w-full h-full bg-[#004033]"
                        style={{
                            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)'
                        }}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

                        {/* Left Hero Content */}
                        <div className="lg:col-span-6 space-y-5 sm:space-y-6 lg:pr-2 z-10 text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-gray-900 leading-[1.15] tracking-tight">
                                    Satu Platform, <br />
                                    Solusi Halal <br />
                                    <span className="text-[#004033]">Untuk Semua.</span>
                                </h1>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.15 }}
                                className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-xl"
                            >
                                {welcomeBlock?.body || "HalalCore membantu pelaku usaha mendapatkan Sertifikat Halal dengan mudah, cepat, dan sesuai ketentuan BPJPH."}
                            </motion.p>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2"
                            >
                                <a
                                    href="/register"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl bg-[#004033] hover:bg-[#002f26] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/15 hover:shadow-xl transition-all duration-200 active:scale-95 group text-center"
                                >
                                    <span>Ajukan Layanan Halal</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>

                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3.5 rounded-xl bg-white border border-gray-300 hover:border-emerald-600 hover:bg-emerald-50/40 text-emerald-900 font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all duration-200 active:scale-95 group text-center"
                                >
                                    <span>Konsultasi Gratis</span>
                                    <MessageSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                </a>
                            </motion.div>

                            {/* Trust Badge */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.45 }}
                                className="flex items-center gap-2.5 pt-1 text-xs sm:text-sm text-gray-700 font-medium"
                            >
                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                                <span>Pendampingan oleh <strong className="text-gray-900">Halal Advisor Profesional</strong></span>
                            </motion.div>
                        </div>

                        {/* Right Hero Visual with Floating BPJPH Badge at bottom */}
                        <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end mt-4 lg:mt-0">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="relative w-full max-w-md sm:max-w-lg lg:max-w-none"
                            >
                                {/* Photo Container with smooth left-edge gradient mask */}
                                <div className="relative w-full h-[280px] sm:h-[380px] md:h-[430px] lg:h-[480px]">
                                    <img
                                        src={heroAdvisorImg}
                                        alt="Halal Advisor HalalCore"
                                        className="w-full h-full object-cover object-[center_top] rounded-2xl lg:rounded-none lg:rounded-br-4xl shadow-sm lg:shadow-none"
                                        style={{
                                            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 8%, black 20%)',
                                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 8%, black 20%)'
                                        }}
                                    />

                                    {/* Floating Halal Indonesia & BPJPH Badge positioned gracefully at the bottom right */}
                                    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-3 lg:bottom-5 lg:right-1 z-20">
                                        <HalalIndonesiaBadge className="shadow-2xl scale-85 sm:scale-95 lg:scale-100 origin-bottom-right hover:scale-105 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 2. LAYANAN PENDAMPINGAN HALAL TERLENGKAP */}
            <section id="layanan" className="py-16 sm:py-20 bg-[#F4F9F6] border-y border-emerald-100/60 rounded-t-[2rem] sm:rounded-t-[2.5rem] lg:rounded-t-[3.5rem] relative -mt-6 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Layanan Pendampingan Halal <span className="text-[#004033]">Terlengkap</span>
                        </h2>
                        <p className="mt-3 text-gray-600 text-base">
                            Pilihan skema sertifikasi halal yang disesuaikan dengan skala dan kesiapan bisnis Anda.
                        </p>
                    </div>

                    {/* 3 Service Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {SERVICES_DATA.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Icon Top */}
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#004033] mb-6 group-hover:scale-110 group-hover:bg-[#004033] group-hover:text-white transition-all duration-300">
                                        {index === 0 && <Users className="w-7 h-7" />}
                                        {index === 1 && <FileText className="w-7 h-7" />}
                                        {index === 2 && <ShieldCheck className="w-7 h-7" />}
                                    </div>

                                    {/* Title & Badge */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-800 transition-colors">
                                        {service.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                                        {service.desc}
                                    </p>
                                </div>

                                <div>
                                    <button
                                        onClick={() => setSelectedService(service)}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-[#004033] group-hover:text-emerald-600 transition-colors pt-4 border-t border-gray-100 w-full"
                                    >
                                        <span>Pelajari Selengkapnya</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. STATISTICS STRIP */}
            <section className="py-12 bg-gradient-to-r from-[#003329] via-[#004033] to-[#00261f] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-emerald-800/60 text-center">

                        {/* Stat 1 */}
                        <div className="pt-4 md:pt-0 md:px-4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center text-emerald-300 mb-3">
                                <Award className="w-5 h-5" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">10.794+</div>
                            <div className="text-xs sm:text-sm font-medium text-emerald-200/90 mt-1">Sertifikat Halal Terbit</div>
                            <div className="text-[11px] text-emerald-300/60 mt-0.5">(Data 2024)</div>
                        </div>

                        {/* Stat 2 */}
                        <div className="pt-4 md:pt-0 md:px-4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center text-emerald-300 mb-3">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">937+</div>
                            <div className="text-xs sm:text-sm font-medium text-emerald-200/90 mt-1">Halal Advisor Tergabung</div>
                            <div className="text-[11px] text-emerald-300/60 mt-0.5">di Seluruh Indonesia</div>
                        </div>

                        {/* Stat 3 */}
                        <div className="pt-4 md:pt-0 md:px-4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center text-emerald-300 mb-3">
                                <Store className="w-5 h-5" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">7.000+</div>
                            <div className="text-xs sm:text-sm font-medium text-emerald-200/90 mt-1">Pelaku Usaha</div>
                            <div className="text-[11px] text-emerald-300/60 mt-0.5">Didampingi Sukses</div>
                        </div>

                        {/* Stat 4 */}
                        <div className="pt-4 md:pt-0 md:px-4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center text-amber-300 mb-3">
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">4.9/5</div>
                            <div className="text-xs sm:text-sm font-medium text-emerald-200/90 mt-1">Kepuasan Pengguna</div>
                            <div className="text-[11px] text-emerald-300/60 mt-0.5">HalalCore</div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 4. PROSES MUDAH BERSAMA HALALCORE */}
            <section id="proses" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Proses Mudah Bersama <span className="text-[#004033]">HalalCore</span>
                        </h2>
                        <p className="mt-3 text-gray-600 text-base">
                            5 langkah praktis dari pengajuan hingga sertifikat resmi terbit.
                        </p>
                    </div>

                    {/* Steps Container */}
                    <div className="relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden lg:block absolute top-1/4 left-[8%] right-[8%] h-0.5 border-t-2 border-dashed border-gray-200 -z-0" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">

                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-[#004033] mb-4 shadow-sm group-hover:scale-110 group-hover:bg-[#004033] group-hover:text-white transition-all duration-300">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-1.5">1. Ajukan Layanan</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Isi data usaha dan pilih jenis layanan yang sesuai.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-[#004033] mb-4 shadow-sm group-hover:scale-110 group-hover:bg-[#004033] group-hover:text-white transition-all duration-300">
                                    <MessageSquare className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-1.5">2. Konsultasi</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Halal Advisor kami akan menghubungi Anda.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-[#004033] mb-4 shadow-sm group-hover:scale-110 group-hover:bg-[#004033] group-hover:text-white transition-all duration-300">
                                    <ClipboardList className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-1.5">3. Pendampingan</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Proses dokumen dan pendampingan hingga pengajuan ke BPJPH.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-[#004033] mb-4 shadow-sm group-hover:scale-110 group-hover:bg-[#004033] group-hover:text-white transition-all duration-300">
                                    <Monitor className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-1.5">4. Proses Verifikasi</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Verifikasi oleh BPJPH melalui sistem SIHALAL.
                                </p>
                            </div>

                            {/* Step 5 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-[#004033] mb-4 shadow-sm group-hover:scale-110 group-hover:bg-[#004033] group-hover:text-white transition-all duration-300">
                                    <Award className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-1.5">5. Sertifikat Terbit</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Sertifikat Halal diterbitkan secara resmi.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* 5. DUA KOLOM: UNTUK SIAPA & APA KATA MEREKA */}
            <section id="untuk-siapa" className="py-12 bg-gradient-to-r from-[#23b086] via-[#004033] to-[#00261f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">

                        {/* Left: Untuk Siapa HalalCore? */}
                        <div className="lg:col-span-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                    <span className="text-[#1B4D3E]">Halal</span> <span className="text-[#D4AF37]">Core </span>
                                    Untuk Siapa?
                                </h3>
                                <p className="mt-2 text-sm text-gray-300 mb-8">
                                    Solusi untuk berbagai jenis usaha di seluruh sektor.
                                </p>

                                {/* 6 Sector Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004033] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Store className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">UMKM</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004033] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Utensils className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">Kuliner & Minuman</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004033] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">Kosmetik & Obat Tradisional</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004033] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">Jasa & Layanan</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004033] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Factory className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">Industri & Manufaktur</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#004033] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <MoreHorizontal className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">Dan Lainnya</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Right: Apa Kata Mereka? Testimonials */}
                        <div className="lg:col-span-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#a8e3d1] tracking-tight">
                                    Apa Kata Mereka?
                                </h3>
                                <p className="mt-2 text-sm text-gray-200 mb-8">
                                    Pengalaman nyata pelaku usaha yang telah tersertifikasi Halal bersama kami.
                                </p>

                                {/* Testimonial Card */}
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md relative min-h-[220px] flex flex-col justify-between">

                                    {/* Quote Icon */}
                                    <div className="text-4xl text-emerald-600 font-serif leading-none select-none">“</div>

                                    {/* Quote Text */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={testimonialIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="my-2"
                                        >
                                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed italic">
                                                {TESTIMONIALS[testimonialIndex].quote}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Author & Slider Dots */}
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={TESTIMONIALS[testimonialIndex].avatar}
                                                alt={TESTIMONIALS[testimonialIndex].author}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-100"
                                            />
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    {TESTIMONIALS[testimonialIndex].author}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {TESTIMONIALS[testimonialIndex].role}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pagination Dots */}
                                        <div className="flex items-center gap-1.5">
                                            {TESTIMONIALS.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setTestimonialIndex(idx)}
                                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${testimonialIndex === idx
                                                        ? 'w-6 bg-[#004033]'
                                                        : 'bg-gray-300 hover:bg-gray-400'
                                                        }`}
                                                    aria-label={`Slide ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 6. BERITA & EDUKASI HALAL (CMS NEWS) */}
            <section id="news" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">Edukasi & Wawasan</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                                Berita & Regulasi Halal
                            </h2>
                        </div>
                        <Link to="/news" className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:underline">
                            Lihat Semua Artikel <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {news.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-gray-100">
                            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Belum ada artikel berita yang dipublikasikan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {news.map(article => (
                                <Link
                                    key={article.id}
                                    to={`/news/${article.slug}`}
                                    className="group bg-white rounded-3xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="h-48 bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                                            <img
                                                src={getMediaUrl(article.thumbnail_url) || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&sig=${article.id}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                alt={article.title}
                                            />
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2 inline-block uppercase tracking-wider">
                                            {article.category || 'Berita Halal'}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                                            {article.title}
                                        </h3>
                                        <p className="text-gray-500 line-clamp-2 text-xs leading-relaxed">
                                            {article.excerpt || article.content?.replace(/<[^>]*>/g, '')}
                                        </p>
                                    </div>
                                    <div className="pt-4 mt-3 border-t border-gray-50 flex items-center justify-between text-xs text-emerald-700 font-bold">
                                        <span>Baca Selengkapnya</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* 7. BOTTOM CTA BANNER (WHATSAPP CONSULTATION) */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-[#00382D] via-[#004033] to-[#00261f] rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">

                        {/* Left Banner Info */}
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 text-emerald-200">
                                <Headphones className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white">
                                    Siap mengurus Sertifikat Halal usaha Anda?
                                </h3>
                                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                                    Konsultasi gratis bersama Halal Advisor kami sekarang!
                                </p>
                            </div>
                        </div>

                        {/* Right Banner Button */}
                        <div className="flex-shrink-0 w-full md:w-auto">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white hover:bg-emerald-50 text-[#004033] font-bold text-sm sm:text-base shadow-lg transition-all active:scale-95 group"
                            >
                                <MessageSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>Konsultasi Gratis via WhatsApp</span>
                            </a>
                        </div>

                    </div>
                </div>
            </section>

            {/* 8. DETAIL MODAL DIALOG */}
            <AnimatePresence>
                {selectedService && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative"
                        >
                            <button
                                onClick={() => setSelectedService(null)}
                                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${selectedService.badgeColor}`}>
                                {selectedService.badge}
                            </span>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {selectedService.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                {selectedService.desc}
                            </p>

                            <div className="space-y-2.5 mb-8">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Keunggulan Layanan:</h4>
                                {selectedService.details.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <a
                                    href={selectedService.ctaLink}
                                    className="flex-1 py-3 text-center rounded-xl bg-[#004033] hover:bg-[#002f26] text-white font-bold text-sm shadow-md transition-all"
                                >
                                    {selectedService.ctaText}
                                </a>
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-3 rounded-xl border border-gray-200 hover:border-emerald-400 text-gray-700 font-semibold text-sm flex items-center justify-center gap-1.5"
                                >
                                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                                    <span>Tanya Dulu</span>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
