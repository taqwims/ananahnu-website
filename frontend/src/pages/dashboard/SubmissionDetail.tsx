import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Send, FileText, AlertTriangle, AlertCircle, CheckCircle2, CreditCard, Lock, FileCheck, ShieldCheck } from 'lucide-react';
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
import SJPHTextPreview from '../../components/dashboard/submission/SJPHTextPreview';
import SubmissionReportPreview from '../../components/dashboard/submission/SubmissionReportPreview';
import Modal from '../../components/ui/Modal';
import { submissionService } from '../../services/submissionService';
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
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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

                    const isContractVerified = contractAgreed || Boolean((submission as any).contract_agreed_at) || Boolean((submission as any).contract_url) || (submission.status !== 'DRAFT' && submission.status !== 'WAITING_PAYMENT' && submission.status !== 'WAITING_ASSIGNMENT');

                    const handleVerifyContract = () => {
                        setContractAgreed(true);
                        if (id) localStorage.setItem(`contract_agreed_${id}`, 'true');
                        toast.success('Dokumen Kontrak Layanan berhasil diverifikasi!');
                        setActiveTab('PAYMENT');
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
                                    <FileCheck className="w-4 h-4 shrink-0" />
                                    <span>2. Dokumen Kontrak</span>
                                    {isContractVerified && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">Terverifikasi</span>
                                    )}
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
                                    <CreditCard className="w-4 h-4 shrink-0" />
                                    <span>3. Pembayaran</span>
                                    {isPaid ? (
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
                                    {!isPaid ? <Lock className="w-4 h-4 text-gray-400 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                                    <span>4. Dokumen SJPH & Laporan</span>
                                    {submission.status === 'REVIEW_SJPH_CLIENT' && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                                    )}
                                    {submission.sjph_approved_at && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">Disetujui</span>
                                    )}
                                </button>
                            </div>

                            {/* TAB 1: DATA PELAKU USAHA & USAHA */}
                            {activeTab === 'DATA' && (
                                <div className="space-y-6">
                                    {(submission.status === 'DRAFT' || submission.status === 'REVISION') && (
                                        <div className="glass-panel p-6 bg-brand-900 text-white relative overflow-hidden rounded-[24px]">
                                            <div className="absolute top-0 right-0 w-[40%] h-full bg-brand-800 rounded-full blur-[100px] opacity-35"></div>
                                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-1.5 flex-1">
                                                    <h3 className="text-lg font-black tracking-tight text-gold-400 uppercase tracking-wider">
                                                        Lengkapi Data Pengajuan
                                                    </h3>
                                                    <p className="text-brand-100 text-sm leading-relaxed max-w-xl">
                                                        Silakan lengkapi profil usaha dan dokumen persyaratan di bawah ini. Setelah semua data terisi dengan benar, klik tombol <strong>Kirim Pengajuan</strong> di sebelah kanan.
                                                    </p>
                                                    {submission.status === 'REVISION' && submission.reject_note && (
                                                        <div className="p-3 bg-red-500/25 border border-red-500/30 rounded-xl mt-3">
                                                            <p className="text-xs font-black text-red-200 uppercase tracking-wider mb-1">Catatan Revisi:</p>
                                                            <p className="text-xs text-white leading-relaxed font-medium">{submission.reject_note}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setIsConfirmOpen(true)}
                                                    disabled={processing}
                                                    className="w-full sm:w-auto px-5 py-3.5 bg-gold-400 hover:bg-gold-500 text-brand-900 rounded-2xl font-black text-xs sm:text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 shrink-0 disabled:opacity-50"
                                                >
                                                    {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                                    <span>Kirim Pengajuan</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {submission.status === 'WAITING_ASSIGNMENT' && (
                                        <div className="glass-panel p-6 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-4 shadow-sm">
                                            <div className="w-3 h-3 rounded-full bg-purple-600 mt-1.5 shrink-0 animate-ping"></div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-purple-900 uppercase tracking-wider">Menunggu Penentuan Pendamping Halal</h4>
                                                <p className="text-xs text-purple-700 leading-relaxed font-medium">
                                                    Pengajuan Anda telah berhasil dikirim dan sedang dalam antrian penentuan Pendamping Halal oleh tim Marketing.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {submission.status === 'WAITING_PAYMENT' && (
                                        <div className="glass-panel p-6 bg-amber-600 text-white rounded-2xl">
                                            <h3 className="text-lg font-black tracking-tight mb-1">Menunggu Pembayaran</h3>
                                            <p className="text-amber-100 text-sm leading-relaxed">
                                                Pengajuan Anda telah disetujui untuk diteruskan ke proses berikutnya. Silakan buka <strong>Tab 3: Pembayaran</strong> untuk menyelesaikan tagihan Anda.
                                            </p>
                                        </div>
                                    )}

                                    {['VERVAL_PENDAMPING', 'REVIEW_SJPH_CLIENT', 'QC_OFFICER', 'DRAFTER', 'QC_REVIEW', 'SIDANG_FATWA'].includes(submission.status) && (
                                        <div className="glass-panel p-6 bg-brand-50 border border-brand-100 rounded-2xl flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-brand-600 mt-2.5 shrink-0 animate-pulse"></div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-brand-900 uppercase tracking-wider">Sedang Diproses</h4>
                                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                    Pengajuan Anda sedang diproses oleh tim kami (Status: <strong>{submission.status.replace(/_/g, ' ')}</strong>). Kami akan memverifikasi data dan dokumen Anda.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {submission.status === 'SH_TERBIT' && (
                                        <div className="glass-panel p-6 bg-green-900 text-white rounded-2xl">
                                            <h3 className="text-lg font-black tracking-tight mb-1">🎉 Sertifikat Halal Terbit</h3>
                                            <p className="text-green-100 text-sm leading-relaxed">
                                                Selamat! Sertifikat Halal Anda telah berhasil diterbitkan. Silakan unduh sertifikat halal Anda melalui tombol unduh di bawah ini.
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

                                    {/* Jika kontrak sudah disetujui, Dokumen & Data disembunyikan dari Tab 1 karena sudah tercakup rapi di Tab 4 & Tab 2 */}
                                    {!isContractVerified ? (
                                        <DocumentList
                                            submission={submission}
                                            user={user}
                                            fieldValues={fieldValues}
                                            editingData={editingData}
                                            setEditingData={setEditingData}
                                            onRefresh={refresh}
                                            defaultCollapsed={submission.status === 'WAITING_PAYMENT'}
                                        />
                                    ) : (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2.5 text-emerald-950 font-bold">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Dokumen Kontrak telah disetujui. Seluruh rincian data pengajuan, produk, dan bahan dapat diakses pada Tab 2 &amp; Tab 4.</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('CONTRACT')}
                                                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition-all text-[11px]"
                                                >
                                                    Lihat Kontrak (Tab 2)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('SJPH')}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all text-[11px]"
                                                >
                                                    Lihat Laporan Data (Tab 4)
                                                </button>
                                            </div>
                                        </div>
                                    )}

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
                                    {!isContractVerified ? (
                                        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black text-gold-400">Langkah Berikutnya: Dokumen Kontrak</h4>
                                                <p className="text-xs text-gray-300 font-medium">
                                                    Periksa dan verifikasi Dokumen Kontrak Layanan pada Tab 2 sebelum melanjutkan ke pembayaran.
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
                                                <h4 className="text-sm font-black text-blue-300">Langkah Berikutnya: Dokumen SJPH &amp; Laporan</h4>
                                                <p className="text-xs text-gray-300 font-medium">
                                                    Seluruh data laporan pengajuan dan persetujuan SJPH dapat diperiksa pada Tab 4.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('SJPH')}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                                            >
                                                <span>Buka Dokumen SJPH &amp; Laporan</span>
                                                <ShieldCheck className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: DOKUMEN KONTRAK */}
                            {activeTab === 'CONTRACT' && (
                                <div className="space-y-6">
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
                                                    Sesuai alur, Anda wajib membaca dan memverifikasi Dokumen Kontrak Layanan Pendampingan di atas sebelum dapat melanjutkan ke tahap pembayaran.
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
                                </div>
                            )}

                            {/* TAB 3: PEMBAYARAN */}
                            {activeTab === 'PAYMENT' && (
                                <div className="space-y-6">
                                    {!isContractVerified && !isPaid ? (
                                        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-4">
                                            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto" />
                                            <div className="space-y-1.5 max-w-md mx-auto">
                                                <h4 className="text-sm sm:text-base font-black text-amber-900">Verifikasi Kontrak Layanan Terlebih Dahulu</h4>
                                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                                    Sesuai SOP, Anda wajib membaca dan memverifikasi Dokumen Kontrak Layanan pada Tab 2 sebelum dapat melakukan pembayaran tagihan.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('CONTRACT')}
                                                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-600/25 transition-all inline-flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <span>Buka Tab 2: Dokumen Kontrak</span>
                                                <FileCheck className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {isPaid && (
                                                <div className="p-4 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-black text-emerald-950">Pembayaran Telah Selesai (Lunas)</h4>
                                                                <p className="text-xs text-emerald-800 font-medium">
                                                                    Kewajiban pembayaran telah terpenuhi. Dokumen SJPH kini dapat diakses dan disetujui di Tab 4.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('SJPH')}
                                                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
                                                        >
                                                            <span>Buka Dokumen SJPH di Tab 4</span>
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Form Pembayaran DP / Tagihan Awal untuk Klien */}
                                            {(submission.status === 'WAITING_PAYMENT' || (submission.service_type !== 'SELF_DECLARE' && invoice && invoice.status !== 'PAID' && submission.status !== 'DRAFT' && submission.status !== 'WAITING_ASSIGNMENT')) && (
                                                <PaymentSection
                                                    submission={submission}
                                                    fieldValues={fieldValues}
                                                    onPaymentSuccess={refresh}
                                                    invoiceType={invoice?.type === 'PELUNASAN' ? 'PELUNASAN' : 'DP'}
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

                            {/* TAB 4: DOKUMEN SJPH & LAPORAN */}
                            {activeTab === 'SJPH' && (
                                <div className="space-y-6">
                                    <SubmissionReportPreview
                                        submission={submission}
                                        fieldValues={fieldValues}
                                    />

                                    {!isPaid ? (
                                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                                                <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                                            </div>
                                            <div className="space-y-1.5 max-w-md mx-auto">
                                                <h4 className="text-sm sm:text-base font-black text-slate-900">Dokumen SJPH Masih Terkunci</h4>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                    Setelah bayar, Anda dapat melihat dokumen SJPH. Harap selesaikan pembayaran tagihan terlebih dahulu pada Tab 3.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('PAYMENT')}
                                                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-brand-600/25 transition-all inline-flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <span>Buka Tab 3: Pembayaran</span>
                                                <CreditCard className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <SJPHTextPreview submission={submission} />

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
                                                            Silakan unduh dan pelajari Dokumen SJPH di atas. Aktifkan toggle persetujuan di bawah ini untuk menyetujui dan melanjutkan proses pengajuan ke tahap berikutnya.
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

                <Modal
                    isOpen={isConfirmOpen}
                    onClose={() => {
                        setIsConfirmOpen(false);
                        setContractConsent(false);
                    }}
                    title="Kirim Pengajuan"
                    maxWidth="md"
                >
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl text-brand-600 bg-brand-50 shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-800">Apakah Anda yakin ingin mengirimkan pengajuan ini untuk diverifikasi?</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Setelah dikirim, data pengajuan tidak dapat diubah kembali kecuali diminta revisi oleh petugas.
                                </p>
                            </div>
                        </div>

                        {submission.service_type === 'REGULER' && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                                        <FileText size={16} className="text-brand-600" /> Dokumen Perjanjian Layanan
                                    </span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                toast.loading('Mengunduh Kontrak...', { id: 'download-contract' });
                                                await submissionService.downloadContract(submission.id, 'pdf');
                                                toast.success('Kontrak berhasil diunduh', { id: 'download-contract' });
                                            } catch (e: any) {
                                                toast.error(e.message || 'Gagal mengunduh kontrak', { id: 'download-contract' });
                                            }
                                        }}
                                        className="text-[10px] font-black text-brand-600 underline hover:text-brand-700"
                                    >
                                        Unduh Draft Kontrak (.pdf)
                                    </button>
                                </div>

                                <label className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-brand-300 transition-all select-none">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox mt-0.5"
                                        checked={contractConsent}
                                        onChange={(e) => setContractConsent(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-slate-700 leading-relaxed">
                                        Saya telah membaca, memahami, dan menyetujui seluruh isi Perjanjian Layanan Pendampingan Sertifikasi Halal secara Elektronik.
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsConfirmOpen(false);
                                    setContractConsent(false);
                                }}
                                className="btn-secondary px-4 py-2.5 text-xs font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={async () => {
                                    setIsConfirmOpen(false);
                                    await handleAction('submit');
                                    setContractConsent(false);
                                }}
                                disabled={submission.service_type === 'REGULER' && !contractConsent}
                                className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-700"
                            >
                                Kirim Sekarang
                            </button>
                        </div>
                    </div>
                </Modal>
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
