import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Users,
    Search,
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    UserCheck,
    Send,
    Award,
    RotateCcw,
    FileCheck,
    Briefcase,
    RefreshCw,
    Pause,
    Play
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { operationalService, type OperationalStats } from '../../services/operationalService';

// ─── Skeleton Components ───────────────────────────────────────
const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`} 
         style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
);

const StatCardSkeleton = () => (
    <div className="p-4 rounded-2xl bg-white border border-gray-150 shadow-sm">
        <SkeletonPulse className="w-9 h-9 rounded-xl" />
        <SkeletonPulse className="w-20 h-3 rounded-md mt-3" />
        <SkeletonPulse className="w-12 h-7 rounded-md mt-1.5" />
        <SkeletonPulse className="w-16 h-2.5 rounded-md mt-2" />
    </div>
);

const PipelineStepSkeleton = () => (
    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
            <SkeletonPulse className="w-4 h-4 rounded" />
            <SkeletonPulse className="w-6 h-3 rounded" />
        </div>
        <SkeletonPulse className="w-full h-3 rounded-md mb-2" />
        <SkeletonPulse className="w-8 h-6 rounded-md" />
        <SkeletonPulse className="w-full h-1 rounded-full mt-2" />
    </div>
);

const ActionItemSkeleton = () => (
    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <SkeletonPulse className="w-8 h-8 rounded-xl" />
            <SkeletonPulse className="w-36 h-3 rounded-md" />
        </div>
        <SkeletonPulse className="w-10 h-5 rounded-lg" />
    </div>
);

const TeamRowSkeleton = () => (
    <tr>
        <td className="py-2.5">
            <div className="flex items-center gap-2">
                <SkeletonPulse className="w-6 h-6 rounded-lg" />
                <SkeletonPulse className="w-24 h-3 rounded-md" />
            </div>
        </td>
        <td className="py-2.5">
            <SkeletonPulse className="w-16 h-3 rounded-md" />
        </td>
        <td className="py-2.5 text-center">
            <SkeletonPulse className="w-8 h-3 rounded-md mx-auto" />
        </td>
        <td className="py-2.5 text-right">
            <SkeletonPulse className="w-14 h-5 rounded-md ml-auto" />
        </td>
    </tr>
);

const ActivitySkeleton = () => (
    <div className="flex items-start gap-3">
        <SkeletonPulse className="w-7 h-7 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
            <SkeletonPulse className="w-3/4 h-3 rounded-md" />
            <SkeletonPulse className="w-1/2 h-2.5 rounded-md" />
        </div>
        <SkeletonPulse className="w-14 h-3 rounded-md" />
    </div>
);

// ─── Date Range Types ──────────────────────────────────────────
type DateRange = 'today' | 'week' | 'month';
const DATE_RANGE_LABELS: Record<DateRange, string> = {
    today: 'Hari Ini',
    week: 'Minggu Ini',
    month: 'Bulan Ini',
};

const AUTO_REFRESH_INTERVAL = 30; // seconds

export default function OperationalManagerDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<OperationalStats | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('today');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [countdown, setCountdown] = useState<number>(AUTO_REFRESH_INTERVAL);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isInitialLoad = useRef<boolean>(true);

    const fetchStats = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await operationalService.getDashboardStats();
            if (data) {
                setStats(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
            setCountdown(AUTO_REFRESH_INTERVAL);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto-refresh countdown + polling
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);

        if (!autoRefresh) return;

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchStats(true); // silent refresh
                    return AUTO_REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [autoRefresh, fetchStats]);

    // Show skeletons only on initial load (not on silent refreshes)
    const showSkeleton = loading && isInitialLoad.current;

    // ─── Derived Data (only when stats available) ──────────────
    const totalActive = (stats?.unassigned_count || 0) + 
                        (stats?.waiting_qc_count || 0) + 
                        (stats?.waiting_hdo_count || 0) + 
                        (stats?.waiting_sd_count || 0) + 
                        (stats?.scheduled_audit_count || 0);

    const pipelineSteps = stats ? [
        { 
            label: 'Pengajuan Masuk', 
            count: stats.unassigned_count || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.unassigned_count || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-emerald-500/10 to-emerald-500/5', 
            border: 'border-emerald-500', 
            text: 'text-emerald-700', 
            icon: FileText, 
            path: '/dashboard/pengajuan-masuk' 
        },
        { 
            label: 'Pemeriksaan QC', 
            count: stats.waiting_qc_count || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.waiting_qc_count || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-teal-500/10 to-teal-500/5', 
            border: 'border-teal-500', 
            text: 'text-teal-700', 
            icon: Search, 
            path: '/dashboard/antrean-qc' 
        },
        { 
            label: 'Perbaikan Data', 
            count: stats.urgent_actions?.filter(u => u.stage === 'REVISION_ADVISOR')?.length || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.urgent_actions?.filter(u => u.stage === 'REVISION_ADVISOR')?.length || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-amber-500/10 to-amber-500/5', 
            border: 'border-amber-500', 
            text: 'text-amber-700', 
            icon: RotateCcw, 
            path: '/dashboard/antrean-qc' 
        },
        { 
            label: 'Penyusunan HDO', 
            count: stats.waiting_hdo_count || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.waiting_hdo_count || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-blue-500/10 to-blue-500/5', 
            border: 'border-blue-500', 
            text: 'text-blue-700', 
            icon: Briefcase, 
            path: '/dashboard/antrean-hdo' 
        },
        { 
            label: 'Submit SIHALAL', 
            count: stats.status_distribution?.['SUBMITTED_TO_BPJPH'] || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.status_distribution?.['SUBMITTED_TO_BPJPH'] || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-indigo-500/10 to-indigo-500/5', 
            border: 'border-indigo-500', 
            text: 'text-indigo-700', 
            icon: Send, 
            path: '/dashboard/antrean-hdo' 
        },
        { 
            label: 'Verifikasi/Audit', 
            count: stats.scheduled_audit_count || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.scheduled_audit_count || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-purple-500/10 to-purple-500/5', 
            border: 'border-purple-500', 
            text: 'text-purple-700', 
            icon: UserCheck, 
            path: '/dashboard/manajemen-audit' 
        },
        { 
            label: 'Sertifikat Terbit', 
            count: stats.sh_terbit_count || 0, 
            percentage: totalActive > 0 ? `${Math.round(((stats.sh_terbit_count || 0) / totalActive) * 100)}%` : '0%', 
            color: 'from-green-600/10 to-green-600/5', 
            border: 'border-green-600', 
            text: 'text-green-700', 
            icon: Award, 
            path: '/dashboard/laporan-operasional' 
        },
    ] : [];

    const statusData = stats ? [
        { name: 'Self Declare', value: stats.waiting_sd_count || 0, color: '#10b981' },
        { name: 'Reguler', value: Math.max(0, (stats.total_new_submissions || 0) - (stats.waiting_sd_count || 0)), color: '#f59e0b' },
        { name: 'Sertifikat Terbit', value: stats.sh_terbit_count || 0, color: '#3b82f6' },
        { name: 'Pending', value: stats.unassigned_count || 0, color: '#8b5cf6' },
    ] : [];

    const teamWorkload = stats?.team_workload && stats.team_workload.length > 0 
        ? stats.team_workload.map(tw => ({
            name: `${tw.role} - ${tw.staff_name.split(' ')[0]}`,
            initial: tw.staff_name.substring(0, 2).toUpperCase(),
            queue: Number(tw.active_tasks),
            max: 20,
            done: Number(tw.completed),
            status: tw.status,
            statusColor: tw.status === 'Penuh' ? 'bg-red-50 text-red-700 border-red-200' :
                         tw.status === 'Sibuk' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         'bg-emerald-50 text-emerald-700 border-emerald-200'
        }))
        : [];

    const activities = stats?.recent_activities && stats.recent_activities.length > 0
        ? stats.recent_activities.slice(0, 5).map(act => ({
            title: act.detail || act.action,
            desc: `${act.user} • Target: ${act.target}`,
            time: new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            icon: act.action.includes('ASSIGN') ? Users :
                  act.action.includes('RETURN') ? RotateCcw :
                  act.action.includes('AUDIT') ? Calendar : CheckCircle2,
            color: act.action.includes('RETURN') ? 'text-amber-600 bg-amber-50' :
                   act.action.includes('AUDIT') ? 'text-purple-600 bg-purple-50' :
                   'text-emerald-600 bg-emerald-50'
        }))
        : [];

    // Date range display
    const getDateRangeDisplay = () => {
        const now = new Date();
        switch (dateRange) {
            case 'today':
                return now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
            case 'week': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay() + 1);
                return `${startOfWeek.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })} - ${now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
            }
            case 'month':
                return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Shimmer keyframe injection */}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 font-medium">Pemantauan alur operasional dan produktivitas tim secara terpusat.</p>
                        {lastUpdated && (
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Auto-refresh Toggle + Countdown */}
                    <button
                        onClick={() => setAutoRefresh(prev => !prev)}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border shadow-sm flex items-center gap-1.5 transition-all ${
                            autoRefresh 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        {autoRefresh ? (
                            <>
                                <Pause className="w-3 h-3" />
                                <span>Auto {countdown}s</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3" />
                                <span>Auto Off</span>
                            </>
                        )}
                    </button>

                    {/* Manual Refresh */}
                    <button
                        onClick={() => fetchStats()}
                        disabled={loading}
                        className="text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1.5 transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-gray-400'}`} />
                        <span>Refresh</span>
                    </button>

                    {/* Date Range Selector */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {(['today', 'week', 'month'] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`text-[11px] font-bold px-3 py-1.5 transition-all ${
                                    dateRange === range
                                        ? 'bg-brand-700 text-white'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {DATE_RANGE_LABELS[range]}
                            </button>
                        ))}
                    </div>

                    {/* Date Display */}
                    <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{getDateRangeDisplay()}</span>
                    </div>
                </div>
            </div>

            {/* 6 Top Stats Cards */}
            {showSkeleton ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* 1. Pengajuan Baru */}
                    <div 
                        onClick={() => navigate('/dashboard/pengajuan-masuk')}
                        className="p-4 rounded-2xl bg-white border border-gray-150 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 mt-2.5">Total Pengajuan</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">{stats?.total_new_submissions ?? 0}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Database Live</span>
                        </p>
                    </div>

                    {/* 2. Belum Ditugaskan */}
                    <div 
                        onClick={() => navigate('/dashboard/pengajuan-masuk')}
                        className="p-4 rounded-2xl bg-white border border-gray-150 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 mt-2.5">Belum Ditugaskan</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">{stats?.unassigned_count ?? 0}</p>
                        <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-0.5">
                            <span>Perlu Penugasan</span>
                        </p>
                    </div>

                    {/* 3. Dalam QC */}
                    <div 
                        onClick={() => navigate('/dashboard/antrean-qc')}
                        className="p-4 rounded-2xl bg-white border border-gray-150 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
                                <Search className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 mt-2.5">Dalam QC</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">{stats?.waiting_qc_count ?? 0}</p>
                        <p className="text-[10px] font-bold text-teal-600 mt-1 flex items-center gap-0.5">
                            <span>Pemeriksaan Aktif</span>
                        </p>
                    </div>

                    {/* 4. Dalam Proses HDO */}
                    <div 
                        onClick={() => navigate('/dashboard/antrean-hdo')}
                        className="p-4 rounded-2xl bg-white border border-gray-150 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                                <FileCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 mt-2.5">Dalam Proses HDO</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">{stats?.waiting_hdo_count ?? 0}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1 flex items-center gap-0.5">
                            <span>Penyusunan Berkas</span>
                        </p>
                    </div>

                    {/* 5. Siap Dijadwalkan Audit */}
                    <div 
                        onClick={() => navigate('/dashboard/manajemen-audit')}
                        className="p-4 rounded-2xl bg-white border border-gray-150 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 mt-2.5">Audit Terjadwal</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5">{stats?.scheduled_audit_count ?? 0}</p>
                        <p className="text-[10px] font-bold text-purple-600 mt-1 flex items-center gap-0.5">
                            <span>Mitra LPH</span>
                        </p>
                    </div>

                    {/* 6. Melewati SLA / Prioritas Tinggi */}
                    <div 
                        onClick={() => navigate('/dashboard/pengajuan-masuk')}
                        className="p-4 rounded-2xl bg-red-50/60 border border-red-200 shadow-sm hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 group-hover:scale-105 transition-transform">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-red-800 mt-2.5">Prioritas Tinggi</p>
                        <p className="text-2xl font-black text-red-600 mt-0.5">{stats?.high_priority_count ?? 0}</p>
                        <p className="text-[10px] font-bold text-red-700 mt-1 flex items-center gap-0.5">
                            <span>Perlu Tindak Lanjut</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Pipeline Section & Perlu Tindakan */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Pipeline Pengajuan */}
                <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-gray-150 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-gray-900">Pipeline Pengajuan</h2>
                            <p className="text-xs text-gray-500 font-medium">Alur proses berjalan dari berkas masuk hingga sertifikat terbit.</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                            autoRefresh 
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                : 'text-gray-500 bg-gray-50 border-gray-200'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            {autoRefresh ? 'Live' : 'Paused'}
                        </span>
                    </div>

                    {/* Step Chevrons / Workflow Bar */}
                    {showSkeleton ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => <PipelineStepSkeleton key={i} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {pipelineSteps.map((step, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate(step.path)}
                                    className={`p-3 rounded-2xl bg-gradient-to-b ${step.color} border ${step.border} cursor-pointer hover:scale-[1.02] transition-all flex flex-col justify-between`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <step.icon className={`w-4 h-4 ${step.text}`} />
                                        <span className="text-[10px] font-bold text-gray-400">{step.percentage}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 leading-tight mb-1">{step.label}</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xl font-black text-gray-900">{step.count}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">dok</span>
                                        </div>
                                    </div>
                                    <div className={`w-full h-1 rounded-full mt-2 ${step.border.replace('border-', 'bg-')}`}></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer Totals in Pipeline */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Total Pengajuan di Sistem:</span>
                            {showSkeleton ? (
                                <SkeletonPulse className="w-10 h-5 rounded-md" />
                            ) : (
                                <span className="text-lg font-black text-gray-900">{stats?.total_new_submissions ?? 0}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Sertifikat Terbit:</span>
                            {showSkeleton ? (
                                <SkeletonPulse className="w-10 h-5 rounded-md" />
                            ) : (
                                <>
                                    <span className="text-lg font-black text-emerald-600">{stats?.sh_terbit_count ?? 0}</span>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Aktif Terverifikasi</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Perlu Tindakan */}
                <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-gray-150 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-black text-gray-900">Perlu Tindakan</h2>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    </div>

                    {showSkeleton ? (
                        <div className="space-y-2.5">
                            {Array.from({ length: 4 }).map((_, i) => <ActionItemSkeleton key={i} />)}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            <div 
                                onClick={() => navigate('/dashboard/pengajuan-masuk')}
                                className="p-3 rounded-2xl bg-red-50/50 border border-red-100 hover:border-red-300 transition-all flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-800">Pengajuan belum ditugaskan</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-xs font-black">{stats?.unassigned_count ?? 0}</span>
                                    <span className="text-xs text-brand-600 font-bold group-hover:translate-x-0.5 transition-transform">Lihat →</span>
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/dashboard/pengajuan-masuk')}
                                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 hover:border-amber-300 transition-all flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xs">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-800">Pengajuan prioritas tinggi</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">{stats?.high_priority_count ?? 0}</span>
                                    <span className="text-xs text-brand-600 font-bold group-hover:translate-x-0.5 transition-transform">Lihat →</span>
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/dashboard/manajemen-audit')}
                                className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-800">Jadwal audit konfirmasi</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-black">{stats?.scheduled_audit_count ?? 0}</span>
                                    <span className="text-xs text-brand-600 font-bold group-hover:translate-x-0.5 transition-transform">Lihat →</span>
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/dashboard/antrean-qc')}
                                className="p-3 rounded-2xl bg-amber-50/40 border border-amber-100 hover:border-amber-300 transition-all flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xs">
                                        <RotateCcw className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-800">Data dikembalikan ke advisor</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">{stats?.urgent_actions?.filter(u => u.stage === 'REVISION_ADVISOR')?.length ?? 0}</span>
                                    <span className="text-xs text-brand-600 font-bold group-hover:translate-x-0.5 transition-transform">Lihat →</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom 3 Columns Grid: Status Distribution, Team Workload, Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Distribusi Status Pengajuan */}
                <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-black text-gray-900">Distribusi Status Pengajuan</h2>
                        <p className="text-xs text-gray-500 font-medium">Proporsi pengajuan aktif menurut skema & status.</p>
                    </div>

                    {showSkeleton ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
                            <div className="h-44 flex items-center justify-center">
                                <SkeletonPulse className="w-36 h-36 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <SkeletonPulse className="w-2.5 h-2.5 rounded-full" />
                                            <SkeletonPulse className="w-20 h-3 rounded-md" />
                                        </div>
                                        <SkeletonPulse className="w-8 h-3 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
                            {/* Donut Chart */}
                            <div className="h-44 relative flex items-center justify-center">
                                {statusData.length > 0 && statusData.some(d => d.value > 0) ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                                            <span className="text-xl font-black text-gray-900">{stats?.total_new_submissions ?? 0}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <HelpCircle className="w-8 h-8 mb-1" />
                                        <span className="text-xs font-medium">Belum ada data</span>
                                    </div>
                                )}
                            </div>

                            {/* Legends */}
                            <div className="space-y-2">
                                {statusData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                            <span className="font-bold text-gray-700">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-black text-gray-900">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Data tersinkronisasi database</span>
                        <HelpCircle className="w-3.5 h-3.5 cursor-pointer hover:text-gray-600" />
                    </div>
                </div>

                {/* 2. Beban Kerja Tim */}
                <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-black text-gray-900">Beban Kerja Tim</h2>
                        <p className="text-xs text-gray-500 font-medium">Monitoring antrean aktif dan kapasitas staf.</p>
                    </div>

                    {showSkeleton ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                    <tr>
                                        <th className="pb-2">Anggota Tim</th>
                                        <th className="pb-2">Antrean</th>
                                        <th className="pb-2 text-center">Selesai</th>
                                        <th className="pb-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Array.from({ length: 4 }).map((_, i) => <TeamRowSkeleton key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : teamWorkload.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                    <tr>
                                        <th className="pb-2">Anggota Tim</th>
                                        <th className="pb-2">Antrean</th>
                                        <th className="pb-2 text-center">Selesai</th>
                                        <th className="pb-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teamWorkload.map((staff, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-bold text-[10px] flex items-center justify-center border border-brand-100">
                                                        {staff.initial}
                                                    </div>
                                                    <span className="font-bold text-gray-800 truncate max-w-[100px]">{staff.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 pr-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-gray-900 w-4">{staff.queue}</span>
                                                    <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${staff.queue > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                            style={{ width: `${Math.min(100, (staff.queue / staff.max) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 text-center font-bold text-gray-600">
                                                {staff.done}
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${staff.statusColor}`}>
                                                    {staff.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Users className="w-8 h-8 mb-1.5" />
                            <span className="text-xs font-bold text-gray-500">Belum ada data tim</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Data akan muncul setelah ada penugasan staf.</span>
                        </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            {autoRefresh ? `Auto-refresh ${countdown}s` : 'Real-time database'}
                        </span>
                    </div>
                </div>

                {/* 3. Aktivitas Terbaru */}
                <div className="p-6 rounded-3xl bg-white border border-gray-150 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <h2 className="text-base font-black text-gray-900">Aktivitas Terbaru</h2>
                        <p className="text-xs text-gray-500 font-medium">Log kejadian dan perubahan alur kerja sistem.</p>
                    </div>

                    {showSkeleton ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => <ActivitySkeleton key={i} />)}
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="space-y-3">
                            {activities.map((act, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${act.color}`}>
                                        <act.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-gray-800 leading-snug">{act.title}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{act.desc}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{act.time}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <CheckCircle2 className="w-8 h-8 mb-1.5" />
                            <span className="text-xs font-bold text-gray-500">Belum ada aktivitas</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Aktivitas akan muncul saat ada perubahan status pengajuan.</span>
                        </div>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                        <button 
                            onClick={() => navigate('/dashboard/notifikasi-operasional')}
                            className="w-full text-center text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1"
                        >
                            Lihat semua aktivitas →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
