import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    CreditCard, 
    ArrowRight, 
    Plus, 
    UserCheck, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Send, 
    Calculator, 
    FileText, 
    Target, 
    Sparkles, 
    Search, 
    MessageSquare, 
    Calendar, 
    DollarSign, 
    Award,
    Loader2,
    MapPin,
    RotateCcw,
    Check,
    Building2,
    Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { financeService } from '../../services/financeService';
import { submissionService } from '../../services/submissionService';
import type { Submission } from '../../types';

interface AdvisorUser {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    referral_code?: string;
    role?: string | { id: number; name: string };
    province_id?: number;
    province?: { id: number; name: string };
    regency_id?: number;
    regency?: { id: number; name: string };
    address?: string;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

export default function MarketingManagerDashboard() {
    const navigate = useNavigate();

    // Selected Period Filter
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

    // Data States
    const [loading, setLoading] = useState(true);
    const [bizDevData, setBizDevData] = useState<any>(null);
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [advisors, setAdvisors] = useState<AdvisorUser[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);

    // Action Queue Tab: 'UNASSIGNED' | 'READY_FORWARD' | 'UNPAID' | 'ALL'
    const [activeTab, setActiveTab] = useState<'UNASSIGNED' | 'READY_FORWARD' | 'UNPAID' | 'ALL'>('UNASSIGNED');
    const [searchTerm, setSearchTerm] = useState('');

    // Assign Advisor Modal State & Location Filters
    const [assignModal, setAssignModal] = useState<{ isOpen: boolean; submission: Submission | null }>({
        isOpen: false,
        submission: null
    });
    const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [advisorSearchQuery, setAdvisorSearchQuery] = useState('');
    const [filterProvinceId, setFilterProvinceId] = useState('');
    const [filterRegencyId, setFilterRegencyId] = useState('');
    const [regencies, setRegencies] = useState<any[]>([]);
    const [advisorRoleFilter, setAdvisorRoleFilter] = useState<'ALL' | 'HALAL_ADVISOR' | 'HALAL_MANAGER'>('ALL');

    // Forwarding to Operational Action State
    const [forwardingId, setForwardingId] = useState<string | null>(null);

    // Target Management Modal State
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [targetYear, setTargetYear] = useState(new Date().getFullYear());
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
    const [tRevenue, setTRevenue] = useState('');
    const [tSH, setTSH] = useState('');
    const [savingTarget, setSavingTarget] = useState(false);

    // Initial Load
    useEffect(() => {
        loadData();
    }, [selectedYear, selectedMonth]);

    // Load regencies dynamically when province filter changes
    useEffect(() => {
        if (filterProvinceId) {
            api.get(`/geography/regencies/${filterProvinceId}`)
                .then(res => setRegencies(res.data || []))
                .catch(() => setRegencies([]));
        } else {
            setRegencies([]);
            setFilterRegencyId('');
        }
    }, [filterProvinceId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const m = selectedMonth === 'all' ? undefined : selectedMonth;
            const [bdRes, subRes, advRes, provRes] = await Promise.all([
                financeService.getBizDevDashboard(m, selectedYear).catch(() => null),
                api.get('/submissions').catch(() => ({ data: [] })),
                api.get('/auth/facilitators').catch(() => ({ data: [] })),
                api.get('/geography/provinces').catch(() => ({ data: [] })),
            ]);

            setBizDevData(bdRes);
            setAllSubmissions(subRes.data || []);
            const rawAdvisors = Array.isArray(advRes.data) ? advRes.data : (advRes.data?.data || []);
            setAdvisors(rawAdvisors);
            setProvinces(provRes.data || []);
        } catch (err) {
            console.error("Gagal memuat data dashboard marketing", err);
            toast.error("Gagal memuat sebagian data dashboard");
        } finally {
            setLoading(false);
        }
    };

    // Helper: Determine if submission is considered paid
    const isSubmissionPaid = (sub: Submission) => {
        if (sub.service_type === 'SELF_DECLARE' && (sub.self_declare_type === 'GRATIS' || !sub.self_declare_type)) {
            return true;
        }
        if (sub.invoice?.status === 'PAID') return true;
        if (sub.invoices?.some(inv => inv.status === 'PAID')) return true;
        if (sub.payments?.some(p => p.status === 'PAID' || (p.status as string) === 'SETTLEMENT' || (p.status as string) === 'SUCCESS')) return true;
        if (sub.status === 'SH_TERBIT' || sub.status === 'SIDANG_FATWA' || sub.status === 'QC_OFFICER' || sub.status === 'DRAFTER' || sub.status === 'QC_REVIEW' || sub.status === 'SUBMITTED_TO_BPJPH') {
            return true;
        }
        return false;
    };

    // Queues
    const unassignedSubmissions = allSubmissions.filter(s => 
        !s.consultant_id && s.status !== 'SH_TERBIT' && s.status !== 'REJECTED'
    );

    const readyForwardSubmissions = allSubmissions.filter(s => 
        s.consultant_id && 
        isSubmissionPaid(s) && 
        (s.status === 'WAITING_PAYMENT' || s.status === 'DRAFT' || s.status === 'WAITING_ASSIGNMENT' || s.status === 'VERVAL_PENDAMPING')
    );

    const unpaidSubmissions = allSubmissions.filter(s => 
        !isSubmissionPaid(s) && 
        (s.status === 'WAITING_PAYMENT' || (s.service_type === 'REGULER' && (s.status === 'DRAFT' || s.status === 'WAITING_ASSIGNMENT')))
    );

    // Filter displayed items in current active tab
    const currentQueueItems = () => {
        let list: Submission[] = [];
        if (activeTab === 'UNASSIGNED') list = unassignedSubmissions;
        else if (activeTab === 'READY_FORWARD') list = readyForwardSubmissions;
        else if (activeTab === 'UNPAID') list = unpaidSubmissions;
        else list = allSubmissions;

        if (!searchTerm.trim()) return list;
        const q = searchTerm.toLowerCase();
        return list.filter(s => 
            s.client?.business_name?.toLowerCase().includes(q) ||
            s.client?.client_name?.toLowerCase().includes(q) ||
            s.client?.phone?.includes(q) ||
            s.tracking_number?.toLowerCase().includes(q)
        );
    };

    // Helper for Advisor Role Name
    const getAdvisorRoleName = (adv: AdvisorUser) => {
        if (typeof adv.role === 'string') return adv.role;
        if (adv.role?.name) return adv.role.name;
        return 'HALAL_ADVISOR';
    };

    // Filtered Advisors based on search and location
    const filteredAdvisors = advisors.filter(adv => {
        // 1. Text Search
        if (advisorSearchQuery.trim()) {
            const q = advisorSearchQuery.toLowerCase();
            const matchName = adv.full_name?.toLowerCase().includes(q);
            const matchCode = adv.referral_code?.toLowerCase().includes(q);
            const matchPhone = adv.phone?.includes(q);
            const matchEmail = adv.email?.toLowerCase().includes(q);
            const matchLoc = adv.province?.name?.toLowerCase().includes(q) || adv.regency?.name?.toLowerCase().includes(q) || adv.address?.toLowerCase().includes(q);
            if (!matchName && !matchCode && !matchPhone && !matchEmail && !matchLoc) {
                return false;
            }
        }

        // 2. Province Filter
        if (filterProvinceId) {
            if (String(adv.province_id) !== String(filterProvinceId)) {
                return false;
            }
        }

        // 3. Regency Filter
        if (filterRegencyId) {
            if (String(adv.regency_id) !== String(filterRegencyId)) {
                return false;
            }
        }

        // 4. Role Filter
        if (advisorRoleFilter !== 'ALL') {
            const rName = getAdvisorRoleName(adv);
            if (rName !== advisorRoleFilter) {
                return false;
            }
        }

        return true;
    });

    // Handlers
    const handleOpenAssign = (sub: Submission) => {
        setAssignModal({ isOpen: true, submission: sub });
        setSelectedAdvisorId(sub.consultant_id || '');
        setAdvisorSearchQuery('');
        setFilterProvinceId('');
        setFilterRegencyId('');
        setAdvisorRoleFilter('ALL');
    };

    const handleConfirmAssign = async () => {
        if (!assignModal.submission || !selectedAdvisorId) {
            toast.error("Silakan pilih Halal Advisor");
            return;
        }
        setAssigning(true);
        try {
            await api.post(`/submissions/${assignModal.submission.id}/assign-consultant`, {
                consultant_id: selectedAdvisorId
            });
            toast.success("Halal Advisor berhasil ditugaskan!");
            setAssignModal({ isOpen: false, submission: null });
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal menugaskan advisor");
        } finally {
            setAssigning(false);
        }
    };

    const handleForwardToOperational = async (sub: Submission) => {
        if (!confirm(`Teruskan pengajuan ${sub.client?.business_name || 'klien'} ke Manager Operasional?`)) {
            return;
        }
        setForwardingId(sub.id);
        try {
            await submissionService.forwardToOperational(sub.id);
            toast.success("Pengajuan berhasil diteruskan ke Manager Operasional!");
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal meneruskan ke operasional");
        } finally {
            setForwardingId(null);
        }
    };

    const handleSaveTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTarget(true);
        try {
            const period = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
            const payload: any = { period };
            if (tRevenue) payload.target_revenue = Number(tRevenue);
            if (tSH) payload.target_sh = Number(tSH);

            await financeService.setTarget(payload);
            toast.success("Target omset & SH berhasil diperbarui!");
            setShowTargetModal(false);
            setTRevenue('');
            setTSH('');
            loadData();
        } catch (err) {
            toast.error("Gagal menyimpan target");
        } finally {
            setSavingTarget(false);
        }
    };

