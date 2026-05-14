interface ClientInfoFormProps {
    clientData: any;
    setClientData: (v: any) => void;
}

export const ClientInfoForm = ({ clientData, setClientData }: ClientInfoFormProps) => {
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
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Produk</label>
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
