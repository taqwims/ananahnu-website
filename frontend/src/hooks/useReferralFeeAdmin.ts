import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export interface Commission {
    id: string;
    referrer_id: string;
    referrer?: {
        full_name: string;
        email: string;
        phone?: string;
        address?: string;
    };
    referred_id: string;
    referred?: {
        full_name: string;
        email: string;
        phone?: string;
        address?: string;
    };
    submission_id: string;
    submission?: {
        tracking_number: string;
        client?: {
            business_name: string;
        };
    };
    amount: number;
    status: 'PENDING' | 'PAID';
    paid_at?: string;
    created_at: string;
}

export const useReferralFeeAdmin = () => {
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [referralFee, setReferralFee] = useState<string>('0');
    const [isSavingFee, setIsSavingFee] = useState(false);

    const fetchCommissions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/billing/referral-commissions?status=${statusFilter}`);
            setCommissions(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch commissions');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const fetchSetting = useCallback(async () => {
        try {
            const response = await api.get('/system-settings/REFERRAL_FEE_PER_SH');
            setReferralFee(response.data.value || '0');
        } catch (err) {
            console.error('Failed to fetch fee setting');
        }
    }, []);

    useEffect(() => {
        fetchCommissions();
        fetchSetting();
    }, [fetchCommissions, fetchSetting]);

    const saveSetting = async () => {
        setIsSavingFee(true);
        try {
            await api.put('/system-settings', {
                key: 'REFERRAL_FEE_PER_SH',
                value: referralFee
            });
            toast.success('Fee referral berhasil disimpan');
        } catch (err: any) {
            toast.error('Gagal menyimpan fee: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSavingFee(false);
        }
    };

    const markAsPaid = async (id: string) => {
        try {
            await api.put(`/billing/referral-commissions/${id}/pay`);
            fetchCommissions();
            toast.success('Komisi berhasil dibayarkan');
        } catch (err: any) {
            toast.error('Gagal memperbarui status: ' + (err.response?.data?.error || err.message));
        }
    };

    return {
        commissions, loading, error, setError,
        statusFilter, setStatusFilter,
        referralFee, setReferralFee,
        isSavingFee,
        saveSetting, markAsPaid, fetchCommissions
    };
};
