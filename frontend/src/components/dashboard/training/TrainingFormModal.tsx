import { Loader2, Plus, X } from 'lucide-react';

interface TrainingFormModalProps {
    form: {
        title: string;
        description: string;
        start_date: string;
        end_date: string;
        location: string;
    };
    setForm: (v: any) => void;
    onSave: () => void;
    onClose: () => void;
    saving: boolean;
    isCoordinator: boolean;
}

export const TrainingFormModal = ({
    form,
    setForm,
    onSave,
    onClose,
    saving,
    isCoordinator
}: TrainingFormModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 relative border border-gray-100">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {isCoordinator ? 'Ajukan Pelatihan Baru' : 'Buat Pelatihan Baru'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Lengkapi detail agenda pelatihan di bawah ini.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Pelatihan</label>
                        <input 
                            className="glass-input w-full" 
                            placeholder="Contoh: Pelatihan Sertifikasi Halal Batch 12" 
                            value={form.title}
                            onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                        <textarea 
                            className="glass-input w-full h-24" 
                            placeholder="Tuliskan detail atau prasyarat pelatihan..." 
                            value={form.description}
                            onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Mulai</label>
                            <input 
                                type="date" 
                                className="glass-input w-full text-sm" 
                                value={form.start_date}
                                onChange={e => setForm((p: any) => ({ ...p, start_date: e.target.value }))} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Selesai</label>
                            <input 
                                type="date" 
                                className="glass-input w-full text-sm" 
                                value={form.end_date}
                                onChange={e => setForm((p: any) => ({ ...p, end_date: e.target.value }))} 
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lokasi Pelaksanaan</label>
                        <input 
                            className="glass-input w-full" 
                            placeholder="Alamat lengkap atau platform online..." 
                            value={form.location}
                            onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))} 
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onSave} 
                        disabled={saving || !form.title}
                        className="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isCoordinator ? 'Ajukan Sekarang' : 'Simpan Pelatihan'}
                    </button>
                </div>
            </div>
        </div>
    );
};
