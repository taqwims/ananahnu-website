interface SelfDeclareRatesProps {
    systemSettings: Record<string, string>;
    setSystemSettings: (s: any) => void;
    onUpdate: (key: string, value: string) => Promise<void>;
}

export const SelfDeclareRates = ({
    systemSettings,
    setSystemSettings,
    onUpdate
}: SelfDeclareRatesProps) => {
    const handleUpdate = async (key: string) => {
        await onUpdate(key, systemSettings[key] || '');
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Pengaturan Harga */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Tarif Default Self Declare Mandiri</h3>
                    <p className="text-xs text-gray-500 mt-1">Pengaturan tarif dasar otomatis untuk pengajuan berskema Self Declare Mandiri.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga Default Self Declare Mandiri (Rp)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['SD_MANDIRI_COST'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'SD_MANDIRI_COST': e.target.value}))}
                                    placeholder="Contoh: 280000"
                                />
                                <button onClick={() => handleUpdate('SD_MANDIRI_COST')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
