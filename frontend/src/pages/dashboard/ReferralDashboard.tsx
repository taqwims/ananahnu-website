import { useState, useEffect } from 'react';
import { Users, Copy, Check, Info, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { User } from '../../types';

export default function ReferralDashboard() {
    const user = useAuthStore(state => state.user);
    const [referrals, setReferrals] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const response = await api.get('/profile/referrals');
                setReferrals(response.data || []);
            } catch (error) {
                console.error("Failed to fetch referrals", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReferrals();
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

                {/* Analytics Card */}
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
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Tanggal Bergabung</th>
                                <th className="px-6 py-4">Status</th>
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
                            ) : referrals.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Users className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Belum ada konsultan yang menggunakan kode Anda.</p>
                                        <p className="text-gray-400 text-xs mt-1">Bagikan kode referral Anda sekarang!</p>
                                    </td>
                                </tr>
                            ) : (
                                referrals.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{r.full_name}</td>
                                        <td className="px-6 py-4 text-gray-500">{r.email}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Aktif
                                            </span>
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
