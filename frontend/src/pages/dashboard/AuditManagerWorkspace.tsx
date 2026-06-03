import { useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuditManagerWorkspace } from '../../hooks/useAuditManagerWorkspace';
import { QCTaskSidebar } from '../../components/dashboard/qc/QCTaskSidebar';
import { QCWorkspaceHeader } from '../../components/dashboard/qc/QCWorkspaceHeader';
import { QCReferencePanel } from '../../components/dashboard/qc/QCReferencePanel';
import { QCReviewPanel } from '../../components/dashboard/qc/QCReviewPanel';
import { RejectModal } from '../../components/dashboard/qc/RejectModal';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditCalendar } from '../../components/dashboard/audit/AuditCalendar';

export default function AuditManagerWorkspace() {
    const {
        submissions,
        filteredSubmissions,
        activeSubId,
        setActiveSubId,
        activeSubmission,
        fieldValues,
        loading,
        processing,
        search,
        setSearch,
        isFocusMode,
        setIsFocusMode,
        drafters,
        selectedDrafter,
        setSelectedDrafter,
        consultants,
        selectedConsultant,
        setSelectedConsultant,
        showRejectModal,
        setShowRejectModal,
        rejectNote,
        setRejectNote,
        isEditingClient,
        setIsEditingClient,
        isEditingDocs,
        setIsEditingDocs,
        clientForm,
        setClientForm,
        auditDate,
        setAuditDate,
        isEditingAudit,
        setIsEditingAudit,
        handleDistribute,
        handleAction,
        handleUpdateClient,
        handleUpdateDocs,
        handleUpdateAudit,
        handleIssueSH,
        updateFieldValue
    } = useAuditManagerWorkspace(new URLSearchParams(window.location.search).get('id'));

    // Handle Escape key to exit focus mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFocusMode) {
                setIsFocusMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocusMode, setIsFocusMode]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menyiapkan Ruang Kerja Audit Manager...</p>
            </div>
        );
    }

    return (
        <div className={`flex gap-6 overflow-hidden transition-all duration-500 ${isFocusMode ? 'fixed inset-0 z-[100] bg-gray-50 p-6' : 'h-[calc(100vh-140px)]'}`}>
            <QCTaskSidebar
                submissions={filteredSubmissions}
                activeSubId={activeSubId}
                setActiveSubId={setActiveSubId}
                search={search}
                setSearch={setSearch}
                isFocusMode={isFocusMode}
                setIsFocusMode={setIsFocusMode}
                title="Tugas Audit"
                showAuditTabs={true}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <AnimatePresence mode="wait">
                    {!activeSubId ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col overflow-hidden min-h-0"
                        >
                            <AuditCalendar 
                                submissions={submissions} 
                                onSelectSubmission={setActiveSubId} 
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeSubId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col overflow-hidden gap-6"
                        >
                            <div className="flex">
                                <button
                                    onClick={() => setActiveSubId(null)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-gray-750 hover:text-brand-600 rounded-xl border border-white/80 shadow-sm transition-all text-xs font-black uppercase tracking-wider"
                                >
                                    <ArrowLeft className="w-4 h-4 text-brand-600" />
                                    Kembali ke Kalender Audit
                                </button>
                            </div>

                            <QCWorkspaceHeader
                                submission={activeSubmission}
                                setActiveSubId={setActiveSubId}
                                drafters={drafters}
                                selectedDrafter={selectedDrafter}
                                setSelectedDrafter={setSelectedDrafter}
                                onDistribute={handleDistribute}
                                onReject={() => setShowRejectModal(true)}
                                onApprove={() => handleAction('approve')}
                                processing={processing}
                            />

                            <div className="flex-1 flex gap-6 overflow-hidden">
                                <QCReferencePanel
                                    submission={activeSubmission}
                                    isEditingClient={isEditingClient}
                                    setIsEditingClient={setIsEditingClient}
                                    clientForm={clientForm}
                                    setClientForm={setClientForm}
                                    onUpdateClient={handleUpdateClient}
                                    isEditingDocs={isEditingDocs}
                                    setIsEditingDocs={setIsEditingDocs}
                                    fieldValues={fieldValues}
                                    onUpdateValue={updateFieldValue}
                                    onUpdateDocs={handleUpdateDocs}
                                    processing={processing}
                                />
                                <QCReviewPanel
                                    submission={activeSubmission}
                                    auditDate={auditDate}
                                    setAuditDate={setAuditDate}
                                    isEditingAudit={isEditingAudit}
                                    setIsEditingAudit={setIsEditingAudit}
                                    onUpdateAudit={handleUpdateAudit}
                                    onIssueSH={handleIssueSH}
                                    processing={processing}
                                    canEditAuditDate={true}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <RejectModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                submission={activeSubmission}
                rejectNote={rejectNote}
                setRejectNote={setRejectNote}
                consultants={consultants}
                selectedConsultant={selectedConsultant}
                setSelectedConsultant={setSelectedConsultant}
                onReject={(action) => {
                    handleAction(action);
                    setShowRejectModal(false);
                    return Promise.resolve();
                }}
                processing={processing}
            />
        </div>
    );
}
