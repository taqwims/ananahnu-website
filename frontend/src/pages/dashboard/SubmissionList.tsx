import { FileText, Plus } from 'lucide-react';
import { useSubmissionList } from '../../hooks/useSubmissionList';
import { SubmissionStats } from '../../components/dashboard/submission/list/SubmissionStats';
import { SubmissionFilters } from '../../components/dashboard/submission/list/SubmissionFilters';
import { SubmissionTable } from '../../components/dashboard/submission/list/SubmissionTable';
import { SubmissionCreateModal } from '../../components/dashboard/submission/list/SubmissionCreateModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function SubmissionList() {
    const {
        loading, search, setSearch, statusFilter, setStatusFilter,
        isGrouped, setIsGrouped, showCreateModal, setShowCreateModal,
        newSub, setNewSub, isVerified, sortKey, sortOrder,
        expandedGroups, setExpandedGroups, copiedId, confirmModal, setConfirmModal,
        handleDelete, handleSort, handleCopy, handleCreate,
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

                {user?.role !== 'DRAFTER' && user?.role !== 'QC_OFFICER' && user?.role !== 'AUDIT_MANAGER' && (
                    <div className="relative group">
                        <button
                            onClick={() => isVerified !== false && setShowCreateModal(true)}
                            disabled={isVerified === false}
                            className={`group relative px-6 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2 overflow-hidden transition-all ${
                                isVerified === false 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none' 
                                : 'bg-brand-900 text-white shadow-brand-100 hover:scale-[1.02]'
                            }`}
                        >
                            <Plus className="w-5 h-5" />
                            Buat Pengajuan Baru
                        </button>
                        {isVerified === false && (
                            <div className="absolute top-full mt-2 right-0 w-72 bg-red-600 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none font-bold text-center">
                                Akses Dibatasi: Akun harus terverifikasi DAN lulus pelatihan sebelum dapat membuat pengajuan.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SubmissionStats stats={stats} />

            <div className="space-y-6">
                <SubmissionFilters 
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
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
