import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Layers, AlertCircle, Save, Loader2, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils/format';
import type { Submission } from '../../../types';

interface CostItem {
    id?: number;
    name: string;
    category: string;
    unit_cost: number;
    multiplier?: number;
    quantity?: number;
    total: number;
    is_optional?: boolean;
}

interface ManageCostComponentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: Submission;
    onSaved: () => void;
}

export default function ManageCostComponentsModal({
    isOpen,
    onClose,
    submission,
    onSaved,
}: ManageCostComponentsModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [masterComponents, setMasterComponents] = useState<any[]>([]);
    const [items, setItems] = useState<CostItem[]>([]);

    // Master selection state
    const [selectedMasterId, setSelectedMasterId] = useState<string>('');
    const [masterQty, setMasterQty] = useState<number>(1);

    // Custom component state
    const [customName, setCustomName] = useState('');
    const [customCategory, setCustomCategory] = useState('LAYANAN');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [customQty, setCustomQty] = useState<number>(1);

    // Load initial breakdown and master components
    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        // 1. Fetch Master Components
        api.get('/billing-config/components')
            .then(res => {
                const comps = res.data || [];
                // Filter by service type
                const st = submission.service_type || 'REGULER';
                const filtered = comps.filter((c: any) => {
                    if (!c.is_active) return false;
                    const compSt = c.service_type || 'REGULER';
                    return compSt === 'BOTH' || compSt === 'ALL' || compSt === st;
                });
                setMasterComponents(filtered);
            })
            .catch(err => {
                console.error('Failed to load master components', err);
                toast.error('Gagal memuat master komponen');
            })
            .finally(() => setLoading(false));

        // 2. Parse current breakdown
        let initialItems: CostItem[] = [];
        if (submission.cost_detail?.cost_breakdown_data) {
            try {
                const raw = JSON.parse(submission.cost_detail.cost_breakdown_data);
                if (Array.isArray(raw)) {
                    initialItems = raw.map((it: any) => ({
                        id: it.id,
                        name: it.name || it.item_name || 'Komponen Biaya',
                        category: it.category || 'LAYANAN',
                        unit_cost: typeof it.unit_cost === 'number' ? it.unit_cost : (it.amount || it.unit_price || 0),
                        multiplier: it.multiplier || it.quantity || 1,
                        quantity: it.multiplier || it.quantity || 1,
                        total: typeof it.total === 'number' ? it.total : ((it.unit_cost || it.amount || 0) * (it.multiplier || 1)),
                        is_optional: it.is_optional ?? true
                    }));
                }
            } catch (e) {
                console.error('Error parsing existing breakdown', e);
            }
        }

        // Fallback if empty and has invoice amount
        if (initialItems.length === 0 && (submission.cost_detail?.total_amount || submission.invoice?.amount)) {
            const amount = submission.cost_detail?.total_amount || submission.invoice?.amount || 0;
            initialItems = [
                {
                    name: 'Biaya Pendampingan & Layanan Halal',
                    category: 'LAYANAN',
                    unit_cost: amount,
                    multiplier: 1,
                    quantity: 1,
                    total: amount,
                    is_optional: false
                }
            ];
        }

        setItems(initialItems);
    }, [isOpen, submission]);

    // Add Master Component
    const handleAddMaster = () => {
        if (!selectedMasterId) {
            toast.error('Pilih komponen master terlebih dahulu');
            return;
        }
        const master = masterComponents.find(c => c.id.toString() === selectedMasterId);
        if (!master) return;

        const qty = Math.max(1, masterQty);
        const unitCost = master.base_amount || 0;
        const total = unitCost * qty;

        const newItem: CostItem = {
            id: master.id,
            name: master.name + (qty > 1 ? ` (${qty} Qty)` : ''),
            category: (master.category || 'LAYANAN').toUpperCase(),
            unit_cost: unitCost,
            multiplier: qty,
            quantity: qty,
            total: total,
            is_optional: true
        };

        setItems(prev => [...prev, newItem]);
        setSelectedMasterId('');
        setMasterQty(1);
        toast.success(`Komponen "${master.name}" ditambahkan`);
    };

    // Add Custom Component
    const handleAddCustom = () => {
        if (!customName.trim()) {
            toast.error('Nama komponen tidak boleh kosong');
            return;
        }
        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Masukkan nominal harga yang valid');
            return;
        }

        const qty = Math.max(1, customQty);
        const total = amount * qty;

        const newItem: CostItem = {
            name: customName.trim() + (qty > 1 ? ` (${qty} Qty)` : ''),
            category: customCategory.toUpperCase(),
            unit_cost: amount,
            multiplier: qty,
            quantity: qty,
            total: total,
            is_optional: true
        };

        setItems(prev => [...prev, newItem]);
        setCustomName('');
        setCustomAmount('');
        setCustomQty(1);
        toast.success(`Komponen kustom "${customName}" ditambahkan`);
    };

    // Remove Item
    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Update Qty of existing item
    const handleUpdateQty = (index: number, newQty: number) => {
        const qty = Math.max(1, newQty);
        setItems(prev => {
            const updated = [...prev];
            const item = updated[index];
            updated[index] = {
                ...item,
                multiplier: qty,
                quantity: qty,
                total: item.unit_cost * qty
            };
            return updated;
        });
    };

    // Total Calculation
    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.total || 0), 0);
    }, [items]);

    // Termin calculations
    const dpPct = submission.cost_detail?.dp_percentage || submission.invoice?.percentage || 70;
    const dpAmount = Math.round(totalAmount * (dpPct / 100));
    const pelunasanAmount = totalAmount - dpAmount;

    // Save
    const handleSave = async () => {
        if (items.length === 0) {
            toast.error('Minimal harus ada 1 komponen biaya');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                total_amount: totalAmount,
                cost_breakdown_data: JSON.stringify(items),
            };

            await api.put(`/submissions/${submission.id}/client-info`, payload);
            toast.success('Komponen harga berhasil disimpan dan terhubung ke invoice!');
            onSaved();
            onClose();
        } catch (err: any) {
            console.error('Error saving pricing components', err);
            toast.error(err.response?.data?.error || 'Gagal menyimpan komponen harga');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-brand-50/50 via-white to-indigo-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-600 text-white rounded-2xl shadow-md shadow-brand-200">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                Kelola Komponen Harga & Pembayaran
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Pengajuan: <span className="font-bold text-gray-700">{submission.client?.business_name || submission.id}</span> ({submission.service_type})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Add Component Accordion / Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Pilih Dari Master Biaya */}
                        <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                                    Pilih dari Master Biaya
                                </label>
                                <span className="text-[10px] text-gray-400 font-bold">{masterComponents.length} Tersedia</span>
                            </div>
                            
                            <select
                                className="glass-input text-xs w-full py-2"
                                value={selectedMasterId}
                                onChange={e => setSelectedMasterId(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">-- Pilih Komponen Master --</option>
                                {masterComponents.map(comp => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.name} - ({formatCurrency(comp.base_amount)})
                                    </option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 flex-1">
                                    <span className="text-[10px] font-bold text-gray-400">Qty:</span>
                                    <button
                                        type="button"
                                        onClick={() => setMasterQty(Math.max(1, masterQty - 1))}
                                        className="w-5 h-5 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 rounded"
                                    >-</button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={masterQty}
                                        onChange={e => setMasterQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-10 text-center text-xs font-black text-brand-700 outline-none p-0 border-none bg-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMasterQty(masterQty + 1)}
                                        className="w-5 h-5 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 rounded"
                                    >+</button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddMaster}
                                    disabled={!selectedMasterId}
                                    className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tambah
                                </button>
                            </div>
                        </div>

                        {/* 2. Tambah Komponen Kustom */}
                        <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3">
                            <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                                + Tambah Komponen Kustom
                            </label>

                            <input
                                type="text"
                                placeholder="Nama Komponen Biaya..."
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                className="glass-input text-xs w-full py-1.5"
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Nominal (Rp)..."
                                        value={customAmount}
                                        onChange={e => setCustomAmount(e.target.value)}
                                        className="glass-input text-xs w-full py-1.5"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        className="glass-input text-xs w-full py-1.5"
                                    >
                                        <option value="LAYANAN">LAYANAN</option>
                                        <option value="OPERASIONAL">OPERASIONAL</option>
                                        <option value="ADMINISTRASI">ADMINISTRASI</option>
                                        <option value="LAINNYA">LAINNYA</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 flex-1">
                                    <span className="text-[10px] font-bold text-gray-400">Qty:</span>
                                    <button
                                        type="button"
                                        onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                                        className="w-5 h-5 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 rounded"
                                    >-</button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={customQty}
                                        onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-10 text-center text-xs font-black text-brand-700 outline-none p-0 border-none bg-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCustomQty(customQty + 1)}
                                        className="w-5 h-5 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 rounded"
                                    >+</button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddCustom}
                                    disabled={!customName.trim() || !customAmount}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tambah
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table of Active Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                                Daftar Komponen Biaya Saat Ini ({items.length})
                            </h4>
                            <span className="text-xs font-black text-brand-700">
                                Total: {formatCurrency(totalAmount)}
                            </span>
                        </div>

                        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                        <tr>
                                            <th className="py-2.5 px-3 w-10 text-center">No</th>
                                            <th className="py-2.5 px-3">Nama Komponen</th>
                                            <th className="py-2.5 px-3 text-center">Kategori</th>
                                            <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                                            <th className="py-2.5 px-3 text-center w-24">Qty</th>
                                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                                            <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-gray-700">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-2.5 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                                                <td className="py-2.5 px-3 font-semibold text-gray-800">
                                                    {item.name}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-gray-100 text-gray-600">
                                                        {item.category || 'LAYANAN'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-gray-600 font-medium">
                                                    {formatCurrency(item.unit_cost)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-1 py-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateQty(idx, (item.multiplier || 1) - 1)}
                                                            className="w-4 h-4 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 rounded"
                                                        >-</button>
                                                        <span className="w-6 text-center text-xs font-bold text-gray-800">
                                                            {item.multiplier || 1}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateQty(idx, (item.multiplier || 1) + 1)}
                                                            className="w-4 h-4 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 rounded"
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-black text-gray-900">
                                                    {formatCurrency(item.total)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus Komponen"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                                                    Belum ada komponen harga. Silakan tambahkan dari master biaya atau buat komponen kustom di atas.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Bar */}
                            <div className="p-3.5 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="space-y-0.5 text-[11px] text-gray-500">
                                    {submission.service_type === 'REGULER' && (
                                        <p>
                                            Skema Termin: <strong>DP {dpPct}% ({formatCurrency(dpAmount)})</strong> + <strong>Pelunasan {100 - dpPct}% ({formatCurrency(pelunasanAmount)})</strong>
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-bold uppercase text-[10px]">Total Kontrak Layanan (100%):</span>
                                    <span className="text-base font-black text-brand-700">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-800">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p>
                            Menyimpan komponen harga ini akan secara otomatis memperbarui rincian biaya pengajuan, draf invoice tagihan klien, nominal kontrak layanan, dan file PDF invoice yang dapat diunduh klien.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || items.length === 0}
                        className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-brand-100 hover:scale-[1.02] active:scale-95"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Simpan Komponen Harga</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
