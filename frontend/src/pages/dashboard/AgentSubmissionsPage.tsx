import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    UserPlus, 
    Clock, 
    ExternalLink, 
    RefreshCw, 
    Loader2, 
    FileText
} from 'lucide-react';
import type { Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { AssignAgentModal } from '../../components/dashboard/agent-manager/AssignAgentModal';
import { formatServiceType, formatDate, maskPhone } from '../../utils/format';
import toast from 'react-hot-toast';

export const AgentSubmissionsPage: React.FC = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    
    // Filters
    const [search, setSearch] = useState<string>('');
    const [codeFilter, setCodeFilter] = useState<'ALL' | 'WITHOUT_CODE' | 'WITH_CODE'>('ALL');
    const [serviceFilter, setServiceFilter] = useState<string>('ALL');
    const [provinceFilter, setProvinceFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Modal state
    const [selectedSubmissionForAssign, setSelectedSubmissionForAssign] = useState<Submission | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

    const fetchSubmissions = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await submissionService.getAll();
            setSubmissions(data || []);
        } catch (error: any) {
            console.error('Failed to load submissions', error);
            toast.error('Gagal memuat daftar pengajuan: ' + (error?.response?.data?.error || error.message));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    // Summary counts
    const summary = useMemo(() => {
        const total = submissions.length;
        const withoutCode = submissions.filter(s => !s.consultant_id).length;
        const withCode = submissions.filter(s => !!s.consultant_id).length;
        const waitingPayment = submissions.filter(s => s.status === 'WAITING_PAYMENT').length;
        const completed = submissions.filter(s => s.status === 'SH_TERBIT').length;
        return { total, withoutCode, withCode, waitingPayment, completed };
    }, [submissions]);

    // Unique provinces for filter dropdown
    const availableProvinces = useMemo(() => {
        const provMap = new Map<string, string>();
        for (const sub of submissions) {
            const provName = sub.province?.name || (sub as any).cost_detail?.province?.name;
            if (provName) {
                provMap.set(provName, provName);
            }
        }
        return Array.from(provMap.keys()).sort();
    }, [submissions]);

    // Filtered list
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((sub) => {
            // Search filter
            const clientName = sub.client?.business_name || sub.client?.client_name || '';
            const nib = sub.client?.nib || '';
            const tracking = sub.tracking_number || '';
            const agentName = sub.consultant?.full_name || '';
            const searchLower = search.toLowerCase();

            const matchSearch =
                search === '' ||
                clientName.toLowerCase().includes(searchLower) ||
                nib.toLowerCase().includes(searchLower) ||
                tracking.toLowerCase().includes(searchLower) ||
                agentName.toLowerCase().includes(searchLower);

            // Code filter (Dengan Kode vs Tanpa Kode)
            let matchCode = true;
            if (codeFilter === 'WITHOUT_CODE') {
                matchCode = !sub.consultant_id;
            } else if (codeFilter === 'WITH_CODE') {
                matchCode = !!sub.consultant_id;
            }

            // Service filter
            const matchService =
                serviceFilter === 'ALL' ||
                (serviceFilter === 'REGULER' && (sub.service_type === 'REGULER' || sub.service_type === 'SELF_DECLARE_MANDIRI')) ||
                (serviceFilter === 'SELF_DECLARE' && sub.service_type === 'SELF_DECLARE');

            // Province filter
            const provName = sub.province?.name || (sub as any).cost_detail?.province?.name || '';
            const matchProvince = provinceFilter === 'ALL' || provName === provinceFilter;

            // Status filter
            let matchStatus = true;
            if (statusFilter !== 'ALL') {
                if (statusFilter === 'UNASSIGNED') {
                    matchStatus = !sub.consultant_id;
                } else {
                    matchStatus = sub.status === statusFilter;
                }
            }

            return matchSearch && matchCode && matchService && matchProvince && matchStatus;
        });
    }, [submissions, search, codeFilter, serviceFilter, provinceFilter, statusFilter]);

    const getStatusBadge = (sub: Submission) => {
        if (!sub.consultant_id) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <Clock className="w-3 h-3" />
                    Menunggu Agent
                </span>
            );
        }

        switch (sub.status) {
            case 'DRAFT':
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">Draf</span>;
            case 'VERVAL_PENDAMPING':
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Verval Pendamping</span>;
            case 'WAITING_PAYMENT':
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Menunggu Pembayaran</span>;
            case 'QC_OFFICER':
            case 'DRAFTER':
            case 'SUBMITTED_TO_BPJPH':
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Proses Operasional</span>;
            case 'SH_TERBIT':
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Selesai (SH Terbit)</span>;
            case 'REJECTED':
            case 'REVISION':
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Perlu Perhatian</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">{sub.status}</span>;
        }
    };

    const handleOpenAssignModal = (sub: Submission) => {
        setSelectedSubmissionForAssign(sub);
        setIsAssignModalOpen(true);
    };

    const handleAssignSuccess = () => {
        toast.success('Agent berhasil ditetapkan!');
        fetchSubmissions(true);
    };

    return (
        <div className="space-y-6">
            {/* Top Breadcrumb & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <span>HALALCORE WORKSPACE</span>
                        <span>/</span>
                        <span className="text-brand-600">AGENT MANAGER</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        Daftar Pengajuan & Antrean Agent
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Kelola antrean pengajuan dan assignment agent halal per wilayah (AC-01 s/d AC-03)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchSubmissions(true)}
                        disabled={refreshing || loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
                        <span>{refreshing ? 'Memperbarui...' : 'Sinkron Data'}</span>
                    </button>
                </div>
            </div>

            {/* Quick Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                    onClick={() => setCodeFilter('ALL')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        codeFilter === 'ALL'
                            ? 'bg-brand-50/80 border-brand-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-brand-200'
                    }`}
                >
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Total Pengajuan</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{summary.total}</p>
                </div>

                <div 
                    onClick={() => setCodeFilter('WITHOUT_CODE')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        codeFilter === 'WITHOUT_CODE'
                            ? 'bg-amber-50 border-amber-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-amber-700 uppercase">Tanpa Kode HA</p>
                        {summary.withoutCode > 0 && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        )}
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-black text-amber-800">{summary.withoutCode}</p>
                        <span className="text-[10px] font-bold text-amber-600">Menunggu Agent</span>
                    </div>
                </div>

                <div 
                    onClick={() => setCodeFilter('WITH_CODE')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        codeFilter === 'WITH_CODE'
                            ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-emerald-200'
                    }`}
                >
                    <p className="text-[11px] font-bold text-emerald-700 uppercase">Dengan Kode HA</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-black text-emerald-800">{summary.withCode}</p>
                        <span className="text-[10px] font-bold text-emerald-600">Direct Bind</span>
                    </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Menunggu Pembayaran</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-2xl font-black text-purple-700">{summary.waitingPayment}</p>
                        <span className="text-[10px] font-bold text-gray-400">Kasus</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                {/* Mode Selector Tabs (AC-03 requirement) */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                        <button
                            onClick={() => setCodeFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                codeFilter === 'ALL'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Semua ({summary.total})
                        </button>
                        <button
                            onClick={() => setCodeFilter('WITHOUT_CODE')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                codeFilter === 'WITHOUT_CODE'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-amber-800 hover:bg-amber-50'
                            }`}
                        >
                            <span>Tanpa Kode HA</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                codeFilter === 'WITHOUT_CODE' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900'
                            }`}>
                                {summary.withoutCode}
                            </span>
                        </button>
                        <button
                            onClick={() => setCodeFilter('WITH_CODE')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                codeFilter === 'WITH_CODE'
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Dengan Kode HA ({summary.withCode})
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                        Menampilkan <span className="font-bold text-gray-900">{filteredSubmissions.length}</span> pengajuan
                    </div>
                </div>

                {/* Sub Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nama usaha, NIB, tracking..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                    </div>

                    {/* Service Type */}
                    <div>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        >
                            <option value="ALL">Semua Layanan</option>
                            <option value="REGULER">Reguler</option>
                            <option value="SELF_DECLARE">Self Declare</option>
                        </select>
                    </div>

                    {/* Province */}
                    <div>
                        <select
                            value={provinceFilter}
                            onChange={(e) => setProvinceFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        >
                            <option value="ALL">Semua Wilayah</option>
                            {availableProvinces.map((prov) => (
                                <option key={prov} value={prov}>
                                    {prov}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="UNASSIGNED">Belum Ditetapkan</option>
                            <option value="VERVAL_PENDAMPING">Verval Pendamping</option>
                            <option value="WAITING_PAYMENT">Menunggu Bayar</option>
                            <option value="SH_TERBIT">SH Terbit (Selesai)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-3.5 px-4">Klien / ID</th>
                                <th className="py-3.5 px-3">Tgl</th>
                                <th className="py-3.5 px-3">Kode HA</th>
                                <th className="py-3.5 px-4">Agent / Jenjang</th>
                                <th className="py-3.5 px-3">Layanan</th>
                                <th className="py-3.5 px-3">Wilayah</th>
                                <th className="py-3.5 px-3">Status Utama</th>
                                <th className="py-3.5 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-400">
                                        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-brand-600" />
                                        Memuat data pengajuan...
                                    </td>
                                </tr>
                            ) : filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-500">
                                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        Tidak ada pengajuan yang sesuai dengan kriteria filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredSubmissions.map((sub) => {
                                    const clientName = sub.client?.business_name || sub.client?.client_name || 'Klien Halal';
                                    const trackingCode = sub.tracking_number || sub.id.slice(0, 8).toUpperCase();
                                    const maskedClientPhone = maskPhone(sub.client?.phone);
                                    const provName = sub.province?.name || (sub as any).cost_detail?.province?.name || '-';
                                    
                                    // Consultant info
                                    const hasAgent = !!sub.consultant_id;
                                    const agentObj = sub.consultant;
                                    const agentRoleName = agentObj?.role ? (typeof agentObj.role === 'object' ? (agentObj.role as any).name : agentObj.role) : '';
                                    const agentLevelCode = agentRoleName === 'HALAL_DIRECTOR' ? 'HD' : agentRoleName === 'HALAL_MANAGER' ? 'HM' : 'HA';

                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                                            {/* Klien / ID */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-900 text-xs">{clientName}</div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                                                    <span className="font-mono text-gray-600">{trackingCode}</span>
                                                    <span>•</span>
                                                    <span className="text-gray-400 font-mono">{maskedClientPhone}</span>
                                                </div>
                                            </td>

                                            {/* Tanggal */}
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
                                                            {agentLevelCode}
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

                                            {/* Wilayah */}
                                            <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">
                                                <span className="truncate max-w-[120px] inline-block" title={provName}>
                                                    {provName}
                                                </span>
                                            </td>

                                            {/* Status Utama */}
                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                {getStatusBadge(sub)}
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {!hasAgent ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAssignModal(sub)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
                                                        >
                                                            <UserPlus className="w-3.5 h-3.5" />
                                                            <span>Tetapkan</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAssignModal(sub)}
                                                            className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-xs transition-colors"
                                                            title="Ganti Agent (Exception)"
                                                        >
                                                            Ganti
                                                        </button>
                                                    )}

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
            </div>

            {/* Assign Agent Modal */}
            <AssignAgentModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedSubmissionForAssign(null);
                }}
                submission={selectedSubmissionForAssign}
                onSuccess={handleAssignSuccess}
                allSubmissions={submissions}
            />
        </div>
    );
};
