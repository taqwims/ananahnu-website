import { useState, useEffect } from 'react';
import { Send, Loader2, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import type { Submission, User } from '../../../types';
import { submissionService } from '../../../services/submissionService';
import FileUpload from '../FileUpload';
import toast from 'react-hot-toast';
import Modal from '../../ui/Modal';
import ConfirmModal from '../../ui/ConfirmModal';

interface WorkflowActionsProps {
    submission: Submission;
    user: User | null;
    processing: boolean;
    onAction: (action: 'submit' | 'approve' | 'reject' | 'assign_consultant', payload?: any) => Promise<void>;
    onSaveAuditInfo: (date: string) => Promise<void>;
    onSaveAuditResult: (url1: string, url2: string) => Promise<void>;
    onIssueSH: (shUrl: string) => Promise<void>;
}

export const WorkflowActions = ({ 
    submission, 
    user, 
    processing, 
    onAction, 
    onSaveAuditInfo, 
    onSaveAuditResult,
    onIssueSH
}: WorkflowActionsProps) => {
    const [auditDate, setAuditDate] = useState(submission.audit_date ? new Date(submission.audit_date).toISOString().split('T')[0] : '');
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [consultants, setConsultants] = useState<{id: string; full_name: string; role_name?: string}[]>([]);
    const [selectedDrafterId, setSelectedDrafterId] = useState('');
    const [drafters, setDrafters] = useState<{id: string; full_name: string}[]>([]);
    const [shFile, setShFile] = useState<File | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    useEffect(() => {
        if (submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'AUDIT_MANAGER')) {
            submissionService.getDrafters().then(setDrafters).catch(() => {});
        }
        if (submission.data_source === 'MARKETING' && 
            (user?.role === 'MARKETING' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'QC_OFFICER' || user?.role === 'AUDIT_MANAGER')) {
            submissionService.getConsultants().then(setConsultants).catch(() => {});
        }
    }, [submission.status, submission.data_source, user?.role]);

    const handleIssueSH = async () => {
        if (!shFile) return;
        if (shFile.size > 2 * 1024 * 1024) {
            toast.error("Ukuran file sertifikat tidak boleh lebih dari 2MB");
            return;
        }
        try {
            const uploadedUrl = await submissionService.uploadMedia(shFile);
            if (uploadedUrl) {
                await onIssueSH(uploadedUrl);
                setShFile(null);
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal mengupload sertifikat");
        }
    };

    const handleReject = async () => {
        await onAction('reject', { note: rejectNote });
        setShowRejectModal(false);
        setRejectNote('');
    };

    const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm: async () => {
                await onConfirm();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const getApproveLabel = () => {
        switch (submission.status) {
            case 'WAITING_PAYMENT': return 'Konfirmasi Pembayaran & Lanjutkan';
            case 'VERVAL_PENDAMPING': return 'Selesaikan Verifikasi';
            case 'QC_OFFICER': return 'Distribute to Drafter';
            case 'DRAFTER': return 'Submit to QC Review';
            case 'QC_REVIEW': return 'Submit to Sidang Fatwa';
            default: return 'Approve / Advance';
        }
    };

    const getRejectLabel = () => {
        switch (submission.status) {
            case 'QC_OFFICER': return 'Return to Halal Manager';
            case 'DRAFTER': return 'Return to QC Officer';
            case 'QC_REVIEW': return 'Return to Drafter';
            case 'SIDANG_FATWA': return 'Return to Drafter';
            default: return 'Reject / Revision';
        }
    };

    const showApprove = ((submission.status === 'VERVAL_PENDAMPING' && (user?.role === 'HALAL_ADVISOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'WAITING_PAYMENT' && (user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER'))) ||
                        (submission.status === 'DRAFTER' && (user?.role === 'DRAFTER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'QC_REVIEW' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER'))));

    const showReject = ((submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER'))) ||
                        (submission.status === 'DRAFTER' && user?.role === 'DRAFTER') ||
                        (submission.status === 'QC_REVIEW' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER'))) ||
                        (submission.status === 'SIDANG_FATWA' && (user?.role === 'ADMIN' || user?.role === 'DIRECTOR')));

    const handleDownload = async (format: 'docx' | 'pdf') => {
        try {
            await submissionService.downloadContract(submission.id, format);
            toast.success(`Kontrak berhasil diunduh dalam format ${format.toUpperCase()}`);
        } catch (err: any) {
            toast.error(err.message || "Gagal mengunduh kontrak");
        }
    };

    return (
        <>
            <div className="glass-panel p-6 shadow-2xl border border-white/40 lg:sticky lg:top-6 z-20 bg-white max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar overflow-hidden">
                <h3 className="text-lg font-black text-gray-800 tracking-tight mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                    Workflow Actions
                </h3>
                <div className="space-y-4">
                    {submission.service_type === 'REGULER' && (
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3 shadow-inner">
                            <label className="flex items-center gap-2 text-xs font-black text-indigo-800 uppercase tracking-widest">
                                📄 Download Kontrak Layanan
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => handleDownload('docx')}
                                    disabled={processing}
                                    className="py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-black text-[10px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1"
                                >
                                    DOCX
                                </button>
                                <button 
                                    onClick={() => handleDownload('pdf')}
                                    disabled={processing}
                                    className="py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1"
                                >
                                    PDF
                                </button>
                            </div>
                        </div>
                    )}

                    {(submission.status === 'DRAFT' || submission.status === 'REVISION') && (
                        <button
                            onClick={() => triggerConfirm(
                                'Kirim Pengajuan',
                                'Apakah Anda yakin ingin mengirimkan pengajuan ini untuk diverifikasi?',
                                () => onAction('submit')
                            )}
                            disabled={processing || (user?.role !== 'MARKETING' && submission.data_source !== 'MARKETING' && !submission.consultant_id)}
                            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 hover:bg-brand-700 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                            {submission.status === 'REVISION' ? 'Kirim Verifikasi Ulang' : 'Kirim ke Verifikasi'}
                        </button>
                    )}

                    {(submission.status === 'DRAFTER' || submission.status === 'QC_REVIEW') && 
                        submission.service_type === 'REGULER' && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                                {/* Only show date inputs to AUDIT_MANAGER / ADMIN / DIRECTOR */}
                                {(user?.role === 'AUDIT_MANAGER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                                    <>
                                        <label className="flex items-center gap-2 text-sm font-black text-amber-800 tracking-tight">
                                            📅 Input Tanggal Audit
                                        </label>
                                        <input 
                                            type="date"
                                            className="w-full px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-amber-500/20 text-sm font-medium"
                                            value={auditDate}
                                            onChange={(e) => setAuditDate(e.target.value)}
                                        />
                                        <button 
                                            onClick={() => onSaveAuditInfo(auditDate)}
                                            disabled={processing || !auditDate}
                                            className="w-full py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-all disabled:opacity-50"
                                        >
                                            Simpan Tanggal Audit
                                        </button>
                                    </>
                                )}

                                {/* If audit date is set, show file uploads for DRAFTER, ADMIN, etc. */}
                                {submission.audit_date ? (
                                    <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest">File Hasil Audit 1 (Utama)</label>
                                            <FileUpload 
                                                subfolder="audit" 
                                                label="Upload Laporan 1"
                                                onUploadSuccess={(url) => onSaveAuditResult(url, submission.audit_result_2_url || "")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest">File Hasil Audit 2 (Opsional)</label>
                                            <FileUpload 
                                                subfolder="audit" 
                                                label="Upload Laporan 2"
                                                onUploadSuccess={(url) => onSaveAuditResult(submission.audit_result_1_url || "", url)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 text-center text-xs font-bold text-amber-700 bg-amber-100/50 p-3 rounded-lg">
                                        Jadwal audit belum ditetapkan oleh Audit Manager.
                                    </div>
                                )}
                        </div>
                    )}

                    {submission.status === 'QC_OFFICER' && !submission.consultant_id && (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'QC_OFFICER' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER')) && (
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-black text-purple-800 tracking-tight">
                                <UserCheck className="w-4 h-4" /> Penunjukan Advisor
                            </label>
                            <select
                                className="glass-input text-sm w-full"
                                value={selectedConsultantId}
                                onChange={e => setSelectedConsultantId(e.target.value)}
                            >
                                <option value="">-- Pilih Advisor --</option>
                                {consultants.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => onAction('assign_consultant', { consultantId: selectedConsultantId })}
                                disabled={processing || !selectedConsultantId}
                                className="w-full py-2 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 transition-all disabled:opacity-50"
                            >
                                Tunjuk Advisor
                            </button>
                        </div>
                    )}

                    {submission.status === 'QC_OFFICER' && submission.consultant_id && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER')) && (
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
                        </div>
                    )}

                    {showApprove && (
                        <button
                            onClick={() => triggerConfirm(
                                'Konfirmasi Aksi',
                                `Apakah Anda yakin ingin melakukan aksi "${getApproveLabel()}"?`,
                                () => onAction('approve', { drafter_id: selectedDrafterId })
                            )}
                            disabled={processing || (submission.status === 'QC_OFFICER' && !selectedDrafterId)}
                            className="w-full glass-button bg-green-600 text-white hover:bg-green-700 border-green-500 flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {getApproveLabel()}
                        </button>
                    )}

                    {showReject && (
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={processing}
                            className="w-full glass-button bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex justify-center items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            {getRejectLabel()}
                        </button>
                    )}

                    {submission.status === 'SIDANG_FATWA' && (
                        <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <label className="block text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Upload Sertifikat Halal</label>
                            <input 
                                type="file" 
                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
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
                    )}
                </div>
            </div>

            <Modal 
                isOpen={showRejectModal} 
                onClose={() => setShowRejectModal(false)}
                title="Return / Reject Submission"
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Please provide a reason for return/rejection or revision instructions.</p>
                    <textarea
                        className="w-full glass-input"
                        rows={4}
                        placeholder="Enter notes here..."
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Batal</button>
                        <button
                            onClick={handleReject}
                            disabled={!rejectNote || processing}
                            className="px-6 py-2 bg-red-600 text-white rounded-xl font-black text-sm shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-30 transition-all"
                        >
                            {processing ? 'Processing...' : 'Confirm Reject'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
            />
        </>
    );
};
