import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Send, FileText, AlertTriangle, Loader2, Upload, Link as LinkIcon, Receipt } from 'lucide-react';
import api from '../../services/api';
import type { Submission, FormFieldValue, Invoice } from '../../types';
import PaymentSection from '../../components/dashboard/PaymentSection';
import DynamicSubmissionForm from '../../components/dashboard/DynamicSubmissionForm';

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

    const refreshSubmission = async () => {
        if (!id) return;
        const res = await api.get(`/submissions/${id}`);
        setSubmission(res.data);
    };

    useEffect(() => {
        if (id) {
            api.get(`/submissions/${id}`)
                .then(res => setSubmission(res.data))
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
        }
    }, [id]);

    const handleAction = async (action: 'submit' | 'approve' | 'reject') => {
        if (!submission) return;
        setProcessing(true);
        try {
            if (action === 'submit') {
                await api.post(`/submissions/${submission.id}/submit`);
            } else if (action === 'approve') {
                await api.post(`/submissions/${submission.id}/approve`);
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
                            serviceType === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                            {serviceType.replace(/_/g, ' ')}
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
                        <h3 className="text-lg font-semibold mb-4">Informasi Client</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Nama Usaha</dt>
                                <dd className="mt-1 text-sm text-gray-900">{submission.client?.business_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">NIB</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{submission.client?.nib}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Produk</dt>
                                <dd className="mt-1 text-sm text-gray-900">{submission.client?.product_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Alamat</dt>
                                <dd className="mt-1 text-sm text-gray-900">{submission.client?.address}</dd>
                            </div>
                        </dl>
                        {submission.service_type === 'REGULER' && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                                <span className="text-sm text-blue-800 font-medium">Layanan Reguler membutuhkan kontrak pendampingan.</span>
                                <a href="/templates/kontrak_reguler.docx" download className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors">
                                    Unduh Template Kontrak
                                </a>
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
                    ) : fieldValues.length > 0 ? (
                        <div className="glass-panel p-6">
                            <h3 className="text-lg font-semibold mb-4">Dokumen & Data</h3>
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
                                        {fv.file_url && (
                                            <a href={fv.file_url} target="_blank" rel="noopener noreferrer"
                                                className="text-brand-600 text-xs font-bold hover:underline">Lihat File</a>
                                        )}
                                        {fv.link_value && (
                                            <a href={fv.link_value} target="_blank" rel="noopener noreferrer"
                                                className="text-blue-600 text-xs font-bold hover:underline">Buka Link</a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-6">
                            <h3 className="text-lg font-semibold mb-4">Dokumen</h3>
                            <p className="text-sm text-gray-400 text-center py-4">Belum ada data form yang diisi</p>
                        </div>
                    )}

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

                {/* Payment Section */}
                {(submission.status === 'WAITING_PAYMENT' || submission.status === 'DRAFT') && (
                    <PaymentSection submission={submission} onPaymentSuccess={refreshSubmission} />
                )}

                {/* Sidebar: Actions */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 sticky top-6">
                        <h3 className="text-lg font-semibold mb-4">Workflow Actions</h3>
                        <div className="space-y-3">
                            {/* Dynamic Buttons based on Status */}
                            {submission.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleAction('submit')}
                                    disabled={processing}
                                    className="w-full glass-button bg-brand-600 text-white hover:bg-brand-700 flex justify-center items-center gap-2"
                                >
                                    {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    Submit to Verification
                                </button>
                            )}

                            {(submission.status === 'VERVAL_PENDAMPING' || submission.status === 'QC_OFFICER' || submission.status === 'DRAFTER' || submission.status === 'SIDANG_FATWA') && (
                                <>
                                    <button
                                        onClick={() => handleAction('approve')}
                                        disabled={processing}
                                        className="w-full glass-button bg-green-600 text-white hover:bg-green-700 border-green-500 flex justify-center items-center gap-2"
                                    >
                                        {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve / Advance
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={processing}
                                        className="w-full glass-button bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex justify-center items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject / Revision
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
