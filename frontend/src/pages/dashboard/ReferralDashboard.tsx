import { useReferralDashboard } from '../../hooks/useReferralDashboard';
import { ReferralCodeCard } from '../../components/dashboard/referral/ReferralCodeCard';
import { ReferralStats } from '../../components/dashboard/referral/ReferralStats';
import { ReferralCommissionsTable } from '../../components/dashboard/referral/ReferralCommissionsTable';

export default function ReferralDashboard() {
    const {
        user,
        commissions,
        isLoading,
        copied,
        handleCopy,
        stats
    } = useReferralDashboard();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Referral Saya</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola dan pantau jaringan konsultan yang Anda referensikan</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReferralCodeCard 
                    user={user}
                    copied={copied}
                    onCopy={handleCopy}
                />

                <ReferralStats 
                    totalReferrals={stats.totalReferrals}
                    totalIncentive={stats.totalIncentive}
                    paidCount={stats.paidCount}
                    pendingCount={stats.pendingCount}
                />
            </div>

            <ReferralCommissionsTable 
                commissions={commissions}
                isLoading={isLoading}
            />
        </div>
    );
}
