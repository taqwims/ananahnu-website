import { useAuthStore } from '../../../../store/authStore';

interface ClientInfoFormProps {
    clientData: any;
    setClientData: (v: any) => void;
    businessTypes: any[];
    productCategories?: any[];
    businessScales?: any[];
    provinces?: any[];
    regencies?: any[];
    districts?: any[];
}

export const ClientInfoForm = ({ 
    clientData, 
    setClientData, 
    businessTypes,
    productCategories = [],
    businessScales = [],
    provinces = [],
    regencies = [],
    districts = []
}: ClientInfoFormProps) => {
    const user = useAuthStore(state => state.user);
    const role = user?.role || '';
    const isHalalAgency = role === 'HALAL_ADVISOR' || role === 'HALAL_MANAGER' || role === 'HALAL_DIRECTOR';

    return (
        <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">Informasi Klien</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Usaha <span className="text-red-500">*</span></label>
                    <input 
                        className="glass-input w-full" 
                        value={clientData.business_name} 
                        onChange={e => setClientData({...clientData, business_name: e.target.value})} 
                        placeholder="Contoh: UD Jaya Abadi"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Klien (Pemilik) <span className="text-red-500">*</span></label>
                    <input 
                        className="glass-input w-full" 
                        value={clientData.client_name} 
                        onChange={e => setClientData({...clientData, client_name: e.target.value})} 
                        placeholder="Nama Lengkap Klien"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Bidang Usaha <span className="text-red-500">*</span></label>
                    <select 
                        className="glass-input w-full"
                        value={clientData.business_type_id}
                        onChange={e => setClientData({...clientData, business_type_id: e.target.value})}
                    >
                        <option value="">Pilih Bidang Usaha</option>
                        {businessTypes
                            .filter(bt => {
                                if (clientData.service_type === 'SELF_DECLARE' || clientData.service_type === 'SELF_DECLARE_MANDIRI') {
                                    return bt.name.toLowerCase().includes('makanan') || bt.name.toLowerCase().includes('minuman');
                                }
                                return true;
                            })
                            .map(bt => (
                                <option key={bt.id} value={bt.id}>{bt.name}</option>
                            ))
                        }
                    </select>
                </div>

                {isHalalAgency && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kategori Produk <span className="text-red-500">*</span></label>
                            <select 
                                className="glass-input w-full"
                                value={clientData.product_category_id}
                                onChange={e => setClientData({...clientData, product_category_id: e.target.value})}
                            >
                                <option value="">Pilih Kategori Produk</option>
                                {productCategories.map(pc => (
                                    <option key={pc.id} value={pc.id}>{pc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Skala Usaha <span className="text-red-500">*</span></label>
                            <select 
                                className="glass-input w-full"
                                value={clientData.business_scale_id}
                                onChange={e => setClientData({...clientData, business_scale_id: e.target.value})}
                            >
                                <option value="">Pilih Skala Usaha</option>
                                {businessScales.map(bs => (
                                    <option key={bs.id} value={bs.id}>{bs.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Provinsi <span className="text-red-500">*</span></label>
                            <select 
                                className="glass-input w-full"
                                value={clientData.province_id}
                                onChange={e => setClientData({...clientData, province_id: e.target.value, regency_id: '', district_id: ''})}
                            >
                                <option value="">Pilih Provinsi</option>
                                {provinces.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kabupaten/Kota <span className="text-red-500">*</span></label>
                            <select 
                                className="glass-input w-full disabled:opacity-50"
                                value={clientData.regency_id}
                                disabled={!clientData.province_id}
                                onChange={e => setClientData({...clientData, regency_id: e.target.value, district_id: ''})}
                            >
                                <option value="">Pilih Kabupaten/Kota</option>
                                {regencies.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kecamatan <span className="text-red-500">*</span></label>
                            <select 
                                className="glass-input w-full disabled:opacity-50"
                                value={clientData.district_id}
                                disabled={!clientData.regency_id}
                                onChange={e => setClientData({...clientData, district_id: e.target.value})}
                            >
                                <option value="">Pilih Kecamatan</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah Cabang</label>
                                    <input 
                                        type="number"
                                        min={0}
                                        className="glass-input w-full" 
                                        value={clientData.branch_count} 
                                        onChange={e => setClientData({...clientData, branch_count: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah Produk</label>
                                    <input 
                                        type="number"
                                        min={0}
                                        className="glass-input w-full" 
                                        value={clientData.product_count} 
                                        onChange={e => setClientData({...clientData, product_count: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">NIB</label>
                    <input 
                        className="glass-input w-full font-mono" 
                        value={clientData.nib} 
                        onChange={e => setClientData({...clientData, nib: e.target.value})} 
                        placeholder="Nomor Induk Berusaha"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">NIK <span className="text-red-500">*</span></label>
                    <input 
                        className="glass-input w-full font-mono" 
                        value={clientData.nik} 
                        onChange={e => setClientData({...clientData, nik: e.target.value})} 
                        placeholder="Nomor Induk Kependudukan (16 Digit)"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Produk</label>
                    <input 
                        className="glass-input w-full" 
                        value={clientData.product_name} 
                        onChange={e => setClientData({...clientData, product_name: e.target.value})} 
                        placeholder="Contoh: Keripik Singkong"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Alamat Lengkap</label>
                    <textarea 
                        className="glass-input w-full" 
                        rows={2} 
                        value={clientData.address} 
                        onChange={e => setClientData({...clientData, address: e.target.value})} 
                        placeholder="Alamat tempat usaha..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kontak Person (Opsional)</label>
                    <input 
                        className="glass-input w-full" 
                        value={clientData.contact_person} 
                        onChange={e => setClientData({...clientData, contact_person: e.target.value})} 
                        placeholder="Nama PIC (jika berbeda)"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">No. Telepon/WA</label>
                    <input 
                        className="glass-input w-full" 
                        value={clientData.phone} 
                        onChange={e => setClientData({...clientData, phone: e.target.value})} 
                    />
                </div>
            </div>
        </div>
    );
};
