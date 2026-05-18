import { Calendar, X, Edit3, Loader2, Save, FileText, Eye, AlertCircle, ShieldCheck, CheckCircle, CheckCircle2, Send } from 'lucide-react';
import type { Submission } from '../../../types';
import FileUpload from '../FileUpload';
import { useState } from 'react';

interface QCReviewPanelProps {
    submission: Submission | null;
    auditDate: string;
    setAuditDate: (v: string) => void;
    isEditingAudit: boolean;
    setIsEditingAudit: (v: boolean) => void;
    onUpdateAudit: () => Promise<void>;
    onIssueSH: (shUrl: string) => Promise<void>;
    processing: boolean;
}

export const QCReviewPanel = ({
    submission,
    auditDate,
    setAuditDate,
    isEditingAudit,
    setIsEditingAudit,
    onUpdateAudit,
    onIssueSH,
    processing
}: QCReviewPanelProps) => {
    const [shUrl, setShUrl] = useState('');

    if (!submission) return null;

    const isNIBValid = submission.client?.nib && !submission.client?.nib.startsWith('DRAFT-');

    return (
        <div className="w-[400px] flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-6">
            {submission.service_type === 'REGULER' && (
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
                                        onClick={onUpdateAudit}
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
                                    {submission.audit_date ? new Date(submission.audit_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Belum dijadwalkan'}
                                </div>
                            )}
                        </div>

                        {submission.audit_result_1_url && (
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
                                <a href={`${import.meta.env.VITE_API_URL}${submission.audit_result_1_url}`} target="_blank" rel="noreferrer" className="p-2 bg-white text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm border border-gray-100">
                                    <Eye className="w-4 h-4" />
                                </a>
                            </div>
                        )}

                        {submission.audit_result_2_url && (
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
                                <a href={`${import.meta.env.VITE_API_URL}${submission.audit_result_2_url}`} target="_blank" rel="noreferrer" className="p-2 bg-white text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm border border-gray-100">
                                    <Eye className="w-4 h-4" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Penerbitan SH (Jika status Sidang Fatwa) */}
            {submission.status === 'SIDANG_FATWA' && (
                <div className="glass-panel p-6 border-emerald-200 shadow-xl bg-emerald-50/30">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                        <h3 className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">Penerbitan Sertifikat</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-white/80 rounded-2xl border border-emerald-100">
                            <label className="block text-[8px] font-black text-emerald-700 uppercase tracking-widest mb-3">Upload File Sertifikat (PDF/JPG)</label>
                            <FileUpload 
                                subfolder="sh" 
                                label="Pilih Sertifikat"
                                onUploadSuccess={(url) => setShUrl(url)}
                            />
                        </div>

                        {shUrl && (
                            <button
                                onClick={() => onIssueSH(shUrl)}
                                disabled={processing}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Terbitkan Sertifikat Halal
                            </button>
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
                    {submission.service_type === 'REGULER' && (
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
                    {!isNIBValid && (
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
    );
};
