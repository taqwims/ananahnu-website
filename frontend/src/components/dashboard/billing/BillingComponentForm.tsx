import { X, Plus, Pencil, ToggleRight, ToggleLeft } from 'lucide-react';

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

const COMPONENT_CATEGORIES = ['REGISTRASI', 'LPH', 'PENETAPAN', 'PENDAMPINGAN', 'BPJPH', 'MUI', 'OPSIONAL'] as const;
const COMPONENT_TYPES = ['FIXED', 'PER_MANDAY', 'PER_CABANG', 'PER_PRODUK'] as const;

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
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya Baru'}</h3>
                    <p className="text-xs text-gray-500 mt-1">Komponen akan ditambahkan sebagai biaya tambahan dalam kalkulasi proposal.</p>
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
                            <input type="text" placeholder="Misal: Biaya Transportasi" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kategori</label>
                                <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {COMPONENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipe Kalkulasi</label>
                                <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    {COMPONENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nominal (Rp) *</label>
                            <input type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold" />
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
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Sumber Data</label>
                            <select className="w-full bg-white border border-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={formData.dataSource === 'TELEMARKETING' ? 'ORGANIK' : formData.dataSource} onChange={e => setFormData({ ...formData, dataSource: e.target.value })}>
                                <option value="ORGANIK">Organik / Telemarketing</option>
                                <option value="MARKETING">Marketing (Partner)</option>
                                <option value="BOTH">Semua (Organik / Telemarketing & Marketing)</option>
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
