import { useEffect, useState } from 'react';
import { 
    FileText, 
    CheckCircle2, 
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
    ChevronUp,
    Sparkles,
    RotateCcw
} from 'lucide-react';
import api from '../../services/api';
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
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly'>('daily');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof DrafterPerformance>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchAnalytics();
    }, []);

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
                <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                <p className="text-xs font-bold text-gray-500">Menghubungkan ke analitik monitoring draft tim...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-lg mx-auto mt-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-base font-black text-rose-950">Terjadi Kesalahan</h3>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                <button 
                    onClick={fetchAnalytics}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-md transition-colors active:scale-95"
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
            'Selesai Disusun': item.completed
          }))
        : analytics?.monthly_report.map(item => {
            const [year, month] = item.month.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return {
                name: date.toLocaleDateString('id-ID', { month: 'long', year: '2-digit' }),
                'Draft Ditugaskan': item.assigned,
                'Selesai Disusun': item.completed
            };
          });

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 px-4 sm:px-6 py-6 pb-24">
            {/* Executive Hero Banner */}
            <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 backdrop-blur-md text-teal-300 text-xs font-black uppercase tracking-widest border border-teal-400/30">
                                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                                Drafter Command & Technical Lead
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-gray-300 text-xs font-medium border border-white/10">
                                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            Pemantauan & Analitik Dokumen Draft
                        </h1>
                        <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
                            Monitoring beban kerja tim drafter, throughput harian & bulanan, rasio revisi QC, serta percepatan proses penyusunan berkas sertifikasi halal.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard/drafter-monitoring')}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm shadow-sm"
                        >
                            <Users className="w-4 h-4 text-teal-300" />
                            <span>Monitoring Detail</span>
                        </button>
                        <button
                            onClick={fetchAnalytics}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold border border-white/20 transition-all flex items-center justify-center active:scale-95"
                            title="Refresh Analitik"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Drafts */}
                <div className="p-5 rounded-3xl bg-white border border-gray-150 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Draft Masuk</span>
                        <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{analytics?.total_drafts || 0}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">Akumulasi seluruh berkas draft</p>
                    </div>
                </div>

                {/* Active Drafts */}
                <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Draft Aktif (Proses)</span>
                        <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{analytics?.active_drafts || 0}</p>
                        <p className="text-[10px] font-bold text-teal-700 mt-1">Sedang disusun oleh tim drafter</p>
                    </div>
                </div>

                {/* Revision Drafts */}
                <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Draft Direvisi QC</span>
                        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{analytics?.revision_drafts || 0}</p>
                        <p className="text-[10px] font-bold text-rose-700 mt-1">Perlu perbaikan catatan QC</p>
                    </div>
                </div>

                {/* Completed / SH Terbit */}
                <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sertifikat Halal Terbit</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{analytics?.completed_drafts || 0}</p>
                        <p className="text-[10px] font-bold text-emerald-700 mt-1">Lolos sidang fatwa & terbit 🎉</p>
                    </div>
                </div>
            </div>

            {/* Throughput Charts Section */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-teal-600" />
                            Tren Aktivitas Pengerjaan Draft
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">Bandingkan jumlah draft yang didelegasikan dan yang berhasil diselesaikan tim</p>
                    </div>
                    
                    {/* Period Switcher Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        <button
                            onClick={() => setChartPeriod('daily')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                chartPeriod === 'daily' 
                                    ? 'bg-teal-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Harian (30 Hari)</span>
                        </button>
                        <button
                            onClick={() => setChartPeriod('monthly')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                chartPeriod === 'monthly' 
                                    ? 'bg-teal-600 text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Bulanan (12 Bulan)</span>
                        </button>
                    </div>
                </div>

                <div className="h-80 w-full pt-2">
                    {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="name" 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        borderRadius: '16px',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12, fontWeight: 700 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Draft Ditugaskan" 
                                    stroke="#0d9488" 
                                    strokeWidth={2.5}
                                    fillOpacity={1} 
                                    fill="url(#colorAssigned)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Selesai Disusun" 
                                    stroke="#10b981" 
                                    strokeWidth={2.5}
                                    fillOpacity={1} 
                                    fill="url(#colorCompleted)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-gray-400">
                            <BarChart3 className="w-12 h-12 opacity-20 mb-2" />
                            <p className="text-xs italic">Belum ada data tren aktivitas</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drafters Table Section */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-600" />
                            Performa dan Beban Kerja Staf Drafter
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">Monitoring status draf yang sedang ditugaskan dan diselesaikan per staf drafter.</p>
                    </div>

                    {/* Search Field */}
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari drafter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full text-xs font-bold bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 transition-all text-gray-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-150 pb-3 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none" onClick={() => handleSort('full_name')}>
                                    <span className="flex items-center gap-1">
                                        Nama Drafter
                                        {sortField === 'full_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none text-center" onClick={() => handleSort('total')}>
                                    <span className="flex items-center justify-center gap-1">
                                        Total Beban
                                        {sortField === 'total' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none text-center" onClick={() => handleSort('drafter')}>
                                    <span className="flex items-center justify-center gap-1">
                                        Aktif Draf
                                        {sortField === 'drafter' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none text-center" onClick={() => handleSort('qc_review')}>
                                    <span className="flex items-center justify-center gap-1">
                                        QC Review
                                        {sortField === 'qc_review' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none text-center" onClick={() => handleSort('sidang_fatwa')}>
                                    <span className="flex items-center justify-center gap-1">
                                        Fatwa
                                        {sortField === 'sidang_fatwa' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none text-center" onClick={() => handleSort('revision')}>
                                    <span className="flex items-center justify-center gap-1">
                                        Revisi
                                        {sortField === 'revision' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:text-teal-600 select-none text-center" onClick={() => handleSort('sh_terbit')}>
                                    <span className="flex items-center justify-center gap-1">
                                        SH Terbit
                                        {sortField === 'sh_terbit' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                            {sortedDrafters.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                                        Tidak ada drafter yang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                sortedDrafters.map((d) => (
                                    <tr key={d.drafter_id} className="hover:bg-gray-50/80 transition-all">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                                                    {d.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{d.full_name}</h4>
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Mail className="w-3 h-3 text-gray-300" />
                                                        {d.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-black text-gray-900 bg-gray-50/70 rounded-xl">
                                            {d.total}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                                d.drafter > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                {d.drafter}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                                d.qc_review > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                {d.qc_review}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                                d.sidang_fatwa > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                {d.sidang_fatwa}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                                d.revision > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                {d.revision}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                                d.sh_terbit > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-400'
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
    );
}
