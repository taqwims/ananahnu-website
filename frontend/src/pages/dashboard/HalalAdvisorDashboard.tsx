import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    CheckCircle2, 
    Clock, 
    Search, 
    MessageSquare, 
    ArrowRight, 
    Calculator, 
    Award, 
    Sparkles, 
    Copy, 
    Share2, 
    Check, 
    ShieldCheck, 
    AlertCircle, 
    TrendingUp, 
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { submissionService } from '../../services/submissionService';
import { useAuthStore } from '../../store/authStore';
import type { Submission } from '../../types';

export default function HalalAdvisorDashboard() {
    const navigate = useNavigate();
    const currentUser = useAuthStore(state => state.user);

    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [copiedRef, setCopiedRef] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Active Queue Tab: 'CONSULTATION' | 'VERVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL'
    const [activeTab, setActiveTab] = useState<'CONSULTATION' | 'VERVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL'>('CONSULTATION');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Consultation & Service Setting State
    const [consultModal, setConsultModal] = useState<{
        isOpen: boolean;
        submission: Submission | null;
    }>({
        isOpen: false,
        submission: null
    });
    const [selectedServiceType, setSelectedServiceType] = useState<'REGULER' | 'SELF_DECLARE' | 'SELF_DECLARE_MANDIRI'>('REGULER');
    const [consultNotes, setConsultNotes] = useState('');
    const [savingService, setSavingService] = useState(false);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data || []);
        } catch (err) {
            console.error("Gagal memuat daftar pengajuan advisor", err);
            toast.error("Gagal memuat daftar pengajuan binaan");
        } finally {
            setLoading(false);
        }
    };

    // Queues
    // 1. Butuh Konsultasi: Belum diset jenis layanannya / PENDING_CONSULTATION
    const needConsultationList = submissions.filter(s => 
        (!s.service_type || s.service_type === 'PENDING_CONSULTATION') &&
        s.status !== 'SH_TERBIT' && s.status !== 'REJECTED'
    );

    // 2. Verval Lapangan / Pendamping: status VERVAL_PENDAMPING
    const vervalList = submissions.filter(s => 
        s.status === 'VERVAL_PENDAMPING'
    );

    // 3. In Progress: WAITING_PAYMENT, QC_OFFICER, DRAFTER, QC_REVIEW, SUBMITTED_TO_BPJPH, SIDANG_FATWA
    const inProgressList = submissions.filter(s => 
        s.service_type && s.service_type !== 'PENDING_CONSULTATION' &&
        s.status !== 'VERVAL_PENDAMPING' && s.status !== 'SH_TERBIT' && s.status !== 'REJECTED'
    );

    // 4. Completed: SH_TERBIT
    const completedList = submissions.filter(s => s.status === 'SH_TERBIT');

    // Filter displayed items in current active tab
    const currentQueueItems = () => {
        let list: Submission[] = [];
        if (activeTab === 'CONSULTATION') list = needConsultationList;
        else if (activeTab === 'VERVAL') list = vervalList;
        else if (activeTab === 'IN_PROGRESS') list = inProgressList;
        else if (activeTab === 'COMPLETED') list = completedList;
        else list = submissions;

        if (!searchTerm.trim()) return list;
        const q = searchTerm.toLowerCase();
        return list.filter(s => 
            s.client?.business_name?.toLowerCase().includes(q) ||
            s.client?.client_name?.toLowerCase().includes(q) ||
            s.client?.phone?.includes(q) ||
            s.tracking_number?.toLowerCase().includes(q)
        );
    };

    // Copy Referral Code
    const handleCopyRef = () => {
        if (!currentUser?.referral_code) return;
        navigator.clipboard.writeText(currentUser.referral_code);
        setCopiedRef(true);
        toast.success("Nomor Registrasi Advisor berhasil disalin!");
        setTimeout(() => setCopiedRef(false), 2000);
    };

    // Copy Client Registration Link
    const clientLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/dashboard/pengajuan?ref=${currentUser?.referral_code || ''}`
        : '';

    const handleCopyLink = () => {
        if (!clientLink) return;
        navigator.clipboard.writeText(clientLink);
        setCopiedLink(true);
        toast.success("Tautan formulir pendaftaran klien berhasil disalin!");
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Share via WhatsApp
    const handleShareWA = () => {
        const text = `Halo! Daftarkan produk & usaha Anda untuk Sertifikasi Halal resmi bersama saya *${currentUser?.full_name || 'Halal Advisor'}* (No. Registrasi: *${currentUser?.referral_code || '-'}*).\n\nKlik tautan pendaftaran berikut untuk memulai:\n${clientLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Open Consultation Modal
    const handleOpenConsult = (sub: Submission) => {
        setConsultModal({ isOpen: true, submission: sub });
        setSelectedServiceType(
            sub.service_type === 'REGULER' || sub.service_type === 'SELF_DECLARE_MANDIRI' || sub.service_type === 'SELF_DECLARE'
                ? sub.service_type
                : 'REGULER'
        );
        setConsultNotes('');
    };

    // Save Consultation & Service Type
    const handleSaveConsultation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consultModal.submission) return;

        setSavingService(true);
        try {
            let actualServiceType: string = selectedServiceType;
            let actualSelfDeclareType = '';

            if (selectedServiceType === 'SELF_DECLARE_MANDIRI') {
                actualServiceType = 'SELF_DECLARE_MANDIRI';
                actualSelfDeclareType = 'MANDIRI';
            } else if (selectedServiceType === 'SELF_DECLARE') {
                actualServiceType = 'SELF_DECLARE';
                actualSelfDeclareType = 'GRATIS';
            } else {
                actualServiceType = 'REGULER';
            }

            await submissionService.setAdvisorServiceType(
                consultModal.submission.id,
                actualServiceType,
                actualSelfDeclareType
            );

            toast.success("Hasil konsultasi & penetapan jenis layanan berhasil disimpan!");
            setConsultModal({ isOpen: false, submission: null });
            loadSubmissions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal menyimpan hasil konsultasi");
        } finally {
            setSavingService(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SH_TERBIT':
                return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black">Sertifikat Terbit 🎉</span>;
            case 'VERVAL_PENDAMPING':
                return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-black">Verval Pendamping</span>;
            case 'WAITING_PAYMENT':
                return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black">Menunggu Pembayaran</span>;
            case 'QC_OFFICER':
            case 'DRAFTER':
            case 'QC_REVIEW':
                return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-black">Penyusunan Berkas QC</span>;
            case 'SIDANG_FATWA':
                return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black">Sidang Fatwa MUI</span>;
            default:
                return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-black">{status.replace(/_/g, ' ')}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-xs font-bold text-gray-500">Memuat dashboard pendamping halal...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 px-4 sm:px-6 py-6 pb-24">
            {/* TOP HERO BANNER: Halal Advisor Profile & Shareable Referral Widget */}
            <div className="bg-gradient-to-br from-indigo-900 via-brand-800 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Info Advisor */}
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest border border-white/20">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Ruang Kerja Pendamping Halal (Halal Advisor)
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            Selamat Datang, {currentUser?.full_name} 👋
                        </h1>
                        <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed">
                            Dampingi pelaku usaha binaan Anda, lakukan evaluasi kelayakan bahan & proses produksi, dan tetapkan jalur sertifikasi halal yang tepat.
                        </p>
                    </div>

                    {/* Right: Shareable Registration Box */}
                    <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3 min-w-[300px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">No. Registrasi Advisor</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                                Aktif Terverifikasi
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-black/20 p-2.5 rounded-xl border border-white/10">
                            <span className="text-base font-black text-amber-300 tracking-wider font-mono">
                                {currentUser?.referral_code || 'BELUM_ADA'}
                            </span>
                            <button
                                onClick={handleCopyRef}
                                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                                title="Salin Kode"
                            >
                                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedRef ? 'Tersalin' : 'Salin'}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 py-2 px-3 rounded-xl bg-white text-brand-900 hover:bg-gray-100 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                            >
                                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                                <span>{copiedLink ? 'Link Tersalin' : 'Salin Link Klien'}</span>
                            </button>
                            <button
                                onClick={handleShareWA}
                                className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                title="Bagikan via WhatsApp"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Share WA</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation Footer */}
                <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard/estimasi')}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15"
                        >
                            <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Kalkulator Tarif Layanan</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/karir')}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15"
                        >
                            <Award className="w-3.5 h-3.5 text-amber-300" />
                            <span>Jenjang Karir & Poin</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/referrals')}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15"
                        >
                            <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
                            <span>Insentif Pendampingan</span>
                        </button>
                    </div>

                    <p className="text-[11px] text-white/70 font-medium">
                        Klien mendaftar dengan kode Anda otomatis masuk ke antrean konsultasi di bawah ini.
                    </p>
                </div>
            </div>

            {/* 4 HALAL ADVISOR WORKFLOW KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Butuh Konsultasi */}
                <div 
                    onClick={() => setActiveTab('CONSULTATION')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        needConsultationList.length > 0
                            ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Butuh Konsultasi</span>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                            needConsultationList.length > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{needConsultationList.length}</p>
                        <p className="text-[10px] font-bold text-amber-700 mt-1">
                            {needConsultationList.length > 0 ? '⚠️ Menunggu Penetapan Layanan' : 'Semua klien telah dikonsultasi'}
                        </p>
                    </div>
                </div>

                {/* KPI 2: Verval Lapangan / Pendamping */}
                <div 
                    onClick={() => setActiveTab('VERVAL')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        vervalList.length > 0
                            ? 'bg-purple-50/60 border-purple-300 hover:border-purple-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Verval Lapangan</span>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                            vervalList.length > 0 ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{vervalList.length}</p>
                        <p className="text-[10px] font-bold text-purple-700 mt-1">
                            {vervalList.length > 0 ? '🔍 Butuh Upload Berita Acara / SJPH' : 'Antrean verval kosong'}
                        </p>
                    </div>
                </div>

                {/* KPI 3: Dalam Proses (QC & Sidang Fatwa) */}
                <div 
                    onClick={() => setActiveTab('IN_PROGRESS')}
                    className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sedang Berjalan</span>
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{inProgressList.length}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1">QC Drafter & Sidang Fatwa</p>
                    </div>
                </div>

                {/* KPI 4: Sertifikat Halal Terbit */}
                <div 
                    onClick={() => setActiveTab('COMPLETED')}
                    className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SH Terbit (Closing)</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{completedList.length}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1">Total Sertifikasi Selesai</p>
                    </div>
                </div>
            </div>

            {/* ADVISOR ACTION CENTER / MEJA KERJA KLIEN BINAAN */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <span>Meja Kerja Pendampingan Klien</span>
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">
                            Kelola jadwal konsultasi, penetapan jalur layanan, dan verifikasi dokumen halal
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nama usaha / klien / no HP..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="glass-input text-xs font-bold w-full pl-10 bg-gray-50/50 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Queue Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
                    <button
                        onClick={() => setActiveTab('CONSULTATION')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'CONSULTATION'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Butuh Konsultasi</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'CONSULTATION' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {needConsultationList.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('VERVAL')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'VERVAL'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Verval Lapangan</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'VERVAL' ? 'bg-white text-purple-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                            {vervalList.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('IN_PROGRESS')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'IN_PROGRESS'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Sedang Berjalan</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'IN_PROGRESS' ? 'bg-white text-blue-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {inProgressList.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'COMPLETED'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Selesai (SH Terbit)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'COMPLETED' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                            {completedList.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'ALL'
                                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Semua Binaan</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'ALL' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {submissions.length}
                        </span>
                    </button>
                </div>

                {/* Queue Table */}
                <div className="overflow-x-auto">
                    {currentQueueItems().length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                            <p className="text-sm font-bold text-gray-700">Tidak ada pengajuan dalam kategori ini</p>
                            <p className="text-xs text-gray-400 font-medium">Bagus! Semua tugas pendampingan sudah tertangani.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">Nama Usaha / Pelaku Usaha</th>
                                    <th className="py-3 px-4">Profil Usaha & Produk</th>
                                    <th className="py-3 px-4">Jalur Layanan</th>
                                    <th className="py-3 px-4">Status Progres</th>
                                    <th className="py-3 px-4 text-right">Aksi Pendamping</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                {currentQueueItems().map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50/80 transition-all">
                                        {/* Nama Usaha & Kontak */}
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="font-black text-gray-900 text-xs">
                                                    {sub.client?.business_name || 'Tanpa Nama Usaha'}
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    {sub.client?.client_name} • <span className="text-gray-400">{sub.client?.phone || '-'}</span>
                                                </p>
                                                {sub.client?.address && (
                                                    <p className="text-[10px] text-gray-400 truncate max-w-xs mt-0.5">{sub.client.address}</p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Profil Usaha & Produk */}
                                        <td className="py-4 px-4">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-gray-900 text-xs">{sub.client?.product_name || 'Belum diinput'}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {(sub as any).business_scale?.name || (sub.business_scale_id ? `Skala #${sub.business_scale_id}` : 'Skala -')} • {sub.product_count || 1} Produk
                                                </p>
                                            </div>
                                        </td>

                                        {/* Jalur Layanan */}
                                        <td className="py-4 px-4">
                                            {(!sub.service_type || sub.service_type === 'PENDING_CONSULTATION') ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                                    <AlertCircle className="w-3 h-3" /> Butuh Penetapan
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {sub.service_type === 'REGULER' ? 'Reguler' : sub.service_type === 'SELF_DECLARE_MANDIRI' ? 'Self Declare (Mandiri)' : 'Self Declare (Fasilitasi)'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Status Progres */}
                                        <td className="py-4 px-4">
                                            {getStatusBadge(sub.status)}
                                        </td>

                                        {/* Aksi */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Tombol Konsultasi & Tetapkan Layanan jika belum diset */}
                                                {(!sub.service_type || sub.service_type === 'PENDING_CONSULTATION') && (
                                                    <button
                                                        onClick={() => handleOpenConsult(sub)}
                                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-[11px] transition-all shadow-md shadow-brand-500/20 flex items-center gap-1.5 active:scale-95"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                                        <span>Konsultasi & Tetapkan</span>
                                                    </button>
                                                )}

                                                {/* WhatsApp Shortcut */}
                                                {sub.client?.phone && (
                                                    <a
                                                        href={`https://wa.me/${sub.client.phone.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(sub.client.client_name || 'Bapak/Ibu')},%20saya%20${encodeURIComponent(currentUser?.full_name || 'Halal Advisor')}%20Pendamping%20Halal%20Anda.%20Terkait%20pengajuan%20sertifikasi%20halal%20usaha%20${encodeURIComponent(sub.client.business_name || '')},%20mari%20kita%20jadwalkan%20sesi%20konsultasi.`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                                                        title="Chat WhatsApp Klien"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </a>
                                                )}

                                                {/* Detail Link */}
                                                <button
                                                    onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-all flex items-center gap-1"
                                                >
                                                    <span>Buka Berkas</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL: KONSULTASI & PENETAPAN LAYANAN OLEH ADVISOR */}
            {consultModal.isOpen && consultModal.submission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
                    <form onSubmit={handleSaveConsultation} className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">Hasil Konsultasi & Penetapan Layanan</h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    {consultModal.submission.client?.business_name} ({consultModal.submission.client?.client_name})
                                </p>
                            </div>
                        </div>

                        {/* Ringkasan Profil Klien */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-150 space-y-1.5 text-xs text-gray-600">
                            <p><strong>Nama Produk:</strong> {consultModal.submission.client?.product_name || '-'}</p>
                            <p><strong>Jumlah Produk / Cabang:</strong> {consultModal.submission.product_count || 1} Produk / {consultModal.submission.branch_count || 1} Cabang</p>
                            <p><strong>Alamat Usaha:</strong> {consultModal.submission.client?.address || '-'}</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-700 block">
                                Tetapkan Jalur Sertifikasi Halal yang Sesuai:
                            </label>

                            {/* Option 1: Reguler */}
                            <label 
                                onClick={() => setSelectedServiceType('REGULER')}
                                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                                    selectedServiceType === 'REGULER'
                                        ? 'bg-brand-50/60 border-brand-500 ring-2 ring-brand-500/20'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="service_type"
                                    checked={selectedServiceType === 'REGULER'}
                                    onChange={() => setSelectedServiceType('REGULER')}
                                    className="mt-1 text-brand-600"
                                />
                                <div>
                                    <p className="text-xs font-black text-gray-900">Jalur Reguler (Pemeriksaan LPH & Audit Mandiri)</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                        Untuk usaha menengah/besar atau produk berisiko tinggi dengan pemeriksaan auditor LPH.
                                    </p>
                                </div>
                            </label>

                            {/* Option 2: Self Declare Mandiri */}
                            <label 
                                onClick={() => setSelectedServiceType('SELF_DECLARE_MANDIRI')}
                                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                                    selectedServiceType === 'SELF_DECLARE_MANDIRI'
                                        ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="service_type"
                                    checked={selectedServiceType === 'SELF_DECLARE_MANDIRI'}
                                    onChange={() => setSelectedServiceType('SELF_DECLARE_MANDIRI')}
                                    className="mt-1 text-amber-600"
                                />
                                <div>
                                    <p className="text-xs font-black text-gray-900">Self Declare (Biaya Mandiri)</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                        Usaha mikro berisiko rendah yang membiayai proses pendampingan secara mandiri.
                                    </p>
                                </div>
                            </label>

                            {/* Option 3: Self Declare Gratis / Fasilitasi */}
                            <label 
                                onClick={() => setSelectedServiceType('SELF_DECLARE')}
                                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                                    selectedServiceType === 'SELF_DECLARE'
                                        ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="service_type"
                                    checked={selectedServiceType === 'SELF_DECLARE'}
                                    onChange={() => setSelectedServiceType('SELF_DECLARE')}
                                    className="mt-1 text-emerald-600"
                                />
                                <div>
                                    <p className="text-xs font-black text-gray-900">Self Declare (Fasilitasi Gratis BPJPH)</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                        Program kuota gratis pemerintah bagi UMK yang memenuhi syarat self declare BPJPH.
                                    </p>
                                </div>
                            </label>

                            {/* Consultation Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">
                                    Catatan Hasil Konsultasi & Rekomendasi (Opsional):
                                </label>
                                <textarea
                                    rows={2}
                                    className="w-full p-3 rounded-2xl border border-gray-200 text-xs font-medium bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                    placeholder="Contoh: Bahan baku sudah bersertifikat halal, fasilitas dapur terpisah, direkomendasikan jalur self declare..."
                                    value={consultNotes}
                                    onChange={e => setConsultNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConsultModal({ isOpen: false, submission: null })}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={savingService}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-brand-600/20 disabled:opacity-50"
                            >
                                {savingService ? 'Menyimpan...' : 'Simpan & Lanjutkan ke Tagihan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
