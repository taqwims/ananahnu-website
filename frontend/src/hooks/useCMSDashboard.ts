import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { News, ContentBlock, Affiliate, CertifiedProduct } from '../types';
import toast from 'react-hot-toast';

export type TabKey = 'news' | 'blocks' | 'affiliates' | 'products';

export const useCMSDashboard = () => {
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

    const fetchData = useCallback(async () => {
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
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            toast.success('Berhasil disimpan');
        } catch (err) {
            toast.error("Gagal menyimpan");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Hapus item ini?')) return;
        try {
            if (activeTab === 'news') await api.delete(`/admin/cms/news/${id}`);
            else if (activeTab === 'affiliates') await api.delete(`/admin/cms/affiliates/${id}`);
            else if (activeTab === 'products') await api.delete(`/admin/cms/products/${id}`);
            fetchData();
            toast.success('Berhasil dihapus');
        } catch (err) {
            toast.error('Gagal menghapus');
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        if (activeTab === 'news') setFormData({ title: '', slug: '', content: '', thumbnail_url: '', tags: '' });
        else if (activeTab === 'affiliates') setFormData({ name: '', logo_url: '', website_url: '' });
        else if (activeTab === 'products') setFormData({ name: '', company_name: '', certificate_number: '', valid_until: '', photo_url: '' });
        else setFormData({});
        setShowModal(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    return {
        activeTab, setActiveTab,
        news, blocks, affiliates, products,
        loading,
        showModal, setShowModal,
        editingItem,
        formData, setFormData,
        handleSave, handleDelete, openCreate, openEdit,
        fetchData
    };
};
