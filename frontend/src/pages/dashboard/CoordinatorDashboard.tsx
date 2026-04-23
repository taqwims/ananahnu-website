import { useState, useEffect } from 'react';
import { UsersRound, GraduationCap, FileText, Loader2, CheckCircle, Clock, Shield, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { User, TrainingParticipant, ConsultantProfile } from '../../types';

export default function CoordinatorDashboard() {
    const currentUser = useAuthStore(state => state.user);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [memberTrainings, setMemberTrainings] = useState<TrainingParticipant[]>([]);
    const [loadingTrainings, setLoadingTrainings] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Load all consultant profiles (coordinator can see all, backend will filter by team)
                const profilesRes = await api.get('/consultant/profiles');
                setProfiles(profilesRes.data || []);

                // For now, show all consultants. When backend team filtering is implemented,
                // this will auto-filter based on leader_id
                const users = (profilesRes.data || []).map((p: ConsultantProfile) => p.user).filter(Boolean);
                setTeamMembers(users);
            } catch { setTeamMembers([]); }
            finally { setLoading(false); }
        };
        load();
    }, [currentUser?.id]);

    const selectMember = async (member: User) => {
        setSelectedMember(member);
        setLoadingTrainings(true);
        try {
            const res = await api.get(`/user-trainings/${member.id}`);
            setMemberTrainings(res.data || []);
        } catch { setMemberTrainings([]); }
        finally { setLoadingTrainings(false); }
    };

    const getMemberProfile = (userId: string) => profiles.find(p => p.user_id === userId);


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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Anggota</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{teamMembers.length}</p>
                </div>
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Profil Terverifikasi</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {profiles.filter(p => p.is_verified).length}
                    </p>
                </div>
                <div className="glass-panel p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Menunggu Verifikasi</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {profiles.filter(p => !p.is_verified).length}
                    </p>
                </div>
            </div>

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

                            {/* Training History */}
                            <div className="glass-panel p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-brand-500" />
                                    Riwayat Pelatihan
                                </h3>
                                {loadingTrainings ? (
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
        </div>
    );
}
