import { GraduationCap, Plus, Users, Clock, Info, AlertCircle } from 'lucide-react';
import { useTrainingAdmin } from '../../hooks/useTrainingAdmin';
import { TrainingList } from '../../components/dashboard/training/TrainingList';
import { ParticipantManagement } from '../../components/dashboard/training/ParticipantManagement';
import { TrainingFormModal } from '../../components/dashboard/training/TrainingFormModal';

export default function TrainingAdmin() {
    const {
        trainings, loading, showForm, setShowForm,
        selectedTraining,
        participants, loadingParts,
        saving,
        form, setForm,
        newUserID, setNewUserID,
        allUsers,
        isCoordinator,
        handleCreate, handleDelete, addParticipant, updateStatus,
        selectTraining, handleApprove, handleReject
    } = useTrainingAdmin();

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
                            <div className="flex items-start justify-between border-b border-gray-50 pb-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTraining.title}</h2>
                                    <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{selectedTraining.description}</p>
                                    {selectedTraining.proposer && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-lg w-fit mt-3 border border-brand-100">
                                            <Info className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Diajukan oleh: {selectedTraining.proposer.full_name}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {selectedTraining.status === 'PENDING' && !isCoordinator && (
                                    <div className="flex gap-2 shrink-0">
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
                                    </div>
                                )}
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

            {/* Modal Form */}
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
        </div>
    );
}
