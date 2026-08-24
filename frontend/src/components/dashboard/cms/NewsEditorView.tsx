import { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, Sparkles, Globe, Share2, CheckCircle2, AlertCircle,
    FileText, Bold, Italic, Heading2, Heading3,
    List, ListOrdered, Quote, Link2, Image as ImageIcon,
    Table as TableIcon, User,
    Smartphone, Monitor, Save, Plus, Star, Home,
    Upload, Loader2, Trash2, RefreshCw, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import type { News } from '../../../types';
import ArticleContentRenderer from '../../common/ArticleContentRenderer';
import { getMediaUrl } from '../../../utils/media';

interface NewsEditorViewProps {
    editingItem: News | null;
    formData: Partial<News>;
    setFormData: (v: any) => void;
    onSave: () => void;
    onCancel: () => void;
}

const POPULAR_CATEGORIES = [
    'Sertifikasi Halal',
    'Regulasi BPJPH',
    'Edukasi & Tips',
    'Berita Industri',
    'Tips UMKM',
    'Studi Kasus & Keberhasilan'
];

export const NewsEditorView = ({
    editingItem,
    formData,
    setFormData,
    onSave,
    onCancel
}: NewsEditorViewProps) => {
    const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
    const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('edit');
    const [serpView, setSerpView] = useState<'desktop' | 'mobile'>('desktop');
    const [focusKeyword, setFocusKeyword] = useState('');
    const [customCategory, setCustomCategory] = useState(false);

    // Image & Table Insert Popovers / Modals
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [imageDialogTab, setImageDialogTab] = useState<'upload' | 'url'>('upload');
    const [imageInsertData, setImageInsertData] = useState({ url: '', caption: '' });
    const [isUploadingMiddle, setIsUploadingMiddle] = useState(false);

    // Thumbnail Input Mode
    const [thumbnailTab, setThumbnailTab] = useState<'upload' | 'url'>('upload');
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [isUploadingOg, setIsUploadingOg] = useState(false);

    // Upload Helper
    const uploadMediaFile = async (file: File): Promise<string> => {
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Ukuran file maksimal 10MB');
        }
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/media/upload?subfolder=news', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.url;
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingThumbnail(true);
        try {
            const url = await uploadMediaFile(file);
            setFormData((prev: any) => ({
                ...prev,
                thumbnail_url: url,
                og_image_url: prev.og_image_url || url
            }));
            toast.success('Foto thumbnail berhasil diunggah!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Gagal mengunggah thumbnail');
        } finally {
            setIsUploadingThumbnail(false);
            e.target.value = '';
        }
    };

    const handleMiddleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingMiddle(true);
        try {
            const url = await uploadMediaFile(file);
            const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            setImageInsertData(prev => ({
                ...prev,
                url,
                caption: prev.caption || cleanName
            }));
            toast.success('Gambar artikel berhasil diunggah!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Gagal mengunggah gambar');
        } finally {
            setIsUploadingMiddle(false);
            e.target.value = '';
        }
    };

    const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingOg(true);
        try {
            const url = await uploadMediaFile(file);
            setFormData((prev: any) => ({ ...prev, og_image_url: url }));
            toast.success('Gambar social share berhasil diunggah!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Gagal mengunggah gambar');
        } finally {
            setIsUploadingOg(false);
            e.target.value = '';
        }
    };

    // Set defaults
    useEffect(() => {
        if (!formData.author_name) {
            setFormData((prev: any) => ({ ...prev, author_name: 'Tim Halal Core' }));
        }
        if (!formData.category) {
            setFormData((prev: any) => ({ ...prev, category: 'Sertifikasi Halal' }));
        }
        if (formData.is_published === undefined) {
            setFormData((prev: any) => ({ ...prev, is_published: true }));
        }
        if (formData.is_featured === undefined) {
            setFormData((prev: any) => ({ ...prev, is_featured: false }));
        }
        if (formData.show_on_landing === undefined) {
            setFormData((prev: any) => ({ ...prev, show_on_landing: true }));
        }
        if (!formData.published_at) {
            setFormData((prev: any) => ({ ...prev, published_at: new Date().toISOString() }));
        }
    }, []);

    // Auto-generate slug
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (newTitle: string) => {
        const updates: any = { title: newTitle };
        if (!editingItem && (!formData.slug || formData.slug === generateSlug(formData.title || ''))) {
            updates.slug = generateSlug(newTitle);
        }
        if (!formData.meta_title) {
            updates.meta_title = newTitle;
        }
        setFormData({ ...formData, ...updates });
    };

    // Calculate word count & reading time
    const wordCount = useMemo(() => {
        const text = (formData.content || '').replace(/<[^>]*>/g, '').trim();
        return text ? text.split(/\s+/).length : 0;
    }, [formData.content]);

    const readingTime = useMemo(() => {
        return Math.max(1, Math.ceil(wordCount / 200));
    }, [wordCount]);

    // Update reading time
    useEffect(() => {
        if (readingTime !== formData.reading_time) {
            setFormData((prev: any) => ({ ...prev, reading_time: readingTime }));
        }
    }, [readingTime]);

    // Auto update excerpt to meta_description if empty
    const handleExcerptChange = (newExcerpt: string) => {
        const updates: any = { excerpt: newExcerpt };
        if (!formData.meta_description) {
            updates.meta_description = newExcerpt;
        }
        setFormData({ ...formData, ...updates });
    };

    // Real-Time SEO Scoring Analysis
    const seoAnalysis = useMemo(() => {
        const title = formData.title || '';
        const excerpt = formData.excerpt || '';
        const content = formData.content || '';
        const slug = formData.slug || '';
        const metaDesc = formData.meta_description || excerpt;
        const hasThumbnail = Boolean(formData.thumbnail_url);
        const kw = (focusKeyword || title.split(' ')[0] || '').toLowerCase().trim();

        const checks = [
            {
                id: 'title-len',
                label: 'Panjang Judul Optimal (40 - 65 karakter)',
                passed: title.length >= 40 && title.length <= 65,
                score: 15,
                hint: `Saat ini ${title.length} karakter. Judul ideal adalah 40-60 karakter agar tidak terpotong di Google SERP.`
            },
            {
                id: 'meta-desc',
                label: 'Meta Description Optimal (110 - 165 karakter)',
                passed: metaDesc.length >= 110 && metaDesc.length <= 165,
                score: 15,
                hint: `Saat ini ${metaDesc.length} karakter. Berikan ringkasan yang menarik agar rasio klik (CTR) tinggi.`
            },
            {
                id: 'word-count',
                label: 'Kedalaman Konten Artikel (Minimal 300 kata)',
                passed: wordCount >= 300,
                score: 20,
                hint: `Saat ini ${wordCount} kata. Google memprioritaskan artikel informatif dengan minimal 300 - 1.000 kata.`
            },
            {
                id: 'has-headings',
                label: 'Struktur Sub-Judul (Mengandung H2 / ## dan H3 / ###)',
                passed: content.includes('## ') || content.includes('### '),
                score: 15,
                hint: 'Gunakan minimal 2 heading level 2 (##) untuk membagi topik pembahasan agar mudah dipindai mesin pencari.'
            },
            {
                id: 'has-media',
                label: 'Visual & Media (Foto Banner Thumbnail / Gambar Artikel)',
                passed: hasThumbnail || content.includes('!['),
                score: 15,
                hint: 'Sertakan foto cover utama dan gambar penjelas di dalam artikel untuk meningkatkan retensi pembaca.'
            },
            {
                id: 'slug-seo',
                label: 'URL Slug Ramah SEO (Huruf kecil & tanda hubung)',
                passed: slug.length > 5 && !slug.includes('_') && !slug.includes(' ') && /^[a-z0-9-]+$/.test(slug),
                score: 10,
                hint: 'Slug hanya boleh menggunakan huruf kecil, angka, dan tanda strip (-).'
            },
            {
                id: 'focus-kw',
                label: 'Distribusi Kata Kunci Target (Muncul di Judul & Konten)',
                passed: Boolean(kw && title.toLowerCase().includes(kw) && content.toLowerCase().includes(kw)),
                score: 10,
                hint: kw ? `Kata kunci "${kw}" harus muncul di judul dan paragraf artikel.` : 'Tentukan kata kunci fokus di tab SEO.'
            }
        ];

        const finalScore = checks.reduce((acc, c) => acc + (c.passed ? c.score : 0), 0);
        return { checks, finalScore };
    }, [formData, focusKeyword, wordCount]);

    // Format helpers for text area
    const insertFormat = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = formData.content || '';
        const selected = currentText.substring(start, end) || 'teks';
        const replacement = `${prefix}${selected}${suffix}`;

        const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
        setFormData({ ...formData, content: newContent });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        }, 50);
    };

    // Insert Table helper
    const insertTableTemplate = () => {
        const tableTemplate = `\n\n| No | Kategori / Komponen | Keterangan & Persyaratan |\n|---|---|---|\n| 1 | Bahan Baku Utama | Bersertifikat Halal Resmi |\n| 2 | Bahan Tambahan | Terdaftar dalam Positive List |\n| 3 | Fasilitas Produksi | Bebas Kontaminasi Najis |\n\n`;
        const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const currentText = formData.content || '';
        const newContent = currentText.substring(0, start) + tableTemplate + currentText.substring(start);
        setFormData({ ...formData, content: newContent });
        setTimeout(() => textarea.focus(), 50);
    };

    // Insert Image with caption helper
    const handleInsertImage = () => {
        if (!imageInsertData.url) return;
        const imgMarkdown = `\n\n![${imageInsertData.caption || 'Gambar Artikel'}](${imageInsertData.url})\n\n`;
        const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const currentText = formData.content || '';
        const newContent = currentText.substring(0, start) + imgMarkdown + currentText.substring(start);
        setFormData({ ...formData, content: newContent });

        setImageInsertData({ url: '', caption: '' });
        setShowImageDialog(false);
        setTimeout(() => textarea.focus(), 50);
    };

    return (
        <div className="space-y-6">
            {/* Top Action Header Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <div className="h-5 w-px bg-gray-200"></div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            {editingItem ? 'Edit Artikel & Optimasi SEO' : 'Tulis Artikel & Berita Baru'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            Kelola konten, unggah gambar, dan optimalkan metadata untuk Google SERP & Media Sosial
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Highlight Toggle */}
                    <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                        formData.is_featured ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                        <input
                            type="checkbox"
                            checked={formData.is_featured ?? false}
                            onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <Star className={`w-3.5 h-3.5 ${formData.is_featured ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                        <span>{formData.is_featured ? 'Highlight' : 'Highlight'}</span>
                    </label>

                    {/* Show on Landing Toggle */}
                    <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                        formData.show_on_landing !== false ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs' : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                        <input
                            type="checkbox"
                            checked={formData.show_on_landing !== false}
                            onChange={e => setFormData({ ...formData, show_on_landing: e.target.checked })}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                        />
                        <Home className="w-3.5 h-3.5 text-teal-600" />
                        <span>{formData.show_on_landing !== false ? 'Di Beranda' : 'Non-Beranda'}</span>
                    </label>

                    {/* Publication Status Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                        <input
                            type="checkbox"
                            checked={formData.is_published ?? true}
                            onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{formData.is_published ? '🟢 Siap Terbit' : '🟡 Draf'}</span>
                    </label>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            {editingItem ? 'Perbarui Artikel' : 'Simpan & Publikasikan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Tabs Navigation (Konten vs SEO Studio) */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 pt-3 rounded-t-2xl shadow-sm">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'content'
                                ? 'text-brand-600 border-brand-600 bg-brand-50/50 rounded-t-xl'
                                : 'text-gray-500 hover:text-gray-900 border-transparent'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Editor Konten Artikel
                    </button>
                    <button
                        onClick={() => setActiveTab('seo')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'seo'
                                ? 'text-brand-600 border-brand-600 bg-brand-50/50 rounded-t-xl'
                                : 'text-gray-500 hover:text-gray-900 border-transparent'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        SEO Studio & Live Preview
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            seoAnalysis.finalScore >= 80
                                ? 'bg-emerald-100 text-emerald-700'
                                : seoAnalysis.finalScore >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {seoAnalysis.finalScore}%
                        </span>
                    </button>
                </div>

                {activeTab === 'content' && (
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-2">
                        <button
                            type="button"
                            onClick={() => setViewMode('edit')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'edit' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Editor
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('preview')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'preview' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Pratinjau Hasil
                        </button>
                    </div>
                )}
            </div>

            {/* Tab 1: Content Editorial Workspace */}
            {activeTab === 'content' && (
                <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-gray-100 shadow-sm space-y-6">
                    {/* Title Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Judul Artikel <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-xs font-semibold ${
                                (formData.title || '').length >= 40 && (formData.title || '').length <= 65
                                    ? 'text-emerald-600'
                                    : 'text-gray-400'
                            }`}>
                                {(formData.title || '').length} / 60 karakter (Optimal: 40-60)
                            </span>
                        </div>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Panduan Lengkap Sertifikasi Halal Gratis (SEHATI) 2026 untuk Pelaku UMKM"
                            className="w-full px-4 py-3 text-lg font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-all text-gray-900"
                            value={formData.title || ''}
                            onChange={e => handleTitleChange(e.target.value)}
                        />
                    </div>

                    {/* Meta Fields Grid (Slug & Category) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Slug */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Slug URL (SEO Friendly)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title || '') })}
                                    className="text-[11px] font-bold text-brand-600 hover:underline"
                                >
                                    Auto Generate
                                </button>
                            </div>
                            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
                                <span className="text-xs text-gray-400 font-mono">/news/</span>
                                <input
                                    type="text"
                                    required
                                    className="w-full text-xs font-mono bg-transparent outline-none text-gray-800 ml-1"
                                    value={formData.slug || ''}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="panduan-halal-sehati-2026"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Kategori Artikel
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setCustomCategory(!customCategory)}
                                    className="text-[11px] font-bold text-brand-600 hover:underline"
                                >
                                    {customCategory ? 'Pilih Kategori Populer' : '+ Tulis Kategori Baru'}
                                </button>
                            </div>
                            {customCategory ? (
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={formData.category || ''}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Ketik kategori baru..."
                                />
                            ) : (
                                <select
                                    className="w-full px-3 py-2.5 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-700"
                                    value={formData.category || 'Sertifikasi Halal'}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {POPULAR_CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Excerpt / Ringkasan */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Ringkasan Artikel (Excerpt)
                            </label>
                            <span className={`text-xs font-medium ${
                                (formData.excerpt || '').length >= 110 && (formData.excerpt || '').length <= 165
                                    ? 'text-emerald-600'
                                    : 'text-gray-400'
                            }`}>
                                {(formData.excerpt || '').length} / 160 karakter (Tampil pada kartu & SERP Google)
                            </span>
                        </div>
                        <textarea
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm h-20 resize-none text-gray-700"
                            value={formData.excerpt || ''}
                            onChange={e => handleExcerptChange(e.target.value)}
                            placeholder="Ringkasan singkat dan padat mengenai inti artikel untuk menarik perhatian pembaca..."
                        />
                    </div>

                    {/* Rich Formatting Toolbar & Content Area */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Konten Artikel (Markdown Format) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <span>{wordCount} Kata</span>
                                <span>•</span>
                                <span>~{readingTime} Menit Membaca</span>
                            </div>
                        </div>

                        {/* Formatting Toolbar */}
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-gray-200 rounded-t-xl">
                            {/* Text Styling */}
                            <button type="button" onClick={() => insertFormat('**', '**')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs flex items-center gap-1 text-xs font-bold" title="Tebal (Bold)"><Bold className="w-3.5 h-3.5" /> Tebal</button>
                            <button type="button" onClick={() => insertFormat('*', '*')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs flex items-center gap-1 text-xs italic" title="Miring (Italic)"><Italic className="w-3.5 h-3.5" /> Miring</button>
                            
                            <span className="w-px h-5 bg-gray-300 mx-1"></span>

                            {/* Headings */}
                            <button type="button" onClick={() => insertFormat('## ')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs flex items-center gap-1 text-xs font-bold" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /> H2</button>
                            <button type="button" onClick={() => insertFormat('### ')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs flex items-center gap-1 text-xs font-bold" title="Heading 3"><Heading3 className="w-3.5 h-3.5" /> H3</button>

                            <span className="w-px h-5 bg-gray-300 mx-1"></span>

                            {/* Image Insert Action */}
                            <button 
                                type="button" 
                                onClick={() => setShowImageDialog(!showImageDialog)} 
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shadow-xs flex items-center gap-1.5 transition-all ${
                                    showImageDialog ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                                title="Sisipkan Gambar ke Tengah Artikel"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>+ Gambar</span>
                            </button>

                            {/* Table Insert Action */}
                            <button 
                                type="button" 
                                onClick={insertTableTemplate} 
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200 shadow-xs flex items-center gap-1.5 transition-all"
                                title="Sisipkan Template Tabel Markdown"
                            >
                                <TableIcon className="w-3.5 h-3.5 text-blue-700" />
                                <span>+ Sisipkan Tabel</span>
                            </button>

                            <span className="w-px h-5 bg-gray-300 mx-1"></span>

                            {/* Lists & Extras */}
                            <button type="button" onClick={() => insertFormat('- ')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => insertFormat('1. ')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => insertFormat('> ')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs" title="Kutipan (Quote)"><Quote className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => insertFormat('> 💡 **Tips Halal Core:** ')} className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 shadow-xs" title="Callout Tips Box">💡 Tips Box</button>
                            <button type="button" onClick={() => insertFormat('[Teks Link](', ')')} className="p-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-xs" title="Sisipkan Tautan"><Link2 className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => insertFormat('\n---\n')} className="px-2 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-mono border border-gray-200 shadow-xs" title="Garis Pembatas">---</button>
                        </div>

                        {/* Image Insertion Dialog Popover with Direct Upload & URL */}
                        {showImageDialog && (
                            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 shadow-md">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4 text-emerald-700" />
                                            Sisipkan Gambar ke Posisi Kursor
                                        </h4>
                                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200">
                                            <button
                                                type="button"
                                                onClick={() => setImageDialogTab('upload')}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                    imageDialogTab === 'upload' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                📤 Unggah File (Komputer)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setImageDialogTab('url')}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                    imageDialogTab === 'url' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                🔗 Tempel URL Link
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowImageDialog(false)}
                                        className="p-1 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {imageDialogTab === 'upload' ? (
                                    <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-200">
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="middle-image-upload-input"
                                                className="hidden"
                                                onChange={handleMiddleImageUpload}
                                                disabled={isUploadingMiddle}
                                            />
                                            <label
                                                htmlFor="middle-image-upload-input"
                                                className={`flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                                    isUploadingMiddle
                                                        ? 'bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed'
                                                        : 'bg-emerald-50/50 border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-500'
                                                }`}
                                            >
                                                {isUploadingMiddle ? (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                                        <span>Mengunggah file ke server...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                                                        <span className="text-xs font-bold">Klik untuk Pilih Foto / File Gambar dari Komputer</span>
                                                        <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, JPEG, WEBP, GIF (Maksimal 10MB)</span>
                                                    </>
                                                )}
                                            </label>

                                            {imageInsertData.url && (
                                                <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden border border-emerald-200 relative shrink-0 shadow-xs">
                                                    <img
                                                        src={getMediaUrl(imageInsertData.url)}
                                                        alt="Uploaded preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded p-0.5">
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {imageInsertData.url && (
                                            <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-mono truncate">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span className="truncate">File terunggah: {imageInsertData.url}</span>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                Keterangan / Caption Gambar (Opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={imageInsertData.caption}
                                                onChange={e => setImageInsertData({ ...imageInsertData, caption: e.target.value })}
                                                placeholder="Contoh: Tim Auditor Halal Core saat melakukan verifikasi..."
                                                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-emerald-200">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                URL Gambar (https://...) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={imageInsertData.url}
                                                onChange={e => setImageInsertData({ ...imageInsertData, url: e.target.value })}
                                                placeholder="https://images.unsplash.com/..."
                                                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                Keterangan / Caption Gambar (Opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={imageInsertData.caption}
                                                onChange={e => setImageInsertData({ ...imageInsertData, caption: e.target.value })}
                                                placeholder="Contoh: Tim Auditor Halal Core saat melakukan verifikasi..."
                                                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleInsertImage}
                                        disabled={!imageInsertData.url}
                                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:scale-105 active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" /> Sisipkan Gambar ke Kursor
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Editor vs Preview Display */}
                        {viewMode === 'preview' ? (
                            <div className="p-8 border border-gray-200 rounded-b-xl bg-slate-50 min-h-[400px]">
                                <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <ArticleContentRenderer content={formData.content || ''} />
                                </div>
                            </div>
                        ) : (
                            <textarea
                                id="news-content-textarea"
                                className="w-full px-4 py-4 text-base font-normal border border-gray-200 rounded-b-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm h-96 font-sans leading-relaxed resize-y text-gray-800"
                                value={formData.content || ''}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Mulai menulis artikel di sini... Gunakan toolbar di atas untuk menambahkan gambar di tengah artikel, tabel, teks tebal (**tebal**), judul bab (##), atau tips box."
                            />
                        )}
                    </div>

                    {/* Thumbnail Image (Upload File + URL Option), Penulis & Tag */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        {/* Thumbnail Image Section with Upload / URL */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Foto Sampul / Thumbnail Utama
                                </label>
                                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setThumbnailTab('upload')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                                            thumbnailTab === 'upload' ? 'bg-white text-brand-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        📤 Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setThumbnailTab('url')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                                            thumbnailTab === 'url' ? 'bg-white text-brand-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        🔗 Link URL
                                    </button>
                                </div>
                            </div>

                            {/* When Thumbnail Is Set: Show Preview & Quick Action Bar */}
                            {formData.thumbnail_url ? (
                                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 group shadow-sm">
                                    <div className="h-44 w-full overflow-hidden flex items-center justify-center">
                                        <img
                                            src={getMediaUrl(formData.thumbnail_url)}
                                            alt="Preview Thumbnail"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                        />
                                    </div>
                                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 bg-black/70 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        Thumbnail Terpasang
                                    </div>
                                    <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-mono text-gray-500 truncate max-w-[200px]">
                                            {formData.thumbnail_url}
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="thumbnail-replace-input"
                                                className="hidden"
                                                onChange={handleThumbnailUpload}
                                                disabled={isUploadingThumbnail}
                                            />
                                            <label
                                                htmlFor="thumbnail-replace-input"
                                                className="px-2.5 py-1 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                                            >
                                                {isUploadingThumbnail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                Ganti
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Hapus Thumbnail"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* When No Thumbnail Yet */
                                thumbnailTab === 'upload' ? (
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="thumbnail-upload-input"
                                            className="hidden"
                                            onChange={handleThumbnailUpload}
                                            disabled={isUploadingThumbnail}
                                        />
                                        <label
                                            htmlFor="thumbnail-upload-input"
                                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                                                isUploadingThumbnail
                                                    ? 'bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : 'bg-brand-50/20 border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-400'
                                            }`}
                                        >
                                            {isUploadingThumbnail ? (
                                                <div className="flex flex-col items-center gap-2 py-3">
                                                    <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
                                                    <span className="text-xs font-bold text-brand-700">Mengunggah gambar cover...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-2">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-800">Klik untuk Unggah Foto Cover / Banner</span>
                                                    <span className="text-[11px] text-gray-400 mt-1">Format: JPG, PNG, WEBP (Maksimal 10MB)</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                            value={formData.thumbnail_url || ''}
                                            onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                            placeholder="https://images.unsplash.com/photo-..."
                                        />
                                        <p className="text-[11px] text-gray-400">
                                            Masukkan link gambar online dari Unsplash, CDN, atau media eksternal.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Author & Tags */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Nama Penulis / Author
                                </label>
                                <div className="flex items-center border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white shadow-sm">
                                    <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                                    <input
                                        className="w-full text-sm outline-none bg-transparent text-gray-800 font-medium"
                                        value={formData.author_name || 'Tim Halal Core'}
                                        onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                                        placeholder="Nama penulis artikel..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Tag Artikel (Pisahkan dengan koma)
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                    value={formData.tags || ''}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="sertifikasi halal, bpjph, umkm, sihalal, ekspor"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: SEO STUDIO & LIVE PREVIEWS */}
            {activeTab === 'seo' && (
                <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-gray-100 shadow-sm space-y-6">
                    {/* Focus Keyword & Score Header */}
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-1.5 flex-1">
                            <label className="block text-xs font-black text-emerald-950 uppercase tracking-wider">
                                Target Focus Keyword (Kata Kunci Utama)
                            </label>
                            <p className="text-xs text-emerald-800 leading-relaxed">
                                Masukkan kata kunci pencarian yang ingin ditargetkan agar artikel ini berperingkat tinggi di Google.
                            </p>
                            <input
                                className="w-full px-4 py-3 bg-white text-base font-bold text-gray-900 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm mt-2"
                                value={focusKeyword}
                                onChange={e => setFocusKeyword(e.target.value)}
                                placeholder="Contoh: sertifikasi halal gratis 2026"
                            />
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-5 shrink-0">
                            <div className="text-center">
                                <div className={`text-3xl font-black ${seoAnalysis.finalScore >= 80 ? 'text-emerald-600' : seoAnalysis.finalScore >= 50 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                    {seoAnalysis.finalScore}/100
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Skor SEO Artikel
                                </div>
                            </div>
                            <div className="w-16 h-16 relative flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-gray-100"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className={seoAnalysis.finalScore >= 80 ? 'text-emerald-500' : seoAnalysis.finalScore >= 50 ? 'text-amber-500' : 'text-red-500'}
                                        strokeDasharray={`${seoAnalysis.finalScore}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <Sparkles className="w-5 h-5 absolute text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    {/* SEO Quality Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {seoAnalysis.checks.map((check) => (
                            <div key={check.id} className={`p-3.5 border rounded-xl flex items-start gap-3 transition-all ${
                                check.passed ? 'bg-emerald-50/50 border-emerald-200/80' : 'bg-slate-50 border-gray-200'
                            }`}>
                                {check.passed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-800">{check.label}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                            check.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            +{check.score} Pts
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-gray-500 leading-relaxed">{check.hint}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Live Google Search SERP Snippet Preview */}
                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-600" />
                                <h4 className="text-sm font-bold text-gray-900">
                                    Simulasi Google Search Snippet (SERP Preview)
                                </h4>
                            </div>
                            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setSerpView('desktop')}
                                    className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${serpView === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    <Monitor className="w-3.5 h-3.5" /> Desktop
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSerpView('mobile')}
                                    className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${serpView === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                                </button>
                            </div>
                        </div>

                        <div className={`p-5 bg-slate-50/80 border border-gray-200 rounded-2xl ${serpView === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                            }`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-black text-white">
                                    H
                                </div>
                                <div className="text-[12px] leading-tight text-gray-700">
                                    <div className="font-semibold text-gray-800">Halal Core</div>
                                    <div className="text-[10px] text-gray-500 truncate font-mono">
                                        https://halalcore.id/news/{formData.slug || 'judul-slug-artikel'}
                                    </div>
                                </div>
                            </div>

                            <h5 className="text-[18px] leading-snug font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-2">
                                {formData.meta_title || formData.title || 'Judul Artikel Halal Core'} | Halal Core
                            </h5>

                            <p className="text-[13px] text-[#4d5156] mt-1 line-clamp-2 leading-relaxed">
                                <span className="text-gray-400 text-[11px] mr-1">
                                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} —
                                </span>
                                {formData.meta_description || formData.excerpt || 'Ringkasan artikel berita dan panduan halal resmi yang komprehensif untuk pengusaha dan masyarakat Indonesia...'}
                            </p>
                        </div>
                    </div>

                    {/* Live Social Share Card Preview */}
                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-bold text-gray-900">
                                Simulasi Social Media Share Card (WhatsApp / Facebook / LinkedIn)
                            </h4>
                        </div>

                        <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="h-44 bg-gray-200 relative overflow-hidden">
                                {(formData.og_image_url || formData.thumbnail_url) ? (
                                    <img
                                        src={getMediaUrl(formData.og_image_url || formData.thumbnail_url)}
                                        alt="Social Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                                        <ImageIcon className="w-8 h-8 mb-1" />
                                        <span className="text-xs">Gambar Thumbnail / OG Belum Diisi</span>
                                    </div>
                                )}
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                    {formData.category || 'Berita'}
                                </span>
                            </div>
                            <div className="p-4 bg-white">
                                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                                    HALALCORE.ID
                                </div>
                                <div className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">
                                    {formData.meta_title || formData.title || 'Judul Artikel Halal Core'}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                    {formData.meta_description || formData.excerpt || 'Ringkasan artikel Halal Core...'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Meta Tags Overrides */}
                    <div className="p-6 bg-slate-50 border border-gray-200 rounded-2xl space-y-4">
                        <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                            Pengaturan Meta Tags Tingkat Lanjut (Opsional)
                        </h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Custom Meta Title (Jika ingin beda dengan judul artikel)
                                </label>
                                <input
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={formData.meta_title || ''}
                                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                                    placeholder={formData.title || 'Judul SEO...'}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Custom Meta Description (Snippet Google)
                                </label>
                                <textarea
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
                                    value={formData.meta_description || ''}
                                    onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                    placeholder={formData.excerpt || 'Deskripsi untuk Google SERP...'}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-gray-600">
                                        Gambar Social Media / OpenGraph (og:image)
                                    </label>
                                    {formData.thumbnail_url && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, og_image_url: formData.thumbnail_url })}
                                            className="text-[11px] font-bold text-brand-600 hover:underline"
                                        >
                                            Samakan dengan Thumbnail
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="og-image-upload-input"
                                        className="hidden"
                                        onChange={handleOgImageUpload}
                                        disabled={isUploadingOg}
                                    />
                                    <input
                                        className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={formData.og_image_url || ''}
                                        onChange={e => setFormData({ ...formData, og_image_url: e.target.value })}
                                        placeholder="https://... atau klik tombol upload"
                                    />
                                    <label
                                        htmlFor="og-image-upload-input"
                                        className="px-3.5 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                                    >
                                        {isUploadingOg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        Upload
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Meta Keywords (Target kata kunci dipisahkan koma)
                                </label>
                                <input
                                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={formData.meta_keywords || ''}
                                    onChange={e => setFormData({ ...formData, meta_keywords: e.target.value })}
                                    placeholder="sertifikasi halal, panduan halal mui, bpjph kemenag"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsEditorView;
