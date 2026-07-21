import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface DiscountPanelProps {
    schemes: any[];
}

export const DiscountPanel = ({ schemes }: DiscountPanelProps) => {
    const [discounts, setDiscounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [savingSchemeId, setSavingSchemeId] = useState<number | null>(null);

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const res = await api.get('/billing-config/sales-schemes');
                const initialDiscounts: Record<number, number> = {};
                res.data.forEach((s: any) => {
                    initialDiscounts[s.id] = s.discount_percent || 0;
                });
                setDiscounts(initialDiscounts);
            } catch (err) {
                console.error(err);
                toast.error("Gagal memuat diskon skema penjualan");
            } finally {
                setLoading(false);
            }
        };
        fetchSchemes();
    }, []);

    const handleSaveDiscount = async (schemeId: number) => {
        setSavingSchemeId(schemeId);
        try {
            const currentScheme = schemes.find(s => s.id === schemeId);
            const discountVal = discounts[schemeId] || 0;
            
            await api.put(`/billing-config/sales-schemes/${schemeId}`, {
                name: currentScheme?.name || '',
                description: currentScheme?.description || '',
                discount_percent: parseFloat(discountVal as any)
            });
            toast.success("Diskon skema penjualan berhasil disimpan");
        } catch (err) {
            console.error(err);
            toast.error("Gagal menyimpan diskon");
        } finally {
            setSavingSchemeId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600 w-8 h-8" /></div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Diskon Jasa Pendampingan</h3>
                    <p className="text-xs text-gray-500 mt-1">Mengatur diskon persentase potongan harga jasa pendampingan untuk setiap skema penjualan.</p>
                </div>
                <div className="p-6 divide-y divide-gray-100 space-y-4">
                    {schemes.map(scheme => (
                        <div key={scheme.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">{scheme.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{scheme.description || 'Tidak ada deskripsi'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative rounded-xl shadow-sm">
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="100"
                                        className="w-24 bg-gray-50 border border-gray-200 text-sm rounded-xl pl-4 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold"
                                        value={discounts[scheme.id] !== undefined ? discounts[scheme.id] : ''}
                                        onChange={e => setDiscounts({ ...discounts, [scheme.id]: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">%</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleSaveDiscount(scheme.id)} 
                                    disabled={savingSchemeId === scheme.id}
                                    className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {savingSchemeId === scheme.id ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
