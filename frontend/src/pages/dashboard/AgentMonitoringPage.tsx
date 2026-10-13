import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    CreditCard, 
    FileCheck, 
    ShieldCheck, 
    Search, 
    RefreshCw, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    AlertTriangle, 
    ExternalLink, 
    Loader2, 
    X
} from 'lucide-react';
import type { Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { formatServiceType, formatDate, formatCurrency, maskPhone } from '../../utils/format';
import toast from 'react-hot-toast';

export const AgentMonitoringPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Tab state from URL query or default to 'PAYMENT'
    const currentTab = searchParams.get('tab') || 'PAYMENT';
    const setTab = (tab: 'PAYMENT' | 'COMPLETENESS' | 'OPERATIONS') => {
        setSearchParams({ tab });
    };

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    // Detail Modal State (Read-only per AC-09 & AC-10)
    const [selectedSubForDetail, setSelectedSubForDetail] = useState<Submission | null>(null);
    const [detailModalType, setDetailModalType] = useState<'PAYMENT' | 'COMPLETENESS' | 'OPS' | null>(null);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await submissionService.getAll();
            setSubmissions(data || []);
        } catch (error: any) {
            console.error('Failed to load submissions for monitoring', error);
            toast.error('Gagal memuat data monitoring: ' + (error?.response?.data?.error || error.message));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered by Search
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((sub) => {
            const clientName = sub.client?.business_name || sub.client?.client_name || '';
            const tracking = sub.tracking_number || '';
            const agentName = sub.consultant?.full_name || '';
            const searchLower = search.toLowerCase();

            return (
                search === '' ||
                clientName.toLowerCase().includes(searchLower) ||
                tracking.toLowerCase().includes(searchLower) ||
                agentName.toLowerCase().includes(searchLower)
            );
        });
    }, [submissions, search]);

    // ── 1. KPI Tab Pembayaran ──────────────────────────────────────────────
    const paymentKPIs = useMemo(() => {
        let waitingPayment = 0;
        let waitingFinance = 0;
        let paidCount = 0;
        let failedCount = 0;

        for (const sub of submissions) {
            const payments = sub.payments || [];
            const hasPaid = payments.some(p => p.status === 'PAID');
            const hasPending = payments.some(p => p.status === 'PENDING');
            const hasManual = payments.some(p => p.method === 'MANUAL' && p.status === 'PENDING');
            const hasFailed = payments.some(p => p.status === 'FAILED');

            if (sub.status === 'REJECTED' || hasFailed) {
                failedCount++;
            } else if (hasPaid || (sub.status !== 'DRAFT' && sub.status !== 'WAITING_ASSIGNMENT' && sub.status !== 'WAITING_PAYMENT')) {
                paidCount++;
            } else if (hasManual) {
                waitingFinance++;
            } else if (sub.status === 'WAITING_PAYMENT' || hasPending) {
                waitingPayment++;
            }
        }

        return { waitingPayment, waitingFinance, paidCount, failedCount };
    }, [submissions]);

    // ── 2. KPI Tab Kelengkapan Data ─────────────────────────────────────────
    const completenessKPIs = useMemo(() => {
        let notStarted = 0;
        let inProgress = 0;
        let incomplete = 0;
        let complete = 0;

        for (const sub of submissions) {
            if (sub.status === 'DRAFT' || sub.status === 'WAITING_ASSIGNMENT' || sub.status === 'WAITING_PAYMENT') {
                notStarted++;
            } else if (sub.status === 'VERVAL_PENDAMPING') {
                inProgress++;
            } else if (sub.status === 'REVISION' || sub.status === 'REVISION_ADVISOR' || sub.has_been_returned) {
                incomplete++;
            } else {
                complete++;
            }
        }

        return { notStarted, inProgress, incomplete, complete };
    }, [submissions]);

    // ── 3. KPI Tab Operasional ─────────────────────────────────────────────
    const operationsKPIs = useMemo(() => {
        let sentToOps = 0;
        let qcProcess = 0;
        let drafterProcess = 0;
        let finishedOps = 0;

        for (const sub of submissions) {
            if (sub.status === 'QC_OFFICER' || sub.status === 'QC_REVIEW') {
                sentToOps++;
                qcProcess++;
            } else if (sub.status === 'DRAFTER') {
                sentToOps++;
                drafterProcess++;
            } else if (sub.status === 'SUBMITTED_TO_BPJPH' || sub.status === 'SIDANG_FATWA' || sub.status === 'SH_TERBIT') {
                sentToOps++;
                finishedOps++;
            }
        }

        return { sentToOps, qcProcess, drafterProcess, finishedOps };
    }, [submissions]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <span>HALALCORE WORKSPACE</span>
                        <span>/</span>
                        <span className="text-brand-600">AGENT MANAGER</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        Monitoring Proses
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Pemantauan status lintas fungsi secara read-only (Pembayaran, Kelengkapan Dokumen, Operasional)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing || loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
                        <span>{refreshing ? 'Memperbarui...' : 'Sinkron Data'}</span>
                    </button>
                </div>
            </div>

            {/* Submenu / Tabs Switcher (Bab 6 Wireframe) */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <button
                    onClick={() => setTab('PAYMENT')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentTab === 'PAYMENT'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Pembayaran</span>
                </button>

                <button
                    onClick={() => setTab('COMPLETENESS')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentTab === 'COMPLETENESS'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <FileCheck className="w-4 h-4" />
                    <span>Kelengkapan Data</span>
                </button>

                <button
                    onClick={() => setTab('OPERATIONS')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentTab === 'OPERATIONS'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Operasional</span>
                </button>
            </div>

            {/* Search Input Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari nama usaha, ID tracking, atau nama agent..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    Total: <span className="font-bold text-gray-900">{filteredSubmissions.length}</span> pengajuan
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: PEMBAYARAN                                                    */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {currentTab === 'PAYMENT' && (
                <div className="space-y-6">
                    {/* 4 KPI Cards Pembayaran */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-purple-700">MENUNGGU BAYAR</span>
                            <div className="text-3xl font-black text-purple-900 mt-1">{paymentKPIs.waitingPayment}</div>
                            <p className="text-[11px] text-gray-500 mt-1">Invoice belum ditagih / unpaid</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-amber-800">VERIFIKASI FINANCE</span>
                            <div className="text-3xl font-black text-amber-900 mt-1">{paymentKPIs.waitingFinance}</div>
                            <p className="text-[11px] text-amber-700 mt-1">Transfer manual butuh verifikasi</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-emerald-800">TERBAYAR</span>
                            <div className="text-3xl font-black text-emerald-900 mt-1">{paymentKPIs.paidCount}</div>
                            <p className="text-[11px] text-emerald-700 mt-1">Lunas / callback tervalidasi</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-gray-600">GAGAL / TIDAK COCOK</span>
                            <div className="text-3xl font-black text-gray-800 mt-1">{paymentKPIs.failedCount}</div>
                            <p className="text-[11px] text-gray-400 mt-1">Pembayaran gagal atau kendala</p>
                        </div>
                    </div>

                    {/* Table Pembayaran (Bab 6 Wireframe) */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Klien</th>
                                        <th className="py-3 px-3">Metode</th>
                                        <th className="py-3 px-3">Invoice / Nominal</th>
                                        <th className="py-3 px-3">Status</th>
                                        <th className="py-3 px-4">Sumber Status</th>
                                        <th className="py-3 px-3">Update</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                                Memuat status pembayaran...
                                            </td>
                                        </tr>
                                    ) : filteredSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500">
                                                Tidak ada data pembayaran yang sesuai.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubmissions.map((sub) => {
                                            const clientName = sub.client?.business_name || sub.client?.client_name || 'Klien Halal';
                                            const trackingCode = sub.tracking_number || sub.id.slice(0, 8).toUpperCase();
                                            const latestPayment = (sub.payments && sub.payments.length > 0) ? sub.payments[sub.payments.length - 1] : null;
                                            const costTotal = (sub as any).cost_detail?.total_cost || sub.bpjph_amount || 0;

                                            const isPaid = latestPayment?.status === 'PAID' || sub.status === 'SH_TERBIT' || sub.status === 'QC_OFFICER';
                                            const isManualPending = latestPayment?.method === 'MANUAL' && latestPayment?.status === 'PENDING';
                                            const paymentMethod = latestPayment?.method === 'MAYAR' ? 'Mayar.id' : latestPayment?.method === 'MANUAL' ? 'Transfer Manual' : 'Online / VA';

                                            let statusBadge = (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                                                    Menunggu bayar
                                                </span>
                                            );
                                            let sourceStatus = 'Menunggu instruksi pembayaran';

                                            if (isPaid) {
                                                statusBadge = (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                        Terbayar
                                                    </span>
                                                );
                                                sourceStatus = latestPayment?.method === 'MAYAR' ? 'Callback tervalidasi' : 'Diverifikasi Finance';
                                            } else if (isManualPending) {
                                                statusBadge = (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                                        Menunggu verifikasi
                                                    </span>
                                                );
                                                sourceStatus = 'Belum diverifikasi Finance';
                                            }

                                            return (
                                                <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <p className="font-bold text-gray-900">{clientName}</p>
                                                        <p className="text-[11px] text-gray-500 font-mono">
                                                            {trackingCode} • {maskPhone(sub.client?.phone)}
                                                        </p>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-gray-100 text-gray-700">
                                                            {paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                                                        {costTotal > 0 ? formatCurrency(costTotal) : 'Sesuai Layanan'}
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        {statusBadge}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-gray-600">
                                                        <span className="text-[11px] font-medium">{sourceStatus}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">
                                                        {formatDate(latestPayment?.updated_at || sub.updated_at)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSubForDetail(sub);
                                                                setDetailModalType('PAYMENT');
                                                            }}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs ml-auto transition-colors"
                                                        >
                                                            <span>Lihat Detail</span>
                                                            <ExternalLink className="w-3 h-3 text-gray-400" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: KELENGKAPAN DATA                                              */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {currentTab === 'COMPLETENESS' && (
                <div className="space-y-6">
                    {/* 4 KPI Cards Kelengkapan Data */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-gray-500">BELUM MULAI</span>
                            <div className="text-3xl font-black text-gray-800 mt-1">{completenessKPIs.notStarted}</div>
                            <p className="text-[11px] text-gray-400 mt-1">Draf / belum verifikasi berkas</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-blue-800">SEDANG DILENGKAPI</span>
                            <div className="text-3xl font-black text-blue-900 mt-1">{completenessKPIs.inProgress}</div>
                            <p className="text-[11px] text-blue-700 mt-1">Pendamping sedang verval data</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-amber-800">DATA BELUM LENGKAP</span>
                            <div className="text-3xl font-black text-amber-900 mt-1">{completenessKPIs.incomplete}</div>
                            <p className="text-[11px] text-amber-700 mt-1">Ada revisi atau kekurangan dokumen</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-emerald-800">LENGKAP</span>
                            <div className="text-3xl font-black text-emerald-900 mt-1">{completenessKPIs.complete}</div>
                            <p className="text-[11px] text-emerald-700 mt-1">Semua dokumen siap handoff</p>
                        </div>
                    </div>

                    {/* Table Kelengkapan Data */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Klien & Layanan</th>
                                        <th className="py-3 px-3">Agent Halal</th>
                                        <th className="py-3 px-3">Status Kelengkapan</th>
                                        <th className="py-3 px-3">Jumlah Dokumen</th>
                                        <th className="py-3 px-4">Ringkasan Kendala</th>
                                        <th className="py-3 px-3">Update Terakhir</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                                Memuat ringkasan kelengkapan...
                                            </td>
                                        </tr>
                                    ) : filteredSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500">
                                                Tidak ada data kelengkapan yang sesuai.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubmissions.map((sub) => {
                                            const clientName = sub.client?.business_name || sub.client?.client_name || 'Klien Halal';
                                            const trackingCode = sub.tracking_number || sub.id.slice(0, 8).toUpperCase();
                                            const agentName = sub.consultant?.full_name || 'Belum Ditetapkan';
                                            const fileCount = sub.submission_files?.length || 0;
                                            const isComplete = sub.status !== 'DRAFT' && sub.status !== 'VERVAL_PENDAMPING' && sub.status !== 'REVISION';

                                            return (
                                                <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <p className="font-bold text-gray-900">{clientName}</p>
                                                        <p className="text-[11px] text-gray-500">
                                                            {formatServiceType(sub.service_type)} • <span className="font-mono">{trackingCode}</span>
                                                        </p>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="font-semibold text-gray-800">{agentName}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        {isComplete ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Lengkap
                                                            </span>
                                                        ) : sub.status === 'VERVAL_PENDAMPING' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                                                <Clock className="w-3 h-3" />
                                                                Sedang dilengkapi
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Data belum lengkap
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="font-mono font-bold text-gray-700">
                                                            {fileCount > 0 ? `${fileCount} Berkas Terunggah` : '0 Berkas'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-gray-600">
                                                        <span className="text-[11px] truncate max-w-[200px] inline-block">
                                                            {sub.reject_note || (sub.has_been_returned ? 'Pernah dikembalikan untuk perbaikan' : 'Tidak ada kendala aktif')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">
                                                        {formatDate(sub.updated_at)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSubForDetail(sub);
                                                                setDetailModalType('COMPLETENESS');
                                                            }}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs ml-auto transition-colors"
                                                        >
                                                            <span>Lihat Ringkasan</span>
                                                            <ExternalLink className="w-3 h-3 text-gray-400" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: OPERASIONAL                                                   */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {currentTab === 'OPERATIONS' && (
                <div className="space-y-6">
                    {/* 4 KPI Cards Operasional */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-gray-600">DIKIRIM KE OPS</span>
                            <div className="text-3xl font-black text-gray-900 mt-1">{operationsKPIs.sentToOps}</div>
                            <p className="text-[11px] text-gray-400 mt-1">Total ajuan di tim operasional</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-indigo-800">PROSES QC</span>
                            <div className="text-3xl font-black text-indigo-900 mt-1">{operationsKPIs.qcProcess}</div>
                            <p className="text-[11px] text-indigo-700 mt-1">Verifikasi berkas QC Officer</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-blue-800">PROSES DRAFTER</span>
                            <div className="text-3xl font-black text-blue-900 mt-1">{operationsKPIs.drafterProcess}</div>
                            <p className="text-[11px] text-blue-700 mt-1">Penyusunan SJPH oleh HDO</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-emerald-800">SELESAI OPS / BPJPH</span>
                            <div className="text-3xl font-black text-emerald-900 mt-1">{operationsKPIs.finishedOps}</div>
                            <p className="text-[11px] text-emerald-700 mt-1">Diajukan ke BPJPH / SH Terbit</p>
                        </div>
                    </div>

                    {/* Table Operasional */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Klien & No. Tracking</th>
                                        <th className="py-3 px-3">Petugas Ops</th>
                                        <th className="py-3 px-3">Waktu Handoff</th>
                                        <th className="py-3 px-3">Status Pemrosesan Ops</th>
                                        <th className="py-3 px-3">Target SLA</th>
                                        <th className="py-3 px-3">Update Terakhir</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                                Memuat status operasional...
                                            </td>
                                        </tr>
                                    ) : filteredSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500">
                                                Tidak ada data operasional yang sesuai.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubmissions.map((sub) => {
                                            const clientName = sub.client?.business_name || sub.client?.client_name || 'Klien Halal';
                                            const trackingCode = sub.tracking_number || sub.id.slice(0, 8).toUpperCase();
                                            const drafterName = sub.assigned_drafter?.full_name || 'Belum Ditugaskan';

                                            let opsStatus = 'Menunggu serah terima';
                                            if (sub.status === 'QC_OFFICER' || sub.status === 'QC_REVIEW') opsStatus = 'Pemeriksaan QC Officer';
                                            else if (sub.status === 'DRAFTER') opsStatus = 'Penyusunan SJPH (Drafter)';
                                            else if (sub.status === 'SUBMITTED_TO_BPJPH') opsStatus = 'Terkirim ke BPJPH';
                                            else if (sub.status === 'SIDANG_FATWA') opsStatus = 'Sidang Fatwa MUI';
                                            else if (sub.status === 'SH_TERBIT') opsStatus = 'Selesai (SH Terbit)';

                                            return (
                                                <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <p className="font-bold text-gray-900">{clientName}</p>
                                                        <p className="text-[11px] text-gray-500 font-mono">{trackingCode}</p>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="font-medium text-gray-800">{drafterName}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">
                                                        {formatDate(sub.created_at)}
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                            {opsStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 whitespace-nowrap">
                                                        {sub.target_deadline && new Date(sub.target_deadline) < new Date() ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Lewat SLA
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                On Track
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">
                                                        {formatDate(sub.updated_at)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSubForDetail(sub);
                                                                setDetailModalType('OPS');
                                                            }}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs ml-auto transition-colors"
                                                        >
                                                            <span>Buka Detail</span>
                                                            <ExternalLink className="w-3 h-3 text-gray-400" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Read-Only Modal Detail (Bab 4 & AC-09/AC-10 compliant) */}
            {selectedSubForDetail && detailModalType && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">
                                    {detailModalType === 'PAYMENT' && 'Ringkasan Monitoring Pembayaran'}
                                    {detailModalType === 'COMPLETENESS' && 'Ringkasan Kelengkapan Dokumen'}
                                    {detailModalType === 'OPS' && 'Ringkasan Serah Terima Operasional'}
                                </h3>
                                <p className="text-xs text-brand-200 mt-0.5">
                                    Akses Read-Only • Agent Manager Workspace
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedSubForDetail(null);
                                    setDetailModalType(null);
                                }}
                                className="text-brand-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nama Usaha:</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedSubForDetail.client?.business_name || selectedSubForDetail.client?.client_name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">No. Tracking:</span>
                                    <span className="font-mono font-bold text-gray-800">
                                        {selectedSubForDetail.tracking_number || selectedSubForDetail.id.slice(0, 8)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Layanan:</span>
                                    <span className="font-medium text-gray-800">
                                        {formatServiceType(selectedSubForDetail.service_type)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Kontak (Dimasking):</span>
                                    <span className="font-mono text-gray-700">
                                        {maskPhone(selectedSubForDetail.client?.phone)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment specific detail */}
                            {detailModalType === 'PAYMENT' && (
                                <div className="space-y-2">
                                    <p className="font-bold text-gray-900">Riwayat Transaksi:</p>
                                    {selectedSubForDetail.payments && selectedSubForDetail.payments.length > 0 ? (
                                        selectedSubForDetail.payments.map((p, idx) => (
                                            <div key={idx} className="p-3 border rounded-xl flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-gray-800">{p.method}</span>
                                                    <span className="text-gray-400 text-[11px] block">{formatDate(p.created_at)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-brand-700">{formatCurrency(p.amount)}</span>
                                                    <span className={`block text-[10px] font-bold ${
                                                        p.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                                                    }`}>{p.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">Belum ada catatan pembayaran.</p>
                                    )}
                                </div>
                            )}

                            {/* Completeness specific detail */}
                            {detailModalType === 'COMPLETENESS' && (
                                <div className="space-y-2">
                                    <p className="font-bold text-gray-900">Catatan Dokumen:</p>
                                    <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-gray-700">
                                        {selectedSubForDetail.reject_note || 'Tidak ada catatan penolakan atau revisi aktif.'}
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-2">
                                        * Sesuai ketentuan, dokumen teknis dan SJPH hanya dapat diubah oleh Halal Advisor terkait.
                                    </p>
                                </div>
                            )}

                            {/* Operations specific detail */}
                            {detailModalType === 'OPS' && (
                                <div className="space-y-2">
                                    <p className="font-bold text-gray-900">Petugas Operasional:</p>
                                    <div className="p-3 bg-gray-50 border rounded-xl space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Drafter:</span>
                                            <span className="font-bold">{selectedSubForDetail.assigned_drafter?.full_name || 'Belum Ditugaskan'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Status Terakhir:</span>
                                            <span className="font-bold text-indigo-700">{selectedSubForDetail.status}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-2">
                                        * Agent Manager hanya memantau progres tanpa kewenangan memutasi status operasional.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button
                                onClick={() => navigate(`/dashboard/submissions/${selectedSubForDetail.id}`)}
                                className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
                            >
                                <span>Buka Halaman Detail Penuh</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedSubForDetail(null);
                                    setDetailModalType(null);
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
