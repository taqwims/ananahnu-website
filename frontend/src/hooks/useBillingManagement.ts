import { useState, useEffect, useCallback, useMemo } from 'react';
import { paymentService } from '../services/paymentService';
import type { Invoice, Payment } from '../types';
import toast from 'react-hot-toast';

export type TabType = 'invoices' | 'payments';

export const useBillingManagement = () => {
    const [activeTab, setActiveTab] = useState<TabType>('invoices');
    const [loading, setLoading] = useState(true);
    
    // Invoices State
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invTotal, setInvTotal] = useState(0);
    const [invPage, setInvPage] = useState(1);
    const [invFilterStatus, setInvFilterStatus] = useState('');
    const [invFilterService, setInvFilterService] = useState('');

    // Payments State
    const [payments, setPayments] = useState<Payment[]>([]);
    const [payTotal, setPayTotal] = useState(0);
    const [payPage, setPayPage] = useState(1);
    const [payFilterStatus, setPayFilterStatus] = useState('');
    const [payFilterMethod, setPayFilterMethod] = useState('');
    const [verifying, setVerifying] = useState<number | null>(null);

    const loadInvoices = useCallback(async () => {
        if (activeTab !== 'invoices') return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', invPage.toString());
            params.set('limit', '20');
            if (invFilterStatus) params.set('status', invFilterStatus);
            if (invFilterService) params.set('service_type', invFilterService);

            const res = await paymentService.getAllInvoices(params);
            setInvoices(res.data || []);
            setInvTotal(res.total || 0);
        } catch { 
            setInvoices([]); 
            toast.error("Gagal memuat daftar tagihan");
        } finally { 
            setLoading(false); 
        }
    }, [invPage, invFilterStatus, invFilterService, activeTab]);

    const loadPayments = useCallback(async () => {
        if (activeTab !== 'payments') return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', payPage.toString());
            params.set('limit', '20');
            if (payFilterStatus) params.set('status', payFilterStatus);
            if (payFilterMethod) params.set('method', payFilterMethod);

            const res = await paymentService.getPayments(params);
            setPayments(res.data || []);
            setPayTotal(res.total || 0);
        } catch { 
            setPayments([]); 
            toast.error("Gagal memuat konfirmasi transaksi");
        } finally { 
            setLoading(false); 
        }
    }, [payPage, payFilterStatus, payFilterMethod, activeTab]);

    useEffect(() => {
        if (activeTab === 'invoices') loadInvoices();
        else loadPayments();
    }, [activeTab, loadInvoices, loadPayments]);

    const markPaid = async (id: number) => {
        if (!confirm('Tandai tagihan ini sebagai LUNAS?')) return;
        try {
            await paymentService.markPaid(id);
            toast.success("Tagihan ditandai lunas");
            loadInvoices();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal update status');
        }
    };

    const verifyPayment = async (id: number, approved: boolean) => {
        if (!confirm(approved ? 'Setujui pembayaran ini?' : 'Tolak pembayaran ini?')) return;
        setVerifying(id);
        try {
            await paymentService.verifyPayment(id, approved);
            toast.success(approved ? "Pembayaran disetujui" : "Pembayaran ditolak");
            loadPayments();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal verifikasi');
        } finally {
            setVerifying(null);
        }
    };

    const syncPayment = async (id: number) => {
        setVerifying(id);
        try {
            await paymentService.syncPayment(id);
            toast.success("Status disinkronkan dengan Midtrans");
            if (activeTab === 'invoices') loadInvoices();
            else loadPayments();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal sinkronisasi');
        } finally {
            setVerifying(null);
        }
    };

    const stats = useMemo(() => {
        const totalUnpaid = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);
        const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
        const pendingVerifCount = payments.filter(p => p.status === 'PENDING' && p.method === 'MANUAL').length;
        return { totalUnpaid, totalPaid, pendingVerifCount };
    }, [invoices, payments]);

    return {
        activeTab,
        setActiveTab,
        loading,
        invoices,
        invTotal,
        invPage,
        setInvPage,
        invFilterStatus,
        setInvFilterStatus,
        invFilterService,
        setInvFilterService,
        payments,
        payTotal,
        payPage,
        setPayPage,
        payFilterStatus,
        setPayFilterStatus,
        payFilterMethod,
        setPayFilterMethod,
        verifying,
        markPaid,
        verifyPayment,
        syncPayment,
        stats
    };
};
