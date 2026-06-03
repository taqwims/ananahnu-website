import { Send, Calendar, CheckCircle, Loader2, FileText } from 'lucide-react';
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

    return (
        <div className="glass-panel p-6 border-white/60 shadow-xl bg-white/40">
            <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                Penyelesaian Tugas
            </h3>

            <div className="space-y-6">
                <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <label className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Tanggal Audit (Reguler)
                    </label>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 p-2.5 bg-white/60 rounded-xl mb-2">
                        <Calendar className="w-4 h-4 text-brand-500" />
                        {submission.audit_date ? new Date(submission.audit_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Belum dijadwalkan'}
                    </div>
                    
                    {submission.service_type === 'REGULER' && submission.audit_date && (
                        <div className="mt-4 pt-4 border-t border-brand-100 space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-brand-700 uppercase tracking-widest">
                                    <FileText className="w-3 h-3" /> Hasil Audit 1 (Utama)
                                </label>
                                <FileUpload 
                                    subfolder="audit" 
                                    label="Upload Laporan 1"
                                    onUploadSuccess={(url) => onSaveAuditResult(url, submission.audit_result_2_url || "")}
                                />
                                {submission.audit_result_1_url && (
                                    <p className="text-[9px] text-green-600 font-bold flex items-center gap-1">
                                        <CheckCircle className="w-2.5 h-2.5" /> File 1 Terunggah
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-brand-700 uppercase tracking-widest">
                                    <FileText className="w-3 h-3" /> Hasil Audit 2 (Opsional)
                                </label>
                                <FileUpload 
                                    subfolder="audit" 
                                    label="Upload Laporan 2"
                                    onUploadSuccess={(url) => onSaveAuditResult(submission.audit_result_1_url || "", url)}
                                />
                                {submission.audit_result_2_url && (
                                    <p className="text-[9px] text-green-600 font-bold flex items-center gap-1">
                                        <CheckCircle className="w-2.5 h-2.5" /> File 2 Terunggah
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <p className="text-[9px] text-brand-600 mt-2 font-medium">* Tanggal audit & file laporan wajib diisi untuk layanan reguler.</p>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => onAction('approve')}
                        disabled={processing || (submission.service_type === 'REGULER' && (!submission.audit_date || !submission.audit_result_1_url))}
                        className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 hover:bg-brand-700 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:scale-100"
                    >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Selesaikan & Kirim ke QC
                    </button>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <div className="p-1 bg-gray-200 rounded-full">
                            <CheckCircle className="w-3 h-3 text-gray-400" />
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold leading-tight">
                            Pastikan semua dokumen telah diverifikasi dan laporan audit telah diunggah sebelum mengirim ke QC Review.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
