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
    const isAdvisor = role === 'HALAL_ADVISOR' || role === 'MARKETING';

    // Default tab: Halal Manager fokus ke Override Reguler (tim binaan), Advisor fokus ke Komisi Langsung Klien
    const [activeTab, setActiveTab] = useState<TabKey>(isManagerOrDirector ? 'override_reg' : 'komisi');

    const getPageHeader = () => {
        if (isAdvisor) {
            return {
                title: 'Insentif Saya',
                subtitle: 'Kelola dan pantau komisi langsung dari pendampingan sertifikasi halal klien Anda'
            };
        }
        if (isManagerOrDirector) {
            return {
                title: 'Insentif Saya',
                subtitle: 'Kelola dan pantau insentif override dari tim Halal Advisor binaan Anda'
            };
        }
        return {
            title: 'Insentif Saya',
            subtitle: 'Kelola dan pantau komisi dan insentif Anda'
        };
    };

    const header = getPageHeader();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
                    <p className="text-gray-500 text-sm mt-1">{header.subtitle}</p>
                </div>
            </div>

            {/* TAB SELECTOR UNTUK HALAL ADVISOR */}
            {isAdvisor && (
                <div className="flex flex-wrap border-b border-gray-200 gap-1">
                    <button
                        className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors ${
                            activeTab === 'komisi' 
                                ? 'border-brand-500 text-brand-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('komisi')}
                    >
                        Komisi Langsung Klien
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
                </div>
            )}

            {/* TAB SELECTOR UNTUK HALAL MANAGER / DIRECTOR */}
            {isManagerOrDirector && (
                <div className="flex flex-wrap border-b border-gray-200 gap-1">
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
                            activeTab === 'komisi' 
                                ? 'border-brand-500 text-brand-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('komisi')}
                    >
                        Komisi Pendampingan Langsung
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
                </div>
            )}

            {/* TAB 1: KOMISI LANGSUNG KLIEN (DIRECT SALES) */}
            {activeTab === 'komisi' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReferralStats 
                            title="Total Komisi Langsung"
                            subtitle="Komisi 25% dari biaya pendampingan klien"
                            totalIncentive={directSalesStats.totalIncentive}
                            paidAmount={directSalesStats.paidAmount}
                            pendingAmount={directSalesStats.pendingAmount}
                            paidCount={directSalesStats.paidCount}
                            pendingCount={directSalesStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={directSalesCommissions}
                        isLoading={isLoading}
                        type="DIRECT_SALES"
                        title="Daftar Pendampingan & Komisi Langsung Klien"
                        subtitle="Komisi pendampingan sertifikasi halal yang didapatkan langsung dari klien binaan Anda"
                    />
                </div>
            )}

            {/* TAB 2: INSENTIF REFERRAL MITRA */}
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
                            title="Total Insentif Referral"
                            subtitle="Komisi yang diperoleh dari pendaftaran mitra baru"
                            totalReferrals={referralStats.totalReferrals}
                            totalIncentive={referralStats.totalIncentive}
                            paidAmount={referralStats.paidAmount}
                            pendingAmount={referralStats.pendingAmount}
                            paidCount={referralStats.paidCount}
                            pendingCount={referralStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={referralCommissions}
                        isLoading={isLoading}
                        type="REFERRAL"
                        title="Riwayat Insentif Referral Mitra"
                        subtitle="Insentif dari mitra yang mendaftar melalui nomor registrasi/kode referral Anda"
                    />
                </div>
            )}

            {/* TAB 3: INSENTIF OVERRIDE REGULER (HALAL MANAGER) */}
            {isManagerOrDirector && activeTab === 'override_reg' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReferralStats 
                            title="Total Override Reguler"
                            subtitle="Insentif override dari pengajuan reguler Halal Advisor binaan"
                            totalIncentive={overrideRegulerStats.totalIncentive}
                            paidAmount={overrideRegulerStats.paidAmount}
                            pendingAmount={overrideRegulerStats.pendingAmount}
                            paidCount={overrideRegulerStats.paidCount}
                            pendingCount={overrideRegulerStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={overrideRegulerCommissions}
                        isLoading={isLoading}
                        type="OVERRIDE"
                        title="Riwayat Insentif Override Reguler Halal Manager"
                        subtitle="Insentif override manajerial yang diperoleh dari transaksi reguler Halal Advisor binaan Anda"
                    />
                </div>
            )}

            {/* TAB 4: INSENTIF OVERRIDE SELF DECLARE (HALAL MANAGER) */}
            {isManagerOrDirector && activeTab === 'override_sd' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReferralStats 
                            title="Total Override Self Declare"
                            subtitle="Insentif override dari pengajuan self declare Halal Advisor binaan"
                            totalIncentive={overrideSelfDeclareStats.totalIncentive}
                            paidAmount={overrideSelfDeclareStats.paidAmount}
                            pendingAmount={overrideSelfDeclareStats.pendingAmount}
                            paidCount={overrideSelfDeclareStats.paidCount}
                            pendingCount={overrideSelfDeclareStats.pendingCount}
                        />
                    </div>
                    <CommissionsTable 
                        commissions={overrideSelfDeclareCommissions}
                        isLoading={isLoading}
                        type="OVERRIDE"
                        title="Riwayat Insentif Override Self Declare Halal Manager"
                        subtitle="Insentif override manajerial yang diperoleh dari transaksi self declare Halal Advisor binaan Anda"
                    />
                </div>
            )}
        </div>
    );
}
