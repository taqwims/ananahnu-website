import { CheckCircle, XCircle, Clock, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';
import type { Training } from '../../../types';

interface TrainingListProps {
    trainings: Training[];
    loading: boolean;
    selectedId?: number;
    onSelect: (t: Training) => void;
    onDelete: (id: number) => void;
    isCoordinator: boolean;
}

export const TrainingList = ({
    trainings,
    loading,
    selectedId,
    onSelect,
    onDelete,
    isCoordinator
}: TrainingListProps) => {
    const formatDate = (d: string) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (d: string) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="glass-panel p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    }

    if (trainings.length === 0) {
        return <div className="glass-panel p-8 text-center text-gray-400">Belum ada pelatihan</div>;
    }

    return (
        <div className="space-y-3">
            {trainings.map(t => (
                <div
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className={`glass-panel p-4 cursor-pointer transition-all hover:shadow-xl group ${
                        selectedId === t.id ? 'ring-2 ring-brand-500 bg-brand-50/20' : ''
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm">{t.title}</h3>
                            <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                t.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {t.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : 
                                 t.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> :
                                 <Clock className="w-3 h-3" />}
                                {t.status === 'APPROVED' ? 'Disetujui' : t.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
                            </div>
                        </div>
                        {!isCoordinator && (
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                                className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                title="Hapus Pelatihan"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" /> {formatDate(t.start_date)} - {formatDate(t.end_date)}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" /> {t.location || '-'}</p>
                    </div>

                    {/* Metadata Pengajuan, Approval, dan Penolakan */}
                    <div className="pt-2.5 mt-2.5 border-t border-gray-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">Pengaju:</span>
                            <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                                {t.proposer?.full_name ? t.proposer.full_name : 'Admin Pelatihan'}
                            </span>
                        </div>
                        {t.created_at && (
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                                <span>Diajukan:</span>
                                <span>{formatDateTime(t.created_at)}</span>
                            </div>
                        )}

                        {t.status === 'APPROVED' && (
                            <div className="pt-1.5 border-t border-dashed border-emerald-100 bg-emerald-50/50 -mx-1 px-2 py-1 rounded space-y-1">
                                {t.approver?.full_name && (
                                    <div className="flex items-center justify-between text-[11px] text-emerald-800">
                                        <span className="text-emerald-600">Disetujui oleh:</span>
                                        <span className="font-bold truncate max-w-[140px]">{t.approver.full_name}</span>
                                    </div>
                                )}
                                {t.approved_at && (
                                    <div className="flex items-center justify-between text-[10px] text-emerald-600/80">
                                        <span>Waktu Disetujui:</span>
                                        <span>{formatDateTime(t.approved_at)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {t.status === 'REJECTED' && (
                            <div className="pt-1.5 border-t border-dashed border-rose-100 bg-rose-50/50 -mx-1 px-2 py-1.5 rounded space-y-1">
                                {t.rejector?.full_name && (
                                    <div className="flex items-center justify-between text-[11px] text-rose-800">
                                        <span className="text-rose-600">Ditolak oleh:</span>
                                        <span className="font-bold truncate max-w-[140px]">{t.rejector.full_name}</span>
                                    </div>
                                )}
                                {t.rejected_at && (
                                    <div className="flex items-center justify-between text-[10px] text-rose-500">
                                        <span>Waktu Ditolak:</span>
                                        <span>{formatDateTime(t.rejected_at)}</span>
                                    </div>
                                )}
                                {t.rejected_reason && (
                                    <p className="text-[10px] text-rose-600 italic bg-white/70 p-1 rounded border border-rose-100 mt-1">
                                        "{t.rejected_reason}"
                                    </p>
                                )}
                            </div>
                        )}

                        {t.status === 'PENDING' && (
                            <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded text-center border border-amber-200 font-medium">
                                ⏳ Menunggu Persetujuan Admin
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
