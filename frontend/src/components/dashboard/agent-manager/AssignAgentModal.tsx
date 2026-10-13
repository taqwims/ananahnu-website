import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    Search, 
    UserCheck, 
    ShieldCheck, 
    MapPin, 
    Briefcase, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    ChevronRight,
    Filter
} from 'lucide-react';
import type { Submission, User } from '../../../types';
import { submissionService } from '../../../services/submissionService';
import { formatServiceType } from '../../../utils/format';

interface AssignAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: Submission | null;
    onSuccess: () => void;
    allSubmissions?: Submission[];
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({
    isOpen,
    onClose,
    submission,
    onSuccess,
    allSubmissions = [],
}) => {
    const [consultants, setConsultants] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
    const [filterByProvince, setFilterByProvince] = useState<boolean>(true);
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [selectedAgent, setSelectedAgent] = useState<User | null>(null);
    const [reason, setReason] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Compute active workload per consultant
    const activeWorkloadMap = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const sub of allSubmissions) {
            if (sub.consultant_id && sub.status !== 'SH_TERBIT' && sub.status !== 'REJECTED') {
                counts[sub.consultant_id] = (counts[sub.consultant_id] || 0) + 1;
            }
        }
        return counts;
    }, [allSubmissions]);

    // Fetch consultants when modal opens
    useEffect(() => {
        if (!isOpen || !submission) {
            setSelectedAgent(null);
            setReason('');
            setError(null);
            return;
        }

        const fetchAgents = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch active consultants
                const provId = filterByProvince 
                    ? (submission.province_id || (submission as any).cost_detail?.province_id || undefined) 
                    : undefined;
                const data = await submissionService.getConsultants(provId);
                setConsultants(data || []);
            } catch (err: any) {
                console.error('Failed to fetch consultants', err);
                setError('Gagal memuat daftar agent: ' + (err?.response?.data?.error || err.message));
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, [isOpen, submission, filterByProvince]);

    if (!isOpen || !submission) return null;

    // Filter agents by search term and role
    const filteredAgents = consultants.filter((agent) => {
        const matchSearch =
            search === '' ||
            agent.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (agent.referral_code && agent.referral_code.toLowerCase().includes(search.toLowerCase())) ||
            (agent.phone && agent.phone.includes(search));

        const roleStr = typeof agent.role === 'object' ? (agent.role as any)?.name : agent.role;
        const matchRole =
            selectedRole === 'ALL' ||
            (selectedRole === 'HA' && roleStr === 'HALAL_ADVISOR') ||
            (selectedRole === 'HM' && roleStr === 'HALAL_MANAGER') ||
            (selectedRole === 'HD' && roleStr === 'HALAL_DIRECTOR');

        return matchSearch && matchRole;
    });

    const getRoleBadge = (roleName?: string) => {
        switch (roleName) {
            case 'HALAL_DIRECTOR':
                return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">HD</span>;
            case 'HALAL_MANAGER':
                return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">HM</span>;
            case 'HALAL_ADVISOR':
                return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">HA</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">Agent</span>;
        }
    };

    const handleAssign = async () => {
        if (!selectedAgent) {
            setError('Silakan pilih salah satu agent terlebih dahulu.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await submissionService.assignConsultant(submission.id, selectedAgent.id, reason.trim());
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to assign consultant', err);
            setError(err?.response?.data?.error || err.message || 'Gagal menetapkan agent');
        } finally {
            setSubmitting(false);
        }
    };

    const clientBusinessName = submission.client?.business_name || submission.client?.client_name || 'Klien Halal';
    const trackingCode = submission.tracking_number || submission.id.slice(0, 8).toUpperCase();
    const provinceName = submission.province?.name || (submission as any).cost_detail?.province?.name || '-';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-brand-300" />
                            <h3 className="text-lg font-bold">Dialog Tetapkan Agent</h3>
                        </div>
                        <p className="text-xs text-brand-200 mt-0.5">
                            Hanya untuk pengajuan tanpa kode, atau exception dengan permission khusus
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-brand-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Submission Summary Banner */}
                <div className="px-6 py-3.5 bg-brand-50/70 border-b border-brand-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-sm">{clientBusinessName}</span>
                        <span className="px-2 py-0.5 bg-white text-gray-700 font-mono font-bold rounded border border-gray-200">
                            {trackingCode}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                            <span className="font-medium text-gray-800">{formatServiceType(submission.service_type)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-600" />
                            <span className="font-medium text-gray-800">{provinceName}</span>
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                            {submission.consultant ? 'Ganti Agent' : 'Tanpa Kode HA'}
                        </span>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama agent, kode referral, atau no HP..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-semibold">
                                {['ALL', 'HA', 'HM', 'HD'].map((roleKey) => (
                                    <button
                                        key={roleKey}
                                        type="button"
                                        onClick={() => setSelectedRole(roleKey)}
                                        className={`px-3 py-1.5 rounded-md transition-all ${
                                            selectedRole === roleKey
                                                ? 'bg-white text-brand-700 shadow-sm font-bold'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {roleKey === 'ALL' ? 'Semua' : roleKey}
                                    </button>
                                ))}
                            </div>

                            {submission.province_id && (
                                <button
                                    type="button"
                                    onClick={() => setFilterByProvince(!filterByProvince)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                        filterByProvince
                                            ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>{filterByProvince ? 'Sesuai Provinsi' : 'Semua Wilayah'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Agent Table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="py-3 px-4">Agent</th>
                                    <th className="py-3 px-3 text-center">Jenjang</th>
                                    <th className="py-3 px-4">Provinsi / Status</th>
                                    <th className="py-3 px-3 text-center">Kasus Aktif</th>
                                    <th className="py-3 px-3 text-center">Kelayakan</th>
                                    <th className="py-3 px-4 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-400">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                                            Memuat daftar agent aktif...
                                        </td>
                                    </tr>
                                ) : filteredAgents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            Tidak ditemukan agent aktif yang sesuai kriteria pencarian.
                                            {filterByProvince && (
                                                <div className="mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFilterByProvince(false)}
                                                        className="text-brand-600 font-bold underline hover:text-brand-700"
                                                    >
                                                        Coba tampilkan agent dari semua provinsi
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAgents.map((agent) => {
                                        const roleName = typeof agent.role === 'object' ? (agent.role as any)?.name : agent.role;
                                        const isSelected = selectedAgent?.id === agent.id;
                                        const activeCases = activeWorkloadMap[agent.id] || 0;
                                        const agentProv = (agent as any).province?.name || 'Semua Wilayah';

                                        return (
                                            <tr
                                                key={agent.id}
                                                onClick={() => setSelectedAgent(agent)}
                                                className={`cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-brand-50/80 font-medium'
                                                        : 'hover:bg-gray-50/80'
                                                }`}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                            {agent.full_name?.slice(0, 2) || 'AG'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{agent.full_name}</p>
                                                            <p className="text-[11px] text-gray-500 font-mono">
                                                                {agent.referral_code || 'Tanpa Kode'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {getRoleBadge(roleName)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-gray-700">{agentProv}</span>
                                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1.5 align-middle" />
                                                    <span className="text-[10px] text-emerald-700 font-semibold ml-1">Aktif</span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                                        activeCases > 5 
                                                            ? 'bg-amber-100 text-amber-800' 
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {activeCases}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Sesuai layanan
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAgent(agent);
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                            isSelected
                                                                ? 'bg-brand-600 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-brand-100 hover:text-brand-700'
                                                        }`}
                                                    >
                                                        {isSelected ? 'Dipilih' : 'Pilih'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Selected Agent Indicator */}
                    {selectedAgent && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                    <span className="text-gray-600">Agent Terpilih: </span>
                                    <span className="font-bold text-gray-900">{selectedAgent.full_name}</span>
                                    <span className="text-gray-500 font-mono ml-1.5">({selectedAgent.referral_code || '-'})</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAgent(null)}
                                className="text-emerald-700 font-bold hover:underline text-[11px]"
                            >
                                Ganti
                            </button>
                        </div>
                    )}

                    {/* Reason Textarea */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Catatan / Alasan Penugasan (opsional)
                        </label>
                        <textarea
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: Ditugaskan sesuai kecocokan wilayah Jawa Barat dan beban kerja agent yang masih rendah."
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleAssign}
                        disabled={!selectedAgent || submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <span>Konfirmasi Penetapan</span>
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
