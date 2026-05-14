import { Send, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import type { Submission } from '../../../types';

interface WorkflowPanelProps {
    submission: Submission | null;
    auditDate: string;
    setAuditDate: (v: string) => void;
    onAction: (action: 'audit-info' | 'approve') => Promise<void>;
    processing: boolean;
}

export const WorkflowPanel = ({
    submission,
    auditDate,
    setAuditDate,
    onAction,
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
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="flex-1 px-4 py-2.5 bg-white border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-500/20"
                            value={auditDate}
                            onChange={e => setAuditDate(e.target.value)}
                        />
                        <button
                            onClick={() => onAction('audit-info')}
                            disabled={processing || !auditDate}
                            className="px-4 py-2 bg-brand-100 text-brand-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-200 transition-all disabled:opacity-50"
                        >
                            Update
                        </button>
                    </div>
                    <p className="text-[9px] text-brand-600 mt-2 font-medium">* Tanggal audit wajib diisi untuk layanan reguler sebelum approve.</p>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => onAction('approve')}
                        disabled={processing || (submission.service_type === 'REGULER' && !submission.audit_date && !auditDate)}
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
                            Pastikan semua dokumen telah diverifikasi dan diperbaiki jika perlu sebelum mengirim ke QC Review.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
