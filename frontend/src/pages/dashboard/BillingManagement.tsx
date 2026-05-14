import { useState, useEffect, useCallback } from 'react';
import { 
    Receipt, 
    CheckCircle, 
    Clock, 
    Filter, 
    Loader2, 
    CreditCard, 
    XCircle, 
    Eye, 
    ExternalLink,
    ChevronRight,
    Search,
    FileText,
    RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import type { Invoice, Payment } from '../../types';
import { formatServiceType, formatRupiah } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'invoices' | 'payments';

export default function BillingManagement() {
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

            const res = await api.get(`/billing/all-invoices?${params}`);
            setInvoices(res.data.data || []);
            setInvTotal(res.data.total || 0);
        } catch { setInvoices([]); }
        finally { setLoading(false); }
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

            const res = await api.get(`/payments/?${params}`);
            setPayments(res.data.data || []);
            setPayTotal(res.data.total || 0);
        } catch { setPayments([]); }
        finally { setLoading(false); }
    }, [payPage, payFilterStatus, payFilterMethod, activeTab]);

    useEffect(() => {
        if (activeTab === 'invoices') loadInvoices();
        else loadPayments();
    }, [activeTab, loadInvoices, loadPayments]);

    const markPaid = async (id: number) => {
        if (!confirm('Tandai tagihan ini sebagai LUNAS?')) return;
        try {
            await api.put(`/billing/${id}/mark-paid`);
            loadInvoices();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal update status');
        }
    };

    const verifyPayment = async (id: number, approved: boolean) => {
        if (!confirm(approved ? 'Setujui pembayaran ini?' : 'Tolak pembayaran ini?')) return;
        setVerifying(id);
        try {
            await api.put(`/payments/${id}/verify`, { approved });
            loadPayments();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal verifikasi');
        } finally {
            setVerifying(null);
        }
    };

    const syncPayment = async (id: number) => {
        setVerifying(id);
        try {
            await api.post(`/payments/${id}/sync`);
            if (activeTab === 'invoices') loadInvoices();
            else loadPayments();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal sinkronisasi');
        } finally {
            setVerifying(null);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // Stats calculation
    const totalUnpaid = invoices.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
    const pendingVerifCount = payments.filter(p => p.status === 'PENDING' && p.method === 'MANUAL').length;

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-brand-600 rounded-xl shadow-lg shadow-brand-100">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        Manajemen Billing & Pembayaran
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Konsolidasi tagihan dan transaksi dalam satu pintu</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                    <div className="glass-panel p-3 border-amber-100 bg-amber-50/30">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Unpaid Total</p>
                        <p className="text-sm font-black text-gray-800">{formatRupiah(totalUnpaid)}</p>
                    </div>
                    <div className="glass-panel p-3 border-emerald-100 bg-emerald-50/30">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Paid Total</p>
                        <p className="text-sm font-black text-gray-800">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div className="glass-panel p-3 border-blue-100 bg-blue-50/30 hidden sm:block">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Pending Verif</p>
                        <p className="text-sm font-black text-gray-800">{pendingVerifCount} Transaksi</p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 w-fit">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                        activeTab === 'invoices' 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                        : 'text-gray-500 hover:bg-white/60'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Daftar Tagihan
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                        activeTab === 'payments' 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                        : 'text-gray-500 hover:bg-white/60'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    Konfirmasi Transaksi
                </button>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {/* Unified Filter Bar */}
                    <div className="glass-panel p-4 flex flex-wrap items-center gap-4 border-white/40 shadow-xl shadow-brand-900/5">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Filter className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                        </div>
                        
                        {activeTab === 'invoices' ? (
                            <>
                                <select 
                                    className="glass-input text-xs font-bold w-48 !py-2"
                                    value={invFilterStatus}
                                    onChange={e => { setInvFilterStatus(e.target.value); setInvPage(1); }}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="UNPAID">Belum Lunas</option>
                                    <option value="PAID">Lunas</option>
                                </select>
                                <select 
                                    className="glass-input text-xs font-bold w-48 !py-2"
                                    value={invFilterService}
                                    onChange={e => { setInvFilterService(e.target.value); setInvPage(1); }}
                                >
                                    <option value="">Semua Layanan</option>
                                    <option value="REGULER">Reguler</option>
                                    <option value="SELF_DECLARE">Self Declare</option>
                                </select>
                            </>
                        ) : (
                            <>
                                <select 
                                    className="glass-input text-xs font-bold w-48 !py-2"
                                    value={payFilterStatus}
                                    onChange={e => { setPayFilterStatus(e.target.value); setPayPage(1); }}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                                <select 
                                    className="glass-input text-xs font-bold w-48 !py-2"
                                    value={payFilterMethod}
                                    onChange={e => { setPayFilterMethod(e.target.value); setPayPage(1); }}
                                >
                                    <option value="">Semua Metode</option>
                                    <option value="MANUAL">Manual Transfer</option>
                                    <option value="MIDTRANS">Midtrans Online</option>
                                </select>
                            </>
                        )}

                        <div className="ml-auto relative hidden sm:block">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Cari ID atau Klien..." 
                                className="glass-input !pl-9 !py-2 text-xs w-64"
                            />
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="glass-panel overflow-hidden border-white/40 shadow-2xl shadow-brand-900/5">
                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Memuat Data...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Utama</th>
                                            {activeTab === 'invoices' ? (
                                                <>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sumber Harga</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Nominal</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode & Payer</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Jumlah</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Verifikasi</th>
                                                </>
                                            )}
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeTab === 'invoices' ? (
                                            invoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-brand-50/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-gray-800">{inv.submission?.client?.business_name || 'Manual Billing'}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-mono text-gray-400">#{inv.id}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-tighter">{formatServiceType(inv.service_type)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {inv.pricing_source ? (
                                                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-wider">
                                                                {inv.pricing_source.replace(/_/g, ' ')}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-brand-600">{formatRupiah(inv.amount)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {inv.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                            {inv.status === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {inv.status === 'UNPAID' ? (
                                                            <button 
                                                                onClick={() => markPaid(inv.id)}
                                                                className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-700 transition-all active:scale-95 shadow-md shadow-brand-100"
                                                            >
                                                                Konfirmasi Lunas
                                                            </button>
                                                        ) : (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Dibayar Pada</span>
                                                                <span className="text-xs text-emerald-600 font-black">{inv.paid_at ? formatDate(inv.paid_at) : formatDate(inv.created_at)}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            payments.map(p => (
                                                <tr key={p.id} className="hover:bg-brand-50/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-gray-800">
                                                                {p.invoices?.[0]?.submission?.client?.business_name || 'Pembayaran Sistem'}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-mono text-gray-400">#{p.id}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{formatDate(p.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                                p.method === 'MIDTRANS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                            }`}>
                                                                {p.method}
                                                            </span>
                                                            <span className="text-xs text-gray-600 font-medium">{p.invoices?.[0]?.payer?.full_name || 'UMKM'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-brand-600">{formatRupiah(p.amount)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                            p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                                                            p.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {p.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : 
                                                             p.status === 'FAILED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {p.status === 'PENDING' && p.method === 'MANUAL' ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => verifyPayment(p.id, true)}
                                                                    disabled={verifying === p.id}
                                                                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                                                >
                                                                    Setujui
                                                                </button>
                                                                <button 
                                                                    onClick={() => verifyPayment(p.id, false)}
                                                                    disabled={verifying === p.id}
                                                                    className="px-4 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-3">
                                                                {p.proof_url && (
                                                                    <a href={p.proof_url.startsWith('http') ? p.proof_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${p.proof_url}`} 
                                                                        target="_blank" rel="noopener noreferrer"
                                                                        className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-brand-600 hover:text-white transition-all group/btn"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {p.snap_url && (
                                                                    <a href={p.snap_url} target="_blank" rel="noopener noreferrer"
                                                                        className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {p.method === 'MIDTRANS' && p.status === 'PENDING' && (
                                                                    <button 
                                                                        onClick={() => syncPayment(p.id)}
                                                                        disabled={verifying === p.id}
                                                                        className="p-2 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                                                                        title="Sinkronisasi Status Midtrans"
                                                                    >
                                                                        {verifying === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Consolidated Pagination */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Menampilkan {activeTab === 'invoices' ? invoices.length : payments.length} data
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => activeTab === 'invoices' ? setInvPage(p => p - 1) : setPayPage(p => p - 1)}
                                    disabled={activeTab === 'invoices' ? invPage === 1 : payPage === 1}
                                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-brand-600 disabled:opacity-30 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <button 
                                    onClick={() => activeTab === 'invoices' ? setInvPage(p => p + 1) : setPayPage(p => p + 1)}
                                    disabled={activeTab === 'invoices' ? invPage * 20 >= invTotal : payPage * 20 >= payTotal}
                                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-brand-600 disabled:opacity-30 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
