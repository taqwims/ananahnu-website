import { GraduationCap, Plus, Users, Clock, Info, AlertCircle, Calendar } from 'lucide-react';
import { useTrainingAdmin } from '../../hooks/useTrainingAdmin';
import { TrainingList } from '../../components/dashboard/training/TrainingList';
import { ParticipantManagement } from '../../components/dashboard/training/ParticipantManagement';
import { TrainingFormModal } from '../../components/dashboard/training/TrainingFormModal';

export default function TrainingAdmin() {
    const {
        trainings, loading, showForm, setShowForm,
        showEditModal, setShowEditModal,
        openEditModal, editForm, setEditForm, handleUpdateTraining,
        selectedTraining,
        participants, loadingParts,
        saving,
        broadcasting, broadcastSchedule,
        form, setForm,
        newUserID, setNewUserID,
        allUsers,
        isCoordinator,
        canGraduate,
        canManageParticipants,
        handleCreate, handleDelete, addParticipant, removeParticipant, updateStatus,
        selectTraining, handleApprove, handleReject,
        resendSchedule
    } = useTrainingAdmin();

    const formatDateTime = (d?: string) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        Manajemen Pelatihan
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola jadwal pelatihan dan sertifikasi peserta secara terpusat</p>
                </div>
                <button 
                    onClick={() => setShowForm(true)} 
                    className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> {isCoordinator ? 'Ajukan Pelatihan' : 'Buat Pelatihan'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar: Training List */}
                <div className="lg:col-span-1">
                    <TrainingList 
                        trainings={trainings}
                        loading={loading}
                        selectedId={selectedTraining?.id}
                        onSelect={selectTraining}
                        onDelete={handleDelete}
                        isCoordinator={isCoordinator}
                    />
                </div>

                {/* Right Panel: Details & Participants */}
                <div className="lg:col-span-2">
                    {!selectedTraining ? (
                        <div className="glass-panel p-20 text-center text-gray-400 border-2 border-dashed border-gray-100 flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-500">Pilih Pelatihan</h3>
                            <p className="text-sm mt-1 max-w-xs">Silakan pilih salah satu jadwal pelatihan di samping untuk melihat detail dan daftar peserta.</p>
                        </div>
                    ) : (
                        <div className="glass-panel p-8 space-y-8 min-h-[600px] flex flex-col">
                            {/* Training Detail Header */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-50 pb-6 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTraining.title}</h2>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                            selectedTraining.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                            selectedTraining.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                            {selectedTraining.status === 'APPROVED' ? 'Disetujui' : selectedTraining.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{selectedTraining.description}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>
                                                Diajukan oleh: <strong className="font-black">{selectedTraining.proposer?.full_name || 'Admin Pelatihan'}</strong>
                                                {selectedTraining.created_at && (
                                                    <span className="font-normal text-brand-600/80 ml-1.5">
                                                        ({formatDateTime(selectedTraining.created_at)})
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {selectedTraining.status === 'APPROVED' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                                                <span>
                                                    Disetujui oleh: <strong className="font-black">{selectedTraining.approver?.full_name || 'Admin'}</strong>
                                                    {selectedTraining.approved_at && (
                                                        <span className="font-normal text-emerald-600/80 ml-1.5">
                                                            ({formatDateTime(selectedTraining.approved_at)})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {selectedTraining.status === 'REJECTED' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-100">
                                                <span>
                                                    Ditolak oleh: <strong className="font-black">{selectedTraining.rejector?.full_name || 'Admin'}</strong>
                                                    {selectedTraining.rejected_at && (
                                                        <span className="font-normal text-rose-600/80 ml-1.5">
                                                            ({formatDateTime(selectedTraining.rejected_at)})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    {/* Opsi Ubah Tanggal / Jadwal Pelatihan */}
                                    <button 
                                        onClick={() => openEditModal(selectedTraining)}
                                        className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                                        <span>Ubah Jadwal</span>
                                    </button>

                                    {selectedTraining.status === 'PENDING' && !isCoordinator && (
                                        <>
                                            <button 
                                                onClick={() => handleReject(selectedTraining.id)}
                                                className="px-4 py-2 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Tolak
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(selectedTraining.id)}
                                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-100"
                                            >
                                                Setujui
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status Specific Alerts */}
                            {selectedTraining.status === 'REJECTED' && (
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-black text-red-800 uppercase tracking-widest">Pengajuan Pelatihan Ditolak</p>
                                        <p className="text-xs text-red-600 mt-1 font-medium leading-relaxed">
                                            Alasan Penolakan: <span className="font-bold italic">"{selectedTraining.rejected_reason || 'Tidak ada alasan spesifik'}"</span>
                                        </p>
                                        {selectedTraining.rejected_at && (
                                            <p className="text-[11px] text-red-500 mt-1 font-medium">
                                                Waktu penolakan: {formatDateTime(selectedTraining.rejected_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedTraining.status === 'PENDING' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div className="text-xs text-amber-800 font-medium">
                                        Pelatihan ini sedang berstatus <strong>PENDING</strong> dan menunggu tinjauan/persetujuan dari Admin Pelatihan.
                                    </div>
                                </div>
                            )}

                            {/* Content based on status */}
                            <div className="flex-1">
                                {selectedTraining.status === 'APPROVED' ? (
                                    <ParticipantManagement 
                                        participants={participants}
                                        loading={loadingParts}
                                        allUsers={allUsers}
                                        newUserId={newUserID}
                                        setNewUserId={setNewUserID}
                                        onAdd={addParticipant}
                                        onUpdateStatus={updateStatus}
                                        onResendSchedule={resendSchedule}
                                        onBroadcastSchedule={() => broadcastSchedule(selectedTraining.id)}
                                        broadcasting={broadcasting}
                                        onRemoveParticipant={removeParticipant}
                                        canGraduate={canGraduate}
                                        canManageParticipants={canManageParticipants}
                                        isExpired={selectedTraining.end_date ? new Date(selectedTraining.end_date) < new Date() : false}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                        <Clock className="w-16 h-16 text-gray-200 mb-4" />
                                        <h4 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Menunggu Persetujuan</h4>
                                        <p className="text-xs text-gray-400 mt-2 max-w-sm">
                                            Hanya pelatihan dengan status <span className="font-black text-green-600">APPROVED</span> yang dapat dikelola pesertanya.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah Pelatihan */}
            {showForm && (
                <TrainingFormModal 
                    form={form}
                    setForm={setForm}
                    onSave={handleCreate}
                    onClose={() => setShowForm(false)}
                    saving={saving}
                    isCoordinator={isCoordinator}
                />
            )}

            {/* Modal Ubah Jadwal Pelatihan */}
            {showEditModal && (
                <TrainingFormModal 
                    form={editForm}
                    setForm={setEditForm}
                    onSave={handleUpdateTraining}
                    onClose={() => setShowEditModal(false)}
                    saving={saving}
                    isCoordinator={isCoordinator}
                    isEdit={true}
                />
            )}
        </div>
    );
}
