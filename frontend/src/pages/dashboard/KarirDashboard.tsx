import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Target, Award, Briefcase, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

interface PromotionRequest {
    id: number;
    target_role: string;
    status: string;
    created_at: string;
    note: string;
    requirements_snapshot: string;
}

export default function KarirDashboard() {
    const user = useAuthStore(state => state.user);
    const [requests, setRequests] = useState<PromotionRequest[]>([]);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dummy progress values. In a real scenario, this would come from an endpoint that returns the current eligibility stats.
    const [stats, setStats] = useState({
        teamSize: 0,
        omset3Bulan: 0
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/promotions/my-requests');
            setRequests(res.data || []);
            // Here we would also fetch the actual stats for the progress bars
            // For now, we simulate them.
            setStats({
                teamSize: user?.role === 'HALAL_ADVISOR' ? 12 : 3, // Simulate ready for promotion
                omset3Bulan: user?.role === 'HALAL_ADVISOR' ? 35000000 : 160000000
            });
        } catch (error) {
            console.error("Failed to fetch promotions", error);
        }
    };

    const targetRole = user?.role === 'HALAL_ADVISOR' ? 'HALAL_MANAGER' : 'HALAL_DIRECTOR';
    const requirementTeam = user?.role === 'HALAL_ADVISOR' ? 10 : 3;
    const requirementOmset = user?.role === 'HALAL_ADVISOR' ? 30000000 : 150000000;
    
    const isEligible = stats.teamSize >= requirementTeam && stats.omset3Bulan >= requirementOmset;
    const hasPendingRequest = requests.some(r => r.status === 'PENDING_VERIFICATION' || r.status === 'IN_TRAINING');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (user?.role === 'HALAL_ADVISOR' && !certificateFile) {
            toast.error("Harap lampirkan Sertifikat Penyelia Halal");
            return;
        }

        setIsSubmitting(true);
        try {
            // First submit the request
            await api.post('/promotions/request');
            
            // If there's a file, we could upload it here and update the request.
            // For now, we assume the backend handles it or we skip the file upload in this dummy block.
            if (certificateFile) {
                const formData = new FormData();
                formData.append('file', certificateFile);
                // const uploadRes = await api.post('/media/upload', formData);
                // Update request with url...
            }

            toast.success("Pengajuan promosi berhasil dikirim!");
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Gagal mengajukan promosi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'PENDING_VERIFICATION':
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending Verifikasi</span>;
            case 'IN_TRAINING':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Award className="w-3 h-3"/> Menunggu Assesment</span>;
            case 'PASSED':
                return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Lulus & Promosi</span>;
            case 'REJECTED':
                return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Ditolak</span>;
            default:
                return null;
        }
    };

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
                    <div className="text-3xl font-black text-brand-600 mb-4">{user?.role?.replace('_', ' ')}</div>
                    
                    <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-brand-700 font-medium">Target Promosi Berikutnya:</span>
                            <span className="font-bold text-brand-900">{targetRole.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        Syarat Kenaikan Jabatan
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Ukuran Tim (Referral)</span>
                                <span className="font-bold text-gray-900">{stats.teamSize} / {requirementTeam}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min((stats.teamSize / requirementTeam) * 100, 100)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Omset 3 Bulan Terakhir</span>
                                <span className="font-bold text-gray-900">{formatRupiah(stats.omset3Bulan)} / {formatRupiah(requirementOmset)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min((stats.omset3Bulan / requirementOmset) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Section */}
            {isEligible && !hasPendingRequest && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        Ajukan Promosi ke {targetRole.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Selamat! Anda telah memenuhi semua persyaratan dasar untuk promosi jabatan. Silakan lengkapi formulir di bawah ini untuk mengajukan *assessment* pelatihan.</p>

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
                                <p className="text-xs text-gray-400 mt-1">Format: PDF, JPG, PNG (Max 5MB)</p>
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

            {/* History Table */}
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4">{new Date(req.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{req.target_role.replace('_', ' ')}</td>
                                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
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
