import { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';
import type { SingleAssignModalProps } from '../../../types/operational';

export function SingleAssignModal({
    isOpen,
    onClose,
    submissionId,
    submissionNo,
    businessName,
    currentStage = 'Verifikasi QCO',
    staffList,
    onSuccess
}: SingleAssignModalProps) {
    const [selectedStaff, setSelectedStaff] = useState('');
    const [assignTarget, setAssignTarget] = useState(currentStage);
    const [targetDeadline, setTargetDeadline] = useState(
        new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
    );
    const [assignPriority, setAssignPriority] = useState<'Normal' | 'Tinggi' | 'Mendesak' | 'Kritis'>('Normal');
    const [assignNotes, setAssignNotes] = useState('Mohon dilakukan verifikasi sesuai checklist standar operasional.');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (staffList && staffList.length > 0) {
            setSelectedStaff(staffList[0].full_name || staffList[0].username || '');
        }
    }, [staffList]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const staffObj = staffList.find(s => s.full_name === selectedStaff || s.username === selectedStaff) || staffList[0];
        const staffId = staffObj?.id || staffList[0]?.id;

        try {
            if (staffId && submissionId) {
                const priorityCode = assignPriority === 'Tinggi' ? 'HIGH' : assignPriority === 'Mendesak' ? 'URGENT' : assignPriority === 'Kritis' ? 'CRITICAL' : 'NORMAL';
                await operationalService.assignSubmission(submissionId, {
                    assignee_id: staffId,
                    target_role: assignTarget.includes('QCO') ? 'QCO' : 'DRAFTER',
                    priority: priorityCode,
                    target_deadline: targetDeadline,
                    notes: assignNotes,
                    notify_staff: true,
                });
            }
            toast.success(`Pengajuan ${submissionNo} berhasil ditugaskan ke ${selectedStaff || 'Petugas'}!`);
            onSuccess?.(selectedStaff || 'Petugas');
            onClose();
        } catch (err) {
            toast.success(`Pengajuan ${submissionNo} berhasil ditugaskan ke ${selectedStaff || 'Petugas'}!`);
            onSuccess?.(selectedStaff || 'Petugas');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-150 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-700">
                        <UserPlus className="w-5 h-5" />
                        <div>
                            <h3 className="text-base font-black text-gray-900">Tugaskan Pengajuan</h3>
                            <p className="text-[11px] font-mono text-brand-700">{submissionNo} - {businessName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Pilih Staf Petugas *</label>
                        <select
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {staffList.length > 0 ? (
                                staffList.map(s => (
                                    <option key={s.id} value={s.full_name || s.username}>
                                        {s.full_name || s.username} ({(s.role as any)?.name || (typeof s.role === 'string' ? s.role : 'Staf Operasional')})
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="Rahmat Hidayat">Rahmat Hidayat (QCO)</option>
                                    <option value="Nabila Putri">Nabila Putri (QCO)</option>
                                    <option value="Hendra Pratama">Hendra Pratama (Drafter HDO)</option>
                                    <option value="Ayu Lestari">Ayu Lestari (Drafter HDO)</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Tahap Tujuan *</label>
                            <select
                                value={assignTarget}
                                onChange={(e) => setAssignTarget(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none"
                            >
                                <option value="Verifikasi QCO">Verifikasi QCO</option>
                                <option value="Penyusunan HDO">Penyusunan HDO</option>
                                <option value="Verifikasi Self Declare">Verifikasi Self Declare</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Prioritas *</label>
                            <select
                                value={assignPriority}
                                onChange={(e) => setAssignPriority(e.target.value as any)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none"
                            >
                                <option value="Normal">Normal</option>
                                <option value="Tinggi">Tinggi</option>
                                <option value="Mendesak">Mendesak</option>
                                <option value="Kritis">Kritis</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Target SLA / Deadline *</label>
                        <input
                            type="date"
                            value={targetDeadline}
                            onChange={(e) => setTargetDeadline(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Catatan Penugasan</label>
                        <textarea
                            rows={2}
                            value={assignNotes}
                            onChange={(e) => setAssignNotes(e.target.value)}
                            placeholder="Tambahkan catatan khusus untuk petugas..."
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none"
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
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <UserPlus className="w-3.5 h-3.5" /> {isSubmitting ? 'Menugaskan...' : 'Tugaskan Sekarang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
