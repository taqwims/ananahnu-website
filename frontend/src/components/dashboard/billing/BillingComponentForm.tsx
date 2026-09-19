import { X, Plus, Pencil, ToggleRight, ToggleLeft, Layers, Trash2, CheckSquare, Square, Info } from 'lucide-react';

interface BillingComponentFormProps {
    formData: any;
    setFormData: (v: any) => void;
    editingId: number | null;
    onSave: () => Promise<void>;
    onReset: () => void;
    
    // Data for selects
    provinces: any[];
    regencies: any[];
    districts: any[];
    businessTypes: any[];
    products: any[];
    schemes: any[];
    scales: any[];
    formFields: any[];
}

const COMPONENT_CATEGORIES = ['LPH', 'PENDAMPINGAN', 'BPJPH', 'MUI', 'PERSYARATAN_LAIN'] as const;
const COMPONENT_TYPES = [
    { key: 'FIXED', label: 'TETAP (FLAT)', desc: 'Nominal flat tanpa pengali' },
    { key: 'PER_PRODUK', label: 'PER PRODUK', desc: 'Berdasarkan jumlah produk / tier rentang' },
    { key: 'PER_CABANG', label: 'PER CABANG', desc: 'Dikalikan dengan jumlah cabang' },
    { key: 'PER_MANDAY', label: 'PER KUANTITAS', desc: 'Dikalikan kuantitas custom' },
] as const;

