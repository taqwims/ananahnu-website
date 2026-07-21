import { useState } from 'react';
import toast from 'react-hot-toast';

interface QuotaSettingsProps {
    systemSettings: Record<string, string>;
    setSystemSettings: (s: any) => void;
    onUpdate: (key: string, value: string) => Promise<void>;
}

export const QuotaSettings = ({
    systemSettings,
    setSystemSettings,
    onUpdate
}: QuotaSettingsProps) => {
    const [loadingLimit, setLoadingLimit] = useState(false);
    const [loadingUsed, setLoadingUsed] = useState(false);

    const handleUpdate = async (key: string) => {
        if (key === 'facilitation_quota_limit') setLoadingLimit(true);
        if (key === 'facilitation_quota_used') setLoadingUsed(true);

        try {
            await onUpdate(key, systemSettings[key] || '0');
            toast.success("Pengaturan kuota berhasil diperbarui");
        } catch (e) {
            toast.error("Gagal memperbarui kuota");
        } finally {
            setLoadingLimit(false);
            setLoadingUsed(false);
        }
    };

    const limit = parseInt(systemSettings['facilitation_quota_limit'] || '0', 10);
    const used = parseInt(systemSettings['facilitation_quota_used'] || '0', 10);
    const remaining = limit - used;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Pengaturan Kuota Fasilitasi</h3>
                    <p className="text-xs text-gray-500 mt-1">Kelola batas kuota pengajuan skema Self Declare Fasilitasi.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Info Remaining Quota */}
                        <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium">Sisa Kuota Saat Ini</p>
                            <p className={`text-3xl font-black mt-1 ${remaining <= 0 ? 'text-red-600' : 'text-brand-600'}`}>
                                {remaining}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium">Total Kuota Terpakai</p>
                            <p className="text-3xl font-black text-gray-800 mt-1">
                                {used}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <p className="text-xs text-gray-500 font-medium">Status</p>
                            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${remaining <= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {remaining <= 0 ? 'TERKUNCI (KUOTA HABIS)' : 'AKTIF'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Batas Kuota Fasilitasi</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['facilitation_quota_limit'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'facilitation_quota_limit': e.target.value}))}
                                    placeholder="Contoh: 1000"
                                />
                                <button 
                                    onClick={() => handleUpdate('facilitation_quota_limit')} 
                                    disabled={loadingLimit}
                                    className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all disabled:opacity-50"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Reset / Atur Manual Kuota Terpakai</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['facilitation_quota_used'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'facilitation_quota_used': e.target.value}))}
                                    placeholder="Contoh: 0"
                                />
                                <button 
                                    onClick={() => handleUpdate('facilitation_quota_used')} 
                                    disabled={loadingUsed}
                                    className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all disabled:opacity-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
