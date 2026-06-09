import { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import { paymentService } from '../../services/paymentService';
import {
    DollarSign, TrendingUp, TrendingDown, Users, FileText, Briefcase,
    CreditCard, Download, Send, ChevronDown, Plus, Trash2, Wallet, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

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

interface Expense {
    id: number;
    submission_id?: string;
    submission?: {
        client?: { business_name: string };
        service_type: string;
    };
    category: string;
    amount: number;
    description: string;
    date: string;
}

const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const COMMISSION_LABELS: Record<string, string> = {
    DIRECT_SALES: 'Insentif Pendampingan',
    OVERRIDE: 'Override',
    STRUCTURAL: 'Struktural',
    REFERRAL: 'Referral',
};

type TabKey = 'overview' | 'incomes' | 'expenses' | 'commissions' | 'agents' | 'clients' | 'submissions' | 'managers' | 'bpjph';

export default function FinanceDashboard() {
    const [tab, setTab] = useState<TabKey>('overview');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
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

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ category: '', amount: 0, description: '', submission_id: '' });

    const [showBPJPHModal, setShowBPJPHModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [bpjphStatusInput, setBpjphStatusInput] = useState<'UNPAID' | 'PAID'>('UNPAID');
    const [bpjphAmountInput, setBpjphAmountInput] = useState<number>(150000);
    const [selectedBPJPHIds, setSelectedBPJPHIds] = useState<string[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    useEffect(() => {
        setSearchQuery('');
        setCurrentPage(1);
        setSelectedBPJPHIds([]);
    }, [tab]);

    useEffect(() => {
        loadDashboard();
    }, [year, month]);

    useEffect(() => {
        if (tab === 'commissions') loadCommissions();
        if (tab === 'expenses') {
            loadExpenses();
            if (submissions.length === 0) loadSubmissions(); // for the dropdown
        }
        if (tab === 'incomes') loadIncomes();
        if (tab === 'agents') loadAgents();
        if (tab === 'clients') loadClients();
        if (tab === 'submissions' || tab === 'bpjph') loadSubmissions();
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

    const loadExpenses = async () => {
        try {
            const res = await financeService.getExpenses(1, 1000);
            setExpenses(res.data || []);
        } catch { /* */ }
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
            const filterServiceType = tab === 'bpjph' ? 'SELF_DECLARE' : (subServiceFilter || undefined);
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

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...newExpense };
            if (!payload.submission_id) delete payload.submission_id;
            
            await financeService.createExpense(payload);
            toast.success('Pengeluaran berhasil dicatat');
            setShowExpenseModal(false);
            setNewExpense({ category: '', amount: 0, description: '', submission_id: '' });
            loadExpenses();
            loadDashboard();
        } catch {
            toast.error('Gagal mencatat pengeluaran');
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!window.confirm('Yakin ingin menghapus pengeluaran ini?')) return;
        try {
            await financeService.deleteExpense(id);
            toast.success('Pengeluaran dihapus');
            loadExpenses();
            loadDashboard();
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleUpdateBPJPHPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub) return;
        try {
            await financeService.updateBPJPHPayment(selectedSub.id, bpjphStatusInput, bpjphAmountInput);
            toast.success('Status pembayaran BPJPH berhasil diperbarui');
            setShowBPJPHModal(false);
            loadSubmissions();
            loadDashboard();
        } catch {
            toast.error('Gagal memperbarui status pembayaran BPJPH');
        }
    };

    const handleBulkUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBPJPHIds.length === 0) return;
        try {
            await financeService.updateBPJPHPaymentBulk(selectedBPJPHIds, bpjphStatusInput, bpjphAmountInput);
            toast.success(`Berhasil memperbarui ${selectedBPJPHIds.length} ajuan BPJPH`);
            setSelectedBPJPHIds([]);
            setShowBulkModal(false);
            loadSubmissions();
            loadDashboard();
        } catch {
            toast.error('Gagal memperbarui status pembayaran massal');
        }
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
        { key: 'expenses', label: 'Pos Pengeluaran', icon: Wallet },
        { key: 'commissions', label: 'Komisi', icon: DollarSign },
        { key: 'bpjph', label: 'Pendapatan BPJPH', icon: DollarSign },
        { key: 'agents', label: 'Agen', icon: Users },
        { key: 'clients', label: 'Klien', icon: Briefcase },
        { key: 'submissions', label: 'Ajuan', icon: FileText },
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

    // Filter and paginate Expenses
    const filteredExpenses = (expenses || []).filter(e => {
        if (!e) return false;
        const query = searchQuery.toLowerCase();
        return (
            (e.category || '').toLowerCase().includes(query) ||
            (e.description || '').toLowerCase().includes(query) ||
            (e.submission?.client?.business_name || '').toLowerCase().includes(query)
        );
    });
    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

    // Filter and paginate BPJPH Submissions
    const filteredBPJPHSubmissions = (submissions || []).filter(sub => {
        if (!sub) return false;
        const query = searchQuery.toLowerCase();
        return (
            (sub.client?.business_name || '').toLowerCase().includes(query) ||
            (sub.client?.client_name || '').toLowerCase().includes(query) ||
            (sub.status || '').toLowerCase().includes(query) ||
            (sub.bpjph_payment_status || '').toLowerCase().includes(query)
        );
    });
    const paginatedBPJPHSubmissions = filteredBPJPHSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard icon={DollarSign} label="Pendapatan BPJPH Terbayar" value={formatIDR(dashboard.income_bpjph_paid || 0)} color="emerald" />
                        <SummaryCard icon={CreditCard} label="Klaim BPJPH Tertunda" value={formatIDR(dashboard.income_bpjph_pending || 0)} color="amber" />
                        <SummaryCard icon={Users} label="Self Declare Terbayar" value={`${dashboard.count_bpjph_paid || 0} Ajuan`} color="teal" />
                        <SummaryCard icon={FileText} label="Self Declare Belum Bayar" value={`${dashboard.count_bpjph_unpaid || 0} Ajuan`} color="rose" />
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
            {tab === 'expenses' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari kategori, deskripsi, klien..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">{filteredExpenses.length} data disaring</span>
                            <button onClick={() => setShowExpenseModal(true)}
                                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-all shadow-sm">
                                <Plus className="w-4 h-4" /> Tambah Pengeluaran
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tanggal</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Kategori</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Deskripsi</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Terkait Ajuan</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Jumlah</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedExpenses.map((e) => (
                                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString('id')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${e.submission_id ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {e.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-800">{e.description || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">
                                            {e.submission_id ? `${e.submission?.client?.business_name} (${e.submission?.service_type})` : <span className="text-gray-400 italic">Operasional Umum</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{formatIDR(e.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleDeleteExpense(e.id)}
                                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedExpenses.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data pengeluaran</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={filteredExpenses.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

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

            {tab === 'bpjph' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari klien, status, BPJPH..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex gap-2">
                            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                                BPJPH Terbayar: {dashboard ? formatIDR(dashboard.income_bpjph_paid) : 'Rp 0'}
                            </div>
                            <div className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm">
                                Estimasi Klaim Tertunda: {dashboard ? formatIDR(dashboard.income_bpjph_pending) : 'Rp 0'}
                            </div>
                        </div>
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedBPJPHIds.length > 0 && (
                        <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 animate-fade-in shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-brand-800">
                                    {selectedBPJPHIds.length} Ajuan Terpilih
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    setBpjphStatusInput('PAID');
                                    setBpjphAmountInput(150000);
                                    setShowBulkModal(true);
                                }}
                                    className="bg-brand-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-700 transition-all shadow-sm">
                                    Update Status Massal
                                </button>
                                <button onClick={() => setSelectedBPJPHIds([])}
                                    className="bg-white border border-gray-200 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="glass-panel rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="px-4 py-3 text-center w-12">
                                        <input type="checkbox"
                                            checked={paginatedBPJPHSubmissions.length > 0 && paginatedBPJPHSubmissions.every(sub => selectedBPJPHIds.includes(sub.id))}
                                            onChange={(e) => {
                                                const visibleIds = paginatedBPJPHSubmissions.map(sub => sub.id);
                                                if (e.target.checked) {
                                                    setSelectedBPJPHIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                                                } else {
                                                    setSelectedBPJPHIds(prev => prev.filter(id => !visibleIds.includes(id)));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Nama Klien / Usaha</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Layanan</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status Alur</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status BPJPH</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Nominal BPJPH</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Tanggal Bayar</th>
                                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBPJPHSubmissions.map((sub) => {
                                    return (
                                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-center w-12">
                                                <input type="checkbox"
                                                    checked={selectedBPJPHIds.includes(sub.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        if (checked) {
                                                            setSelectedBPJPHIds(prev => [...prev, sub.id]);
                                                        } else {
                                                            setSelectedBPJPHIds(prev => prev.filter(id => id !== sub.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {sub.client?.business_name || 'Klien Baru'}
                                                <div className="text-[10px] text-gray-400 font-normal">Pemilik: {sub.client?.client_name || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600">
                                                    {sub.service_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className={`px-2 py-0.5 rounded font-medium ${sub.status === 'SH_TERBIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 ${sub.bpjph_payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sub.bpjph_payment_status === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                    {sub.bpjph_payment_status === 'PAID' ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-emerald-600">
                                                {sub.bpjph_payment_status === 'PAID' ? (
                                                    formatIDR(sub.bpjph_amount || 0)
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatIDR(sub.bpjph_amount || 150000)}</span>
                                                        {(!sub.bpjph_amount) && (
                                                            <span className="text-[10px] text-gray-400 font-normal italic">Estimasi</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 text-xs">
                                                {sub.bpjph_paid_at ? new Date(sub.bpjph_paid_at).toLocaleDateString('id') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => {
                                                    setSelectedSub(sub);
                                                    setBpjphStatusInput(sub.bpjph_payment_status || 'UNPAID');
                                                    setBpjphAmountInput(sub.bpjph_amount || 150000);
                                                    setShowBPJPHModal(true);
                                                }}
                                                    className="px-3 py-1 bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100 font-bold rounded-lg text-xs transition-colors">
                                                    Edit Pembayaran
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedBPJPHSubmissions.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Tidak ada data ajuan Self Declare</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalItems={filteredBPJPHSubmissions.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800">Tambah Pengeluaran</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Terkait Pengajuan (Opsional)</label>
                                <select value={newExpense.submission_id} onChange={e => setNewExpense({ ...newExpense, submission_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm animate-none">
                                    <option value="">-- Operasional Umum (Tidak Terkait Pengajuan) --</option>
                                    {submissions.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.client?.business_name} - {sub.service_type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kategori (Teks Bebas)</label>
                                <input type="text" required value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    placeholder="Contoh: BPJPH, Operasional, Marketing, Gaji..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Jumlah (Rp)</label>
                                <input type="number" required min="1" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Keterangan (Opsional)</label>
                                <textarea value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm resize-none" rows={2} />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowExpenseModal(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all">Simpan Pengeluaran</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BPJPH Payment Modal */}
            {showBPJPHModal && selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800">Edit Pembayaran BPJPH</h3>
                            <button onClick={() => setShowBPJPHModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateBPJPHPayment} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Update status klaim BPJPH untuk klien: <strong>{selectedSub.client?.business_name}</strong>
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Status Pembayaran</label>
                                <select value={bpjphStatusInput} onChange={e => setBpjphStatusInput(e.target.value as 'UNPAID' | 'PAID')}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm font-bold">
                                    <option value="UNPAID">BELUM DIBAYAR</option>
                                    <option value="PAID">SUDAH DIBAYAR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nominal Payout (Rp)</label>
                                <input type="number" required min="0" value={bpjphAmountInput} onChange={e => setBpjphAmountInput(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm font-bold" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowBPJPHModal(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BPJPH Bulk Payment Modal */}
            {showBulkModal && selectedBPJPHIds.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800">Edit Pembayaran Massal ({selectedBPJPHIds.length} Ajuan)</h3>
                            <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleBulkUpdate} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Anda akan memperbarui status klaim BPJPH untuk <strong>{selectedBPJPHIds.length}</strong> ajuan terpilih secara massal.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Status Pembayaran</label>
                                <select value={bpjphStatusInput} onChange={e => setBpjphStatusInput(e.target.value as 'UNPAID' | 'PAID')}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm font-bold">
                                    <option value="UNPAID">BELUM DIBAYAR</option>
                                    <option value="PAID">SUDAH DIBAYAR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nominal Payout per Ajuan (Rp)</label>
                                <input type="number" required min="0" value={bpjphAmountInput} onChange={e => setBpjphAmountInput(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm font-bold" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowBulkModal(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all">Terapkan Massal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
