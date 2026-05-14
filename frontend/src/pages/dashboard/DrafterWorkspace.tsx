import { Loader2, ShieldCheck } from 'lucide-react';
import { useDrafterWorkspace } from '../../hooks/useDrafterWorkspace';
import { TaskSidebar } from '../../components/dashboard/drafter/TaskSidebar';
import { WorkspaceHeader } from '../../components/dashboard/drafter/WorkspaceHeader';
import { ClientInfoPanel } from '../../components/dashboard/drafter/ClientInfoPanel';
import { DocumentEditor } from '../../components/dashboard/drafter/DocumentEditor';
import { WorkflowPanel } from '../../components/dashboard/drafter/WorkflowPanel';
import { motion, AnimatePresence } from 'framer-motion';

export default function DrafterWorkspace() {
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
        isEditingClient,
        setIsEditingClient,
        isEditingDocs,
        setIsEditingDocs,
        clientForm,
        setClientForm,
        auditDate,
        setAuditDate,
        handleAction,
        handleUpdateClient,
        handleUpdateDocs,
        updateFieldValue
    } = useDrafterWorkspace(new URLSearchParams(window.location.search).get('id'));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menyiapkan Ruang Kerja...</p>
            </div>
        );
    }

    return (
        <div className={`flex gap-6 overflow-hidden transition-all duration-500 ${isFocusMode ? 'fixed inset-0 z-[100] bg-gray-50 p-6' : 'h-[calc(100vh-140px)]'}`}>
            <TaskSidebar
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
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Pilih Tugas untuk Memulai</h2>
                            <p className="text-gray-500 max-w-sm font-medium">
                                Gunakan panel di sebelah kiri untuk memilih pengajuan yang ingin Anda proses atau review.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeSubId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col overflow-hidden gap-6"
                        >
                            <WorkspaceHeader 
                                submission={activeSubmission} 
                                setActiveSubId={setActiveSubId} 
                            />

                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
                                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                                    <ClientInfoPanel
                                        submission={activeSubmission}
                                        isEditing={isEditingClient}
                                        setIsEditing={setIsEditingClient}
                                        clientForm={clientForm}
                                        setClientForm={setClientForm}
                                        onSave={handleUpdateClient}
                                        processing={processing}
                                    />
                                    <WorkflowPanel
                                        submission={activeSubmission}
                                        auditDate={auditDate}
                                        setAuditDate={setAuditDate}
                                        onAction={handleAction}
                                        processing={processing}
                                    />
                                </div>

                                <div className="lg:col-span-8 flex flex-col overflow-hidden">
                                    <DocumentEditor
                                        fieldValues={fieldValues}
                                        isEditing={isEditingDocs}
                                        setIsEditing={setIsEditingDocs}
                                        onUpdateValue={updateFieldValue}
                                        onSave={handleUpdateDocs}
                                        processing={processing}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
