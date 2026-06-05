import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Submission } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export type SortKey = 'business_name' | 'service_type' | 'status' | 'created_at' | 'consultant' | 'coordinator';
export type SortOrder = 'asc' | 'desc';

const STATUS_ORDER = [
    'DRAFT',
    'REVISION',
    'VERVAL_PENDAMPING',
    'QC_OFFICER',
    'DRAFTER',
    'QC_REVIEW',
    'SIDANG_FATWA',
    'SH_TERBIT',
    'REJECTED'
];

export const useSubmissionList = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isGrouped, setIsGrouped] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSub, setNewSub] = useState({ businessName: '', serviceType: 'SELF_DECLARE' });
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data || []);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
        if (user?.role === 'CLIENT') {
            setIsGrouped(false);
        }
        const checkVerification = async () => {
            if (user?.role === 'HALAL_ADVISOR') {
                try {
                    const profileRes = await api.get(`/consultant/profile/${user.id}`);
                    const profileVerified = profileRes.data?.is_verified ?? false;

                    const trainingRes = await api.get(`/user-trainings/${user.id}`);
                    const trainings = trainingRes.data || [];
                    const isGraduated = trainings.some((t: any) => t.status === 'LULUS');

                    setIsVerified(profileVerified && isGraduated);
                } catch (err) {
                    setIsVerified(false);
                }
            } else {
                setIsVerified(true);
            }
        };
        checkVerification();
    }, [user, fetchSubmissions]);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Pengajuan',
            message: 'Apakah Anda yakin ingin menghapus pengajuan ini? Tindakan ini tidak dapat dibatalkan.',
            onConfirm: async () => {
                try {
                    await api.delete(`/submissions/${id}`);
                    toast.success("Pengajuan berhasil dihapus");
                    fetchSubmissions();
                } catch (err: any) {
                    toast.error(err.response?.data?.error || "Gagal menghapus pengajuan");
                }
            }
        });
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredData = useMemo(() => {
        return submissions.filter(s => {
            const matchSearch = s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
                s.id.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.facilitator?.full_name.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.facilitator?.leader?.full_name.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === '' || s.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [submissions, search, statusFilter]);

    const groupedData = useMemo(() => {
        const groups: Record<string, { coordinator: string, submissions: Submission[] }> = {};

        filteredData.forEach(sub => {
            const coord = sub.client?.facilitator?.leader?.full_name || sub.client?.facilitator?.full_name || 'Umum / Tanpa Halal Manager';
            if (!groups[coord]) {
                groups[coord] = { coordinator: coord, submissions: [] };
            }
            groups[coord].submissions.push(sub);
        });

        Object.values(groups).forEach(group => {
            group.submissions.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                if (sortKey === 'status') {
                    const aIdx = STATUS_ORDER.indexOf(a.status);
                    const bIdx = STATUS_ORDER.indexOf(b.status);
                    return sortOrder === 'asc' ? aIdx - bIdx : bIdx - aIdx;
                }

                if (sortKey === 'business_name') {
                    valA = a.client?.business_name.toLowerCase() || '';
                    valB = b.client?.business_name.toLowerCase() || '';
                } else if (sortKey === 'consultant') {
                    valA = a.client?.facilitator?.full_name.toLowerCase() || '';
                    valB = b.client?.facilitator?.full_name.toLowerCase() || '';
                } else {
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
                }
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [filteredData, sortKey, sortOrder]);

    const stats = useMemo(() => {
        return {
            total: submissions.length,
            pending: submissions.filter(s => s.status !== 'SH_TERBIT' && s.status !== 'REJECTED').length,
            completed: submissions.filter(s => s.status === 'SH_TERBIT').length,
            rejected: submissions.filter(s => s.status === 'REJECTED').length
        };
    }, [submissions]);

    const handleCreate = () => {
        navigate(`/dashboard/submissions/new?type=${newSub.serviceType}&name=${newSub.businessName}`);
    };

    return {
        submissions, loading, search, setSearch, statusFilter, setStatusFilter,
        isGrouped, setIsGrouped, showCreateModal, setShowCreateModal,
        newSub, setNewSub, isVerified, sortKey, sortOrder,
        expandedGroups, setExpandedGroups, copiedId, confirmModal, setConfirmModal,
        handleDelete, handleSort, handleCopy, handleCreate,
        stats, filteredData, groupedData, user, navigate, STATUS_ORDER
    };
};
