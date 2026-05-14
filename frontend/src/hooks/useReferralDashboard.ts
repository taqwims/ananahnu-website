import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { User, ReferralCommission } from '../types';

export const useReferralDashboard = () => {
    const user = useAuthStore(state => state.user);
    const [referrals, setReferrals] = useState<User[]>([]);
    const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
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

    const stats = useMemo(() => {
        const totalIncentive = commissions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = commissions.filter(c => c.status === 'PAID').length;
        const pendingCount = commissions.filter(c => c.status === 'PENDING').length;
        
        return {
            totalReferrals: referrals.length,
            totalIncentive,
            paidCount,
            pendingCount
        };
    }, [referrals, commissions]);

    return {
        user,
        referrals,
        commissions,
        isLoading,
        copied,
        handleCopy,
        stats
    };
};
