import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Loader2, Users, CheckCircle, Clock, MapPin, Calendar, Trash2 } from 'lucide-react';
import api from '../../services/api';
import type { Training, TrainingParticipant } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function TrainingAdmin() {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
    const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
    const [loadingParts, setLoadingParts] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', location: '' });
    const [newUserID, setNewUserID] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const user = useAuthStore(state => state.user);
    const isCoordinator = user?.role === 'KOORDINATOR';

    const loadTrainings = () => {
        setLoading(true);
        api.get('/trainings/').then(res => setTrainings(res.data || []))
            .catch(() => setTrainings([]))
            .finally(() => setLoading(false));
    };

    const loadUsers = () => {
        api.get('/admin/users', { 
            params: { 
                limit: 200, 
                role: 'HALAL_KONSULTAN',
                no_leader: 'true'
            } 
        }).then(res => setAllUsers(res.data.data || []))
            .catch(() => setAllUsers([]));
    };

    useEffect(() => { 
        loadTrainings(); 
        loadUsers();
    }, []);

    const loadParticipants = async (trainingId: number) => {
        setLoadingParts(true);
        try {
            const res = await api.get(`/trainings/${trainingId}/participants`);
            setParticipants(res.data || []);
        } catch { setParticipants([]); }
        finally { setLoadingParts(false); }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            await api.post('/trainings/', {
                ...form,
                start_date: new Date(form.start_date).toISOString(),
                end_date: new Date(form.end_date).toISOString(),
            });
            setShowForm(false);
            setForm({ title: '', description: '', start_date: '', end_date: '', location: '' });
            loadTrainings();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal membuat pelatihan');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus pelatihan ini?')) return;
        try {
            await api.delete(`/trainings/${id}`);
            if (selectedTraining?.id === id) setSelectedTraining(null);
            loadTrainings();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menghapus');
        }
    };

    const addParticipant = async () => {
        if (!selectedTraining || !newUserID) return;
        try {
            await api.post(`/trainings/${selectedTraining.id}/participants`, { user_id: newUserID });
            setNewUserID('');
            loadParticipants(selectedTraining.id);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menambahkan peserta');
        }
    };

    const updateStatus = async (userId: string, status: string) => {
        if (!selectedTraining) return;
        try {
            await api.put(`/trainings/${selectedTraining.id}/participants/${userId}`, { status });
            loadParticipants(selectedTraining.id);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal update status');
        }
    };

    const selectTraining = (t: Training) => {
        setSelectedTraining(t);
        loadParticipants(t.id);
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-brand-600" />
                        Manajemen Pelatihan
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola jadwal pelatihan dan peserta</p>
                </div>
                {!isCoordinator && (
                    <button onClick={() => setShowForm(true)} className="glass-button flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" /> Buat Pelatihan
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Training List */}
                <div className="lg:col-span-1 space-y-3">
                    {loading ? (
                        <div className="glass-panel p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : trainings.length === 0 ? (
                        <div className="glass-panel p-8 text-center text-gray-400">Belum ada pelatihan</div>
                    ) : trainings.map(t => (
                        <div
                            key={t.id}
                            onClick={() => selectTraining(t)}
                            className={`glass-panel p-4 cursor-pointer transition-all hover:shadow-xl group ${
                                selectedTraining?.id === t.id ? 'ring-2 ring-brand-500' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-gray-800 text-sm">{t.title}</h3>
                                {!isCoordinator && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
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

                {/* Participants Panel */}
                <div className="lg:col-span-2">
                    {!selectedTraining ? (
                        <div className="glass-panel p-12 text-center text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            Pilih pelatihan untuk melihat peserta
                        </div>
                    ) : (
                        <div className="glass-panel p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Peserta — {selectedTraining.title}
                            </h2>

                            {/* Add Participant */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 relative">
                                    <select
                                        className="glass-input text-sm w-full"
                                        value={newUserID}
                                        onChange={e => setNewUserID(e.target.value)}
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
                                    onClick={addParticipant} 
                                    disabled={!newUserID}
                                    className="glass-button text-sm flex items-center justify-center gap-1 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Peserta
                                </button>
                            </div>

                            {/* Participant List */}
                            {loadingParts ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                            ) : participants.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-4">Belum ada peserta</p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {participants.map(p => (
                                        <div key={p.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{p.user?.full_name || p.user_id}</p>
                                                <p className="text-xs text-gray-500">{p.user?.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {p.status === 'LULUS' ? (
                                                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" /> Lulus
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                            <Clock className="w-3 h-3" /> Peserta
                                                        </span>
                                                        <button
                                                            onClick={() => updateStatus(p.user_id, 'LULUS')}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
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
                    )}
                </div>
            </div>

            {/* Create Training Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900">Buat Pelatihan Baru</h3>
                        <div className="space-y-3">
                            <input className="glass-input" placeholder="Judul Pelatihan" value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            <textarea className="glass-input" rows={2} placeholder="Deskripsi" value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Mulai</label>
                                    <input type="date" className="glass-input text-sm" value={form.start_date}
                                        onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Selesai</label>
                                    <input type="date" className="glass-input text-sm" value={form.end_date}
                                        onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                                </div>
                            </div>
                            <input className="glass-input" placeholder="Lokasi" value={form.location}
                                onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button onClick={handleCreate} disabled={saving || !form.title}
                                className="glass-button flex items-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                Buat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
