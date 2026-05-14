import { Receipt } from 'lucide-react';
import { formatRupiah } from '../../../../utils/format';

interface BillingStatsHeaderProps {
    stats: {
        totalUnpaid: number;
        totalPaid: number;
        pendingVerifCount: number;
    };
}

export const BillingStatsHeader = ({ stats }: BillingStatsHeaderProps) => {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-100">
                        <Receipt className="w-6 h-6 text-white" />
                    </div>
                    Manajemen Billing & Pembayaran
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-1">Konsolidasi tagihan dan transaksi dalam satu pintu</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <div className="glass-panel p-3 border-amber-100 bg-amber-50/30">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Unpaid Total</p>
                    <p className="text-sm font-black text-gray-800">{formatRupiah(stats.totalUnpaid)}</p>
                </div>
                <div className="glass-panel p-3 border-emerald-100 bg-emerald-50/30">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Paid Total</p>
                    <p className="text-sm font-black text-gray-800">{formatRupiah(stats.totalPaid)}</p>
                </div>
                <div className="glass-panel p-3 border-blue-100 bg-blue-50/30 hidden sm:block">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Pending Verif</p>
                    <p className="text-sm font-black text-gray-800">{stats.pendingVerifCount} Transaksi</p>
                </div>
            </div>
        </div>
    );
};
