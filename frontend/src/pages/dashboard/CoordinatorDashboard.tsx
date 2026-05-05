import { useState, useEffect } from 'react';
import { UsersRound, GraduationCap, FileText, Loader2, CheckCircle, Clock, Shield, User as UserIcon, Briefcase, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { User, TrainingParticipant, ConsultantProfile, Client, Submission } from '../../types';

type TabKey = 'team' | 'clients' | 'submissions';

export default function CoordinatorDashboard() {
    const currentUser = useAuthStore(state => state.user);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
    const [teamClients, setTeamClients] = useState<Client[]>([]);
    const [teamSubmissions, setTeamSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('team');

    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberTrainings, setMemberTrainings] = useState<TrainingParticipant[]>([]);
    const [memberClients, setMemberClients] = useState<Client[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Load all consultant profiles
                const profilesRes = await api.get('/consultant/profiles');
                setProfiles(profilesRes.data || []);

                const users = (profilesRes.data || []).map((p: ConsultantProfile) => p.user).filter(Boolean);
                setTeamMembers(users);

                // Load team clients
                if (currentUser?.id) {
                    try {
                        const clientsRes = await api.get(`/clients/by-team/${currentUser.id}`);
                        setTeamClients(clientsRes.data.data || []);
                    } catch { setTeamClients([]); }

                    // Load submissions (coordinator can see all submissions)
                    try {
                        const subsRes = await api.get('/submissions');
                        setTeamSubmissions(subsRes.data || []);
                    } catch { setTeamSubmissions([]); }
                }
            } catch { setTeamMembers([]); }
            finally { setLoading(false); }
        };
        load();
    }, [currentUser?.id]);

    const selectMember = async (member: User) => {
        setSelectedMember(member);
        setLoadingDetail(true);
        try {
            const [trainRes, clientRes] = await Promise.all([
                api.get(`/user-trainings/${member.id}`).catch(() => ({ data: [] })),
                api.get(`/clients?facilitator_id=${member.id}`).catch(() => ({ data: { data: [] } })),
            ]);
            setMemberTrainings(trainRes.data || []);
            setMemberClients(clientRes.data.data || clientRes.data || []);
        } catch {
            setMemberTrainings([]);
            setMemberClients([]);
        }
        finally { setLoadingDetail(false); }
    };

    const getMemberProfile = (userId: string) => profiles.find(p => p.user_id === userId);

    const STATUS_COLORS: Record<string, string> = {
        DRAFT: 'bg-gray-100 text-gray-700',
        WAITING_PAYMENT: 'bg-amber-100 text-amber-700',
        VERVAL_PENDAMPING: 'bg-yellow-100 text-yellow-700',
        QC_OFFICER: 'bg-blue-100 text-blue-700',
        DRAFTER: 'bg-purple-100 text-purple-700',
        SIDANG_FATWA: 'bg-indigo-100 text-indigo-700',
        SH_TERBIT: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
        REVISION: 'bg-orange-100 text-orange-700',
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UsersRound className="w-6 h-6 text-brand-600" />
                    Tim Saya
                </h1>
                <p className="text-sm text-gray-500 mt-1">Tracking halal consultant di bawah koordinasi Anda</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Anggota Tim</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{teamMembers.length}</p>
                </div>
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Profil Terverifikasi</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {profiles.filter(p => p.is_verified).length}
                    </p>
                </div>
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Klien</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{teamClients.length}</p>
                </div>
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Pengajuan Aktif</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                        {teamSubmissions.filter(s => s.status !== 'SH_TERBIT' && s.status !== 'REJECTED').length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                {[
                    { key: 'team' as TabKey, label: 'Anggota Tim', icon: UsersRound },
                    { key: 'clients' as TabKey, label: 'Klien Tim', icon: Briefcase },
                    { key: 'submissions' as TabKey, label: 'Pengajuan Tim', icon: FileText },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-2 px-4 font-medium flex items-center gap-2 ${activeTab === tab.key ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* === TEAM TAB === */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team List */}
                    <div className="lg:col-span-1 space-y-3">
                        {teamMembers.length === 0 ? (
                            <div className="glass-panel p-8 text-center text-gray-400">
                                <UserIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                Belum ada anggota tim
                            </div>
                        ) : teamMembers.map(member => {
                            const profile = getMemberProfile(member.id);
                            return (
                                <div
                                    key={member.id}
                                    onClick={() => selectMember(member)}
                                    className={`glass-panel p-4 cursor-pointer transition-all hover:shadow-xl ${
                                        selectedMember?.id === member.id ? 'ring-2 ring-brand-500' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                                            <UserIcon className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{member.full_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                        </div>
                                        {profile?.is_verified ? (
                                            <Shield className="w-4 h-4 text-green-500 shrink-0" />
                                        ) : (
                                            <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Member Detail */}
                    <div className="lg:col-span-2">
                        {!selectedMember ? (
                            <div className="glass-panel p-12 text-center text-gray-400">
                                <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                Pilih anggota tim untuk melihat detail
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Profile Status */}
                                {(() => {
                                    const profile = getMemberProfile(selectedMember.id);
                                    return (
                                        <div className="glass-panel p-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-brand-500" />
                                                Dokumen Rekrutmen
                                            </h3>
                                            {!profile ? (
                                                <p className="text-sm text-gray-400">Belum mengisi profil konsultan</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { label: 'KTP', url: profile.ktp_url },
                                                        { label: 'Foto 3x4', url: profile.photo_3x4_url },
                                                        { label: 'Ijazah STA', url: profile.ijazah_sta_url },
                                                        { label: 'Buku Rekening', url: profile.bank_account_url },
                                                        { label: 'NPWP', url: profile.npwp_url },
                                                    ].map(doc => (
                                                        <div key={doc.label} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                                            <span className="text-sm text-gray-700">{doc.label}</span>
                                                            {doc.url ? (
                                                                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                                                                    <CheckCircle className="w-3 h-3" /> Lihat
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">Belum ada</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Member Clients */}
                                <div className="glass-panel p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-brand-500" />
                                        Klien ({memberClients.length})
                                    </h3>
                                    {loadingDetail ? (
                                        <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                                    ) : memberClients.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">Belum ada klien</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {memberClients.map((cl: Client) => (
                                                <div key={cl.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{cl.business_name}</p>
                                                        <p className="text-xs text-gray-500">NIB: {cl.nib} | {cl.service_type}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        cl.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {cl.service_type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Training History */}
                                <div className="glass-panel p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-brand-500" />
                                        Riwayat Pelatihan
                                    </h3>
                                    {loadingDetail ? (
                                        <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                                    ) : memberTrainings.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">Belum mengikuti pelatihan</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {memberTrainings.map(tp => (
                                                <div key={tp.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {tp.training_id}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        tp.status === 'LULUS'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {tp.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === CLIENTS TAB === */}
            {activeTab === 'clients' && (
                <div className="glass-panel overflow-hidden">
                    {teamClients.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            Belum ada klien dari tim Anda
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-white/50">
                                <tr className="text-left text-xs text-gray-500 uppercase">
                                    <th className="p-4">NIB</th>
                                    <th className="p-4">Nama Usaha</th>
                                    <th className="p-4">Produk</th>
                                    <th className="p-4">Layanan</th>
                                    <th className="p-4">Pendamping</th>
                                    <th className="p-4">Kontak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {teamClients.map(c => (
                                    <tr key={c.id} className="hover:bg-white/30 transition">
                                        <td className="p-4 font-mono text-xs">{c.nib}</td>
                                        <td className="p-4 font-medium text-gray-800">{c.business_name}</td>
                                        <td className="p-4 text-gray-600">{c.product_name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                c.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                            }`}>{c.service_type}</span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500">{c.facilitator?.full_name || '-'}</td>
                                        <td className="p-4 text-xs text-gray-500">{c.phone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* === SUBMISSIONS TAB === */}
            {activeTab === 'submissions' && (
                <div className="glass-panel overflow-hidden">
                    {teamSubmissions.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            Belum ada pengajuan dari tim Anda
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {teamSubmissions.map(sub => (
                                <div key={sub.id} className="p-4 hover:bg-white/30 transition flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[sub.status] || 'bg-gray-100'}`}>
                                            {sub.status === 'SH_TERBIT' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{sub.client?.business_name || 'Unknown'}</h4>
                                            <p className="text-xs text-gray-500">NIB: {sub.client?.nib || '-'} | {sub.service_type}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(sub.created_at).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[sub.status]}`}>
                                            {sub.status.replace(/_/g, ' ')}
                                        </span>
                                        <Link to={`/dashboard/submissions/${sub.id}`} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition">
                                            <Eye className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