    // Calculate Top Stats
    const totalRevenue = (bizDevData?.monthly_stats || []).reduce((acc: number, item: any) => acc + (item.revenue || 0), 0);
    const targetRevenue = bizDevData?.target?.target_revenue || 0;
    const revenueProgress = targetRevenue > 0 ? Math.min(100, Math.round((totalRevenue / targetRevenue) * 100)) : 0;

    const totalSH = bizDevData?.total_sh_terbit || 0;
    const targetSH = bizDevData?.target?.target_sh || 0;
    const shProgress = targetSH > 0 ? Math.min(100, Math.round((totalSH / targetSH) * 100)) : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-xs font-bold text-gray-500">Memuat dashboard pemasaran & bisnis...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 px-4 sm:px-6 py-6 pb-24">
            {/* Top Hero Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 backdrop-blur-md text-brand-300 text-xs font-black uppercase tracking-widest border border-brand-400/30">
                            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                            Marketing & Business Development Hub
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            Dashboard Marketing & Kemitraan
                        </h1>
                        <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
                            Pantau perolehan omset, pipeline penagihan klien, penunjukan Halal Advisor, serta percepatan forwarding pengajuan ke tim operasional.
                        </p>
                    </div>

                    {/* Quick CTA Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard/pengajuan')}
                            className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Input Klien Baru</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/sph')}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm"
                        >
                            <FileText className="w-4 h-4 text-amber-300" />
                            <span>Buat SPH</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/estimasi')}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm"
                        >
                            <Calculator className="w-4 h-4 text-emerald-300" />
                            <span>Kalkulator Tarif</span>
                        </button>
                        <button
                            onClick={() => setShowTargetModal(true)}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 active:scale-95 backdrop-blur-sm"
                        >
                            <Target className="w-4 h-4 text-purple-300" />
                            <span>Target Omset</span>
                        </button>
                    </div>
                </div>

                {/* Period Selector Bar */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-300">Periode Laporan:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                            <option value="all" className="text-gray-900 font-bold">Semua Bulan (Tahunan)</option>
                            {MONTH_NAMES.map((m, idx) => (
                                <option key={idx} value={idx + 1} className="text-gray-900 font-medium">{m}</option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y} className="text-gray-900 font-bold">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 5 Marketing Pipeline KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* KPI 1: Realisasi Omset */}
                <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Realisasi Omset</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl font-black text-gray-900">{formatIDR(totalRevenue)}</p>
                        {targetRevenue > 0 ? (
                            <div className="space-y-1.5 mt-2">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-gray-400">Target: {formatIDR(targetRevenue)}</span>
                                    <span className="text-emerald-600 font-black">{revenueProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${revenueProgress}%` }} />
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-400 mt-1">Target omset belum diset</p>
                        )}
                    </div>
                </div>

                {/* KPI 2: Butuh Tunjuk Advisor */}
                <div 
                    onClick={() => setActiveTab('UNASSIGNED')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        unassignedSubmissions.length > 0
                            ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Butuh Advisor</span>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                            unassignedSubmissions.length > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                            <UserCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{unassignedSubmissions.length}</p>
                        <p className="text-[10px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                            {unassignedSubmissions.length > 0 ? '⚠️ Butuh Penugasan' : 'Semua sudah ditunjuk'}
                        </p>
                    </div>
                </div>

                {/* KPI 3: Menunggu Pembayaran Klien */}
                <div 
                    onClick={() => setActiveTab('UNPAID')}
                    className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Menunggu Bayar</span>
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{unpaidSubmissions.length}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1">Pipeline Tagihan Aktif</p>
                    </div>
                </div>

                {/* KPI 4: Siap Diteruskan ke Operasional */}
                <div 
                    onClick={() => setActiveTab('READY_FORWARD')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        readyForwardSubmissions.length > 0
                            ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Siap ke Operasional</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                            <Send className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{readyForwardSubmissions.length}</p>
                        <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                            {readyForwardSubmissions.length > 0 ? '✨ Lunas, Siap Diproses' : 'Semua sudah diteruskan'}
                        </p>
                    </div>
                </div>

                {/* KPI 5: Total SH Terbit */}
                <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SH Terbit (Closing)</span>
                        <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{totalSH}</p>
                        {targetSH > 0 ? (
                            <p className="text-[10px] font-bold text-purple-600 mt-1">
                                Target: {targetSH} SH ({shProgress}%)
                            </p>
                        ) : (
                            <p className="text-[10px] text-gray-400 mt-1">Sertifikat berhasil terbit</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ACTION CENTER / MEJA KERJA MARKETING */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <span>Meja Kerja & Tindakan Cepat Marketing</span>
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">
                            Kelola pengajuan yang membutuhkan tindakan segera dari tim Marketing & BD
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all flex items-center gap-1.5"
                            title="Segarkan Data"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
                            <span className="hidden sm:inline">Segarkan</span>
                        </button>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama usaha / klien / no HP..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="glass-input text-xs font-bold w-full pl-10 bg-gray-50/50 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Queue Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
                    <button
                        onClick={() => setActiveTab('UNASSIGNED')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'UNASSIGNED'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Butuh Tunjuk Advisor</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'UNASSIGNED' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {unassignedSubmissions.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('READY_FORWARD')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'READY_FORWARD'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Siap Diteruskan ke Operasional (Lunas)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'READY_FORWARD' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                            {readyForwardSubmissions.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('UNPAID')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'UNPAID'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Menunggu Pembayaran</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'UNPAID' ? 'bg-white text-blue-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {unpaidSubmissions.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'ALL'
                                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span>Semua Ajuan</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === 'ALL' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                        }`}>
                            {allSubmissions.length}
                        </span>
                    </button>
                </div>

                {/* Queue Table */}
                <div className="overflow-x-auto">
                    {currentQueueItems().length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                            <p className="text-sm font-bold text-gray-700">Tidak ada pengajuan dalam antrean ini</p>
                            <p className="text-xs text-gray-400 font-medium">Semua pengajuan telah tertangani dengan baik.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">Nama Usaha / Klien</th>
                                    <th className="py-3 px-4">Layanan & Skala</th>
                                    <th className="py-3 px-4">Pendamping Halal (Advisor)</th>
                                    <th className="py-3 px-4">Status Pembayaran</th>
                                    <th className="py-3 px-4 text-right">Aksi Marketing</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                {currentQueueItems().map(sub => {
                                    const isPaid = isSubmissionPaid(sub);
                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50/80 transition-all">
                                            {/* Nama Usaha & Kontak */}
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-black text-gray-900 text-xs">
                                                        {sub.client?.business_name || 'Tanpa Nama Usaha'}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {sub.client?.client_name} • <span className="text-gray-400">{sub.client?.phone || '-'}</span>
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Layanan */}
                                            <td className="py-4 px-4">
                                                <div className="space-y-1">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200">
                                                        {sub.service_type || 'PENDING_CONSULTATION'}
                                                    </span>
                                                    {(sub as any).business_scale?.name ? (
                                                        <p className="text-[10px] text-gray-400 font-bold">{(sub as any).business_scale.name}</p>
                                                    ) : (sub as any).business_scale_id ? (
                                                        <p className="text-[10px] text-gray-400 font-bold">Skala #{sub.business_scale_id}</p>
                                                    ) : null}
                                                </div>
                                            </td>

                                            {/* Advisor */}
                                            <td className="py-4 px-4">
                                                {sub.consultant ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-[10px] border border-indigo-100">
                                                            {sub.consultant.full_name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{sub.consultant.full_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                                        <AlertCircle className="w-3 h-3" /> Belum Ditunjuk
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status Pembayaran */}
                                            <td className="py-4 px-4">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" /> Lunas / Gratis
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="w-3 h-3" /> Menunggu Bayar
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Quick Assign Advisor Button */}
                                                    {!sub.consultant_id && (
                                                        <button
                                                            onClick={() => handleOpenAssign(sub)}
                                                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" />
                                                            <span>Tunjuk Advisor</span>
                                                        </button>
                                                    )}

                                                    {/* Forward to Operational Button */}
                                                    {sub.consultant_id && isPaid && (sub.status === 'WAITING_PAYMENT' || sub.status === 'DRAFT' || sub.status === 'WAITING_ASSIGNMENT') && (
                                                        <button
                                                            onClick={() => handleForwardToOperational(sub)}
                                                            disabled={forwardingId === sub.id}
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                            <span>{forwardingId === sub.id ? 'Memproses...' : 'Teruskan ke Operasional'}</span>
                                                        </button>
                                                    )}

                                                    {/* WA Follow up if unpaid */}
                                                    {!isPaid && sub.client?.phone && (
                                                        <a
                                                            href={`https://wa.me/${sub.client.phone.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(sub.client.client_name || 'Bapak/Ibu')},%20kami%20dari%20HalalCore%20ingin%20mengonfirmasi%20kelanjutan%20pengajuan%20sertifikasi%20halal%20usaha%20${encodeURIComponent(sub.client.business_name || '')}.`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                                                            title="Follow up WhatsApp"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}

                                                    {/* View Detail Link */}
                                                    <button
                                                        onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-all flex items-center gap-1"
                                                    >
                                                        <span>Detail</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* LEADERBOARD & PERFORMA TIM ADVISOR */}
            {bizDevData?.leader_performance && bizDevData.leader_performance.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">Performa Jaringan Halal Advisor</h3>
                                <p className="text-xs text-gray-400 font-medium">Realisasi ajuan & sertifikat halal yang dicapai oleh tim kemitraan</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard/referrals')}
                            className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                        >
                            <span>Lihat Analitik Referral</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-4">Nama Advisor / Leader</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4 text-center">Total Ajuan</th>
                                    <th className="py-3 px-4 text-center">Dalam Proses</th>
                                    <th className="py-3 px-4 text-center">SH Terbit (Closing)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                {bizDevData.leader_performance.map((leader: any) => (
                                    <tr key={leader.user_id} className="hover:bg-gray-50/80 transition-all">
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            {leader.full_name}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                                                {leader.role_name}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                                            {leader.total_submissions}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                                            {leader.in_progress}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-black text-emerald-600">
                                            {leader.sh_terbit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL: ASSIGN HALAL ADVISOR DENGAN PENCARIAN LOKASI */}
            {assignModal.isOpen && assignModal.submission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Tunjuk Halal Advisor</h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Pilih pendamping halal yang sesuai dengan domisili atau preferensi usaha klien.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAssignModal({ isOpen: false, submission: null })}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Client Context Info Card */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-amber-50/40 border border-gray-200/80 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                                    <span className="font-black text-gray-900">
                                        {assignModal.submission.client?.business_name || 'Usaha Klien'}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600 font-bold">
                                        {assignModal.submission.client?.client_name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span className="truncate max-w-md">
                                        {assignModal.submission.client?.address || 'Alamat usaha belum diisi'}
                                    </span>
                                </div>
                            </div>

                            {assignModal.submission.client?.phone && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-[11px] shrink-0 shadow-sm">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{assignModal.submission.client.phone}</span>
                                </div>
                            )}
                        </div>

                        {/* Filter Toolbar */}
                        <div className="space-y-2.5 shrink-0">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama advisor, nomor registrasi (RF-...), nomor WhatsApp, kota..."
                                    value={advisorSearchQuery}
                                    onChange={e => setAdvisorSearchQuery(e.target.value)}
                                    className="glass-input text-xs font-bold w-full pl-10 bg-gray-50/60 focus:bg-white"
                                />
                                {advisorSearchQuery && (
                                    <button
                                        onClick={() => setAdvisorSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Location & Role Filter Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                {/* Provinsi */}
                                <div className="relative">
                                    <select
                                        value={filterProvinceId}
                                        onChange={e => setFilterProvinceId(e.target.value)}
                                        className="glass-input text-xs font-bold w-full bg-gray-50 focus:bg-white"
                                    >
                                        <option value="">Semua Provinsi</option>
                                        {provinces.map(prov => (
                                            <option key={prov.id} value={prov.id}>{prov.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Kabupaten/Kota */}
                                <div className="relative">
                                    <select
                                        value={filterRegencyId}
                                        onChange={e => setFilterRegencyId(e.target.value)}
                                        disabled={!filterProvinceId}
                                        className="glass-input text-xs font-bold w-full bg-gray-50 focus:bg-white disabled:opacity-50"
                                    >
                                        <option value="">Semua Kota/Kab</option>
                                        {regencies.map(reg => (
                                            <option key={reg.id} value={reg.id}>{reg.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Role Filter */}
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setAdvisorRoleFilter('ALL')}
                                        className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all ${
                                            advisorRoleFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdvisorRoleFilter('HALAL_ADVISOR')}
                                        className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all ${
                                            advisorRoleFilter === 'HALAL_ADVISOR' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        Advisor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdvisorRoleFilter('HALAL_MANAGER')}
                                        className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all ${
                                            advisorRoleFilter === 'HALAL_MANAGER' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        Manager
                                    </button>
                                </div>
                            </div>

                            {/* Active Filter Indicators & Reset */}
                            {(advisorSearchQuery || filterProvinceId || filterRegencyId || advisorRoleFilter !== 'ALL') && (
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] font-medium text-gray-500">
                                        Ditemukan <strong className="text-gray-900">{filteredAdvisors.length}</strong> advisor sesuai filter
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAdvisorSearchQuery('');
                                            setFilterProvinceId('');
                                            setFilterRegencyId('');
                                            setAdvisorRoleFilter('ALL');
                                        }}
                                        className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset Filter
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Advisor Scrollable Card List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-72 pr-1">
                            {filteredAdvisors.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
                                    <p className="text-xs font-bold text-gray-700">Tidak ada Halal Advisor yang sesuai dengan filter</p>
                                    <p className="text-[11px] text-gray-400 font-medium">Coba ganti kata kunci pencarian atau ubah filter lokasi provinsi/kota.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAdvisorSearchQuery('');
                                            setFilterProvinceId('');
                                            setFilterRegencyId('');
                                            setAdvisorRoleFilter('ALL');
                                        }}
                                        className="mt-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Tampilkan Semua Advisor ({advisors.length})
                                    </button>
                                </div>
                            ) : (
                                filteredAdvisors.map(adv => {
                                    const isSelected = selectedAdvisorId === adv.id;
                                    const roleStr = getAdvisorRoleName(adv);
                                    const locationStr = [adv.regency?.name, adv.province?.name].filter(Boolean).join(', ') || adv.address || 'Lokasi belum diset';

                                    return (
                                        <div
                                            key={adv.id}
                                            onClick={() => setSelectedAdvisorId(adv.id)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                                isSelected
                                                    ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-brand-300 hover:bg-gray-50/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Selection Indicator Circle */}
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                                    isSelected
                                                        ? 'bg-amber-500 border-amber-500 text-white'
                                                        : 'border-gray-300 bg-white'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>

                                                {/* Avatar */}
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-100 shrink-0">
                                                    {adv.full_name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Details */}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-xs font-black text-gray-900 truncate">
                                                            {adv.full_name}
                                                        </p>
                                                        {adv.referral_code && (
                                                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black font-mono">
                                                                {adv.referral_code}
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                                            roleStr === 'HALAL_MANAGER'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-brand-50 text-brand-700'
                                                        }`}>
                                                            {roleStr.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1 flex-wrap">
                                                        <span className="flex items-center gap-1 font-medium text-gray-600">
                                                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                                            <span className="truncate">{locationStr}</span>
                                                        </span>
                                                        {adv.phone && (
                                                            <span className="text-gray-400 font-medium">
                                                                • {adv.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <span className="text-[10px] font-black text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg shrink-0">
                                                    Dipilih
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 shrink-0">
                            <p className="text-[11px] text-gray-400 font-medium">
                                Total <strong className="text-gray-700">{advisors.length}</strong> advisor terdaftar dalam sistem
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignModal({ isOpen: false, submission: null })}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmAssign}
                                    disabled={assigning || !selectedAdvisorId}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    {assigning ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Menugaskan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Konfirmasi Penugasan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SET TARGET OMSET & SH */}
            {showTargetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
                    <form onSubmit={handleSaveTarget} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">Kelola Target Marketing</h3>
                                <p className="text-xs text-gray-500 font-medium">Tentukan target omset & closing bulanan</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700">Bulan</label>
                                    <select
                                        value={targetMonth}
                                        onChange={e => setTargetMonth(Number(e.target.value))}
                                        className="glass-input text-xs font-bold w-full mt-1"
                                    >
                                        {MONTH_NAMES.map((m, idx) => (
                                            <option key={idx} value={idx + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700">Tahun</label>
                                    <input
                                        type="number"
                                        value={targetYear}
                                        onChange={e => setTargetYear(Number(e.target.value))}
                                        className="glass-input text-xs font-bold w-full mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700">Target Revenue / Omset (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="Contoh: 50000000"
                                    value={tRevenue}
                                    onChange={e => setTRevenue(e.target.value)}
                                    className="glass-input text-xs font-bold w-full mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700">Target Sertifikat Halal Terbit (Unit)</label>
                                <input
                                    type="number"
                                    placeholder="Contoh: 20"
                                    value={tSH}
                                    onChange={e => setTSH(e.target.value)}
                                    className="glass-input text-xs font-bold w-full mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowTargetModal(false)}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={savingTarget}
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 disabled:opacity-50"
                            >
                                {savingTarget ? 'Menyimpan...' : 'Simpan Target'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
