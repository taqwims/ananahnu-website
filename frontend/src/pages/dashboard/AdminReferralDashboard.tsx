import { useState, useEffect } from 'react';
import { Users, TrendingUp, Search, Download } from 'lucide-react';
import api from '../../services/api';

interface ReferralStat {
    id: string;
    full_name: string;
    email: string;
    referral_code: string;
    role_name: string;
    total_referred: number;
}

export default function AdminReferralDashboard() {
    const [stats, setStats] = useState<ReferralStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/users/referrals/analytics');
                setStats(response.data || []);
            } catch (error) {
                console.error("Failed to fetch referral analytics", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const filteredStats = stats.filter(s => 
        s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        s.referral_code?.toLowerCase().includes(search.toLowerCase())
    );

    const totalReferrals = stats.reduce((acc, curr) => acc + (curr.total_referred || 0), 0);
    const activeReferrers = stats.filter(s => s.total_referred > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analitik Referral Global</h1>
                    <p className="text-gray-500 text-sm mt-1">Pantau performa kode referral seluruh koordinator dan konsultan</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Pemilik Kode</p>
                        <p className="text-2xl font-black text-gray-900">{stats.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Akun Ter-referensi</p>
                        <p className="text-2xl font-black text-gray-900">{totalReferrals}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Referrer Aktif</p>
                        <p className="text-2xl font-black text-gray-900">{activeReferrers}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        Leaderboard Referral
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau kode..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none w-full sm:w-64"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Peringkat</th>
                                <th className="px-6 py-4">Nama Referrer</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Kode Referral</th>
                                <th className="px-6 py-4 text-right">Total Diundang</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        Memuat analitik...
                                    </td>
                                </tr>
                            ) : filteredStats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredStats.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {idx < 3 ? (
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    #{idx + 1}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-medium px-2">#{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{r.full_name}</div>
                                            <div className="text-xs text-gray-500">{r.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                                                {r.role_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="px-2 py-1 bg-gray-50 text-brand-700 rounded font-bold border border-gray-200">
                                                {r.referral_code}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-lg font-black ${r.total_referred > 0 ? 'text-brand-600' : 'text-gray-400'}`}>
                                                {r.total_referred}
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
