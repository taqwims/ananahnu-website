import { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import {
    BarChart3, Target, FileText, Users, TrendingUp, ChevronDown, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MonthlyPerf {
    month: string;
    total_submissions: number;
    sh_terbit: number;
    revenue: number;
    reguler: number;
    self_declare: number;
}

interface DashboardData {
    monthly_stats: MonthlyPerf[];
    layanan_reguler: number;
    layanan_self_declare: number;
    total_sh_terbit: number;
    total_clients: number;
    target?: {
        id: number;
        period: string;
        target_sh?: number;
        target_revenue?: number;
        target_clients?: number;
        target_reguler?: number;
        target_self_declare?: number;
    };
}

const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function BizDevDashboard() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [subTotal, setSubTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showSubmissions, setShowSubmissions] = useState(false);

    useEffect(() => { loadDashboard(); }, [year]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await financeService.getBizDevDashboard(undefined, year);
            setDashboard(data);
        } catch { toast.error('Gagal memuat dashboard'); }
        setLoading(false);
    };

    const loadSubmissions = async () => {
        try {
            const res = await financeService.getBizDevSubmissions(1, 200);
            setSubmissions(res.data || []);
            setSubTotal(res.total || 0);
        } catch { /* */ }
    };

    useEffect(() => {
        if (showSubmissions) loadSubmissions();
    }, [showSubmissions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const stats = dashboard?.monthly_stats || [];
    const maxSubs = Math.max(...stats.map(s => s.total_submissions), 1);
    const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-brand-500" />
                        Dashboard Business Development
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Monitoring pencapaian dan progress layanan</p>
                </div>
                <div className="relative">
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                        className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand-500">
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Building2} label="Layanan Reguler" value={String(dashboard?.layanan_reguler || 0)} color="indigo" />
                <StatCard icon={FileText} label="Self Declare" value={String(dashboard?.layanan_self_declare || 0)} color="teal" />
                <StatCard icon={TrendingUp} label="SH Terbit" value={String(dashboard?.total_sh_terbit || 0)} color="emerald" />
                <StatCard icon={Users} label="Total Klien" value={String(dashboard?.total_clients || 0)} color="purple" />
            </div>

            {/* Target Progress */}
            {dashboard?.target && (
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-brand-500" />
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">Target Perusahaan — {dashboard.target.period}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboard.target.target_sh != null && (
                            <ProgressBar
                                label="SH Terbit"
                                current={dashboard.total_sh_terbit}
                                target={dashboard.target.target_sh}
                            />
                        )}
                        {dashboard.target.target_revenue != null && (
                            <ProgressBar
                                label="Revenue"
                                current={totalRevenue}
                                target={dashboard.target.target_revenue}
                                format="currency"
                            />
                        )}
                        {dashboard.target.target_clients != null && (
                            <ProgressBar
                                label="Klien"
                                current={Number(dashboard.total_clients)}
                                target={dashboard.target.target_clients}
                            />
                        )}
                        {dashboard.target.target_reguler != null && (
                            <ProgressBar
                                label="Reguler"
                                current={dashboard.layanan_reguler}
                                target={dashboard.target.target_reguler}
                            />
                        )}
                        {dashboard.target.target_self_declare != null && (
                            <ProgressBar
                                label="Self Declare"
                                current={dashboard.layanan_self_declare}
                                target={dashboard.target.target_self_declare}
                            />
                        )}
                    </div>
                </div>
            )}

            {!dashboard?.target && (
                <div className="glass-panel rounded-xl p-5 border-l-4 border-gray-300 bg-gray-50/30">
                    <p className="text-sm text-gray-500">
                        <Target className="w-4 h-4 inline mr-1" />
                        Belum ada target yang diset untuk periode ini. Target dapat diset oleh Super Admin.
                    </p>
                </div>
            )}

            {/* Monthly Chart */}
            <div className="glass-panel rounded-xl p-6">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-6">Pencapaian Per Bulan — {year}</h3>
                <div className="flex items-end gap-2 h-48">
                    {stats.map((s, i) => {
                        const height = (s.total_submissions / maxSubs) * 100;
                        const shHeight = maxSubs > 0 ? (s.sh_terbit / maxSubs) * 100 : 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    <p className="font-bold">{MONTH_LABELS[i]} {year}</p>
                                    <p>Pengajuan: {s.total_submissions}</p>
                                    <p>SH Terbit: {s.sh_terbit}</p>
                                    <p>Reguler: {s.reguler} / SD: {s.self_declare}</p>
                                    <p>Revenue: {formatIDR(s.revenue)}</p>
                                </div>
                                {/* Bar */}
                                <div className="w-full flex flex-col gap-0.5 items-center" style={{ height: '160px' }}>
                                    <div className="w-full flex-1 flex items-end gap-0.5 justify-center">
                                        <div className="w-1/2 rounded-t-md bg-brand-400 transition-all duration-500 hover:bg-brand-500"
                                            style={{ height: `${height}%`, minHeight: s.total_submissions > 0 ? '4px' : '0' }} />
                                        <div className="w-1/2 rounded-t-md bg-emerald-400 transition-all duration-500 hover:bg-emerald-500"
                                            style={{ height: `${shHeight}%`, minHeight: s.sh_terbit > 0 ? '4px' : '0' }} />
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{MONTH_LABELS[i]}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4 mt-4 justify-center">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <span className="w-3 h-3 rounded-sm bg-brand-400" /> Pengajuan
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <span className="w-3 h-3 rounded-sm bg-emerald-400" /> SH Terbit
                    </span>
                </div>
            </div>

            {/* Toggle Submissions */}
            <div>
                <button onClick={() => setShowSubmissions(!showSubmissions)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                    <FileText className="w-4 h-4" />
                    {showSubmissions ? 'Sembunyikan' : 'Lihat'} Semua Pengajuan ({subTotal || '...'})
                </button>
            </div>

            {showSubmissions && (
                <div className="glass-panel rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Klien</th>
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Jenis</th>
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status</th>
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((s, idx) => (
                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-800">{s.client?.business_name || s.client?.client_name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.service_type === 'REGULER' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                                            {s.service_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'SH_TERBIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {s.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{new Date(s.created_at).toLocaleDateString('id')}</td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Belum ada data</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        indigo: 'from-indigo-500 to-indigo-600',
        teal: 'from-teal-500 to-teal-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
    };
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg`}>
            <div className="absolute top-2 right-2 opacity-20"><Icon className="w-12 h-12" /></div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-3xl font-black mt-2">{value}</p>
        </div>
    );
}

function ProgressBar({ label, current, target, format }: { label: string; current: number; target: number; format?: string }) {
    const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const display = format === 'currency' ? formatIDR(current) : String(current);
    const targetDisplay = format === 'currency' ? formatIDR(target) : String(target);

    return (
        <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
            <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-gray-600">{label}</span>
                <span className="text-xs text-gray-400">{display} / {targetDisplay}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }} />
            </div>
            <p className="text-right text-[10px] font-bold text-gray-400 mt-1">{pct.toFixed(0)}%</p>
        </div>
    );
}
