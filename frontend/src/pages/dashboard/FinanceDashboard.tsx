import { useEffect, useState, useMemo } from 'react';
import { financeService } from '../../services/financeService';
import { paymentService } from '../../services/paymentService';
import KalkulatorReguler from '../../components/dashboard/KalkulatorReguler';
import {
    TrendingUp, TrendingDown, Clock, Target,
    CreditCard, Download, Send, Wallet, Search, Calculator, Loader2,
    Sparkles, Calendar, RotateCcw, Percent, Building2, CheckCircle2, ArrowUpRight, Layers,
    FileSpreadsheet, Eye, RefreshCw, XCircle, CheckCircle, ExternalLink, X, Image as ImageIcon,
    Receipt
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useSubmission } from '../../hooks/useSubmission';
import { ClientInfoSection } from '../../components/dashboard/submission/ClientInfoSection';
import { DocumentList } from '../../components/dashboard/submission/DocumentList';
import type { Payment } from '../../types';
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
    target_omset?: number;
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

const formatCompactIDR = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} M`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} Jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)} Rb`;
    return String(val);
};

const COMMISSION_LABELS: Record<string, string> = {
    DIRECT_SALES: 'Insentif Pendampingan',
    OVERRIDE: 'Override',
    STRUCTURAL: 'Struktural',
    REFERRAL: 'Referral',
};

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DONUT_COLORS = ['#10b981', '#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

type TabKey = 'overview' | 'payments' | 'incomes' | 'commissions' | 'pricing';

export default function FinanceDashboard() {
    const [tab, setTab] = useState<TabKey>('overview');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [incomes, setIncomes] = useState<any[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [syncingId, setSyncingId] = useState<number | null>(null);

    // Proof Modal State
    const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);

    // Target state
    const [targetOmset, setTargetOmset] = useState<number>(50000000);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [inputTargetOmset, setInputTargetOmset] = useState('50000000');

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    useEffect(() => {
        setSearchQuery('');
        setCurrentPage(1);
    }, [tab]);

    useEffect(() => {
        loadAllData();
    }, [year, month]);

    useEffect(() => {
        if (tab === 'commissions') loadCommissions();
        if (tab === 'incomes') loadIncomes();
        if (tab === 'payments' || tab === 'overview') loadPayments();
        if (tab === 'pricing') loadSubmissions();
    }, [tab, statusFilter, typeFilter, paymentMethodFilter]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadDashboard(),
                loadPayments(),
                loadIncomes(),
                loadCommissions(),
                loadSubmissions(),
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadDashboard = async () => {
        try {
            const data = await financeService.getDashboard(month || undefined, year);
            setDashboard(data);
            if (data?.target_omset) {
                setTargetOmset(data.target_omset);
                setInputTargetOmset(String(data.target_omset));
            }
        } catch { 
            toast.error('Gagal memuat ringkasan keuangan'); 
        }
    };

    const loadPayments = async () => {
        try {
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', '500');
            if (paymentMethodFilter) params.append('method', paymentMethodFilter);
            if (statusFilter && tab === 'payments') params.append('status', statusFilter);
            const res = await paymentService.getPayments(params);
            setPayments(res.data || res || []);
        } catch { /* silent */ }
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
        } catch { /* silent */ }
    };

    const loadSubmissions = async () => {
        try {
            const res = await financeService.getSubmissions(1, 1000, 'REGULER');
            setSubmissions(res.data || []);
        } catch { /* silent */ }
    };

    const handleVerifyPayment = async (id: number, approved: boolean) => {
        if (!confirm(`Konfirmasi untuk ${approved ? 'MENYETUJUI' : 'MENOLAK'} pembayaran ini?`)) return;
        setVerifyingId(id);
        try {
            await paymentService.verifyPayment(id, approved);
            toast.success(approved ? 'Pembayaran berhasil disetujui & diverifikasi!' : 'Pembayaran ditolak.');
            if (previewPayment?.id === id) setPreviewPayment(null);
            loadPayments();
            loadIncomes();
            loadDashboard();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal memverifikasi pembayaran');
        } finally {
            setVerifyingId(null);
        }
    };

    const handleSyncPayment = async (id: number) => {
        setSyncingId(id);
        try {
            await paymentService.syncPayment(id);
            toast.success('Status pembayaran Midtrans berhasil disinkronisasi!');
            loadPayments();
            loadIncomes();
            loadDashboard();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal sinkronisasi pembayaran Midtrans');
        } finally {
            setSyncingId(null);
        }
    };

    const handlePayCommission = async (id: string) => {
        if (!confirm('Konfirmasi pembayaran komisi ini?')) return;
        try {
            await financeService.payCommission(id);
            toast.success('Komisi berhasil dibayarkan');
            loadCommissions();
            loadDashboard();
        } catch { toast.error('Gagal membayar komisi'); }
    };

    const handleDownloadSlip = async (id: string) => {
        try {
            const res = await financeService.downloadSlip(id);
            const blob = new Blob([res.data || res], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `slip-komisi-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { toast.error('Gagal mengunduh slip komisi'); }
    };

    const handleSendWA = async (id: string) => {
        try {
            await financeService.sendSlipWA(id);
            toast.success('Slip komisi terkirim via WhatsApp');
        } catch { toast.error('Gagal mengirim WhatsApp'); }
    };

    const handleSaveTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = Number(inputTargetOmset);
        if (isNaN(val) || val <= 0) {
            toast.error('Masukkan nominal target yang valid');
            return;
        }
        try {
            await financeService.setTarget({
                period: `${year}-${month ? String(month).padStart(2, '0') : '01'}`,
                target_omset: val,
                target_submissions: 0
            });
            setTargetOmset(val);
            setShowTargetModal(false);
            toast.success('Target omset berhasil diperbarui!');
        } catch {
            setTargetOmset(val);
            setShowTargetModal(false);
            toast.success('Target omset disimpan!');
        }
    };

    const getFullProofUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Derived calculations
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

    const expensePieData = useMemo(() => {
        return Object.entries(combinedExpenses).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [combinedExpenses]);

    // Export Finance Summary CSV
    const exportFinanceCSV = () => {
        if (!dashboard) return;
        let csv = 'Indikator Keuangan,Nominal\n';
        csv += `Total Pemasukan,${dashboard.total_income}\n`;
        csv += `Pemasukan Reguler,${dashboard.income_reguler}\n`;
        csv += `Pemasukan Self Declare Berbayar,${dashboard.income_self_declare_paid}\n`;
        csv += `Pencairan BPJPH,${dashboard.income_bpjph_paid}\n`;
        csv += `Total Beban & Pengeluaran,${dashboard.total_expense}\n`;
        csv += `Komisi Mitra Terbayar,${dashboard.commission_paid}\n`;
        csv += `Komisi Mitra Tertunda,${dashboard.commission_pending}\n`;
        csv += `Saldo Bersih (Net Balance),${dashboard.net_balance}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-keuangan-${year}-${month || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Laporan keuangan berhasil diexport!');
    };

    // Pending Manual Payments Count
    const pendingManualPayments = useMemo(() => {
        return payments.filter(p => p.method === 'MANUAL' && p.status === 'PENDING');
    }, [payments]);

    // Filter and paginate Payments
    const filteredPayments = useMemo(() => {
        return (payments || []).filter(p => {
            if (!p) return false;
            const q = searchQuery.toLowerCase();
            const clientName = p.invoices?.[0]?.submission?.client?.business_name || p.invoices?.[0]?.submission?.client?.client_name || '';
            const invoiceNo = p.invoices?.[0]?.id ? `INV-${p.invoices[0].id}` : '';
            const matchQuery = (
                `#${p.id}`.toLowerCase().includes(q) ||
                clientName.toLowerCase().includes(q) ||
                invoiceNo.toLowerCase().includes(q) ||
                (p.method || '').toLowerCase().includes(q) ||
                (p.payment_type || '').toLowerCase().includes(q)
            );
            const matchMethod = !paymentMethodFilter || p.method === paymentMethodFilter;
            const matchStatus = !statusFilter || p.status === statusFilter;
            return matchQuery && matchMethod && matchStatus;
        });
    }, [payments, searchQuery, paymentMethodFilter, statusFilter]);

    const paginatedPayments = useMemo(() => {
        return filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredPayments, currentPage, pageSize]);

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

    const netProfitMargin = dashboard && dashboard.total_income > 0 
        ? ((dashboard.net_balance / dashboard.total_income) * 100).toFixed(1)
        : '0.0';

    const targetProgress = targetOmset > 0 && dashboard
        ? Math.min(100, Math.round((dashboard.total_income / targetOmset) * 100))
        : 0;

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
                                Treasury & Financial Control Hub
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-gray-300 text-xs font-medium border border-white/10">
                                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            Laporan Keuangan & Finansial
                        </h1>
                        <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
                            Monitoring komprehensif arus kas, aktivitas pembayaran masuk (Transfer Manual & Gateway Midtrans), pencairan komisi pendamping, serta analisis profitabilitas bisnis.
                        </p>
                    </div>

                    {/* Quick CTA Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setTab('payments')}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm shadow-sm relative"
                        >
                            <Receipt className="w-4 h-4 text-purple-300" />
                            <span>Aktivitas Pembayaran</span>
                            {pendingManualPayments.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                                    {pendingManualPayments.length} Verifikasi
                                </span>
                            )}
                        </button>
                        <button
                            onClick={exportFinanceCSV}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm shadow-sm"
                            title="Export Summary CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                            <span>Export CSV</span>
                        </button>
                        <button
                            onClick={() => setShowTargetModal(true)}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm shadow-sm"
                        >
                            <Target className="w-4 h-4 text-amber-300" />
                            <span>Target Omset</span>
                        </button>
                        <button
                            onClick={() => setTab('pricing')}
                            className="px-4 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-teal-500/20"
                        >
                            <Calculator className="w-4 h-4" />
                            <span>Penetapan Harga Reguler</span>
                        </button>
                    </div>
                </div>

                {/* Period Selector Bar & Target Summary */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-400" />
                            <span className="text-xs font-bold text-gray-200">Periode Finansial:</span>
                        </div>

                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-white/10 border border-white/20 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                            <option value={0} className="text-gray-900 font-bold">Semua Bulan (Tahunan)</option>
                            {MONTH_NAMES.map((m, idx) => (
                                <option key={idx} value={idx + 1} className="text-gray-900 font-medium">{m}</option>
                            ))}
                        </select>

                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-white/10 border border-white/20 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                            {Array.from({ length: new Date().getFullYear() + 5 - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                                <option key={y} value={y} className="text-gray-900 font-bold">{y}</option>
                            ))}
                        </select>

                        <button
                            onClick={loadAllData}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
                            title="Refresh Data"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Realization vs Target Omset Progress */}
                    {dashboard && (
                        <div className="bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-4">
                            <div>
                                <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
                                    <span className="text-gray-300">Pencapaian Target:</span>
                                    <span className="text-teal-300 font-mono font-black">{targetProgress}%</span>
                                </div>
                                <div className="w-48 bg-white/10 rounded-full h-2 mt-1.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${targetProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right border-l border-white/10 pl-3">
                                <p className="text-[10px] text-gray-400 font-bold">Target Omset</p>
                                <p className="text-xs font-black text-amber-300 font-mono">{formatCompactIDR(targetOmset)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 6 Executive KPI Cards */}
            {dashboard && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Card 1: Saldo Bersih */}
                    <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm hover:shadow-md transition-all space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Saldo Bersih</span>
                            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">{formatCompactIDR(dashboard.net_balance)}</p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-teal-700">
                                <ArrowUpRight className="w-3 h-3 text-teal-600" />
                                <span>Profit Margin: {netProfitMargin}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Total Pemasukan */}
                    <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pemasukan</span>
                            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">{formatCompactIDR(dashboard.total_income)}</p>
                            <p className="text-[10px] font-bold text-emerald-700 mt-1 truncate">
                                Reguler: {formatCompactIDR(dashboard.income_reguler)}
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Total Pengeluaran */}
                    <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-sm hover:shadow-md transition-all space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pengeluaran</span>
                            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">{formatCompactIDR(dashboard.total_expense)}</p>
                            <p className="text-[10px] font-bold text-rose-700 mt-1 truncate">
                                Ajuan + Ops Umum
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Komisi Terbayar */}
                    <div 
                        onClick={() => setTab('commissions')}
                        className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Komisi Terbayar</span>
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">{formatCompactIDR(dashboard.commission_paid)}</p>
                            <p className="text-[10px] font-bold text-blue-600 mt-1 truncate">
                                Tertunda: {formatCompactIDR(dashboard.commission_pending)}
                            </p>
                        </div>
                    </div>

                    {/* Card 5: BPJPH Cair */}
                    <div className="p-5 rounded-3xl bg-white border border-amber-100 shadow-sm hover:shadow-md transition-all space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pencairan BPJPH</span>
                            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">{formatCompactIDR(dashboard.income_bpjph_paid)}</p>
                            <p className="text-[10px] font-bold text-amber-700 mt-1 truncate">
                                {dashboard.count_bpjph_paid} ajuan cair
                            </p>
                        </div>
                    </div>

                    {/* Card 6: BPJPH Belum Cair */}
                    <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm hover:shadow-md transition-all space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">BPJPH Belum Cair</span>
                            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">{formatCompactIDR(dashboard.income_bpjph_pending)}</p>
                            <p className="text-[10px] font-bold text-purple-700 mt-1 truncate">
                                {dashboard.count_bpjph_unpaid} ajuan pending
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
                <button
                    onClick={() => setTab('overview')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                        tab === 'overview'
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Ringkasan & Analisis Finansial</span>
                </button>
                <button
                    onClick={() => setTab('payments')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 relative ${
                        tab === 'payments'
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <Receipt className="w-4 h-4" />
                    <span>Aktivitas & Transaksi Pembayaran</span>
                    {pendingManualPayments.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                            {pendingManualPayments.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab('incomes')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                        tab === 'incomes'
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Pemasukan & Invoices Lunas</span>
                </button>
                <button
                    onClick={() => setTab('commissions')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                        tab === 'commissions'
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Pencairan Komisi Mitra</span>
                </button>
                <button
                    onClick={() => setTab('pricing')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                        tab === 'pricing'
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <Calculator className="w-4 h-4" />
                    <span>Penetapan Harga Reguler</span>
                </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {tab === 'overview' && dashboard && (
                <div className="space-y-6">
                    {/* QUICK PAYMENT ACTIVITIES CARD (Manual & Midtrans with Quick Proof Viewer) */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                        <Receipt className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-gray-900">
                                        Aktivitas Pembayaran Masuk Terbaru
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mt-1">
                                    Pantau transaksi transfer manual & gateway online (Midtrans), verifikasi bukti transfer, dan cek status pembayaran klien.
                                </p>
                            </div>

                            <button
                                onClick={() => setTab('payments')}
                                className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold border border-teal-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span>Lihat Semua ({payments.length})</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Recent 5 Payments Grid/List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {payments.slice(0, 6).map((p) => {
                                const clientName = p.invoices?.[0]?.submission?.client?.business_name || p.invoices?.[0]?.submission?.client?.client_name || 'Klien Sistem';
                                const invoiceNo = p.invoices?.[0]?.id ? `INV-${p.invoices[0].id}` : `#${p.id}`;
                                const isManual = p.method === 'MANUAL';
                                const hasProof = Boolean(p.proof_url);

                                return (
                                    <div 
                                        key={p.id}
                                        className="p-4 rounded-2xl bg-gray-50/70 border border-gray-150 hover:bg-white hover:shadow-md transition-all space-y-3 relative group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    isManual ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {p.method === 'MIDTRANS' ? 'Midtrans Gateway' : 'Transfer Manual'}
                                                </span>
                                                <p className="text-xs font-mono text-gray-400 mt-1">{invoiceNo}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                                p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                p.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {p.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : 
                                                 p.status === 'FAILED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {p.status}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black text-gray-900 truncate" title={clientName}>
                                                {clientName}
                                            </p>
                                            <p className="text-sm font-black text-teal-700 mt-0.5 font-mono">
                                                {formatIDR(p.amount)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        {/* Quick Actions Footer */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-150/80 gap-2">
                                            {hasProof ? (
                                                <button
                                                    onClick={() => setPreviewPayment(p)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 text-[10px] font-black flex items-center gap-1.5 transition-all shadow-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Lihat Bukti</span>
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">
                                                    {isManual ? 'Belum upload bukti' : 'Auto Gateway'}
                                                </span>
                                            )}

                                            <div className="flex items-center gap-1.5">
                                                {p.status === 'PENDING' && isManual && (
                                                    <button
                                                        onClick={() => handleVerifyPayment(p.id, true)}
                                                        disabled={verifyingId === p.id}
                                                        className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                                                    >
                                                        {verifyingId === p.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        <span>Setujui</span>
                                                    </button>
                                                )}
                                                {p.status === 'PENDING' && !isManual && (
                                                    <button
                                                        onClick={() => handleSyncPayment(p.id)}
                                                        disabled={syncingId === p.id}
                                                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 text-[10px] font-black transition-all flex items-center gap-1"
                                                        title="Sync status Midtrans"
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === p.id ? 'animate-spin text-blue-600' : ''}`} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {payments.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-400 text-xs italic">
                                    Belum ada aktivitas pembayaran masuk
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visual Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cashflow Bar Chart */}
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-teal-600" />
                                        Arus Kas & Komposisi Finansial
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">Perbandingan total pemasukan, pengeluaran ajuan, komisi, dan saldo kas</p>
                                </div>
                            </div>

                            <div className="h-64 sm:h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Pemasukan', amount: dashboard.total_income, fill: '#10b981' },
                                        { name: 'Pengeluaran', amount: dashboard.total_expense, fill: '#f43f5e' },
                                        { name: 'Komisi Mitra', amount: dashboard.commission_paid, fill: '#3b82f6' },
                                        { name: 'Saldo Bersih', amount: dashboard.net_balance, fill: '#0d9488' },
                                    ]}>
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={formatCompactIDR} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', border: 'none', fontSize: '12px' }}
                                            formatter={(val: any) => [formatIDR(Number(val)), 'Nominal']}
                                        />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Expense Breakdown Donut Chart */}
                        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <h3 className="text-base font-black text-gray-900">Alokasi Beban Biaya</h3>
                                    <span className="text-xs font-bold text-gray-400">{formatCompactIDR(dashboard.total_expense)}</span>
                                </div>

                                <div className="h-48 w-full relative my-2">
                                    {expensePieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={expensePieData}
                                                    innerRadius={45}
                                                    outerRadius={70}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {expensePieData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px' }}
                                                    formatter={(val: any) => [formatIDR(Number(val)), 'Biaya']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                                            Belum ada data beban pengeluaran
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-gray-100 max-h-32 overflow-y-auto custom-scrollbar">
                                {expensePieData.slice(0, 4).map((item, idx) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 truncate mr-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                                            <span className="text-gray-600 truncate">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-800 shrink-0">{formatCompactIDR(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Profitability by Business Sector Table */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-teal-600" />
                                    Analisis Profitabilitas per Bidang Usaha
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">Margin perolehan laba bersih berdasarkan kategori produk / bidang usaha klien</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b border-gray-150 pb-3 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                        <th className="py-3 px-4">Bidang Usaha</th>
                                        <th className="py-3 px-4 text-right">Pendapatan</th>
                                        <th className="py-3 px-4 text-right">Pengeluaran</th>
                                        <th className="py-3 px-4 text-right">Margin Bersih</th>
                                        <th className="py-3 px-4 text-center">Profit Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                    {marginAnalysis.map((item) => (
                                        <tr key={item.name} className="hover:bg-gray-50/80 transition-all">
                                            <td className="py-3.5 px-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">{formatIDR(item.income)}</td>
                                            <td className="py-3.5 px-4 text-right text-rose-500">{formatIDR(item.expense)}</td>
                                            <td className={`py-3.5 px-4 text-right font-black ${item.margin >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                                                {formatIDR(item.margin)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                                                    item.pct >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    item.pct > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                                                    'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    <Percent className="w-2.5 h-2.5" />
                                                    {item.pct.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {marginAnalysis.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">Belum ada data profitabilitas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PAYMENTS ACTIVITY & VERIFICATION */}
            {tab === 'payments' && (
                <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-teal-600" />
                                Aktivitas & Verifikasi Pembayaran (Manual & Midtrans)
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Monitoring semua transaksi masuk, verifikasi bukti transfer manual, dan sinkronisasi pembayaran online Midtrans
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <select
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                            >
                                <option value="">Semua Metode</option>
                                <option value="MANUAL">Transfer Manual (Bukti)</option>
                                <option value="MIDTRANS">Midtrans Gateway</option>
                                <option value="MAYAR">Mayar Gateway</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                            >
                                <option value="">Semua Status</option>
                                <option value="PENDING">Pending (Menunggu)</option>
                                <option value="PAID">Paid (Lunas)</option>
                                <option value="FAILED">Failed (Gagal/Ditolak)</option>
                            </select>

                            <div className="relative w-full sm:w-60">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari klien, invoice, ID..."
                                    className="pl-8 pr-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">ID & Tanggal</th>
                                    <th className="py-3 px-4">Klien / Badan Usaha</th>
                                    <th className="py-3 px-4">Metode Bayar</th>
                                    <th className="py-3 px-4 text-right">Nominal</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Bukti Transfer</th>
                                    <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                {paginatedPayments.map((p) => {
                                    const clientName = p.invoices?.[0]?.submission?.client?.business_name || p.invoices?.[0]?.submission?.client?.client_name || 'Klien Sistem';
                                    const invoiceNo = p.invoices?.[0]?.id ? `INV-${p.invoices[0].id}` : '-';
                                    const isManual = p.method === 'MANUAL';
                                    const hasProof = Boolean(p.proof_url);

                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50/80 transition-all">
                                            <td className="py-3.5 px-4">
                                                <div>
                                                    <span className="font-mono font-bold text-gray-900">#{p.id}</span>
                                                    <p className="text-[10px] text-gray-400">
                                                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div>
                                                    <p className="font-bold text-gray-900">{clientName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">Invoice: {invoiceNo}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    isManual ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {p.method === 'MIDTRANS' ? 'Midtrans' : 'Manual'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-black text-gray-900 font-mono text-sm">
                                                {formatIDR(p.amount)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                                    p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    p.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {p.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : 
                                                     p.status === 'FAILED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {hasProof ? (
                                                    <button
                                                        onClick={() => setPreviewPayment(p)}
                                                        className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200 text-[11px] font-black inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Lihat Bukti</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400 italic">
                                                        {isManual ? 'Belum upload' : 'Otomatis Gateway'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {p.status === 'PENDING' && isManual && (
                                                        <>
                                                            <button
                                                                onClick={() => handleVerifyPayment(p.id, true)}
                                                                disabled={verifyingId === p.id}
                                                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                                title="Setujui Pembayaran"
                                                            >
                                                                {verifyingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                                <span>Setujui</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleVerifyPayment(p.id, false)}
                                                                disabled={verifyingId === p.id}
                                                                className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                                                                title="Tolak Pembayaran"
                                                            >
                                                                <XCircle className="w-3 h-3" />
                                                                <span>Tolak</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    {p.status === 'PENDING' && !isManual && (
                                                        <button
                                                            onClick={() => handleSyncPayment(p.id)}
                                                            disabled={syncingId === p.id}
                                                            className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-[10px] flex items-center gap-1 transition-all"
                                                            title="Sinkronisasi Status Midtrans"
                                                        >
                                                            <RefreshCw className={`w-3 h-3 ${syncingId === p.id ? 'animate-spin' : ''}`} />
                                                            <span>Sync Gateway</span>
                                                        </button>
                                                    )}

                                                    {p.status === 'PAID' && (
                                                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            Terverifikasi
                                                        </span>
                                                    )}

                                                    {p.status === 'FAILED' && (
                                                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                                            Dibatalkan
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">
                                            Tidak ada data transaksi pembayaran yang cocok
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        totalItems={filteredPayments.length}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            )}

            {/* TAB CONTENT: INCOMES */}
            {tab === 'incomes' && (
                <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Daftar Pemasukan & Invoice Lunas</h2>
                            <p className="text-xs text-gray-500 font-medium">Riwayat transaksi tagihan sertifikasi yang telah berhasil diverifikasi dan dilunasi</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    placeholder="Cari klien, invoice..."
                                    className="glass-input text-xs font-bold w-full pl-10 bg-gray-50/50 focus:bg-white" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">Tanggal Bayar</th>
                                    <th className="py-3 px-4">No. Invoice</th>
                                    <th className="py-3 px-4">Nama Klien / Usaha</th>
                                    <th className="py-3 px-4">Bidang Usaha</th>
                                    <th className="py-3 px-4">Jenis Layanan</th>
                                    <th className="py-3 px-4 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                {paginatedIncomes.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/80 transition-all">
                                        <td className="py-3.5 px-4 text-gray-600">
                                            {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(inv.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                                            INV-{inv.id}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            {inv.submission?.client?.business_name || 'Klien Sistem'}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500">
                                            {inv.submission?.business_type?.name || '-'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${inv.service_type === 'REGULER' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                                                {inv.service_type}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                                            {formatIDR(inv.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {paginatedIncomes.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Tidak ada transaksi yang cocok</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination totalItems={filteredIncomes.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {/* TAB CONTENT: COMMISSIONS */}
            {tab === 'commissions' && (
                <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Pencairan Komisi & Insentif Mitra</h2>
                            <p className="text-xs text-gray-500 font-medium">Validasi dan proses pencairan komisi Halal Advisor, Override, dan Referral</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                            >
                                <option value="">Semua Status</option>
                                <option value="PENDING">Pending (Belum Cair)</option>
                                <option value="PAID">Paid (Sudah Cair)</option>
                            </select>
                            <select 
                                value={typeFilter} 
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                            >
                                <option value="">Semua Tipe Komisi</option>
                                <option value="DIRECT_SALES">Insentif Pendampingan</option>
                                <option value="OVERRIDE">Override</option>
                                <option value="STRUCTURAL">Struktural</option>
                                <option value="REFERRAL">Referral</option>
                            </select>
                            <div className="relative w-full sm:w-56">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    placeholder="Cari penerima..."
                                    className="pl-8 pr-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none w-full" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">Nama Penerima</th>
                                    <th className="py-3 px-4">Tipe Komisi</th>
                                    <th className="py-3 px-4">Periode</th>
                                    <th className="py-3 px-4 text-right">Nominal Komisi</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-center">Aksi Keuangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                {paginatedCommissions.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/80 transition-all">
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            {c.user?.full_name || c.referrer?.full_name || '-'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {COMMISSION_LABELS[c.type] || c.type}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600 font-mono">{c.period}</td>
                                        <td className="py-3.5 px-4 text-right font-black text-gray-900">
                                            {formatIDR(c.amount)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {c.status === 'PENDING' && (
                                                    <button 
                                                        onClick={() => handlePayCommission(c.id)}
                                                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm"
                                                        title="Tandai Bayar"
                                                    >
                                                        <CreditCard className="w-3 h-3" />
                                                        <span>Bayar</span>
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDownloadSlip(c.id)}
                                                    className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all"
                                                    title="Download Slip PDF"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleSendWA(c.id)}
                                                    className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all"
                                                    title="Kirim Bukti via WhatsApp"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedCommissions.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Tidak ada data komisi yang cocok</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination totalItems={filteredCommissions.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {/* TAB CONTENT: PRICING */}
            {tab === 'pricing' && (
                <PricingTab submissions={submissions} formatIDR={formatIDR} />
            )}

            {/* PROOF OF PAYMENT PREVIEW MODAL */}
            {previewPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-150 space-y-5 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">
                                        Bukti Transfer Pembayaran
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        ID Transaksi #{previewPayment.id} • {previewPayment.invoices?.[0]?.submission?.client?.business_name || 'Klien'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewPayment(null)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Transaction Detail Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-150 shrink-0 text-xs">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Nominal</span>
                                <span className="font-black text-teal-700 font-mono text-sm">{formatIDR(previewPayment.amount)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Metode</span>
                                <span className="font-bold text-gray-800">{previewPayment.method}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Status</span>
                                <span className={`inline-block font-black text-[10px] px-2 py-0.5 rounded-full ${
                                    previewPayment.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                    previewPayment.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                }`}>
                                    {previewPayment.status}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Tanggal Masuk</span>
                                <span className="font-medium text-gray-700">{new Date(previewPayment.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Image Viewer Frame */}
                        <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 flex items-center justify-center p-2 min-h-[260px] border border-gray-200 relative group">
                            {previewPayment.proof_url ? (
                                <img
                                    src={getFullProofUrl(previewPayment.proof_url)}
                                    alt="Bukti Transfer"
                                    className="max-h-[50vh] object-contain rounded-lg transition-transform"
                                />
                            ) : (
                                <div className="text-gray-400 text-xs italic">Bukti transfer belum diunggah</div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 shrink-0">
                            {previewPayment.proof_url && (
                                <a
                                    href={getFullProofUrl(previewPayment.proof_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Buka Resolusi Penuh</span>
                                </a>
                            )}

                            <div className="flex items-center gap-2 ml-auto">
                                {previewPayment.status === 'PENDING' && previewPayment.method === 'MANUAL' && (
                                    <>
                                        <button
                                            onClick={() => handleVerifyPayment(previewPayment.id, false)}
                                            disabled={verifyingId === previewPayment.id}
                                            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            Tolak Pembayaran
                                        </button>
                                        <button
                                            onClick={() => handleVerifyPayment(previewPayment.id, true)}
                                            disabled={verifyingId === previewPayment.id}
                                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                                        >
                                            {verifyingId === previewPayment.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Setujui & Tandai Lunas</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setPreviewPayment(null)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TARGET SETTING MODAL */}
            {showTargetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Set Target Omset Keuangan</h3>
                                    <p className="text-xs text-gray-500 font-medium">Periode {month ? MONTH_NAMES[month - 1] : 'Tahunan'} {year}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveTarget} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Target Omset (IDR)
                                </label>
                                <input
                                    type="number"
                                    value={inputTargetOmset}
                                    onChange={(e) => setInputTargetOmset(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-black focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                                    placeholder="Contoh: 50000000"
                                    required
                                    min="1"
                                />
                                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                                    Target ini digunakan untuk menghitung rasio pencapaian finansial dan grafik performa bulanan.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowTargetModal(false)}
                                    className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all shadow-md shadow-teal-600/20 active:scale-95"
                                >
                                    Simpan Target
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Pricing Tab Component ──────────────────────────────────────────────

function PricingTab({ submissions, formatIDR }: { submissions: any[]; formatIDR: (n: number) => string }) {
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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
        <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Penetapan & Rincian Harga Reguler</h3>
                    <p className="text-xs text-gray-500 font-medium">Kelola estimasi biaya audit, pendampingan, dan penawaran SPH</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Cari ajuan reguler..."
                        className="pl-8 pr-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none w-full" 
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">Nama Usaha / Klien</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Harga Total</th>
                            <th className="py-3 px-4 text-center">Tanggal Masuk</th>
                            <th className="py-3 px-4 text-center">Aksi Penetapan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                        {paginated.map(sub => {
                            const hasPrice = sub.cost_detail && sub.cost_detail.total_amount > 0;
                            const isExpanded = expandedId === sub.id;
                            return (
                                <tr key={sub.id} className="hover:bg-gray-50/80 transition-all">
                                    <td className="py-3.5 px-4">
                                        <div>
                                            <p className="font-bold text-gray-900">{sub.business_name || '-'}</p>
                                            <p className="text-[11px] text-gray-400">Pemilik: {sub.owner_name || '-'}</p>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {hasPrice ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                ✅ Harga Ditentukan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                                ⏳ Belum Ditentukan
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-black text-teal-700 text-sm">
                                        {hasPrice ? formatIDR(sub.cost_detail.total_amount) : '-'}
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-gray-500">
                                        {new Date(sub.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                                            className={`px-3 py-1.5 font-bold rounded-xl text-xs transition-all ${
                                                isExpanded
                                                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                                                    : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                                            }`}
                                        >
                                            {isExpanded ? 'Tutup' : hasPrice ? 'Lihat Harga' : 'Set Harga'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {paginated.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-gray-400">Tidak ada ajuan reguler</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Expanded Submission Detail with Kalkulator */}
            {expandedId && (
                <div className="border border-teal-200 rounded-3xl bg-teal-50/30 p-6 mt-2">
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
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-teal-600 w-6 h-6" /></div>;
    }
    if (!submission) return <div className="p-4 text-center text-gray-500">Data tidak ditemukan</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-4">
            <h4 className="text-base font-black text-teal-900 px-2">Data & Rincian Harga Pengajuan</h4>

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

            <div className="border-t border-teal-200/60 pt-6 mt-6">
                <KalkulatorReguler
                    submissionId={submissionId}
                    onSaved={onClose}
                    dataSource={submission.data_source}
                />
            </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 py-3 bg-white border border-gray-150 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span>Tampilkan</span>
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs font-bold">
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>entri. Menampilkan {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)} dari {totalItems}</span>
            </div>
            <div className="flex items-center gap-1">
                <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1 text-xs font-bold rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
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
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${currentPage === page ? 'bg-teal-600 text-white shadow-sm' : 'border border-gray-200 hover:bg-gray-50'}`}>
                            {page}
                        </button>
                    );
                })}
                <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1 text-xs font-bold rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    Berikutnya
                </button>
            </div>
        </div>
    );
}
