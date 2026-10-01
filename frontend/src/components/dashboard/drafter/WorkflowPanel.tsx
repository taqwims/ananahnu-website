import { Send, Calendar, CheckCircle, Loader2, FileText, Building2, User, AlertTriangle } from 'lucide-react';
import type { Submission } from '../../../types';
import FileUpload from '../FileUpload';

interface WorkflowPanelProps {
    submission: Submission | null;
    onAction: (action: 'approve') => Promise<void>;
    onSaveAuditResult: (url1: string, url2: string) => Promise<void>;
    processing: boolean;
}

export const WorkflowPanel = ({
    submission,
    onAction,
    onSaveAuditResult,
    processing
}: WorkflowPanelProps) => {
    if (!submission) return null;

    const isReguler = submission.service_type === 'REGULER';
    const isMissingAuditResult = isReguler && (!submission.audit_date || !submission.audit_result_1_url);

    return (
        <div className="glass-panel p-6 border-white/60 shadow-xl bg-white/40 space-y-6">
            <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase flex items-center gap-2">
                <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                Penyelesaian Tugas & Audit
            </h3>

            {/* Audit Information Section */}
            {isReguler && (
                <div className="p-4 bg-gradient-to-br from-amber-50/90 to-orange-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" /> Informasi Jadwal Audit
                        </label>
                        {submission.audit_result_1_url ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-full border border-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Hasil Lengkap
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[9px] rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Perlu Hasil Audit
                            </span>
                        )}
                    </div>

                    <div className="space-y-1.5 text-xs bg-white/80 p-3 rounded-xl border border-amber-100">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Tanggal:
                            </span>
                            <span className="font-bold text-gray-900">
                                {submission.audit_date 
                                    ? new Date(submission.audit_date).toLocaleDateString('id-ID', { dateStyle: 'full' })
                                    : 'Belum dijadwalkan'}
                            </span>
                        </div>
                        {submission.lph_name && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> Mitra LPH:
                                </span>
                                <span className="font-bold text-gray-900">{submission.lph_name}</span>
                            </div>
                        )}
                        {submission.auditor_name && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-gray-400" /> Auditor Halal:
                                </span>
                                <span className="font-bold text-gray-900">{submission.auditor_name}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* File Upload Section */}
                    <div className="pt-2 border-t border-amber-200/60 space-y-3">
                        <div className="space-y-1.5">
                            <label className="flex items-center justify-between text-[10px] font-black text-amber-900 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-amber-600" /> Laporan Hasil Audit 1 (Utama) *</span>
                                {submission.audit_result_1_url && (
                                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                        <CheckCircle className="w-2.5 h-2.5" /> Terunggah
                                    </span>
                                )}
                            </label>
                            <FileUpload 
                                subfolder="audit" 
                                label="Upload Laporan Hasil Audit 1"
                                onUploadSuccess={(url) => onSaveAuditResult(url, submission.audit_result_2_url || "")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="flex items-center justify-between text-[10px] font-black text-amber-900 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-amber-600" /> Laporan Hasil Audit 2 (Opsional / Lampiran)</span>
                                {submission.audit_result_2_url && (
                                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                        <CheckCircle className="w-2.5 h-2.5" /> Terunggah
                                    </span>
                                )}
                            </label>
                            <FileUpload 
                                subfolder="audit" 
                                label="Upload Lampiran Hasil Audit 2"
                                onUploadSuccess={(url) => onSaveAuditResult(submission.audit_result_1_url || "", url)}
                            />
                        </div>
                    </div>
                    
                    <p className="text-[9px] text-amber-800 font-medium">
                        * Wajib mengunggah Laporan Hasil Audit 1 sebelum mengirim berkas ke tahap QC Review.
                    </p>
                </div>
            )}

            {/* Submission Action Button */}
            <div className="space-y-3 pt-1">
                <button
                    onClick={() => onAction('approve')}
                    disabled={processing || isMissingAuditResult}
                    className="w-full py-3.5 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-200/50 hover:bg-brand-700 hover:scale-[1.01] active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:scale-100"
                >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Selesaikan & Kirim ke QC
                </button>

                {isMissingAuditResult && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[10px] font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Pengajuan Reguler memerlukan tanggal audit dan upload Laporan Hasil Audit 1.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
