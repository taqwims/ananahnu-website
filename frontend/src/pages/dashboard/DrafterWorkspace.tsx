import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    FileText, 
    CheckCircle2, 
    Clock, 
    Search, 
    Loader2, 
    User, 
    Building2, 
    ShieldCheck, 
    Upload, 
    ExternalLink, 
    Info, 
    ArrowLeft,
    CheckCircle,
    Calendar,
    Eye
} from 'lucide-react';
import api from '../../services/api';
import type { Submission, FormFieldValue } from '../../types';
import { formatServiceType } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import FileUpload from '../../components/dashboard/FileUpload';

export default function DrafterWorkspace() {
    const location = useLocation();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubId, setActiveSubId] = useState<string | null>(new URLSearchParams(location.search).get('id'));
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Details for active submission
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [fieldValues, setFieldValues] = useState<FormFieldValue[]>([]);
    // Removed loadingDetail

    // Form states for actions
    const [auditDate, setAuditDate] = useState('');

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            // Backend should filter by assigned_drafter_id for DRAFTER role
            const res = await api.get('/submissions?status=DRAFTER');
            setSubmissions(res.data || []);
        } catch (err) {
            toast.error("Gagal memuat daftar tugas");
        } finally {
            setLoading(false);
        }
    };

    const loadDetail = async (id: string) => {
        try {
            const [subRes, fieldsRes] = await Promise.all([
                api.get(`/submissions/${id}`),
                api.get(`/submission-fields/${id}`)
            ]);
            setActiveSubmission(subRes.data);
            setFieldValues(fieldsRes.data || []);
            if (subRes.data.audit_date) {
                setAuditDate(new Date(subRes.data.audit_date).toISOString().split('T')[0]);
            } else {
                setAuditDate('');
            }
        } catch (err) {
            toast.error("Gagal memuat detail pengajuan");
        } finally {
            // End loading
        }
    };

    useEffect(() => {
        if (activeSubId) {
            loadDetail(activeSubId);
        } else {
            setActiveSubmission(null);
            setFieldValues([]);
        }
    }, [activeSubId]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => 
            s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase())
        );
    }, [submissions, search]);

    const handleAction = async (action: 'audit-info' | 'audit-result' | 'approve' | 'reject') => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            if (action === 'audit-info') {
                await api.post(`/submissions/${activeSubmission.id}/audit-info`, { audit_date: auditDate });
                toast.success("Informasi audit diperbarui");
            } else if (action === 'approve') {
                await api.post(`/submissions/${activeSubmission.id}/approve`);
                toast.success("Pengajuan diteruskan ke QC Review");
                setActiveSubId(null);
                loadSubmissions();
            }
            await loadDetail(activeSubmission.id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal memproses aksi");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menyiapkan Ruang Kerja...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
            {/* Left Sidebar: Task List */}
            <div className={`w-80 flex flex-col glass-panel p-0 overflow-hidden border-white/60 shadow-xl transition-all ${activeSubId ? 'hidden xl:flex' : 'flex w-full sm:w-80'}`}>
                <div className="p-4 border-b border-gray-100 space-y-4 bg-white/40">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        Tugas Saya
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Cari Bisnis..."
                            className="w-full pl-10 pr-4 py-2 bg-white/60 border-none rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredSubmissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic text-sm">
                            Tidak ada tugas pengerjaan
                        </div>
                    ) : (
                        filteredSubmissions.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSubId(sub.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all group ${
                                    activeSubId === sub.id 
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]' 
                                    : 'hover:bg-white/80 text-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                                        activeSubId === sub.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'
                                    }`}>
                                        {formatServiceType(sub.service_type)}
                                    </span>
                                    <span className={`text-[8px] font-medium ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-400'}`}>
                                        #{sub.id.split('-')[0]}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm truncate">{sub.client?.business_name}</h3>
                                <p className={`text-[10px] truncate ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-500'}`}>
                                    {sub.client?.client_name}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side: Focus Workspace */}
            <div className="flex-1 flex flex-col min-w-0">
                <AnimatePresence mode="wait">
                    {!activeSubId ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 glass-panel flex flex-col items-center justify-center text-center p-12 border-white/40 shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-brand-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-brand-600 animate-pulse">
                                <ShieldCheck className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Pilih Tugas untuk Memulai</h2>
                            <p className="text-gray-500 max-w-sm font-medium">
                                Gunakan panel di sebelah kiri untuk memilih pengajuan yang ingin Anda proses atau review.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key={activeSubId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col overflow-hidden gap-6"
                        >
                            {/* Workspace Header */}
                            <div className="glass-panel p-4 flex items-center justify-between border-white/60 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setActiveSubId(null)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors xl:hidden"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-black text-gray-900 tracking-tight">
                                                {activeSubmission?.client?.business_name}
                                            </h2>
                                            <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[8px] font-black uppercase tracking-widest rounded-md">
                                                {activeSubmission?.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium">ID: {activeSubmission?.id}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleAction('approve')}
                                        disabled={processing || !activeSubmission?.audit_result_1_url}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Tandai Selesai (Kirim ke QC)
                                    </button>
                                </div>
                            </div>

                            {/* Main Workspace Content: Split Pane */}
                            <div className="flex-1 flex gap-6 overflow-hidden">
                                {/* Left Panel: Reference Data */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                                    {/* Client Basic Info */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1 h-5 bg-brand-600 rounded-full" />
                                            <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Informasi Dasar Klien</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <InfoBox label="Nama Pemilik" value={activeSubmission?.client?.client_name} icon={User} />
                                            <InfoBox label="NIB" value={activeSubmission?.client?.nib} icon={Building2} mono />
                                            <InfoBox label="NIK" value={activeSubmission?.client?.nik} icon={Building2} mono />
                                            <InfoBox label="Produk" value={activeSubmission?.client?.product_name} icon={FileText} />
                                        </div>
                                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Alamat Lengkap</span>
                                            <p className="text-xs text-gray-700 leading-relaxed font-medium">{activeSubmission?.client?.address}</p>
                                        </div>
                                    </div>

                                    {/* Document References */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                            <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Dokumen & Bukti Pendukung</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {fieldValues.map(fv => (
                                                <div key={fv.id} className="p-3 bg-white/60 rounded-2xl border border-gray-100 hover:border-brand-200 transition-all flex items-center justify-between group shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-brand-50 transition-colors">
                                                            <FileText className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <span className="text-[10px] font-bold text-gray-700 block truncate">{fv.form_field.field_label}</span>
                                                            <span className="text-[8px] text-gray-400 font-medium">{fv.text_value || 'File Uploaded'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {fv.file_url && (
                                                            <a 
                                                                href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {fv.link_value && (
                                                            <a 
                                                                href={fv.link_value} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="p-2 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 transition-all"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel: Drafter Action Area */}
                                <div className="w-[400px] flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6">
                                    {/* Action 1: Audit Info */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl bg-amber-50/20">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1 h-5 bg-amber-600 rounded-full" />
                                            <h3 className="font-black text-amber-900 uppercase text-[10px] tracking-widest">Penjadwalan Audit</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1.5">Tanggal Audit</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                                    <input 
                                                        type="date"
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-100 rounded-xl text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium"
                                                        value={auditDate}
                                                        onChange={e => setAuditDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleAction('audit-info')}
                                                disabled={processing || !auditDate}
                                                className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 disabled:opacity-50"
                                            >
                                                {processing ? 'Memproses...' : 'Simpan Jadwal'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action 2: Audit Results Upload */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl bg-indigo-50/20">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                                            <h3 className="font-black text-indigo-900 uppercase text-[10px] tracking-widest">Laporan Hasil Audit</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black text-indigo-700 uppercase tracking-widest">Hasil Audit 1 (Utama) *</label>
                                                <FileUpload 
                                                    subfolder="audit" 
                                                    label={activeSubmission?.audit_result_1_url ? "Ganti File 1" : "Upload Laporan 1"}
                                                    onUploadSuccess={async (url) => {
                                                        try {
                                                            await api.post(`/submissions/${activeSubmission?.id}/audit-result`, { 
                                                                url1: url, 
                                                                url2: activeSubmission?.audit_result_2_url || "" 
                                                            });
                                                            loadDetail(activeSubmission!.id);
                                                            toast.success("Laporan 1 berhasil diunggah");
                                                        } catch (err) {
                                                            toast.error("Gagal menyimpan file");
                                                        }
                                                    }}
                                                />
                                                {activeSubmission?.audit_result_1_url && (
                                                    <div className="flex items-center gap-2 p-2 bg-white/60 rounded-xl border border-indigo-100">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[9px] font-bold text-gray-700 truncate">Laporan_1_Audit.pdf</span>
                                                        <a href={`${import.meta.env.VITE_API_URL}${activeSubmission.audit_result_1_url}`} target="_blank" rel="noreferrer" className="ml-auto p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600">
                                                            <Eye className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-black text-indigo-700 uppercase tracking-widest">Hasil Audit 2 (Opsional)</label>
                                                <FileUpload 
                                                    subfolder="audit" 
                                                    label={activeSubmission?.audit_result_2_url ? "Ganti File 2" : "Upload Laporan 2"}
                                                    onUploadSuccess={async (url) => {
                                                        try {
                                                            await api.post(`/submissions/${activeSubmission?.id}/audit-result`, { 
                                                                url1: activeSubmission?.audit_result_1_url || "", 
                                                                url2: url 
                                                            });
                                                            loadDetail(activeSubmission!.id);
                                                            toast.success("Laporan 2 berhasil diunggah");
                                                        } catch (err) {
                                                            toast.error("Gagal menyimpan file");
                                                        }
                                                    }}
                                                />
                                                {activeSubmission?.audit_result_2_url && (
                                                    <div className="flex items-center gap-2 p-2 bg-white/60 rounded-xl border border-indigo-100">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[9px] font-bold text-gray-700 truncate">Laporan_2_Audit.pdf</span>
                                                        <a href={`${import.meta.env.VITE_API_URL}${activeSubmission.audit_result_2_url}`} target="_blank" rel="noreferrer" className="ml-auto p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600">
                                                            <Eye className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action 3: Status Summary & Info */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl bg-gray-50/40">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Info className="w-4 h-4 text-gray-400" />
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Panduan Pengerjaan</h3>
                                        </div>
                                        <ul className="space-y-3">
                                            <StepItem icon={Clock} text="Review dokumen klien di panel kiri" active />
                                            <StepItem icon={Calendar} text="Tentukan & simpan jadwal audit" active={!!activeSubmission?.audit_date} />
                                            <StepItem icon={Upload} text="Upload minimal 1 file hasil audit" active={!!activeSubmission?.audit_result_1_url} />
                                            <StepItem icon={CheckCircle2} text="Klik 'Tandai Selesai' untuk meneruskan" active={false} />
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function InfoBox({ label, value, icon: Icon, mono = false }: { label: string, value?: string, icon: any, mono?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Icon className="w-2.5 h-2.5" />
                {label}
            </span>
            <p className={`text-xs font-bold text-gray-800 truncate ${mono ? 'font-mono' : ''}`}>
                {value || '-'}
            </p>
        </div>
    );
}

function StepItem({ icon: Icon, text, active }: { icon: any, text: string, active: boolean }) {
    return (
        <li className={`flex items-center gap-3 text-[10px] font-medium transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-lg ${active ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                <Icon className="w-3 h-3" />
            </div>
            {text}
            {active && <CheckCircle className="w-3 h-3 ml-auto" />}
        </li>
    );
}
