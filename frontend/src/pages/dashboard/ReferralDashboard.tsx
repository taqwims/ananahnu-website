import { useState } from 'react';
import { useReferralDashboard } from '../../hooks/useReferralDashboard';
import { ReferralCodeCard } from '../../components/dashboard/referral/ReferralCodeCard';
import { ReferralStats } from '../../components/dashboard/referral/ReferralStats';
import { CommissionsTable } from '../../components/dashboard/referral/ReferralCommissionsTable';
import { StructuralCommissionsTable } from '../../components/dashboard/referral/StructuralCommissionsTable';

export default function ReferralDashboard() {
    const {
        user,
        referralCommissions,
        structuralCommissions,
        isLoading,
        copied,
        handleCopy,
        refreshReferralCode,
        isRefreshing,
        referralStats,
        structuralStats
    } = useReferralDashboard();

    const [activeTab, setActiveTab] = useState<'referral' | 'structural'>('referral');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Insentif Saya</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola dan pantau insentif referal dan struktural Anda</p>
                </div>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === 'referral' 
                            ? 'border-brand-500 text-brand-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('referral')}
                >
                    Insentif Referal
                </button>
                <button
                    className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === 'structural' 
                            ? 'border-brand-500 text-brand-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab('structural')}
                >
                    Insentif Struktural
                </button>
            </div>

            {activeTab === 'referral' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReferralCodeCard 
                            user={user}
                            copied={copied}
                            onCopy={handleCopy}
                            onRefresh={refreshReferralCode}
                            isRefreshing={isRefreshing}
                        />

                        <ReferralStats 
                            totalReferrals={referralStats.totalReferrals}
                            totalIncentive={referralStats.totalIncentive}
                            paidCount={referralStats.paidCount}
                            pendingCount={referralStats.pendingCount}
                        />
                    </div>

                    <CommissionsTable 
                        commissions={referralCommissions}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {activeTab === 'structural' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 gap-6">
                        <ReferralStats 
                            totalReferrals={undefined} // Hide the "Total Referrals" card visually 
                            totalIncentive={structuralStats.totalIncentive}
                            paidCount={structuralStats.paidCount}
                            pendingCount={structuralStats.pendingCount}
                        />
                    </div>

                    <StructuralCommissionsTable 
                        commissions={structuralCommissions}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
}
