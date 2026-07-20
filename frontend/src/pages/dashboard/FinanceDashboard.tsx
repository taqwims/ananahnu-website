import { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import { paymentService } from '../../services/paymentService';
import KalkulatorReguler from '../../components/dashboard/KalkulatorReguler';
import {
    DollarSign, TrendingUp, TrendingDown, Users, FileText, Briefcase,
    CreditCard, Download, Send, ChevronDown, Wallet, Search, Calculator, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useSubmission } from '../../hooks/useSubmission';
import { ClientInfoSection } from '../../components/dashboard/submission/ClientInfoSection';
import { DocumentList } from '../../components/dashboard/submission/DocumentList';
import api from '../../services/api';

interface DashboardData {
    total_income: number;
    net_balance: number;
    commission_paid: number;
    commission_pending: number;
    total_expense: number;
    total_expense_sub: number;
    total_expense_op: number;
    income_reguler: number;
    income_self_declare_paid: number;
    count_self_declare_free: number;
    count_self_declare_paid: number;
    count_reguler: number;
    expense_by_business: Record<string, number>;
    expense_operational: Record<string, number>;
    income_by_business: Record<string, number>;
    income_bpjph_paid: number;
    income_bpjph_pending: number;
    count_bpjph_paid: number;
    count_bpjph_unpaid: number;
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

type TabKey = 'overview' | 'incomes' | 'commissions' | 'agents' | 'clients' | 'submissions' | 'managers' | 'pricing';

export default function FinanceDashboard() {
    const [tab, setTab] = useState<TabKey>('overview');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [incomes, setIncomes] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [subServiceFilter, setSubServiceFilter] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    useEffect(() => {
        setSearchQuery('');
        setCurrentPage(1);
    }, [tab]);

    useEffect(() => {
        loadDashboard();
    }, [year, month]);

    useEffect(() => {
        if (tab === 'commissions') loadCommissions();
        if (tab === 'incomes') loadIncomes();
        if (tab === 'agents') loadAgents();
        if (tab === 'clients') loadClients();
        if (tab === 'submissions') loadSubmissions();
        if (tab === 'managers') loadManagers();
    }, [tab, statusFilter, typeFilter, subServiceFilter]);

    const loadDashboard = async () => {
        try {
            const data = await financeService.getDashboard(month || undefined, year);
            setDashboard(data);
        } catch { toast.error('Gagal memuat dashboard'); }
    };

    const loadCommissions = async () => {
        try {
            const res = await financeService.getCommissions(1, 1000, statusFilter || undefined, typeFilter || undefined);
            setCommissions(res.data || []);
        } catch { /* silent */ }
    };



    const loadIncomes = async () => {
        try {
            const params = new URLSearchParams();
            params.append('status', 'PAID');
            params.append('page', '1');
            params.append('limit', '1000');
            const res = await paymentService.getAllInvoices(params);
            setIncomes(res.data || []);
        } catch { toast.error('Gagal memuat detail pendapatan'); }
    };

    const loadAgents = async () => {
        try { setAgents((await financeService.getAgents(1, 1000)).data || []); } catch { /* */ }
    };
    const loadClients = async () => {
        try { setClients((await financeService.getClients(1, 1000)).data || []); } catch { /* */ }
    };
    const loadSubmissions = async () => {
        try {
            const filterServiceType = subServiceFilter || undefined;
            setSubmissions((await financeService.getSubmissions(1, 1000, filterServiceType)).data || []);
        } catch { /* */ }
    };
    const loadManagers = async () => {
        try { setManagers((await financeService.getManagers(1, 1000)).data || []); } catch { /* */ }
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
        { key: 'incomes', label: 'Pendapatan', icon: TrendingUp },
        { key: 'commissions', label: 'Komisi', icon: DollarSign },
        { key: 'agents', label: 'Agen', icon: Users },
        { key: 'clients', label: 'Klien', icon: Briefcase },
        { key: 'submissions', label: 'Ajuan', icon: FileText },
        { key: 'pricing', label: 'Harga Reguler', icon: Calculator },
        { key: 'managers', label: 'Manager', icon: Users },
    ];

    // Combine expenses for the chart
    const combinedExpenses: Record<string, number> = {};
    if (dashboard) {
        if (dashboard.expense_by_business) {
            Object.entries(dashboard.expense_by_business).forEach(([k, v]) => { combinedExpenses[k + ' (Ajuan)'] = v; });
        }
        if (dashboard.expense_operational) {
            Object.entries(dashboard.expense_operational).forEach(([k, v]) => { combinedExpenses[k + ' (Ops)'] = v; });
        }
    }

    const businessTypes = Array.from(new Set([
        ...Object.keys(dashboard?.income_by_business || {}),
        ...Object.keys(dashboard?.expense_by_business || {})
    ]));
    const marginAnalysis = businessTypes.map(name => {
        const income = dashboard?.income_by_business?.[name] || 0;
        const expense = dashboard?.expense_by_business?.[name] || 0;
        const margin = income - expense;
        const pct = income > 0 ? (margin / income) * 100 : 0;
        return { name, income, expense, margin, pct };
    }).sort((a, b) => b.margin - a.margin);

    // Filter and paginate Incomes
    const filteredIncomes = (incomes || []).filter(inv => {
        if (!inv) return false;
        const query = searchQuery.toLowerCase();
        return (
            `inv-${inv.id}`.toLowerCase().includes(query) ||
            (inv.submission?.client?.business_name || '').toLowerCase().includes(query) ||
            (inv.submission?.business_type?.name || '').toLowerCase().includes(query) ||
            (inv.service_type || '').toLowerCase().includes(query)
        );
    });
    const paginatedIncomes = filteredIncomes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Filter and paginate Commissions
    const filteredCommissions = (commissions || []).filter(c => {
        if (!c) return false;
        const query = searchQuery.toLowerCase();
        const recipientName = c.user?.full_name || c.referrer?.full_name || '';
        return (
            recipientName.toLowerCase().includes(query) ||
            (c.type || '').toLowerCase().includes(query) ||
            (c.period || '').toLowerCase().includes(query)
        );
    });
    const paginatedCommissions = filteredCommissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Filter and paginate Submissions (regular)
    const filteredSubmissions = (submissions || []).filter(sub => {
        if (!sub) return false;
        const query = searchQuery.toLowerCase();
        return (
            (sub.client?.business_name || '').toLowerCase().includes(query) ||
            (sub.client?.client_name || '').toLowerCase().includes(query) ||
            (sub.status || '').toLowerCase().includes(query) ||
            (sub.service_type || '').toLowerCase().includes(query)
        );
    });
    const paginatedSubmissions = filteredSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                            {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto bg-gray-100 rounded-xl p-1 no-scrollbar">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
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
                        <SummaryCard icon={Wallet} label="Total Saldo Bersih" value={formatIDR(dashboard.net_balance)} color="brand" />
                        <SummaryCard icon={TrendingUp} label="Total Pemasukan" value={formatIDR(dashboard.total_income)} color="emerald" />
                        <SummaryCard icon={TrendingDown} label="Total Pengeluaran" value={formatIDR(dashboard.total_expense)} color="rose" />
                        <SummaryCard icon={CreditCard} label="Komisi Dibayar" value={formatIDR(dashboard.commission_paid)} color="blue" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard icon={CreditCard} label="Komisi Tertunda" value={formatIDR(dashboard.commission_pending)} color="amber" />
                        <SummaryCard icon={DollarSign} label="Pendapatan Reguler" value={formatIDR(dashboard.income_reguler)} color="indigo" />
                        <SummaryCard icon={FileText} label="Pengeluaran Ajuan" value={formatIDR(dashboard.total_expense_sub)} color="teal" />
                        <SummaryCard icon={TrendingDown} label="Pengeluaran Ops." value={formatIDR(dashboard.total_expense_op)} color="orange" />
                    </div>



                    {/* Expense Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-black text-gray-700 mb-4">Pengeluaran per Bidang Usaha (Ajuan)</h3>
                            {Object.entries(dashboard.expense_by_business).length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(dashboard.expense_by_business).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 truncate mr-2">{k}</span>
                                            <span className="text-sm font-bold text-gray-800">{formatIDR(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-black text-gray-700 mb-4">Pengeluaran Operasional Umum</h3>
                            {Object.entries(dashboard.expense_operational).length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(dashboard.expense_operational).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 truncate mr-2">{k}</span>
                                            <span className="text-sm font-bold text-gray-800">{formatIDR(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="glass-panel rounded-xl p-6 border-2 border-brand-100">
                            <h3 className="text-sm font-black text-brand-700 mb-4">Gabungan Pengeluaran</h3>
                            {Object.entries(combinedExpenses).length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(combinedExpenses).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between border-b border-gray-50 pb-1">
                                            <span className="text-xs font-medium text-gray-600 truncate mr-2">{k}</span>
                                            <span className="text-xs font-bold text-gray-800">{formatIDR(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue & Margin Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Pendapatan per Bidang Usaha */}
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-black text-gray-700 mb-4">Pendapatan per Bidang Usaha</h3>
                            {Object.entries(dashboard.income_by_business || {}).length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(dashboard.income_by_business).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 truncate mr-2">{k}</span>
                                            <span className="text-sm font-bold text-gray-800">{formatIDR(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Analisis Profitabilitas / Margin */}
                        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border-2 border-emerald-100">
                            <h3 className="text-sm font-black text-emerald-800 mb-4">Analisis Profitabilitas per Bidang Usaha</h3>
                            {marginAnalysis.length === 0 ? (
                                <p className="text-sm text-gray-400">Belum ada data</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="border-b border-gray-150 pb-2 text-gray-500 font-bold uppercase">
                                                <th className="pb-2">Bidang Usaha</th>
                                                <th className="pb-2 text-right">Pendapatan</th>
                                                <th className="pb-2 text-right">Pengeluaran</th>
                                                <th className="pb-2 text-right">Margin Bersih</th>
                                                <th className="pb-2 text-right">Persentase</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marginAnalysis.map((item) => (
                                                <tr key={item.name} className="border-b border-gray-50 py-2">
                                                    <td className="py-2 font-medium text-gray-700">{item.name}</td>
                                                    <td className="py-2 text-right text-emerald-600 font-bold">{formatIDR(item.income)}</td>
                                                    <td className="py-2 text-right text-rose-500 font-medium">{formatIDR(item.expense)}</td>
                                                    <td className={`py-2 text-right font-black ${item.margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                        {formatIDR(item.margin)}
                                                    </td>
                                                    <td className="py-2 text-right font-semibold text-gray-500">
                                                        {item.pct.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Incomes Tab */}
            {tab === 'incomes' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari klien, invoice, layanan..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">{filteredIncomes.length} data disaring</span>
                            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                Total Terbayar: {dashboard ? formatIDR(dashboard.total_income) : 'Rp 0'}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tanggal Bayar</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">No. Invoice / SPH</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Nama Klien</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Bidang Usaha</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Jenis Layanan</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedIncomes.map((inv) => (
                                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600">
                                            {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('id') : new Date(inv.created_at).toLocaleDateString('id')}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            INV-{inv.id}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {inv.submission?.client?.business_name || 'Klien Sistem'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">
                                            {inv.submission?.business_type?.name || 'Lainnya'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${inv.service_type === 'REGULER' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                                                {inv.service_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-emerald-600">{formatIDR(inv.amount)}</td>
                                    </tr>
                                ))}
                                {paginatedIncomes.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data pendapatan terbayar</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={filteredIncomes.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {/* Expenses Tab */}


            {/* Commissions Tab */}
            {tab === 'commissions' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-2 flex-wrap flex-1 max-w-lg">
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
                            <div className="relative flex-1">
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari penerima..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">{filteredCommissions.length} komisi disaring</span>
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
                                {paginatedCommissions.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {c.user?.full_name || c.referrer?.full_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-brand-50 text-brand-600">
                                                {COMMISSION_LABELS[c.type] || c.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{c.period}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{formatIDR(c.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
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
                                {paginatedCommissions.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data komisi</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={filteredCommissions.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {/* List Tabs (Agents, Clients, Submissions, Managers) */}
            {tab === 'agents' && <DataTable title="Daftar Agen (Halal Advisor)" data={agents} searchPlaceholder="Cari agen..."
                columns={[
                    { key: 'full_name', label: 'Nama' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Telepon' },
                    { key: 'referral_code', label: 'Kode Referral' },
                ]} />}

            {tab === 'clients' && <DataTable title="Daftar Klien" data={clients} searchPlaceholder="Cari klien..."
                columns={[
                    { key: 'business_name', label: 'Nama Usaha' },
                    { key: 'client_name', label: 'Pemilik' },
                    { key: 'service_type', label: 'Jenis Layanan' },
                    { key: 'phone', label: 'Telepon' },
                ]} />}

            {tab === 'submissions' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-2 flex-wrap flex-1 max-w-lg">
                            <div className="relative">
                                <select value={subServiceFilter} onChange={(e) => setSubServiceFilter(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-brand-500">
                                    <option value="">Semua Layanan</option>
                                    <option value="REGULER">Reguler</option>
                                    <option value="SELF_DECLARE">Self Declare</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative flex-1">
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari ajuan, nama usaha, pemilik..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">{filteredSubmissions.length} ajuan disaring</span>
                    </div>

                    <div className="glass-panel rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Klien (Usaha)</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Layanan</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Pendapatan</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Pengeluaran</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Margin Bersih</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSubmissions.map((sub) => {
                                    const income = sub.invoice?.amount || 0;
                                    const expense = sub.expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;
                                    const margin = income - expense;
                                    return (
                                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {sub.client?.business_name || 'Klien Baru'}
                                                <div className="text-[10px] text-gray-400 font-normal">Pemilik: {sub.client?.client_name || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${sub.service_type === 'REGULER' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                                                    {sub.service_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded font-medium ${sub.status === 'SH_TERBIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                                {income > 0 ? formatIDR(income) : <span className="text-gray-400 font-normal italic">Rp 0</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-500">
                                                {expense > 0 ? formatIDR(expense) : <span className="text-gray-400 font-normal italic">Rp 0</span>}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-black ${margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {formatIDR(margin)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                                {new Date(sub.created_at).toLocaleDateString('id')}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedSubmissions.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data ajuan</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={filteredSubmissions.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {tab === 'managers' && <DataTable title="Daftar Manager" data={managers} searchPlaceholder="Cari manager..."
                columns={[
                    { key: 'full_name', label: 'Nama' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Telepon' },
                ]} />}



            {tab === 'pricing' && (
                <PricingTab submissions={submissions} formatIDR={formatIDR} />
            )}

            {/* Expense Modal */}

        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        emerald: 'from-emerald-500 to-emerald-600',
        brand: 'from-brand-600 to-brand-700',
        blue: 'from-blue-500 to-blue-600',
        amber: 'from-amber-500 to-amber-600',
        purple: 'from-purple-500 to-purple-600',
        rose: 'from-rose-500 to-rose-600',
        teal: 'from-teal-500 to-teal-600',
        indigo: 'from-indigo-500 to-indigo-600',
        orange: 'from-orange-500 to-orange-600',
    };
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-lg`}>
            <div className="absolute top-2 right-2 opacity-20">
                <Icon className="w-12 h-12" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-xl font-black mt-2">{value}</p>
        </div>
    );
}

function Pagination({ totalItems, currentPage, pageSize, onPageChange, onPageSizeChange }: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}) {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (totalItems <= 5) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 py-3 bg-white border border-gray-150 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span>Tampilkan</span>
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-500 focus:outline-none">
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>entri. Menampilkan {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)} dari {totalItems}</span>
            </div>
            <div className="flex items-center gap-1">
                <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Sebelumnya
                </button>
                {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (totalPages > 5 && page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                        if (page === 2 || page === totalPages - 1) {
                            return <span key={page} className="px-1.5 text-xs text-gray-400">...</span>;
                        }
                        return null;
                    }
                    return (
                        <button key={page} onClick={() => onPageChange(page)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${currentPage === page ? 'bg-brand-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                            {page}
                        </button>
                    );
                })}
                <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Berikutnya
                </button>
            </div>
        </div>
    );
}

// ── Pricing Tab Component ──────────────────────────────────────────────

function PricingTab({ submissions, formatIDR }: { submissions: any[]; formatIDR: (n: number) => string }) {
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter only REGULER submissions
    const regulerSubmissions = submissions.filter(s => s.service_type === 'REGULER');

    const filtered = regulerSubmissions.filter(s => {
        const q = search.toLowerCase();
        return (
            (s.business_name || '').toLowerCase().includes(q) ||
            (s.owner_name || '').toLowerCase().includes(q) ||
            (s.status || '').toLowerCase().includes(q)
        );
    });

    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-gray-800">Penentuan Harga Reguler</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Klik pengajuan untuk menentukan/melihat rincian harga pendampingan</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                    <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari ajuan reguler..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Klien (Usaha)</th>
                            <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status</th>
                            <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Harga Total</th>
                            <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tanggal</th>
                            <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(sub => {
                            const hasPrice = sub.cost_detail && sub.cost_detail.total_amount > 0;
                            const isExpanded = expandedId === sub.id;
                            return (
                                <tr key={sub.id} className="border-b border-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-bold text-gray-800">{sub.business_name || '-'}</p>
                                            <p className="text-xs text-gray-400">{sub.owner_name || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {hasPrice ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                                ✅ Harga Ditentukan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                                ⏳ Belum Ditentukan
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-brand-700">
                                        {hasPrice ? formatIDR(sub.cost_detail.total_amount) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                        {new Date(sub.created_at).toLocaleDateString('id')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                                            className={`px-3 py-1.5 font-bold rounded-lg text-xs transition-colors ${
                                                isExpanded
                                                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                                                    : 'bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100'
                                            }`}
                                        >
                                            {isExpanded ? 'Tutup' : hasPrice ? 'Lihat Harga' : 'Set Harga'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {paginated.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada ajuan reguler</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Expanded Submission Detail with Kalkulator */}
            {expandedId && (
                <div className="border border-brand-100 rounded-2xl bg-brand-50/30 p-4 mt-2">
                    <ExpandedSubmissionDetail 
                        submissionId={expandedId} 
                        onClose={() => {
                            toast.success('Harga berhasil disimpan!');
                            const id = expandedId;
                            setExpandedId(null);
                            setTimeout(() => setExpandedId(id), 100);
                        }} 
                    />
                </div>
            )}

            <Pagination totalItems={filtered.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
        </div>
    );
}

// ── Expanded Submission Detail for Pricing ───────────────────────────

function ExpandedSubmissionDetail({ submissionId, onClose }: { submissionId: string; onClose: () => void }) {
    const { submission, fieldValues, loading, refresh, updateClient, updateBusinessType, updateClientInfoAndPricing } = useSubmission(submissionId);
    const user = useAuthStore(state => state.user);
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [editingData, setEditingData] = useState(false);

    useEffect(() => {
        api.get('/billing-config/business-types').then(res => setBusinessTypes(res.data || []));
    }, []);

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600 w-6 h-6" /></div>;
    }
    if (!submission) return <div className="p-4 text-center text-gray-500">Data tidak ditemukan</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-4">
            <h4 className="text-lg font-black text-brand-900 px-2">Data & Rincian Harga Pengajuan</h4>

            <ClientInfoSection 
                submission={submission} 
                user={user} 
                onUpdateClient={updateClient} 
                onUpdateClientInfoAndPricing={updateClientInfoAndPricing}
                onUpdateBusinessType={updateBusinessType}
                businessTypes={businessTypes}
                processing={false} 
            />

            <DocumentList 
                submission={submission}
                user={user}
                fieldValues={fieldValues}
                editingData={editingData}
                setEditingData={setEditingData}
                onRefresh={refresh}
            />

            <div className="border-t border-brand-200/50 pt-6 mt-6">
                <KalkulatorReguler
                    submissionId={submissionId}
                    onSaved={onClose}
                    salesSchemeId={submission.sales_scheme_id || undefined}
                    dataSource={submission.data_source}
                />
            </div>
        </div>
    );
}

function DataTable({ title, data, columns, searchPlaceholder = "Cari data..." }: {
    title: string;
    data: any[];
    columns: { key: string; label: string; render?: (v: any) => string }[];
    searchPlaceholder?: string;
}) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const getValue = (obj: any, key: string) => {
        return key.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    const filteredData = data.filter(item => {
        const query = search.toLowerCase();
        return columns.some(col => {
            const val = getValue(item, col.key);
            if (!val) return false;
            return String(val).toLowerCase().includes(query);
        });
    });

    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-black text-gray-800">{title}</h3>
                <div className="relative w-full sm:max-w-xs">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>
            </div>
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
                        {paginatedData.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className="px-4 py-3 text-gray-700">
                                        {col.render ? col.render(getValue(item, col.key)) : (getValue(item, col.key) || '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">Belum ada data</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination totalItems={filteredData.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
        </div>
    );
}
