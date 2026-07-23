import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import type { Submission } from '../types';
import { useAuthStore } from '../store/authStore';

export type TabType = 'ongoing' | 'completed';
export type ServiceFilter = 'ALL' | 'REGULER' | 'SELF_DECLARE';

export const MONTH_OPTIONS = [
    { value: 'ALL', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
];

export const useDrafterMonitoring = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('ongoing');
    const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('ALL');
    const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
    const [selectedYear, setSelectedYear] = useState<string>('ALL');
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
            
            // Date month/year filter
            const dateObj = new Date(s.created_at || (s as any).updated_at);
            const subMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
            const subYear = String(dateObj.getFullYear());

            const matchesMonth = selectedMonth === 'ALL' || subMonth === selectedMonth;
            const matchesYear = selectedYear === 'ALL' || subYear === selectedYear;

            const searchLower = search.toLowerCase();
            const matchesSearch = s.client?.business_name?.toLowerCase().includes(searchLower) ||
                                s.client?.client_name?.toLowerCase().includes(searchLower) ||
                                (s as any).assigned_drafter?.full_name?.toLowerCase().includes(searchLower);

            const isAuditManagerRestricted = user?.role === 'AUDIT_MANAGER' && !isReguler;

            return matchesTab && matchesService && matchesMonth && matchesYear && matchesSearch && !isAuditManagerRestricted;
        });
    }, [submissions, activeTab, serviceFilter, selectedMonth, selectedYear, search, user]);

    const groupedByDrafter = useMemo(() => {
        const groups: Record<string, { 
            drafterID: string, 
            drafterName: string, 
            submissions: Submission[],
            analytics: {
                reguler: number,
                sd_mandiri: number,
                sd_gratis: number,
                total_sh: number,
                thisMonthCount: number,
                lastMonthCount: number
            }
        }> = {};
        
        const now = new Date();
        const curMonthStr = String(now.getMonth() + 1).padStart(2, '0');
        const curYearStr = String(now.getFullYear());

        const targetMonth = selectedMonth === 'ALL' ? curMonthStr : selectedMonth;
        const targetYear = selectedYear === 'ALL' ? curYearStr : selectedYear;

        filteredSubmissions.forEach(sub => {
            const drafter = (sub as any).assigned_drafter?.full_name || 'Tanpa Nama';
            const drafterID = (sub as any).assigned_drafter_id || 'unassigned';

            const subDate = new Date(sub.created_at || (sub as any).updated_at);
            const subMonthStr = String(subDate.getMonth() + 1).padStart(2, '0');
            const subYearStr = String(subDate.getFullYear());

            const isThisMonth = subMonthStr === targetMonth && subYearStr === targetYear;

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
                        total_sh: drafterSubmissions.length,
                        thisMonthCount: 0,
                        lastMonthCount: 0
                    }
                };
            }

            if (isThisMonth) {
                groups[drafterID].analytics.thisMonthCount += 1;
            } else {
                groups[drafterID].analytics.lastMonthCount += 1;
            }

            groups[drafterID].submissions.push(sub);
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [filteredSubmissions, submissions, selectedMonth, selectedYear]);

    const toggleDrafter = (id: string) => {
        setExpandedDrafters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return {
        submissions, loading, search, setSearch,
        activeTab, setActiveTab,
        serviceFilter, setServiceFilter,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        expandedDrafters, toggleDrafter,
        stats, filteredSubmissions, groupedByDrafter
    };
};
