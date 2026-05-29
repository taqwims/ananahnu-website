import { Info, Copy, Check, RefreshCw } from 'lucide-react';
import type { User } from '../../../types';

interface ReferralCodeCardProps {
    user: User | null;
    copied: boolean;
    onCopy: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const ReferralCodeCard = ({ user, copied, onCopy, onRefresh, isRefreshing }: ReferralCodeCardProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                            <Info className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900">Kode Referral Anda</h3>
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-brand-50"
                        title="Ambil kode terbaru dari server"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Memuat...' : 'Refresh'}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl font-mono text-xl font-black text-brand-700 tracking-wider flex-1 text-center">
                        {user?.referral_code || 'BELUM-TERSEDIA'}
                    </div>
                    <button
                        onClick={onCopy}
                        disabled={!user?.referral_code}
                        className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Salin Kode"
                    >
                        {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                    Bagikan kode ini kepada advisor baru saat mereka mendaftar. Anda mungkin akan mendapatkan insentif khusus untuk setiap advisor yang berhasil bergabung dan aktif melalui kode Anda.
                </p>
            </div>
        </div>
    );
};
