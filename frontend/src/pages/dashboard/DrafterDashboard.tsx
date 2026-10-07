import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Layers,
    FileEdit,
    BookOpen,
    Loader2,
    Calendar,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Submission } from '../../types';

export default function DrafterDashboard() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<'REVISION' | 'ACTIVE' | 'QC_REVIEW' | 'COMPLETED' | 'ALL'>('ACTIVE');
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data || []);
        } catch (err) {
            console.error('Gagal memuat daftar tugas drafter:', err);
            toast.error('Gagal memuat tugas drafter');
        } finally {
            setLoading(false);
        }
    };

    // Queues
    // 1. Perlu Revisi QC
    const revisionList = useMemo(() => {
        return submissions.filter(s => 
            s.status === 'REVISION' || 
            s.status === 'REVISION_DRAFTER' || 
            (s.status === 'DRAFTER' && Boolean(s.reject_note))
        );
    }, [submissions]);

    // 2. Aktif Dikerjakan (Drafter)
    const activeList = useMemo(() => {
        return submissions.filter(s => 
            (s.status === 'DRAFTER' || s.status === 'QC_OFFICER') && 
            !s.reject_note
        );
    }, [submissions]);

    // 3. Menunggu Review QC
    const qcReviewList = useMemo(() => {
        return submissions.filter(s => s.status === 'QC_REVIEW' || s.status === 'SUBMITTED_TO_BPJPH');
    }, [submissions]);

    // 4. Selesai
    const completedList = useMemo(() => {
        return submissions.filter(s => s.status === 'SH_TERBIT' || s.status === 'SIDANG_FATWA');
    }, [submissions]);

    // Filter displayed queue items
    const filteredQueue = useMemo(() => {
        let list: Submission[] = [];
        if (activeTab === 'REVISION') list = revisionList;
        else if (activeTab === 'ACTIVE') list = activeList;
        else if (activeTab === 'QC_REVIEW') list = qcReviewList;
        else if (activeTab === 'COMPLETED') list = completedList;
        else list = submissions;

        return list.filter(s => {
            const q = searchTerm.toLowerCase();
            const clientName = s.client?.business_name || s.client?.client_name || '';
            const matchSearch = (
                clientName.toLowerCase().includes(q) ||
                (s.tracking_number || '').toLowerCase().includes(q) ||
                (s.sihal_number || '').toLowerCase().includes(q) ||
                (s.id || '').toLowerCase().includes(q)
            );
            const matchService = !serviceFilter || s.service_type === serviceFilter;
            const matchPriority = !priorityFilter || s.priority === priorityFilter;

            return matchSearch && matchService && matchPriority;
        });
    }, [activeTab, revisionList, activeList, qcReviewList, completedList, submissions, searchTerm, serviceFilter, priorityFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                <p className="text-xs font-bold text-gray-500">Menyiapkan dashboard drafter & daftar antrean...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 px-4 sm:px-6 py-6 pb-24">
            {/* TOP HERO BANNER: Drafter Workspace Hub */}
            <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Info Drafter */}
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 backdrop-blur-md text-teal-300 text-xs font-black uppercase tracking-widest border border-teal-400/30">
                                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                                Technical Drafter & SJPH Specialist
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-gray-300 text-xs font-medium border border-white/10">
                                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                            Halo, {user?.full_name} 📝
                        </h1>
                        <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
                            Kelola berkas pengajuan halal binaan, lengkapi formulir dokumen teknis SJPH & matriks bahan, dan tindak lanjuti catatan revisi QC sebelum diserahkan ke BPJPH.
                        </p>
                    </div>

                    {/* Right: Quick Action Workspace Shortcut */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard/drafter-workspace')}
                            className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-teal-500/20"
                        >
                            <FileEdit className="w-4 h-4" />
                            <span>Buka Ruang Kerja Drafter</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={loadSubmissions}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold border border-white/20 transition-all flex items-center justify-center active:scale-95"
                            title="Refresh Antrean"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Sub-Banner Info Bar */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-gray-300">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        <span>Dokumen SJPH harus sesuai standar HAS 23000 / Kriteria Sistem Jaminan Produk Halal BPJPH.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-teal-300 font-bold">Total Tugas: {submissions.length} ajuan</span>
                    </div>
                </div>
            </div>

            {/* 4 DRAFTER KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Perlu Revisi QC */}
                <div
                    onClick={() => setActiveTab('REVISION')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        revisionList.length > 0
                            ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Perlu Revisi QC</span>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                            revisionList.length > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{revisionList.length}</p>
                        <p className="text-[10px] font-bold text-rose-700 mt-1">
                            {revisionList.length > 0 ? '⚠️ Butuh perbaikan segera' : 'Tidak ada revisi pending'}
                        </p>
                    </div>
                </div>

                {/* KPI 2: Sedang Dikerjakan */}
                <div
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        activeTab === 'ACTIVE'
                            ? 'bg-teal-50/70 border-teal-300 hover:border-teal-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sedang Dikerjakan</span>
                        <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                            <FileEdit className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{activeList.length}</p>
                        <p className="text-[10px] font-bold text-teal-700 mt-1">
                            {activeList.length > 0 ? 'Penyusunan berkas & SJPH' : 'Antrean drafting kosong'}
                        </p>
                    </div>
                </div>

                {/* KPI 3: Menunggu Review QC */}
                <div
                    onClick={() => setActiveTab('QC_REVIEW')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        activeTab === 'QC_REVIEW'
                            ? 'bg-blue-50/70 border-blue-300 hover:border-blue-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Review QC Officer</span>
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{qcReviewList.length}</p>
                        <p className="text-[10px] font-bold text-blue-700 mt-1">
                            Menunggu verifikasi QC
                        </p>
                    </div>
                </div>

                {/* KPI 4: Selesai / SH Terbit */}
                <div
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                        activeTab === 'COMPLETED'
                            ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 shadow-sm'
                            : 'bg-white border-gray-150 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Selesai / Terbit SH</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-900">{completedList.length}</p>
                        <p className="text-[10px] font-bold text-emerald-700 mt-1">
                            Lolos audit & sertifikat terbit
                        </p>
                    </div>
                </div>
            </div>

            {/* DRAFTER WORKFLOW TABS & QUEUE */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Header & Filter Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    {/* Tab Selection */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            onClick={() => setActiveTab('REVISION')}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                                activeTab === 'REVISION'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Perlu Revisi</span>
                            {revisionList.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-white text-rose-600 text-[10px] font-black">
                                    {revisionList.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('ACTIVE')}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                                activeTab === 'ACTIVE'
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Sedang Dikerjakan ({activeList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('QC_REVIEW')}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                                activeTab === 'QC_REVIEW'
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Review QC ({qcReviewList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('COMPLETED')}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                                activeTab === 'COMPLETED'
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selesai ({completedList.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                                activeTab === 'ALL'
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Semua Tugas ({submissions.length})</span>
                        </button>
                    </div>

                    {/* Filter Inputs */}
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                        >
                            <option value="">Semua Layanan</option>
                            <option value="REGULER">Reguler</option>
                            <option value="SELF_DECLARE">Self Declare</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                        >
                            <option value="">Semua Prioritas</option>
                            <option value="HIGH">Prioritas Tinggi</option>
                            <option value="NORMAL">Normal</option>
                        </select>

                        <div className="relative w-full sm:w-60">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nama usaha / tracking..."
                                className="pl-8 pr-3 py-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Queue Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQueue.map((sub) => {
                        const isRevision = sub.status === 'REVISION' || sub.status === 'REVISION_DRAFTER' || Boolean(sub.reject_note);
                        const clientName = sub.client?.business_name || sub.client?.client_name || 'Klien Sistem';
                        const serviceBadgeColor = sub.service_type === 'REGULER' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-teal-50 text-teal-700 border-teal-200';

                        return (
                            <div
                                key={sub.id}
                                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                                    isRevision
                                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                                        : 'bg-white border-gray-150 hover:border-teal-300'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Card Top: Badges & Priority */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${serviceBadgeColor}`}>
                                                {sub.service_type || 'REGULER'}
                                            </span>
                                            {sub.priority === 'HIGH' && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                                                    Priority
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400 font-bold truncate">
                                            {sub.tracking_number || `#${sub.id.slice(0, 8)}`}
                                        </span>
                                    </div>

                                    {/* Business Title & Details */}
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 leading-snug truncate" title={clientName}>
                                            {clientName}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                            {sub.client?.client_name ? `Pemilik: ${sub.client.client_name}` : 'Pelaku Usaha'}
                                        </p>
                                    </div>

                                    {/* If Revision Note Exists */}
                                    {sub.reject_note && (
                                        <div className="p-3 bg-rose-100/70 border border-rose-200 rounded-2xl text-xs space-y-1">
                                            <div className="flex items-center gap-1 text-rose-800 font-black text-[10px] uppercase tracking-wider">
                                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                                <span>Catatan Revisi QC:</span>
                                            </div>
                                            <p className="text-rose-900 text-xs font-medium line-clamp-2 leading-relaxed">
                                                {sub.reject_note}
                                            </p>
                                        </div>
                                    )}

                                    {/* Meta info */}
                                    <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-500 font-medium">
                                        <div>
                                            <span className="text-gray-400 block text-[10px]">Status Berkas</span>
                                            <span className="font-bold text-gray-800">{sub.status.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-[10px]">Tgl Masuk</span>
                                            <span className="font-bold text-gray-800">{new Date(sub.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer: Fast Jump Button */}
                                <div className="pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => navigate(`/dashboard/drafter-workspace?id=${sub.id}`)}
                                        className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                                            isRevision
                                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                                        }`}
                                    >
                                        <FileEdit className="w-4 h-4" />
                                        <span>{isRevision ? 'Buka & Perbaiki di Workspace' : 'Buka di Workspace'}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredQueue.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-400 space-y-3">
                            <ShieldCheck className="w-12 h-12 mx-auto text-gray-300" />
                            <p className="text-sm font-bold text-gray-500">Tidak ada pengajuan pada tab ini</p>
                            <p className="text-xs text-gray-400">Semua tugas pada antrean ini telah diproses atau belum ada penugasan baru.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK SJPH & HALAL REFERENCE HELPER BOX */}
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-[10px] font-black uppercase tracking-wider border border-white/10">
                        <BookOpen className="w-3.5 h-3.5" />
                        Pusat Referensi Teknis Drafter
                    </div>
                    <h3 className="text-lg font-black text-white">Panduan Penyusunan Dokumen & SJPH Standar</h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                        Pastikan seluruh data NIB, diagram alir proses produksi, daftar bahan baku & matriks halal telah sesuai dengan kriteria yang disyaratkan oleh LPH dan BPJPH.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={() => navigate('/dashboard/drafter-workspace')}
                        className="px-5 py-3 rounded-2xl bg-white text-slate-950 hover:bg-gray-100 font-black text-xs transition-all shadow-md active:scale-95"
                    >
                        Masuk Ruang Kerja
                    </button>
                </div>
            </div>
        </div>
    );
}
