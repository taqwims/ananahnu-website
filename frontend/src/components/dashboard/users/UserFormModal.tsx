import Modal from '../../ui/Modal';
import type { Role, User } from '../../../types';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    formData: any;
    setFormData: (v: any) => void;
    roles: Role[];
    coordinators: User[];
    onSave: () => Promise<void>;
    saving: boolean;
}

export const UserFormModal = ({
    isOpen,
    onClose,
    editingUser,
    formData,
    setFormData,
    roles,
    coordinators,
    onSave,
    saving
}: UserFormModalProps) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title={editingUser ? 'Edit User' : 'Tambah User Baru'}
            maxWidth="lg"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                        <input
                            className="glass-input w-full"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Nama lengkap"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                            className="glass-input w-full"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp</label>
                        <input
                            className="glass-input w-full"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0812xxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Domisili</label>
                        <input
                            className="glass-input w-full"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Kota, Provinsi"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                            Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}
                        </label>
                        <input
                            className="glass-input w-full"
                            type="text"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Kosongkan untuk generate otomatis'}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                        <select
                            className="glass-input w-full"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="">-- Pilih Role --</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    {formData.role === 'HALAL_ADVISOR' && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Halal Manager (Leader)</label>
                            <select
                                className="glass-input w-full"
                                value={formData.leader_id}
                                onChange={e => setFormData({ ...formData, leader_id: e.target.value })}
                            >
                                <option value="">-- Tanpa Leader --</option>
                                {coordinators.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Batal</button>
                    <button onClick={onSave}
                        disabled={saving || !formData.full_name || !formData.email || !formData.role}
                        className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 hover:bg-brand-700 disabled:opacity-30 transition-all">
                        {saving ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat User Baru')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
