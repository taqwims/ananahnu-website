import { useState, useEffect } from 'react';
import { Users, Copy, Check, Info, TrendingUp, Wallet, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { User, ReferralCommission } from '../../types';
import { formatRupiah } from '../../utils/format';

export default function ReferralDashboard() {
    const user = useAuthStore(state => state.user);
    const [referrals, setReferrals] = useState<User[]>([]);
    const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [refRes, commRes] = await Promise.all([
                    api.get('/profile/referrals'),
                    api.get('/profile/commissions')
                ]);
                setReferrals(refRes.data || []);
                setCommissions(commRes.data || []);
            } catch (error) {
                console.error("Failed to fetch referral data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCopy = () => {
        if (user?.referral_code) {
            navigator.clipboard.writeText(user.referral_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Referral Saya</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola dan pantau jaringan konsultan yang Anda referensikan</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kode Referral Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                                <Info className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Kode Referral Anda</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl font-mono text-xl font-black text-brand-700 tracking-wider flex-1 text-center">
                                {user?.referral_code || 'BELUM-TERSEDIA'}
                            </div>
                            <button
                                onClick={handleCopy}
                                disabled={!user?.referral_code}
                                className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                                title="Salin Kode"
                            >
                                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                            Bagikan kode ini kepada konsultan baru saat mereka mendaftar. Anda mungkin akan mendapatkan insentif khusus untuk setiap konsultan yang berhasil bergabung dan aktif melalui kode Anda.
                        </p>
                    </div>
                </div>

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
                            <span className="text-5xl font-black text-gray-900">{referrals.length}</span>
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
                                {formatRupiah(commissions.reduce((sum: number, c: ReferralCommission) => sum + c.amount, 0))}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                    {commissions.filter((c: ReferralCommission) => c.status === 'PAID').length} Dibayar
                                </span>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                                    {commissions.filter((c: ReferralCommission) => c.status === 'PENDING').length} Pending
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Referrals */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Daftar Konsultan Tereferensikan</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Nama Konsultan</th>
                                <th className="px-6 py-4">Submission</th>
                                <th className="px-6 py-4">Nominal</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : commissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Belum ada insentif referal yang tercatat.</p>
                                        <p className="text-gray-400 text-xs mt-1">Insentif akan muncul setelah konsultan referensi Anda menyelesaikan pembayaran tagihan.</p>
                                    </td>
                                </tr>
                            ) : (
                                commissions.map((c: ReferralCommission) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{c.referred?.full_name}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">#{c.referred_id.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-600 font-medium">{c.submission?.client?.business_name || 'Submission'}</span>
                                                <span className="text-[10px] text-brand-600 font-bold uppercase">{c.submission?.service_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-900">{formatRupiah(c.amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {c.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {c.status === 'PAID' ? 'Dibayar' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
