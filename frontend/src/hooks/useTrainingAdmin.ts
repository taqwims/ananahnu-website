import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Training, TrainingParticipant } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useTrainingAdmin = () => {
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
    
    const user = useAuthStore(state => state.user);
    const isCoordinator = user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR';
    const canGraduate = user?.role === 'ADMIN_PELATIHAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'MANAGER';

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

    const loadUsers = useCallback(async () => {
        try {
            const res = await api.get('/trainings/available-participants');
            setAllUsers(res.data || []);
        } catch {
            setAllUsers([]);
        }
    }, []);

    useEffect(() => { 
        loadTrainings(); 
        loadUsers();
    }, [loadTrainings, loadUsers]);

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
            toast.success('Peserta berhasil ditambahkan');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menambahkan peserta');
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
        } else {
            setParticipants([]);
        }
    };

    const handleApprove = async (id: number) => {
        if (!window.confirm('Setujui pengajuan pelatihan ini?')) return;
        try {
            await api.put(`/trainings/${id}/status`, { status: 'APPROVED' });
            loadTrainings();
            if (selectedTraining?.id === id) setSelectedTraining({ ...selectedTraining, status: 'APPROVED' });
            toast.success('Pelatihan disetujui');
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
        selectedTraining, setSelectedTraining,
        participants, loadingParts,
        saving, setSaving,
        form, setForm,
        newUserID, setNewUserID,
        allUsers,
        isCoordinator,
        canGraduate,
        handleCreate, handleDelete, addParticipant, updateStatus,
        selectTraining, handleApprove, handleReject
    };
};
