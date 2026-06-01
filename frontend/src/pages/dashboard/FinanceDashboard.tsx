import { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import {
    DollarSign, TrendingUp, TrendingDown, Users, FileText, Briefcase,
    CreditCard, Download, Send, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardData {
    total_income: number;
    commission_paid: number;
    commission_pending: number;
    income_reguler: number;
    income_self_declare_paid: number;
    count_self_declare_free: number;
    count_self_declare_paid: number;
    count_reguler: number;
    expense_by_type: Record<string, number>;
    expense_by_business: Record<string, number>;
}

interface Commission {
    id: string;
    type: string;
    user_id?: string;
    user?: { full_name: string };
    referrer?: { full_name: string };
    period: string;
    amount: number;
    status: string;
    base_omset: number;
    paid_at?: string;
}

const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const COMMISSION_LABELS: Record<string, string> = {
    DIRECT_SALES: 'Insentif Pendampingan',
    OVERRIDE: 'Override',
    STRUCTURAL: 'Struktural',
    REFERRAL: 'Referral',
};

type TabKey = 'overview' | 'commissions' | 'agents' | 'clients' | 'submissions' | 'managers';

export default function FinanceDashboard() {
    const [tab, setTab] = useState<TabKey>('overview');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [commTotal, setCommTotal] = useState(0);
    const [agents, setAgents] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [year, month]);

    useEffect(() => {
        if (tab === 'commissions') loadCommissions();
        if (tab === 'agents') loadAgents();
        if (tab === 'clients') loadClients();
        if (tab === 'submissions') loadSubmissions();
        if (tab === 'managers') loadManagers();
    }, [tab, statusFilter, typeFilter]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await financeService.getDashboard(month || undefined, year);
            setDashboard(data);
        } catch { toast.error('Gagal memuat dashboard'); }
        setLoading(false);
    };

    const loadCommissions = async () => {
        try {
            const res = await financeService.getCommissions(1, 100, statusFilter || undefined, typeFilter || undefined);
            setCommissions(res.data || []);
            setCommTotal(res.total || 0);
        } catch { /* silent */ }
    };

    const loadAgents = async () => {
        try { setAgents((await financeService.getAgents(1, 100)).data || []); } catch { /* */ }
    };
    const loadClients = async () => {
        try { setClients((await financeService.getClients(1, 100)).data || []); } catch { /* */ }
    };
    const loadSubmissions = async () => {
        try { setSubmissions((await financeService.getSubmissions(1, 100)).data || []); } catch { /* */ }
    };
    const loadManagers = async () => {
        try { setManagers((await financeService.getManagers(1, 100)).data || []); } catch { /* */ }
    };

    const handlePayCommission = async (id: string) => {
        try {
            await financeService.payCommission(id);
            toast.success('Komisi dibayarkan');
            loadCommissions();
            loadDashboard();
        } catch { toast.error('Gagal membayar komisi'); }
    };

    const handleDownloadSlip = async (id: string) => {
        try {
            const res = await financeService.downloadSlip(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `slip_komisi_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch { toast.error('Gagal download slip'); }
    };

    const handleSendWA = async (id: string) => {
        try {
            await financeService.sendSlipWA(id);
            toast.success('Slip terkirim via WhatsApp');
        } catch { toast.error('Gagal kirim via WA'); }
    };

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'overview', label: 'Ringkasan', icon: TrendingUp },
        { key: 'commissions', label: 'Komisi', icon: DollarSign },
        { key: 'agents', label: 'Daftar Agen', icon: Users },
        { key: 'clients', label: 'Daftar Klien', icon: Briefcase },
        { key: 'submissions', label: 'Daftar Ajuan', icon: FileText },
        { key: 'managers', label: 'Daftar Manager', icon: Users },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Dashboard Keuangan</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitoring pendapatan, komisi, dan transaksi</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand-500">
                            <option value={0}>Semua Bulan</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('id', { month: 'long' })}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand-500">
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${tab === t.key ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && dashboard && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard icon={TrendingUp} label="Total Pendapatan" value={formatIDR(dashboard.total_income)} color="emerald" />
                        <SummaryCard icon={CreditCard} label="Komisi Dibayar" value={formatIDR(dashboard.commission_paid)} color="blue" />
                        <SummaryCard icon={TrendingDown} label="Tanggungan Komisi" value={formatIDR(dashboard.commission_pending)} color="amber" />
                        <SummaryCard icon={DollarSign} label="Pendapatan Reguler" value={formatIDR(dashboard.income_reguler)} color="purple" />
                    </div>

                    {/* Self Declare Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Self Declare Mandiri</p>
                            <p className="text-2xl font-black text-gray-800 mt-1">{formatIDR(dashboard.income_self_declare_paid)}</p>
                            <p className="text-xs text-gray-500 mt-1">{dashboard.count_self_declare_paid} pengajuan</p>
                        </div>
                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Self Declare Gratis (SEHATI)</p>
                            <p className="text-2xl font-black text-gray-800 mt-1">{dashboard.count_self_declare_free}</p>
                            <p className="text-xs text-gray-500 mt-1">layanan</p>
                        </div>
                        <div className="glass-panel rounded-xl p-5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Reguler</p>
                            <p className="text-2xl font-black text-gray-800 mt-1">{dashboard.count_reguler}</p>
                            <p className="text-xs text-gray-500 mt-1">pengajuan</p>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-black text-gray-700 mb-4">Pos Uang Keluar per Jenis Pengajuan</h3>
                            {Object.entries(dashboard.expense_by_type).length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(dashboard.expense_by_type).map(([type, amount]) => (
                                        <div key={type} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">{type}</span>
                                            <span className="text-sm font-bold text-gray-800">{formatIDR(amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-black text-gray-700 mb-4">Pos Uang Keluar per Bidang Usaha</h3>
                            {Object.entries(dashboard.expense_by_business).length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(dashboard.expense_by_business).map(([biz, amount]) => (
                                        <div key={biz} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">{biz}</span>
                                            <span className="text-sm font-bold text-gray-800">{formatIDR(amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'overview' && loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Commissions Tab */}
            {tab === 'commissions' && (
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            <option value="">Semua Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            <option value="">Semua Tipe</option>
                            <option value="DIRECT_SALES">Insentif Pendampingan</option>
                            <option value="OVERRIDE">Override</option>
                            <option value="STRUCTURAL">Struktural</option>
                            <option value="REFERRAL">Referral</option>
                        </select>
                        <span className="text-sm text-gray-500 self-center ml-2">{commTotal} komisi</span>
                    </div>

                    <div className="glass-panel rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Penerima</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tipe</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Periode</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Jumlah</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {c.user?.full_name || c.referrer?.full_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-600">
                                                {COMMISSION_LABELS[c.type] || c.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{c.period}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{formatIDR(c.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {c.status === 'PENDING' && (
                                                    <button onClick={() => handlePayCommission(c.id)}
                                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                        title="Bayar">
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDownloadSlip(c.id)}
                                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                    title="Download Slip">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleSendWA(c.id)}
                                                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                    title="Kirim via WA">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {commissions.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada data komisi</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* List Tabs (Agents, Clients, Submissions, Managers) */}
            {tab === 'agents' && <DataTable title="Daftar Agen (Halal Advisor)" data={agents}
                columns={[
                    { key: 'full_name', label: 'Nama' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Telepon' },
                    { key: 'referral_code', label: 'Kode Referral' },
                ]} />}

            {tab === 'clients' && <DataTable title="Daftar Klien" data={clients}
                columns={[
                    { key: 'business_name', label: 'Nama Usaha' },
                    { key: 'client_name', label: 'Pemilik' },
                    { key: 'service_type', label: 'Jenis Layanan' },
                    { key: 'phone', label: 'Telepon' },
                ]} />}

            {tab === 'submissions' && <DataTable title="Daftar Ajuan" data={submissions}
                columns={[
                    { key: 'client.business_name', label: 'Klien' },
                    { key: 'service_type', label: 'Jenis' },
                    { key: 'status', label: 'Status' },
                    { key: 'created_at', label: 'Tanggal', render: (v: string) => new Date(v).toLocaleDateString('id') },
                ]} />}

            {tab === 'managers' && <DataTable title="Daftar Manager" data={managers}
                columns={[
                    { key: 'full_name', label: 'Nama' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Telepon' },
                ]} />}
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        amber: 'from-amber-500 to-amber-600',
        purple: 'from-purple-500 to-purple-600',
    };
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg`}>
            <div className="absolute top-2 right-2 opacity-20">
                <Icon className="w-12 h-12" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-xl font-black mt-2">{value}</p>
        </div>
    );
}

function DataTable({ title, data, columns }: {
    title: string;
    data: any[];
    columns: { key: string; label: string; render?: (v: any) => string }[];
}) {
    const getValue = (obj: any, key: string) => {
        return key.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-black text-gray-800">{title}</h3>
            <div className="glass-panel rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            {columns.map(col => (
                                <th key={col.key} className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className="px-4 py-3 text-gray-700">
                                        {col.render ? col.render(getValue(item, col.key)) : (getValue(item, col.key) || '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">Belum ada data</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
