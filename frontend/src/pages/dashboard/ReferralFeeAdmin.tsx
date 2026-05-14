import { useState, useEffect } from 'react';
import { 
    DollarSign, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Save
} from 'lucide-react';
import api from '../../services/api';
import { formatRupiah } from '../../utils/format';

interface ReferralCommission {
    id: string;
    referrer_id: string;
    referrer?: {
        full_name: string;
        email: string;
        phone?: string;
        address?: string;
    };
    referred_id: string;
    referred?: {
        full_name: string;
        email: string;
        phone?: string;
        address?: string;
    };
    submission_id: string;
    submission?: {
        tracking_number: string;
        client?: {
            business_name: string;
        };
    };
    amount: number;
    status: 'PENDING' | 'PAID';
    paid_at?: string;
    created_at: string;
}

const ReferralFeeAdmin = () => {
    const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [referralFee, setReferralFee] = useState<string>('0');
    const [isSavingFee, setIsSavingFee] = useState(false);

    useEffect(() => {
        fetchCommissions();
        fetchSetting();
    }, [statusFilter]);

    const fetchCommissions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/billing/referral-commissions?status=${statusFilter}`);
            setCommissions(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch commissions');
        } finally {
            setLoading(false);
        }
    };

    const fetchSetting = async () => {
        try {
            const response = await api.get('/system-settings/REFERRAL_FEE_PER_SH');
            setReferralFee(response.data.value || '0');
        } catch (err) {
            console.error('Failed to fetch fee setting');
        }
    };

    const saveSetting = async () => {
        try {
            setIsSavingFee(true);
            await api.put('/system-settings', {
                key: 'REFERRAL_FEE_PER_SH',
                value: referralFee
            });
            alert('Fee referral berhasil disimpan!');
        } catch (err: any) {
            alert('Gagal menyimpan fee: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSavingFee(false);
        }
    };

    const markAsPaid = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menandai komisi ini sebagai SUDAH DIBAYAR?')) return;

        try {
            await api.put(`/billing/referral-commissions/${id}/pay`);
            fetchCommissions();
        } catch (err: any) {
            alert('Gagal memperbarui status: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Fee Referral</h1>
                    <p className="text-gray-500 text-sm">Kelola komisi untuk konsultan yang mereferensikan user baru</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                    <button 
                        onClick={() => setError(null)}
                        className="ml-auto text-red-400 hover:text-red-600"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Config Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold">Pengaturan Besaran Fee</h2>
                </div>
                <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fee per SH Terbit (Rp)
                        </label>
                        <input
                            type="number"
                            value={referralFee}
                            onChange={(e) => setReferralFee(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                            placeholder="Contoh: 50000"
                        />
                    </div>
                    <button
                        onClick={saveSetting}
                        disabled={isSavingFee}
                        className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSavingFee ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    * Fee ini akan otomatis dicatat sebagai komisi 'PENDING' ketika SH terbit dan tagihan dibayar.
                </p>
            </div>

            {/* Commissions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-semibold">Daftar Komisi</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Semua Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Sudah Dibayar</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-medium">
                            <tr>
                                <th className="px-6 py-4">Referrer (Penerima Fee)</th>
                                <th className="px-6 py-4">User Ter-referensi</th>
                                <th className="px-6 py-4">Submission / SH</th>
                                <th className="px-6 py-4">Jumlah</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            ) : commissions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="w-8 h-8" />
                                            <p>Belum ada data komisi referral</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                commissions.map((comm) => (
                                    <tr key={comm.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {comm.referrer?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{comm.referrer?.full_name}</p>
                                                    <p className="text-[10px] text-gray-500">{comm.referrer?.email}</p>
                                                    <p className="text-[10px] text-brand-600 font-bold">{comm.referrer?.phone || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 font-medium">{comm.referred?.full_name}</p>
                                            <p className="text-[10px] text-gray-500">{comm.referred?.email}</p>
                                            <p className="text-[10px] text-brand-600 font-bold">{comm.referred?.phone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded self-start mb-1">
                                                    {comm.submission?.tracking_number}
                                                </span>
                                                <span className="text-xs text-gray-600 truncate max-w-[150px]">
                                                    {comm.submission?.client?.business_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">{formatRupiah(comm.amount)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {comm.status === 'PAID' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    LUNAS
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock className="w-3 h-3" />
                                                    PENDING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-gray-500">
                                                <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                                                {comm.paid_at && (
                                                    <span className="text-[10px] text-green-600 italic">Dibayar: {new Date(comm.paid_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {comm.status === 'PENDING' && (
                                                <button
                                                    onClick={() => markAsPaid(comm.id)}
                                                    className="text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
                                                >
                                                    Bayar Fee
                                                </button>
                                            )}
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
};

export default ReferralFeeAdmin;
