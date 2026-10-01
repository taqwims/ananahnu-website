import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Send, FileText, AlertCircle, CheckCircle2, CreditCard, Lock, FileCheck, ShieldCheck, Download, Award } from 'lucide-react';
import PaymentSection from '../../components/dashboard/PaymentSection';
import { useAuthStore } from '../../store/authStore';
import { useSubmission } from '../../hooks/useSubmission';
import { SubmissionHeader } from '../../components/dashboard/submission/SubmissionHeader';
import { ClientInfoSection } from '../../components/dashboard/submission/ClientInfoSection';
import { WorkflowActions } from '../../components/dashboard/submission/WorkflowActions';
import { DocumentList } from '../../components/dashboard/submission/DocumentList';
import { SubmissionCertificate } from '../../components/dashboard/submission/SubmissionCertificate';
import { SubmissionInvoice } from '../../components/dashboard/submission/SubmissionInvoice';
import { SubmissionHistory } from '../../components/dashboard/submission/SubmissionHistory';
import { DataReturnNoticeCard } from '../../components/dashboard/submission/DataReturnNoticeCard';
import api from '../../services/api';
import type { BusinessType } from '../../types';
import ContractTextPreview from '../../components/dashboard/submission/ContractTextPreview';
import { submissionService } from '../../services/submissionService';
import { resolveFileUrl, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

export default function SubmissionDetail() {
    const { id } = useParams();
    const {
        submission,
        history,
        fieldValues,
        invoice,
        loading,
        processing,
        refresh,
        updateClient,
        updateClientInfoAndPricing,
        handleAction,
        issueSH,
        revokeSH,
        submitSJPH,
        approveSJPH,
        saveAuditInfo,
        saveAuditResult,
        updateBusinessType
    } = useSubmission(id);

    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    useEffect(() => {
        api.get('/billing-config/business-types').then(res => setBusinessTypes(res.data || []));
    }, []);

    const user = useAuthStore(state => state.user);
    const [editingData, setEditingData] = useState(false);
    const [contractConsent, setContractConsent] = useState(false);
    const [activeTab, setActiveTab] = useState<'DATA' | 'CONTRACT' | 'PAYMENT' | 'SJPH'>('DATA');
    const [sjphConsent, setSjphConsent] = useState(false);
    const [contractAgreed, setContractAgreed] = useState<boolean>(() => {
        return typeof window !== 'undefined' && window.localStorage.getItem(`contract_agreed_${id}`) === 'true';
    });

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
        </div>
    );

    if (!submission) return <div className="p-8 text-center text-gray-500">Submission not found</div>;

    if (user?.role === 'CLIENT') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
                <SubmissionHeader submission={submission} user={user} fieldValues={fieldValues} />

                {/* 4 Main Tabs Navigation */}
                {(() => {
                    const isTab2Unlocked = Boolean(
                        submission.service_type &&
                        submission.service_type !== 'PENDING_CONSULTATION' &&
                        (
                            submission.service_type === 'SELF_DECLARE' ||
                            submission.cost_detail ||
                            ((submission as any).total_cost && (submission as any).total_cost > 0) ||
                            submission.status !== 'DRAFT'
                        )
                    );

                    const isContractVerified = contractAgreed || Boolean((submission as any).contract_agreed_at) || Boolean((submission as any).contract_url) || (submission.status !== 'DRAFT' && submission.status !== 'WAITING_PAYMENT' && submission.status !== 'WAITING_ASSIGNMENT');

                    const isTab3Unlocked = Boolean(isTab2Unlocked && isContractVerified);

                    const isPaid = Boolean(
                        submission.invoice?.status === 'PAID' ||
                        submission.invoices?.some(inv => inv.status === 'PAID') ||
                        submission.payments?.some(p => p.status === 'PAID' || (p.status as string) === 'SETTLEMENT' || (p.status as string) === 'SUCCESS') ||
                        submission.status === 'SH_TERBIT' ||
                        submission.status === 'SIDANG_FATWA' ||
                        submission.status === 'QC_OFFICER' ||
                        submission.status === 'DRAFTER' ||
                        submission.status === 'QC_REVIEW' ||
                        submission.status === 'SUBMITTED_TO_BPJPH' ||
                        submission.service_type === 'SELF_DECLARE'
                    );

                    const isTab4Unlocked = Boolean(isTab3Unlocked && isPaid);

                    const handleVerifyContract = () => {
                        setContractAgreed(true);
                        if (id) localStorage.setItem(`contract_agreed_${id}`, 'true');
                        toast.success('Dokumen Kontrak Layanan berhasil diverifikasi!');
                        setActiveTab('PAYMENT');
                    };

                    const handleDownloadInvoice = async (type?: 'DP' | 'PELUNASAN' | 'FULL') => {
                        if (!id) return;
                        try {
                            const toastId = toast.loading(`Mengunduh Invoice / Kwitansi Resmi...`);
                            const urlParam = type ? `?type=${type}` : '';
                            const res = await api.get(`/documents/submissions/${id}/invoice-pdf${urlParam}`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `Invoice_${type || 'Lunas'}_${submission.client?.business_name || 'Pelanggan'}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            toast.success('Invoice berhasil diunduh', { id: toastId });
                        } catch (error) {
                            toast.error('Gagal mengunduh invoice');
                            console.error('Download error:', error);
                        }
                    };

                    return (
                        <>
                            <div className="flex border-b border-gray-200 gap-1.5 sm:gap-3 overflow-x-auto pb-px no-scrollbar select-none">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('DATA')}
                                    className={`pb-3 px-3 sm:px-4 font-black text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                                        activeTab === 'DATA'
                                            ? 'text-brand-600 border-brand-600'
                                            : 'text-gray-400 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <span>1. Data Pelaku Usaha & Usaha</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('CONTRACT')}
                                    className={`pb-3 px-3 sm:px-4 font-black text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                                        activeTab === 'CONTRACT'
                                            ? 'text-brand-600 border-brand-600'
                                            : 'text-gray-400 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    {!isTab2Unlocked ? (
                                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                    ) : (
                                        <FileCheck className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>2. Dokumen Kontrak & Biaya</span>
                                    {!isTab2Unlocked ? (
                                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">Terkunci</span>
                                    ) : isContractVerified ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">Terverifikasi</span>
                                    ) : null}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('PAYMENT')}
                                    className={`pb-3 px-3 sm:px-4 font-black text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                                        activeTab === 'PAYMENT'
                                            ? 'text-brand-600 border-brand-600'
                                            : 'text-gray-400 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    {!isTab3Unlocked ? (
                                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                    ) : (
                                        <CreditCard className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>3. Pembayaran</span>
                                    {!isTab3Unlocked ? (
                                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">Terkunci</span>
                                    ) : isPaid ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">Lunas</span>
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('SJPH')}
                                    className={`pb-3 px-3 sm:px-4 font-black text-xs sm:text-sm transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ${
                                        activeTab === 'SJPH'
                                            ? 'text-brand-600 border-brand-600'
                                            : 'text-gray-400 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    {!isTab4Unlocked ? (
                                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                                    ) : (
                                        <ShieldCheck className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>4. Dokumen SJPH & Unduhan</span>
                                    {!isTab4Unlocked ? (
                                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">Terkunci</span>
                                    ) : submission.sjph_approved_at ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">Disetujui</span>
                                    ) : submission.status === 'REVIEW_SJPH_CLIENT' ? (
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                                    ) : null}
                                </button>
                            </div>

                            {/* TAB 1: DATA PELAKU USAHA & USAHA */}
                            {activeTab === 'DATA' && (
                                <div className="space-y-6">
                                    {submission.status === 'REVISION' && submission.reject_note && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 shadow-sm">
                                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                            <div className="space-y-1 flex-1">
                                                <h4 className="text-xs font-black text-red-900 uppercase tracking-wider">Catatan Revisi dari Petugas:</h4>
                                                <p className="text-xs text-red-800 leading-relaxed font-medium">{submission.reject_note}</p>
                                            </div>
                                        </div>
                                    )}

                                    {submission.status === 'WAITING_ASSIGNMENT' && (
                                        <div className="glass-panel p-6 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-4 shadow-sm">
                                            <div className="w-3 h-3 rounded-full bg-purple-600 mt-1.5 shrink-0 animate-ping"></div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-purple-900 uppercase tracking-wider">Menunggu Penentuan Pendamping Halal</h4>
                                                <p className="text-xs text-purple-700 leading-relaxed font-medium">
                                                    Pengajuan Anda telah berhasil tersimpan dan sedang dalam antrian penentuan Pendamping Halal (Advisor) resmi oleh tim kami.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {submission.status === 'WAITING_PAYMENT' && (
                                        <div className="glass-panel p-6 bg-amber-600 text-white rounded-2xl shadow-sm">
                                            <h3 className="text-lg font-black tracking-tight mb-1">Menunggu Pembayaran</h3>
                                            <p className="text-amber-100 text-sm leading-relaxed">
                                                Pengajuan Anda telah diverifikasi oleh Advisor. Silakan buka <strong>Tab 3: Pembayaran</strong> untuk menyelesaikan tagihan Anda.
                                            </p>
                                        </div>
                                    )}

                                    {['VERVAL_PENDAMPING', 'REVIEW_SJPH_CLIENT', 'QC_OFFICER', 'DRAFTER', 'QC_REVIEW', 'SIDANG_FATWA'].includes(submission.status) && (
                                        <div className="glass-panel p-6 bg-brand-50 border border-brand-100 rounded-2xl flex items-start gap-4 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-brand-600 mt-2.5 shrink-0 animate-pulse"></div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-brand-900 uppercase tracking-wider">Sedang Diproses</h4>
                                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                    Pengajuan Anda sedang diproses oleh tim kami (Status: <strong>{submission.status.replace(/_/g, ' ')}</strong>). Dokumen dan bahan usaha Anda sedang diverifikasi.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {submission.status === 'SH_TERBIT' && (
                                        <div className="glass-panel p-6 bg-green-900 text-white rounded-2xl shadow-sm">
                                            <h3 className="text-lg font-black tracking-tight mb-1">🎉 Sertifikat Halal Terbit</h3>
                                            <p className="text-green-100 text-sm leading-relaxed">
                                                Selamat! Sertifikat Halal Anda telah berhasil diterbitkan. Silakan unduh dokumen sertifikat pada Tab 4.
                                            </p>
                                        </div>
                                    )}

                                    <ClientInfoSection
                                        submission={submission}
                                        user={user}
                                        onUpdateClient={updateClient}
                                        onUpdateClientInfoAndPricing={updateClientInfoAndPricing}
                                        onUpdateBusinessType={updateBusinessType}
                                        businessTypes={businessTypes}
                                        processing={processing}
                                        defaultCollapsed={false}
                                        hideContractBanner={isContractVerified}
                                    />

                                    <DocumentList
                                        submission={submission}
                                        user={user}
                                        fieldValues={fieldValues}
                                        editingData={editingData}
                                        setEditingData={setEditingData}
                                        onRefresh={refresh}
                                        defaultCollapsed={submission.status === 'WAITING_PAYMENT' || isContractVerified}
                                    />

                                    {submission.sh_url && (
                                        <SubmissionCertificate
                                            shUrl={submission.sh_url}
                                            isSplitPayment={submission.service_type === 'REGULER'}
                                            pelunasanPaid={
                                                submission.service_type !== 'REGULER' ||
                                                !!(submission.invoices?.find(inv => inv.type === 'FULL')?.status === 'PAID') ||
                                                !!(submission.invoices?.find(inv => inv.type === 'PELUNASAN')?.status === 'PAID')
                                            }
                                        />
                                    )}

                                    {/* CTA Navigasi Sesuai Tahapan */}
                                    {!isTab2Unlocked ? (
                                        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-white/10">
                                            <div className="space-y-0.5">
                                                <div className="inline-flex items-center gap-1.5 text-gold-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                                                    <Lock className="w-3.5 h-3.5" /> Menunggu Penentuan Layanan &amp; Biaya
                                                </div>
                                                <p className="text-xs text-gray-300 font-medium">
                                                    Data pengajuan Anda telah tersimpan. Pendamping Halal (Advisor) sedang memverifikasi data untuk menentukan skema layanan &amp; harga.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('CONTRACT')}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 shrink-0 active:scale-95"
                                            >
                                                <span>Lihat Status Tab 2</span>
                                                <Lock className="w-3.5 h-3.5 text-gold-400" />
                                            </button>
                                        </div>
                                    ) : !isContractVerified ? (
                                        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-gold-400">Langkah Berikutnya: Dokumen Kontrak &amp; Biaya</h4>
                                                <p className="text-xs text-gray-300 font-medium">
                                                    Skema layanan telah ditentukan. Periksa dan verifikasi Dokumen Kontrak Layanan pada Tab 2 sebelum melanjutkan ke pembayaran.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('CONTRACT')}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-gold-400 hover:bg-gold-500 text-brand-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                                            >
                                                <span>Buka Dokumen Kontrak</span>
                                                <FileCheck className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : !isPaid ? (
                                        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-brand-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-emerald-300">Langkah Berikutnya: Pembayaran Tagihan</h4>
                                                <p className="text-xs text-gray-300 font-medium">
                                                    Kontrak layanan telah diverifikasi. Silakan selesaikan pembayaran tagihan Anda pada Tab 3.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('PAYMENT')}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                                            >
                                                <span>Lanjut ke Pembayaran</span>
                                                <CreditCard className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950 to-brand-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-blue-300">Langkah Berikutnya: Dokumen SJPH &amp; Unduhan</h4>
                                                <p className="text-xs text-gray-300 font-medium">
                                                    Seluruh dokumen sertifikasi, berkas kontrak, dan persetujuan SJPH dapat diunduh pada Tab 4.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('SJPH')}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                                            >
                                                <span>Buka Dokumen SJPH &amp; Unduhan</span>
                                                <ShieldCheck className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: DOKUMEN KONTRAK & BIAYA */}
                            {activeTab === 'CONTRACT' && (
                                <div className="space-y-6">
                                    {!isTab2Unlocked ? (
                                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md text-amber-400 flex items-center justify-center mx-auto border border-white/20 shadow-inner">
                                                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                                            </div>
                                            <div className="space-y-2 max-w-lg mx-auto">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
                                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                                    Dokumen Terkunci
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                                                    Dokumen Kontrak &amp; Biaya Terkunci
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                                    Pendamping Halal (Advisor) yang bertugas sedang menelaah profil usaha, kapasitas produk, dan dokumen yang Anda unggah untuk menentukan skema sertifikasi (Self Declare / Reguler) serta perhitungan biaya resmi. Dokumen Kontrak Layanan dan rincian biaya akan terbuka otomatis setelah ditentukan oleh Halal Advisor.
                                                </p>
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('DATA')}
                                                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
                                                >
                                                    Kembali ke Tab 1: Data Pengajuan
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ContractTextPreview submission={submission} />

                                            {submission.sjph_notes && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                                    <p className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Catatan Pendamping Halal:</p>
                                                    <p className="text-xs text-amber-800 font-medium italic">&ldquo;{submission.sjph_notes}&rdquo;</p>
                                                </div>
                                            )}

                                            {/* Verifikasi Kontrak Layanan Sebelum Bayar */}
                                            {isContractVerified ? (
                                                <div className="p-4 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-black text-emerald-950">Dokumen Kontrak Telah Diverifikasi & Disetujui</h4>
                                                                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                                                                    Anda telah memverifikasi Dokumen Kontrak Perjanjian Layanan. Silakan lanjutkan ke Tab 3 untuk menyelesaikan pembayaran.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('PAYMENT')}
                                                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
                                                        >
                                                            <span>Lanjut ke Tab 3 (Pembayaran)</span>
                                                            <CreditCard className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 sm:p-6 rounded-3xl bg-white border-2 border-brand-500 shadow-xl space-y-5">
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                            <FileCheck className="w-5 h-5 text-brand-600 shrink-0" />
                                                            <span>Verifikasi & Persetujuan Dokumen Kontrak Layanan</span>
                                                        </h4>
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                            Sesuai alur resmi sertifikasi, Anda wajib membaca dan memverifikasi Dokumen Kontrak Layanan Pendampingan di atas sebelum dapat melanjutkan ke tahap pembayaran.
                                                        </p>
                                                    </div>

                                                    <label className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-gray-200 bg-brand-50/40 cursor-pointer hover:bg-brand-50/70 hover:border-brand-300 transition-all select-none">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-0.5 w-4 h-4 text-brand-600 accent-brand-600 rounded shrink-0"
                                                            checked={contractConsent}
                                                            onChange={(e) => setContractConsent(e.target.checked)}
                                                        />
                                                        <span className="text-xs font-bold text-gray-800 leading-relaxed">
                                                            Saya selaku pelaku usaha telah membaca, memeriksa, dan menyetujui seluruh klausul perjanjian serta skema layanan dalam Dokumen Kontrak ini.
                                                        </span>
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyContract}
                                                        disabled={!contractConsent}
                                                        className="w-full py-3.5 sm:py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-brand-100 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span>Verifikasi Kontrak & Lanjut ke Pembayaran</span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: PEMBAYARAN */}
                            {activeTab === 'PAYMENT' && (
                                <div className="space-y-6">
                                    {!isTab3Unlocked ? (
                                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md text-amber-400 flex items-center justify-center mx-auto border border-white/20 shadow-inner">
                                                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                                            </div>
                                            <div className="space-y-2 max-w-lg mx-auto">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
                                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                                    Dokumen Terkunci
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                                                    Dokumen Pembayaran Terkunci
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                                    {!isTab2Unlocked
                                                        ? 'Layanan dan skema biaya belum ditentukan oleh Halal Advisor. Harap tunggu penetapan dari Advisor pada Tab 2.'
                                                        : 'Sesuai SOP sertifikasi, Anda wajib membaca dan memverifikasi Dokumen Kontrak Layanan pada Tab 2 terlebih dahulu sebelum dapat melakukan pembayaran tagihan.'
                                                    }
                                                </p>
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('CONTRACT')}
                                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <FileCheck className="w-4 h-4" />
                                                    <span>Buka Tab 2: Dokumen Kontrak</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {isPaid && (
                                                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-300 text-emerald-950 shadow-sm space-y-4">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                                                        <div className="flex items-start sm:items-center gap-3">
                                                            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                                                                <CheckCircle2 className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-base font-black text-emerald-950">Pembayaran Lunas &amp; Terverifikasi</h4>
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                                                                        LUNAS
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                                                                    Kewajiban pembayaran telah terpenuhi. Dokumen SJPH &amp; seluruh berkas unduhan dapat diakses di Tab 4.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadInvoice()}
                                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                                                            >
                                                                <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                                                <span>Unduh Invoice (PDF)</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveTab('SJPH')}
                                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                                                            >
                                                                <span>Buka Tab 4 (Dokumen SJPH)</span>
                                                                <ShieldCheck className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Detail Transaksi Pembayaran */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                                        <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">No. Kwitansi / Ref</span>
                                                            <span className="font-mono font-bold text-gray-800 text-xs truncate block mt-0.5">
                                                                {(submission as any).nomor_pembayaran || (invoice as any)?.nomor_invoice || ((submission as any).registration_number ? `INV-${(submission as any).registration_number}` : `INV-${submission.id.substring(0, 8).toUpperCase()}`)}
                                                            </span>
                                                        </div>
                                                        <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Terbayar</span>
                                                            <span className="font-bold text-emerald-700 text-xs truncate block mt-0.5">
                                                                {formatCurrency(submission.cost_detail?.total_amount || invoice?.amount || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Skema Layanan</span>
                                                            <span className="font-bold text-gray-800 text-xs truncate block mt-0.5">
                                                                {submission.service_type === 'SELF_DECLARE' ? 'Self Declare (Fasilitasi)' : 'Reguler (Pendampingan)'}
                                                            </span>
                                                        </div>
                                                        <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status Verifikasi</span>
                                                            <span className="font-bold text-emerald-700 text-xs flex items-center gap-1 mt-0.5">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Keuangan
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Form Pembayaran DP / Tagihan Awal untuk Klien */}
                                            {(submission.status === 'WAITING_PAYMENT' || (submission.service_type !== 'SELF_DECLARE' && invoice && invoice.status !== 'PAID' && submission.status !== 'DRAFT' && submission.status !== 'WAITING_ASSIGNMENT')) && (
                                                <PaymentSection
                                                    submission={submission}
                                                    fieldValues={fieldValues}
                                                    onPaymentSuccess={refresh}
                                                    invoiceType={invoice?.type === 'PELUNASAN' ? 'PELUNASAN' : (submission.cost_detail?.payment_scheme === 'FULL' || invoice?.type === 'FULL' ? 'FULL' : 'DP')}
                                                />
                                            )}

                                            {submission.status === 'SH_TERBIT' &&
                                                submission.service_type === 'REGULER' &&
                                                !submission.invoices?.find(inv => inv.type === 'FULL' && inv.status === 'PAID') &&
                                                submission.invoices?.find(inv => inv.type === 'PELUNASAN')?.status !== 'PAID' && (
                                                    <PaymentSection
                                                        submission={submission}
                                                        fieldValues={fieldValues}
                                                        onPaymentSuccess={refresh}
                                                        invoiceType="PELUNASAN"
                                                    />
                                                )}

                                            {invoice && (
                                                <SubmissionInvoice invoice={invoice} submissionId={submission.id} submission={submission} onRefresh={refresh} />
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB 4: DOKUMEN SJPH & UNDUHAN FILE */}
                            {activeTab === 'SJPH' && (
                                <div className="space-y-6">
                                    {!isTab4Unlocked ? (
                                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md text-amber-400 flex items-center justify-center mx-auto border border-white/20 shadow-inner">
                                                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                                            </div>
                                            <div className="space-y-2 max-w-lg mx-auto">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
                                                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                                                    Dokumen Terkunci
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                                                    Dokumen SJPH &amp; Unduhan Terkunci
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                                                    Dokumen Manual SJPH dan seluruh berkas pengajuan sertifikasi hanya dapat diakses dan diunduh setelah kewajiban pembayaran tagihan diselesaikan pada Tab 3.
                                                </p>
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('PAYMENT')}
                                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    <span>Buka Tab 3: Pembayaran</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Download Center Header */}
                                            <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-gold-400 text-xs font-black uppercase tracking-wider border border-white/10">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        Pusat Unduhan Dokumen Resmi
                                                    </div>
                                                    <h3 className="text-lg sm:text-xl font-black text-white">
                                                        Dokumen Sertifikasi &amp; Laporan Berkas
                                                    </h3>
                                                    <p className="text-xs text-gray-300 max-w-xl">
                                                        Unduh berkas resmi sertifikasi halal usaha Anda dalam format PDF langsung melalui tombol unduh di bawah ini.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Downloadable Cards Grid (No Previews) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Card 1: Dokumen SJPH */}
                                                <div className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                            <ShieldCheck className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900">Dokumen Manual SJPH</h4>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                Manual Sistem Jaminan Produk Halal yang telah disusun sesuai standar BPJPH &amp; Komisi Fatwa MUI.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                toast.loading('Mengunduh Dokumen SJPH...', { id: 'download-sjph' });
                                                                await submissionService.downloadSJPH(submission.id, 'pdf');
                                                                toast.success('Dokumen SJPH berhasil diunduh', { id: 'download-sjph' });
                                                            } catch (e: any) {
                                                                toast.error(e.message || 'Gagal mengunduh SJPH', { id: 'download-sjph' });
                                                            }
                                                        }}
                                                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        <span>Unduh Dokumen SJPH (.pdf)</span>
                                                    </button>
                                                </div>

                                                {/* Card 2: Dokumen Kontrak Layanan */}
                                                <div className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                            <FileCheck className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900">Dokumen Kontrak Perjanjian</h4>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                Surat Perjanjian Kerja Sama pendampingan sertifikasi halal antara Pelaku Usaha dan LP3H.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                toast.loading('Mengunduh Kontrak Layanan...', { id: 'download-contract' });
                                                                await submissionService.downloadContract(submission.id, 'pdf');
                                                                toast.success('Kontrak Layanan berhasil diunduh', { id: 'download-contract' });
                                                            } catch (e: any) {
                                                                toast.error(e.message || 'Gagal mengunduh kontrak', { id: 'download-contract' });
                                                            }
                                                        }}
                                                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        <span>Unduh Dokumen Kontrak (.pdf)</span>
                                                    </button>
                                                </div>

                                                {/* Card 3: Dokumen SPH */}
                                                {(submission.service_type === 'REGULER' || submission.cost_detail) && (
                                                    <div className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                        <div className="space-y-2">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                                                <CreditCard className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-gray-900">Surat Penawaran Harga (SPH)</h4>
                                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                    Rincian estimasi biaya sertifikasi halal resmi dan komponen biaya operasional pendampingan.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    toast.loading('Mengunduh Dokumen SPH...', { id: 'download-sph' });
                                                                    await submissionService.downloadSPH(submission.id);
                                                                    toast.success('Dokumen SPH berhasil diunduh', { id: 'download-sph' });
                                                                } catch (e: any) {
                                                                    toast.error(e.message || 'Gagal mengunduh SPH', { id: 'download-sph' });
                                                                }
                                                            }}
                                                            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            <span>Unduh Dokumen SPH (.pdf)</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Card 4: Sertifikat Halal Resmi (jika terbit) */}
                                                {submission.sh_url && (
                                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-gold-50/40 border border-gold-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                        <div className="space-y-2">
                                                            <div className="w-10 h-10 rounded-xl bg-gold-400 text-brand-950 flex items-center justify-center shadow-xs">
                                                                <Award className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-brand-950">Sertifikat Halal Resmi BPJPH</h4>
                                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                                    Sertifikat Halal resmi yang telah diterbitkan oleh Badan Penyelenggara Jaminan Produk Halal (BPJPH).
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={resolveFileUrl(submission.sh_url)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-full py-2.5 px-4 bg-gold-500 hover:bg-gold-600 text-brand-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            <span>Unduh Sertifikat Halal</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {submission.sjph_notes && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                                    <p className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Catatan Pendamping Halal:</p>
                                                    <p className="text-xs text-amber-800 font-medium italic">&ldquo;{submission.sjph_notes}&rdquo;</p>
                                                </div>
                                            )}

                                            {/* Consent & Approval Section */}
                                            {submission.sjph_approved_at ? (
                                                <div className="p-4 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                                                    <h4 className="text-sm font-black flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                                        <span>Dokumen SJPH Telah Disetujui</span>
                                                    </h4>
                                                    <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                                                        Dokumen ini telah Anda setujui pada {new Date(submission.sjph_approved_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}. Berkas saat ini sedang dalam proses di Manager Operasional / Ruang Kerja QC.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-4 sm:p-6 rounded-3xl bg-white border-2 border-emerald-500 shadow-xl space-y-5">
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                                            <span>Persetujuan Dokumen SJPH oleh Pelaku Usaha</span>
                                                        </h4>
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                            Silakan unduh dan pelajari Dokumen Manual SJPH di atas. Aktifkan toggle persetujuan di bawah ini untuk menyetujui dan melanjutkan proses pengajuan ke tahap verifikasi berikutnya.
                                                        </p>
                                                    </div>

                                                    {/* Toggle Switch Setuju */}
                                                    <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 gap-3">
                                                        <span className="text-xs font-bold text-gray-800 leading-relaxed min-w-0 flex-1">
                                                            Setujui Dokumen SJPH untuk melanjutkan proses pengajuan ke tahap berikutnya
                                                        </span>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={sjphConsent}
                                                            onClick={() => setSjphConsent(!sjphConsent)}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                sjphConsent ? 'bg-emerald-600' : 'bg-gray-300'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                                                    sjphConsent ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            await approveSJPH();
                                                        }}
                                                        disabled={!sjphConsent || processing}
                                                        className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                                    >
                                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-gold-400" />}
                                                        <span>Setujui Dokumen SJPH & Lanjutkan Pengajuan</span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        );
    }
    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            <SubmissionHeader submission={submission} user={user} fieldValues={fieldValues} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                    {submission.reject_note && (submission.status === 'REJECTED' || submission.status === 'REVISION') && (
                        <div className={`p-4 border rounded-2xl flex items-start gap-4 shadow-sm ${submission.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                            }`}>
                            <div className={`p-2 rounded-xl ${submission.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${submission.status === 'REJECTED' ? 'text-red-900' : 'text-amber-900'
                                        }`}>
                                        Catatan {submission.status === 'REJECTED' ? 'Penolakan' : 'Revisi'}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${submission.status === 'REJECTED' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                                        }`}>
                                        Perlu Perhatian
                                    </span>
                                </div>
                                <p className={`text-sm font-medium leading-relaxed ${submission.status === 'REJECTED' ? 'text-red-800' : 'text-amber-800'
                                    }`}>
                                    {submission.reject_note}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Dedicated Data Return Documentation Card */}
                    <DataReturnNoticeCard submission={submission} />

                    {/* Informasi Client Read Only */}
                    <ClientInfoSection
                        submission={submission}
                        user={user}
                        onUpdateClient={updateClient}
                        onUpdateClientInfoAndPricing={updateClientInfoAndPricing}
                        onUpdateBusinessType={updateBusinessType}
                        businessTypes={businessTypes}
                        processing={processing}
                        defaultCollapsed={false}
                    />



                    {/* Perjanjian Kontrak Layanan Pendampingan untuk Semua Layanan */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-850 flex items-center gap-2 uppercase tracking-wider">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Perjanjian Kontrak Layanan Pendampingan
                        </h3>
                        <p className="text-xs text-gray-500">
                            Berikut adalah draf kontrak perjanjian layanan pendampingan sertifikasi halal Anda. Silakan pelajari seluruh pasal di bawah ini.
                        </p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 max-h-[500px] overflow-y-auto p-2">
                            <ContractTextPreview submission={submission} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {submission.status === 'WAITING_PAYMENT' && (
                            <PaymentSection
                                submission={submission}
                                fieldValues={fieldValues}
                                onPaymentSuccess={refresh}
                                invoiceType={invoice?.type === 'PELUNASAN' ? 'PELUNASAN' : (submission.cost_detail?.payment_scheme === 'FULL' || invoice?.type === 'FULL' ? 'FULL' : 'DP')}
                            />
                        )}

                        <DocumentList
                            submission={submission}
                            user={user}
                            fieldValues={fieldValues}
                            editingData={editingData}
                            setEditingData={setEditingData}
                            onRefresh={refresh}
                        />
                    </div>

                    {submission.sh_url && (
                        <SubmissionCertificate
                            shUrl={submission.sh_url}
                            isSplitPayment={submission.service_type === 'REGULER'}
                            pelunasanPaid={
                                submission.service_type !== 'REGULER' ||
                                !!(submission.invoices?.find(inv => inv.type === 'PELUNASAN')?.status === 'PAID')
                            }
                        />
                    )}

                    {/* Pelunasan 30% section — shown at SH_TERBIT for REGULER (staff view) */}
                    {submission.status === 'SH_TERBIT' &&
                        submission.service_type === 'REGULER' &&
                        submission.invoices?.find(inv => inv.type === 'PELUNASAN')?.status !== 'PAID' && (
                            <PaymentSection
                                submission={submission}
                                fieldValues={fieldValues}
                                onPaymentSuccess={refresh}
                                invoiceType="PELUNASAN"
                            />
                        )}

                    {invoice && (
                        <SubmissionInvoice invoice={invoice} submissionId={submission.id} submission={submission} onRefresh={refresh} />
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                    <WorkflowActions
                        submission={submission}
                        user={user}
                        processing={processing}
                        onAction={handleAction}
                        onSaveAuditInfo={saveAuditInfo}
                        onSaveAuditResult={saveAuditResult}
                        onIssueSH={issueSH}
                        onRevokeSH={revokeSH}
                        onSubmitSJPH={submitSJPH}
                        onApproveSJPH={approveSJPH}
                    />

                    <SubmissionHistory history={history} />
                </div>
            </div>
        </div>
    );
}
