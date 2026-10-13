import { TrendingUp, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';

interface ReferralStatsProps {
    title?: string;
    subtitle?: string;
    totalReferrals?: number;
    totalIncentive: number;
    paidAmount?: number;
    pendingAmount?: number;
    paidCount: number;
    pendingCount: number;
}

export const ReferralStats = ({
    title = 'Total Insentif',
    subtitle = 'Estimasi total komisi dari transaksi Anda',
    totalReferrals,
    totalIncentive,
    paidAmount,
    pendingAmount,
    paidCount,
    pendingCount
}: ReferralStatsProps) => {
    // Mode Referral (Ada total referrals orang)
    if (totalReferrals !== undefined) {
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
                            <p className="text-gray-500 text-sm">Mitra/Advisor yang mendaftar dengan kode Anda</p>
                        </div>
                        <div className="mt-4 flex items-end gap-3">
                            <span className="text-5xl font-black text-gray-900">{totalReferrals}</span>
                            <span className="text-gray-500 mb-2 font-medium">Orang</span>
                        </div>
                    </div>
                </div>

                {/* Analytics Card 2: Total Insentif Referral */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900">{title}</h3>
                            </div>
                            <p className="text-gray-500 text-sm">{subtitle}</p>
                        </div>
                        <div className="mt-4 flex flex-col">
                            <span className="text-3xl font-black text-gray-900">
                                {formatRupiah(totalIncentive)}
                            </span>
                            <div className="flex items-center gap-2 mt-2">
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
    }

    // Mode Komisi Langsung / Override (3 Kolom Seimbang)
    return (
        <>
            {/* Card 1: Total Komisi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">{title}</h3>
                        </div>
                        <p className="text-gray-500 text-xs">{subtitle}</p>
                    </div>
                    <div className="mt-4 flex flex-col">
                        <span className="text-3xl font-black text-gray-900">
                            {formatRupiah(totalIncentive)}
                        </span>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                            {paidCount + pendingCount} total pengajuan tercatat
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 2: Sudah Cair (Paid) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Komisi Sudah Cair</h3>
                        </div>
                        <p className="text-gray-500 text-xs">Telah diverifikasi dan ditransfer</p>
                    </div>
                    <div className="mt-4 flex flex-col">
                        <span className="text-3xl font-black text-emerald-600">
                            {formatRupiah(paidAmount !== undefined ? paidAmount : 0)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                                {paidCount} Transaksi Selesai
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: Menunggu Pencairan (Pending) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Menunggu Pencairan</h3>
                        </div>
                        <p className="text-gray-500 text-xs">Menunggu pelunasan klien / audit</p>
                    </div>
                    <div className="mt-4 flex flex-col">
                        <span className="text-3xl font-black text-amber-600">
                            {formatRupiah(pendingAmount !== undefined ? pendingAmount : 0)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg">
                                {pendingCount} Pengajuan Pending
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
