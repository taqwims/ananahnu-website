import React, { useState, useEffect, useMemo } from 'react';
import { 
    MapPin, 
    Briefcase, 
    CheckCircle2, 
    AlertTriangle, 
    AlertCircle, 
    Search, 
    RefreshCw, 
    Loader2, 
    X, 
    ChevronRight 
} from 'lucide-react';
import type { Submission, User } from '../../types';
import { submissionService } from '../../services/submissionService';
import { geographyService } from '../../services/geographyService';
import toast from 'react-hot-toast';

// 38 Official Provinces of Indonesia
const ALL_INDONESIA_PROVINCES = [
    'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
    'Jambi', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung',
    'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
    'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
    'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
    'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
    'Maluku', 'Maluku Utara',
    'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'
];

export const AgentDistributionPage: React.FC = () => {
    const [tab, setTab] = useState<'PROVINCE' | 'WORKLOAD'>('PROVINCE');
    const [consultants, setConsultants] = useState<User[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [dbProvinces, setDbProvinces] = useState<{ id: number; name: string }[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    
    // Filters
    const [search, setSearch] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Modals
    const [viewingProvinceAgents, setViewingProvinceAgents] = useState<{ name: string; id?: number } | null>(null);
    const [assignCoverageProvince, setAssignCoverageProvince] = useState<{ name: string; id?: number } | null>(null);
    const [selectedAgentForCoverage, setSelectedAgentForCoverage] = useState<string>('');
    const [savingCoverage, setSavingCoverage] = useState<boolean>(false);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);
        try {
            const [consData, subsData, provData] = await Promise.all([
                submissionService.getConsultants(),
                submissionService.getAll(),
                geographyService.getProvinces().catch(() => [])
            ]);
            setConsultants(consData || []);
            setSubmissions(subsData || []);
            setDbProvinces(provData || []);
        } catch (error: any) {
            console.error('Failed to load distribution data', error);
            toast.error('Gagal memuat data distribusi agent: ' + (error?.response?.data?.error || error.message));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Active cases map per consultant
    const consultantWorkload = useMemo(() => {
        const workload: Record<string, {
            active: number;
            waitingPayment: number;
            incomplete: number;
            overdue: number;
            completed: number;
        }> = {};

        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        for (const c of consultants) {
            workload[c.id] = { active: 0, waitingPayment: 0, incomplete: 0, overdue: 0, completed: 0 };
        }

        for (const sub of submissions) {
            if (!sub.consultant_id) continue;
            if (!workload[sub.consultant_id]) {
                workload[sub.consultant_id] = { active: 0, waitingPayment: 0, incomplete: 0, overdue: 0, completed: 0 };
            }
            const record = workload[sub.consultant_id];

            if (sub.status === 'SH_TERBIT') {
                record.completed++;
            } else if (sub.status !== 'REJECTED') {
                record.active++;
                if (sub.status === 'WAITING_PAYMENT') record.waitingPayment++;
                if (sub.status === 'REVISION' || sub.status === 'REVISION_ADVISOR' || sub.has_been_returned) record.incomplete++;
                if ((sub.target_deadline && new Date(sub.target_deadline) < now) || (sub.created_at && new Date(sub.created_at) < fourteenDaysAgo)) {
                    record.overdue++;
                }
            }
        }

        return workload;
    }, [consultants, submissions]);

    // Active cases map per province name
    const provinceActiveCases = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const sub of submissions) {
            if (sub.status === 'SH_TERBIT' || sub.status === 'REJECTED') continue;
            const provName = sub.province?.name || (sub as any).cost_detail?.province?.name;
            if (provName) {
                counts[provName] = (counts[provName] || 0) + 1;
            }
        }
        return counts;
    }, [submissions]);

    // Build 38 Provinces Matrix
    const provinceMatrix = useMemo(() => {
        // Map db provinces to match by name
        const dbMap = new Map<string, number>();
        for (const p of dbProvinces) {
            dbMap.set(p.name.toLowerCase().trim(), p.id);
        }

        return ALL_INDONESIA_PROVINCES.map((provName) => {
            const dbId = dbMap.get(provName.toLowerCase().trim());
            
            // Find agents in this province
            const provAgents = consultants.filter((c) => {
                const cProvName = (c as any).province?.name;
                if (cProvName && cProvName.toLowerCase().trim() === provName.toLowerCase().trim()) return true;
                if (c.province_id && dbId && c.province_id === dbId) return true;
                return false;
            });

            let haCount = 0;
            let hmCount = 0;
            let hdCount = 0;

            for (const a of provAgents) {
                const roleName = typeof a.role === 'object' ? (a.role as any)?.name : a.role;
                if (roleName === 'HALAL_DIRECTOR') hdCount++;
                else if (roleName === 'HALAL_MANAGER') hmCount++;
                else haCount++;
            }

            const totalAgents = haCount + hmCount + hdCount;
            const activeCases = provinceActiveCases[provName] || 0;

            // Coverage status determination
            let status: 'SESUAI_TARGET' | 'PERLU_PENAMBAHAN' | 'BELUM_ADA' | 'TARGET_BELUM_DIATUR' = 'TARGET_BELUM_DIATUR';
            if (totalAgents === 0) {
                status = 'BELUM_ADA';
            } else if (totalAgents >= 3) {
                status = 'SESUAI_TARGET';
            } else if (totalAgents < 3) {
                status = 'PERLU_PENAMBAHAN';
            }

            return {
                name: provName,
                dbId,
                haCount,
                hmCount,
                hdCount,
                totalAgents,
                activeCases,
                status,
                agents: provAgents
            };
        });
    }, [consultants, dbProvinces, provinceActiveCases]);

    // KPI Top Counts (Bab 7 Wireframe)
    const kpis = useMemo(() => {
        const totalAgents = consultants.length;
        const totalActiveCases = submissions.filter(s => s.status !== 'SH_TERBIT' && s.status !== 'REJECTED').length;
        const targetMetCount = provinceMatrix.filter(p => p.status === 'SESUAI_TARGET').length;
        const needAdditionCount = provinceMatrix.filter(p => p.status === 'PERLU_PENAMBAHAN' || p.status === 'BELUM_ADA').length;

        return {
            totalAgents,
            totalActiveCases,
            targetMetCount,
            needAdditionCount
        };
    }, [consultants, submissions, provinceMatrix]);

    // Filtered Province Matrix
    const filteredProvinces = useMemo(() => {
        return provinceMatrix.filter((p) => {
            const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
            let matchStatus = true;
            if (statusFilter === 'SESUAI') matchStatus = p.status === 'SESUAI_TARGET';
            else if (statusFilter === 'PENAMBAHAN') matchStatus = p.status === 'PERLU_PENAMBAHAN';
            else if (statusFilter === 'BELUM_ADA') matchStatus = p.status === 'BELUM_ADA';
            return matchSearch && matchStatus;
        });
    }, [provinceMatrix, search, statusFilter]);

    // Filtered Consultants (Workload Tab)
    const filteredConsultants = useMemo(() => {
        return consultants.filter((c) => {
            const matchSearch =
                search === '' ||
                c.full_name.toLowerCase().includes(search.toLowerCase()) ||
                (c.referral_code && c.referral_code.toLowerCase().includes(search.toLowerCase()));

            const roleStr = typeof c.role === 'object' ? (c.role as any)?.name : c.role;
            const matchRole =
                roleFilter === 'ALL' ||
                (roleFilter === 'HA' && roleStr === 'HALAL_ADVISOR') ||
                (roleFilter === 'HM' && roleStr === 'HALAL_MANAGER') ||
                (roleFilter === 'HD' && roleStr === 'HALAL_DIRECTOR');

            return matchSearch && matchRole;
        });
    }, [consultants, search, roleFilter]);

    // Handle Coverage Reassignment (manage_agent_coverage)
    const handleSaveCoverage = async () => {
        if (!selectedAgentForCoverage || !assignCoverageProvince) return;
        setSavingCoverage(true);
        try {
            let provId = assignCoverageProvince.id;
            if (!provId) {
                // If province not in db yet, create it
                const res = await geographyService.createProvince(assignCoverageProvince.name);
                provId = res?.data?.id || (res as any)?.id;
            }

            await submissionService.updateAgentCoverage(selectedAgentForCoverage, provId || null);
            toast.success(`Cakupan agent berhasil ditetapkan ke provinsi ${assignCoverageProvince.name}!`);
            setAssignCoverageProvince(null);
            setSelectedAgentForCoverage('');
            fetchData(true);
        } catch (error: any) {
            console.error('Failed to update agent coverage', error);
            toast.error(error?.response?.data?.error || error.message || 'Gagal mengubah cakupan agent');
        } finally {
            setSavingCoverage(false);
        }
    };

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
                        Distribusi Agent Halal
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Pemantauan persebaran cakupan wilayah per 38 provinsi dan beban kasus aktif per agent (Bab 7)
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

            {/* 4 KPI Summary Cards (Bab 7 Wireframe) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <span className="text-[11px] font-black uppercase text-gray-500">AGENT AKTIF</span>
                    <div className="text-3xl font-black text-gray-900 mt-1">{kpis.totalAgents}</div>
                    <p className="text-[11px] text-gray-400 mt-1">Total HA, HM, & HD di jaringan</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <span className="text-[11px] font-black uppercase text-brand-700">KASUS AKTIF</span>
                    <div className="text-3xl font-black text-brand-900 mt-1">{kpis.totalActiveCases}</div>
                    <p className="text-[11px] text-brand-600 mt-1">Dalam proses pendampingan</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
                    <span className="text-[11px] font-black uppercase text-emerald-800">PROVINSI CUKUP</span>
                    <div className="text-3xl font-black text-emerald-900 mt-1">
                        {kpis.targetMetCount} <span className="text-base text-gray-500 font-bold">/ 38</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1">Cakupan sesuai target</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
                    <span className="text-[11px] font-black uppercase text-amber-800">PERLU PENAMBAHAN</span>
                    <div className="text-3xl font-black text-amber-900 mt-1">{kpis.needAdditionCount}</div>
                    <p className="text-[11px] text-amber-700 mt-1">Provinsi dengan gap cakupan</p>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <button
                    onClick={() => setTab('PROVINCE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        tab === 'PROVINCE'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <MapPin className="w-4 h-4" />
                    <span>Cakupan Provinsi (38 Provinsi)</span>
                </button>

                <button
                    onClick={() => setTab('WORKLOAD')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        tab === 'WORKLOAD'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    <span>Beban Agent</span>
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: CAKUPAN PROVINSI                                               */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {tab === 'PROVINCE' && (
                <div className="space-y-4">
                    {/* Filter and Search */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama provinsi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-semibold">
                                {[
                                    { key: 'ALL', label: 'Semua' },
                                    { key: 'SESUAI', label: 'Cukup' },
                                    { key: 'PENAMBAHAN', label: 'Perlu Penambahan' },
                                    { key: 'BELUM_ADA', label: 'Belum Ada' }
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setStatusFilter(item.key)}
                                        className={`px-3 py-1.5 rounded-md transition-all ${
                                            statusFilter === item.key
                                                ? 'bg-white text-brand-700 shadow-sm font-bold'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table Cakupan Provinsi (Bab 7 Wireframe) */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Provinsi</th>
                                        <th className="py-3 px-3 text-center">HA Aktif</th>
                                        <th className="py-3 px-3 text-center">HM Aktif</th>
                                        <th className="py-3 px-3 text-center">HD Aktif</th>
                                        <th className="py-3 px-3 text-center">Kasus Aktif</th>
                                        <th className="py-3 px-4">Cakupan</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                                Memuat data cakupan provinsi...
                                            </td>
                                        </tr>
                                    ) : filteredProvinces.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500">
                                                Tidak ada provinsi yang cocok dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProvinces.map((prov) => {
                                            return (
                                                <tr key={prov.name} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="py-3.5 px-4 font-bold text-gray-900">
                                                        {prov.name}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono">
                                                        {prov.haCount}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono">
                                                        {prov.hmCount}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono">
                                                        {prov.hdCount}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono font-bold text-brand-700">
                                                        {prov.activeCases}
                                                    </td>
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        {prov.status === 'SESUAI_TARGET' && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Sesuai target
                                                            </span>
                                                        )}
                                                        {prov.status === 'PERLU_PENAMBAHAN' && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Perlu penambahan
                                                            </span>
                                                        )}
                                                        {prov.status === 'BELUM_ADA' && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Belum ada
                                                            </span>
                                                        )}
                                                        {prov.status === 'TARGET_BELUM_DIATUR' && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                                                Target belum diatur
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {prov.totalAgents > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingProvinceAgents({ name: prov.name, id: prov.dbId })}
                                                                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-colors"
                                                                >
                                                                    Lihat Agent ({prov.totalAgents})
                                                                </button>
                                                            ) : null}

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAssignCoverageProvince({ name: prov.name, id: prov.dbId });
                                                                    setSelectedAgentForCoverage('');
                                                                }}
                                                                className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 transition-colors"
                                                            >
                                                                Atur Cakupan
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
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: BEBAN AGENT                                                    */}
            {/* ══════════════════════════════════════════════════════════════════════ */}
            {tab === 'WORKLOAD' && (
                <div className="space-y-4">
                    {/* Filter and Search */}
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama agent, kode referral..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-semibold">
                                {['ALL', 'HA', 'HM', 'HD'].map((roleKey) => (
                                    <button
                                        key={roleKey}
                                        onClick={() => setRoleFilter(roleKey)}
                                        className={`px-3 py-1.5 rounded-md transition-all ${
                                            roleFilter === roleKey
                                                ? 'bg-white text-brand-700 shadow-sm font-bold'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {roleKey === 'ALL' ? 'Semua Jenjang' : roleKey}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table Beban Agent (Bab 7 Wireframe) */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Agent</th>
                                        <th className="py-3 px-3 text-center">Jenjang</th>
                                        <th className="py-3 px-4">Provinsi</th>
                                        <th className="py-3 px-3 text-center">Kasus Aktif</th>
                                        <th className="py-3 px-3 text-center">Tertunda Bayar</th>
                                        <th className="py-3 px-3 text-center">Kekurangan Data</th>
                                        <th className="py-3 px-3 text-center">Terlambat SLA</th>
                                        <th className="py-3 px-3 text-center">Selesai (SH)</th>
                                        <th className="py-3 px-4 text-center">Status Beban</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                                Memuat analisis beban kerja agent...
                                            </td>
                                        </tr>
                                    ) : filteredConsultants.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-gray-500">
                                                Tidak ada data agent yang cocok.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredConsultants.map((agent) => {
                                            const roleName = typeof agent.role === 'object' ? (agent.role as any)?.name : agent.role;
                                            const level = roleName === 'HALAL_DIRECTOR' ? 'HD' : roleName === 'HALAL_MANAGER' ? 'HM' : 'HA';
                                            const provName = (agent as any).province?.name || 'Semua Wilayah';
                                            const workload = consultantWorkload[agent.id] || {
                                                active: 0,
                                                waitingPayment: 0,
                                                incomplete: 0,
                                                overdue: 0,
                                                completed: 0
                                            };

                                            let loadBadge = (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                    Ideal
                                                </span>
                                            );
                                            if (workload.active === 0) {
                                                loadBadge = (
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                                                        Kapasitas Luang
                                                    </span>
                                                );
                                            } else if (workload.active > 5) {
                                                loadBadge = (
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                                        Beban Tinggi
                                                    </span>
                                                );
                                            }

                                            return (
                                                <tr key={agent.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <p className="font-bold text-gray-900">{agent.full_name}</p>
                                                        <p className="text-[11px] text-gray-500 font-mono">
                                                            {agent.referral_code || 'Tanpa Kode'}
                                                        </p>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            level === 'HD' ? 'bg-purple-100 text-purple-800' : level === 'HM' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {level}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-gray-700">
                                                        {provName}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-bold text-brand-700 font-mono">
                                                        {workload.active}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono text-purple-700">
                                                        {workload.waitingPayment}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono text-amber-700">
                                                        {workload.incomplete}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono text-red-700 font-bold">
                                                        {workload.overdue}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-center font-mono text-emerald-700 font-bold">
                                                        {workload.completed}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                        {loadBadge}
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

            {/* Modal: Lihat Agent per Provinsi */}
            {viewingProvinceAgents && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">
                                    Agent Halal • Provinsi {viewingProvinceAgents.name}
                                </h3>
                                <p className="text-xs text-brand-200 mt-0.5">
                                    Daftar Halal Advisor, Manager, dan Director aktif di wilayah ini
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingProvinceAgents(null)}
                                className="text-brand-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-96 overflow-y-auto space-y-3">
                            {provinceMatrix.find(p => p.name === viewingProvinceAgents.name)?.agents.map((ag) => {
                                const roleName = typeof ag.role === 'object' ? (ag.role as any)?.name : ag.role;
                                const level = roleName === 'HALAL_DIRECTOR' ? 'HD' : roleName === 'HALAL_MANAGER' ? 'HM' : 'HA';
                                const activeCount = consultantWorkload[ag.id]?.active || 0;

                                return (
                                    <div key={ag.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-bold text-gray-900">{ag.full_name}</p>
                                            <p className="text-[11px] text-gray-500 font-mono">{ag.referral_code || 'Tanpa Kode'}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                                {level}
                                            </span>
                                            <span className="font-semibold text-gray-700">
                                                {activeCount} Kasus Aktif
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setViewingProvinceAgents(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Atur Cakupan (manage_agent_coverage per AC-11) */}
            {assignCoverageProvince && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">
                                    Atur Cakupan Agent
                                </h3>
                                <p className="text-xs text-brand-200 mt-0.5">
                                    Tautkan agent aktif ke Provinsi {assignCoverageProvince.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setAssignCoverageProvince(null)}
                                disabled={savingCoverage}
                                className="text-brand-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="bg-brand-50 p-3 rounded-xl border border-brand-100 text-brand-900 leading-relaxed">
                                Fitur ini mengaitkan cakupan wilayah kerja agent aktif untuk pemenuhan target minimum provinsi (AC-11).
                            </div>

                            <div>
                                <label className="block font-bold text-gray-800 mb-1.5">
                                    Pilih Agent Halal:
                                </label>
                                <select
                                    value={selectedAgentForCoverage}
                                    onChange={(e) => setSelectedAgentForCoverage(e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                                >
                                    <option value="">-- Pilih Agent dari Jaringan --</option>
                                    {consultants.map((ag) => (
                                        <option key={ag.id} value={ag.id}>
                                            {ag.full_name} ({ag.referral_code || 'Tanpa Kode'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button
                                onClick={() => setAssignCoverageProvince(null)}
                                disabled={savingCoverage}
                                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveCoverage}
                                disabled={!selectedAgentForCoverage || savingCoverage}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                            >
                                {savingCoverage ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Konfirmasi Cakupan</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
