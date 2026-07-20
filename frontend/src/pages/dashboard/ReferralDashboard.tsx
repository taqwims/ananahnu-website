import { useState } from 'react';
import { useReferralDashboard } from '../../hooks/useReferralDashboard';
import { ReferralCodeCard } from '../../components/dashboard/referral/ReferralCodeCard';
import { ReferralStats } from '../../components/dashboard/referral/ReferralStats';
import { CommissionsTable } from '../../components/dashboard/referral/ReferralCommissionsTable';

type TabKey = 'komisi' | 'referral' | 'override_sd' | 'override_reg';

export default function ReferralDashboard() {
    const {
        user,
        directSalesCommissions,
        referralCommissions,
        overrideSelfDeclareCommissions,
        overrideRegulerCommissions,
        isLoading,
        copied,
        handleCopy,
        refreshReferralCode,
        isRefreshing,
        directSalesStats,
        referralStats,
        overrideSelfDeclareStats,
        overrideRegulerStats
    } = useReferralDashboard();

    const role = user?.role || '';
    const isManagerOrDirector = role === 'HALAL_MANAGER' || role === 'HALAL_DIRECTOR' || role === 'ADMIN' || role === 'DIRECTOR';

    const [activeTab, setActiveTab] = useState<TabKey>('komisi');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Insentif Saya</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola dan pantau komisi dan insentif Anda</p>
                </div>
            </div>

            {isManagerOrDirector && (
                <div className="flex flex-wrap border-b border-gray-200 gap-1">
                    <button
                        className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'komisi' 
                                ? 'border-brand-500 text-brand-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('komisi')}
                    >
                        Komisi Pendamping
                    </button>
                    <button
                        className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'referral' 
                                ? 'border-brand-500 text-brand-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('referral')}
                    >
                        Insentif Referral
                    </button>
                    <button
                        className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'override_sd' 
                                ? 'border-brand-500 text-brand-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('override_sd')}
                    >
                        Insentif Override Self Declare
                    </button>
                    <button
                        className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'override_reg' 
                                ? 'border-brand-500 text-brand-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('override_reg')}
                    >
                        Insentif Override Reguler
                    </button>
                </div>
            )}

            {activeTab === 'komisi' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReferralStats 
                            totalReferrals={undefined}
                            totalIncentive={directSalesStats.totalIncentive}
                            paidCount={directSalesStats.paidCount}
                            pendingCount={directSalesStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={directSalesCommissions}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {isManagerOrDirector && activeTab === 'referral' && (
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

            {isManagerOrDirector && activeTab === 'override_sd' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReferralStats 
                            totalReferrals={undefined}
                            totalIncentive={overrideSelfDeclareStats.totalIncentive}
                            paidCount={overrideSelfDeclareStats.paidCount}
                            pendingCount={overrideSelfDeclareStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={overrideSelfDeclareCommissions}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {isManagerOrDirector && activeTab === 'override_reg' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReferralStats 
                            totalReferrals={undefined}
                            totalIncentive={overrideRegulerStats.totalIncentive}
                            paidCount={overrideRegulerStats.paidCount}
                            pendingCount={overrideRegulerStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={overrideRegulerCommissions}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
}
