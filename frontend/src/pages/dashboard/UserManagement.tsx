import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Key, Loader2, Search, Filter, Shield } from 'lucide-react';
import api from '../../services/api';
import type { User, Role } from '../../types';

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
    const [formData, setFormData] = useState({ full_name: '', email: '', role: '', leader_id: '' });
    const [saving, setSaving] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');

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
        setFormData({ full_name: '', email: '', role: '', leader_id: '' });
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
                });
            } else {
                const res = await api.post('/admin/users', {
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    leader_id: formData.leader_id || null,
                });
                setGeneratedPassword(res.data.password);
            }
            if (!generatedPassword && !editingUser) {
                // Keep modal open to show password for new user
            } else {
                setShowModal(false);
            }
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus user ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menghapus');
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!confirm('Reset password user ini?')) return;
        try {
            const res = await api.put(`/admin/users/${id}/reset-password`);
            alert(`Password baru: ${res.data.password}\n\nSalin password ini, tidak akan ditampilkan lagi.`);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal reset password');
        }
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">
                            {editingUser ? 'Edit User' : 'Tambah User Baru'}
                        </h3>

                        {generatedPassword ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-800 font-medium mb-2">✅ User berhasil dibuat!</p>
                                    <p className="text-sm text-green-700">Password sementara:</p>
                                    <p className="font-mono text-lg font-bold text-green-900 bg-green-100 px-3 py-2 rounded mt-1 select-all">
                                        {generatedPassword}
                                    </p>
                                    <p className="text-xs text-green-600 mt-2">Salin password ini. Tidak akan ditampilkan lagi.</p>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={() => { setShowModal(false); setGeneratedPassword(''); }}
                                        className="glass-button">Tutup</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                                    <input
                                        className="glass-input w-full"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Nama lengkap"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        className="glass-input w-full"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Role</label>
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
                                        <label className="block text-sm font-medium mb-1">Koordinator (Leader)</label>
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

                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setShowModal(false)}
                                        className="px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-600">Batal</button>
                                    <button onClick={handleSave}
                                        disabled={saving || !formData.full_name || !formData.email || !formData.role}
                                        className="glass-button bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">
                                        {saving ? 'Menyimpan...' : editingUser ? 'Simpan' : 'Buat User'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
