import { useState, useEffect } from 'react';
import {
    Plus,
    Save,
    RefreshCw,
    Edit3,
    Trash2,
    X
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { operationalService, type DailyQuota } from '../../../services/operationalService';

export function QuotaSettingsTab() {
    const [loading, setLoading] = useState(false);
    const [quotaDaily, setQuotaDaily] = useState([
        { id: '1', region: 'DKI Jakarta', total: 3000, prevUsed: 1942, today: 32, currentTotal: 1974, remaining: 1026, updated: '30 Jul 2026, 09:45' },
        { id: '2', region: 'Jawa Barat', total: 3500, prevUsed: 2318, today: 41, currentTotal: 2359, remaining: 1141, updated: '30 Jul 2026, 09:38' },
        { id: '3', region: 'Jawa Tengah', total: 2500, prevUsed: 1705, today: 28, currentTotal: 1733, remaining: 767, updated: '30 Jul 2026, 09:25' },
        { id: '4', region: 'Jawa Timur', total: 2000, prevUsed: 1384, today: 19, currentTotal: 1403, remaining: 597, updated: '30 Jul 2026, 09:12' },
        { id: '5', region: 'Banten', total: 1500, prevUsed: 765, today: 6, currentTotal: 771, remaining: 729, updated: '30 Jul 2026, 08:56' },
    ]);
    const [quotaNotes, setQuotaNotes] = useState('');
    const [provincesList, setProvincesList] = useState<{ id: number; name: string }[]>([]);
    const [showQuotaModal, setShowQuotaModal] = useState(false);
    const [quotaModalForm, setQuotaModalForm] = useState<{ id?: string; region: string; total: number; prevUsed: number; today: number; isEdit: boolean }>({
        region: '', total: 1000, prevUsed: 0, today: 0, isEdit: false
    });

    const quotaTrendData = [
        { date: '24 Jul', usage: 98 },
        { date: '25 Jul', usage: 112 },
        { date: '26 Jul', usage: 105 },
        { date: '27 Jul', usage: 121 },
        { date: '28 Jul', usage: 108 },
        { date: '29 Jul', usage: 118 },
        { date: '30 Jul', usage: 126 },
    ];

    const totalAllocated = quotaDaily.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
    const totalPrevUsed = quotaDaily.reduce((acc, q) => acc + (Number(q.prevUsed) || 0), 0);
    const totalToday = quotaDaily.reduce((acc, q) => acc + (Number(q.today) || 0), 0);
    const totalUsed = totalPrevUsed + totalToday;
    const totalRemaining = Math.max(0, totalAllocated - totalUsed);
    const pctUsed = totalAllocated > 0 ? ((totalUsed / totalAllocated) * 100).toFixed(1) : '0.0';

    const quotaDonutData = [
        { name: 'Total Terpakai', value: totalUsed, color: '#10b981' },
        { name: 'Sisa Kuota', value: totalRemaining, color: '#f59e0b' },
    ];

    const loadQuotaData = async () => {
        try {
            setLoading(true);
            const [quotas, sysSettings, provRes] = await Promise.all([
                operationalService.getDailyQuota(),
                operationalService.getSystemSettings(),
                operationalService.getProvinces().catch(() => [])
            ]);

            if (Array.isArray(provRes) && provRes.length > 0) {
                setProvincesList(provRes);
            }

            const masterLimit = parseInt(sysSettings?.facilitation_quota_limit || '0', 10);
            const masterUsed = parseInt(sysSettings?.facilitation_quota_used || '0', 10);

            if (Array.isArray(quotas) && quotas.length > 0) {
                const regionalTotalAlloc = quotas.reduce((sum: number, q: any) => sum + (Number(q.allocated) || 0), 0);
                if (masterLimit > 0 && regionalTotalAlloc === masterLimit) {
                    const mappedQuota = quotas.map((q: DailyQuota, idx: number) => ({
                        id: q.id || String(idx + 1),
                        region: q.region,
                        total: q.allocated,
                        prevUsed: q.prev_used,
                        today: q.used_today,
                        currentTotal: q.prev_used + q.used_today,
                        remaining: Math.max(0, q.allocated - (q.prev_used + q.used_today)),
                        updated: 'Hari ini',
                    }));
                    setQuotaDaily(mappedQuota);
                } else if (masterLimit > 0) {
                    const currentSum = regionalTotalAlloc || 1;
                    const mappedQuota = quotas.map((q: DailyQuota, idx: number) => {
                        const ratio = (Number(q.allocated) || 1) / currentSum;
                        const newAlloc = Math.max(1, Math.round(masterLimit * ratio));
                        const newPrevUsed = Math.round(masterUsed * ratio);
                        return {
                            id: q.id || String(idx + 1),
                            region: q.region,
                            total: newAlloc,
                            prevUsed: newPrevUsed,
                            today: 0,
                            currentTotal: newPrevUsed,
                            remaining: Math.max(0, newAlloc - newPrevUsed),
                            updated: 'Sinkron Master Biaya',
                        };
                    });
                    setQuotaDaily(mappedQuota);
                }
            }
        } catch (err) {
            console.error('Failed to load quota data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotaData();
    }, []);

    const handleSaveQuota = async () => {
        try {
            const payload: DailyQuota[] = quotaDaily.map(q => ({
                date: new Date().toISOString().slice(0, 10),
                region: q.region,
                allocated: q.total,
                used_today: q.today,
                prev_used: q.prevUsed,
                notes: quotaNotes,
            }));
            await operationalService.saveDailyQuota(payload);
            await operationalService.updateSystemSetting('facilitation_quota_limit', String(totalAllocated));
            await operationalService.updateSystemSetting('facilitation_quota_used', String(totalUsed));
            toast.success('Penggunaan kuota SEHATI harian disimpan & disinkronkan dengan Master Biaya!');
        } catch (err) {
            toast.error('Gagal menyimpan kuota harian');
        }
    };

    const handleSyncWithMasterBiaya = async () => {
        try {
            setLoading(true);
            const sysSettings = await operationalService.getSystemSettings();
            const masterLimit = parseInt(sysSettings?.facilitation_quota_limit || '0', 10);
            const masterUsed = parseInt(sysSettings?.facilitation_quota_used || '0', 10);

            if (masterLimit <= 0) {
                toast.error('Master Biaya belum menetapkan batas kuota fasilitasi.');
                return;
            }

            const currentSum = totalAllocated || 1;
            const synced = quotaDaily.map(q => {
                const ratio = q.total / currentSum;
                const newTotal = Math.round(masterLimit * ratio);
                const newPrevUsed = Math.round(masterUsed * ratio);
                return {
                    ...q,
                    total: newTotal,
                    prevUsed: newPrevUsed,
                    today: 0,
                    currentTotal: newPrevUsed,
                    remaining: Math.max(0, newTotal - newPrevUsed),
                    updated: 'Baru saja',
                };
            });
            setQuotaDaily(synced);
            toast.success(`Berhasil menyinkronkan ${masterLimit.toLocaleString('id-ID')} kuota dari Master Biaya.`);
        } catch (err) {
            toast.error('Gagal menyinkronkan data kuota');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddQuota = () => {
        setQuotaModalForm({ region: provincesList[0]?.name || 'DKI Jakarta', total: 1000, prevUsed: 0, today: 0, isEdit: false });
        setShowQuotaModal(true);
    };

    const handleOpenEditQuota = (item: any) => {
        setQuotaModalForm({ id: item.id, region: item.region, total: item.total, prevUsed: item.prevUsed, today: item.today, isEdit: true });
        setShowQuotaModal(true);
    };

    const handleDeleteQuota = (id: string, region: string) => {
        setQuotaDaily(prev => prev.filter(q => q.id !== id));
        toast.success(`Alokasi kuota wilayah ${region} berhasil dihapus.`);
    };

    const handleSaveQuotaModal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quotaModalForm.region) {
            toast.error('Pilih wilayah provinsi');
            return;
        }
        if (quotaModalForm.isEdit && quotaModalForm.id) {
            setQuotaDaily(prev => prev.map(q => {
                if (q.id === quotaModalForm.id) {
                    const currentTotal = quotaModalForm.prevUsed + quotaModalForm.today;
                    return {
                        ...q,
                        region: quotaModalForm.region,
                        total: quotaModalForm.total,
                        prevUsed: quotaModalForm.prevUsed,
                        today: quotaModalForm.today,
                        currentTotal,
                        remaining: Math.max(0, quotaModalForm.total - currentTotal),
                        updated: 'Hari ini'
                    };
                }
                return q;
            }));
            toast.success(`Alokasi kuota wilayah ${quotaModalForm.region} berhasil diperbarui.`);
        } else {
            const currentTotal = quotaModalForm.prevUsed + quotaModalForm.today;
            setQuotaDaily(prev => [
                ...prev,
                {
                    id: String(prev.length + 1),
                    region: quotaModalForm.region,
                    total: quotaModalForm.total,
                    prevUsed: quotaModalForm.prevUsed,
                    today: quotaModalForm.today,
                    currentTotal,
                    remaining: Math.max(0, quotaModalForm.total - currentTotal),
                    updated: 'Hari ini'
                }
            ]);
            toast.success(`Alokasi kuota wilayah ${quotaModalForm.region} berhasil ditambahkan.`);
        }
        setShowQuotaModal(false);
    };

    return (
        <div className="space-y-6">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <p className="text-[11px] font-bold text-gray-500">Total Kuota Alokasi</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{totalAllocated.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Kuota SEHATI Aktif</p>
                </div>
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <p className="text-[11px] font-bold text-gray-500">Total Terpakai</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{totalUsed.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">{pctUsed}% dari total alokasi</p>
                </div>
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <p className="text-[11px] font-bold text-gray-500">Penggunaan Hari Ini</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">+{totalToday.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-blue-600 font-bold mt-1">Pengajuan terverifikasi</p>
                </div>
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <p className="text-[11px] font-bold text-gray-500">Sisa Kuota Tersedia</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{totalRemaining.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">Siap dialokasikan</p>
                </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Tren Pemakaian Kuota Harian</h3>
                            <p className="text-xs text-gray-500 font-medium">Grafik konsumsi kuota fasilitasi SEHATI 7 hari terakhir.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">7 Hari Terakhir</span>
                    </div>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quotaTrendData}>
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="usage" name="Kuota Terpakai" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-gray-900">Distribusi Kuota Nasional</h3>
                        <p className="text-xs text-gray-500 font-medium">Rasio terpakai vs sisa alokasi kuota.</p>
                    </div>
                    <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={quotaDonutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4}>
                                    {quotaDonutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around text-xs border-t border-gray-100 pt-3">
                        <div className="text-center">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
                            <span className="text-gray-500">Terpakai: </span>
                            <span className="font-bold text-gray-900">{totalUsed.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="text-center">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span>
                            <span className="text-gray-500">Sisa: </span>
                            <span className="font-bold text-gray-900">{totalRemaining.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Alokasi Kuota per Wilayah */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black text-gray-900">Alokasi &amp; Penggunaan Kuota per Wilayah</h3>
                        <p className="text-xs text-gray-500 font-medium">Kelola kuota fasilitasi SEHATI yang tersinkronisasi dengan Master Biaya.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSyncWithMasterBiaya}
                            disabled={loading}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sinkron Master Biaya
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenAddQuota}
                            className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> Tambah Wilayah
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-3">Wilayah / Provinsi</th>
                                <th className="py-3 px-3">Total Alokasi</th>
                                <th className="py-3 px-3">Sebelum Hari Ini</th>
                                <th className="py-3 px-3">Hari Ini</th>
                                <th className="py-3 px-3">Total Terpakai</th>
                                <th className="py-3 px-3">Sisa Kuota</th>
                                <th className="py-3 px-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {quotaDaily.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3 font-bold text-gray-900">{item.region}</td>
                                    <td className="py-3 px-3 font-medium text-gray-700">{item.total.toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-3 text-gray-600">{item.prevUsed.toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-3 font-bold text-blue-600">+{item.today}</td>
                                    <td className="py-3 px-3 font-bold text-emerald-600">{item.currentTotal.toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-3 font-bold text-amber-600">{item.remaining.toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleOpenEditQuota(item)}
                                                className="p-1 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                title="Edit Kuota"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuota(item.id, item.region)}
                                                className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                title="Hapus Wilayah"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <input
                        type="text"
                        placeholder="Catatan perubahan kuota (opsional)..."
                        value={quotaNotes}
                        onChange={(e) => setQuotaNotes(e.target.value)}
                        className="w-full sm:max-w-md p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleSaveQuota}
                        disabled={loading}
                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <Save className="w-4 h-4" /> Simpan Perubahan Kuota
                    </button>
                </div>
            </div>

            {/* Modal Tambah / Edit Kuota */}
            {showQuotaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-gray-900">
                                {quotaModalForm.isEdit ? 'Edit Alokasi Kuota Wilayah' : 'Tambah Kuota Wilayah Baru'}
                            </h3>
                            <button onClick={() => setShowQuotaModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuotaModal} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Wilayah / Provinsi *</label>
                                <select
                                    value={quotaModalForm.region}
                                    onChange={(e) => setQuotaModalForm({ ...quotaModalForm, region: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                >
                                    {provincesList.length > 0 ? (
                                        provincesList.map(p => (
                                            <option key={p.id} value={p.name}>{p.name}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="DKI Jakarta">DKI Jakarta</option>
                                            <option value="Jawa Barat">Jawa Barat</option>
                                            <option value="Jawa Tengah">Jawa Tengah</option>
                                            <option value="Jawa Timur">Jawa Timur</option>
                                            <option value="Banten">Banten</option>
                                            <option value="D.I. Yogyakarta">D.I. Yogyakarta</option>
                                            <option value="Sumatera Utara">Sumatera Utara</option>
                                            <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Total Alokasi Kuota *</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={quotaModalForm.total}
                                        onChange={(e) => setQuotaModalForm({ ...quotaModalForm, total: Number(e.target.value) })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Sudah Terpakai</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={quotaModalForm.prevUsed}
                                        onChange={(e) => setQuotaModalForm({ ...quotaModalForm, prevUsed: Number(e.target.value) })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowQuotaModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm cursor-pointer"
                                >
                                    {quotaModalForm.isEdit ? 'Simpan Perubahan' : 'Tambah Wilayah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
