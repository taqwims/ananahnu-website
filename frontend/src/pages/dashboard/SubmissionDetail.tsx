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

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!submission) return <div className="p-8">Submission not found</div>;

    const serviceType = submission.service_type || submission.client?.service_type || '';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/50 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Detail Pengajuan</h1>
                    <p className="text-sm text-gray-500">Client: {submission.client?.business_name}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {serviceType && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            serviceType === 'REGULER' || serviceType === 'SELF_DECLARE_MANDIRI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                            {formatServiceType(serviceType)}
                        </span>
                    )}
                    <span className="px-4 py-2 rounded-full bg-brand-100 text-brand-800 font-bold text-sm">
                        {submission.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Client Info */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Informasi Client</h3>
                            {(user?.role === 'ADMIN' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'KOORDINATOR' || user?.role === 'HALAL_KONSULTAN') && !isEditingClient && (
                                <button 
                                    onClick={() => setIsEditingClient(true)}
                                    className="text-xs font-bold text-brand-600 hover:underline"
                                >
                                    Edit Data Klien
                                </button>
                            )}
                        </div>
                        
                        {isEditingClient ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Usaha <span className="text-red-500">*</span></label>
                                        <input className="glass-input w-full" value={clientForm.business_name} onChange={e => setClientForm({...clientForm, business_name: e.target.value})} placeholder="Contoh: UD Jaya Abadi" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Klien (Pemilik) <span className="text-red-500">*</span></label>
                                        <input className="glass-input w-full" value={clientForm.client_name} onChange={e => setClientForm({...clientForm, client_name: e.target.value})} placeholder="Nama Lengkap Pemilik" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">NIB</label>
                                        <input className="glass-input w-full font-mono" value={clientForm.nib} onChange={e => setClientForm({...clientForm, nib: e.target.value})} placeholder="Nomor Induk Berusaha" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">NIK <span className="text-red-500">*</span></label>
                                        <input className="glass-input w-full font-mono" value={clientForm.nik} onChange={e => setClientForm({...clientForm, nik: e.target.value})} placeholder="Nomor Induk Kependudukan" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Produk</label>
                                        <input className="glass-input w-full" value={clientForm.product_name} onChange={e => setClientForm({...clientForm, product_name: e.target.value})} placeholder="Contoh: Keripik Singkong" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Contact Person (Opsional)</label>
                                        <input className="glass-input w-full" value={clientForm.contact_person} onChange={e => setClientForm({...clientForm, contact_person: e.target.value})} placeholder="Nama CP" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Telepon/WhatsApp (Opsional)</label>
                                        <input className="glass-input w-full" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="08..." />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Alamat Lengkap</label>
                                        <textarea className="glass-input w-full" rows={2} value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} placeholder="Alamat lengkap usaha" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingClient(false)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Batal</button>
                                    <button onClick={handleUpdateClient} className="px-3 py-1 text-xs bg-brand-600 text-white rounded font-bold">Simpan Perubahan</button>
                                </div>
                            </div>
                        ) : (
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Nama Usaha</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-bold">{submission.client?.business_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Nama Klien</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-bold">{submission.client?.client_name || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">NIB</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{submission.client?.nib}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">NIK</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{submission.client?.nik || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Produk</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{submission.client?.product_name || '-'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Alamat</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{submission.client?.address || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Telepon</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{submission.client?.phone || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{submission.client?.contact_person || '-'}</dd>
                                </div>
                            </dl>
                        )}
                        {submission.service_type === 'REGULER' && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                                <span className="text-sm text-blue-800 font-medium">Layanan Reguler membutuhkan kontrak pendampingan.</span>
                                <a href="/templates/kontrak_reguler.pdf" download className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors">
                                    Unduh Template Kontrak (PDF)
                                </a>
                            </div>
                        )}

                        {/* NIB Validation Warning — sebelum SH Terbit, NIB harus sudah terisi */}
                        {(submission.status === 'SIDANG_FATWA' || submission.status === 'DRAFTER' || submission.status === 'QC_REVIEW') && !submission.client?.nib?.replace(/^DRAFT-/, '') && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-sm text-amber-800 font-semibold">NIB belum diisi!</p>
                                    <p className="text-xs text-amber-700">Data NIB wajib dilengkapi sebelum SH dapat diterbitkan. Silakan edit data klien di atas.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Form — show form if DRAFT, show read-only values otherwise */}
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
                    ) : fieldValues.length > 0 ? (
                        <div className="glass-panel p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Dokumen & Data</h3>
                                {(user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_KONSULTAN' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'KOORDINATOR') && (
                                    <button 
                                        onClick={() => setEditingData(!editingData)}
                                        className="text-xs font-bold text-blue-600 hover:underline"
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
                                <div className="space-y-3">
                                    {fieldValues.map(fv => (
                                        <div key={fv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                {fv.form_field.input_type === 'FILE_UPLOAD' && <Upload className="w-5 h-5 text-brand-500" />}
                                                {fv.form_field.input_type === 'LINK' && <LinkIcon className="w-5 h-5 text-blue-500" />}
                                                {fv.form_field.input_type === 'TEXT' && <FileText className="w-5 h-5 text-gray-400" />}
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">{fv.form_field.field_label}</span>
                                                    {fv.text_value && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{fv.text_value}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {fv.file_url && (
                                                    <a 
                                                        href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="p-1.5 hover:bg-white rounded-md text-brand-600 transition-colors"
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
                                                        className="p-1.5 hover:bg-white rounded-md text-blue-600 transition-colors"
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
                    ) : (
                        <div className="glass-panel p-6">
                            <h3 className="text-lg font-semibold mb-4">Dokumen</h3>
                            <p className="text-sm text-gray-400 text-center py-4">Belum ada data form yang diisi</p>
                        </div>
                    )}

                    {/* Cost Calculator */}
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

                    {/* Invoice Info — shown when SH_TERBIT */}
                    {invoice && (
                        <div className={`glass-panel p-6 ${invoice.status === 'PAID' ? 'bg-green-50/50' : 'bg-yellow-50/50'}`}>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-brand-500" />
                                Tagihan
                            </h3>
                            <dl className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-xs text-gray-500">Jumlah</dt>
                                    <dd className="text-lg font-bold text-gray-800">{formatCurrency(invoice.amount)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Status</dt>
                                    <dd className={`text-sm font-medium ${invoice.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {invoice.status === 'PAID' ? '✓ Lunas' : '⏳ Belum Lunas'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Layanan</dt>
                                    <dd className="text-sm text-gray-700">{invoice.service_type.replace(/_/g, ' ')}</dd>
                                </div>
                                {invoice.paid_at && (
                                    <div>
                                        <dt className="text-xs text-gray-500">Tanggal Bayar</dt>
                                        <dd className="text-sm text-gray-700">{new Date(invoice.paid_at).toLocaleDateString('id-ID')}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}
                </div>



                {/* Sidebar: Actions */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 sticky top-6">
                        <h3 className="text-lg font-semibold mb-4">Workflow Actions</h3>
                        <div className="space-y-3">
                            {/* Dynamic Buttons based on Status */}
                            {(submission.status === 'DRAFT' || submission.status === 'REVISION') && (
                                <button
                                    onClick={() => handleAction('submit')}
                                    disabled={processing}
                                    className="w-full glass-button bg-brand-600 text-white hover:bg-brand-700 flex justify-center items-center gap-2"
                                >
                                    {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    {submission.status === 'REVISION' ? 'Resubmit for Verification' : 'Submit to Verification'}
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
                                         submission.status === 'SIDANG_FATWA' ? 'Terbitkan SH' : 'Approve / Advance'}
                                    </button>
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
