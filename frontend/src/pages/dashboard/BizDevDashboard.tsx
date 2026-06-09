import { useEffect, useState, Fragment } from 'react';
import { financeService } from '../../services/financeService';
import { useAuthStore } from '../../store/authStore';
import {
    BarChart3, Target, FileText, Users, TrendingUp, ChevronDown, Building2, Trash2, X, Loader2, Edit2
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

interface TeamMemberPerformance {
    user_id: string;
    full_name: string;
    role_name: string;
    total_submissions: number;
    sh_terbit: number;
    in_progress: number;
}

interface LeaderPerformance {
    user_id: string;
    full_name: string;
    role_name: string;
    total_submissions: number;
    sh_terbit: number;
    in_progress: number;
    team_size: number;
    team_members: TeamMemberPerformance[];
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
    leader_performance: LeaderPerformance[];
}

const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function BizDevDashboard() {
    const user = useAuthStore(state => state.user);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [subTotal, setSubTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Target settings states
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [targetsList, setTargetsList] = useState<any[]>([]);
    const [targetLoading, setTargetLoading] = useState(false);

    // Form Target states
    const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(new Date().getFullYear());
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);

    // Target inputs
    const [tSH, setTSH] = useState('');
    const [tRevenue, setTRevenue] = useState('');
    const [tClients, setTClients] = useState('');
    const [tReguler, setTReguler] = useState('');
    const [tSelfDeclare, setTSelfDeclare] = useState('');

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const [month, setMonth] = useState<number | 'all'>('all');

    useEffect(() => { loadDashboard(); }, [year, month]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const m = month === 'all' ? undefined : month;
            const data = await financeService.getBizDevDashboard(m, year);
            setDashboard(data);
        } catch { toast.error('Gagal memuat dashboard'); }
        setLoading(false);
    };

    const loadTargets = async () => {
        try {
            const list = await financeService.getTargets();
            setTargetsList(list);
        } catch {
            toast.error('Gagal memuat daftar target');
        }
    };

    const handleSaveTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        setTargetLoading(true);

        const period = periodType === 'yearly'
            ? String(targetYear)
            : `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

        const payload: any = { period };
        if (tSH !== '') payload.target_sh = Number(tSH);
        if (tRevenue !== '') payload.target_revenue = Number(tRevenue);
        if (tClients !== '') payload.target_clients = Number(tClients);
        if (tReguler !== '') payload.target_reguler = Number(tReguler);
        if (tSelfDeclare !== '') payload.target_self_declare = Number(tSelfDeclare);

        try {
            await financeService.setTarget(payload);
            toast.success('Target berhasil disimpan');
            setTSH('');
            setTRevenue('');
            setTClients('');
            setTReguler('');
            setTSelfDeclare('');
            loadTargets();
            loadDashboard();
        } catch {
            toast.error('Gagal menyimpan target');
        } finally {
            setTargetLoading(false);
        }
    };

    const handleDeleteTarget = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus target ini?')) return;
        try {
            await financeService.deleteTarget(id);
            toast.success('Target berhasil dihapus');
            loadTargets();
            loadDashboard();
        } catch {
            toast.error('Gagal menghapus target');
        }
    };

    const handleEditTarget = (t: any) => {
        if (t.period.includes('-')) {
            const [y, m] = t.period.split('-');
            setPeriodType('monthly');
            setTargetYear(Number(y));
            setTargetMonth(Number(m));
        } else {
            setPeriodType('yearly');
            setTargetYear(Number(t.period));
        }
        setTSH(t.target_sh != null ? String(t.target_sh) : '');
        setTRevenue(t.target_revenue != null ? String(t.target_revenue) : '');
        setTClients(t.target_clients != null ? String(t.target_clients) : '');
        setTReguler(t.target_reguler != null ? String(t.target_reguler) : '');
        setTSelfDeclare(t.target_self_declare != null ? String(t.target_self_declare) : '');
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

    const ROLE_LABELS: Record<string, string> = {
        HALAL_ADVISOR: 'Halal Advisor',
        HALAL_MANAGER: 'Halal Manager',
        DIRECTOR: 'Halal Director',
    };

    const filteredPerformance = (dashboard?.leader_performance || []).filter(p => {
        const matchesName = p.full_name.toLowerCase().includes(searchName.toLowerCase());
        const matchesRole = roleFilter ? p.role_name === roleFilter : true;
        return matchesName && matchesRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-brand-500" />
                        Dashboard Business Development
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Monitoring pencapaian dan progress layanan</p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'DIRECTOR' && (
                        <button onClick={() => {
                            setShowTargetModal(true);
                            loadTargets();
                        }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md hover:bg-brand-600 transition-all">
                            <Target className="w-4 h-4" />
                            Kelola Target
                        </button>
                    )}
                    <div className="relative">
                        <select value={month} onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand-500">
                            <option value="all">Semua Bulan</option>
                            {MONTH_LABELS.map((m, idx) => (
                                <option key={idx} value={idx + 1}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand-500">
                            {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
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

            {/* Progress & Kinerja Tim */}
            <div className="glass-panel rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">Progress & Kinerja Tim</h3>
                        <p className="text-xs text-gray-400 mt-1">Kinerja pengajuan berdasarkan Halal Advisor, Halal Manager, dan Halal Director</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {/* Search Input */}
                        <input type="text" placeholder="Cari nama..." value={searchName} onChange={(e) => setSearchName(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand-500 w-40" />
                        {/* Role Filter */}
                        <div className="relative">
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium focus:ring-2 focus:ring-brand-500">
                                <option value="">Semua Peran</option>
                                <option value="HALAL_ADVISOR">Halal Advisor</option>
                                <option value="HALAL_MANAGER">Halal Manager</option>
                                <option value="DIRECTOR">Director</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase">Nama</th>
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase">Peran</th>
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase text-center">Total Pengajuan</th>
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase text-center">SH Terbit</th>
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase text-center">In Progress</th>
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase text-center">Jumlah Tim</th>
                                <th className="px-4 py-2.5 font-bold text-gray-500 text-xs uppercase text-center">Rasio Sukses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPerformance.map((item) => {
                                const successRate = item.total_submissions > 0 ? (item.sh_terbit / item.total_submissions) * 100 : 0;
                                const hasTeam = item.team_members && item.team_members.length > 0;
                                const isExpanded = expandedRows.has(item.user_id);
                                return (
                                    <Fragment key={item.user_id}>
                                        <tr onClick={() => hasTeam && toggleRow(item.user_id)}
                                            className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${hasTeam ? 'cursor-pointer font-bold' : ''}`}>
                                            <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-2">
                                                {hasTeam && (
                                                    <span className="text-gray-400 text-[10px] w-4">{isExpanded ? '▼' : '▶'}</span>
                                                )}
                                                {!hasTeam && <span className="w-4 inline-block" />}
                                                {item.full_name}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-normal">
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold
                                                    ${item.role_name === 'DIRECTOR' ? 'bg-purple-50 text-purple-600' :
                                                      item.role_name === 'HALAL_MANAGER' ? 'bg-blue-50 text-blue-600' :
                                                      'bg-teal-50 text-teal-600'}`}>
                                                    {ROLE_LABELS[item.role_name] || item.role_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-700">{item.total_submissions}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{item.sh_terbit}</td>
                                            <td className="px-4 py-3 text-center font-bold text-amber-600">{item.in_progress}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-600">
                                                {item.team_size > 0 ? `${item.team_size} orang` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-500">{successRate.toFixed(0)}%</td>
                                        </tr>
                                        {/* Expanded Tim Details */}
                                        {hasTeam && isExpanded && (
                                            <tr className="bg-gray-50/45">
                                                <td colSpan={7} className="px-8 py-4">
                                                    <div className="border-l-2 border-brand-500 pl-4 space-y-3">
                                                        <h4 className="text-xs font-black text-brand-700 uppercase tracking-wider">Produktivitas Anggota Tim ({item.team_members.length} Orang)</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {item.team_members.sort((a, b) => b.total_submissions - a.total_submissions).map(member => (
                                                                <div key={member.user_id} className="bg-white p-3 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between hover:border-gray-200 transition-colors">
                                                                    <div>
                                                                        <p className="text-xs font-black text-gray-800 truncate">{member.full_name}</p>
                                                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{ROLE_LABELS[member.role_name] || member.role_name}</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center mt-3 border-t border-gray-50 pt-2 text-[10px] text-gray-500">
                                                                        <span>Total: <strong className="text-gray-800">{member.total_submissions}</strong></span>
                                                                        <span className="text-emerald-600">SH: <strong className="text-emerald-700">{member.sh_terbit}</strong></span>
                                                                        <span className="text-amber-500">Progres: <strong className="text-amber-600">{member.in_progress}</strong></span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                            {filteredPerformance.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data anggota tim</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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

            {/* Modal Kelola Target */}
            {showTargetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white/95 border border-gray-150 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-black text-gray-800 flex items-center gap-2">
                                <Target className="w-5 h-5 text-brand-500" />
                                Kelola Target Perusahaan
                            </h2>
                            <button onClick={() => setShowTargetModal(false)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Form Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-2 flex justify-between items-center">
                                    <span>Set / Edit Target</span>
                                    {(tSH || tRevenue || tClients || tReguler || tSelfDeclare) && (
                                        <button type="button" onClick={() => {
                                            setTSH('');
                                            setTRevenue('');
                                            setTClients('');
                                            setTReguler('');
                                            setTSelfDeclare('');
                                        }} className="text-[10px] text-gray-400 hover:text-brand-500 font-bold transition-colors">
                                            Reset Form
                                        </button>
                                    )}
                                </h3>
                                <form onSubmit={handleSaveTarget} className="space-y-4">
                                    {/* Period Type Toggle */}
                                    <div className="flex rounded-lg bg-gray-100 p-0.5">
                                        <button type="button" onClick={() => setPeriodType('monthly')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${periodType === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                            Bulanan
                                        </button>
                                        <button type="button" onClick={() => setPeriodType('yearly')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${periodType === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                            Tahunan
                                        </button>
                                    </div>

                                    {/* Period Selection */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {periodType === 'monthly' && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bulan</label>
                                                <select value={targetMonth} onChange={(e) => setTargetMonth(Number(e.target.value))}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500">
                                                    {MONTH_LABELS.map((m, idx) => (
                                                        <option key={idx} value={idx + 1}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className={periodType === 'yearly' ? 'col-span-2' : ''}>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tahun</label>
                                            <select value={targetYear} onChange={(e) => setTargetYear(Number(e.target.value))}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500">
                                                {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Inputs Grid */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target SH Terbit (Sertifikat)</label>
                                            <input type="number" placeholder="Contoh: 100" value={tSH} onChange={(e) => setTSH(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Revenue (Rupiah)</label>
                                            <input type="number" placeholder="Contoh: 50000000" value={tRevenue} onChange={(e) => setTRevenue(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Klien Baru</label>
                                            <input type="number" placeholder="Contoh: 50" value={tClients} onChange={(e) => setTClients(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Reguler</label>
                                                <input type="number" placeholder="Contoh: 20" value={tReguler} onChange={(e) => setTReguler(e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Self Declare</label>
                                                <input type="number" placeholder="Contoh: 30" value={tSelfDeclare} onChange={(e) => setTSelfDeclare(e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500" />
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={targetLoading}
                                        className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50">
                                        {targetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Target'}
                                    </button>
                                </form>
                            </div>

                            {/* List Section */}
                            <div className="flex flex-col h-full overflow-hidden">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-2 mb-4">Target Aktif</h3>
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-150 sticky top-0 bg-white">
                                                <th className="py-2 px-3">Periode</th>
                                                <th className="py-2 px-3 text-center">SH</th>
                                                <th className="py-2 px-3 text-right">Revenue</th>
                                                <th className="py-2 px-3 text-center">Klien</th>
                                                <th className="py-2 px-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {targetsList.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-3 font-semibold text-gray-700">{t.period}</td>
                                                    <td className="py-2.5 px-3 text-center font-medium text-gray-600">{t.target_sh || '-'}</td>
                                                    <td className="py-2.5 px-3 text-right font-medium text-gray-600">
                                                        {t.target_revenue ? formatIDR(t.target_revenue) : '-'}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center font-medium text-gray-600">{t.target_clients || '-'}</td>
                                                    <td className="py-2.5 px-3 text-center flex items-center justify-center gap-1">
                                                        <button onClick={() => handleEditTarget(t)} className="p-1 rounded text-brand-500 hover:bg-brand-50 transition-colors" title="Edit Target">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTarget(t.id)} className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors" title="Hapus Target">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {targetsList.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-gray-400">Belum ada target yang diset</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
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
