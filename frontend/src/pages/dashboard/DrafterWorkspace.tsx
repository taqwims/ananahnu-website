import { useEffect } from 'react';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
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
        handleAction,
        handleUpdateClient,
        handleUpdateDocs,
        handleUpdateAuditResult,
        updateFieldValue
    } = useDrafterWorkspace(new URLSearchParams(window.location.search).get('id'));

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

                            {activeSubmission?.reject_note && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm"
                                >
                                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Catatan Revisi / Return</h4>
                                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-lg text-[9px] font-black uppercase">Perlu Perbaikan</span>
                                        </div>
                                        <p className="text-sm text-amber-800 font-medium leading-relaxed">
                                            {activeSubmission?.reject_note}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

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
                                        onAction={handleAction}
                                        onSaveAuditResult={handleUpdateAuditResult}
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
