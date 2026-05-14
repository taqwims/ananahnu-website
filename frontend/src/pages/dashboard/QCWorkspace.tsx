import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Search, 
    FileText, 
    CheckCircle2, 
    XCircle,
    Maximize2, 
    Minimize2, 
    Loader2, 
    Building2, 
    User as UserIcon, 
    UserPlus,
    ShieldCheck, 
    ArrowLeft,
    Calendar,
    Edit3,
    X,
    Save,
    Eye,
    ExternalLink,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import type { Submission, FormFieldValue, User } from '../../types';
import toast from 'react-hot-toast';
import FileUpload from '../../components/dashboard/FileUpload';
import { formatServiceType } from '../../utils/format';
import Modal from '../../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export default function QCWorkspace() {
    const location = useLocation();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubId, setActiveSubId] = useState<string | null>(new URLSearchParams(location.search).get('id'));
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    
    // Distribution state
    const [drafters, setDrafters] = useState<User[]>([]);
    const [selectedDrafter, setSelectedDrafter] = useState('');
    const [consultants, setConsultants] = useState<User[]>([]);
    const [selectedConsultant, setSelectedConsultant] = useState('');
    
    // Rejection state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    
    // Client Edit States
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [isEditingDocs, setIsEditingDocs] = useState(false);
    const [clientForm, setClientForm] = useState({
        business_name: '',
        client_name: '',
        nib: '',
        nik: '',
        product_name: '',
        address: ''
    });

    // Details for active submission
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    const [fieldValues, setFieldValues] = useState<FormFieldValue[]>([]);
    const [auditDate, setAuditDate] = useState('');
    const [isEditingAudit, setIsEditingAudit] = useState(false);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            // QC reviews submissions in QC_OFFICER, QC_REVIEW and SIDANG_FATWA status
            const [qcOffRes, qcRevRes, fatwaRes, drafterRes, consultantRes] = await Promise.all([
                api.get('/submissions?status=QC_OFFICER'),
                api.get('/submissions?status=QC_REVIEW'),
                api.get('/submissions?status=SIDANG_FATWA'),
                api.get('/admin/users/drafters'),
                api.get('/admin/users?role=HALAL_KONSULTAN')
            ]);
            
            const allTasks = [
                ...(qcOffRes.data || []), 
                ...(qcRevRes.data || []), 
                ...(fatwaRes.data || [])
            ];
            setSubmissions(allTasks);
            setDrafters(drafterRes.data || []);
            setConsultants(consultantRes.data?.users || []);
        } catch (err) {
            toast.error("Gagal memuat daftar tugas QC");
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
            if (subRes.data.client) {
                setClientForm({
                    business_name: subRes.data.client.business_name || '',
                    client_name: subRes.data.client.client_name || '',
                    nib: subRes.data.client.nib || '',
                    nik: subRes.data.client.nik || '',
                    product_name: subRes.data.client.product_name || '',
                    address: subRes.data.client.address || ''
                });
            }
            if (subRes.data.audit_date) {
                setAuditDate(new Date(subRes.data.audit_date).toISOString().split('T')[0]);
            } else {
                setAuditDate('');
            }
        } catch (err) {
            toast.error("Gagal memuat detail pengajuan");
        }
    };

    const handleUpdateAudit = async () => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            await api.post(`/submissions/${activeSubmission.id}/audit-info`, { audit_date: auditDate });
            toast.success("Tanggal audit diperbarui");
            setIsEditingAudit(false);
            loadDetail(activeSubmission.id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal memperbarui tanggal audit");
        } finally {
            setProcessing(false);
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

    const handleDistribute = async () => {
        if (!activeSubmission || !selectedDrafter) return;
        setProcessing(true);
        try {
            await api.post(`/submissions/${activeSubmission.id}/assign-drafter`, {
                drafter_id: selectedDrafter
            });
            toast.success("Pengajuan berhasil didistribusikan ke Drafter");
            setActiveSubId(null);
            loadSubmissions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal mendistribusikan pengajuan");
        } finally {
            setProcessing(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'reject_consultant') => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            if (action === 'approve') {
                await api.post(`/submissions/${activeSubmission.id}/approve`);
                toast.success("Pengajuan disetujui");
                setActiveSubId(null);
                loadSubmissions();
            } else if (action === 'reject') {
                await api.post(`/submissions/${activeSubmission.id}/reject`, { note: rejectNote });
                toast.success("Pengajuan dikembalikan ke Drafter");
                setRejectNote('');
                setActiveSubId(null);
                loadSubmissions();
            } else if (action === 'reject_consultant') {
                if (activeSubmission.data_source === 'MARKETING' && selectedConsultant) {
                    await api.post(`/submissions/${activeSubmission.id}/assign-consultant`, {
                        consultant_id: selectedConsultant
                    });
                    toast.success("Konsultan ditunjuk & pengajuan dikembalikan");
                } else {
                    await api.post(`/submissions/${activeSubmission.id}/reject`, { note: rejectNote });
                    toast.success("Pengajuan dikembalikan ke Konsultan");
                }
                setRejectNote('');
                setSelectedConsultant('');
                setActiveSubId(null);
                loadSubmissions();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal memproses aksi");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateClient = async () => {
        if (!activeSubmission?.client_id) return;
        setProcessing(true);
        try {
            await api.put(`/clients/${activeSubmission.client_id}`, clientForm);
            toast.success("Data klien diperbarui oleh QC");
            setIsEditingClient(false);
            loadDetail(activeSubmission.id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal memperbarui data klien");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateDocs = async () => {
        if (!activeSubmission) return;
        setProcessing(true);
        try {
            const inputs = fieldValues.map(fv => ({
                field_id: fv.form_field_id,
                text_value: fv.text_value,
                link_value: fv.link_value,
                file_url: fv.file_url
            }));
            await api.post(`/submission-fields/${activeSubmission.id}`, inputs);
            toast.success("Dokumen diperbarui oleh QC");
            setIsEditingDocs(false);
            loadDetail(activeSubmission.id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal memperbarui dokumen");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menyiapkan Ruang Kerja QC...</p>
            </div>
        );
    }

    return (
        <div className={`flex gap-6 overflow-hidden transition-all duration-500 ${isFocusMode ? 'fixed inset-0 z-[100] bg-gray-50 p-6' : 'h-[calc(100vh-140px)]'}`}>
            {/* Left Sidebar: Task List */}
            <div className={`w-80 flex flex-col glass-panel p-0 overflow-hidden border-white/60 shadow-xl transition-all ${activeSubId ? 'hidden xl:flex' : 'flex w-full sm:w-80'}`}>
                <div className="p-4 border-b border-gray-100 space-y-4 bg-white/40">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-brand-600" />
                        Tugas QC
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
                    <button
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className={`w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${isFocusMode ? 'bg-brand-600 text-white shadow-lg' : 'bg-white/60 text-gray-500 hover:bg-white hover:text-brand-600 shadow-sm border border-white/80'}`}
                    >
                        {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        {isFocusMode ? 'Normal View' : 'Focus Mode QC'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredSubmissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic text-sm">
                            Tidak ada antrian QC
                        </div>
                    ) : (
                        filteredSubmissions.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSubId(sub.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all group ${activeSubId === sub.id
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]'
                                        : 'hover:bg-white/80 text-gray-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${activeSubId === sub.id ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-600'
                                        }`}>
                                        {formatServiceType(sub.service_type)}
                                    </span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ml-2 ${
                                        sub.status === 'SIDANG_FATWA' 
                                            ? (activeSubId === sub.id ? 'bg-amber-400/30 text-white' : 'bg-amber-100 text-amber-700')
                                            : sub.status === 'QC_OFFICER'
                                                ? (activeSubId === sub.id ? 'bg-purple-400/30 text-white' : 'bg-purple-100 text-purple-700')
                                                : (activeSubId === sub.id ? 'bg-blue-400/30 text-white' : 'bg-blue-100 text-blue-700')
                                    }`}>
                                        {sub.status === 'SIDANG_FATWA' ? 'SIDANG FATWA' : sub.status === 'QC_OFFICER' ? 'DISTRIBUSI' : 'QC REVIEW'}
                                    </span>
                                    <span className={`text-[8px] font-medium ml-auto ${activeSubId === sub.id ? 'text-brand-100' : 'text-gray-400'}`}>
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
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Antrian Review QC</h2>
                            <p className="text-gray-500 max-w-sm font-medium">
                                Pilih pengajuan dari daftar di sebelah kiri untuk melakukan review dokumen dan audit.
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
                                <div className="flex items-center gap-3">
                                    <a 
                                        href={`/dashboard/submissions/${activeSubmission?.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-brand-600 group relative"
                                        title="Buka Detail Lengkap"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                            Buka Detail Lengkap
                                        </span>
                                    </a>
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
                                    {activeSubmission?.status === 'QC_OFFICER' ? (
                                        <div className="flex items-center gap-2">
                                            <select 
                                                className="px-4 py-2 bg-white border border-brand-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500/20 outline-none min-w-[180px]"
                                                value={selectedDrafter}
                                                onChange={e => setSelectedDrafter(e.target.value)}
                                            >
                                                <option value="">-- Pilih Drafter --</option>
                                                {drafters.map(d => (
                                                    <option key={d.id} value={d.id}>{d.full_name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleDistribute}
                                                disabled={processing || !selectedDrafter}
                                                className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                                Distribusikan
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                disabled={processing}
                                                className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-xs hover:bg-red-100 transition-all flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                {activeSubmission?.status === 'SIDANG_FATWA' ? 'Tolak & Balik Drafter' : 'Kembalikan ke Drafter'}
                                            </button>
                                            {activeSubmission?.status === 'QC_REVIEW' ? (
                                                <button
                                                    onClick={() => handleAction('approve')}
                                                    disabled={
                                                        processing || 
                                                        !activeSubmission?.client?.nib || 
                                                        activeSubmission?.client?.nib.startsWith('DRAFT-')
                                                    }
                                                    className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    Setujui & Lanjutkan ke Fatwa
                                                </button>
                                            ) : (
                                                <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-[10px] font-black uppercase tracking-tight">
                                                    Menunggu Hasil Sidang Fatwa
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Main Workspace Content: Split Pane */}
                            <div className="flex-1 flex gap-6 overflow-hidden">
                                {/* Left Panel: Reference Data */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                                    {/* Client Basic Info */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl space-y-6 relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-5 bg-brand-600 rounded-full" />
                                                <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Informasi Dasar Klien</h3>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditingClient(!isEditingClient)}
                                                className={`p-2 rounded-lg transition-all ${isEditingClient ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                            >
                                                {isEditingClient ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {isEditingClient ? (
                                                <>
                                                    <EditField label="Nama Bisnis" value={clientForm.business_name} onChange={v => setClientForm({...clientForm, business_name: v})} />
                                                    <EditField label="Nama Pemilik" value={clientForm.client_name} onChange={v => setClientForm({...clientForm, client_name: v})} />
                                                    <EditField label="NIB" value={clientForm.nib} onChange={v => setClientForm({...clientForm, nib: v})} />
                                                    <EditField label="NIK" value={clientForm.nik} onChange={v => setClientForm({...clientForm, nik: v})} />
                                                    <EditField label="Produk" value={clientForm.product_name} onChange={v => setClientForm({...clientForm, product_name: v})} />
                                                    <div className="col-span-2">
                                                        <EditField label="Alamat Lengkap" value={clientForm.address} onChange={v => setClientForm({...clientForm, address: v})} isTextArea />
                                                    </div>
                                                    <div className="col-span-2 pt-2">
                                                        <button 
                                                            onClick={handleUpdateClient}
                                                            disabled={processing}
                                                            className="w-full py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                                                        >
                                                            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                            Simpan Perubahan Klien (QC Override)
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <InfoBox label="Nama Bisnis" value={activeSubmission?.client?.business_name} icon={Building2} />
                                                    <InfoBox label="Nama Pemilik" value={activeSubmission?.client?.client_name} icon={UserIcon} />
                                                    <InfoBox label="NIB" value={activeSubmission?.client?.nib} icon={Building2} mono />
                                                    <InfoBox label="NIK" value={activeSubmission?.client?.nik} icon={Building2} mono />
                                                    <InfoBox label="Produk" value={activeSubmission?.client?.product_name} icon={FileText} />
                                                    <div className="col-span-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Alamat Lengkap</span>
                                                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{activeSubmission?.client?.address}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Document References */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-5 bg-brand-600 rounded-full" />
                                                <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Dokumen & Bukti Pendukung</h3>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditingDocs(!isEditingDocs)}
                                                className={`p-2 rounded-lg transition-all ${isEditingDocs ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                            >
                                                {isEditingDocs ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {fieldValues.map((fv, idx) => (
                                                <div key={fv.id} className={`p-4 rounded-2xl border transition-all ${isEditingDocs ? 'bg-amber-50/10 border-amber-100' : 'bg-white/60 border-gray-100 hover:border-brand-200 shadow-sm'}`}>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={`p-2 rounded-lg ${isEditingDocs ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{fv.form_field.field_label}</span>
                                                    </div>

                                                    {isEditingDocs ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-3">
                                                                <EditField 
                                                                    label="Keterangan / Nilai Text" 
                                                                    value={fv.text_value || ''} 
                                                                    onChange={v => {
                                                                        const newValues = [...fieldValues];
                                                                        newValues[idx].text_value = v;
                                                                        setFieldValues(newValues);
                                                                    }} 
                                                                />
                                                                <EditField 
                                                                    label="Tautan / Link" 
                                                                    value={fv.link_value || ''} 
                                                                    onChange={v => {
                                                                        const newValues = [...fieldValues];
                                                                        newValues[idx].link_value = v;
                                                                        setFieldValues(newValues);
                                                                    }} 
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block px-1">File Upload</label>
                                                                <FileUpload 
                                                                    subfolder="docs"
                                                                    label={fv.file_url ? "Ganti File" : "Upload File"}
                                                                    onUploadSuccess={(url) => {
                                                                        const newValues = [...fieldValues];
                                                                        newValues[idx].file_url = url;
                                                                        setFieldValues(newValues);
                                                                        toast.success("File siap disimpan");
                                                                    }}
                                                                />
                                                                {fv.file_url && (
                                                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span className="text-[9px] font-bold truncate flex-1">{fv.file_url.split('/').pop()}</span>
                                                                        <a href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-emerald-100 rounded-lg">
                                                                            <Eye className="w-3 h-3" />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <p className="text-xs text-gray-600 font-medium truncate">{fv.text_value || '-'}</p>
                                                                {fv.link_value && <p className="text-[9px] text-brand-600 font-mono truncate mt-0.5">{fv.link_value}</p>}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {fv.file_url && (
                                                                    <a
                                                                        href={`${import.meta.env.VITE_API_URL}${fv.file_url}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all shadow-sm border border-gray-100"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {fv.link_value && (
                                                                    <a
                                                                        href={fv.link_value}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all shadow-sm border border-gray-100"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {isEditingDocs && (
                                                <button 
                                                    onClick={handleUpdateDocs}
                                                    disabled={processing}
                                                    className="w-full mt-4 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 flex items-center justify-center gap-3"
                                                >
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    Simpan Perubahan Dokumen (QC Override)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel: QC Review Area */}
                                <div className="w-[400px] flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6">
                                    {activeSubmission?.service_type === 'REGULER' && (
                                        <div className="glass-panel p-6 border-white/40 shadow-xl bg-brand-50/20">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-5 bg-brand-600 rounded-full" />
                                                    <h3 className="font-black text-brand-900 uppercase text-[10px] tracking-widest">Hasil Audit Drafter</h3>
                                                </div>
                                                <button 
                                                    onClick={() => setIsEditingAudit(!isEditingAudit)}
                                                    className={`p-2 rounded-lg transition-all ${isEditingAudit ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                                >
                                                    {isEditingAudit ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white/60 rounded-2xl border border-brand-100">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tanggal Audit</span>
                                                    {isEditingAudit ? (
                                                        <div className="space-y-2">
                                                            <input 
                                                                type="date"
                                                                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                                                                value={auditDate}
                                                                onChange={e => setAuditDate(e.target.value)}
                                                            />
                                                            <button 
                                                                onClick={handleUpdateAudit}
                                                                disabled={processing}
                                                                className="w-full py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                                                            >
                                                                {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                                Update Tanggal Audit
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                            <Calendar className="w-4 h-4 text-brand-500" />
                                                            {activeSubmission.audit_date ? new Date(activeSubmission.audit_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Belum dijadwalkan'}
                                                        </div>
                                                    )}
                                                </div>

                                                {activeSubmission.audit_result_1_url && (
                                                    <div className="p-4 bg-white/60 rounded-2xl border border-emerald-100 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-800">Laporan Utama</p>
                                                                <p className="text-[8px] text-gray-400">PDF Document</p>
                                                            </div>
                                                        </div>
                                                        <a href={`${import.meta.env.VITE_API_URL}${activeSubmission.audit_result_1_url}`} target="_blank" rel="noreferrer" className="p-2 bg-white text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm border border-gray-100">
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                )}

                                                {activeSubmission.audit_result_2_url && (
                                                    <div className="p-4 bg-white/60 rounded-2xl border border-brand-100 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-800">Lampiran Tambahan</p>
                                                                <p className="text-[8px] text-gray-400">Supporting File</p>
                                                            </div>
                                                        </div>
                                                        <a href={`${import.meta.env.VITE_API_URL}${activeSubmission.audit_result_2_url}`} target="_blank" rel="noreferrer" className="p-2 bg-white text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm border border-gray-100">
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action 3: QC Summary & Decisions */}
                                    <div className="glass-panel p-6 border-white/40 shadow-xl bg-gray-50/40">
                                        <div className="flex items-center gap-3 mb-4">
                                            <AlertCircle className="w-4 h-4 text-brand-500" />
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kriteria Review QC</h3>
                                        </div>
                                        <ul className="space-y-3 mb-6">
                                            <li className="flex items-center gap-3 text-[10px] font-medium transition-colors text-brand-600">
                                                <div className="p-1.5 rounded-lg bg-brand-50">
                                                    <ShieldCheck className="w-3 h-3" />
                                                </div>
                                                Kesesuaian NIB & NIK Klien
                                                <CheckCircle className="w-3 h-3 ml-auto" />
                                            </li>
                                            <li className="flex items-center gap-3 text-[10px] font-medium transition-colors text-brand-600">
                                                <div className="p-1.5 rounded-lg bg-brand-50">
                                                    <FileText className="w-3 h-3" />
                                                </div>
                                                Kelengkapan dokumen pendukung
                                                <CheckCircle className="w-3 h-3 ml-auto" />
                                            </li>
                                            {activeSubmission?.service_type === 'REGULER' && (
                                                <li className="flex items-center gap-3 text-[10px] font-medium transition-colors text-brand-600">
                                                    <div className="p-1.5 rounded-lg bg-brand-50">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </div>
                                                    Validitas laporan hasil audit
                                                    <CheckCircle className="w-3 h-3 ml-auto" />
                                                </li>
                                            )}
                                        </ul>

                                        <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100/50">
                                            {(!activeSubmission?.client?.nib || activeSubmission?.client?.nib.startsWith('DRAFT-')) && (
                                                <div className="p-3 mb-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <div>
                                                        <p className="text-[9px] font-bold text-amber-900 uppercase tracking-tight mb-0.5">NIB Belum Valid</p>
                                                        <p className="text-[9px] text-amber-700 leading-relaxed">
                                                            NIB klien masih berupa draft. Gunakan fitur "Edit Data" di atas untuk melengkapi NIB yang valid sebelum melanjutkan ke Fatwa.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-[10px] font-medium text-brand-800 leading-relaxed italic">
                                                "Pastikan semua data sudah sesuai sebelum melakukan approval. Jika ada kekurangan, gunakan tombol 'Kembalikan ke Drafter'."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Modal 
                isOpen={showRejectModal} 
                onClose={() => setShowRejectModal(false)}
                title="Kembalikan Pengajuan"
                maxWidth="md"
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Pilih tujuan pengembalian dan berikan catatan perbaikan.
                        </p>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Catatan Perbaikan</label>
                            <textarea 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium min-h-[100px]"
                                placeholder="Jelaskan apa yang perlu diperbaiki..."
                                value={rejectNote}
                                onChange={e => setRejectNote(e.target.value)}
                            />
                        </div>

                        {activeSubmission?.data_source === 'MARKETING' && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tunjuk Konsultan (Data Marketing)</label>
                                <select 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold"
                                    value={selectedConsultant}
                                    onChange={e => setSelectedConsultant(e.target.value)}
                                >
                                    <option value="">-- Pilih Konsultan Baru --</option>
                                    {consultants.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    handleAction('reject');
                                    setShowRejectModal(false);
                                }}
                                disabled={processing || !rejectNote.trim()}
                                className="flex-1 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100 disabled:opacity-50"
                            >
                                Balik ke Drafter
                            </button>
                            <button 
                                onClick={() => {
                                    handleAction('reject_consultant');
                                    setShowRejectModal(false);
                                }}
                                disabled={processing || !rejectNote.trim() || (activeSubmission?.data_source === 'MARKETING' && !selectedConsultant)}
                                className="flex-1 py-4 bg-brand-50 text-brand-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-100 transition-all border border-brand-100 disabled:opacity-50"
                            >
                                Balik ke Konsultan
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowRejectModal(false)}
                            className="py-3 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-gray-600 transition-all"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </Modal>
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

function EditField({ label, value, onChange, isTextArea = false }: { label: string, value: string, onChange: (v: string) => void, isTextArea?: boolean }) {
    return (
        <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block px-1">{label}</label>
            {isTextArea ? (
                <textarea
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium min-h-[80px]"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            )}
        </div>
    );
}
