import { useState, useEffect } from 'react';
import { Plus, Trash, Loader2, Award } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface RoleSchemePanelProps {
    schemes: any[];
}

export const RoleSchemePanel = ({ schemes }: RoleSchemePanelProps) => {
    const [mappings, setMappings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [roleName, setRoleName] = useState('');
    const [salesSchemeId, setSalesSchemeId] = useState('');

    const availableRoles = [
        'HALAL_ADVISOR',
        'MARKETING',
        'TELEMARKETING',
        'CLIENT',
        'FINANCE',
        'DIRECTOR',
        'MANAGER',
        'QC_OFFICER',
        'DRAFTER',
        'AUDIT_MANAGER',
        'HALAL_MANAGER',
        'HALAL_DIRECTOR',
        'ADMIN_PELATIHAN',
        'ADMIN_KEUANGAN',
        'BUSINESS_DEVELOPMENT',
        'DRAFT_MANAGER',
        'TELEMARKETER',
        'VERIFIKATOR'
    ];

    const fetchMappings = async () => {
        try {
            const res = await api.get('/billing-config/role-scheme-mappings');
            setMappings(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat pemetaan role-skema");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName || !salesSchemeId) {
            toast.error("Role dan Skema Penjualan harus dipilih");
            return;
        }

        // Check if mapping already exists
        const exists = mappings.some(m => m.role_name === roleName);
        if (exists) {
            toast.error(`Pemetaan untuk role ${roleName} sudah ada. Silakan hapus pemetaan lama terlebih dahulu.`);
            return;
        }

        setSaving(true);
        try {
            await api.post('/billing-config/role-scheme-mappings', {
                role_name: roleName,
                sales_scheme_id: parseInt(salesSchemeId)
            });
            toast.success("Pemetaan berhasil ditambahkan!");
            setRoleName('');
            setSalesSchemeId('');
            fetchMappings();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || "Gagal menyimpan pemetaan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus pemetaan ini?")) return;
        try {
            await api.delete(`/billing-config/role-scheme-mappings/${id}`);
            toast.success("Pemetaan berhasil dihapus");
            fetchMappings();
        } catch (err) {
            console.error(err);
            toast.error("Gagal menghapus pemetaan");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-brand-600 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-600" />
                    Tambah Pemetaan Role-Skema
                </h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nama Role</label>
                        <select
                            className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                            value={roleName}
                            onChange={e => setRoleName(e.target.value)}
                        >
                            <option value="">Pilih Role...</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Default Skema Penjualan</label>
                        <select
                            className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                            value={salesSchemeId}
                            onChange={e => setSalesSchemeId(e.target.value)}
                        >
                            <option value="">Pilih Skema...</option>
                            {schemes.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-brand-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Simpan Pemetaan
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800">Daftar Pemetaan Role-Skema</h3>
                {mappings.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400 font-medium">
                        Belum ada pemetaan yang dikonfigurasi. Pengajuan baru akan default ke Direct Sale.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                                    <th className="py-3 px-2">Nama Role</th>
                                    <th className="py-3 px-2">Skema Penjualan</th>
                                    <th className="py-3 px-2 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mappings.map(m => (
                                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-2 font-bold text-gray-700">{m.role_name}</td>
                                        <td className="py-3.5 px-2 font-semibold text-brand-700">
                                            <span className="bg-brand-50 px-2.5 py-1 rounded-lg">
                                                {m.sales_scheme?.name || `Skema ID ${m.sales_scheme_id}`}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-2 text-right">
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
