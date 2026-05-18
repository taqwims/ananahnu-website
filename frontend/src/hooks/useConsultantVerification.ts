import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import type { ConsultantProfile } from '../types';
import toast from 'react-hot-toast';

export const useConsultantVerification = () => {
    const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProfile, setSelectedProfile] = useState<ConsultantProfile | null>(null);
    const [coordinators, setCoordinators] = useState<any[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<string>('');
    const [verifying, setVerifying] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [profilesRes, usersRes] = await Promise.all([
                api.get('/consultant/profiles'),
                api.get('/admin/users', { params: { limit: 200 } })
            ]);
            setProfiles(profilesRes.data || []);
            setCoordinators((usersRes.data.data || []).filter((u: any) => 
                (typeof u.role === 'string' ? u.role : u.role?.name) === 'HALAL_MANAGER'
            ));
        } catch (err) {
            console.error("Failed to load verification data", err);
            setProfiles([]);
            setCoordinators([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleVerify = async (userId: string, verified: boolean) => {
        setVerifying(userId);
        try {
            await api.put(`/consultant/profiles/${userId}/verify`, { 
                verified, 
                leader_id: selectedLeader || null 
            });
            loadData();
            if (selectedProfile?.user_id === userId) {
                setSelectedProfile(prev => prev ? { ...prev, is_verified: verified } : null);
            }
            toast.success(verified ? 'Advisor berhasil diverifikasi' : 'Verifikasi advisor dibatalkan');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal update verifikasi');
        } finally {
            setVerifying(null);
        }
    };

    const filteredProfiles = useMemo(() => {
        return profiles.filter(p => 
            p.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.user?.email?.toLowerCase().includes(search.toLowerCase())
        );
    }, [profiles, search]);

    return {
        profiles, loading, search, setSearch,
        selectedProfile, setSelectedProfile,
        coordinators, selectedLeader, setSelectedLeader,
        verifying, handleVerify, filteredProfiles
    };
};
