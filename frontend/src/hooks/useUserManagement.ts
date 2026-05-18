import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import type { User, Role } from '../types';
import toast from 'react-hot-toast';

export const useUserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [coordinators, setCoordinators] = useState<User[]>([]);

    // Form/Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [formData, setFormData] = useState({ 
        full_name: '', 
        email: '', 
        role: '', 
        leader_id: '', 
        password: '', 
        phone: '', 
        address: '' 
    });

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

    const fetchCoordinators = useCallback(async () => {
        try {
            const res = await userService.getUsers({ limit: 100 });
            setCoordinators((res.data || []).filter((u: any) => {
                const rName = typeof u.role === 'string' ? u.role : u.role?.name;
                return rName === 'HALAL_MANAGER';
            }));
        } catch (err) {
            console.error("Failed to fetch coordinators", err);
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (search) params.search = search;
            if (roleFilter) params.role_id = roleFilter;

            const [usersRes, rolesRes] = await Promise.all([
                userService.getUsers(params),
                userService.getRoles(),
            ]);
            setUsers(usersRes.data || []);
            setTotal(usersRes.total || 0);
            setRoles(rolesRes || []);
            
            if (coordinators.length === 0) fetchCoordinators();
        } catch (err) {
            toast.error("Gagal memuat data user");
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, coordinators.length, fetchCoordinators]);

    useEffect(() => {
        const timer = setTimeout(() => loadData(), 300);
        return () => clearTimeout(timer);
    }, [loadData]);

    const openCreate = () => {
        setEditingUser(null);
        setFormData({ full_name: '', email: '', role: '', leader_id: '', password: '', phone: '', address: '' });
        setGeneratedPassword('');
        setShowModal(true);
    };

    const getRoleName = (role: any) => {
        if (typeof role === 'string') return role;
        return role?.name || '';
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
            const payload = {
                full_name: formData.full_name,
                email: formData.email,
                role: formData.role,
                leader_id: formData.leader_id || null,
                password: formData.password || undefined,
                phone: formData.phone,
                address: formData.address,
            };

            if (editingUser) {
                await userService.updateUser(editingUser.id, payload);
                setShowModal(false);
                toast.success('User berhasil diperbarui');
            } else {
                const res = await userService.createUser(payload);
                if (!formData.password) {
                    setGeneratedPassword(res.password);
                } else {
                    setShowModal(false);
                }
                toast.success('User berhasil dibuat');
            }
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus User',
            message: 'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
            onConfirm: async () => {
                try {
                    await userService.deleteUser(id);
                    toast.success('User berhasil dihapus');
                    loadData();
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Gagal menghapus');
                }
            }
        });
    };

    const handleResetPassword = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reset Password',
            message: 'Reset password user ini?',
            onConfirm: async () => {
                try {
                    const res = await userService.resetPassword(id);
                    setEditingUser({ id } as any); 
                    setGeneratedPassword(res.password);
                    setShowModal(true);
                    toast.success('Password berhasil direset');
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Gagal reset password');
                }
            }
        });
    };

    return {
        users, roles, total, loading, page, setPage, search, setSearch, roleFilter, setRoleFilter,
        coordinators, showModal, setShowModal, editingUser, saving, generatedPassword, setGeneratedPassword,
        formData, setFormData, confirmModal, setConfirmModal,
        openCreate, openEdit, handleSave, handleDelete, handleResetPassword
    };
};
