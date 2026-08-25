import React, { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';
import type { ReturnAdvisorModalProps } from '../../../types/operational';

export function ReturnAdvisorModal({
    isOpen,
    onClose,
    submissionId,
    submissionNo,
    businessName,
    advisorName,
    onSuccess
}: ReturnAdvisorModalProps) {
    const [returnNote, setReturnNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnNote.trim()) {
            toast.error('Mohon isi catatan perbaikan pengembalian');
            return;
        }

        setIsSubmitting(true);
        try {
            await operationalService.returnToAdvisor(submissionId, returnNote);
            toast.success(`Pengajuan ${submissionNo} berhasil dikembalikan ke Halal Advisor (${advisorName}).`);
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error('Gagal mengembalikan pengajuan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-150 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600">
                        <RotateCcw className="w-5 h-5" />
                        <h3 className="text-base font-black text-gray-900">Kembalikan ke Advisor</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-gray-600">
                    Pengajuan <strong className="text-gray-900 font-mono">{submissionNo}</strong> ({businessName}) akan dikembalikan ke Halal Advisor (<strong className="text-gray-900">{advisorName}</strong>) untuk perbaikan data.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Catatan Perbaikan / Alasan Pengembalian *</label>
                        <textarea
                            rows={3}
                            value={returnNote}
                            onChange={(e) => setReturnNote(e.target.value)}
                            placeholder="Contoh: Dokumen NIB belum terlampir, foto area produksi kurang jelas..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !returnNote.trim()}
                            className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-sm cursor-pointer"
                        >
                            {isSubmitting ? 'Mengembalikan...' : 'Kembalikan Berkas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
