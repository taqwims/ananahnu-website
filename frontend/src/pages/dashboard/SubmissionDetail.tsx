import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Send, FileText, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'DATA' | 'SJPH'>('DATA');
    const [sjphConsent, setSjphConsent] = useState(false);

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

                {/* 2 Main Tabs Navigation */}
                <div className="flex border-b border-gray-200 gap-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('DATA')}
                        className={`pb-3 px-4 font-black text-sm transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'DATA'
                                ? 'text-brand-600 border-brand-600'
                                : 'text-gray-400 border-transparent hover:text-gray-700'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        1. Data Pelaku Usaha & Usaha
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('SJPH')}
                        className={`pb-3 px-4 font-black text-sm transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'SJPH'
                                ? 'text-brand-600 border-brand-600'
                                : 'text-gray-400 border-transparent hover:text-gray-700'
                        }`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        2. Dokumen Kontrak & SJPH
                        {submission.status === 'REVIEW_SJPH_CLIENT' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        )}
                        {submission.sjph_approved_at && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Disetujui</span>
                        )}
                    </button>
                </div>

                {activeTab === 'DATA' ? (
                    /* TAB 1: DATA PELAKU USAHA & USAHA */
                    <div className="space-y-6">
                        {/* Instruction / Status Alert */}
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
                                        className="px-6 py-4 bg-gold-400 hover:bg-gold-500 text-brand-900 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 shrink-0 self-start sm:self-center disabled:opacity-50"
                                    >
                                        {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                        Kirim Pengajuan
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
                                    Pengajuan Anda telah disetujui untuk diteruskan ke proses berikutnya. Silakan selesaikan pembayaran tagihan di bawah ini untuk memulai audit.
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
                                    Selamat! Sertifikat Halal Anda telah berhasil diterbitkan. Silakan unduh sertifikat halal Anda melalui tombol unduh di bagian bawah halaman.
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
                        />

                        <DocumentList 
                            submission={submission}
                            user={user}
                            fieldValues={fieldValues}
                            editingData={editingData}
                            setEditingData={setEditingData}
                            onRefresh={refresh}
                            defaultCollapsed={submission.status === 'WAITING_PAYMENT'}
                        />

                        <SubmissionReportPreview 
                            submission={submission}
                            fieldValues={fieldValues}
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
                            <SubmissionInvoice invoice={invoice} submissionId={submission.id} />
                        )}
                    </div>
                ) : (
                    /* TAB 2: DOKUMEN KONTRAK & SJPH */
                    <div className="space-y-6">
                        <ContractTextPreview submission={submission} />

                        {/* Catatan Pendamping jika ada */}
                        {submission.sjph_notes && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                <p className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Catatan Pendamping Halal:</p>
                                <p className="text-xs text-amber-800 font-medium italic">&ldquo;{submission.sjph_notes}&rdquo;</p>
                            </div>
                        )}

                        {/* Consent & Approval Section */}
                        {submission.status === 'REVIEW_SJPH_CLIENT' ? (
                            <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500 shadow-xl space-y-5">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        Persetujuan Dokumen Kontrak & SJPH oleh Pelaku Usaha
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        Silakan pelajari dokumen Kontrak Layanan, rincian biaya, lampiran foto & dokumen SJPH di atas. Jika seluruh data dan ketentuan sudah sesuai, beri tanda centang dan klik tombol persetujuan di bawah ini untuk meneruskan berkas ke Manager Operasional.
                                    </p>
                                </div>

                                <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-gray-200 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 hover:border-emerald-300 transition-all select-none">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 w-4 h-4 text-emerald-600 accent-emerald-600 rounded"
                                        checked={sjphConsent}
                                        onChange={(e) => setSjphConsent(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-gray-800 leading-relaxed">
                                        Saya selaku pelaku usaha telah membaca, memeriksa, dan menyetujui seluruh isi Dokumen Kontrak Perjanjian Layanan Pendampingan & Dokumen SJPH ini untuk diteruskan ke Manager Operasional.
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        await approveSJPH();
                                    }}
                                    disabled={!sjphConsent || processing}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                >
                                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-gold-400" />}
                                    Setujui & Lanjutkan ke Manager Operasional
                                </button>
                            </div>
                        ) : submission.sjph_approved_at ? (
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                                <h4 className="text-sm font-black flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    Dokumen Kontrak & SJPH Telah Disetujui
                                </h4>
                                <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                                    Dokumen ini telah Anda setujui pada {new Date(submission.sjph_approved_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}. Berkas saat ini sedang dalam proses di Manager Operasional / Ruang Kerja QC.
                                </p>
                            </div>
                        ) : submission.status === 'VERVAL_PENDAMPING' ? (
                            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                    Sedang Diverifikasi oleh Pendamping Halal
                                </h4>
                                <p className="text-xs leading-relaxed font-medium text-amber-800">
                                    Dokumen Kontrak Layanan & Lampiran SJPH di atas sedang diverifikasi oleh Pendamping Halal Anda (<strong>{submission.consultant?.full_name || submission.client?.facilitator?.full_name || 'Pendamping Halal'}</strong>). Tombol persetujuan akan aktif di tab ini setelah pendamping menyelesaikan verifikasi berkas.
                                </p>
                            </div>
                        ) : submission.status === 'WAITING_ASSIGNMENT' ? (
                            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 space-y-2">
                                <h4 className="text-sm font-black uppercase tracking-wider">Menunggu Penentuan Pendamping</h4>
                                <p className="text-xs leading-relaxed font-medium text-purple-800">
                                    Pengajuan Anda sedang dalam antrian penentuan Pendamping Halal oleh tim Marketing.
                                </p>
                            </div>
                        ) : null}
                    </div>
                )}

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
                        <div className={`p-4 border rounded-2xl flex items-start gap-4 shadow-sm ${
                            submission.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                        }`}>
                            <div className={`p-2 rounded-xl ${
                                submission.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${
                                        submission.status === 'REJECTED' ? 'text-red-900' : 'text-amber-900'
                                    }`}>
                                        Catatan {submission.status === 'REJECTED' ? 'Penolakan' : 'Revisi'}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                        submission.status === 'REJECTED' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                                    }`}>
                                        Perlu Perhatian
                                    </span>
                                </div>
                                <p className={`text-sm font-medium leading-relaxed ${
                                    submission.status === 'REJECTED' ? 'text-red-800' : 'text-amber-800'
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
                        <SubmissionInvoice invoice={invoice} submissionId={submission.id} />
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
