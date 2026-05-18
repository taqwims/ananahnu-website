import type { Submission, User } from '../../../types';
import Modal from '../../ui/Modal';

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: Submission | null;
    rejectNote: string;
    setRejectNote: (v: string) => void;
    consultants: User[];
    selectedConsultant: string;
    setSelectedConsultant: (v: string) => void;
    onReject: (action: 'reject' | 'reject_consultant') => Promise<void>;
    processing: boolean;
}

export const RejectModal = ({
    isOpen,
    onClose,
    submission,
    rejectNote,
    setRejectNote,
    consultants,
    selectedConsultant,
    setSelectedConsultant,
    onReject,
    processing
}: RejectModalProps) => {
    if (!submission) return null;

    const isMarketing = submission.data_source === 'MARKETING';

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Kembalikan Pengajuan"
            maxWidth="md"
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Pilih tujuan pengembalian dan berikan catatan perbaikan.
                    </p>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Catatan Perbaikan</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium min-h-[100px]"
                            placeholder="Jelaskan apa yang perlu diperbaiki..."
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                        />
                    </div>

                    {isMarketing && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tunjuk Advisor (Data Marketing)</label>
                            <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold"
                                value={selectedConsultant}
                                onChange={e => setSelectedConsultant(e.target.value)}
                            >
                                <option value="">-- Pilih Advisor Baru --</option>
                                {consultants.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onReject('reject')}
                            disabled={processing || !rejectNote.trim()}
                            className="flex-1 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100 disabled:opacity-50"
                        >
                            Balik ke Drafter
                        </button>
                        <button 
                            onClick={() => onReject('reject_consultant')}
                            disabled={processing || !rejectNote.trim() || (isMarketing && !selectedConsultant)}
                            className="flex-1 py-4 bg-brand-50 text-brand-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-100 transition-all border border-brand-100 disabled:opacity-50"
                        >
                            Balik ke Advisor
                        </button>
                    </div>
                    <button 
                        onClick={onClose}
                        className="py-3 text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </Modal>
    );
};
