import { FileText, Plus, Trash2 } from 'lucide-react';
import { useSubmissionList } from '../../hooks/useSubmissionList';
import { SubmissionStats } from '../../components/dashboard/submission/list/SubmissionStats';
import { SubmissionFilters } from '../../components/dashboard/submission/list/SubmissionFilters';
import { SubmissionTable } from '../../components/dashboard/submission/list/SubmissionTable';
import { SubmissionCreateModal } from '../../components/dashboard/submission/list/SubmissionCreateModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function SubmissionList() {
    const {
        loading, search, setSearch, statusFilter, setStatusFilter,
        serviceTypeFilter, setServiceTypeFilter, businessTypeFilter, setBusinessTypeFilter,
        isGrouped, setIsGrouped, showCreateModal, setShowCreateModal,
        newSub, setNewSub, sortKey, sortOrder,
        expandedGroups, setExpandedGroups, copiedId, confirmModal, setConfirmModal,
        handleDelete, handleSort, handleCopy, handleCreate, handlePurgeAll,
        stats, filteredData, groupedData, user, navigate, STATUS_ORDER
    } = useSubmissionList();

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-brand-600 rounded-2xl shadow-lg shadow-brand-200">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        Daftar Pengajuan
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Kelola dan pantau status sertifikasi halal Anda</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {(user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                        <button
                            onClick={handlePurgeAll}
                            className="px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
                            title="Bersihkan semua data pengajuan untuk keperluan mode dev/testing di VPS"
                        >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            Bersihkan Semua Pengajuan (Dev)
                        </button>
                    )}

                    {(user?.role === 'CLIENT' || user?.role === 'DIRECTOR' || user?.role === 'MARKETING' || user?.role === 'BUSINESS_DEVELOPMENT') && (
                        <div className="relative group">
                            <button
                                onClick={() => navigate('/dashboard/pengajuan')}
                                className="group relative px-6 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2 overflow-hidden transition-all bg-brand-900 text-white shadow-brand-100 hover:scale-[1.02] active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Buat Pengajuan Baru
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <SubmissionStats stats={stats} />

            <div className="space-y-6">
                <SubmissionFilters 
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    serviceTypeFilter={serviceTypeFilter}
                    setServiceTypeFilter={setServiceTypeFilter}
                    businessTypeFilter={businessTypeFilter}
                    setBusinessTypeFilter={setBusinessTypeFilter}
                    isGrouped={isGrouped}
                    setIsGrouped={setIsGrouped}
                    statusOrder={STATUS_ORDER}
                />

                <SubmissionTable 
                    data={isGrouped ? groupedData : [{ coordinator: 'Semua Pengajuan', submissions: filteredData }]}
                    isGrouped={isGrouped}
                    loading={loading}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onNavigate={(id) => navigate(`/dashboard/submissions/${id}`)}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    handleSort={handleSort}
                    expandedGroups={expandedGroups}
                    setExpandedGroups={setExpandedGroups}
                    copiedId={copiedId}
                    userRole={user?.role}
                    userId={user?.id}
                />
            </div>

            <SubmissionCreateModal 
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                formData={newSub}
                setFormData={setNewSub}
                onCreate={handleCreate}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}
