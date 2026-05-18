import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { User, Commission } from '../types';

export const useReferralDashboard = () => {
    const user = useAuthStore(state => state.user);
    const [referrals, setReferrals] = useState<User[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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

    const referralCommissions = useMemo(() => commissions.filter(c => c.type === 'REFERRAL' || !c.type), [commissions]);
    const structuralCommissions = useMemo(() => commissions.filter(c => c.type === 'STRUCTURAL'), [commissions]);

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

    const structuralStats = useMemo(() => {
        const totalIncentive = structuralCommissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = structuralCommissions.filter(c => c.status === 'PAID').length;
        const pendingCount = structuralCommissions.filter(c => c.status === 'PENDING').length;
        
        return {
            totalIncentive,
            paidCount,
            pendingCount
        };
    }, [structuralCommissions]);

    return {
        user,
        referrals,
        referralCommissions,
        structuralCommissions,
        isLoading,
        copied,
        handleCopy,
        referralStats,
        structuralStats
    };
};
