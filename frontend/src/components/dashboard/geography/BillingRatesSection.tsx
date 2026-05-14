import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { BillingRate, Regency } from '../../../types';

interface BillingRatesSectionProps {
    rates: BillingRate[];
    selectedRegency: Regency | null;
    onDelete: (id: number) => void;
    showAdd: boolean;
    setShowAdd: (v: boolean) => void;
    rateForm: any;
    setRateForm: (v: any) => void;
    onAdd: () => void;
}

export const BillingRatesSection = ({
    rates,
    selectedRegency,
    onDelete,
    showAdd,
    setShowAdd,
    rateForm,
    setRateForm,
    onAdd
}: BillingRatesSectionProps) => {
    return (
        <div className="bg-gradient-to-b from-brand-50 to-white p-6 rounded-2xl shadow-sm border border-brand-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-brand-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        Tarif Khusus Daerah
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Tarif penyesuaian untuk kabupaten/kota tertentu</p>
                </div>
                {selectedRegency && (
                    <button onClick={() => setShowAdd(true)}
                        className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200" title="Tambah Tarif">
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {showAdd && selectedRegency && (
                <div className="mb-6 p-5 bg-white rounded-2xl border border-brand-200 shadow-lg shadow-brand-100/50 space-y-4 animate-in slide-in-from-top-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Tipe Layanan</label>
                        <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={rateForm.service_type}
                            onChange={e => setRateForm((p: any) => ({ ...p, service_type: e.target.value }))}>
                            <option value="REGULER">Reguler</option>
                            <option value="SELF_DECLARE">Self Declare Fasilitasi (Gratis)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Jumlah Tarif (Rp)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                            <input type="number" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold" placeholder="0" value={rateForm.amount || ''}
                                onChange={e => setRateForm((p: any) => ({ ...p, amount: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Keterangan (Opsional)</label>
                        <input className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" placeholder="Misal: Penyesuaian ongkos transport" value={rateForm.description}
                            onChange={e => setRateForm((p: any) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                        <button onClick={onAdd} className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-200 transition-colors">Simpan Tarif</button>
                    </div>
                </div>
            )}

            {!selectedRegency && rates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white/60 rounded-2xl border border-dashed border-gray-200">
                    <DollarSign className="w-12 h-12 text-brand-200 mb-3" />
                    <h3 className="font-semibold text-gray-700">Pilih Kabupaten</h3>
                    <p className="text-sm text-gray-500 mt-1">Pilih kabupaten/kota di daftar sebelah kiri untuk melihat atau menambahkan tarif khusus daerah.</p>
                </div>
            ) : rates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white/60 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">Belum ada tarif khusus untuk {selectedRegency?.name}.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rates.map(rate => (
                        <div key={rate.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            rate.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>{rate.service_type}</span>
                                    </div>
                                    <div className="font-semibold text-gray-800 text-sm mb-0.5">{rate.regency?.name}</div>
                                    {rate.description && <div className="text-xs text-gray-500">{rate.description}</div>}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-black text-brand-700 bg-brand-50 px-3 py-1 rounded-lg text-sm">{formatRupiah(rate.amount)}</span>
                                    <button onClick={() => onDelete(rate.id)}
                                        className="text-xs font-semibold text-gray-400 hover:text-red-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
