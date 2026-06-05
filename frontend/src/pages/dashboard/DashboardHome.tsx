import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CheckCircle, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatsCard from '../../components/ui/StatsCard';
import api from '../../services/api';
import { formatNumber } from '../../utils/format';
import type { AuditLog } from '../../types';

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

    useEffect(() => {
        if (user?.role === 'CLIENT') {
            api.get('/submissions')
                .then(res => setClientSubmissions(res.data || []))
                .catch(err => console.error(err))
                .finally(() => setLoadingClient(false));
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

    if (user?.role === 'CLIENT') {
        if (loadingClient) {
            return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand-600 w-8 h-8" /></div>;
        }

        const activeSub = clientSubmissions[0];

        return (
            <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
                {/* Welcome Banner */}
                <div className="glass-panel p-8 bg-brand-900 text-white relative overflow-hidden rounded-[24px]">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-brand-800 rounded-full blur-[100px] opacity-35"></div>
                    <div className="relative z-10 space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800 text-gold-400 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
                            Portal Klien HalalCore
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Selamat Datang, {user.full_name}</h1>
                        <p className="text-brand-100 max-w-xl text-sm leading-relaxed">
                            Pantau status dan lengkapi pengajuan sertifikasi halal usaha Anda langsung dari dashboard pribadi Anda.
                        </p>
                    </div>
                </div>

                {!activeSub ? (
                    /* Welcome / No Submission State */
                    <div className="glass-panel p-8 border border-brand-100 flex flex-col md:flex-row items-center gap-8 bg-white">
                        <div className="flex-1 space-y-4">
                            <h3 className="text-2xl font-black text-brand-900 tracking-tight">Mulai Sertifikasi Halal Anda</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Usaha Anda telah berhasil diverifikasi oleh tim telemarketing kami. Langkah berikutnya adalah menunggu berkas pengajuan Anda diaktifkan oleh pendamping halal kami.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <span className="text-sm font-bold text-amber-600 bg-amber-50/50 border border-amber-100 px-4 py-3 rounded-xl">
                                    Pengajuan Anda sedang dipersiapkan oleh tim pendamping kami. Silakan hubungi admin jika terdapat kendala.
                                </span>
                            </div>
                        </div>
                        
                        {/* Process Stepper Visual */}
                        <div className="w-full md:w-80 space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-150">
                            <h4 className="text-xs font-black uppercase tracking-widest text-brand-700 mb-2">Alur Sertifikasi</h4>
                            {[
                                "Isi Data & Dokumen Usaha",
                                "Verifikasi & Pembuatan Berkas",
                                "Sidang Fatwa",
                                "Penerbitan Sertifikat Halal"
                            ].map((step, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-105 flex items-center justify-center text-[10px] font-bold text-brand-700 shrink-0">
                                        {idx + 1}
                                    </div>
                                    <span className="text-xs text-gray-700 font-bold">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Active Submission State */
                    <div className="space-y-6">
                        {/* Progress Stepper */}
                        <div className="glass-panel p-6 border border-brand-100 bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No. Tracking</h3>
                                    <p className="text-xl font-mono font-bold text-brand-900">{activeSub.tracking_number || "Draft / Belum Diajukan"}</p>
                                </div>
                                <span className={`text-xs px-3.5 py-1.5 rounded-full font-black border uppercase tracking-wider ${
                                    activeSub.status === 'SH_TERBIT' ? 'bg-green-50 text-green-700 border-green-200' :
                                    activeSub.status === 'REVISION' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                                    activeSub.status === 'DRAFT' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    Status: {activeSub.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Revision Alert */}
                            {activeSub.status === 'REVISION' && activeSub.reject_note && (
                                <div className="p-4 bg-red-50 border border-red-150 rounded-2xl mb-6 flex gap-3 items-start">
                                    <div className="w-2 h-2 rounded-full bg-red-600 mt-2 shrink-0 animate-pulse"></div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-red-900 uppercase tracking-wider">Perlu Revisi Dokumen</h4>
                                        <p className="text-xs text-red-700 leading-relaxed font-medium">{activeSub.reject_note}</p>
                                    </div>
                                </div>
                            )}

                            {/* Visual Progress Steps */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-150">
                                {[
                                    { label: 'Drafting Data', status: ['DRAFT', 'REVISION'] },
                                    { label: 'Verifikasi Berkas', status: ['VERVAL_PENDAMPING', 'WAITING_PAYMENT'] },
                                    { label: 'Penyusunan Berkas & QC', status: ['QC_OFFICER', 'DRAFTER', 'QC_REVIEW'] },
                                    { label: 'Sidang Fatwa', status: ['SIDANG_FATWA'] },
                                    { label: 'Sertifikat Terbit 🎉', status: ['SH_TERBIT'] }
                                ].map((step, idx) => {
                                    const currentIdx = [
                                        ['DRAFT', 'REVISION'],
                                        ['VERVAL_PENDAMPING', 'WAITING_PAYMENT'],
                                        ['QC_OFFICER', 'DRAFTER', 'QC_REVIEW'],
                                        ['SIDANG_FATWA'],
                                        ['SH_TERBIT']
                                    ].findIndex(arr => arr.includes(activeSub.status));

                                    const isActive = idx === currentIdx;
                                    const isCompleted = idx < currentIdx;

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all ${
                                            isActive ? 'bg-brand-50/50 border-brand-200 ring-2 ring-brand-600/10' :
                                            isCompleted ? 'bg-green-50/40 border-green-100' :
                                            'bg-white/50 border-gray-150 opacity-60'
                                        }`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                                    isActive ? 'bg-brand-600 text-white' :
                                                    isCompleted ? 'bg-green-600 text-white' :
                                                    'bg-gray-100 text-gray-400 border border-gray-250'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                {isCompleted && <span className="text-[10px] font-black uppercase text-green-600 tracking-wider">Selesai</span>}
                                                {isActive && <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider animate-pulse">Aktif</span>}
                                            </div>
                                            <p className={`text-xs font-black leading-tight ${
                                                isActive ? 'text-brand-900' :
                                                isCompleted ? 'text-green-800 font-bold' :
                                                'text-gray-500'
                                            }`}>{step.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Detail Usaha & Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 border border-brand-100 bg-white md:col-span-2 space-y-4">
                                <h3 className="text-lg font-black text-brand-900 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                                    Detail Profil Usaha
                                </h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    {[
                                        ['Nama Usaha', activeSub.client?.business_name],
                                        ['Nama Pemilik', activeSub.client?.client_name],
                                        ['NIB', activeSub.client?.nib],
                                        ['NIK', activeSub.client?.nik],
                                        ['Produk Utama', activeSub.client?.product_name],
                                        ['CP / Telepon', activeSub.client?.phone],
                                    ].map(([label, val]) => (
                                        <div key={label} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</dt>
                                            <dd className="font-bold text-gray-700">{val || '-'}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            <div className="glass-panel p-6 border border-brand-100 bg-white space-y-4">
                                <h3 className="text-lg font-black text-brand-900 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                                    Tindakan Cepat
                                </h3>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => navigate(`/dashboard/submissions/${activeSub.id}`)}
                                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        Detail & Dokumen Pengajuan
                                    </button>
                                    
                                    {activeSub.status === 'SH_TERBIT' && activeSub.sh_url && (
                                        <a 
                                            href={`${import.meta.env.VITE_API_URL}${activeSub.sh_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 text-center font-bold"
                                        >
                                            Unduh Sertifikat Halal (SH)
                                        </a>
                                    )}

                                    {activeSub.status === 'WAITING_PAYMENT' && (
                                        <button 
                                            onClick={() => navigate(`/dashboard/submissions/${activeSub.id}`)}
                                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            Bayar Tagihan Sertifikasi
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
