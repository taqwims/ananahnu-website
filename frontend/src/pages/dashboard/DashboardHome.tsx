import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CheckCircle, Clock, Loader2, ShieldCheck, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatsCard from '../../components/ui/StatsCard';
import api from '../../services/api';
import { formatNumber, formatWhatsAppUrl } from '../../utils/format';
import { systemSettingsService } from '../../services/systemSettingsService';
import type { AuditLog } from '../../types';
import OperationalManagerDashboard from './OperationalManagerDashboard';
import MarketingManagerDashboard from './MarketingManagerDashboard';
import HalalAdvisorDashboard from './HalalAdvisorDashboard';

interface DashboardStats {
    total_clients: number;
    sh_terbit: number;
    sidang_fatwa: number;
    pending: number;
    audited?: number;
    not_audited?: number;
}

const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#f43f5e'];

export default function DashboardHome() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore(state => state.user);

    const [clientSubmissions, setClientSubmissions] = useState<any[]>([]);
    const [loadingClient, setLoadingClient] = useState(user?.role === 'CLIENT');
    const [adminWaPhone, setAdminWaPhone] = useState('6281564955280');
    const [waMessage, setWaMessage] = useState('Halo Admin HalalCore, saya membutuhkan bantuan terkait pengajuan sertifikasi halal.');

    useEffect(() => {
        if (user?.role === 'CLIENT') {
            api.get('/submissions')
                .then(res => setClientSubmissions(res.data || []))
                .catch(err => console.error(err))
                .finally(() => setLoadingClient(false));

            systemSettingsService.getAll().then(res => {
                const p = res?.CS_PHONE || res?.cs_phone || res?.company_phone || res?.admin_whatsapp_number;
                if (p) setAdminWaPhone(p);
                const msg = res?.WHATSAPP_DEFAULT_MESSAGE || res?.whatsapp_default_message;
                if (msg) setWaMessage(msg);
            }).catch(() => {});
        }
    }, [user]);

    useEffect(() => {
        if (user?.role === 'CLIENT') return;
        const fetchData = async () => {
            try {
                const [statsRes, activitiesRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/activities')
                ]);
                setStats(statsRes.data);
                setActivities(activitiesRes.data || []);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (user?.role === 'MANAGER') {
        return <OperationalManagerDashboard />;
    }

    if (user?.role === 'BUSINESS_DEVELOPMENT' || user?.role === 'MARKETING') {
        return <MarketingManagerDashboard />;
    }

    if (user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR') {
        return <HalalAdvisorDashboard />;
    }

    if (user?.role === 'CLIENT') {
        if (loadingClient) {
            return <div className="h-full flex items-center justify-center py-24"><Loader2 className="animate-spin text-brand-600 w-8 h-8" /></div>;
        }

        const activeSub = clientSubmissions.find(s => s.status !== 'SH_TERBIT' && s.status !== 'CANCELLED') || clientSubmissions[0];
        
        // Calculate statistics
        const totalAktif = clientSubmissions.filter(s => s.status !== 'SH_TERBIT' && s.status !== 'CANCELLED').length;
        const totalMenunggu = clientSubmissions.filter(s => s.status === 'DRAFT' || s.status === 'WAITING_PAYMENT' || s.status === 'REVISION').length;
        const totalSertifikat = clientSubmissions.filter(s => s.status === 'SH_TERBIT').length;
        const totalDitolak = clientSubmissions.filter(s => s.status === 'REVISION' || s.status === 'CANCELLED').length;

        const getStatusBadge = (status: string) => {
            switch (status) {
                case 'SH_TERBIT':
                    return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">Selesai</span>;
                case 'REVISION':
                case 'CANCELLED':
                    return <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">Perlu Revisi</span>;
                default:
                    return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">Proses</span>;
            }
        };

        const getTahapName = (status: string) => {
            switch (status) {
                case 'DRAFT': return 'Input Data Pengajuan';
                case 'VERVAL_PENDAMPING': return 'Verifikasi Dokumen oleh Halal Advisor';
                case 'WAITING_PAYMENT': return 'Menunggu Pembayaran Tagihan';
                case 'QC_OFFICER':
                case 'DRAFTER':
                case 'QC_REVIEW': return 'Penyusunan Berkas & QC';
                case 'SIDANG_FATWA': return 'Sidang Fatwa MUI';
                case 'SH_TERBIT': return 'Sertifikat Terbit 🎉';
                default: return status.replace(/_/g, ' ');
            }
        };

        return (
            <div className="space-y-8 max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
                {/* Top Welcome Title */}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Selamat datang, {user.full_name} <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Kelola pengajuan Sertifikat Halal usaha Anda dengan mudah bersama HalalCore.
                    </p>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="glass-panel p-5 bg-white border border-gray-150 rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{totalAktif}</p>
                            <p className="text-xs font-bold text-gray-700">Pengajuan Aktif</p>
                            <p className="text-[10px] text-gray-400 font-medium">Sedang dalam proses</p>
                        </div>
                    </div>

                    <div className="glass-panel p-5 bg-white border border-gray-150 rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{totalMenunggu}</p>
                            <p className="text-xs font-bold text-gray-700">Menunggu Tindakan</p>
                            <p className="text-[10px] text-gray-400 font-medium">Menunggu kelengkapan</p>
                        </div>
                    </div>

                    <div className="glass-panel p-5 bg-white border border-gray-150 rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{totalSertifikat}</p>
                            <p className="text-xs font-bold text-gray-700">Sertifikat Terbit</p>
                            <p className="text-[10px] text-gray-400 font-medium">Total sertifikat halal</p>
                        </div>
                    </div>

                    <div className="glass-panel p-5 bg-white border border-gray-150 rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{totalDitolak}</p>
                            <p className="text-xs font-bold text-gray-700">Pengajuan Ditolak</p>
                            <p className="text-[10px] text-gray-400 font-medium">Perlu diperbaiki</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Ajukan Layanan Baru & Daftar Ajuan Terbaru */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section: Ajukan Sertifikasi Halal (Alur Terpadu) */}
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white space-y-4 shadow-xl shadow-brand-500/10 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-2 max-w-xl">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider border border-white/20">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                        Alur Terpadu Sertifikasi Halal
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        Daftarkan Produk & Usaha Anda
                                    </h3>
                                    <p className="text-xs text-white/80 font-medium leading-relaxed">
                                        Cukup lengkapi data pelaku usaha dan informasi usaha Anda. Halal Advisor kami akan mendampingi dan menentukan jalur sertifikasi terbaik untuk usaha Anda.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/dashboard/pengajuan')}
                                    className="px-6 py-4 bg-white hover:bg-gray-50 text-brand-900 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                                >
                                    <span>Mulai Pengajuan</span>
                                    <ArrowRight className="w-4 h-4 text-brand-600" />
                                </button>
                            </div>

                            {/* 3 Step Workflow Indicator */}
                            <div className="relative z-10 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                                    <p className="font-black text-white flex items-center gap-1.5 text-[11px]">
                                        <span className="w-5 h-5 rounded-full bg-white text-brand-800 flex items-center justify-center text-[10px] font-black">1</span>
                                        Input Data Usaha
                                    </p>
                                    <p className="text-[10px] text-white/70">Isi identitas pemilik, NIB, dan profil usaha.</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                                    <p className="font-black text-white flex items-center gap-1.5 text-[11px]">
                                        <span className="w-5 h-5 rounded-full bg-white text-brand-800 flex items-center justify-center text-[10px] font-black">2</span>
                                        Konsultasi Advisor
                                    </p>
                                    <p className="text-[10px] text-white/70">Advisor menentukan jalur & estimasi tarif.</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                                    <p className="font-black text-white flex items-center gap-1.5 text-[11px]">
                                        <span className="w-5 h-5 rounded-full bg-white text-brand-800 flex items-center justify-center text-[10px] font-black">3</span>
                                        Proses & SH Terbit
                                    </p>
                                    <p className="text-[10px] text-white/70">Penyusunan berkas, sidang fatwa & sertifikat terbit.</p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Daftar Ajuan Terbaru */}
                        <div className="glass-panel p-6 bg-white border border-gray-150 rounded-3xl space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-gray-900">Daftar Ajuan Terbaru</h3>
                                <button
                                    onClick={() => navigate('/dashboard/submissions')}
                                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                                >
                                    Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {clientSubmissions.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 space-y-3">
                                    <p className="text-xs text-gray-500 font-medium">Belum ada pengajuan sertifikasi halal.</p>
                                    <button
                                        onClick={() => navigate('/dashboard/pengajuan')}
                                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                        Buat Pengajuan Sekarang
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[10px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-3 px-4">No. Ajuan</th>
                                                <th className="py-3 px-4">Layanan</th>
                                                <th className="py-3 px-4">Tanggal Ajuan</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Tahap Saat Ini</th>
                                                <th className="py-3 px-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {clientSubmissions.slice(0, 5).map((sub) => (
                                                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 px-4 font-mono font-bold text-gray-800">
                                                        {sub.tracking_number || sub.id.slice(0, 8)}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-gray-700">
                                                        {sub.service_type === 'REGULER' ? 'Reguler' : sub.service_type === 'SELF_DECLARE_MANDIRI' ? 'Self Declare (Mandiri)' : 'Self Declare (Fasilitasi)'}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500">
                                                        {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {getStatusBadge(sub.status)}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-600 font-medium">
                                                        {getTahapName(sub.status)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                            className="p-1.5 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 text-gray-500 rounded-lg transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {clientSubmissions.length > 0 && (
                                <div className="pt-2 text-center">
                                    <button
                                        onClick={() => navigate('/dashboard/submissions')}
                                        className="text-xs font-bold text-brand-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                                    >
                                        Lihat Semua Ajuan <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Quick Banner, Active Stepper, Support */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Ajukan Sertifikat Halal Promo Card */}
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 text-white space-y-4 shadow-xl shadow-brand-900/10 relative overflow-hidden">
                            <div className="relative z-10 space-y-2">
                                <h4 className="text-xl font-black tracking-tight">Ajukan Sertifikat Halal</h4>
                                <p className="text-xs text-brand-100/90 font-medium leading-relaxed">
                                    Proses mudah, cepat, dan sesuai ketentuan BPJPH Kementerian Agama.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/pengajuan')}
                                    className="mt-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    Ajukan Sekarang <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Pengajuan Aktif Stepper Card */}
                        {activeSub && (
                            <div className="glass-panel p-6 bg-white border border-gray-150 rounded-3xl space-y-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-gray-900">Pengajuan Aktif</h4>
                                    <button
                                        onClick={() => navigate(`/dashboard/submissions/${activeSub.id}`)}
                                        className="text-[11px] font-bold text-brand-600 hover:underline"
                                    >
                                        Lihat Detail →
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                                        {activeSub.service_type === 'REGULER' ? 'Reguler' : 'Self Declare'}
                                    </span>
                                    <h5 className="text-sm font-black text-gray-900 leading-tight">
                                        {activeSub.client?.business_name || user.full_name} – {activeSub.client?.product_name || 'Produk Usaha'}
                                    </h5>
                                    <p className="text-[10px] text-gray-400 font-mono">
                                        No. Ajuan: {activeSub.tracking_number || activeSub.id.slice(0, 8)}
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tahap Saat Ini</p>
                                    <p className="text-xs font-bold text-brand-700">
                                        {getTahapName(activeSub.status)}
                                    </p>
                                </div>

                                {/* Mini Stepper */}
                                <div className="grid grid-cols-5 gap-1 pt-3">
                                    {['Pengajuan', 'Verifikasi', 'Pendampingan', 'SIHALAL', 'Selesai'].map((step, idx) => {
                                        const currentStepIdx = ['DRAFT', 'VERVAL_PENDAMPING', 'WAITING_PAYMENT', 'SIDANG_FATWA', 'SH_TERBIT'].findIndex(s => s === activeSub.status);
                                        const isDone = idx <= (currentStepIdx >= 0 ? currentStepIdx : 0);

                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-1 text-center">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${
                                                    isDone ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {isDone ? '✓' : idx + 1}
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-500 leading-tight">{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Butuh Bantuan Card */}
                        <div className="glass-panel p-6 bg-white border border-gray-150 rounded-3xl space-y-4 shadow-sm">
                            <div>
                                <h4 className="text-sm font-black text-gray-900">Butuh Bantuan?</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Tim HalalCore siap membantu Anda.</p>
                            </div>
                            <a
                                href={formatWhatsAppUrl(adminWaPhone, waMessage)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                Hubungi Kami via WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    }

    const pieData = [
        { name: 'SH Terbit', value: stats?.sh_terbit || 0 },
        { name: 'Sidang Fatwa', value: stats?.sidang_fatwa || 0 },
        { name: 'Pending', value: stats?.pending || 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
                </div>
            </div>

            {/* Coordinator Info for Consultants */}
            {user?.role === 'HALAL_ADVISOR' && (
                <div className="glass-panel p-4 bg-indigo-50 border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Halal Manager Anda</p>
                            <h3 className="text-lg font-black text-indigo-900 leading-tight">
                                {user.leader?.full_name || 'Belum Ditentukan'}
                            </h3>
                            {user.leader?.email && (
                                <p className="text-xs text-indigo-600/60 font-medium">{user.leader.email}</p>
                            )}
                        </div>
                    </div>
                    {!user.leader && (
                        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            Menunggu Penugasan
                        </div>
                    )}
                </div>
            )}

            {/* Marketing Info Banner */}
            {user?.role === 'MARKETING' && (
                <div className="glass-panel p-4 bg-amber-50 border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Marketing Partner</p>
                            <h3 className="text-lg font-black text-amber-900 leading-tight">
                                Selamat datang, {user.full_name}
                            </h3>
                            <p className="text-xs text-amber-600/60 font-medium">Data yang Anda input akan otomatis ditandai sebagai sumber Marketing (Partner)</p>
                        </div>
                    </div>
                    {user.leader && (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Halal Manager</p>
                            <p className="text-sm font-bold text-amber-800">{user.leader.full_name}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {user?.role === 'AUDIT_MANAGER' ? (
                    <>
                        <StatsCard
                            title="Total Pengajuan Reguler"
                            value={formatNumber((stats?.audited || 0) + (stats?.not_audited || 0))}
                            icon={FileText}
                        />
                        <StatsCard
                            title="Sudah Diaudit"
                            value={formatNumber(stats?.audited || 0)}
                            icon={CheckCircle}
                        />
                        <StatsCard
                            title="Belum Diaudit"
                            value={formatNumber(stats?.not_audited || 0)}
                            icon={Clock}
                        />
                        <StatsCard
                            title="Sertifikat Halal Terbit"
                            value={formatNumber(stats?.sh_terbit || 0)}
                            icon={ShieldCheck}
                        />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Total Clients"
                            value={formatNumber(stats?.total_clients || 0)}
                            icon={Users}
                            trend="+12%"
                            trendUp={true}
                        />
                        <StatsCard
                            title="SH Terbit"
                            value={formatNumber(stats?.sh_terbit || 0)}
                            icon={CheckCircle}
                            trend="+5%"
                            trendUp={true}
                        />
                        <StatsCard
                            title="Proses Fatwa"
                            value={formatNumber(stats?.sidang_fatwa || 0)}
                            icon={FileText}
                        />
                        <StatsCard
                            title="Pending Actions"
                            value={formatNumber(stats?.pending || 0)}
                            icon={Clock}
                            trend="-2%"
                            trendUp={false}
                        />
                    </>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Submission Status Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                                <span>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Placeholder for Recent Activity */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                        ) : (
                            activities.map(activity => (
                                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-[10px] font-bold">
                                        {activity.action.substring(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate" title={activity.notes || activity.action}>
                                            {activity.notes || activity.action}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {activity.user?.full_name || 'System'} • {formatTimeAgo(activity.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
