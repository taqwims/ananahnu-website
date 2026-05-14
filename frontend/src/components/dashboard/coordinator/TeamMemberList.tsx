import { User as UserIcon, Shield, Clock } from 'lucide-react';
import type { User, ConsultantProfile } from '../../../types';

interface TeamMemberListProps {
    members: User[];
    profiles: ConsultantProfile[];
    selectedId?: string;
    onSelect: (m: User) => void;
}

export const TeamMemberList = ({
    members,
    profiles,
    selectedId,
    onSelect
}: TeamMemberListProps) => {
    const getMemberProfile = (userId: string) => profiles.find(p => p.user_id === userId);

    if (members.length === 0) {
        return (
            <div className="glass-panel p-12 text-center text-gray-400 border-dashed border-2 border-gray-100">
                <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold">Belum ada anggota tim terdaftar</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {members.map(member => {
                const profile = getMemberProfile(member.id);
                const isSelected = selectedId === member.id;

                return (
                    <div
                        key={member.id}
                        onClick={() => onSelect(member)}
                        className={`glass-panel p-4 cursor-pointer transition-all hover:shadow-xl border-2 group ${
                            isSelected 
                            ? 'border-brand-600 ring-4 ring-brand-50/50 shadow-2xl' 
                            : 'border-white/50 hover:border-brand-200'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                                isSelected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                            }`}>
                                {member.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-900 truncate">{member.full_name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">{member.email}</p>
                            </div>
                            {profile?.is_verified ? (
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl" title="Terverifikasi">
                                    <Shield className="w-4 h-4" />
                                </div>
                            ) : (
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl" title="Menunggu Verifikasi">
                                    <Clock className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
