import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    CreditCard, 
    Send, 
    UserPlus, 
    ArrowRight, 
    RefreshCw, 
    Calendar, 
    ExternalLink, 
    Loader2,
    Briefcase
} from 'lucide-react';
import type { Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { AssignAgentModal } from '../../components/dashboard/agent-manager/AssignAgentModal';
import { formatServiceType, formatDate, maskPhone } from '../../utils/format';
import toast from 'react-hot-toast';

export const AgentManagerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    
    // Period filter
    const [period, setPeriod] = useState<'THIS_MONTH' | 'LAST_30_DAYS' | 'ALL'>('THIS_MONTH');
    
    // Table filter state
    const [queueFilter, setQueueFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
    const [search, setSearch] = useState<string>('');

    // Modal state
    const [selectedSubForAssign, setSelectedSubForAssign] = useState<Submission | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

    const fetchDashboardData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await submissionService.getAll();
            setSubmissions(data || []);
        } catch (error: any) {
            console.error('Failed to load dashboard data', error);
            toast.error('Gagal memuat data dashboard: ' + (error?.response?.data?.error || error.message));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Filter submissions based on period
    const periodSubmissions = useMemo(() => {
        if (period === 'ALL') return submissions;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return submissions.filter((s) => {
            if (!s.created_at) return true;
            const created = new Date(s.created_at);
            if (period === 'THIS_MONTH') return created >= startOfMonth;
            if (period === 'LAST_30_DAYS') return created >= thirtyDaysAgo;
            return true;
        });
    }, [submissions, period]);

    // Calculate 8 KPIs from Chapter 3 wireframe
    const kpis = useMemo(() => {
        const total = periodSubmissions.length;
        
        // Terbayar: has payment with PAID or status beyond WAITING_PAYMENT
        const paid = periodSubmissions.filter(s => {
            const hasPaidRecord = s.payments?.some(p => p.status === 'PAID');
            const statusPaid = s.status !== 'DRAFT' && s.status !== 'WAITING_ASSIGNMENT' && s.status !== 'WAITING_PAYMENT';
            return hasPaidRecord || statusPaid;
        }).length;

        // Data Lengkap: passed verval pendamping / review
        const dataComplete = periodSubmissions.filter(s => {
            return s.status === 'QC_OFFICER' || s.status === 'DRAFTER' || s.status === 'SUBMITTED_TO_BPJPH' || s.status === 'SIDANG_FATWA' || s.status === 'SH_TERBIT';
        }).length;

        // Dikirim Ops: with drafter, QC, or BPJPH
        const sentToOps = periodSubmissions.filter(s => {
            return s.status === 'QC_OFFICER' || s.status === 'DRAFTER' || s.status === 'QC_REVIEW' || s.status === 'SUBMITTED_TO_BPJPH';
        }).length;

        // Tanpa Agent: no consultant_id
        const unassigned = periodSubmissions.filter(s => !s.consultant_id).length;

        // Respons Klien: waiting client action (e.g. revision or review)
        const waitingClient = periodSubmissions.filter(s => {
            return s.status === 'REVIEW_SJPH_CLIENT' || s.status === 'REVISION';
        }).length;

        // Menunggu Pembayaran
        const waitingPayment = periodSubmissions.filter(s => s.status === 'WAITING_PAYMENT').length;

        // Terlambat SLA: deadline passed or created > 14 days ago without SH
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const overdueSLA = periodSubmissions.filter(s => {
            if (s.status === 'SH_TERBIT' || s.status === 'REJECTED') return false;
            if (s.target_deadline && new Date(s.target_deadline) < now) return true;
            if (s.created_at && new Date(s.created_at) < fourteenDaysAgo) return true;
            return false;
        }).length;

        return {
            total,
            paid,
            dataComplete,
            sentToOps,
            unassigned,
            waitingClient,
            waitingPayment,
            overdueSLA
        };
    }, [periodSubmissions]);

    // Filter queue table
    const displayQueue = useMemo(() => {
        return periodSubmissions.filter((sub) => {
            const clientName = sub.client?.business_name || sub.client?.client_name || '';
            const tracking = sub.tracking_number || '';
            const agentName = sub.consultant?.full_name || '';
            const matchSearch =
                search === '' ||
                clientName.toLowerCase().includes(search.toLowerCase()) ||
                tracking.toLowerCase().includes(search.toLowerCase()) ||
                agentName.toLowerCase().includes(search.toLowerCase());

            let matchQueue = true;
            if (queueFilter === 'UNASSIGNED') {
                matchQueue = !sub.consultant_id;
            } else if (queueFilter === 'ASSIGNED') {
                matchQueue = !!sub.consultant_id;
            }

            return matchSearch && matchQueue;
        });
    }, [periodSubmissions, search, queueFilter]);

    const handleAssignSuccess = () => {
        toast.success('Agent berhasil ditetapkan!');
        fetchDashboardData(true);
    };

    const getStatusText = (sub: Submission) => {
        if (!sub.consultant_id) return 'Menunggu agent';
        if (sub.status === 'REVIEW_SJPH_CLIENT') return 'Menunggu klien';
        if (sub.status === 'WAITING_PAYMENT') return 'Pembayaran';
        if (sub.status === 'VERVAL_PENDAMPING') return 'Verval agent';
        if (sub.status === 'SH_TERBIT') return 'Selesai';
        return sub.status;
    };

    return (
        <div className="space-y-6">
            {/* Top Workspace Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <span>HALALCORE WORKSPACE</span>
                        <span>/</span>
                        <span className="text-brand-600">AGENT MANAGER</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        Dashboard Agent Manager
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        <span>
                            {period === 'THIS_MONTH'
                                ? 'Periode: Bulan Ini'
                                : period === 'LAST_30_DAYS'
                                ? 'Periode: 30 Hari Terakhir'
                                : 'Semua Periode'}
                        </span>
                        <span>•</span>
                        <span className="text-gray-400 font-medium">Monitoring Real-Time & Antrean Penetapan</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Period Switcher */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm text-xs font-bold">
                        <button
                            onClick={() => setPeriod('THIS_MONTH')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                period === 'THIS_MONTH' ? 'bg-brand-50 text-brand-700 font-black' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Bulan Ini
                        </button>
                        <button
                            onClick={() => setPeriod('LAST_30_DAYS')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                period === 'LAST_30_DAYS' ? 'bg-brand-50 text-brand-700 font-black' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            30 Hari
                        </button>
                        <button
                            onClick={() => setPeriod('ALL')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                period === 'ALL' ? 'bg-brand-50 text-brand-700 font-black' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Semua
                        </button>
                    </div>

                    <button
                        onClick={() => fetchDashboardData(true)}
                        disabled={refreshing || loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
                        <span>{refreshing ? 'Sinkron...' : 'Sinkron Data'}</span>
                    </button>
                </div>
            </div>

            {/* Quick Action Control Buttons (Chapter 3 wireframe) */}
            <div className="flex flex-wrap items-center gap-2.5">
                <button
                    onClick={() => {
                        setQueueFilter('UNASSIGNED');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        queueFilter === 'UNASSIGNED'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Buka Antrean Tanpa Agent ({kpis.unassigned})</span>
                </button>

                <button
                    onClick={() => navigate('/dashboard/agent-submissions')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <span>Buka Semua Pengajuan</span>
                </button>

                <button
                    onClick={() => navigate('/dashboard/estimasi')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                    <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                    <span>Estimasi Tarif Reguler</span>
                </button>

                <button
                    onClick={() => {
                        setQueueFilter('ALL');
                        setSearch('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 ml-auto"
                >
                    <span>Reset Filter</span>
                </button>
            </div>

            {/* 8 KPI Cards (Chapter 3 wireframe) */}
            <div className="space-y-3">
                {/* Row 1: Pipeline & Funnel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* 1. Pengajuan Baru */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase">PENGAJUAN BARU</span>
                            <div className="w-7 h-7 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-gray-900 tracking-tight">{kpis.total}</div>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">Dalam periode ini</p>
                    </div>

                    {/* 2. Terbayar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700">TERBAYAR</span>
                            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-800 tracking-tight">{kpis.paid}</div>
                        <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                            {kpis.total > 0 ? `${Math.round((kpis.paid / kpis.total) * 100)}% dari total` : '-'}
                        </p>
                    </div>

                    {/* 3. Data Lengkap */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-blue-700">DATA LENGKAP</span>
                            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-blue-800 tracking-tight">{kpis.dataComplete}</div>
                        <p className="text-[11px] text-blue-600 mt-1 font-medium">Lolos verifikasi awal</p>
                    </div>

                    {/* 4. Dikirim Ops */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-indigo-700">DIKIRIM KE OPS</span>
                            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Send className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-indigo-800 tracking-tight">{kpis.sentToOps}</div>
                        <p className="text-[11px] text-indigo-600 mt-1 font-medium">Drafter / QC / BPJPH</p>
                    </div>
                </div>

                {/* Row 2: Perhatian & SLA */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* 5. Tanpa Agent */}
                    <div 
                        onClick={() => setQueueFilter('UNASSIGNED')}
                        className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
                            kpis.unassigned > 0
                                ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                                : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-amber-800">TANPA AGENT</span>
                            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                !
                            </div>
                        </div>
                        <div className="text-3xl font-black text-amber-900 tracking-tight">{kpis.unassigned}</div>
                        <p className="text-[11px] text-amber-700 mt-1 font-bold">Butuh assignment</p>
                    </div>

                    {/* 6. Respons Klien */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm group hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-gray-700">RESPONS KLIEN</span>
                            <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-gray-800 tracking-tight">{kpis.waitingClient}</div>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">Revisi / review draft</p>
                    </div>

                    {/* 7. Menunggu Pembayaran */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm group hover:border-purple-200 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-purple-700">MENUNGGU PEMBAYARAN</span>
                            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-purple-800 tracking-tight">{kpis.waitingPayment}</div>
                        <p className="text-[11px] text-purple-600 mt-1 font-medium">Menunggu invoice dilunasi</p>
                    </div>

                    {/* 8. Terlambat SLA */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm group hover:border-red-200 transition-all">
                        <div className="flex items-center justify-between text-gray-500 mb-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-red-700">TERLAMBAT SLA</span>
                            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-red-800 tracking-tight">{kpis.overdueSLA}</div>
                        <p className="text-[11px] text-red-600 mt-1 font-medium">Melewati target waktu</p>
                    </div>
                </div>
            </div>

            {/* Embedded Queue Table: Tabel Antrean Utama (Chapter 3 wireframe) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <span>Antrean & Assignment Terkini</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                {displayQueue.length}
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Prioritas penetapan agent halal untuk pengajuan tanpa kode
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                        <button
                            onClick={() => setQueueFilter('ALL')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                                queueFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setQueueFilter('UNASSIGNED')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                                queueFilter === 'UNASSIGNED'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-amber-800 hover:bg-amber-50'
                            }`}
                        >
                            <span>Tanpa Kode HA</span>
                            {kpis.unassigned > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    queueFilter === 'UNASSIGNED' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900'
                                }`}>
                                    {kpis.unassigned}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setQueueFilter('ASSIGNED')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                                queueFilter === 'ASSIGNED' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Dengan Kode HA
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3 px-4">Klien / ID</th>
                                <th className="py-3 px-3">Tgl</th>
                                <th className="py-3 px-3">Kode HA</th>
                                <th className="py-3 px-4">Agent / Jenjang</th>
                                <th className="py-3 px-3">Layanan</th>
                                <th className="py-3 px-3">Status Utama</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                        Memuat antrean...
                                    </td>
                                </tr>
                            ) : displayQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        Tidak ada antrean dalam kategori ini.
                                    </td>
                                </tr>
                            ) : (
                                displayQueue.slice(0, 10).map((sub) => {
                                    const clientName = sub.client?.business_name || sub.client?.client_name || 'Klien Halal';
                                    const trackingCode = sub.tracking_number || sub.id.slice(0, 8).toUpperCase();
                                    const hasAgent = !!sub.consultant_id;
                                    const agentObj = sub.consultant;
                                    const agentRoleName = agentObj?.role ? (typeof agentObj.role === 'object' ? (agentObj.role as any).name : agentObj.role) : '';
                                    const agentLevel = agentRoleName === 'HALAL_DIRECTOR' ? 'HD' : agentRoleName === 'HALAL_MANAGER' ? 'HM' : 'HA';

                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                                            {/* Klien / ID */}
                                            <td className="py-3.5 px-4">
                                                <p className="font-bold text-gray-900">{clientName}</p>
                                                <p className="text-[11px] text-gray-500 font-mono">
                                                    {trackingCode} • {maskPhone(sub.client?.phone)}
                                                </p>
                                            </td>

                                            {/* Tgl */}
                                            <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">
                                                {formatDate(sub.created_at)}
                                            </td>

                                            {/* Kode HA */}
                                            <td className="py-3.5 px-3">
                                                {hasAgent && agentObj?.referral_code ? (
                                                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        {agentObj.referral_code}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                                                        Tanpa kode
                                                    </span>
                                                )}
                                            </td>

                                            {/* Agent / Jenjang */}
                                            <td className="py-3.5 px-4">
                                                {hasAgent && agentObj ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-gray-900">{agentObj.full_name}</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                                                            {agentLevel}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-700 font-medium italic">Belum ditetapkan</span>
                                                )}
                                            </td>

                                            {/* Layanan */}
                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span className="font-medium text-gray-800">
                                                    {formatServiceType(sub.service_type)}
                                                </span>
                                            </td>

                                            {/* Status Utama */}
                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                {!hasAgent ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                                        <Clock className="w-3 h-3" />
                                                        Menunggu agent
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
                                                        {getStatusText(sub)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {!hasAgent ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSubForAssign(sub);
                                                                setIsAssignModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
                                                        >
                                                            <UserPlus className="w-3.5 h-3.5" />
                                                            <span>Tetapkan</span>
                                                        </button>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-colors"
                                                    >
                                                        <span>Detail</span>
                                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {displayQueue.length > 10 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button
                            onClick={() => navigate('/dashboard/agent-submissions')}
                            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1 mx-auto"
                        >
                            <span>Lihat Semua {displayQueue.length} Pengajuan di Halaman Antrean</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Assign Agent Modal */}
            <AssignAgentModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedSubForAssign(null);
                }}
                submission={selectedSubForAssign}
                onSuccess={handleAssignSuccess}
                allSubmissions={submissions}
            />
        </div>
    );
};
