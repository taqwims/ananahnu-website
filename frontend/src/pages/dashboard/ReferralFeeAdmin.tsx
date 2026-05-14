import { AlertCircle } from 'lucide-react';
import { useReferralFeeAdmin } from '../../hooks/useReferralFeeAdmin';
import { FeeConfigCard } from '../../components/dashboard/referral/FeeConfigCard';
import { CommissionTable } from '../../components/dashboard/referral/CommissionTable';

const ReferralFeeAdmin = () => {
    const {
        commissions, loading, error, setError,
        statusFilter, setStatusFilter,
        referralFee, setReferralFee,
        isSavingFee,
        saveSetting, markAsPaid
    } = useReferralFeeAdmin();

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-10 pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Fee Referral</h1>
                    <p className="text-gray-500 font-medium mt-1">Konfigurasi besaran komisi dan audit pembayaran mitra referral</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="p-2 bg-red-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm font-bold flex-1">{error}</p>
                    <button 
                        onClick={() => setError(null)}
                        className="p-2 hover:bg-red-200/50 rounded-lg transition-colors"
                    >
                        &times;
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-10">
                {/* Global Config Section */}
                <FeeConfigCard 
                    referralFee={referralFee}
                    setReferralFee={setReferralFee}
                    onSave={saveSetting}
                    isSaving={isSavingFee}
                />

                {/* Main Ledger Section */}
                <CommissionTable 
                    commissions={commissions}
                    loading={loading}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    onMarkAsPaid={markAsPaid}
                />
            </div>
        </div>
    );
};

export default ReferralFeeAdmin;
