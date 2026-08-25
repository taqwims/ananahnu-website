import React, { useState, useEffect } from 'react';
import { Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';
import type { ChangePriorityModalProps, PriorityLevel } from '../../../types/operational';

export function ChangePriorityModal({
    isOpen,
    onClose,
    submissionId,
    submissionNo,
    currentPriority,
    onSuccess
}: ChangePriorityModalProps) {
    const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>(currentPriority || 'Normal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentPriority) {
            setSelectedPriority(currentPriority);
        }
    }, [currentPriority]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const pCode = selectedPriority === 'Kritis' ? 'CRITICAL' : selectedPriority === 'Mendesak' ? 'URGENT' : selectedPriority === 'Tinggi' ? 'HIGH' : 'NORMAL';
            await operationalService.updatePriority(submissionId, pCode);
            toast.success(`Prioritas pengajuan ${submissionNo} berhasil diubah menjadi ${selectedPriority}.`);
            onSuccess?.(selectedPriority);
            onClose();
        } catch (err) {
            toast.error('Gagal memperbarui prioritas');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-150 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-600">
                        <Tag className="w-5 h-5" />
                        <h3 className="text-base font-black text-gray-900">Ubah Prioritas</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-gray-600">
                    Pilih tingkat prioritas penanganan untuk <strong className="font-mono text-gray-900">{submissionNo}</strong>:
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="space-y-2">
                        {(['Normal', 'Tinggi', 'Mendesak', 'Kritis'] as PriorityLevel[]).map((p) => (
                            <label
                                key={p}
                                onClick={() => setSelectedPriority(p)}
                                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                                    selectedPriority === p
                                        ? 'bg-brand-50 border-brand-500 font-black text-brand-900 shadow-xs'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="text-xs">{p}</span>
                                <input
                                    type="radio"
                                    name="priorityOption"
                                    checked={selectedPriority === p}
                                    onChange={() => setSelectedPriority(p)}
                                    className="text-brand-600"
                                />
                            </label>
                        ))}
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
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50 rounded-xl shadow-sm cursor-pointer"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Prioritas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
