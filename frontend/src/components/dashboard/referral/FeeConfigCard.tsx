import { DollarSign, Save } from 'lucide-react';

interface FeeConfigCardProps {
    referralFee: string;
    setReferralFee: (v: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

export const FeeConfigCard = ({
    referralFee,
    setReferralFee,
    onSave,
    isSaving
}: FeeConfigCardProps) => {
    return (
        <div className="glass-panel p-8 shadow-xl shadow-brand-50/50 border-brand-100/50">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 shadow-inner">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Besaran Komisi Referral</h2>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-0.5">Parameter Keuangan Global</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-6">
                <div className="flex-1 max-w-sm space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Fee per SH Terbit (Rupiah)
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-brand-600 transition-colors">Rp</span>
                        <input
                            type="number"
                            value={referralFee}
                            onChange={(e) => setReferralFee(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-lg font-black text-brand-600 border border-gray-100 shadow-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                            placeholder="50000"
                        />
                    </div>
                </div>
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-200 hover:bg-brand-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-wider">
                    * INFO: Fee ini akan otomatis dicatat sebagai komisi 'PENDING' ketika Sertifikat Halal (SH) terbit dan seluruh tagihan telah dibayar oleh klien.
                </p>
            </div>
        </div>
    );
};
