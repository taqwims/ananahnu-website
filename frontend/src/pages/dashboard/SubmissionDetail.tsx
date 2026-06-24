import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import PaymentSection from '../../components/dashboard/PaymentSection';
import CostCalculator from '../../components/dashboard/CostCalculator';
import KalkulatorReguler from '../../components/dashboard/KalkulatorReguler';
import { useAuthStore } from '../../store/authStore';
import { useSubmission } from '../../hooks/useSubmission';
import { SubmissionHeader } from '../../components/dashboard/submission/SubmissionHeader';
import { ClientInfoSection } from '../../components/dashboard/submission/ClientInfoSection';
import { WorkflowActions } from '../../components/dashboard/submission/WorkflowActions';
import { DocumentList } from '../../components/dashboard/submission/DocumentList';
import { SubmissionCertificate } from '../../components/dashboard/submission/SubmissionCertificate';
import { SubmissionInvoice } from '../../components/dashboard/submission/SubmissionInvoice';
import { SubmissionHistory } from '../../components/dashboard/submission/SubmissionHistory';
import api from '../../services/api';
import type { BusinessType } from '../../types';
import ConfirmModal from '../../components/ui/ConfirmModal';

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

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
        </div>
    );
    
    if (!submission) return <div className="p-8 text-center text-gray-500">Submission not found</div>;

    const serviceType = submission.service_type || submission.client?.service_type || '';

    if (user?.role === 'CLIENT') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
                <SubmissionHeader submission={submission} user={user} />

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

                {submission.status === 'WAITING_PAYMENT' && (
                    <div className="glass-panel p-6 bg-amber-600 text-white rounded-2xl">
                        <h3 className="text-lg font-black tracking-tight mb-1">Menunggu Pembayaran</h3>
                        <p className="text-amber-100 text-sm leading-relaxed">
                            Pengajuan Anda telah disetujui untuk diteruskan ke proses berikutnya. Silakan selesaikan pembayaran tagihan di bawah ini untuk memulai audit.
                        </p>
                    </div>
                )}

                {['VERVAL_PENDAMPING', 'QC_OFFICER', 'DRAFTER', 'QC_REVIEW', 'SIDANG_FATWA'].includes(submission.status) && (
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
                />

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

                {/* Pelunasan 30% section — shown at SH_TERBIT for REGULER */}
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
                    <SubmissionInvoice invoice={invoice} />
                )}

                <ConfirmModal 
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    title="Kirim Pengajuan"
                    message="Apakah Anda yakin ingin mengirimkan pengajuan ini untuk diverifikasi?"
                    onConfirm={async () => {
                        setIsConfirmOpen(false);
                        await handleAction('submit');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            <SubmissionHeader submission={submission} user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                    <ClientInfoSection 
                        submission={submission} 
                        user={user} 
                        onUpdateClient={updateClient} 
                        onUpdateClientInfoAndPricing={updateClientInfoAndPricing}
                        onUpdateBusinessType={updateBusinessType}
                        businessTypes={businessTypes}
                        processing={processing} 
                    />

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

                    <div className="overflow-x-auto pb-4">
                        {serviceType === 'REGULER' ? (
                            <KalkulatorReguler 
                                submissionId={submission.id} 
                                readOnly={true} 
                                onSaved={refresh}
                                salesSchemeId={submission.sales_scheme_id || undefined}
                                dataSource={submission.data_source}
                            />
                        ) : serviceType !== 'SELF_DECLARE' ? (
                            <CostCalculator 
                                submissionId={submission.id} 
                                readOnly={user?.role !== 'FINANCE' && user?.role !== 'ADMIN_KEUANGAN' && user?.role !== 'ADMIN'} 
                                onSaved={refresh}
                                serviceType={serviceType}
                            />
                        ) : null}
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
                        <SubmissionInvoice invoice={invoice} />
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
                    />

                    <SubmissionHistory history={history} />
                </div>
            </div>
        </div>
    );
}
