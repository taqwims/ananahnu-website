import { useState, useEffect } from 'react';
import { Loader2, Save, CheckCircle, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatRupiah } from '../../utils/format';
import { toast } from 'react-hot-toast';

type Props = {
    submissionId: string;
    onSaved?: () => void;
    readOnly?: boolean;
    serviceType?: string; // SELF_DECLARE_MANDIRI or SELF_DECLARE_FASILITASI
};

export default function CostCalculator({ submissionId, onSaved, readOnly = false, serviceType = '' }: Props) {
    const user = useAuthStore(state => state.user);
    const [saving, setSaving] = useState(false);
    const [sdMandiriCost, setSdMandiriCost] = useState(280000);
    const [loadingConfig, setLoadingConfig] = useState(false);

    const isFasilitasi = serviceType === 'SELF_DECLARE_FASILITASI' || serviceType === 'SELF_DECLARE_SEHATI';
    const isMandiri = serviceType === 'SELF_DECLARE_MANDIRI';
    const totalCost = isFasilitasi ? 0 : isMandiri ? sdMandiriCost : 0;

    const canEdit = user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_ADVISOR';
    const isEditable = !readOnly && canEdit;

    useEffect(() => {
        if (isMandiri) {
            setLoadingConfig(true);
            api.get('/system-settings/SD_MANDIRI_COST?default=280000')
                .then(res => {
                    const val = parseInt(res.data.value, 10);
                    if (!isNaN(val)) setSdMandiriCost(val);
                })
                .catch(err => console.error("Failed to load cost config", err))
                .finally(() => setLoadingConfig(false));
        }
    }, [isMandiri]);

    const handleSave = async () => {
        setSaving(true);
        const breakdown = isFasilitasi
            ? [{ name: 'Self Declare Fasilitasi (SEHATI)', category: 'GRATIS', total: 0, is_optional: false }]
            : [{ name: 'Biaya Self Declare Mandiri', category: 'SD_MANDIRI', total: sdMandiriCost, is_optional: false }];

        const payload = {
            product_count: 1,
            branch_count: 1,
            mandays: 1,
            total_amount: totalCost,
            cost_breakdown_data: JSON.stringify(breakdown)
        };

        try {
            await api.post(`/submissions/${submissionId}/cost-detail`, payload);
            toast.success("Data biaya berhasil disimpan!");
            if (onSaved) onSaved();
        } catch (err) {
            console.error(err);
            toast.error("Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl mt-8">
            {isFasilitasi ? (
                /* SD Fasilitasi — GRATIS */
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-700">Self Declare Fasilitasi (SEHATI)</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Pengajuan Self Declare melalui program SEHATI tidak dikenakan biaya. Silakan langsung lanjutkan proses pengajuan.
                    </p>
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-6 inline-block">
                        <p className="text-sm text-green-600 font-medium mb-1">Total Biaya</p>
                        <p className="text-3xl font-black text-green-700">GRATIS</p>
                    </div>
                </div>
            ) : (
                /* SD Mandiri — Rp 280.000 */
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mx-auto">
                        <CreditCard className="w-8 h-8 text-brand-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-700">Self Declare Mandiri</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Pengajuan Self Declare Mandiri dikenakan biaya tetap yang harus dibayar sebelum proses pengajuan dapat dilanjutkan.
                    </p>
                    <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 inline-block">
                        <p className="text-sm text-brand-600 font-medium mb-1">Total Biaya</p>
                        {loadingConfig ? (
                            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
                        ) : isEditable ? (
                            <div className="flex items-center gap-2 max-w-[200px] mx-auto">
                                <span className="font-bold text-gray-500">Rp</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-white border border-brand-200 text-brand-700 text-xl font-black rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 text-center"
                                    value={sdMandiriCost}
                                    onChange={e => setSdMandiriCost(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        ) : (
                            <p className="text-3xl font-black text-brand-700">{formatRupiah(sdMandiriCost)}</p>
                        )}
                    </div>

                    <div className="pt-4">
                        <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto border border-gray-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Biaya Self Declare Mandiri</span>
                                <span className="font-bold text-gray-800">{formatRupiah(sdMandiriCost)}</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="font-bold text-gray-700">Grand Total</span>
                                <span className="font-black text-brand-700 text-lg">{formatRupiah(sdMandiriCost)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            {isEditable && (
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brand-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-800 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Simpan Data Biaya
                    </button>
                </div>
            )}

            <p className="text-[10px] text-gray-400 italic text-center mt-6">
                *Biaya Self Declare Mandiri wajib dibayar sebelum submit. SD Fasilitasi (SEHATI) gratis.
            </p>
        </div>
    );
}
