import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Key, Loader2, Search, Filter, Shield } from 'lucide-react';
import api from '../../services/api';
import type { User, Role } from '../../types';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ full_name: '', email: '', role: '', leader_id: '', password: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // Load coordinators for leader dropdown
    const [coordinators, setCoordinators] = useState<User[]>([]);

    const fetchCoordinators = async () => {
        try {
            // Get roles first to find KOORDINATOR role_id if needed, 
            // but the backend handler filter uses role_id. 
            // Actually, we can just search for all users with role KOORDINATOR.
            const res = await api.get('/admin/users', { params: { limit: 100 } });
            // Since role in admin/users is an object, we check u.role.name
            setCoordinators((res.data.data || []).filter((u: any) => {
                const rName = typeof u.role === 'string' ? u.role : u.role?.name;
                return rName === 'KOORDINATOR';
            }));
        } catch (err) {
            console.error("Failed to fetch coordinators", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit: 20
            };
            if (search) params.search = search;
            if (roleFilter) params.role_id = roleFilter;

            const [usersRes, rolesRes] = await Promise.all([
                api.get('/admin/users', { params }),
                api.get('/admin/roles'),
            ]);
            setUsers(usersRes.data.data || []);
            setTotal(usersRes.data.total || 0);
            setRoles(rolesRes.data || []);
            
            if (coordinators.length === 0) {
                fetchCoordinators();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => loadData(), 300);
        return () => clearTimeout(timer);
    }, [page, search, roleFilter]);

    const openCreate = () => {
        setEditingUser(null);
        setFormData({ full_name: '', email: '', role: '', leader_id: '', password: '', phone: '', address: '' });
        setGeneratedPassword('');
        setShowModal(true);
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            email: user.email,
            role: getRoleName(user.role),
            leader_id: user.leader_id || '',
            password: '',
            phone: user.phone || '',
            address: user.address || '',
        });
        setGeneratedPassword('');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingUser) {
                await api.put(`/admin/users/${editingUser.id}`, {
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    leader_id: formData.leader_id || null,
                    password: formData.password || undefined,
                    phone: formData.phone,
                    address: formData.address,
                });
                setShowModal(false);
            } else {
                const res = await api.post('/admin/users', {
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    leader_id: formData.leader_id || null,
                    password: formData.password || undefined,
                    phone: formData.phone,
                    address: formData.address,
                });
                if (!formData.password) {
                    setGeneratedPassword(res.data.password);
                } else {
                    setShowModal(false);
                }
            }
            loadData();
            if (editingUser || formData.password) {
                setShowModal(false);
                toast.success(editingUser ? 'User berhasil diperbarui' : 'User berhasil dibuat');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus User',
            message: 'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/users/${id}`);
                    toast.success('User berhasil dihapus');
                    loadData();
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Gagal menghapus');
                }
            }
        });
    };

    const handleResetPassword = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reset Password',
            message: 'Reset password user ini?',
            onConfirm: async () => {
                try {
                    const res = await api.put(`/admin/users/${id}/reset-password`);
                    // We keep the modal open to show the password, or use a toast? 
                    // Better to show in a modal since it's sensitive and needs copying.
                    setEditingUser({ id } as any); // temporary trigger for "editing" state to show the result
                    setGeneratedPassword(res.data.password);
                    setShowModal(true);
                    toast.success('Password berhasil direset');
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Gagal reset password');
                }
            }
        });
    };

    const getRoleName = (role: any) => {
        if (typeof role === 'string') return role;
        return role?.name || '';
    };

    const getRoleBadgeColor = (role: any) => {
        const name = getRoleName(role);
        const colors: Record<string, string> = {
            DIRECTOR: 'bg-red-100 text-red-700',
            MANAGER: 'bg-orange-100 text-orange-700',
            KOORDINATOR: 'bg-blue-100 text-blue-700',
            HALAL_KONSULTAN: 'bg-green-100 text-green-700',
            QC_OFFICER: 'bg-purple-100 text-purple-700',
            DRAFTER: 'bg-indigo-100 text-indigo-700',
            ADMIN_PELATIHAN: 'bg-teal-100 text-teal-700',
            ADMIN_KEUANGAN: 'bg-yellow-100 text-yellow-700',
            FINANCE: 'bg-yellow-100 text-yellow-700',
            CLIENT: 'bg-gray-100 text-gray-700',
        };
        return colors[name] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-600" />
                        Manajemen User
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola akun pengguna sistem</p>
                </div>
                <button onClick={openCreate} className="glass-button flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah User
                </button>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="glass-input pl-9 w-full"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select className="glass-input w-auto text-sm" value={roleFilter}
                        onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                        <option value="">Semua Role</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        Tidak ada user ditemukan
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-white/50">
                            <tr className="text-left text-xs text-gray-500 uppercase">
                                <th className="p-4">Nama</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">WhatsApp</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Leader</th>
                                <th className="p-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-white/30 transition">
                                    <td className="p-4 font-medium text-gray-800">{user.full_name}</td>
                                    <td className="p-4 text-gray-600">{user.email}</td>
                                    <td className="p-4 text-gray-600 text-xs font-medium">{user.phone || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            {getRoleName(user.role).replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {user.leader?.full_name || '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEdit(user)}
                                                className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                                                title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleResetPassword(user.id)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                                title="Reset Password">
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(user.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {total > 20 && (
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                        <span>Halaman {page} dari {Math.ceil(total / 20)}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 rounded-lg bg-white/50 hover:bg-white/80 disabled:opacity-30">←</button>
                            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 rounded-lg bg-white/50 hover:bg-white/80 disabled:opacity-30">→</button>
                        </div>
                    </div>
                )}
            </div>

            <Modal 
                isOpen={showModal} 
                onClose={() => { setShowModal(false); setGeneratedPassword(''); }}
                title={generatedPassword ? 'Informasi Password' : (editingUser ? 'Edit User' : 'Tambah User Baru')}
                maxWidth="lg"
            >
                {generatedPassword ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                            <p className="text-sm text-emerald-800 font-bold mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5" /> 
                                {editingUser?.email ? 'Password Berhasil Direset' : 'User Berhasil Dibuat'}
                            </p>
                            <p className="text-xs text-emerald-600 mb-1">Password sementara:</p>
                            <div className="font-mono text-2xl font-black text-emerald-900 bg-white border-2 border-emerald-100 px-4 py-3 rounded-xl select-all flex items-center justify-between">
                                {generatedPassword}
                                <Key className="w-5 h-5 opacity-20" />
                            </div>
                            <p className="text-[10px] text-emerald-500 mt-4 leading-relaxed font-bold uppercase tracking-widest">
                                SALIN PASSWORD INI. PASSWORD TIDAK AKAN DITAMPILKAN LAGI DEMI KEAMANAN.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => { setShowModal(false); setGeneratedPassword(''); }}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                                Saya Sudah Menyalin
                            </button>
                        </div>
                    </div>
                ) : (
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
                            {formData.role === 'HALAL_KONSULTAN' && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Koordinator (Leader)</label>
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
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Batal</button>
                            <button onClick={handleSave}
                                disabled={saving || !formData.full_name || !formData.email || !formData.role}
                                className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-100 hover:bg-brand-700 disabled:opacity-30 transition-all">
                                {saving ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat User Baru')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

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
