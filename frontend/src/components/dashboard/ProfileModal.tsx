import { useState } from 'react';
import { User, Key, Save, X } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const user = useAuthStore(state => state.user);
    const updateUser = useAuthStore(state => state.updateUser);
    
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        password: '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        setError('');
        try {
            await api.put('/profile', {
                full_name: formData.full_name,
                password: formData.password || undefined,
            });
            
            updateUser({ full_name: formData.full_name });
            setMessage('Profil berhasil diperbarui');
            setFormData(prev => ({ ...prev, password: '' })); // clear password field
            
            setTimeout(() => {
                setMessage('');
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-600" />
                        Pengaturan Profil
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            className="glass-input w-full bg-gray-50 text-gray-500 cursor-not-allowed"
                            type="text"
                            value={user.email}
                            disabled
                        />
                        <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                        <input
                            className="glass-input w-full"
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Password Baru <span className="text-gray-400 font-normal">(Opsional)</span>
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className="glass-input w-full pl-9"
                                type="password"
                                placeholder="Kosongkan jika tidak diubah"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !formData.full_name}
                            className="glass-button bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
