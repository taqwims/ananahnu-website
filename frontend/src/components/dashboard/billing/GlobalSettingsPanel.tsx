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
    const handleUpdate = async (key: string) => {
        await onUpdate(key, systemSettings[key] || '');
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Konfigurasi Identitas Perusahaan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Identitas Perusahaan (Kontrak)</h3>
                    <p className="text-xs text-gray-500 mt-1">Data ini akan digunakan untuk mengisi informasi Pihak Pertama pada dokumen kontrak otomatis.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Perusahaan</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['COMPANY_NAME'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_NAME': e.target.value}))}
                                    placeholder="Contoh: PT Ana Nahnu Indonesia"
                                />
                                <button onClick={() => handleUpdate('COMPANY_NAME')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor NIB</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['COMPANY_NIB'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_NIB': e.target.value}))}
                                    placeholder="Contoh: 1234567890"
                                />
                                <button onClick={() => handleUpdate('COMPANY_NIB')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Alamat Lengkap Perusahaan</label>
                        <div className="flex gap-2">
                            <textarea 
                                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                value={systemSettings['COMPANY_ADDRESS'] || ''}
                                onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_ADDRESS': e.target.value}))}
                                placeholder="Dusun Cikohkol, Desa Sukasari..."
                                rows={2}
                            />
                            <button onClick={() => handleUpdate('COMPANY_ADDRESS')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all self-end">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">No. Telepon / WhatsApp Perusahaan</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['COMPANY_PHONE'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_PHONE': e.target.value}))}
                                    placeholder="Contoh: +62 21 5555 1234"
                                />
                                <button onClick={() => handleUpdate('COMPANY_PHONE')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Resmi Perusahaan</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['COMPANY_EMAIL'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_EMAIL': e.target.value}))}
                                    placeholder="Contoh: info@halalcore.id"
                                />
                                <button onClick={() => handleUpdate('COMPANY_EMAIL')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Penandatangan (Default)</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['COMPANY_DIRECTOR_NAME'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_DIRECTOR_NAME': e.target.value}))}
                                    placeholder="Contoh: Ahmad Fauzi"
                                />
                                <button onClick={() => handleUpdate('COMPANY_DIRECTOR_NAME')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Jabatan Penandatangan (Default)</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                    value={systemSettings['COMPANY_DIRECTOR_POSITION'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({...p, 'COMPANY_DIRECTOR_POSITION': e.target.value}))}
                                    placeholder="Contoh: Direktur Utama"
                                />
                                <button onClick={() => handleUpdate('COMPANY_DIRECTOR_POSITION')} className="p-3 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
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
