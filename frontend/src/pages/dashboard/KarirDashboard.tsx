import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Target, Award, Briefcase, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

interface PromotionRequest {
    id: number;
    target_role: string;
    status: string;
    created_at: string;
    note: string;
    requirements_snapshot: string;
    certificate_url: string;
}

interface EligibilityStats {
    team_size: number;
    manager_count: number;
    omset_3_months: number;
    require_team: number;
    require_omset: number;
    is_eligible: boolean;
    target_role: string;
    has_active_request: boolean;
    training_passed: boolean; // sudah lulus pelatihan (syarat HALAL_ADVISOR)
}

export default function KarirDashboard() {
    const user = useAuthStore(state => state.user);
    const [requests, setRequests] = useState<PromotionRequest[]>([]);
    const [stats, setStats] = useState<EligibilityStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        fetchAll();
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchAll = async () => {
        if (!isMounted.current) return;
        setStatsLoading(true);

        // Jalankan keduanya secara independen — satu gagal tidak memblokir yang lain
        const [statsResult, reqResult] = await Promise.allSettled([
            api.get('/promotions/eligibility'),
            api.get('/promotions/my-requests'),
        ]);

        if (!isMounted.current) return;

        if (statsResult.status === 'fulfilled') {
            setStats(statsResult.value.data);
        } else {
            // API gagal — tetap tampilkan UI dengan nilai 0 berdasarkan role
            const role = user?.role;
            if (role === 'HALAL_ADVISOR' || role === 'HALAL_MANAGER') {
                setStats({
                    team_size: 0,
                    manager_count: 0,
                    omset_3_months: 0,
                    require_team: role === 'HALAL_ADVISOR' ? 0 : 3,
                    require_omset: role === 'HALAL_ADVISOR' ? 30000000 : 150000000,
                    is_eligible: false,
                    target_role: role === 'HALAL_ADVISOR' ? 'HALAL_MANAGER' : 'HALAL_DIRECTOR',
                    has_active_request: false,
                    training_passed: false,
                });
            }
        }

        if (reqResult.status === 'fulfilled') {
            setRequests(reqResult.value.data || []);
        }

        setStatsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (user?.role === 'HALAL_ADVISOR' && !certificateFile) {
            toast.error("Harap lampirkan Sertifikat Penyelia Halal");
            return;
        }

        setIsSubmitting(true);
        try {
            let certificateURL = '';

            // Upload sertifikat terlebih dahulu jika ada
            if (certificateFile) {
                const formData = new FormData();
                formData.append('file', certificateFile);
                const uploadRes = await api.post('/media/upload?subfolder=consultant', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                certificateURL = uploadRes.data.url;
            }

            // Submit request dengan URL sertifikat
            await api.post('/promotions/request', { certificate_url: certificateURL });

            toast.success("Pengajuan promosi berhasil dikirim!");
            setCertificateFile(null);
            fetchAll();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Gagal mengajukan promosi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_VERIFICATION':
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Verifikasi</span>;
            case 'IN_TRAINING':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Award className="w-3 h-3" /> Menunggu Assessment</span>;
            case 'PASSED':
                return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Lulus & Promosi</span>;
            case 'REJECTED':
                return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Ditolak</span>;
            default:
                return null;
        }
    };

    // Untuk HALAL_MANAGER, syarat tim adalah jumlah HALAL_MANAGER di bawahnya
    const currentTeamValue = user?.role === 'HALAL_MANAGER'
        ? (stats?.manager_count ?? 0)
        : (stats?.team_size ?? 0);

    const teamLabel = user?.role === 'HALAL_MANAGER'
        ? 'Halal Manager di Tim'
        : 'Ukuran Tim (Referral)';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Jenjang Karir</h1>
                <p className="text-gray-500 text-sm mt-1">Pantau progress pencapaian Anda untuk naik ke jabatan berikutnya</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Role Card */}
                <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="w-24 h-24 text-brand-600" />
                    </div>
                    <h3 className="text-brand-900 font-bold mb-1">Jabatan Saat Ini</h3>
                    <div className="text-3xl font-black text-brand-600 mb-4">{user?.role?.replace(/_/g, ' ')}</div>
                    <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-700 font-medium">Target Promosi Berikutnya:</span>
                            <span className="font-bold text-brand-900">{(stats?.target_role ?? '—').replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        Syarat Kenaikan Jabatan
                    </h3>

                    {statsLoading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                            <div className="h-2.5 bg-gray-100 rounded-full" />
                            <div className="h-4 bg-gray-100 rounded w-3/4 mt-4" />
                            <div className="h-2.5 bg-gray-100 rounded-full" />
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Syarat Tim */}
                            {user?.role !== 'HALAL_ADVISOR' && (
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-gray-700">{teamLabel}</span>
                                        <span className={`font-bold ${currentTeamValue >= stats.require_team ? 'text-emerald-600' : 'text-gray-900'}`}>
                                            {currentTeamValue} / {stats.require_team}
                                            {currentTeamValue >= stats.require_team && ' ✓'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all ${currentTeamValue >= stats.require_team ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min((currentTeamValue / stats.require_team) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Syarat Omset */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700">Omset 3 Bulan Terakhir</span>
                                    <span className={`font-bold ${stats.omset_3_months >= stats.require_omset ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {formatRupiah(stats.omset_3_months)} / {formatRupiah(stats.require_omset)}
                                        {stats.omset_3_months >= stats.require_omset && ' ✓'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${stats.omset_3_months >= stats.require_omset ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                                        style={{ width: `${Math.min((stats.omset_3_months / stats.require_omset) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Syarat Lulus Pelatihan — hanya untuk HALAL_ADVISOR */}
                            {user?.role === 'HALAL_ADVISOR' && (
                                <div className="flex items-center justify-between text-sm py-2 px-3 rounded-xl border border-gray-100 bg-gray-50">
                                    <span className="font-medium text-gray-700">Lulus Pelatihan</span>
                                    {stats.training_passed ? (
                                        <span className="flex items-center gap-1 font-bold text-emerald-600">
                                            <CheckCircle className="w-4 h-4" /> Sudah Lulus ✓
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 font-bold text-amber-600">
                                            <Clock className="w-4 h-4" /> Belum Lulus
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Pesan jika belum eligible */}
                            {!stats.is_eligible && (
                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>Penuhi semua syarat di atas untuk dapat mengajukan promosi jabatan.</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Data tidak tersedia.</p>
                    )}
                </div>
            </div>

            {/* Form Pengajuan — hanya tampil jika eligible DAN tidak ada request aktif */}
            {stats?.is_eligible && !stats.has_active_request && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        Ajukan Promosi ke {(stats.target_role).replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Selamat! Anda telah memenuhi semua persyaratan dasar. Silakan lengkapi formulir di bawah untuk mengajukan assessment pelatihan.
                    </p>

                    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
                        {user?.role === 'HALAL_ADVISOR' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sertifikat Penyelia Halal <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm border border-gray-200 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Format: PDF, JPG, PNG (Maks 2MB)</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Promosi'}
                        </button>
                    </form>
                </div>
            )}

            {/* Notif jika ada request aktif */}
            {stats?.has_active_request && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
                    <Clock className="w-5 h-5 shrink-0" />
                    <span>Pengajuan promosi Anda sedang dalam proses. Tunggu hasil verifikasi dari admin.</span>
                </div>
            )}

            {/* Riwayat Pengajuan */}
            {requests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            Riwayat Pengajuan Promosi
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Tanggal Pengajuan</th>
                                    <th className="px-6 py-4">Target Jabatan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Sertifikat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4">{new Date(req.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{req.target_role.replace(/_/g, ' ')}</td>
                                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                                        <td className="px-6 py-4">
                                            {req.certificate_url ? (
                                                <a
                                                    href={req.certificate_url.startsWith('http') ? req.certificate_url : `${import.meta.env.VITE_API_URL}${req.certificate_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-brand-600 hover:underline text-xs font-medium"
                                                >
                                                    Lihat Sertifikat
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
