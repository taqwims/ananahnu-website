import { TrendingUp, Wallet } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';

interface ReferralStatsProps {
    totalReferrals: number;
    totalIncentive: number;
    paidCount: number;
    pendingCount: number;
}

export const ReferralStats = ({
    totalReferrals,
    totalIncentive,
    paidCount,
    pendingCount
}: ReferralStatsProps) => {
    return (
        <>
            {/* Analytics Card 1: Total Referensi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Total Referensi</h3>
                        </div>
                        <p className="text-gray-500 text-sm">Konsultan yang mendaftar dengan kode Anda</p>
                    </div>
                    <div className="mt-4 flex items-end gap-3">
                        <span className="text-5xl font-black text-gray-900">{totalReferrals}</span>
                        <span className="text-gray-500 mb-2 font-medium">Orang</span>
                    </div>
                </div>
            </div>

            {/* Analytics Card 2: Total Insentif */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Total Insentif</h3>
                        </div>
                        <p className="text-gray-500 text-sm">Estimasi total komisi dari referensi Anda</p>
                    </div>
                    <div className="mt-4 flex flex-col">
                        <span className="text-3xl font-black text-gray-900">
                            {formatRupiah(totalIncentive)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                {paidCount} Dibayar
                            </span>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                                {pendingCount} Pending
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
