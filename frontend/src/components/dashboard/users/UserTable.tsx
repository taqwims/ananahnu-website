import { Edit, Trash2, Key, Users, Loader2 } from 'lucide-react';
import type { User } from '../../../types';

interface UserTableProps {
    users: User[];
    loading: boolean;
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
    onResetPassword: (id: string) => void;
    page: number;
    total: number;
    setPage: (p: number | ((prev: number) => number)) => void;
}

export const UserTable = ({
    users,
    loading,
    onEdit,
    onDelete,
    onResetPassword,
    page,
    total,
    setPage
}: UserTableProps) => {
    const getRoleName = (role: any) => {
        if (typeof role === 'string') return role;
        return role?.name || '';
    };

    const getRoleBadgeColor = (role: any) => {
        const name = getRoleName(role);
        const colors: Record<string, string> = {
            DIRECTOR: 'bg-red-100 text-red-700',
            MANAGER: 'bg-orange-100 text-orange-700',
            HALAL_MANAGER: 'bg-blue-100 text-blue-700',
            HALAL_ADVISOR: 'bg-green-100 text-green-700',
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
        <div className="glass-panel overflow-hidden">
            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : users.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    Tidak ada user ditemukan
                </div>
            ) : (
                <>
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
                                            <button onClick={() => onEdit(user)}
                                                className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                                                title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onResetPassword(user.id)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                                title="Reset Password">
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onDelete(user.id)}
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
                </>
            )}
        </div>
    );
};
