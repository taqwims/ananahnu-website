import { useEffect, useState } from 'react';
import { 
    FileText, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Loader2, 
    TrendingUp, 
    Users, 
    BarChart3,
    Calendar,
    CalendarDays,
    Mail,
    Search,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import api from '../../services/api';
import StatsCard from '../../components/ui/StatsCard';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer, 
    AreaChart, 
    Area 
} from 'recharts';

interface DrafterPerformance {
    drafter_id: string;
    full_name: string;
    email: string;
    total: number;
    drafter: number;
    qc_review: number;
    sidang_fatwa: number;
    sh_terbit: number;
    revision: number;
    others: number;
}

interface DailyReportItem {
    date: string;
    assigned: number;
    completed: number;
}

interface MonthlyReportItem {
    month: string;
    assigned: number;
    completed: number;
}

interface AnalyticsData {
    total_drafts: number;
    active_drafts: number;
    completed_drafts: number;
    revision_drafts: number;
    drafter_performance: DrafterPerformance[];
    daily_report: DailyReportItem[];
    monthly_report: MonthlyReportItem[];
}

export default function DraftManagerDashboard() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly'>('daily');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof DrafterPerformance>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await api.get('/dashboard/draft-manager/analytics');
                setAnalytics(res.data);
                setError(null);
            } catch (err: any) {
                console.error("Gagal memuat analitik draft manager", err);
                setError(err.response?.data?.message || "Gagal memuat analitik draft manager");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const handleSort = (field: keyof DrafterPerformance) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedDrafters = [...(analytics?.drafter_performance || [])]
        .filter(d => 
            d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            }
            
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === 'asc' ? valA - valB : valB - valA;
            }
            
            return 0;
        });

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menghubungkan ke analitik monitoring draft...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel p-8 max-w-lg mx-auto mt-20 text-center border-red-200 bg-red-50/50">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-950 mb-2">Terjadi Kesalahan</h3>
                <p className="text-red-700/80 mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    // Format chart data based on period
    const chartData = chartPeriod === 'daily' 
        ? analytics?.daily_report.map(item => ({
            name: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            'Draft Ditugaskan': item.assigned,
            'Selesai': item.completed
          }))
        : analytics?.monthly_report.map(item => {
            const [year, month] = item.month.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return {
                name: date.toLocaleDateString('id-ID', { month: 'long', year: '2-digit' }),
                'Draft Ditugaskan': item.assigned,
                'Selesai': item.completed
            };
          });

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">Pemantauan & Analitik Draft</h1>
                    <p className="text-gray-500 font-medium mt-1">Laporan harian, bulanan, dan performa per drafter di seluruh jenis pengajuan.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/60 text-sm font-semibold text-gray-600">
                    <Calendar className="w-4 h-4 text-brand-600" />
                    <span>Laporan Realtime</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Draft"
                    value={analytics?.total_drafts || 0}
                    icon={FileText}
                />
                <StatsCard
                    title="Draft Aktif (Proses)"
                    value={analytics?.active_drafts || 0}
                    icon={Clock}
                />
                <StatsCard
                    title="Draft Direvisi"
                    value={analytics?.revision_drafts || 0}
                    icon={AlertCircle}
                />
                <StatsCard
                    title="Sertifikat Halal Terbit"
                    value={analytics?.completed_drafts || 0}
                    icon={CheckCircle}
                />
            </div>

            {/* Charts Section */}
            <div className="glass-panel p-6 border-white/40 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-brand-600" />
                            Tren Aktivitas Pengerjaan Draft
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">Bandingkan jumlah draft yang didelegasikan dan yang selesai dikerjakan.</p>
                    </div>
                    
                    {/* Period Switcher Tabs */}
                    <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setChartPeriod('daily')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                chartPeriod === 'daily' 
                                    ? 'bg-white text-gray-800 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            Harian (30 Hari)
                        </button>
                        <button
                            onClick={() => setChartPeriod('monthly')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                chartPeriod === 'monthly' 
                                    ? 'bg-white text-gray-800 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Bulanan (12 Bulan)
                        </button>
                    </div>
                </div>

                <div className="h-80 w-full">
                    {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="name" 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                                />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Draft Ditugaskan" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorAssigned)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Selesai" 
                                    stroke="#10b981" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorCompleted)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-gray-400">
                            <BarChart3 className="w-12 h-12 opacity-20 mb-2" />
                            <p className="text-sm italic">Belum ada data tren aktivitas</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drafters Table Section */}
            <div className="glass-panel p-6 border-white/40 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-600" />
                            Performa dan Beban Kerja Drafter
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">Monitoring status draf yang sedang ditugaskan dan diselesaikan per staf drafter.</p>
                    </div>

                    {/* Search Field */}
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari Drafter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full text-sm bg-gray-100/50 hover:bg-gray-100 focus:bg-white rounded-xl border-0 focus:ring-2 focus:ring-brand-500 transition-all font-medium text-gray-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle px-6">
                        <table className="min-w-full divide-y divide-gray-150">
                            <thead>
                                <tr className="text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none" onClick={() => handleSort('full_name')}>
                                        <span className="flex items-center gap-1">
                                            Nama Drafter
                                            {sortField === 'full_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none text-center" onClick={() => handleSort('total')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Total
                                            {sortField === 'total' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none text-center" onClick={() => handleSort('drafter')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Aktif (Drafter)
                                            {sortField === 'drafter' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none text-center" onClick={() => handleSort('qc_review')}>
                                        <span className="flex items-center justify-center gap-1">
                                            QC Review
                                            {sortField === 'qc_review' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none text-center" onClick={() => handleSort('sidang_fatwa')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Fatwa
                                            {sortField === 'sidang_fatwa' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none text-center" onClick={() => handleSort('revision')}>
                                        <span className="flex items-center justify-center gap-1">
                                            Revisi
                                            {sortField === 'revision' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                    <th className="py-4 cursor-pointer hover:text-brand-600 select-none text-center" onClick={() => handleSort('sh_terbit')}>
                                        <span className="flex items-center justify-center gap-1">
                                            SH Terbit
                                            {sortField === 'sh_terbit' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm font-bold text-gray-800">
                                {sortedDrafters.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                                            Tidak ada drafter yang ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    sortedDrafters.map((d) => (
                                        <tr key={d.drafter_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                        {d.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-800 truncate">{d.full_name}</h4>
                                                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <Mail className="w-3 h-3 text-gray-300" />
                                                            {d.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center font-black text-gray-900 bg-gray-50/40 rounded-xl px-2">
                                                {d.total}
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    d.drafter > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {d.drafter}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    d.qc_review > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {d.qc_review}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    d.sidang_fatwa > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {d.sidang_fatwa}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    d.revision > 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {d.revision}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    d.sh_terbit > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {d.sh_terbit}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
