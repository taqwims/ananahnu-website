import { useState, useEffect } from 'react';
import { Loader2, DollarSign, Save, Search, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah } from '../../utils/format';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export default function CoordinatorRates() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [rates, setRates] = useState<any[]>([]);
    const [coordinators, setCoordinators] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editableRates, setEditableRates] = useState<Record<string, number>>({});
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; userId: string; rate: number } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get all coordinators from the correct endpoint
            const userRes = await api.get('/admin/users/coordinators');
            const rateRes = await api.get('/billing-config/coordinator-rates');
            
            // userRes.data is directly the array of users in this new endpoint
            setCoordinators(userRes.data || []);
            setRates(rateRes.data || []);

            // Initialize editable rates
            const initialRates: Record<string, number> = {};
            (userRes.data || []).forEach((u: any) => {
                const rate = (rateRes.data || []).find((r: any) => r.coordinator_id === u.id);
                initialRates[u.id] = rate ? rate.rate_per_sh : 100000;
            });
            setEditableRates(initialRates);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getRateForUser = (userId: string) => {
        const rate = rates.find(r => r.coordinator_id === userId);
        return rate ? rate.rate_per_sh : 100000; // Default
    };

    const handleUpdateRate = async (userId: string, newRate: number) => {
        setSaving(userId);
        try {
            await api.post('/billing-config/coordinator-rates', {
                coordinator_id: userId,
                rate_per_sh: newRate
            });
            // Refresh rates
            const rateRes = await api.get('/billing-config/coordinator-rates');
            setRates(rateRes.data || []);
            toast.success("Tarif berhasil diperbarui");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Gagal menyimpan tarif");
        } finally {
            setSaving(null);
        }
    };

    const filteredCoordinators = coordinators.filter(c => 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600 w-10 h-10" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tarif Sertifikasi Halal Manager</h1>
                    <p className="text-gray-500 text-sm">Tentukan nominal tagihan per SH yang diterbitkan untuk setiap halal_manager.</p>
                </div>
            </div>

            <div className="glass-panel p-4 flex items-center gap-3">
                <Search className="text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Cari halal_manager..." 
                    className="bg-transparent border-none outline-none text-sm w-full"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoordinators.map((coord) => {
                    const currentRate = getRateForUser(coord.id);
                    return (
                        <div key={coord.id} className="glass-panel p-6 border border-gray-100 hover:border-brand-200 transition-all group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 truncate w-40">{coord.full_name}</h3>
                                    <p className="text-xs text-gray-500">{coord.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Tarif per SH Terbit</label>
                                    <span className="text-xs font-bold text-brand-600">{formatRupiah(currentRate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</div>
                                        <input 
                                            type="number" 
                                            className="glass-input pl-10" 
                                            value={editableRates[coord.id] || 0}
                                            onChange={e => setEditableRates({
                                                ...editableRates,
                                                [coord.id]: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setConfirmModal({ 
                                            isOpen: true, 
                                            userId: coord.id, 
                                            rate: editableRates[coord.id] || 0 
                                        })}
                                        disabled={saving === coord.id}
                                        className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50"
                                    >
                                        {saving === coord.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 italic mt-2">
                                    *Tagihan otomatis dibuat saat pengajuan tim mencapai SH_TERBIT.
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCoordinators.length === 0 && (
                <div className="text-center py-24 glass-panel">
                    <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400">Tidak ada halal_manager yang ditemukan.</p>
                </div>
            )}

            {confirmModal && (
                <ConfirmModal 
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(null)}
                    onConfirm={() => handleUpdateRate(confirmModal.userId, confirmModal.rate)}
                    title="Simpan Perubahan Tarif"
                    message={`Apakah Anda yakin ingin mengubah tarif untuk halal_manager ini menjadi ${formatRupiah(confirmModal.rate)} per SH Terbit?`}
                    confirmText="Ya, Simpan"
                    variant="info"
                />
            )}
        </div>
    );
}
