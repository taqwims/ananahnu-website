import { useState, useEffect } from 'react';
import { Plus, Edit, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { News, ContentBlock } from '../../types';

export default function CMSDashboard() {
    const [activeTab, setActiveTab] = useState<'news' | 'blocks'>('news');
    const [news, setNews] = useState<News[]>([]);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<News | ContentBlock | null>(null);
    const [formData, setFormData] = useState<any>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'news') {
                const res = await api.get('/public/cms/news');
                setNews(res.data);
            } else {
                // Mock list for standard blocks since backend only has GetByKey or Update
                // Ideally backend adds "ListBlocks" endpoint.
                // For now, let's hardcode the keys we expect to manage.
                const keys = ['about_us', 'contact_info', 'welcome_message'];
                const loadedBlocks = await Promise.all(keys.map(async (k) => {
                    try {
                        const res = await api.get(`/public/cms/blocks/${k}`);
                        return res.data;
                    } catch {
                        return { key: k, content: '', section: 'General' };
                    }
                }));
                setBlocks(loadedBlocks);
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
                await api.post('/admin/cms/news', formData); // Backend doesn't support Edit News yet? Handlers say CreateNews only.
            } else {
                await api.put('/admin/cms/blocks', formData);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert("Failed to save");
        }
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setFormData(item || { title: '', content: '', category: 'General', author: 'Admin' });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Content Management</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('news')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'news' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                >
                    News & Articles
                </button>
                <button
                    onClick={() => setActiveTab('blocks')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'blocks' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500'}`}
                >
                    Content Blocks
                </button>
            </div>

            <div className="glass-panel p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" /></div>
                ) : activeTab === 'news' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={() => openEdit(null)} className="glass-button flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add News
                            </button>
                        </div>
                        {news.length === 0 ? <p className="text-center text-gray-500">No news found.</p> : (
                            <div className="grid gap-4">
                                {news.map(n => (
                                    <div key={n.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{n.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{n.content}</p>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">{n.category}</span>
                                        </div>
                                        {/* Backend Update News not implemented yet, so hiding Edit for News */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {blocks.map(b => (
                            <div key={b.key} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-800 font-mono">{b.key}</h3>
                                    <p className="text-sm text-gray-500 truncate max-w-md">{b.content || '(Empty)'}</p>
                                </div>
                                <button onClick={() => openEdit(b)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">{editingItem ? 'Edit Content' : 'Add News'}</h3>

                        <div className="space-y-4">
                            {activeTab === 'news' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Title</label>
                                        <input
                                            className="glass-input w-full"
                                            value={formData.title || ''}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category</label>
                                        <input
                                            className="glass-input w-full"
                                            value={formData.category || ''}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'blocks' && (
                                <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 font-mono mb-2">
                                    Key: {formData.key}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                    className="glass-input w-full h-32"
                                    value={formData.content || ''}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-600">Cancel</button>
                            <button onClick={handleSave} className="glass-button bg-brand-600 text-white hover:bg-brand-700">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
