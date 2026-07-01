import { ExternalLink, ArrowLeft, Loader2, UserPlus, XCircle, CheckCircle2 } from 'lucide-react';
import type { Submission, User } from '../../../types';

interface QCWorkspaceHeaderProps {
    submission: Submission | null;
    setActiveSubId: (id: string | null) => void;
    drafters: User[];
    selectedDrafter: string;
    setSelectedDrafter: (v: string) => void;
    onDistribute: () => Promise<void>;
    onReject: () => void;
    onApprove: () => Promise<void>;
    processing: boolean;
}

export const QCWorkspaceHeader = ({
    submission,
    setActiveSubId,
    drafters,
    selectedDrafter,
    setSelectedDrafter,
    onDistribute,
    onReject,
    onApprove,
    processing
}: QCWorkspaceHeaderProps) => {
    if (!submission) return null;

    const isDistributing = submission.status === 'QC_OFFICER';
    const isReviewing = submission.status === 'QC_REVIEW';
    const isFatwa = submission.status === 'SIDANG_FATWA';

    const canApprove = !processing && 
                      submission.client?.nib && 
                      !submission.client?.nib.startsWith('DRAFT-');

    return (
        <div className="glass-panel p-4 flex items-center justify-between border-white/60 shadow-lg">
            <div className="flex items-center gap-3">
                <a 
                    href={`/dashboard/submissions/${submission.id}`} 
                    rel="noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-brand-600 group relative"
                    title="Buka Detail Lengkap"
                >
                    <ExternalLink className="w-5 h-5" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Buka Detail Lengkap
                    </span>
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
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[8px] font-black uppercase tracking-widest rounded-md">
                            {submission.status}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">ID: {submission.id}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isDistributing ? (
                    <div className="flex items-center gap-2">
                        <select 
                            className="px-4 py-2 bg-white border border-brand-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500/20 outline-none min-w-[180px]"
                            value={selectedDrafter}
                            onChange={e => setSelectedDrafter(e.target.value)}
                        >
                            <option value="">-- Pilih Drafter --</option>
                            {drafters.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                        </select>
                        <button
                            onClick={onDistribute}
                            disabled={processing || !selectedDrafter}
                            className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Distribusikan
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={onReject}
                            disabled={processing}
                            className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-xs hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            {isFatwa ? 'Tolak & Balik Drafter' : 'Kembalikan ke Drafter'}
                        </button>
                        {isReviewing ? (
                            <button
                                onClick={onApprove}
                                disabled={!canApprove}
                                className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Setujui & Lanjutkan ke Fatwa
                            </button>
                        ) : (
                            <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-[10px] font-black uppercase tracking-tight">
                                Menunggu Hasil Sidang Fatwa
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
