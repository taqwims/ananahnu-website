import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import type { Submission } from '../types';
import { useAuthStore } from '../store/authStore';

export type TabType = 'ongoing' | 'completed';
export type ServiceFilter = 'ALL' | 'REGULER' | 'SELF_DECLARE';

export const useDrafterMonitoring = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('ongoing');
    const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('ALL');
    const [expandedDrafters, setExpandedDrafters] = useState<Record<string, boolean>>({});
    const user = useAuthStore(state => state.user);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            const allSub = res.data || [];
            setSubmissions(allSub.filter((s: any) => (s as any).assigned_drafter_id));
        } catch (err) {
            console.error('Failed to load monitoring data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const stats = useMemo(() => {
        const ongoing = submissions.filter(s => s.status !== 'SH_TERBIT');
        const completed = submissions.filter(s => s.status === 'SH_TERBIT');
        
        return {
            total: submissions.length,
            ongoing: ongoing.length,
            completed: completed.length,
            reguler: submissions.filter(s => s.service_type === 'REGULER').length,
            selfDeclare: submissions.filter(s => s.service_type !== 'REGULER').length,
            drafterActive: new Set(ongoing.map(s => (s as any).assigned_drafter_id)).size,
        };
    }, [submissions]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            const matchesTab = activeTab === 'completed' ? s.status === 'SH_TERBIT' : s.status !== 'SH_TERBIT';
            const isReguler = s.service_type === 'REGULER';
            const matchesService = serviceFilter === 'ALL' || 
                                (serviceFilter === 'REGULER' && isReguler) || 
                                (serviceFilter === 'SELF_DECLARE' && !isReguler);
            
            const searchLower = search.toLowerCase();
            const matchesSearch = s.client?.business_name.toLowerCase().includes(searchLower) ||
                                s.client?.client_name?.toLowerCase().includes(searchLower) ||
                                (s as any).assigned_drafter?.full_name.toLowerCase().includes(searchLower);

            const isVerifikatorRestricted = user?.role === 'VERIFIKATOR' && !isReguler;

            return matchesTab && matchesService && matchesSearch && !isVerifikatorRestricted;
        });
    }, [submissions, activeTab, serviceFilter, search]);

    const groupedByDrafter = useMemo(() => {
        const groups: Record<string, { 
            drafterID: string, 
            drafterName: string, 
            submissions: Submission[],
            analytics: {
                reguler: number,
                sd_mandiri: number,
                sd_gratis: number,
                total_sh: number
            }
        }> = {};
        
        filteredSubmissions.forEach(sub => {
            const drafter = (sub as any).assigned_drafter?.full_name || 'Tanpa Nama';
            const drafterID = (sub as any).assigned_drafter_id || 'unassigned';
            
            if (!groups[drafterID]) {
                const drafterSubmissions = submissions.filter(s => (s as any).assigned_drafter_id === drafterID && s.status === 'SH_TERBIT');
                
                groups[drafterID] = { 
                    drafterID, 
                    drafterName: drafter, 
                    submissions: [],
                    analytics: {
                        reguler: drafterSubmissions.filter(s => s.service_type === 'REGULER').length,
                        sd_mandiri: drafterSubmissions.filter(s => s.service_type === 'SELF_DECLARE_MANDIRI').length,
                        sd_gratis: drafterSubmissions.filter(s => s.service_type === 'SELF_DECLARE').length,
                        total_sh: drafterSubmissions.length
                    }
                };
            }
            groups[drafterID].submissions.push(sub);
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [filteredSubmissions, submissions]);

    const toggleDrafter = (id: string) => {
        setExpandedDrafters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return {
        submissions, loading, search, setSearch,
        activeTab, setActiveTab,
        serviceFilter, setServiceFilter,
        expandedDrafters, toggleDrafter,
        stats, filteredSubmissions, groupedByDrafter
    };
};
