import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Send, FileText, AlertTriangle, Loader2, Upload, Link as LinkIcon, Receipt, UserCheck } from 'lucide-react';
import api from '../../services/api';
import type { Submission, FormFieldValue, Invoice, AuditLog } from '../../types';
import PaymentSection from '../../components/dashboard/PaymentSection';
import DynamicSubmissionForm from '../../components/dashboard/DynamicSubmissionForm';
import CostCalculator from '../../components/dashboard/CostCalculator';
import KalkulatorReguler from '../../components/dashboard/KalkulatorReguler';
import { useAuthStore } from '../../store/authStore';
import { formatServiceType } from '../../utils/format';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

const InfoItem = ({ label, value, mono = false, highlight = false }: { label: string; value?: string; mono?: boolean; highlight?: boolean }) => (
    <div className={`p-3 rounded-xl border transition-all ${highlight ? 'bg-brand-50/50 border-brand-100 ring-1 ring-brand-500/10' : 'bg-white/50 border-gray-100'}`}>
        <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</dt>
        <dd className={`text-sm font-bold truncate ${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-700' : 'text-gray-700'}`}>
            {value || '-'}
        </dd>
    </div>
);

export default function SubmissionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [fieldValues, setFieldValues] = useState<FormFieldValue[]>([]);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const user = useAuthStore(state => state.user);
    const [history, setHistory] = useState<AuditLog[]>([]);
    const [editingData, setEditingData] = useState(false);
    const [shFile, setShFile] = useState<File | null>(null);

    // Drafter Assignment (for QC)
    const [drafters, setDrafters] = useState<{id: string; full_name: string}[]>([]);
    const [selectedDrafterId, setSelectedDrafterId] = useState('');

    // Client Edit State
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [clientForm, setClientForm] = useState({
        business_name: '',
        client_name: '',
        nib: '',
        nik: '',
        product_name: '',
        address: '',
        contact_person: '',
        phone: ''
    });

    const refreshSubmission = async () => {
        if (!id) return;
        const [subRes, histRes] = await Promise.all([
            api.get(`/submissions/${id}`),
            api.get(`/submissions/${id}/history`)
        ]);
        setSubmission(subRes.data);
        setHistory(histRes.data || []);
    };

    useEffect(() => {
        if (id) {
            api.get(`/submissions/${id}`)
                .then(res => {
                    setSubmission(res.data);
                    if (res.data?.client) {
                        setClientForm({
                            business_name: res.data.client.business_name || '',
                            client_name: res.data.client.client_name || '',
                            nib: res.data.client.nib || '',
                            nik: res.data.client.nik || '',
                            product_name: res.data.client.product_name || '',
                            address: res.data.client.address || '',
                            contact_person: res.data.client.contact_person || '',
                            phone: res.data.client.phone || ''
                        });
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));

            // Load field values
            api.get(`/submission-fields/${id}`)
                .then(res => setFieldValues(res.data || []))
                .catch(() => {});

            // Load invoice
            api.get(`/invoices/submission/${id}`)
                .then(res => setInvoice(res.data))
                .catch(() => {});

            // Load history
            api.get(`/submissions/${id}/history`)
                .then(res => setHistory(res.data || []))
                .catch(() => {});
        }
    }, [id]);

    const handleUpdateClient = async () => {
        if (!submission?.client?.id) return;
        setProcessing(true);
        try {
            await api.put(`/clients/${submission.client.id}`, clientForm);
            setIsEditingClient(false);
            await refreshSubmission();
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal memperbarui data klien");
        } finally {
            setProcessing(false);
        }
    };

    // Fetch drafters when QC_OFFICER views the detail
    useEffect(() => {
        if (submission?.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) {
            api.get('/admin/users/drafters')
                .then(res => {
                    const users = res.data || [];
                    setDrafters(users.map((u: any) => ({ id: u.id, full_name: u.full_name })));
                })
                .catch(() => {});
        }
    }, [submission?.status, user?.role]);

    const handleIssueSH = async () => {
        if (!id || !shFile) return;

        // Check size (2MB = 2 * 1024 * 1024 bytes)
        if (shFile.size > 2 * 1024 * 1024) {
            alert("Ukuran file sertifikat tidak boleh lebih dari 2MB");
            return;
        }

        setProcessing(true);
        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append('file', shFile);
            const uploadRes = await api.post('/media/upload', formData);
            const uploadedUrl = uploadRes.data.url;

            // 2. Call Issue SH
            await api.post(`/submissions/${id}/issue-sh`, { sh_url: uploadedUrl });
            
            setShFile(null);
            await refreshSubmission();
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal menerbitkan Sertifikat Halal");
        } finally {
            setProcessing(false);
        }
    };

    const handleAction = async (action: 'submit' | 'approve' | 'reject') => {
        if (!submission) return;
        setProcessing(true);
        try {
            if (action === 'submit') {
                await api.post(`/submissions/${submission.id}/submit`);
            } else if (action === 'approve') {
                const body: any = {};
                if (submission.status === 'QC_OFFICER' && selectedDrafterId) {
                    body.drafter_id = selectedDrafterId;
                }
                await api.post(`/submissions/${submission.id}/approve`, body);
            } else if (action === 'reject') {
                await api.post(`/submissions/${submission.id}/reject`, { note: rejectNote });
                setShowRejectModal(false);
            }
            await refreshSubmission();
        } catch (err: any) {
            alert(err.response?.data?.error || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!submission) return <div className="p-8">Submission not found</div>;

    const serviceType = submission.service_type || submission.client?.service_type || '';

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/40 p-4 rounded-2xl backdrop-blur-md border border-white/60">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Detail Pengajuan</h1>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Bisnis: {submission.client?.business_name}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 sm:ml-auto w-full sm:w-auto">
                    {serviceType && (
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                            serviceType === 'REGULER' || serviceType === 'SELF_DECLARE_MANDIRI' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                            {formatServiceType(serviceType)}
                        </span>
                    )}
                    <span className="px-3 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 font-black text-[10px] uppercase tracking-wider shadow-sm">
                        {submission.status.replace(/_/g, ' ')}
                    </span>
                    {submission.tracking_number && (
                        <div className="flex flex-col items-start sm:items-end bg-white/60 px-3 py-1.5 rounded-xl border border-white/80 shadow-sm min-w-[120px]">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">No. Resi</span>
                            <span className="text-sm font-black text-brand-600 font-mono leading-none">{submission.tracking_number}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                    {/* Client Info */}
                    <div className="glass-panel p-6 shadow-xl border border-white/40">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                                Informasi Client
                            </h3>
                            {(user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'KOORDINATOR' || user?.role === 'HALAL_KONSULTAN') && !isEditingClient && (
                                <button 
                                    onClick={() => setIsEditingClient(true)}
                                    className="px-3 py-1.5 bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-brand-100 hover:bg-brand-100 transition-all"
                                >
                                    Edit Data Klien
                                </button>
                            )}
                        </div>
                        
                        {isEditingClient ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Usaha <span className="text-red-500">*</span></label>
                                        <input className="glass-input w-full" value={clientForm.business_name} onChange={e => setClientForm({...clientForm, business_name: e.target.value})} placeholder="Contoh: UD Jaya Abadi" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Klien (Pemilik) <span className="text-red-500">*</span></label>
                                        <input className="glass-input w-full" value={clientForm.client_name} onChange={e => setClientForm({...clientForm, client_name: e.target.value})} placeholder="Nama Lengkap Pemilik" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">NIB</label>
                                        <input className="glass-input w-full font-mono" value={clientForm.nib} onChange={e => setClientForm({...clientForm, nib: e.target.value})} placeholder="Nomor Induk Berusaha" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">NIK <span className="text-red-500">*</span></label>
                                        <input className="glass-input w-full font-mono" value={clientForm.nik} onChange={e => setClientForm({...clientForm, nik: e.target.value})} placeholder="Nomor Induk Kependudukan" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Produk</label>
                                        <input className="glass-input w-full" value={clientForm.product_name} onChange={e => setClientForm({...clientForm, product_name: e.target.value})} placeholder="Contoh: Keripik Singkong" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CP / Telepon</label>
                                        <input className="glass-input w-full" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="08..." />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                                        <textarea className="glass-input w-full" rows={2} value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} placeholder="Alamat lengkap usaha" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setIsEditingClient(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Batal</button>
                                    <button onClick={handleUpdateClient} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all">Simpan Perubahan</button>
                                </div>
                            </div>
                        ) : (
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                                <InfoItem label="Nama Usaha" value={submission.client?.business_name} highlight />
                                <InfoItem label="Nama Pemilik" value={submission.client?.client_name} />
                                <InfoItem label="NIB" value={submission.client?.nib} mono />
                                <InfoItem label="NIK" value={submission.client?.nik} mono />
                                <InfoItem label="Produk Utama" value={submission.client?.product_name} />
                                <InfoItem label="Telepon" value={submission.client?.phone} />
                                <div className="sm:col-span-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat Lengkap</dt>
                                    <dd className="text-sm text-gray-700 font-medium leading-relaxed">{submission.client?.address || '-'}</dd>
                                </div>
                            </dl>
                        )}
                        {submission.service_type === 'REGULER' && (
                            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 gap-4">
                                <span className="text-xs text-blue-800 font-bold text-center sm:text-left">Layanan Reguler membutuhkan kontrak pendampingan.</span>
                                <a href="/templates/kontrak_reguler.pdf" download className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-100">
                                    Unduh Template Kontrak
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Form Content */}
                    <div className="space-y-6">
                        {submission.status === 'DRAFT' && serviceType ? (
                            <DynamicSubmissionForm
                                formType={serviceType}
                                submissionId={submission.id}
                                onSaved={refreshSubmission}
                            />
                        ) : submission.status === 'WAITING_PAYMENT' ? (
                            <PaymentSection 
                                submission={submission} 
                                fieldValues={fieldValues}
                                onPaymentSuccess={refreshSubmission} 
                            />
                        ) : (
                            <div className="glass-panel p-6 shadow-xl border border-white/40">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        Dokumen & Data
                                    </h3>
                                    {(user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_KONSULTAN' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'KOORDINATOR') && (
                                        <button 
                                            onClick={() => setEditingData(!editingData)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
                                        >
                                            {editingData ? 'Batal Edit' : 'Edit Data'}
                                        </button>
                                    )}
                                </div>
                                
                                {editingData ? (
                                    <DynamicSubmissionForm
                                        formType={serviceType || ''}
                                        submissionId={submission.id}
                                        onSaved={() => {
                                            setEditingData(false);
                                            refreshSubmission();
                                        }}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {fieldValues.map(fv => (
                                            <div key={fv.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100 hover:border-brand-200 transition-all group/item shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 rounded-lg bg-gray-50 group-hover/item:bg-brand-50 transition-colors">
                                                        {fv.form_field.input_type === 'FILE_UPLOAD' && <Upload className="w-4 h-4 text-brand-500" />}
                                                        {fv.form_field.input_type === 'LINK' && <LinkIcon className="w-4 h-4 text-blue-500" />}
                                                        {fv.form_field.input_type === 'TEXT' && <FileText className="w-4 h-4 text-gray-400" />}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <span className="text-xs font-bold text-gray-700 block truncate">{fv.form_field.field_label}</span>
                                                        {fv.text_value && (
                                                            <p className="text-[10px] text-gray-400 truncate">{fv.text_value}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 ml-2 shrink-0">
                                                    {fv.file_url && (
                                                        <a 
                                                            href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all"
                                                            title="Lihat File"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {fv.link_value && (
                                                        <a 
                                                            href={fv.link_value} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="p-2 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 transition-all"
                                                            title="Buka Link"
                                                        >
                                                            <LinkIcon className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cost Calculator Section */}
                    <div className="overflow-x-auto pb-4">
                        {serviceType === 'REGULER' ? (
                            <KalkulatorReguler 
                                submissionId={submission.id} 
                                readOnly={(user?.role !== 'FINANCE' && user?.role !== 'ADMIN_KEUANGAN' && user?.role !== 'ADMIN' && user?.role !== 'DIRECTOR') && !(user?.role === 'HALAL_KONSULTAN' && (submission.status === 'DRAFT' || submission.status === 'REVISION'))} 
                                onSaved={refreshSubmission}
                                salesSchemeId={submission.sales_scheme_id || undefined}
                            />
                        ) : serviceType !== 'SELF_DECLARE' ? (
                            <CostCalculator 
                                submissionId={submission.id} 
                                readOnly={user?.role !== 'FINANCE' && user?.role !== 'ADMIN_KEUANGAN' && user?.role !== 'ADMIN'} 
                                onSaved={refreshSubmission}
                                serviceType={serviceType}
                            />
                        ) : null}
                    </div>

                    {/* Sertifikat Halal Section */}
                    {submission.sh_url && (
                        <div className="glass-panel p-6 bg-emerald-50/40 border-emerald-200 shadow-xl shadow-emerald-100/50">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <h3 className="text-lg font-black text-emerald-800 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    Sertifikat Halal Terbit
                                </h3>
                                <a 
                                    href={`${import.meta.env.VITE_API_URL}${submission.sh_url}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                                >
                                    <Upload className="w-4 h-4 rotate-180" />
                                    Unduh Sertifikat
                                </a>
                            </div>
                            
                            <div className="rounded-2xl overflow-hidden border border-emerald-100 bg-white shadow-inner">
                                {submission.sh_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL}${submission.sh_url}`} 
                                        alt="Sertifikat Halal" 
                                        className="w-full h-auto max-h-[600px] object-contain mx-auto p-4"
                                    />
                                ) : (
                                    <div className="p-12 flex flex-col items-center justify-center text-emerald-600 gap-4">
                                        <div className="p-6 bg-emerald-50 rounded-full">
                                            <FileText className="w-12 h-12 opacity-40" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black uppercase tracking-widest">Dokumen Sertifikat (PDF)</p>
                                            <a 
                                                href={`${import.meta.env.VITE_API_URL}${submission.sh_url}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-brand-600 font-bold hover:underline text-xs mt-1 block"
                                            >
                                                Buka Dokumen PDF di Tab Baru
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Invoice Info */}
                    {invoice && (
                        <div className={`glass-panel p-6 shadow-xl border ${invoice.status === 'PAID' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-2 rounded-xl ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-gray-800 tracking-tight">Tagihan Layanan</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                                    <p className="text-2xl font-black text-brand-600">{formatCurrency(invoice.amount)}</p>
                                </div>
                                <div className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Pembayaran</p>
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {invoice.status === 'PAID' ? '✓ Lunas' : '⏳ Menunggu'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pihak Pembayar</p>
                                    <p className="text-sm font-bold text-gray-800">{invoice.payer?.full_name || 'UMKM (Eksternal)'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jenis Layanan</p>
                                    <p className="text-sm font-bold text-gray-800">{invoice.service_type.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Actions & History */}
                <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                    <div className="glass-panel p-6 shadow-2xl border border-white/40 lg:sticky lg:top-6">
                        <h3 className="text-lg font-black text-gray-800 tracking-tight mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                            Workflow Actions
                        </h3>
                        <div className="space-y-4">
                            {/* Action Buttons */}
                            {(submission.status === 'DRAFT' || submission.status === 'REVISION') && (
                                <button
                                    onClick={() => handleAction('submit')}
                                    disabled={processing}
                                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 hover:bg-brand-700 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                                >
                                    {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                    {submission.status === 'REVISION' ? 'Kirim Verifikasi Ulang' : 'Kirim ke Verifikasi'}
                                </button>
                            )}

                            {/* QC Officer: Drafter Assignment */}
                            {submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                                        <UserCheck className="w-4 h-4" /> Pilih Drafter
                                    </label>
                                    <select
                                        className="glass-input text-sm w-full"
                                        value={selectedDrafterId}
                                        onChange={e => setSelectedDrafterId(e.target.value)}
                                    >
                                        <option value="">-- Pilih Drafter --</option>
                                        {drafters.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                    </select>
                                    <p className="text-xs text-blue-600">Wajib pilih drafter sebelum distribute.</p>
                                </div>
                            )}

                            {/* Assigned Drafter Info */}
                            {(submission as any).assigned_drafter && (
                                <div className="p-3 bg-indigo-50 rounded-lg text-sm border border-indigo-200">
                                    <span className="text-indigo-700 font-medium">Drafter:</span>
                                    <span className="ml-2 text-indigo-900 font-bold">{(submission as any).assigned_drafter.full_name}</span>
                                </div>
                            )}

                            {/* Reject Note */}
                            {(submission as any).reject_note && (
                                <div className="p-3 bg-red-50 rounded-lg text-sm border border-red-200">
                                    <p className="text-red-700 font-medium">Catatan Penolakan:</p>
                                    <p className="text-red-800 text-xs mt-1">{(submission as any).reject_note}</p>
                                </div>
                            )}

                            {(submission.status === 'VERVAL_PENDAMPING' || submission.status === 'QC_OFFICER' || submission.status === 'DRAFTER' || submission.status === 'QC_REVIEW' || submission.status === 'SIDANG_FATWA') && (
                                <>
                                    {submission.status === 'SIDANG_FATWA' ? (
                                        <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                            <label className="block text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Upload Sertifikat Halal (PDF/JPG)</label>
                                            <input 
                                                type="file" 
                                                className="block w-full text-xs text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-xs file:font-semibold
                                                    file:bg-emerald-600 file:text-white
                                                    hover:file:bg-emerald-700 cursor-pointer"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => setShFile(e.target.files?.[0] || null)}
                                            />
                                            {shFile && (
                                                <button
                                                    onClick={handleIssueSH}
                                                    disabled={processing}
                                                    className="w-full glass-button bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-500 flex justify-center items-center gap-2"
                                                >
                                                    {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                    Konfirmasi & Terbitkan SH
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleAction('approve')}
                                            disabled={processing || (submission.status === 'QC_OFFICER' && !selectedDrafterId)}
                                            className="w-full glass-button bg-green-600 text-white hover:bg-green-700 border-green-500 flex justify-center items-center gap-2 disabled:opacity-50"
                                        >
                                            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            {submission.status === 'VERVAL_PENDAMPING' ? 'Submit to QC' : 
                                             submission.status === 'QC_OFFICER' ? 'Distribute to Drafter' :
                                             submission.status === 'DRAFTER' ? 'Submit to QC Review' : 
                                             submission.status === 'QC_REVIEW' ? 'Submit to Sidang Fatwa' :
                                             'Approve / Advance'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={processing}
                                        className="w-full glass-button bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex justify-center items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        {submission.status === 'QC_OFFICER' ? 'Return to Koordinator' : 
                                         submission.status === 'DRAFTER' ? 'Return to QC Officer' :
                                         submission.status === 'QC_REVIEW' ? 'Return to Drafter' :
                                         submission.status === 'SIDANG_FATWA' ? 'Return to Drafter' : 'Reject / Revision'}
                                    </button>
                                </>
                            )}

                            {submission.status === 'SH_TERBIT' && (
                                <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm text-center font-medium">
                                    Certificate Issued
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="glass-panel p-6 sticky top-6">
                        <h3 className="text-lg font-semibold mb-4">Workflow History</h3>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-2">No history yet</p>
                                ) : (
                                    history.map((log) => (
                                        <div key={log.id} className="relative pl-4 border-l-2 border-gray-100 mb-4 last:mb-0">
                                            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300"></div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-bold text-gray-700">{log.action}</span>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(log.created_at).toLocaleString('id-ID', {
                                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                                {log.notes}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Reject Submission
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection or revision instructions.</p>
                        <textarea
                            className="w-full glass-input mb-4"
                            rows={4}
                            placeholder="Enter notes here..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
                            <button
                                onClick={() => handleAction('reject')}
                                disabled={!rejectNote}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
