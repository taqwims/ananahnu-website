import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Training, TrainingParticipant } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useTrainingAdmin = () => {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
    const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
    const [loadingParts, setLoadingParts] = useState(false);
    const [saving, setSaving] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', location: '' });
    const [editForm, setEditForm] = useState({ title: '', description: '', start_date: '', end_date: '', location: '' });
    const [newUserID, setNewUserID] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    
    const user = useAuthStore(state => state.user);
    const isCoordinator = user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR';
    const canGraduate = user?.role === 'ADMIN_PELATIHAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'MANAGER';
    const canManageParticipants = true; // All roles who access this training dashboard can manage

    const loadTrainings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/trainings/');
            setTrainings(res.data || []);
        } catch {
            setTrainings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadUsers = useCallback(async (trainingId?: number) => {
        try {
            const res = await api.get('/trainings/available-participants', {
                params: trainingId ? { training_id: trainingId } : {}
            });
            setAllUsers(res.data || []);
        } catch {
            setAllUsers([]);
        }
    }, []);

    useEffect(() => { 
        loadTrainings(); 
        loadUsers(selectedTraining?.id);
    }, [loadTrainings, loadUsers, selectedTraining?.id]);

    const loadParticipants = useCallback(async (trainingId: number) => {
        setLoadingParts(true);
        try {
            const res = await api.get(`/trainings/${trainingId}/participants`);
            setParticipants(res.data || []);
        } catch {
            setParticipants([]);
        } finally {
            setLoadingParts(false);
        }
    }, []);

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
            toast.success(isCoordinator ? 'Pelatihan berhasil diajukan' : 'Pelatihan berhasil dibuat');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal membuat pelatihan');
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (t: Training) => {
        const toYMD = (dateStr: string) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        };
        setEditForm({
            title: t.title || '',
            description: t.description || '',
            start_date: toYMD(t.start_date),
            end_date: toYMD(t.end_date),
            location: t.location || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateTraining = async () => {
        if (!selectedTraining) return;
        setSaving(true);
        try {
            await api.put(`/trainings/${selectedTraining.id}`, {
                ...editForm,
                start_date: new Date(editForm.start_date).toISOString(),
                end_date: new Date(editForm.end_date).toISOString(),
            });
            setShowEditModal(false);
            loadTrainings();
            // Update selected training in place
            setSelectedTraining(prev => prev ? {
                ...prev,
                title: editForm.title,
                description: editForm.description,
                start_date: new Date(editForm.start_date).toISOString(),
                end_date: new Date(editForm.end_date).toISOString(),
                location: editForm.location
            } : null);
            toast.success('Jadwal dan data pelatihan berhasil diperbarui. Notifikasi WA otomatis dikirim ke peserta!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal memperbarui jadwal pelatihan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Hapus pelatihan ini?')) return;
        try {
            await api.delete(`/trainings/${id}`);
            if (selectedTraining?.id === id) setSelectedTraining(null);
            loadTrainings();
            toast.success('Pelatihan berhasil dihapus');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menghapus');
        }
    };

    const addParticipant = async () => {
        if (!selectedTraining || !newUserID) return;
        try {
            await api.post(`/trainings/${selectedTraining.id}/participants`, { user_id: newUserID });
            setNewUserID('');
            loadParticipants(selectedTraining.id);
            loadUsers(selectedTraining.id);
            toast.success('Peserta berhasil didaftarkan & jadwal dikirim ke WhatsApp peserta');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menambahkan peserta');
        }
    };

    const removeParticipant = async (participantId: number, userName?: string) => {
        if (!window.confirm(`Batalkan keikutsertaan ${userName || 'peserta ini'} dari pelatihan?`)) return;
        try {
            await api.delete(`/trainings/participants/${participantId}`);
            if (selectedTraining) {
                loadParticipants(selectedTraining.id);
                loadUsers(selectedTraining.id);
            }
            toast.success('Peserta berhasil dibatalkan dari pelatihan');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal membatalkan peserta');
        }
    };

    const resendSchedule = async (userId: string) => {
        if (!selectedTraining) return;
        try {
            await api.post(`/trainings/${selectedTraining.id}/participants/${userId}/resend-schedule`);
            toast.success('Jadwal pelatihan berhasil dikirim ulang ke WhatsApp peserta');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal mengirim ulang jadwal');
        }
    };

    const broadcastSchedule = async (trainingId?: number) => {
        const id = trainingId || selectedTraining?.id;
        if (!id) return;
        if (!window.confirm('Kirimkan pesan WhatsApp jadwal pelatihan ini ke seluruh peserta terdaftar?')) return;
        setBroadcasting(true);
        try {
            const res = await api.post(`/trainings/${id}/broadcast-schedule`);
            toast.success(res.data?.message || 'Jadwal pelatihan berhasil dikirim ke seluruh peserta via WhatsApp');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal mengirim broadcast jadwal pelatihan');
        } finally {
            setBroadcasting(false);
        }
    };

    const updateStatus = async (userId: string, status: string) => {
        if (!selectedTraining) return;
        try {
            await api.put(`/trainings/${selectedTraining.id}/participants/${userId}`, { status });
            loadParticipants(selectedTraining.id);
            toast.success('Status peserta berhasil diperbarui');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal update status');
        }
    };

    const selectTraining = (t: Training) => {
        setSelectedTraining(t);
        if (t.status === 'APPROVED') {
            loadParticipants(t.id);
            loadUsers(t.id);
        } else {
            setParticipants([]);
        }
    };

    const handleApprove = async (id: number) => {
        if (!window.confirm('Setujui pengajuan pelatihan ini?')) return;
        try {
            await api.put(`/trainings/${id}/status`, { status: 'APPROVED' });
            loadTrainings();
            if (selectedTraining?.id === id) {
                setSelectedTraining({ ...selectedTraining, status: 'APPROVED' });
                loadParticipants(id);
                loadUsers(id);
            }
            toast.success('Pelatihan disetujui & jadwal otomatis dibroadcast');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menyetujui');
        }
    };

    const handleReject = async (id: number) => {
        const reason = window.prompt('Alasan penolakan:');
        if (reason === null) return;
        try {
            await api.put(`/trainings/${id}/status`, { status: 'REJECTED', reason });
            loadTrainings();
            if (selectedTraining?.id === id) setSelectedTraining({ ...selectedTraining, status: 'REJECTED', rejected_reason: reason });
            toast.success('Pelatihan ditolak');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menolak');
        }
    };

    return {
        trainings, loading, showForm, setShowForm,
        showEditModal, setShowEditModal,
        openEditModal, editForm, setEditForm, handleUpdateTraining,
        selectedTraining, setSelectedTraining,
        participants, loadingParts,
        saving, setSaving,
        broadcasting, broadcastSchedule,
        form, setForm,
        newUserID, setNewUserID,
        allUsers,
        isCoordinator,
        canGraduate,
        canManageParticipants,
        handleCreate, handleDelete, addParticipant, removeParticipant, updateStatus,
        selectTraining, handleApprove, handleReject,
        resendSchedule
    };
};
