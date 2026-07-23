import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Award, 
    Search, 
    Upload, 
    CheckCircle, 
    Clock, 
    FileText, 
    ExternalLink, 
    Loader2, 
    X,
    Eye,
    ShieldCheck,
    RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import { submissionService } from '../../services/submissionService';
import type { Submission } from '../../types';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/compressor';

export default function SHWorkspace() {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('');

    // Modal state for issuing SH
    const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
    const [shFile, setShFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data || []);
        } catch (err) {
            console.error('Failed to load submissions:', err);
            toast.error('Gagal memuat data pengajuan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    // Filter submissions
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            // Tab filter
            if (activeTab === 'pending') {
                if (sub.status !== 'SUBMITTED_TO_BPJPH' && sub.status !== 'SIDANG_FATWA') return false;
            } else if (activeTab === 'completed') {
                if (sub.status !== 'SH_TERBIT') return false;
            }

            // Service type filter
            if (serviceTypeFilter && sub.service_type !== serviceTypeFilter) {
                return false;
            }

            // Search filter
            if (search.trim()) {
                const q = search.toLowerCase();
                const bName = (sub.client?.business_name || (sub as any).business_name || '').toLowerCase();
                const cName = (sub.client?.client_name || '').toLowerCase();
                const trackNo = (sub.tracking_number || sub.id || '').toLowerCase();
                return bName.includes(q) || cName.includes(q) || trackNo.includes(q);
            }

            return true;
        });
    }, [submissions, activeTab, serviceTypeFilter, search]);

    // Counts
    const pendingCount = useMemo(() => {
        return submissions.filter(s => s.status === 'SUBMITTED_TO_BPJPH' || s.status === 'SIDANG_FATWA').length;
    }, [submissions]);

    const completedCount = useMemo(() => {
        return submissions.filter(s => s.status === 'SH_TERBIT').length;
    }, [submissions]);

    // Handle Issue SH
    const handleIssueSH = async () => {
        if (!selectedSub || !shFile) {
            toast.error('Silakan pilih file Sertifikat Halal terlebih dahulu');
            return;
        }

        setUploading(true);
        let finalFile = shFile;

        // Compress if image
        if (finalFile.type.startsWith('image/')) {
            try {
                finalFile = await compressImage(finalFile);
            } catch (e) {
                console.error('Compression failed:', e);
            }
        }

        if (finalFile.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file tidak boleh lebih dari 5MB');
            setUploading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', finalFile);

            const uploadRes = await api.post(`/media/upload?subfolder=sh_certificates`, formData);
            const fileUrl = uploadRes.data?.url;

            if (!fileUrl) {
                throw new Error('Gagal mendapatkan URL file yang diunggah');
            }

            await submissionService.issueSH(selectedSub.id, fileUrl);
            toast.success('Sertifikat Halal berhasil diterbitkan!');
            setSelectedSub(null);
            setShFile(null);
            loadSubmissions();
        } catch (err: any) {
            console.error('Issue SH Error:', err);
            toast.error(err.response?.data?.error || err.message || 'Gagal menerbitkan Sertifikat Halal');
        } finally {
            setUploading(false);
        }
    };

    const handleRevokeSH = async (subId: string) => {
        if (!window.confirm('Apakah Anda yakin ingin membatalkan penerbitan SH ini untuk mengganti file yang salah? Status akan dikembalikan ke BPJPH agar Anda dapat mengunggah file baru.')) return;
        try {
            await submissionService.revokeSH(subId);
            toast.success('Penerbitan SH berhasil dibatalkan. Silakan unggah file baru.');
            loadSubmissions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Gagal membatalkan penerbitan SH');
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header Banner */}
            <div className="glass-panel p-6 sm:p-8 shadow-xl border border-white/60 bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900 text-white rounded-3xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                            <Award className="w-4 h-4 text-emerald-400" />
                            Ruang Kerja Legal & Finance
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Penerbitan Sertifikat Halal (SH)
                        </h1>
                        <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
                            Kelola verifikasi keuangan dan terbitkan Sertifikat Halal resmi untuk pengajuan yang telah selesai diproses.
                        </p>
                    </div>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                    onClick={() => setActiveTab('pending')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-md ${
                        activeTab === 'pending'
                            ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                            : 'bg-white/70 hover:bg-white border-white/60'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menunggu Terbit SH</p>
                            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
                        </div>
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Status: SUBMITTED_TO_BPJPH / SIDANG_FATWA</p>
                </div>

                <div 
                    onClick={() => setActiveTab('completed')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-md ${
                        activeTab === 'completed'
                            ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                            : 'bg-white/70 hover:bg-white border-white/60'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">SH Sudah Terbit</p>
                            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Sertifikat Halal resmi telah diunggah</p>
                </div>

                <div 
                    onClick={() => setActiveTab('all')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-md ${
                        activeTab === 'all'
                            ? 'bg-blue-500/10 border-blue-500/40 ring-2 ring-blue-500/20'
                            : 'bg-white/70 hover:bg-white border-white/60'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pengajuan</p>
                            <h3 className="text-2xl font-black text-blue-600 mt-1">{submissions.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Semua status pengajuan</p>
                </div>
            </div>

            {/* Filter and Control Bar */}
            <div className="glass-panel p-4 shadow-lg border border-white/60 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Cari usaha, klien, tracking no..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/70 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Tab Selection Pills */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Menunggu Terbit ({pendingCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab('completed')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                activeTab === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Terbit ({completedCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                activeTab === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Semua ({submissions.length})
                        </button>
                    </div>

                    {/* Service Type Filter */}
                    <select
                        value={serviceTypeFilter}
                        onChange={e => setServiceTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-white/70 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                        <option value="">Semua Layanan</option>
                        <option value="REGULER">REGULER</option>
                        <option value="SELF_DECLARE">SELF DECLARE</option>
                    </select>
                </div>
            </div>

            {/* Submissions List Table */}
            <div className="glass-panel shadow-xl border border-white/60 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
                        <p className="text-xs font-bold text-gray-500">Memuat data pengajuan...</p>
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="p-12 text-center">
                        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-gray-700">Tidak ada pengajuan ditemukan</h4>
                        <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian Anda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                    <th className="p-4">Tracking / Usaha</th>
                                    <th className="p-4">Pemilik / Klien</th>
                                    <th className="p-4">Layanan</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Sertifikat Halal</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {filteredSubmissions.map(sub => {
                                    const bName = sub.client?.business_name || (sub as any).business_name || 'Tanpa Nama Usaha';
                                    const cName = sub.client?.client_name || '-';
                                    const isPendingSH = sub.status === 'SUBMITTED_TO_BPJPH' || sub.status === 'SIDANG_FATWA';
                                    const isSHTerbit = sub.status === 'SH_TERBIT';

                                    return (
                                        <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-extrabold text-gray-800">{bName}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                    No: {sub.tracking_number || sub.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-700">{cName}</div>
                                                <div className="text-[10px] text-gray-400">{sub.client?.phone || '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    sub.service_type === 'REGULER' 
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                }`}>
                                                    {sub.service_type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    isSHTerbit ? 'bg-emerald-100 text-emerald-800' :
                                                    sub.status === 'SUBMITTED_TO_BPJPH' ? 'bg-blue-100 text-blue-800' :
                                                    sub.status === 'SIDANG_FATWA' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {sub.sh_url ? (
                                                    <a 
                                                        href={`${import.meta.env.VITE_API_URL}${sub.sh_url}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        Lihat Sertifikat
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 italic">Belum terbit</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                        className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl border border-gray-200 transition-all flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Detail
                                                    </button>
                                                    
                                                    {isPendingSH && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedSub(sub);
                                                                setShFile(null);
                                                            }}
                                                            className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" /> Terbitkan SH
                                                        </button>
                                                    )}

                                                    {isSHTerbit && (
                                                        <button 
                                                            onClick={() => handleRevokeSH(sub.id)}
                                                            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center gap-1"
                                                            title="Batalkan / Ganti File SH"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" /> Batalkan / Ganti SH
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Issue SH Modal */}
            {selectedSub && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-6 border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-emerald-600" />
                                    Terbitkan Sertifikat Halal
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Usaha: <strong className="text-gray-700">{selectedSub.client?.business_name || (selectedSub as any).business_name}</strong>
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedSub(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs leading-relaxed">
                                Upload dokumen resmi Sertifikat Halal (PDF / Gambar) yang diterbitkan BPJPH untuk melengkapi pengajuan ini dan mengubah status menjadi <strong>SH_TERBIT</strong>.
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Pilih File Sertifikat Halal
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={e => setShFile(e.target.files?.[0] || null)}
                                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                                />
                                {shFile && (
                                    <p className="text-xs text-emerald-600 font-bold mt-1">
                                        File terpilih: {shFile.name} ({(shFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button 
                                onClick={() => setSelectedSub(null)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleIssueSH}
                                disabled={!shFile || uploading}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {uploading ? 'Mengunggah & Memproses...' : 'Konfirmasi & Terbitkan SH'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
