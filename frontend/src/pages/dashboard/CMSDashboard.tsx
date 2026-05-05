import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, BookOpen, Globe, Award, Package } from 'lucide-react';
import api from '../../services/api';
import type { News, ContentBlock, Affiliate, CertifiedProduct } from '../../types';

type TabKey = 'news' | 'blocks' | 'affiliates' | 'products';

export default function CMSDashboard() {
    const [activeTab, setActiveTab] = useState<TabKey>('news');
    const [news, setNews] = useState<News[]>([]);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [products, setProducts] = useState<CertifiedProduct[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'news') {
                const res = await api.get('/public/cms/news');
                setNews(res.data || []);
            } else if (activeTab === 'blocks') {
                const res = await api.get('/public/cms/blocks');
                setBlocks(res.data || []);
            } else if (activeTab === 'affiliates') {
                const res = await api.get('/public/cms/affiliates');
                setAffiliates(res.data || []);
            } else if (activeTab === 'products') {
                const res = await api.get('/public/cms/products');
                setProducts(res.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleSave = async () => {
        try {
            if (activeTab === 'news') {
                if (editingItem?.id) {
                    await api.put(`/admin/cms/news/${editingItem.id}`, formData);
                } else {
                    await api.post('/admin/cms/news', formData);
                }
            } else if (activeTab === 'blocks') {
                await api.put('/admin/cms/blocks', formData);
            } else if (activeTab === 'affiliates') {
                if (editingItem?.id) {
                    await api.put(`/admin/cms/affiliates/${editingItem.id}`, formData);
                } else {
                    await api.post('/admin/cms/affiliates', formData);
                }
            } else if (activeTab === 'products') {
                if (editingItem?.id) {
                    await api.put(`/admin/cms/products/${editingItem.id}`, formData);
                } else {
                    await api.post('/admin/cms/products', formData);
                }
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert("Gagal menyimpan");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus item ini?')) return;
        try {
            if (activeTab === 'news') await api.delete(`/admin/cms/news/${id}`);
            else if (activeTab === 'affiliates') await api.delete(`/admin/cms/affiliates/${id}`);
            else if (activeTab === 'products') await api.delete(`/admin/cms/products/${id}`);
            fetchData();
        } catch (err) {
            alert('Gagal menghapus');
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        if (activeTab === 'news') setFormData({ title: '', slug: '', content: '', thumbnail_url: '', tags: '' });
        else if (activeTab === 'affiliates') setFormData({ name: '', logo_url: '', website_url: '' });
        else if (activeTab === 'products') setFormData({ name: '', company_name: '', certificate_number: '', valid_until: '', photo_url: '' });
        setShowModal(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { key: 'news', label: 'Berita', icon: BookOpen },
        { key: 'blocks', label: 'Content Blocks', icon: Globe },
        { key: 'affiliates', label: 'Affiliates', icon: Award },
        { key: 'products', label: 'Produk Bersertifikat', icon: Package },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Content Management</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-2 px-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === tab.key ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="glass-panel p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" /></div>
                ) : (
                    <>
                        {/* === NEWS === */}
                        {activeTab === 'news' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button onClick={openCreate} className="glass-button flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Tambah Berita
                                    </button>
                                </div>
                                {news.length === 0 ? <p className="text-center text-gray-500">Belum ada berita.</p> : (
                                    <div className="grid gap-4">
                                        {news.map(n => (
                                            <div key={n.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800">{n.title}</h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{n.content}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        {n.tags && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{n.tags}</span>}
                                                        <span className="text-xs text-gray-400">{n.slug}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 ml-4">
                                                    <button onClick={() => openEdit(n)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(n.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === BLOCKS === */}
                        {activeTab === 'blocks' && (
                            <div className="grid gap-4">
                                {blocks.length === 0 ? <p className="text-center text-gray-500">Belum ada content blocks.</p> : (
                                    blocks.map(b => (
                                        <div key={b.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center hover:bg-gray-50">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-800 font-mono">{b.section_key}</h3>
                                                <p className="text-sm text-gray-700 mt-1">{b.title || '(No title)'}</p>
                                                <p className="text-sm text-gray-500 truncate max-w-md">{b.body || '(Empty)'}</p>
                                            </div>
                                            <button onClick={() => openEdit(b)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* === AFFILIATES === */}
                        {activeTab === 'affiliates' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button onClick={openCreate} className="glass-button flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Tambah Affiliate
                                    </button>
                                </div>
                                {affiliates.length === 0 ? <p className="text-center text-gray-500">Belum ada affiliate.</p> : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {affiliates.map(a => (
                                            <div key={a.id} className="p-4 border border-gray-100 rounded-lg">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {a.logo_url && <img src={a.logo_url} alt={a.name} className="w-12 h-12 object-contain rounded" />}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-800 truncate">{a.name}</h3>
                                                        {a.website_url && (
                                                            <a href={a.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline truncate block">{a.website_url}</a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => openEdit(a)} className="p-1 text-brand-600 hover:bg-brand-50 rounded"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(a.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === PRODUCTS === */}
                        {activeTab === 'products' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button onClick={openCreate} className="glass-button flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Tambah Produk
                                    </button>
                                </div>
                                {products.length === 0 ? <p className="text-center text-gray-500">Belum ada produk bersertifikat.</p> : (
                                    <div className="grid gap-4">
                                        {products.map(p => (
                                            <div key={p.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                                                    <p className="text-sm text-gray-600">{p.company_name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">No. Sertifikat: {p.certificate_number}</p>
                                                    <p className="text-xs text-gray-400">Berlaku sampai: {new Date(p.valid_until).toLocaleDateString('id-ID')}</p>
                                                </div>
                                                <div className="flex gap-1 ml-4">
                                                    <button onClick={() => openEdit(p)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">{editingItem ? 'Edit' : 'Tambah'} {tabs.find(t => t.key === activeTab)?.label}</h3>

                        <div className="space-y-4">
                            {/* NEWS FORM */}
                            {activeTab === 'news' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Judul</label>
                                        <input className="glass-input w-full" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Slug</label>
                                        <input className="glass-input w-full" value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="judul-berita-url-friendly" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Konten</label>
                                        <textarea className="glass-input w-full h-32" value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                                        <input className="glass-input w-full" value={formData.thumbnail_url || ''} onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tags</label>
                                        <input className="glass-input w-full" value={formData.tags || ''} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="halal, sertifikasi" />
                                    </div>
                                </>
                            )}

                            {/* BLOCK FORM */}
                            {activeTab === 'blocks' && (
                                <>
                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 font-mono">
                                        Key: {formData.section_key}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Title</label>
                                        <input className="glass-input w-full" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Body</label>
                                        <textarea className="glass-input w-full h-32" value={formData.body || ''} onChange={e => setFormData({ ...formData, body: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Image URL</label>
                                        <input className="glass-input w-full" value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                                    </div>
                                </>
                            )}

                            {/* AFFILIATE FORM */}
                            {activeTab === 'affiliates' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nama</label>
                                        <input className="glass-input w-full" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Logo URL</label>
                                        <input className="glass-input w-full" value={formData.logo_url || ''} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Website URL</label>
                                        <input className="glass-input w-full" value={formData.website_url || ''} onChange={e => setFormData({ ...formData, website_url: e.target.value })} />
                                    </div>
                                </>
                            )}

                            {/* PRODUCT FORM */}
                            {activeTab === 'products' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nama Produk</label>
                                        <input className="glass-input w-full" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nama Perusahaan</label>
                                        <input className="glass-input w-full" value={formData.company_name || ''} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nomor Sertifikat</label>
                                        <input className="glass-input w-full" value={formData.certificate_number || ''} onChange={e => setFormData({ ...formData, certificate_number: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Berlaku Sampai</label>
                                        <input type="date" className="glass-input w-full" value={formData.valid_until?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, valid_until: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Foto URL</label>
                                        <input className="glass-input w-full" value={formData.photo_url || ''} onChange={e => setFormData({ ...formData, photo_url: e.target.value })} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-600">Batal</button>
                            <button onClick={handleSave} className="glass-button bg-brand-600 text-white hover:bg-brand-700">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
