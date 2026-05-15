import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
        </div>
    );
    
    if (!submission) return <div className="p-8 text-center text-gray-500">Submission not found</div>;

    const serviceType = submission.service_type || submission.client?.service_type || '';

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            <SubmissionHeader submission={submission} user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                    <ClientInfoSection 
                        submission={submission} 
                        user={user} 
                        onUpdateClient={updateClient} 
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
                                readOnly={!(
                                    ['ADMIN', 'FINANCE', 'ADMIN_KEUANGAN', 'DIRECTOR'].includes(user?.role || '') ||
                                    (['HALAL_KONSULTAN', 'MARKETING', 'KOORDINATOR'].includes(user?.role || '') && (submission.status === 'DRAFT' || submission.status === 'REVISION'))
                                )} 
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
                        <SubmissionCertificate shUrl={submission.sh_url} />
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
