import { useState, useEffect } from 'react';
import { Send, Loader2, UserCheck, CheckCircle, RotateCcw, ShieldAlert, ArrowRight, DollarSign, CheckCircle2, Sparkles } from 'lucide-react';
import type { Submission, User } from '../../../types';
import { submissionService } from '../../../services/submissionService';
import FileUpload from '../FileUpload';
import toast from 'react-hot-toast';
import Modal from '../../ui/Modal';
import ConfirmModal from '../../ui/ConfirmModal';
import { compressImage } from '../../../utils/compressor';

interface WorkflowActionsProps {
    submission: Submission;
    user: User | null;
    processing: boolean;
    onAction: (action: 'submit' | 'approve' | 'reject' | 'assign_consultant', payload?: any) => Promise<void>;
    onSaveAuditInfo: (date: string) => Promise<void>;
    onSaveAuditResult: (url1: string, url2: string) => Promise<void>;
    onIssueSH: (shUrl: string) => Promise<void>;
    onRevokeSH?: () => Promise<void>;
    onSubmitSJPH?: (sjphUrl: string, notes: string) => Promise<void>;
    onApproveSJPH?: () => Promise<void>;
}

export const WorkflowActions = ({ 
    submission, 
    user, 
    processing, 
    onAction, 
    onSaveAuditInfo, 
    onSaveAuditResult,
    onIssueSH,
    onRevokeSH,
    onSubmitSJPH,
    onApproveSJPH
}: WorkflowActionsProps) => {
    const [auditDate, setAuditDate] = useState(submission.audit_date ? new Date(submission.audit_date).toISOString().split('T')[0] : '');
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [consultants, setConsultants] = useState<{id: string; full_name: string; role_name?: string}[]>([]);
    const [selectedDrafterId, setSelectedDrafterId] = useState('');
    const [drafters, setDrafters] = useState<{id: string; full_name: string}[]>([]);
    const [shFile, setShFile] = useState<File | null>(null);
    const [sjphNotes, setSjphNotes] = useState(submission.sjph_notes || '');
    
    // Advisor Service Type & Consultation state
    const [selectedServiceType, setSelectedServiceType] = useState<string>(
        submission.service_type === 'PENDING_CONSULTATION' || !submission.service_type ? 'REGULER' : submission.service_type
    );
    const [selectedSelfDeclareType, setSelectedSelfDeclareType] = useState<string>(
        submission.self_declare_type || 'MANDIRI'
    );
    const [selectedPaymentScheme, setSelectedPaymentScheme] = useState<'TERMIN' | 'FULL'>(
        submission.cost_detail?.payment_scheme === 'FULL' ? 'FULL' : 'TERMIN'
    );
    const [selectedDPPercentage, setSelectedDPPercentage] = useState<number>(
        submission.cost_detail?.dp_percentage || 70
    );
    const [customDPPercentage, setCustomDPPercentage] = useState<string>(
        submission.cost_detail?.dp_percentage && ![50, 60, 70, 80].includes(submission.cost_detail.dp_percentage)
            ? String(submission.cost_detail.dp_percentage)
            : ''
    );
    const [settingServiceType, setSettingServiceType] = useState(false);
    const [forwardingToOperational, setForwardingToOperational] = useState(false);

    // Enhanced Reject Modal states
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [targetStatus, setTargetStatus] = useState<string>('DRAFTER');
    const [selectedInvalidFields, setSelectedInvalidFields] = useState<string[]>([]);

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

    const effectiveDrafterId = selectedDrafterId || submission.assigned_drafter_id || '';

    useEffect(() => {
        if (submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) {
            submissionService.getDrafters().then(setDrafters).catch(() => toast.error('Gagal memuat data drafter'));
        }
        if ((submission.status === 'WAITING_ASSIGNMENT' || submission.data_source === 'MARKETING' || submission.data_source === 'TELEMARKETING' || !submission.consultant_id) && 
            (user?.role === 'MARKETING' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'QC_OFFICER' || user?.role === 'MANAGER')) {
            submissionService.getConsultants(submission.province_id || '', submission.regency_id || '')
                .then(res => {
                    if (res && res.length > 0) {
                        setConsultants(res);
                    } else if (submission.province_id) {
                        submissionService.getConsultants(submission.province_id)
                            .then(resProv => {
                                if (resProv && resProv.length > 0) {
                                    setConsultants(resProv);
                                } else {
                                    submissionService.getConsultants().then(setConsultants);
                                }
                            });
                    } else {
                        submissionService.getConsultants().then(setConsultants);
                    }
                })
                .catch(() => {
                    submissionService.getConsultants().then(setConsultants).catch(() => toast.error('Gagal memuat data konsultan'));
                });
        }
    }, [submission.status, submission.data_source, submission.consultant_id, submission.province_id, submission.regency_id, user?.role]);

    // Set default target status when modal opens
    useEffect(() => {
        if (showRejectModal) {
            if (submission.assigned_drafter_id) {
                setTargetStatus('DRAFTER');
            } else if (submission.consultant_id) {
                setTargetStatus('VERVAL_PENDAMPING');
            } else {
                setTargetStatus('REVISION');
            }
        }
    }, [showRejectModal, submission.assigned_drafter_id, submission.consultant_id]);

    const handleIssueSH = async () => {
        if (!shFile) return;
        
        let finalFile = shFile;
        if (finalFile.type.startsWith('image/')) {
            try {
                finalFile = await compressImage(finalFile);
            } catch (err) {
                console.error('Image compression failed:', err);
            }
        }

        if (finalFile.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file sertifikat tidak boleh lebih dari 5MB");
            return;
        }
        try {
            const uploadedUrl = await submissionService.uploadMedia(finalFile);
            if (uploadedUrl) {
                await onIssueSH(uploadedUrl);
                setShFile(null);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Gagal mengupload sertifikat");
        }
    };

    const handleReject = async () => {
        await onAction('reject', { 
            note: rejectNote, 
            target_status: targetStatus,
            invalid_fields: selectedInvalidFields
        });
        setShowRejectModal(false);
        setRejectNote('');
        setSelectedInvalidFields([]);
    };

    const toggleInvalidField = (field: string) => {
        setSelectedInvalidFields(prev => 
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSetServiceType = async () => {
        setSettingServiceType(true);
        try {
            let actualPaymentScheme = 'TERMIN';
            let actualDPPercentage = 70;
            if (selectedServiceType === 'REGULER') {
                actualPaymentScheme = selectedPaymentScheme;
                if (selectedPaymentScheme === 'FULL') {
                    actualDPPercentage = 100;
                } else {
                    const parsed = parseFloat(customDPPercentage);
                    actualDPPercentage = selectedDPPercentage === -1 
                        ? (!isNaN(parsed) && parsed > 0 && parsed < 100 ? parsed : 70) 
                        : selectedDPPercentage;
                }
            } else if (selectedServiceType === 'SELF_DECLARE_MANDIRI') {
                actualPaymentScheme = 'FULL';
                actualDPPercentage = 100;
            } else {
                actualPaymentScheme = 'GRATIS';
                actualDPPercentage = 0;
            }

            await submissionService.setAdvisorServiceType(
                submission.id,
                selectedServiceType,
                selectedServiceType === 'SELF_DECLARE' ? selectedSelfDeclareType : undefined,
                actualPaymentScheme,
                actualDPPercentage
            );
            toast.success("Jenis layanan & skema pembayaran berhasil ditetapkan!");
            window.location.reload();
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || "Gagal menetapkan jenis layanan");
        } finally {
            setSettingServiceType(false);
        }
    };

    const handleForwardToOperational = async () => {
        setForwardingToOperational(true);
        try {
            await submissionService.forwardToOperational(submission.id);
            toast.success("Pengajuan berhasil diteruskan ke Manager Operasional!");
            window.location.reload();
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || "Gagal meneruskan pengajuan");
        } finally {
            setForwardingToOperational(false);
        }
    };

    const isPaymentCompleted = Boolean(
        (submission.service_type === 'SELF_DECLARE' && (!submission.self_declare_type || submission.self_declare_type === 'GRATIS')) ||
        submission.invoice?.status === 'PAID' ||
        submission.invoices?.some(inv => inv.status === 'PAID') ||
        submission.payments?.some(p => p.status === 'PAID')
    );

    const isAdvisorRole = user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR';
    const isMarketingRole = user?.role === 'MARKETING' || user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

    const getApproveLabel = () => {
        switch (submission.status) {
            case 'WAITING_PAYMENT': return 'Konfirmasi Pembayaran & Lanjutkan';
            case 'VERVAL_PENDAMPING': return 'Selesaikan Verifikasi';
            case 'QC_OFFICER': return 'Distribusi ke Drafter';
            case 'DRAFTER': return 'Kirim ke Verifikator';
            case 'QC_REVIEW': return 'Kirim ke BPJPH';
            case 'SUBMITTED_TO_BPJPH': return 'Proses Keuangan & Terbitkan SH';
            default: return 'Disetujui / Lanjutkan';
        }
    };

    const getRejectLabel = () => {
        switch (submission.status) {
            case 'QC_OFFICER': return 'Kembalikan Data / Revisi';
            case 'DRAFTER': return 'Kembalikan ke QC Officer';
            case 'QC_REVIEW': return 'Kembalikan Berkas (Revisi)';
            case 'SUBMITTED_TO_BPJPH': return 'Kembalikan Berkas (Revisi)';
            default: return 'Kembalikan / Revisi';
        }
    };

    const showApprove = ((submission.status === 'VERVAL_PENDAMPING' && (user?.role === 'HALAL_ADVISOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'WAITING_PAYMENT' && (user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'VERIFIKATOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'DRAFTER' && (user?.role === 'DRAFTER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'QC_REVIEW' && (user?.role === 'QC_OFFICER' || user?.role === 'VERIFIKATOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'SUBMITTED_TO_BPJPH' && (user?.role === 'ADMIN_KEUANGAN' || user?.role === 'FINANCE' || user?.role === 'LEGAL' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')));

    const showReject = ((submission.status === 'QC_OFFICER' && (user?.role === 'QC_OFFICER' || user?.role === 'VERIFIKATOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'DRAFTER' && user?.role === 'DRAFTER') ||
                        (submission.status === 'QC_REVIEW' && (user?.role === 'QC_OFFICER' || user?.role === 'VERIFIKATOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'SUBMITTED_TO_BPJPH' && (user?.role === 'ADMIN_KEUANGAN' || user?.role === 'FINANCE' || user?.role === 'LEGAL' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR')) ||
                        (submission.status === 'SIDANG_FATWA' && (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'FINANCE' || user?.role === 'LEGAL')));

    const canIssueSHDirect = (submission.status === 'SIDANG_FATWA' || submission.status === 'SUBMITTED_TO_BPJPH') && 
                            (user?.role === 'ADMIN_KEUANGAN' || user?.role === 'FINANCE' || user?.role === 'LEGAL' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR');

    const handleDownload = async (format: 'docx' | 'pdf') => {
        try {
            await submissionService.downloadContract(submission.id, format);
            toast.success(`Kontrak berhasil diunduh dalam format ${format.toUpperCase()}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Gagal mengunduh kontrak");
        }
    };

    const invalidFieldOptions = [
        'Informasi Klien & Data Usaha',
        'Dokumen & Data Isian Form',
        'Data Bahan & Matriks Produk',
        'Laporan Hasil Audit',
        'Kontrak / SPH / Pembayaran'
    ];

    return (
        <>
            <div className="glass-panel p-6 shadow-2xl border border-white/40 lg:sticky lg:top-6 z-20 bg-white max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar">
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
                            <button 
                                onClick={() => handleDownload('pdf')}
                                disabled={processing}
                                className="w-full py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1"
                            >
                                Unduh Kontrak Kerja (PDF)
                            </button>
                        </div>
                    )}

                    {(submission.status === 'DRAFT' || submission.status === 'REVISION') && (
                        <button
                            onClick={() => triggerConfirm(
                                'Kirim Pengajuan',
                                'Apakah Anda yakin ingin mengirimkan pengajuan ini untuk diverifikasi?',
                                () => onAction('submit')
                            )}
                            disabled={processing || (user?.role !== 'MARKETING' && user?.role !== 'CLIENT' && submission.data_source !== 'MARKETING' && !submission.consultant_id)}
                            className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 hover:bg-brand-700 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                            {submission.status === 'REVISION' ? 'Kirim Verifikasi Ulang' : 'Kirim ke Verifikasi'}
                        </button>
                    )}

                    {/* Khusus Layanan Reguler: Informasi & Atur Tanggal Audit */}
                    {submission.service_type === 'REGULER' && (
                        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700 font-bold text-xs">📅</span>
                                    <div>
                                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Jadwal Audit Sertifikasi Reguler</h4>
                                        <p className="text-[10px] text-amber-700 font-medium">Status Workflow: <span className="font-bold underline">{submission.status?.replace(/_/g, ' ')}</span></p>
                                    </div>
                                </div>
                                {submission.audit_date && (
                                    <span className="px-2.5 py-1 bg-amber-200/70 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        Sudah Dijadwalkan
                                    </span>
                                )}
                            </div>

                            {(user?.role === 'BUSINESS_DEVELOPMENT' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                                <div className="bg-white/80 p-3 rounded-xl border border-amber-100 space-y-2">
                                    <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest">
                                        {submission.audit_date ? 'Ubah Tanggal Audit' : 'Tetapkan Tanggal Audit'}
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input 
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                            value={auditDate}
                                            onChange={(e) => setAuditDate(e.target.value)}
                                        />
                                        <button 
                                            onClick={() => onSaveAuditInfo(auditDate)}
                                            disabled={processing || !auditDate}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 shadow-sm"
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Tanggal'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {submission.audit_date ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-200/50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-900">Tanggal Audit Terdaftar:</span>
                                        <span className="text-xs font-black text-amber-900 font-mono">
                                            {new Date(submission.audit_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                        </span>
                                    </div>

                                    {(user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                                        <div className="pt-2 border-t border-amber-200/60 space-y-3">
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest">File Hasil Audit 1 (Utama)</label>
                                                <FileUpload 
                                                    subfolder="audit" 
                                                    label="Upload Laporan 1"
                                                    onUploadSuccess={(url) => onSaveAuditResult(url, submission.audit_result_2_url || "")}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest">File Hasil Audit 2 (Opsional)</label>
                                                <FileUpload 
                                                    subfolder="audit" 
                                                    label="Upload Laporan 2"
                                                    onUploadSuccess={(url) => onSaveAuditResult(submission.audit_result_1_url || "", url)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-xs font-semibold text-amber-700 bg-amber-100/40 p-3 rounded-xl border border-amber-200/40">
                                    Jadwal audit belum ditetapkan oleh Marketing & BD Manager.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Penunjukan Advisor oleh Marketing / Halal Manager jika belum ada pendamping atau berstatus WAITING_ASSIGNMENT */}
                    {(submission.status === 'WAITING_ASSIGNMENT' || !submission.consultant_id) && isMarketingRole && (
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3 shadow-sm">
                            <label className="flex items-center gap-2 text-xs font-black text-purple-900 uppercase tracking-wider">
                                <UserCheck className="w-4 h-4 text-purple-700" /> Penunjukan Pendamping Halal (Advisor)
                            </label>
                            <p className="text-[11px] text-purple-700 font-medium leading-relaxed">
                                Tentukan Pendamping Halal bersertifikat untuk memverifikasi data dan mendampingi pelaku usaha ini.
                            </p>
                            <select
                                className="glass-input text-xs font-bold w-full bg-white"
                                value={selectedConsultantId}
                                onChange={e => setSelectedConsultantId(e.target.value)}
                            >
                                <option value="">-- Pilih Pendamping Halal --</option>
                                {consultants.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name} ({c.role_name || 'Advisor'})</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => onAction('assign_consultant', { consultantId: selectedConsultantId })}
                                disabled={processing || !selectedConsultantId}
                                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                            >
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                Tunjuk Pendamping Halal
                            </button>
                        </div>
                    )}

                    {/* Sesi Konsultasi & Penetapan Jenis Layanan oleh Advisor */}
                    {isAdvisorRole && (
                        <div className="p-5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4 text-indigo-600" /> Sesi Konsultasi: Penetapan Jenis Layanan
                                </label>
                                {submission.service_type && submission.service_type !== 'PENDING_CONSULTATION' && (
                                    <span className="text-[10px] bg-indigo-200/70 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                                        Saat ini: {submission.service_type}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-indigo-700/90 font-medium leading-relaxed">
                                Berdasarkan hasil pertemuan konsultasi dan evaluasi profil usaha dengan pelaku usaha, tetapkan jenis layanan yang sesuai di bawah ini:
                            </p>

                            <div className="space-y-2">
                                <label className={`flex flex-col gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedServiceType === 'REGULER' ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm' : 'bg-white/60 border-gray-200 hover:bg-white'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="radio" 
                                            name="advisorServiceType" 
                                            value="REGULER" 
                                            checked={selectedServiceType === 'REGULER'} 
                                            onChange={() => setSelectedServiceType('REGULER')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Jalur Reguler (Pemeriksaan LPH & Audit)</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Untuk usaha dengan omzet &gt; Rp500jt atau produk berisiko / sembelihan</p>
                                        </div>
                                    </div>

                                    {/* Termin & DP Percentage selector if Reguler */}
                                    {selectedServiceType === 'REGULER' && (
                                        <div 
                                            className="mt-1 p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 cursor-pointer">
                                                    <input 
                                                        type="radio"
                                                        name="wf_payment_scheme"
                                                        checked={selectedPaymentScheme === 'TERMIN'}
                                                        onChange={() => setSelectedPaymentScheme('TERMIN')}
                                                        className="text-indigo-600"
                                                    />
                                                    <span>Termin (DP + Pelunasan)</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 cursor-pointer">
                                                    <input 
                                                        type="radio"
                                                        name="wf_payment_scheme"
                                                        checked={selectedPaymentScheme === 'FULL'}
                                                        onChange={() => setSelectedPaymentScheme('FULL')}
                                                        className="text-indigo-600"
                                                    />
                                                    <span>100% Penuh di Awal</span>
                                                </label>
                                            </div>

                                            {selectedPaymentScheme === 'TERMIN' && (
                                                <div className="space-y-1.5 pt-1 border-t border-indigo-100/60">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-900">
                                                        <span>Persentase DP Awal:</span>
                                                        <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                                                            DP {selectedDPPercentage === -1 ? (customDPPercentage || '70') : selectedDPPercentage}% / Pelunasan {100 - (selectedDPPercentage === -1 ? (Number(customDPPercentage) || 70) : selectedDPPercentage)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {[50, 60, 70, 80].map(pct => (
                                                            <button
                                                                key={pct}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedDPPercentage(pct);
                                                                    setCustomDPPercentage('');
                                                                }}
                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                                                    selectedDPPercentage === pct
                                                                        ? 'bg-indigo-600 text-white'
                                                                        : 'bg-white text-gray-700 border border-gray-200'
                                                                }`}
                                                            >
                                                                {pct}%
                                                            </button>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDPPercentage(-1)}
                                                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                                                selectedDPPercentage === -1
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-white text-gray-700 border border-gray-200'
                                                            }`}
                                                        >
                                                            Kustom %
                                                        </button>
                                                    </div>
                                                    {selectedDPPercentage === -1 && (
                                                        <input 
                                                            type="number"
                                                            min="10"
                                                            max="90"
                                                            placeholder="DP % (misal 65)"
                                                            value={customDPPercentage}
                                                            onChange={e => setCustomDPPercentage(e.target.value)}
                                                            className="w-full p-1.5 rounded border border-gray-300 text-xs font-bold bg-white"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </label>

                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedServiceType === 'SELF_DECLARE' ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm' : 'bg-white/60 border-gray-200 hover:bg-white'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="advisorServiceType" 
                                        value="SELF_DECLARE" 
                                        checked={selectedServiceType === 'SELF_DECLARE'} 
                                        onChange={() => {
                                            setSelectedServiceType('SELF_DECLARE');
                                            setSelectedSelfDeclareType('GRATIS');
                                        }}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">Self Declare - Fasilitasi BPJPH (Gratis / Subsidi)</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Usaha mikro berisiko rendah yang memenuhi syarat fasilitasi BPJPH</p>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedServiceType === 'SELF_DECLARE_MANDIRI' ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm' : 'bg-white/60 border-gray-200 hover:bg-white'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="advisorServiceType" 
                                        value="SELF_DECLARE_MANDIRI" 
                                        checked={selectedServiceType === 'SELF_DECLARE_MANDIRI'} 
                                        onChange={() => setSelectedServiceType('SELF_DECLARE_MANDIRI')}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">Self Declare - Mandiri (Biaya Sendiri)</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Self declare tanpa kuota subsidi dengan biaya pendampingan mandiri</p>
                                    </div>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={handleSetServiceType}
                                disabled={settingServiceType}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {settingServiceType ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Simpan Penetapan Jenis Layanan
                            </button>
                        </div>
                    )}

                    {/* Aksi Manager Marketing: Penerusan ke Manager Operasional dengan Syarat Pembayaran */}
                    {isMarketingRole && (
                        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-2xl border border-amber-200 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                                <label className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wider">
                                    <DollarSign className="w-4 h-4 text-amber-700" /> Aksi Manager Marketing: Penerusan ke Operasional
                                </label>
                                {isPaymentCompleted ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pembayaran Terkonfirmasi
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Menunggu Pembayaran
                                    </span>
                                )}
                            </div>

                            <p className="text-[11px] text-amber-900/80 font-medium leading-relaxed">
                                Manager Marketing dapat meneruskan pengajuan ini ke <strong>Manager Operasional</strong> agar dapat diproses oleh QC Officer dan Drafter.
                                {!isPaymentCompleted && (
                                    <span className="block mt-1 font-bold text-red-600">
                                        ⚠️ Pengajuan hanya dapat diteruskan setelah Klien melakukan pembayaran tagihan terkait.
                                    </span>
                                )}
                            </p>

                            <button
                                type="button"
                                onClick={() => triggerConfirm(
                                    'Lanjutkan ke Manager Operasional',
                                    'Pastikan seluruh data dan pembayaran telah valid. Apakah Anda yakin ingin meneruskan pengajuan ini ke alur Manager Operasional?',
                                    handleForwardToOperational
                                )}
                                disabled={!isPaymentCompleted || forwardingToOperational}
                                className={`w-full py-3 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                                    isPaymentCompleted 
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-95' 
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                }`}
                            >
                                {forwardingToOperational ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Meneruskan ke Operasional...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-4 h-4" />
                                        Lanjutkan ke Manager Operasional
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Penyerahan Dokumen SJPH oleh Pendamping Halal saat status VERVAL_PENDAMPING */}
                    {submission.status === 'VERVAL_PENDAMPING' && (user?.role === 'HALAL_ADVISOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_MANAGER') && (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 shadow-sm">
                            <label className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-wider">
                                📋 Penyerahan Dokumen SJPH
                            </label>
                            <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                                Dokumen SJPH dibuat otomatis oleh sistem. Anda dapat memberikan catatan verifikasi kepada pelaku usaha sebelum menyerahkan dokumen.
                            </p>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Catatan Pendamping (Opsional)</label>
                                <textarea
                                    className="w-full p-2.5 rounded-xl border border-emerald-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    rows={2}
                                    placeholder="Catatan hasil verval untuk pelaku usaha..."
                                    value={sjphNotes}
                                    onChange={(e) => setSjphNotes(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={async () => {
                                    if (onSubmitSJPH) {
                                        await onSubmitSJPH('', sjphNotes);
                                    }
                                }}
                                disabled={processing}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 active:scale-95"
                            >
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Verifikasi & Serahkan Dokumen SJPH
                            </button>
                        </div>
                    )}

                    {submission.status === 'QC_OFFICER' && submission.consultant_id && (user?.role === 'QC_OFFICER' || user?.role === 'VERIFIKATOR' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                            <label className="flex items-center justify-between text-sm font-semibold text-blue-800">
                                <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> Pilih Drafter</span>
                                {submission.assigned_drafter && (
                                    <span className="text-[10px] bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded font-bold">
                                        Sudah Ada Drafter
                                    </span>
                                )}
                            </label>
                            <select
                                className="glass-input text-sm w-full"
                                value={selectedDrafterId || submission.assigned_drafter_id || ''}
                                onChange={e => setSelectedDrafterId(e.target.value)}
                            >
                                <option value="">-- Pilih Drafter --</option>
                                {drafters.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                            </select>
                            {submission.assigned_drafter && !selectedDrafterId && (
                                <p className="text-[11px] text-blue-600 italic">
                                    Akan otomatis menggunakan Drafter saat ini ({submission.assigned_drafter.full_name}) jika tidak diubah.
                                </p>
                            )}
                        </div>
                    )}

                    {submission.status === 'REVIEW_SJPH_CLIENT' && (user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                            <p className="text-xs text-emerald-800 font-bold">
                                Dokumen SJPH sedang menunggu persetujuan Pelaku Usaha. Sebagai Admin/Director, Anda dapat menyetujui langsung.
                            </p>
                            <button
                                onClick={() => triggerConfirm(
                                    'Persetujuan SJPH (Admin Override)',
                                    'Apakah Anda yakin ingin menyetujui Dokumen SJPH dan meneruskan berkas ke Manager Operasional?',
                                    () => onApproveSJPH && onApproveSJPH()
                                )}
                                disabled={processing}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Setujui SJPH (Admin Override)
                            </button>
                        </div>
                    )}

                    {showApprove && (
                        <button
                            onClick={() => triggerConfirm(
                                'Konfirmasi Aksi',
                                `Apakah Anda yakin ingin melakukan aksi "${getApproveLabel()}"?`,
                                () => onAction('approve', { drafter_id: effectiveDrafterId })
                            )}
                            disabled={processing || (submission.status === 'QC_OFFICER' && !effectiveDrafterId)}
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
                            className="w-full glass-button bg-amber-500 text-white hover:bg-amber-600 border-amber-400 flex justify-center items-center gap-2 shadow-md"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {getRejectLabel()}
                        </button>
                    )}

                    {canIssueSHDirect && (
                        <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4">
                            <label className="block text-xs font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Upload & Terbitkan Sertifikat Halal
                            </label>
                            <input 
                                type="file" 
                                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setShFile(e.target.files?.[0] || null)}
                            />
                            {shFile && (
                                <button
                                    onClick={handleIssueSH}
                                    disabled={processing}
                                    className="w-full glass-button bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-500 flex justify-center items-center gap-2 shadow-md"
                                >
                                    {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    Konfirmasi & Terbitkan SH
                                </button>
                            )}
                        </div>
                    )}

                    {submission.status === 'SH_TERBIT' && (user?.role === 'ADMIN_KEUANGAN' || user?.role === 'FINANCE' || user?.role === 'LEGAL' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'MANAGER') && (
                        <div className="pt-2">
                            <button
                                onClick={() => triggerConfirm(
                                    'Batalkan / Ganti File SH',
                                    'Apakah Anda yakin ingin membatalkan penerbitan SH ini untuk mengunggah ulang file Sertifikat Halal yang benar?',
                                    () => onRevokeSH && onRevokeSH()
                                )}
                                disabled={processing}
                                className="w-full glass-button bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-300 flex justify-center items-center gap-2 shadow-sm font-bold text-xs"
                            >
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                                Batalkan / Ganti File SH
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Reject / Return Modal */}
            <Modal 
                isOpen={showRejectModal} 
                onClose={() => setShowRejectModal(false)}
                title="Pengembalian Data / Catatan Revisi"
                maxWidth="md"
            >
                <div className="space-y-5">
                    {/* Destination Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                            Pilih Tujuan Pengembalian Data
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {submission.assigned_drafter && (
                                <button
                                    type="button"
                                    onClick={() => setTargetStatus('DRAFTER')}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        targetStatus === 'DRAFTER' 
                                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-amber-900' 
                                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                                >
                                    <div className="font-bold text-xs">Direct to Drafter</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">Drafter: {submission.assigned_drafter.full_name}</div>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setTargetStatus('VERVAL_PENDAMPING')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    targetStatus === 'VERVAL_PENDAMPING' 
                                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-amber-900' 
                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="font-bold text-xs">Kembalikan ke Advisor</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Verval Pendamping</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTargetStatus('REVISION')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    targetStatus === 'REVISION' 
                                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-amber-900' 
                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="font-bold text-xs">Kembalikan ke Klien</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Revisi Data Klien</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTargetStatus('QC_OFFICER')}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    targetStatus === 'QC_OFFICER' 
                                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-amber-900' 
                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            >
                                <div className="font-bold text-xs">Kembalikan ke QC</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">QC Officer Review</div>
                            </button>
                        </div>
                    </div>

                    {/* Invalid Fields Checklist */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                            Pilih Bagian Data yang Bermasalah / Perlu Revisi
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {invalidFieldOptions.map(option => {
                                const checked = selectedInvalidFields.includes(option);
                                return (
                                    <label key={option} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                        checked ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}>
                                        <input 
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleInvalidField(option)}
                                            className="rounded text-red-600 focus:ring-red-500"
                                        />
                                        <span>{option}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reject Note Textarea */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                            Catatan Detail & Instruksi Perbaikan
                        </label>
                        <textarea
                            className="w-full glass-input text-xs"
                            rows={4}
                            placeholder="Tuliskan catatan perbaikan atau instruksi detail di sini..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => setShowRejectModal(false)} 
                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={processing || (!rejectNote && selectedInvalidFields.length === 0)}
                            className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-black text-xs shadow-lg shadow-amber-100 hover:bg-amber-700 disabled:opacity-30 transition-all flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Kirim Pengembalian Data
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
