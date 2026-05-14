interface GlobalSettingsPanelProps {
    systemSettings: Record<string, string>;
    setSystemSettings: (s: any) => void;
    onUpdate: (key: string, value: string) => Promise<void>;
}

export const GlobalSettingsPanel = ({
    systemSettings,
    setSystemSettings,
    onUpdate
}: GlobalSettingsPanelProps) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Pengaturan Sistem Global</h3>
                    <p className="text-xs text-gray-500 mt-1">Konfigurasi pengaturan yang berlaku secara global pada sistem.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Harga Default Self Declare Mandiri (Rp)</label>
                            <input 
                                type="number" 
                                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                value={systemSettings['SD_MANDIRI_COST'] || ''}
                                onChange={e => setSystemSettings((p: any) => ({...p, 'SD_MANDIRI_COST': e.target.value}))}
                                placeholder="Contoh: 280000"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Digunakan sebagai harga default untuk layanan Self Declare Mandiri.</p>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={() => onUpdate('SD_MANDIRI_COST', systemSettings['SD_MANDIRI_COST'] || '280000')} 
                            className="px-6 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-md shadow-brand-200 hover:bg-brand-700 transition-all"
                        >
                            Simpan Pengaturan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
