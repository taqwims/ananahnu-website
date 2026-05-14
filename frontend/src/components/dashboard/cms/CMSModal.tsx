import type { TabKey } from '../../../hooks/useCMSDashboard';

interface CMSModalProps {
    activeTab: TabKey;
    editingItem: any;
    formData: any;
    setFormData: (v: any) => void;
    onSave: () => void;
    onClose: () => void;
    label: string;
}

export const CMSModal = ({
    activeTab,
    editingItem,
    formData,
    setFormData,
    onSave,
    onClose,
    label
}: CMSModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {editingItem ? 'Perbarui' : 'Tambah'} {label}
                    </h3>
                </div>

                <div className="space-y-5">
                    {/* NEWS FORM */}
                    {activeTab === 'news' && (
                        <>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Judul Berita</label>
                                <input className="glass-input w-full" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Masukkan judul..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Slug URL</label>
                                <input className="glass-input w-full font-mono text-sm" value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="judul-berita-friendly" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Konten Lengkap</label>
                                <textarea className="glass-input w-full h-40" value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Tulis berita di sini..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">URL Gambar Thumbnail</label>
                                <input className="glass-input w-full" value={formData.thumbnail_url || ''} onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tag (Pisahkan dengan koma)</label>
                                <input className="glass-input w-full" value={formData.tags || ''} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="halal, sertifikasi, berita" />
                            </div>
                        </>
                    )}

                    {/* BLOCK FORM */}
                    {activeTab === 'blocks' && (
                        <>
                            <div className="bg-brand-50 p-3 rounded-xl text-[10px] text-brand-700 font-black uppercase tracking-widest border border-brand-100">
                                System Key: {formData.section_key}
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Display Title</label>
                                <input className="glass-input w-full" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Judul section..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Konten Section</label>
                                <textarea className="glass-input w-full h-40" value={formData.body || ''} onChange={e => setFormData({ ...formData, body: e.target.value })} placeholder="Isi konten section..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">URL Gambar/Ikon</label>
                                <input className="glass-input w-full" value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
                            </div>
                        </>
                    )}

                    {/* AFFILIATE FORM */}
                    {activeTab === 'affiliates' && (
                        <>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Mitra/Afiliasi</label>
                                <input className="glass-input w-full" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama mitra..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">URL Logo (Square Preferred)</label>
                                <input className="glass-input w-full" value={formData.logo_url || ''} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Website URL Resmi</label>
                                <input className="glass-input w-full" value={formData.website_url || ''} onChange={e => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." />
                            </div>
                        </>
                    )}

                    {/* PRODUCT FORM */}
                    {activeTab === 'products' && (
                        <>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Produk</label>
                                <input className="glass-input w-full" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nama produk..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nama Perusahaan/Produsen</label>
                                <input className="glass-input w-full" value={formData.company_name || ''} onChange={e => setFormData({ ...formData, company_name: e.target.value })} placeholder="PT. Nama Perusahaan..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nomor Sertifikat Halal</label>
                                <input className="glass-input w-full font-mono text-sm" value={formData.certificate_number || ''} onChange={e => setFormData({ ...formData, certificate_number: e.target.value })} placeholder="ID0000000..." />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Masa Berlaku Sertifikat</label>
                                <input type="date" className="glass-input w-full" value={formData.valid_until?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, valid_until: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">URL Foto Produk</label>
                                <input className="glass-input w-full" value={formData.photo_url || ''} onChange={e => setFormData({ ...formData, photo_url: e.target.value })} placeholder="https://..." />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-10">
                    <button onClick={onClose} className="px-6 py-2.5 hover:bg-gray-100 rounded-xl text-gray-500 font-bold transition-colors">
                        Batal
                    </button>
                    <button onClick={onSave} className="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};
