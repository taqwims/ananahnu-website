import { useEffect, useState } from 'react';
import { financeService } from '../../services/financeService';
import { Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeeConfig {
    key: string;
    label: string;
    value: number;
}

export default function FeeConfigAdmin() {
    const [configs, setConfigs] = useState<FeeConfig[]>([]);
    const [editedValues, setEditedValues] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        try {
            const data = await financeService.getFeeConfig();
            setConfigs(data);
            const initial: Record<string, number> = {};
            data.forEach((c: FeeConfig) => { initial[c.key] = c.value; });
            setEditedValues(initial);
        } catch {
            toast.error('Gagal memuat konfigurasi fee');
        }
        setLoading(false);
    };

    const handleSave = async (key: string) => {
        const value = editedValues[key];
        if (value === undefined) return;

        setSaving(key);
        try {
            await financeService.updateFeeConfig(key, value);
            toast.success('Fee berhasil disimpan');
            loadConfigs();
        } catch {
            toast.error('Gagal menyimpan');
        }
        setSaving(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-brand-500" />
                    Pengaturan Fee & Komisi
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Atur persentase fee referral dan komisi. Perubahan berlaku untuk transaksi baru.
                </p>
            </div>

            <div className="glass-panel rounded-xl p-6">
                <div className="space-y-6">
                    {configs.map((config) => (
                        <div key={config.key}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white/60 border border-gray-100 hover:border-brand-200 transition-colors">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-800">{config.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5 font-mono">{config.key}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={editedValues[config.key] ?? config.value}
                                        onChange={(e) => setEditedValues(prev => ({ ...prev, [config.key]: parseFloat(e.target.value) || 0 }))}
                                        className="w-24 px-3 py-2 pr-8 text-right border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-bold"
                                    />
                                    <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
                                </div>
                                <button
                                    onClick={() => handleSave(config.key)}
                                    disabled={saving === config.key || editedValues[config.key] === config.value}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                        ${editedValues[config.key] !== config.value
                                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                    {saving === config.key ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel rounded-xl p-5 border-l-4 border-amber-400 bg-amber-50/30">
                <p className="text-sm font-bold text-amber-700">Catatan</p>
                <ul className="text-sm text-amber-600 mt-1 space-y-1 list-disc list-inside">
                    <li>Perubahan fee hanya berlaku untuk transaksi yang terjadi setelah perubahan.</li>
                    <li>Komisi yang sudah dihitung tidak akan berubah secara retroaktif.</li>
                    <li>Fee Insentif Pendampingan dihitung dari komponen biaya pendampingan.</li>
                    <li>Fee Override adalah komisi langsung untuk Halal Manager dari advisor bawahan.</li>
                </ul>
            </div>
        </div>
    );
}
