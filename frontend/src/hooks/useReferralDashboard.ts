import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { User, Commission } from '../types';

export const useReferralDashboard = () => {
    const user = useAuthStore(state => state.user);
    const updateUser = useAuthStore(state => state.updateUser);
    const [referrals, setReferrals] = useState<User[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [refRes, commRes] = await Promise.all([
                api.get('/profile/referrals'),
                api.get('/profile/commissions')
            ]);
            setReferrals(refRes.data || []);
            setCommissions(commRes.data || []);
        } catch (error) {
            console.error("Failed to fetch referral data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopy = () => {
        if (user?.referral_code) {
            navigator.clipboard.writeText(user.referral_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    /**
     * Fetch kode referral terbaru dari backend dan update authStore.
     * Berguna jika kode referral baru saja di-generate (misal user lama yang belum punya kode).
     */
    const refreshReferralCode = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const res = await api.post('/profile/referral/regenerate');
            const newCode = res.data.referral_code;
            if (newCode) {
                updateUser({ referral_code: newCode });
            }
        } catch (error) {
            console.error("Failed to refresh referral code", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [updateUser]);

    const directSalesCommissions = useMemo(() => commissions.filter(c => c.type === 'DIRECT_SALES'), [commissions]);
    const referralCommissions = useMemo(() => commissions.filter(c => c.type === 'REFERRAL'), [commissions]);
    const overrideSelfDeclareCommissions = useMemo(() => commissions.filter(c => c.type === 'OVERRIDE' && (c.submission?.service_type === 'SELF_DECLARE' || c.submission?.service_type === 'SELF_DECLARE_MANDIRI')), [commissions]);
    const overrideRegulerCommissions = useMemo(() => commissions.filter(c => c.type === 'OVERRIDE' && c.submission?.service_type !== 'SELF_DECLARE' && c.submission?.service_type !== 'SELF_DECLARE_MANDIRI'), [commissions]);

    const directSalesStats = useMemo(() => {
        const totalIncentive = directSalesCommissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = directSalesCommissions.filter(c => c.status === 'PAID').length;
        const pendingCount = directSalesCommissions.filter(c => c.status === 'PENDING').length;
        return { totalIncentive, paidCount, pendingCount };
    }, [directSalesCommissions]);

    const referralStats = useMemo(() => {
        const totalIncentive = referralCommissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = referralCommissions.filter(c => c.status === 'PAID').length;
        const pendingCount = referralCommissions.filter(c => c.status === 'PENDING').length;
        
        return {
            totalReferrals: referrals.length,
            totalIncentive,
            paidCount,
            pendingCount
        };
    }, [referrals, referralCommissions]);

    const overrideSelfDeclareStats = useMemo(() => {
        const totalIncentive = overrideSelfDeclareCommissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = overrideSelfDeclareCommissions.filter(c => c.status === 'PAID').length;
        const pendingCount = overrideSelfDeclareCommissions.filter(c => c.status === 'PENDING').length;
        return { totalIncentive, paidCount, pendingCount };
    }, [overrideSelfDeclareCommissions]);

    const overrideRegulerStats = useMemo(() => {
        const totalIncentive = overrideRegulerCommissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = overrideRegulerCommissions.filter(c => c.status === 'PAID').length;
        const pendingCount = overrideRegulerCommissions.filter(c => c.status === 'PENDING').length;
        return { totalIncentive, paidCount, pendingCount };
    }, [overrideRegulerCommissions]);

    return {
        user,
        referrals,
        directSalesCommissions,
        referralCommissions,
        overrideSelfDeclareCommissions,
        overrideRegulerCommissions,
        isLoading,
        copied,
        handleCopy,
        refreshReferralCode,
        isRefreshing,
        directSalesStats,
        referralStats,
        overrideSelfDeclareStats,
        overrideRegulerStats
    };
};
