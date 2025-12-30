import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Send, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { Submission } from '../../types';
import PaymentSection from '../../components/dashboard/PaymentSection';

export default function SubmissionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        if (id) {
            api.get(`/submissions/${id}`)
                .then(res => setSubmission(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
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
            // Refresh
            const res = await api.get(`/submissions/${submission.id}`);
            setSubmission(res.data);
        } catch (err: any) {
            alert(err.response?.data?.error || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!submission) return <div className="p-8">Submission not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/50 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Submission Details</h1>
                    <p className="text-sm text-gray-500">Client: {submission.client?.business_name}</p>
                </div>
                <div className="ml-auto">
                    <span className="px-4 py-2 rounded-full bg-brand-100 text-brand-800 font-bold text-sm">
                        {submission.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Info & Files */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{submission.client?.business_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">NIB</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{submission.client?.nib}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Product</dt>
                                <dd className="mt-1 text-sm text-gray-900">{submission.client?.product_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{submission.client?.address}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-4">Documents</h3>
                        <div className="space-y-3">
                            {/* Placeholder for file list */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Business License (NIB).pdf</span>
                                </div>
                                <button className="text-brand-600 text-xs font-bold hover:underline">View</button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Product Matrix.xlsx</span>
                                </div>
                                <button className="text-brand-600 text-xs font-bold hover:underline">View</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Section - Added Back */}
                {(submission.status === 'WAITING_PAYMENT' || submission.status === 'DRAFT') && (
                    <PaymentSection submission={submission} onPaymentSuccess={() => {
                        // Refresh
                        api.get(`/submissions/${submission.id}`).then(res => setSubmission(res.data));
                    }} />
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
