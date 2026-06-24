import { useState, useEffect } from 'react';
import type { Submission, User, Client, BusinessType } from '../../../types';
import { formatDate, formatRupiah } from '../../../utils/format';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { submissionService } from '../../../services/submissionService';

interface ClientInfoSectionProps {
    submission: Submission;
    user: User | null;
    onUpdateClient: (clientId: string, data: Partial<Client>) => Promise<void>;
    onUpdateClientInfoAndPricing: (data: any) => Promise<void>;
    onUpdateBusinessType: (businessTypeID: number) => Promise<void>;
    businessTypes: BusinessType[];
    processing: boolean;
}

const InfoItem = ({ label, value, mono = false, highlight = false }: { label: string; value?: string; mono?: boolean; highlight?: boolean }) => (
    <div className={`p-3 rounded-xl border transition-all ${highlight ? 'bg-brand-50/50 border-brand-100 ring-1 ring-brand-500/10' : 'bg-white/50 border-gray-100'}`}>
        <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</dt>
        <dd className={`text-sm font-bold truncate ${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-700' : 'text-gray-700'}`}>
            {value || '-'}
        </dd>
    </div>
);

export const ClientInfoSection = ({ submission, user, onUpdateClient, onUpdateClientInfoAndPricing, onUpdateBusinessType, businessTypes, processing }: ClientInfoSectionProps) => {
    const [isEditingClient, setIsEditingClient] = useState(false);
    
    // Master data lists for dropdowns
    const [provinces, setProvinces] = useState<any[]>([]);
    const [regencies, setRegencies] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [productCategories, setProductCategories] = useState<any[]>([]);
    const [scales, setScales] = useState<any[]>([]);
    const [schemes, setSchemes] = useState<any[]>([]);
    const [masterComponents, setMasterComponents] = useState<any[]>([]);
    const [selectedOptionalComponentIds, setSelectedOptionalComponentIds] = useState<number[]>([]);

    const [clientForm, setClientForm] = useState({
        business_name: submission.client?.business_name || '',
        client_name: submission.client?.client_name || '',
        nib: submission.client?.nib || '',
        nik: submission.client?.nik || '',
        product_name: submission.client?.product_name || '',
        address: submission.client?.address || '',
        contact_person: submission.client?.contact_person || '',
        phone: submission.client?.phone || '',
        business_type_id: submission.business_type_id?.toString() || '',
        province_id: (submission.province_id || submission.cost_detail?.province_id)?.toString() || '',
        regency_id: (submission.regency_id || submission.cost_detail?.regency_id)?.toString() || '',
        district_id: (submission.district_id || submission.cost_detail?.district_id)?.toString() || '',
        product_category_id: (submission.product_category_id || submission.cost_detail?.product_category_id)?.toString() || '',
        business_scale_id: (submission.business_scale_id || submission.cost_detail?.business_scale_id)?.toString() || '',
        sales_scheme_id: submission.sales_scheme_id?.toString() || '',
        data_source: submission.data_source || 'ORGANIK',
        product_count: submission.product_count || submission.cost_detail?.product_count || 1,
        branch_count: submission.branch_count || submission.cost_detail?.branch_count || 1,
        mandays: submission.mandays || submission.cost_detail?.mandays || 1,
    });

    useEffect(() => {
        if (isEditingClient) {
            api.get('/geography/provinces').then(res => setProvinces(res.data || []));
            api.get('/billing-config/product-categories').then(res => setProductCategories(res.data || []));
            api.get('/billing-config/business-scales').then(res => setScales(res.data || []));
            api.get('/billing-config/sales-schemes').then(res => setSchemes(res.data || []));
            api.get('/billing-config/components').then(res => setMasterComponents(res.data || []));
        }
    }, [isEditingClient]);

    useEffect(() => {
        if (isEditingClient && submission.cost_detail?.cost_breakdown_data && masterComponents.length > 0) {
            try {
                const bd = JSON.parse(submission.cost_detail.cost_breakdown_data);
                const selectedIds: number[] = [];
                bd.forEach((item: any) => {
                    if (!item.is_optional) return;
                    const matchingComp = masterComponents.find(c => 
                        !c.is_mandatory && 
                        c.category.toUpperCase() !== 'PENDAMPINGAN' &&
                        item.name.startsWith(c.name)
                    );
                    if (matchingComp) {
                        selectedIds.push(matchingComp.id);
                    }
                });
                setSelectedOptionalComponentIds(selectedIds);
            } catch (e) {
                console.error(e);
            }
        }
    }, [isEditingClient, submission, masterComponents]);

    useEffect(() => {
        if (clientForm.province_id) {
            api.get(`/geography/regencies/${clientForm.province_id}`).then(res => setRegencies(res.data || []));
        } else {
            setRegencies([]);
        }
    }, [clientForm.province_id]);

    useEffect(() => {
        if (clientForm.regency_id) {
            api.get(`/geography/districts/${clientForm.regency_id}`).then(res => setDistricts(res.data || []));
        } else {
            setDistricts([]);
        }
    }, [clientForm.regency_id]);

    const handleUpdate = async () => {
        if (!submission.client?.id) return;

        const updatedClientForm = {
            ...clientForm,
            sales_scheme_id: user?.role === 'CLIENT' ? '1' : clientForm.sales_scheme_id,
            data_source: user?.role === 'CLIENT' ? 'ORGANIK' : clientForm.data_source,
            mandays: user?.role === 'CLIENT' ? 1 : clientForm.mandays,
        };

        const payload = {
            ...updatedClientForm,
            business_type_id: updatedClientForm.business_type_id ? parseInt(updatedClientForm.business_type_id) : null,
            province_id: updatedClientForm.province_id ? parseInt(updatedClientForm.province_id) : null,
            regency_id: updatedClientForm.regency_id ? parseInt(updatedClientForm.regency_id) : null,
            district_id: updatedClientForm.district_id ? parseInt(updatedClientForm.district_id) : null,
            product_category_id: updatedClientForm.product_category_id ? parseInt(updatedClientForm.product_category_id) : null,
            business_scale_id: updatedClientForm.business_scale_id ? parseInt(updatedClientForm.business_scale_id) : null,
            sales_scheme_id: updatedClientForm.sales_scheme_id ? parseInt(updatedClientForm.sales_scheme_id) : null,
            product_count: updatedClientForm.product_count,
            branch_count: updatedClientForm.branch_count,
            mandays: updatedClientForm.mandays,
            selected_optional_component_ids: selectedOptionalComponentIds
        };

        if (submission.service_type === 'REGULER') {
            await onUpdateClientInfoAndPricing(payload);
        } else {
            await Promise.all([
                onUpdateClient(submission.client.id, updatedClientForm),
                updatedClientForm.business_type_id ? onUpdateBusinessType(parseInt(updatedClientForm.business_type_id)) : Promise.resolve()
            ]);
        }
        setIsEditingClient(false);
    };

    const canEdit = (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'HALAL_ADVISOR' || (user?.role === 'AUDIT_MANAGER' && submission.service_type === 'REGULER') || (user?.role === 'CLIENT' && (submission.status === 'DRAFT' || submission.status === 'REVISION')));

    return (
        <div className="glass-panel p-6 shadow-xl border border-white/40">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                    Informasi Client
                </h3>
                {canEdit && !isEditingClient && (
                    <button 
                        onClick={() => setIsEditingClient(true)}
                        className="px-3 py-1.5 bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-brand-100 hover:bg-brand-100 transition-all"
                    >
                        Edit Data Klien
                    </button>
                )}
            </div>
            
            {isEditingClient ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Usaha <span className="text-red-500">*</span></label>
                            <input className="glass-input w-full" value={clientForm.business_name} onChange={e => setClientForm({...clientForm, business_name: e.target.value})} placeholder="Contoh: UD Jaya Abadi" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Klien (Pemilik) <span className="text-red-500">*</span></label>
                            <input className="glass-input w-full" value={clientForm.client_name} onChange={e => setClientForm({...clientForm, client_name: e.target.value})} placeholder="Nama Lengkap Pemilik" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">NIB</label>
                            <input className="glass-input w-full font-mono" value={clientForm.nib} onChange={e => setClientForm({...clientForm, nib: e.target.value})} placeholder="Nomor Induk Berusaha" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">NIK <span className="text-red-500">*</span></label>
                            <input className="glass-input w-full font-mono" value={clientForm.nik} onChange={e => setClientForm({...clientForm, nik: e.target.value})} placeholder="Nomor Induk Kependudukan" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Produk</label>
                            <input className="glass-input w-full" value={clientForm.product_name} onChange={e => setClientForm({...clientForm, product_name: e.target.value})} placeholder="Contoh: Keripik Singkong" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CP / Telepon</label>
                            <input className="glass-input w-full" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="08..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bidang Usaha <span className="text-red-500">*</span></label>
                            <select 
                                className="glass-input w-full" 
                                value={clientForm.business_type_id} 
                                onChange={e => {
                                    setClientForm(prev => ({
                                        ...prev,
                                        business_type_id: e.target.value,
                                        product_category_id: '' // reset product category on business type change
                                    }));
                                }}
                            >
                                <option value="">Pilih Bidang Usaha</option>
                                {businessTypes.map(bt => (
                                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                            <textarea className="glass-input w-full" rows={2} value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} placeholder="Alamat lengkap usaha" />
                        </div>

                        {submission.service_type === 'REGULER' && (
                            <>
                                <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">Informasi Penentuan Harga (Reguler)</h4>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Provinsi Usaha <span className="text-red-500">*</span></label>
                                    <select 
                                        className="glass-input w-full" 
                                        value={clientForm.province_id} 
                                        onChange={e => setClientForm({...clientForm, province_id: e.target.value, regency_id: '', district_id: ''})}
                                    >
                                        <option value="">Pilih Provinsi</option>
                                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kabupaten / Kota Usaha <span className="text-red-500">*</span></label>
                                    <select 
                                        className="glass-input w-full" 
                                        value={clientForm.regency_id} 
                                        onChange={e => setClientForm({...clientForm, regency_id: e.target.value, district_id: ''})}
                                        disabled={!clientForm.province_id}
                                    >
                                        <option value="">Pilih Kabupaten</option>
                                        {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kecamatan Usaha</label>
                                    <select 
                                        className="glass-input w-full" 
                                        value={clientForm.district_id} 
                                        onChange={e => setClientForm({...clientForm, district_id: e.target.value})}
                                        disabled={!clientForm.regency_id}
                                    >
                                        <option value="">Pilih Kecamatan</option>
                                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kategori Produk <span className="text-red-500">*</span></label>
                                    <select 
                                        className="glass-input w-full" 
                                        value={clientForm.product_category_id} 
                                        onChange={e => setClientForm({...clientForm, product_category_id: e.target.value})}
                                    >
                                        <option value="">Pilih Kategori Produk</option>
                                        {productCategories
                                            .filter(pc => !clientForm.business_type_id || pc.business_type_id?.toString() === clientForm.business_type_id.toString())
                                            .map(pc => <option key={pc.id} value={pc.id}>{pc.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Skala Usaha <span className="text-red-500">*</span></label>
                                    <select 
                                        className="glass-input w-full" 
                                        value={clientForm.business_scale_id} 
                                        onChange={e => setClientForm({...clientForm, business_scale_id: e.target.value})}
                                    >
                                        <option value="">Pilih Skala Usaha</option>
                                        {scales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                {user?.role !== 'CLIENT' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Skema Penjualan <span className="text-red-500">*</span></label>
                                        <select 
                                            className="glass-input w-full" 
                                            value={clientForm.sales_scheme_id} 
                                            onChange={e => setClientForm({...clientForm, sales_scheme_id: e.target.value})}
                                        >
                                            <option value="">Pilih Skema</option>
                                            {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {user?.role !== 'CLIENT' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sumber Data <span className="text-red-500">*</span></label>
                                        <select 
                                            className="glass-input w-full" 
                                            value={clientForm.data_source === 'TELEMARKETING' ? 'ORGANIK' : clientForm.data_source} 
                                            onChange={e => setClientForm({...clientForm, data_source: e.target.value})}
                                        >
                                            <option value="ORGANIK">Organik / Telemarketing</option>
                                            <option value="MARKETING">Marketing (Partner)</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Jumlah Produk</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="glass-input w-full" 
                                        value={clientForm.product_count} 
                                        onChange={e => setClientForm({...clientForm, product_count: parseInt(e.target.value) || 1})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Jumlah Cabang</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="glass-input w-full" 
                                        value={clientForm.branch_count} 
                                        onChange={e => setClientForm({...clientForm, branch_count: parseInt(e.target.value) || 1})} 
                                    />
                                </div>
                                {user?.role !== 'CLIENT' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Jumlah Manday</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            className="glass-input w-full" 
                                            value={clientForm.mandays} 
                                            onChange={e => setClientForm({...clientForm, mandays: parseInt(e.target.value) || 1})} 
                                        />
                                    </div>
                                )}

                                {/* Optional Components */}
                                {(() => {
                                    const availableOptionals = masterComponents.filter(comp => {
                                        if (!comp || comp.is_mandatory || comp.category.toUpperCase() === 'PENDAMPINGAN') return false;
                                        
                                        // Match filters
                                        if (comp.province_id && comp.province_id.toString() !== clientForm.province_id) return false;
                                        if (comp.regency_id && comp.regency_id.toString() !== clientForm.regency_id) return false;
                                        if (comp.business_type_id && comp.business_type_id.toString() !== clientForm.business_type_id) return false;
                                        if (comp.business_scale_id && comp.business_scale_id.toString() !== clientForm.business_scale_id) return false;
                                        if (comp.sales_scheme_id && comp.sales_scheme_id.toString() !== clientForm.sales_scheme_id) return false;
                                        
                                        return true;
                                    });

                                    if (availableOptionals.length === 0) return null;

                                    return (
                                        <div className="col-span-1 sm:col-span-2 md:col-span-3 border-t border-gray-100 pt-4 mt-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Komponen Tambahan (Opsional)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200/50">
                                                {availableOptionals.map(comp => {
                                                    const isChecked = selectedOptionalComponentIds.includes(comp.id);
                                                    return (
                                                        <label key={comp.id} className="flex items-center gap-3 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    if (isChecked) {
                                                                        setSelectedOptionalComponentIds(selectedOptionalComponentIds.filter(id => id !== comp.id));
                                                                    } else {
                                                                        setSelectedOptionalComponentIds([...selectedOptionalComponentIds, comp.id]);
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                                            />
                                                            <div className="flex-1 text-sm text-gray-700 font-medium">{comp.name}</div>
                                                            <div className="text-xs text-gray-500 font-bold">({formatRupiah(comp.base_amount)})</div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setIsEditingClient(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Batal</button>
                        <button 
                            onClick={handleUpdate} 
                            disabled={processing}
                            className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    <InfoItem label="Nama Usaha" value={submission.client?.business_name} highlight />
                    <InfoItem label="Nama Pemilik" value={submission.client?.client_name} />
                    <InfoItem label="NIB" value={submission.client?.nib} mono />
                    <InfoItem label="NIK" value={submission.client?.nik} mono />
                    <InfoItem label="Produk Utama" value={submission.client?.product_name} />
                    <InfoItem label="Bidang Usaha" value={submission.business_type?.name} highlight />
                    <InfoItem label="Telepon" value={submission.client?.phone} />
                    {submission.service_type === 'REGULER' && (
                        <>
                            <InfoItem label="Provinsi" value={submission.cost_detail?.province?.name || '-'} />
                            <InfoItem label="Kabupaten / Kota" value={submission.cost_detail?.regency?.name || '-'} />
                            <InfoItem label="Kecamatan" value={submission.cost_detail?.district?.name || '-'} />
                            <InfoItem label="Kategori Produk" value={submission.cost_detail?.product_category?.name || '-'} />
                            <InfoItem label="Skala Usaha" value={submission.cost_detail?.business_scale?.name || '-'} />
                            {user?.role !== 'CLIENT' && (
                                <InfoItem label="Sumber Data" value={
                                    submission.data_source === 'MARKETING' ? 'Marketing (Partner)' :
                                    (submission.data_source === 'ORGANIK' || submission.data_source === 'TELEMARKETING') ? 'Organik / Telemarketing' :
                                    submission.data_source || '-'
                                } />
                            )}
                            <InfoItem label="Jumlah Produk" value={submission.product_count?.toString() || submission.cost_detail?.product_count?.toString() || '1'} />
                            <InfoItem label="Jumlah Cabang" value={submission.branch_count?.toString() || submission.cost_detail?.branch_count?.toString() || '1'} />
                            {user?.role !== 'CLIENT' && (
                                <InfoItem label="Jumlah Manday" value={submission.mandays?.toString() || submission.cost_detail?.mandays?.toString() || '1'} />
                            )}
                        </>
                    )}
                    {submission.consultant_id && (
                        <InfoItem label="Advisor Penanggung Jawab" value={submission.consultant?.full_name} highlight />
                    )}
                    {submission.service_type === 'SELF_DECLARE' && submission.self_declare_type && (
                        <InfoItem label="Jenis Self Declare" value={submission.self_declare_type === 'MANDIRI' ? 'Mandiri (Berbayar)' : 'Gratis (Subsidi)'} highlight />
                    )}
                    <div className="sm:col-span-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat Lengkap</dt>
                        <dd className="text-sm text-gray-700 font-medium leading-relaxed">{submission.client?.address || '-'}</dd>
                    </div>
                </dl>
            )}

            {(submission.audit_date || submission.audit_result_1_url) && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {submission.audit_date && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">📅 Tanggal Audit</p>
                            <p className="text-sm font-bold text-amber-900">{formatDate(submission.audit_date)}</p>
                        </div>
                    )}
                    {submission.audit_result_1_url && (
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">📄 Hasil Audit</p>
                            <div className="flex gap-2 mt-1">
                                <a href={`${import.meta.env.VITE_API_URL}${submission.audit_result_1_url}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-700 underline">File 1</a>
                                {submission.audit_result_2_url && (
                                    <a href={`${import.meta.env.VITE_API_URL}${submission.audit_result_2_url}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-700 underline">File 2</a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {submission.service_type === 'REGULER' && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 gap-4">
                    <span className="text-xs text-blue-800 font-bold text-center sm:text-left">Layanan Reguler membutuhkan kontrak pendampingan.</span>
                    <button 
                        onClick={async () => {
                            try {
                                toast.loading('Mengunduh Kontrak...', { id: 'download-contract' });
                                await submissionService.downloadContract(submission.id);
                                toast.success('Kontrak berhasil diunduh', { id: 'download-contract' });
                            } catch (e: any) {
                                toast.error(e.message || 'Gagal mengunduh kontrak', { id: 'download-contract' });
                            }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-100"
                    >
                        Unduh Kontrak Kerja
                    </button>
                </div>
            )}
        </div>
    );
};
