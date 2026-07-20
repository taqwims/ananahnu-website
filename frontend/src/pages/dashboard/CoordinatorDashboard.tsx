import { UsersRound } from 'lucide-react';
import { useCoordinatorDashboard } from '../../hooks/useCoordinatorDashboard';
import { DashboardStats } from '../../components/dashboard/coordinator/DashboardStats';
import { DashboardTabs } from '../../components/dashboard/coordinator/DashboardTabs';
import { TeamMemberList } from '../../components/dashboard/coordinator/TeamMemberList';
import { MemberDetails } from '../../components/dashboard/coordinator/MemberDetails';
import { TeamClientsTable } from '../../components/dashboard/coordinator/TeamClientsTable';
import { TeamSubmissionsList } from '../../components/dashboard/coordinator/TeamSubmissionsList';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoordinatorDashboard() {
    const {
        teamMembers, profiles, teamClients, teamSubmissions,
        loading, activeTab, setActiveTab,
        selectedMember, memberTrainings, memberClients, loadingDetail,
        selectMember, getMemberProfile
    } = useCoordinatorDashboard();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                    <UsersRound className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-600" />
                </div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi Data Tim...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-brand-600 rounded-3xl shadow-xl shadow-brand-100">
                            <UsersRound className="w-8 h-8 text-white" />
                        </div>
                        Manajemen Tim
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium text-lg">Oversight performa dan koordinasi advisor wilayah</p>
                </div>
            </header>

            <DashboardStats 
                teamCount={teamMembers.length}
                verifiedCount={profiles.filter(p => p.is_verified).length}
                clientCount={teamClients.length}
                activeSubmissionCount={teamSubmissions.filter(s => s.status !== 'SH_TERBIT' && s.status !== 'REJECTED').length}
            />

            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Roster Advisor</h3>
                                <TeamMemberList 
                                    members={teamMembers}
                                    profiles={profiles}
                                    selectedId={selectedMember?.id}
                                    onSelect={selectMember}
                                />
                            </div>

                            {selectedMember && (
                                <MemberDetails 
                                    profile={getMemberProfile(selectedMember.id)}
                                    trainings={memberTrainings}
                                    clients={memberClients}
                                    loadingDetail={loadingDetail}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <TeamClientsTable clients={teamClients} />
                    )}

                    {activeTab === 'submissions' && (
                        <TeamSubmissionsList submissions={teamSubmissions} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