export const BillingComponentForm = ({
    formData,
    setFormData,
    editingId,
    onSave,
    onReset,
    provinces,
    regencies,
    districts,
    businessTypes,
    products,
    schemes,
    scales,
    formFields
}: BillingComponentFormProps) => {
    // Current selected types as array
    const selectedTypes: string[] = formData.types || (formData.type ? formData.type.split(',').map((s: string) => s.trim()) : ['FIXED']);

    const handleToggleType = (typeKey: string) => {
        let newTypes: string[];
        if (selectedTypes.includes(typeKey)) {
            newTypes = selectedTypes.filter(t => t !== typeKey);
            if (newTypes.length === 0) newTypes = ['FIXED'];
        } else {
            // If selecting a dynamic type and FIXED was the only one, replace FIXED; otherwise add
            if (selectedTypes.length === 1 && selectedTypes[0] === 'FIXED') {
                newTypes = [typeKey];
            } else {
                newTypes = [...selectedTypes, typeKey];
            }
        }
        setFormData({
            ...formData,
            types: newTypes,
            type: newTypes.join(',')
        });
    };

    const handleAddTier = () => {
        const tiers = formData.productTiers || [];
        let nextMin = 1;
        if (tiers.length > 0) {
            const lastTier = tiers[tiers.length - 1];
            const lastMax = parseInt(lastTier.max_qty) || 0;
            nextMin = lastMax > 0 ? lastMax + 1 : (parseInt(lastTier.min_qty) || 0) + 50;
        }
        const nextMax = nextMin + 49;
        const newTiers = [...tiers, { min_qty: nextMin, max_qty: nextMax, price: '' }];
        setFormData({ ...formData, productTiers: newTiers });
    };

    const handleUpdateTier = (index: number, field: string, value: any) => {
        const tiers = [...(formData.productTiers || [])];
        tiers[index] = { ...tiers[index], [field]: value };
        setFormData({ ...formData, productTiers: tiers });
    };

    const handleRemoveTier = (index: number) => {
        const tiers = [...(formData.productTiers || [])];
        tiers.splice(index, 1);
        setFormData({ ...formData, productTiers: tiers });
    };

    const hasProductType = selectedTypes.includes('PER_PRODUK');

    return (
        <div id="billing-form-section" className={`bg-white p-6 rounded-2xl shadow-sm border space-y-6 animate-in fade-in transition-all duration-300 ${
            editingId ? 'ring-2 ring-brand-500/50 border-brand-200 shadow-brand-50' : 'border-gray-100'
        }`}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {editingId ? (
                            <>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Edit Komponen Biaya
                            </>
                        ) : 'Tambah Komponen Biaya Baru'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Komponen akan ditambahkan sebagai biaya dalam kalkulasi proposal &amp; pengajuan.</p>
                </div>
                {editingId && (
                    <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all">
                        <X className="w-4 h-4" /> Batal Edit
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> Informasi Komponen
                    </h4>
                    <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Komponen *</label>
                            <input type="text" placeholder="Misal: Biaya Sertifikasi Halal" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
                                <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {COMPONENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Jenis Layanan</label>
                                <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold" value={formData.serviceType || 'REGULER'} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
                                    <option value="REGULER">Reguler</option>
                                    <option value="SELF_DECLARE">Self Declare Fasilitasi (Gratis)</option>
                                    <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                                </select>
                            </div>
                        </div>

                        {/* Multi-Select Tipe Kalkulasi */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                                <span>Tipe Kalkulasi (Bisa Pilih Lebih Dari Satu) *</span>
                                <span className="text-[10px] text-brand-600 font-medium">Centang untuk mengaktifkan</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {COMPONENT_TYPES.map(t => {
                                    const isChecked = selectedTypes.includes(t.key);
                                    return (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => handleToggleType(t.key)}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                                                isChecked 
                                                    ? 'bg-brand-50/70 border-brand-300 text-brand-900 ring-1 ring-brand-400/40 shadow-xs' 
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="mt-0.5">
                                                {isChecked ? (
                                                    <CheckSquare className="w-4 h-4 text-brand-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold leading-tight">{t.label}</div>
                                                <div className="text-[10px] text-gray-500 leading-snug mt-0.5">{t.desc}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dynamic Product Tier Pricing Form (if PER_PRODUK selected) */}
                        {hasProductType && (
                            <div className="bg-amber-50/40 border border-amber-200/70 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-amber-600" />
                                        <h5 className="text-xs font-bold text-amber-900">
                                            Batas &amp; Rentang Jumlah Produk (Tier Pricing)
                                        </h5>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddTier}
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tambah Rentang
                                    </button>
                                </div>
                                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                                    Atur batas minimal &amp; maksimal produk beserta tarif harganya (misal: 1-50 harga Rp 500rb, 51-100 harga Rp 1jt).
                                </p>

                                {(!formData.productTiers || formData.productTiers.length === 0) ? (
                                    <div className="p-3 bg-white/80 border border-dashed border-amber-200 rounded-lg text-center text-xs text-amber-800/70 italic flex items-center justify-center gap-2">
                                        <Info className="w-4 h-4 text-amber-500" />
                                        <span>Belum ada rentang tier khusus. Klik <b>Tambah Rentang</b> di atas, atau biarkan kosong untuk menggunakan nominal standar di bawah dikali jumlah produk.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-amber-900 uppercase px-1">
                                            <div className="col-span-3">Min Produk</div>
                                            <div className="col-span-3">Max Produk</div>
                                            <div className="col-span-5">Tarif / Harga (Rp)</div>
                                            <div className="col-span-1 text-center">Hapus</div>
                                        </div>
                                        {formData.productTiers.map((tier: any, idx: number) => (
                                            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-1.5 rounded-lg border border-amber-200/60 shadow-xs">
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        placeholder="Min (1)"
                                                        value={tier.min_qty}
                                                        onChange={e => handleUpdateTier(idx, 'min_qty', e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-md px-2 py-1.5 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 font-semibold text-gray-800"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        placeholder="Max (50)"
                                                        value={tier.max_qty}
                                                        onChange={e => handleUpdateTier(idx, 'max_qty', e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-md px-2 py-1.5 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 font-semibold text-gray-800"
                                                    />
                                                </div>
                                                <div className="col-span-5">
                                                    <input
                                                        type="number"
                                                        placeholder="Contoh: 500000"
                                                        value={tier.price}
                                                        onChange={e => handleUpdateTier(idx, 'price', e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded-md px-2 py-1.5 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 font-bold text-brand-700"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTier(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Hapus baris tier"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                {hasProductType && formData.productTiers?.length > 0 
                                    ? 'Nominal Default (Rp) (Sebagai Fallback)' 
                                    : 'Nominal (Rp) *'}
                            </label>
                            <input type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Diskon (%)</label>
                            <input type="number" placeholder="0" value={(formData as any).discountPercent || ''} onChange={e => setFormData({ ...formData, discountPercent: e.target.value })} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span> Aturan &amp; Wilayah (Opsional)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Provinsi</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.provinceId} onChange={e => setFormData({ ...formData, provinceId: e.target.value })}>
                                <option value="">Semua Provinsi</option>
                                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Kabupaten</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50 disabled:bg-gray-100" value={formData.regencyId} onChange={e => setFormData({ ...formData, regencyId: e.target.value })} disabled={!formData.provinceId}>
                                <option value="">Semua Kabupaten</option>
                                {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Kecamatan</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50 disabled:bg-gray-100" value={formData.districtId} onChange={e => setFormData({ ...formData, districtId: e.target.value })} disabled={!formData.regencyId}>
                                <option value="">Semua Kecamatan</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Batasi Bidang</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.businessTypeId} onChange={e => setFormData({ ...formData, businessTypeId: e.target.value, productCategoryId: '' })}>
                                <option value="">Semua Bidang</option>
                                {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Batasi Produk</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.productCategoryId} onChange={e => setFormData({ ...formData, productCategoryId: e.target.value })}>
                                <option value="">Semua Produk</option>
                                {products
                                    .filter(p => !formData.businessTypeId || p.business_type_id === parseInt(formData.businessTypeId))
                                    .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Skema Penjualan</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.salesSchemeId} onChange={e => setFormData({ ...formData, salesSchemeId: e.target.value })}>
                                <option value="">Semua Skema</option>
                                {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Skala Usaha</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.businessScaleId} onChange={e => setFormData({ ...formData, businessScaleId: e.target.value })}>
                                <option value="">Semua Skala</option>
                                {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* If not mandatory (optional), allow connecting to a Form Field config */}
            {!formData.mandatory && (
                <div className="bg-blue-50/20 border border-blue-100/50 p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider">
                        Hubungkan dengan Field Form (Pengecualian Biaya jika Terisi) (Opsional)
                    </label>
                    <select 
                        className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        value={formData.formFieldConfigId || ''} 
                        onChange={e => setFormData({ ...formData, formFieldConfigId: e.target.value })}
                    >
                        <option value="">Tidak Terhubung ke Form (Dipilih manual di kalkulator)</option>
                        {formFields.map(field => (
                            <option key={field.id} value={field.id}>
                                [{field.form_type}] {field.step_name ? `Step ${field.step_number}: ${field.step_name}` : `Step ${field.step_number}`} — {field.field_label}
                            </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-500 italic leading-snug">
                        *Jika field form yang dipilih diisi oleh klien/konsultan, biaya opsional ini <b>tidak akan masuk</b> ke invoice pembayaran. Jika kosong, biaya ini <b>akan masuk</b>.
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <label onClick={() => setFormData({ ...formData, mandatory: !formData.mandatory, formFieldConfigId: formData.mandatory ? formData.formFieldConfigId : '' })} className="flex items-center gap-3 cursor-pointer group bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-colors">
                    {formData.mandatory ? <ToggleRight className="w-6 h-6 text-brand-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />}
                    <div className="flex flex-col">
                        <span className={`text-sm font-bold ${formData.mandatory ? 'text-brand-700' : 'text-gray-600'}`}>Wajib (Mandatory)</span>
                        <span className="text-[10px] text-gray-500 leading-none">Akan otomatis terpilih di kalkulator</span>
                    </div>
                </label>
                <div className="flex gap-3">
                    {editingId && (
                        <button onClick={onReset} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">
                            Batal
                        </button>
                    )}
                    <button onClick={onSave} disabled={!formData.name} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-md shadow-brand-200 transition-all">
                        {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? 'Update Komponen' : 'Simpan Komponen'}
                    </button>
                </div>
            </div>
        </div>
    );
};
