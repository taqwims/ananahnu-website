import { Plus, Loader2, CheckCircle, Clock, Users } from 'lucide-react';
import type { TrainingParticipant } from '../../../types';

interface ParticipantManagementProps {
    participants: TrainingParticipant[];
    loading: boolean;
    allUsers: any[];
    newUserId: string;
    setNewUserId: (id: string) => void;
    onAdd: () => void;
    onUpdateStatus: (userId: string, status: string) => void;
}

export const ParticipantManagement = ({
    participants,
    loading,
    allUsers,
    newUserId,
    setNewUserId,
    onAdd,
    onUpdateStatus
}: ParticipantManagementProps) => {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Daftar Peserta
            </h3>

            {/* Add Participant */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                    <select
                        className="glass-input text-sm w-full"
                        value={newUserId}
                        onChange={e => setNewUserId(e.target.value)}
                    >
                        <option value="">-- Pilih Peserta --</option>
                        {allUsers.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.full_name} ({u.role?.name || u.role})
                            </option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={onAdd} 
                    disabled={!newUserId}
                    className="glass-button text-sm flex items-center justify-center gap-1 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" /> Tambah Peserta
                </button>
            </div>

            {/* Participant List */}
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-brand-600" /></div>
            ) : participants.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-100 rounded-xl">Belum ada peserta terdaftar</p>
            ) : (
                <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {participants.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="text-sm font-bold text-gray-800">{p.user?.full_name || p.user_id}</p>
                                <p className="text-xs text-gray-500">{p.user?.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {p.status === 'LULUS' ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle className="w-3.5 h-3.5" /> Lulus
                                    </span>
                                ) : (
                                    <>
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" /> Peserta
                                        </span>
                                        <button
                                            onClick={() => onUpdateStatus(p.user_id, 'LULUS')}
                                            className="px-4 py-1 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-100"
                                        >
                                            Luluskan
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
