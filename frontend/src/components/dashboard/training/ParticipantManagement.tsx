import { useState } from 'react';
import { Plus, Loader2, Clock, Users, Search, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { TrainingParticipant } from '../../../types';

interface ParticipantManagementProps {
    participants: TrainingParticipant[];
    loading: boolean;
    allUsers: any[];
    newUserId: string;
    setNewUserId: (id: string) => void;
    onAdd: () => void;
    onUpdateStatus: (userId: string, status: string) => void;
    canGraduate?: boolean;
    isExpired?: boolean;
}

type StatusFilter = 'ALL' | 'PESERTA' | 'LULUS' | 'TIDAK_LULUS';

export const ParticipantManagement = ({
    participants,
    loading,
    allUsers,
    newUserId,
    setNewUserId,
    onAdd,
    onUpdateStatus,
    canGraduate,
    isExpired
}: ParticipantManagementProps) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    // Counts
    const countAll = participants.length;
    const countPeserta = participants.filter(p => p.status === 'PESERTA' || !p.status).length;
    const countLulus = participants.filter(p => p.status === 'LULUS').length;
    const countTidakLulus = participants.filter(p => p.status === 'TIDAK_LULUS').length;

    // Filter logic
    const filteredParticipants = participants.filter(p => {
        // Status filter
        if (statusFilter === 'PESERTA' && p.status && p.status !== 'PESERTA') return false;
        if (statusFilter === 'LULUS' && p.status !== 'LULUS') return false;
        if (statusFilter === 'TIDAK_LULUS' && p.status !== 'TIDAK_LULUS') return false;

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            const name = p.user?.full_name?.toLowerCase() || '';
            const email = p.user?.email?.toLowerCase() || '';
            const phone = p.user?.phone?.toLowerCase() || '';
            return name.includes(q) || email.includes(q) || phone.includes(q);
        }

        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-600" /> Riwayat & Kelola Peserta Pelatihan
                </h3>
                <div className="text-xs text-gray-500 font-medium">
                    Total: <span className="font-bold text-gray-800">{countAll} Peserta</span> ({countLulus} Lulus, {countTidakLulus} Tidak Lulus)
                </div>
            </div>

            {/* Add Participant Form */}
            {isExpired ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    Pelatihan ini sudah kadaluarsa. Tidak dapat menambah peserta baru.
                </div>
            ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                    <label className="text-xs font-bold text-gray-600 block">Tambah Peserta Baru ke Batch Ini</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <select
                                className="glass-input text-sm w-full bg-white"
                                value={newUserId}
                                onChange={e => setNewUserId(e.target.value)}
                            >
                                <option value="">-- Pilih Advisor Terdaftar --</option>
                                {allUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.full_name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={onAdd} 
                            disabled={!newUserId}
                            className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-100"
                        >
                            <Plus className="w-4 h-4" /> Tambah Peserta
                        </button>
                    </div>
                </div>
            )}

            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari nama, email, atau telepon peserta..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="glass-input text-xs pl-10 pr-4 py-2.5 w-full bg-white"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Semua ({countAll})
                    </button>
                    <button
                        onClick={() => setStatusFilter('PESERTA')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === 'PESERTA' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Peserta ({countPeserta})
                    </button>
                    <button
                        onClick={() => setStatusFilter('LULUS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === 'LULUS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Lulus ({countLulus})
                    </button>
                    <button
                        onClick={() => setStatusFilter('TIDAK_LULUS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === 'TIDAK_LULUS' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Tidak Lulus ({countTidakLulus})
                    </button>
                </div>
            </div>

            {/* Info note about failed participants */}
            {countTidakLulus > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                        <strong>Info Peserta Tidak Lulus:</strong> Peserta yang tidak lulus tetap tercatat dalam riwayat batch ini dan dapat didaftarkan kembali (mengulang) pada batch pelatihan berikutnya.
                    </span>
                </div>
            )}

            {/* Participant List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
                    <p className="text-xs text-gray-400 font-medium">Memuat riwayat peserta...</p>
                </div>
            ) : filteredParticipants.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-500">
                        {search ? 'Tidak ada peserta yang cocok dengan kata kunci pencarian' : 'Belum ada peserta dalam kategori ini'}
                    </p>
                    {search && (
                        <button onClick={() => setSearch('')} className="mt-2 text-xs text-brand-600 hover:underline font-semibold">
                            Reset pencarian
                        </button>
                    )}
                </div>
            ) : (
                <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {filteredParticipants.map(p => {
                        const isLulus = p.status === 'LULUS';
                        const isTidakLulus = p.status === 'TIDAK_LULUS';
                        const isPeserta = !p.status || p.status === 'PESERTA';

                        return (
                            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/80 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-800">{p.user?.full_name || p.user_id}</p>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            isLulus ? 'bg-emerald-100 text-emerald-800' :
                                            isTidakLulus ? 'bg-rose-100 text-rose-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                            {isLulus ? <CheckCircle className="w-3 h-3 text-emerald-600" /> :
                                             isTidakLulus ? <XCircle className="w-3 h-3 text-rose-600" /> :
                                             <Clock className="w-3 h-3 text-amber-600" />}
                                            {isLulus ? 'LULUS' : isTidakLulus ? 'TIDAK LULUS' : 'PESERTA'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{p.user?.email}</p>
                                    {(p.user?.phone || p.user?.address) && (
                                        <p className="text-xs text-gray-400 font-medium flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                                            {p.user?.phone && <span>📞 {p.user.phone}</span>}
                                            {p.user?.address && <span>📍 {p.user.address}</span>}
                                        </p>
                                    )}
                                </div>

                                {canGraduate && (
                                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                                        {isPeserta && (
                                            <>
                                                <button
                                                    onClick={() => onUpdateStatus(p.user_id, 'LULUS')}
                                                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Luluskan
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatus(p.user_id, 'TIDAK_LULUS')}
                                                    className="px-3.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Tidak Lulus
                                                </button>
                                            </>
                                        )}

                                        {isTidakLulus && (
                                            <>
                                                <button
                                                    onClick={() => onUpdateStatus(p.user_id, 'LULUS')}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" /> Ubah ke Lulus
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatus(p.user_id, 'PESERTA')}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" /> Kembalikan Peserta
                                                </button>
                                            </>
                                        )}

                                        {isLulus && (
                                            <button
                                                onClick={() => onUpdateStatus(p.user_id, 'PESERTA')}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition flex items-center gap-1"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" /> Batal Lulus
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
