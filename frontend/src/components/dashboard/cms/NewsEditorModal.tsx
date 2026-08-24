import { useState, useEffect, useMemo } from 'react';
import { 
    X, Sparkles, Globe, Share2, CheckCircle2, AlertCircle, 
    FileText, Eye, Bold, Italic, Heading2, Heading3, 
    List, ListOrdered, Quote, Link2, Image, Clock, User, 
    AlertTriangle, Smartphone, Monitor
} from 'lucide-react';
import type { News } from '../../../types';

interface NewsEditorModalProps {
    editingItem: News | null;
    formData: Partial<News>;
    setFormData: (v: any) => void;
    onSave: () => void;
    onClose: () => void;
}

const POPULAR_CATEGORIES = [
    'Sertifikasi Halal',
    'Regulasi BPJPH',
    'Edukasi & Tips',
    'Berita Industri',
    'Tips UMKM',
    'Studi Kasus & Keberhasilan'
];

export const NewsEditorModal = ({
    editingItem,
    formData,
    setFormData,
    onSave,
    onClose
}: NewsEditorModalProps) => {
    const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
    const [previewMode, setPreviewMode] = useState(false);
    const [serpView, setSerpView] = useState<'desktop' | 'mobile'>('desktop');
    const [focusKeyword, setFocusKeyword] = useState('');
    const [customCategory, setCustomCategory] = useState(false);

    // Default values
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
        if (!formData.published_at) {
            setFormData((prev: any) => ({ ...prev, published_at: new Date().toISOString() }));
        }
    }, []);

    // Auto-generate slug from title if slug not manually customized
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

    // Update reading time when content changes
    useEffect(() => {
        setFormData((prev: any) => ({ ...prev, reading_time: readingTime }));
    }, [readingTime]);

    // SEO Score & Checklist Analysis
    const seoAnalysis = useMemo(() => {
        const title = formData.meta_title || formData.title || '';
        const desc = formData.meta_description || formData.excerpt || '';
        const content = formData.content || '';
        const slug = formData.slug || '';
        const keyword = focusKeyword.trim().toLowerCase();

        const checks = [
            {
                label: 'Panjang Judul SEO (40 - 60 karakter)',
                status: title.length >= 40 && title.length <= 65 ? 'good' : title.length > 0 && title.length < 40 ? 'warning' : 'bad',
                message: title.length === 0 ? 'Judul masih kosong' : `${title.length} karakter (${title.length >= 40 && title.length <= 65 ? 'Optimal' : title.length < 40 ? 'Terlalu pendek' : 'Terlalu panjang'})`,
                weight: 15
            },
            {
                label: 'Panjang Meta Deskripsi (120 - 160 karakter)',
                status: desc.length >= 110 && desc.length <= 165 ? 'good' : desc.length > 0 ? 'warning' : 'bad',
                message: desc.length === 0 ? 'Deskripsi belum diisi' : `${desc.length} karakter (${desc.length >= 110 && desc.length <= 165 ? 'Optimal' : desc.length < 110 ? 'Kurang panjang' : 'Terlalu panjang'})`,
                weight: 15
            },
            {
                label: 'Struktur URL Slug Bersih & Ramah SEO',
                status: slug && /^[a-z0-9-]+$/.test(slug) && slug.length <= 80 ? 'good' : slug ? 'warning' : 'bad',
                message: slug ? (slug.length <= 80 ? 'Format URL slug valid' : 'Slug terlalu panjang') : 'Slug belum ditentukan',
                weight: 15
            },
            {
                label: 'Gambar Thumbnail / Open Graph',
                status: formData.thumbnail_url ? 'good' : 'bad',
                message: formData.thumbnail_url ? 'Thumbnail tersedia untuk sharing' : 'Belum ada gambar thumbnail',
                weight: 15
            },
            {
                label: 'Kedalaman Konten (> 300 kata)',
                status: wordCount >= 300 ? 'good' : wordCount >= 100 ? 'warning' : 'bad',
                message: `${wordCount} kata (${wordCount >= 300 ? 'Bagus untuk SEO' : 'Disarankan minimal 300 kata'})`,
                weight: 15
            },
            {
                label: 'Keyword di Judul Artikel',
                status: !keyword ? 'neutral' : title.toLowerCase().includes(keyword) ? 'good' : 'warning',
                message: !keyword ? 'Masukkan focus keyword untuk analisa' : title.toLowerCase().includes(keyword) ? 'Keyword ditemukan di judul' : 'Keyword tidak ditemukan di judul',
                weight: 10
            },
            {
                label: 'Keyword di Slug & Konten',
                status: !keyword ? 'neutral' : (slug.toLowerCase().includes(generateSlug(keyword)) && content.toLowerCase().includes(keyword)) ? 'good' : 'warning',
                message: !keyword ? 'Masukkan focus keyword' : 'Ditemukan di slug & isi artikel',
                weight: 15
            }
        ];

        let score = 0;
        let totalWeight = 0;
        checks.forEach(c => {
            if (c.status !== 'neutral') {
                totalWeight += c.weight;
                if (c.status === 'good') score += c.weight;
                else if (c.status === 'warning') score += Math.floor(c.weight * 0.5);
            }
        });

        const finalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
        return { checks, finalScore };
    }, [formData, focusKeyword, wordCount]);

    // Quick formatting tool for content
    const insertFormat = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = formData.content || '';
        const selected = currentText.substring(start, end) || 'Teks di sini';
        const replacement = `${prefix}${selected}${suffix}`;

        const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
        setFormData({ ...formData, content: newContent });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        }, 50);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-[#004033] to-[#00261f] text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold-500/20 rounded-xl border border-gold-500/30">
                            <Sparkles className="w-5 h-5 text-gold-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">
                                {editingItem ? 'Edit Artikel & Optimasi SEO' : 'Tulis Berita / Artikel Baru'}
                            </h3>
                            <p className="text-xs text-brand-100/70">
                                Lengkapi konten dan optimalkan metadata untuk Google SERP & media sosial
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-brand-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs Bar */}
                <div className="px-6 pt-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-t border-x ${
                                activeTab === 'content'
                                    ? 'bg-white text-brand-700 border-gray-200 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            Konten Artikel
                        </button>
                        <button
                            onClick={() => setActiveTab('seo')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-t border-x ${
                                activeTab === 'seo'
                                    ? 'bg-white text-brand-700 border-gray-200 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 border-transparent'
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

                    {/* Published toggle shortcut */}
                    <div className="flex items-center gap-3 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.is_published ?? true}
                                onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{formData.is_published ? '🟢 Siap Diterbitkan' : '🟡 Simpan sebagai Draf'}</span>
                        </label>
                    </div>
                </div>

                {/* Body Content (Scrollable) */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* TAB 1: KONTEN UTAMA */}
                    {activeTab === 'content' && (
                        <div className="space-y-5">
                            {/* Judul Berita */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Judul Artikel <span className="text-red-500">*</span>
                                    </label>
                                    <span className={`text-xs font-medium ${
                                        (formData.title || '').length >= 40 && (formData.title || '').length <= 65
                                            ? 'text-emerald-600'
                                            : 'text-gray-400'
                                    }`}>
                                        {(formData.title || '').length} / 60 karakter (Ideal: 40-60)
                                    </span>
                                </div>
                                <input
                                    className="w-full px-4 py-3 text-base font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm"
                                    value={formData.title || ''}
                                    onChange={e => handleTitleChange(e.target.value)}
                                    placeholder="Contoh: Panduan Lengkap Cara Mengurus Sertifikasi Halal Gratis 2026..."
                                />
                            </div>

                            {/* Slug URL & Kategori */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            Generate Otomatis
                                        </button>
                                    </div>
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white">
                                        <span className="px-3 text-xs text-gray-400 font-mono select-none">/news/</span>
                                        <input
                                            className="w-full py-2.5 pr-3 text-xs font-mono bg-transparent outline-none text-gray-800"
                                            value={formData.slug || ''}
                                            onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                                            placeholder="panduan-sertifikasi-halal-2026"
                                        />
                                    </div>
                                </div>

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
                                            {customCategory ? 'Pilih dari List' : '+ Kategori Kustom'}
                                        </button>
                                    </div>
                                    {customCategory ? (
                                        <input
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                            value={formData.category || ''}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="Tulis nama kategori baru..."
                                        />
                                    ) : (
                                        <select
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm bg-white"
                                            value={formData.category || POPULAR_CATEGORIES[0]}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {POPULAR_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Ringkasan / Excerpt */}
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
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm h-20 resize-none"
                                    value={formData.excerpt || ''}
                                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                    placeholder="Tuliskan intisari singkat artikel (1-2 kalimat menarik)..."
                                />
                            </div>

                            {/* Konten Editor dengan Toolbar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Isi Konten Artikel <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5 text-brand-600" /> {wordCount} kata
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" /> ~{readingTime} menit baca
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode(!previewMode)}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold flex items-center gap-1 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            {previewMode ? 'Mode Edit' : 'Live Preview'}
                                        </button>
                                    </div>
                                </div>

                                {/* Toolbar */}
                                {!previewMode && (
                                    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-xl">
                                        <button type="button" onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold" title="Tebal (Bold)"><Bold className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => insertFormat('*', '*')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Miring (Italic)"><Italic className="w-4 h-4" /></button>
                                        <span className="w-px h-5 bg-gray-300 mx-1"></span>
                                        <button type="button" onClick={() => insertFormat('## ')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold text-xs flex items-center" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => insertFormat('### ')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold text-xs flex items-center" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
                                        <span className="w-px h-5 bg-gray-300 mx-1"></span>
                                        <button type="button" onClick={() => insertFormat('- ')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Bullet List"><List className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => insertFormat('1. ')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => insertFormat('> ')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Kutipan (Quote)"><Quote className="w-4 h-4" /></button>
                                        <span className="w-px h-5 bg-gray-300 mx-1"></span>
                                        <button type="button" onClick={() => insertFormat('[Teks Link](', ')')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Sisipkan Link"><Link2 className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => insertFormat('![Deskripsi Gambar](', ')')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Sisipkan Gambar"><Image className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => insertFormat('> 💡 **Tips Halal:** ')} className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded" title="Callout Tips">💡 Tips Box</button>
                                    </div>
                                )}

                                {previewMode ? (
                                    <div className="p-6 border border-gray-200 rounded-xl bg-white min-h-[280px] max-h-[400px] overflow-y-auto prose prose-emerald max-w-none text-sm leading-relaxed">
                                        {formData.content ? (
                                            <div className="whitespace-pre-wrap">{formData.content}</div>
                                        ) : (
                                            <p className="text-gray-400 italic">Belum ada konten untuk dipratinjau.</p>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        id="news-content-textarea"
                                        className="w-full px-4 py-3 text-sm font-sans border border-gray-200 rounded-b-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm h-64 font-normal leading-relaxed resize-y"
                                        value={formData.content || ''}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Tulis isi artikel lengkap di sini. Gunakan heading ## dan ### untuk membagi bab pembahasan..."
                                    />
                                )}
                            </div>

                            {/* Thumbnail Image URL & Author */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        URL Gambar Thumbnail
                                    </label>
                                    <input
                                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                        value={formData.thumbnail_url || ''}
                                        onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                    {formData.thumbnail_url && (
                                        <div className="mt-2 relative h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                            <img 
                                                src={formData.thumbnail_url} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Penulis / Author
                                        </label>
                                        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm">
                                            <User className="w-4 h-4 text-gray-400 mr-2" />
                                            <input
                                                className="w-full text-sm outline-none bg-transparent text-gray-800"
                                                value={formData.author_name || 'Tim Halal Core'}
                                                onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                                                placeholder="Nama penulis..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Tag (Pisahkan dengan koma)
                                        </label>
                                        <input
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                            value={formData.tags || ''}
                                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                            placeholder="sertifikasi halal, bpjph, umkm, sihalal"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SEO STUDIO & LIVE PREVIEWS */}
                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            {/* Focus Keyword & Score Header */}
                            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <label className="block text-xs font-black text-emerald-900 uppercase tracking-wider">
                                        Target Focus Keyword (Kata Kunci Utama)
                                    </label>
                                    <p className="text-xs text-emerald-700">
                                        Kata kunci utama yang ingin ditargetkan agar artikel ini menduduki halaman 1 Google.
                                    </p>
                                    <input
                                        className="w-full px-4 py-2.5 bg-white text-sm font-bold text-gray-900 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm mt-2"
                                        value={focusKeyword}
                                        onChange={e => setFocusKeyword(e.target.value)}
                                        placeholder="Contoh: sertifikasi halal gratis 2026"
                                    />
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-sm flex items-center gap-4 shrink-0">
                                    <div className="text-center">
                                        <div className={`text-3xl font-black ${
                                            seoAnalysis.finalScore >= 80 ? 'text-emerald-600' : seoAnalysis.finalScore >= 50 ? 'text-amber-600' : 'text-red-600'
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

                            {/* SEO Checklist Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {seoAnalysis.checks.map((check, idx) => (
                                    <div key={idx} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-3">
                                        {check.status === 'good' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        ) : check.status === 'warning' ? (
                                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        ) : check.status === 'bad' ? (
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                            <div className="text-xs font-bold text-gray-800">{check.label}</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">{check.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Live Google Search Snippet Preview (SERP) */}
                            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
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
                                            className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                                                serpView === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            <Monitor className="w-3.5 h-3.5" /> Desktop
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSerpView('mobile')}
                                            className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                                                serpView === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            <Smartphone className="w-3.5 h-3.5" /> Mobile
                                        </button>
                                    </div>
                                </div>

                                <div className={`p-4 bg-slate-50/70 border border-gray-200 rounded-xl ${
                                    serpView === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
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

                                    <h5 className="text-[17px] leading-snug font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-2">
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

                            {/* Live Social Share Card Preview (WhatsApp / Facebook / LinkedIn) */}
                            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-emerald-600" />
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Simulasi Social Media Share Card (WhatsApp / Facebook / LinkedIn)
                                    </h4>
                                </div>

                                <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="h-44 bg-gray-200 relative overflow-hidden">
                                        {formData.thumbnail_url ? (
                                            <img
                                                src={formData.thumbnail_url}
                                                alt="Social Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                                                <Image className="w-8 h-8 mb-1" />
                                                <span className="text-xs">Gambar Thumbnail Belum Diisi</span>
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
                            <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Pengaturan Meta Tags Tingkat Lanjut (Opsional)
                                </h4>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">
                                            Custom Meta Title (Jika ingin beda dengan judul artikel)
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
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
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none h-18 resize-none"
                                            value={formData.meta_description || ''}
                                            onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                            placeholder={formData.excerpt || 'Deskripsi untuk Google SERP...'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">
                                            Meta Keywords (Target kata kunci dipisahkan koma)
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
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

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                    <div className="text-xs text-gray-500">
                        Status:{' '}
                        <span className={`font-bold ${formData.is_published ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {formData.is_published ? 'Publik (Akan Tayang)' : 'Draf (Belum Tayang)'}
                        </span>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-2.5 hover:bg-gray-200 bg-gray-100 rounded-xl text-gray-700 font-bold text-sm transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            className="flex-1 sm:flex-none px-8 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all hover:scale-105 active:scale-95"
                        >
                            {editingItem ? 'Perbarui Berita' : 'Simpan & Publikasikan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsEditorModal;
