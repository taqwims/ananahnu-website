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
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

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
                        selectedId === t.id ? 'ring-2 ring-brand-500' : ''
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
                                {t.status}
                            </div>
                        </div>
                        {!isCoordinator && (
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                                className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(t.start_date)} - {formatDate(t.end_date)}</p>
                        <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location || '-'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
