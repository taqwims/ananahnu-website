import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import type { Submission, User } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useDistributionAdmin = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [drafters, setDrafters] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIDs, setSelectedIDs] = useState<string[]>([]);
    const [selectedDrafter, setSelectedDrafter] = useState('');
    const [assigning, setAssigning] = useState(false);
    const user = useAuthStore(state => state.user);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [subRes, drafterRes] = await Promise.all([
                api.get('/submissions', { params: { status: 'QC_OFFICER' } }),
                api.get('/admin/users/drafters')
            ]);
            setSubmissions(subRes.data || []);
            setDrafters(drafterRes.data || []);
        } catch (err) {
            console.error('Failed to load distribution data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleSelection = (id: string) => {
        setSelectedIDs(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAssign = async () => {
        if (!selectedDrafter) {
            toast.error('Silakan pilih Drafter terlebih dahulu');
            return;
        }
        if (selectedIDs.length === 0) return;

        const drafterName = drafters.find(d => d.id === selectedDrafter)?.full_name;
        if (!window.confirm(`Distribusikan ${selectedIDs.length} pengajuan ke ${drafterName}?`)) return;

        setAssigning(true);
        try {
            await api.post('/submissions/bulk-assign-drafter', {
                ids: selectedIDs,
                drafter_id: selectedDrafter
            });
            setSelectedIDs([]);
            setSelectedDrafter('');
            loadData();
            toast.success('Pengajuan berhasil didistribusikan');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal mendistribusikan data');
        } finally {
            setAssigning(false);
        }
    };

    const groupedData = useMemo(() => {
        const filtered = submissions.filter(s => {
            if (user?.role === 'AUDIT_MANAGER' && s.service_type !== 'REGULER') return false;
            return s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.facilitator?.full_name.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.facilitator?.leader?.full_name.toLowerCase().includes(search.toLowerCase());
        });

        const groups: Record<string, { submissions: Submission[], coordinator: string }> = {};
        
        filtered.forEach(sub => {
            const coord = sub.client?.facilitator?.leader?.full_name || sub.client?.facilitator?.full_name || 'Umum';
            if (!groups[coord]) {
                groups[coord] = { coordinator: coord, submissions: [] };
            }
            groups[coord].submissions.push(sub);
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [submissions, search]);

    const stats = useMemo(() => {
        return {
            total: submissions.length,
            reguler: submissions.filter(s => s.service_type === 'REGULER').length,
            selfDeclare: submissions.filter(s => s.service_type !== 'REGULER').length,
            coordinators: new Set(submissions.map(s => s.client?.facilitator?.leader?.id || s.client?.facilitator?.id)).size
        };
    }, [submissions]);

    return {
        submissions, drafters, loading, search, setSearch,
        selectedIDs, setSelectedIDs, selectedDrafter, setSelectedDrafter,
        assigning, handleBulkAssign, toggleSelection,
        groupedData, stats
    };
};
