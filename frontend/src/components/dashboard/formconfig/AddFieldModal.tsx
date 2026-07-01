import { Loader2, Save, X } from 'lucide-react';

const INPUT_TYPES = ['FILE_UPLOAD', 'LINK', 'TEXT', 'DATE', 'REPEATER'] as const;

interface AddFieldModalProps {
    newField: any;
    setNewField: (v: any) => void;
    businessTypes: {id: number; name: string}[];
    onSave: () => void;
    onClose: () => void;
    saving: boolean;
}

export const AddFieldModal = ({
    newField,
    setNewField,
    businessTypes,
    onSave,
    onClose,
    saving
}: AddFieldModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 relative border border-gray-100">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Tambah Field Baru</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Definisikan atribut form baru untuk divalidasi sistem.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Label Tampilan</label>
                        <input 
                            className="glass-input w-full" 
                            placeholder="Contoh: KTP Pemilik" 
                            value={newField.field_label}
                            onChange={e => setNewField((p: any) => ({ ...p, field_label: e.target.value }))} 
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Key (Snake Case)</label>
                        <input 
                            className="glass-input w-full font-mono" 
                            placeholder="Contoh: ktp_url" 
                            value={newField.field_key}
                            onChange={e => setNewField((p: any) => ({ ...p, field_key: e.target.value }))} 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Input</label>
                        <select 
                            className="glass-input w-full" 
                            value={newField.input_type}
                            onChange={e => setNewField((p: any) => ({ ...p, input_type: e.target.value }))}
                        >
                            {INPUT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deskripsi Tambahan</label>
                        <input 
                            className="glass-input w-full" 
                            placeholder="Petunjuk pengisian untuk user..." 
                            value={newField.description}
                            onChange={e => setNewField((p: any) => ({ ...p, description: e.target.value }))} 
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                        <input 
                            type="checkbox" 
                            id="isRequired"
                            checked={newField.is_required}
                            onChange={e => setNewField((p: any) => ({ ...p, is_required: e.target.checked }))}
                            className="w-5 h-5 rounded-lg border-gray-200 text-brand-600 cursor-pointer" 
                        />
                        <label htmlFor="isRequired" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer">Wajib diisi (Required)</label>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terapkan Hanya Pada Bidang:</label>
                        <select 
                            className="glass-input w-full text-xs font-bold" 
                            value={newField.business_type_id}
                            onChange={e => setNewField((p: any) => ({ ...p, business_type_id: e.target.value }))}
                        >
                            <option value="">Semua Bidang (Global)</option>
                            {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Step (Wizard)</label>
                            <input 
                                type="number"
                                min={1}
                                className="glass-input w-full" 
                                value={newField.step_number}
                                onChange={e => setNewField((p: any) => ({ ...p, step_number: parseInt(e.target.value) || 1 }))} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Step (Wizard)</label>
                            <input 
                                className="glass-input w-full" 
                                placeholder="Contoh: Dokumen Legalitas"
                                value={newField.step_name}
                                onChange={e => setNewField((p: any) => ({ ...p, step_name: e.target.value }))} 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onSave} 
                        disabled={saving || !newField.field_key || !newField.field_label}
                        className="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Simpan Field
                    </button>
                </div>
            </div>
        </div>
    );
};
