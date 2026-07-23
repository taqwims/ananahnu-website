import { ExternalLink, ArrowLeft, Building2, User, Clock } from 'lucide-react';
import type { Submission } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface WorkspaceHeaderProps {
    submission: Submission | null;
    setActiveSubId: (id: string | null) => void;
}

export const WorkspaceHeader = ({ submission, setActiveSubId }: WorkspaceHeaderProps) => {
    if (!submission) return null;

    return (
        <div className="glass-panel p-4 flex items-center justify-between border-white/60 shadow-lg">
            <div className="flex items-center gap-3">
                <a 
                    href={`/dashboard/submissions/${submission.id}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-brand-200 shadow-sm"
                    title="Buka Halaman Detail untuk Tampilan Edit Luas"
                >
                    <ExternalLink className="w-4 h-4" />
                    <span>Edit Lengkap (Tampilan Luas)</span>
                </a>
                <button
                    onClick={() => setActiveSubId(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors xl:hidden"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">
                            {submission.client?.business_name}
                        </h2>
                        <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-600 text-[8px] font-black uppercase tracking-widest border border-brand-100">
                            {formatServiceType(submission.service_type)}
                        </span>
                        {submission.has_been_returned || submission.reject_note ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[8px] font-black uppercase tracking-widest border border-amber-300 shadow-sm">
                                ⚡ Pengembalian Data / Revisi
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-[8px] font-black uppercase tracking-widest border border-emerald-300 shadow-sm">
                                ✨ Pekerjaan Baru
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <User className="w-3 h-3" /> {submission.client?.client_name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <Building2 className="w-3 h-3" /> NIB: {submission.client?.nib || '-'}
                        </div>
                    </div>
                    {submission.reject_note && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-medium leading-tight">
                            <strong className="font-bold text-amber-900 uppercase text-[9px] block mb-0.5">Catatan Perbaikan:</strong>
                            {submission.reject_note}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Progress Dokumen</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-brand-600">80%</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-600 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                </div>
                <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-xl border border-brand-100">
                    <Clock className="w-4 h-4 text-brand-600" />
                    <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">SLA: 2 Hari Lagi</span>
                </div>
            </div>
        </div>
    );
};
