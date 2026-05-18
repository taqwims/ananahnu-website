import { useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useVerifikatorWorkspace } from '../../hooks/useVerifikatorWorkspace';
import { QCTaskSidebar } from '../../components/dashboard/qc/QCTaskSidebar';
import { QCWorkspaceHeader } from '../../components/dashboard/qc/QCWorkspaceHeader';
import { QCReferencePanel } from '../../components/dashboard/qc/QCReferencePanel';
import { QCReviewPanel } from '../../components/dashboard/qc/QCReviewPanel';
import { RejectModal } from '../../components/dashboard/qc/RejectModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerifikatorWorkspace() {
    const {
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
    } = useVerifikatorWorkspace(new URLSearchParams(window.location.search).get('id'));

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
                <p className="text-gray-500 font-medium">Menyiapkan Ruang Kerja Verifikator...</p>
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
            />

            <div className="flex-1 flex flex-col min-w-0">
                <AnimatePresence mode="wait">
                    {!activeSubId ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 glass-panel flex flex-col items-center justify-center text-center p-12 border-white/40 shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-brand-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-brand-600 animate-pulse">
                                <ShieldCheck className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Antrian Verifikator Reguler</h2>
                            <p className="text-gray-500 max-w-sm font-medium">
                                Pilih pengajuan reguler dari daftar di sebelah kiri untuk melakukan verifikasi dokumen dan audit.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeSubId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col overflow-hidden gap-6"
                        >
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
