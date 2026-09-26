import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAdminNewsByID, createNews, updateNews,
  getPublicNewsCategories, type NewsInput
} from '../../services/newsService';
import {
  ArrowLeft, CheckCircle2, Eye, Globe,
  FileText, Sparkles, Layers,
  Bold, Italic, Heading2, Heading3, Quote, List,
  ListOrdered, Link as LinkIcon,
  Clock, Tag, User, Save, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_PRESETS = [
  'Edukasi Halal',
  'Regulasi BPJPH',
  'Tips & Trik UMKM',
  'Berita Halal',
  'Sistem Jaminan Halal',
  'Panduan Sertifikasi',
];

export default function NewsEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [form, setForm] = useState<NewsInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Edukasi Halal',
    thumbnail_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
    tags: 'halal, umkm, bpjph, panduan',
    author_name: 'Tim Halal Core',
    reading_time: 3,
    meta_title: '',
    meta_description: '',
    meta_keywords: 'sertifikasi halal, panduan halal bpjph, konsultasi halal online',
    canonical_url: '',
    og_image_url: '',
    is_published: true,
    is_featured: false,
    show_on_landing: true,
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    getPublicNewsCategories()
      .then(res => {
        const cats = (res.data as any)?.data || res.data;
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch(() => {});

    if (id) {
      setLoading(true);
      getAdminNewsByID(id)
        .then(res => {
          const raw = res.data;
          const a = (raw as any)?.data || raw;
          if (!a || typeof a !== 'object') {
            throw new Error('Data artikel tidak ditemukan');
          }
          setForm({
            title: a.title || '',
            slug: a.slug || '',
            excerpt: a.excerpt || '',
            content: a.content || '',
            category: a.category || 'Edukasi Halal',
            thumbnail_url: a.thumbnail_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
            tags: a.tags || '',
            author_name: a.author_name || 'Tim Halal Core',
            reading_time: a.reading_time || 3,
            meta_title: a.meta_title || a.title || '',
            meta_description: a.meta_description || a.excerpt || '',
            meta_keywords: a.meta_keywords || a.tags || '',
            canonical_url: a.canonical_url || '',
            og_image_url: a.og_image_url || a.thumbnail_url || '',
            is_published: typeof a.is_published === 'boolean' ? a.is_published : true,
            is_featured: typeof a.is_featured === 'boolean' ? a.is_featured : false,
            show_on_landing: typeof a.show_on_landing === 'boolean' ? a.show_on_landing : true,
          });
        })
        .catch((err) => {
          console.error('Error loading article:', err);
          toast.error('Gagal memuat artikel berita');
          navigate('/dashboard/news');
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const handleTitleChange = (val: string) => {
    setForm(prev => {
      const isAutoSlug = !isEditing || prev.slug === generateSlug(prev.title);
      return {
        ...prev,
        title: val,
        slug: isAutoSlug ? generateSlug(val) : prev.slug,
        meta_title: prev.meta_title ? prev.meta_title : `${val} | HalalCore`,
      };
    });
  };

  const handleContentChange = (val: string) => {
    const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
    const calculatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));
    setForm(prev => ({
      ...prev,
      content: val,
      reading_time: calculatedReadingTime,
    }));
  };

  // Text formatting insertion helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('news-content-area') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = form.content;
    const selectedText = currentText.substring(start, end);

    const replacement = prefix + (selectedText || 'teks') + suffix;
    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);

    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 50);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast.error('Judul artikel wajib diisi');
      return;
    }
    if (!form.content?.trim()) {
      toast.error('Konten artikel wajib diisi');
      return;
    }

    const payload: NewsInput = {
      ...form,
      slug: form.slug?.trim() || generateSlug(form.title),
      meta_title: form.meta_title?.trim() || `${form.title} | HalalCore`,
      meta_description: form.meta_description?.trim() || form.excerpt?.trim(),
      og_image_url: form.og_image_url?.trim() || form.thumbnail_url?.trim(),
    };

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateNews(id, payload);
        toast.success('Artikel berita berhasil diperbarui');
      } else {
        await createNews(payload);
        toast.success('Artikel berita baru berhasil diterbitkan');
      }
      navigate('/dashboard/news');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal menyimpan artikel';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = form.content.length;
  const tagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-500 font-medium">Memuat editor artikel...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-16">
      {/* ─── Top Sticky Bar ─── */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-dark-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/news')}
            className="p-2.5 rounded-xl border border-dark-200 hover:bg-dark-50 text-dark-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-brand-900 leading-tight">
              {isEditing ? 'Edit Artikel Berita' : 'Tulis Artikel Berita Baru'}
            </h1>
            <p className="text-[11px] text-dark-400 font-medium">
              CMS Berita & Optimasi SEO Telemarketing HalalCore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {form.slug && (
            <a
              href={`/news/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-dark-200 bg-white hover:bg-dark-50 text-dark-600 text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Lihat Pratinjau Publik"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Pratinjau Publik</span>
            </a>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-brand-600/20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 text-gold-300" />
                <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main 2-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Left Column: Content Editor (8 Cols) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Title & Slug Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dark-100 shadow-xs space-y-4">
            <div>
              <label className="form-label font-bold text-dark-900 text-sm">
                Judul Artikel <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Tulis judul artikel yang menarik & SEO-friendly..."
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-3 text-base sm:text-lg font-extrabold text-dark-900 rounded-2xl border border-dark-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:font-normal placeholder:text-dark-300"
              />
            </div>

            {/* Permalink Slug */}
            <div className="p-3.5 rounded-2xl bg-brand-50/40 border border-brand-100 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
              <span className="font-bold text-brand-900 whitespace-nowrap flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-600" /> Permalink:
              </span>
              <div className="flex items-center gap-1 flex-1 min-w-0 font-mono text-dark-600">
                <span className="text-dark-400">/news/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  className="flex-1 bg-white px-2.5 py-1 rounded-lg border border-dark-200 font-mono text-xs text-brand-800 focus:outline-none focus:border-brand-500"
                  placeholder="slug-artikel"
                />
              </div>
            </div>

            {/* Excerpt Box */}
            <div>
              <label className="form-label font-bold text-dark-900">
                Ringkasan / Excerpt Singkat
              </label>
              <textarea
                rows={2}
                placeholder="Tulis 1-2 kalimat ringkasan artikel yang akan tampil pada cuplikan card dan deskripsi search engine..."
                value={form.excerpt}
                onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                className="form-input text-xs sm:text-sm resize-none"
              />
            </div>
          </div>

          {/* Content Editor Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dark-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold text-dark-900 uppercase tracking-wider">
                  Isi Konten Artikel <span className="text-rose-500">*</span>
                </h3>
              </div>

              {/* Toolbar Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Tebal (Bold)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Miring (Italic)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n## ', '\n')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n### ', '\n')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Heading 3"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n> ', '\n')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Kutipan (Quote)"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n- ', '')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n1. ', '')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('[Judul Tautan](', 'https://...)')}
                  className="p-1.5 rounded-lg border border-dark-200 hover:bg-dark-50 text-dark-700"
                  title="Sisipkan Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-dark-200 mx-1" />

                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    previewMode
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewMode ? 'Mode Editor' : 'Pratinjau'}</span>
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="min-h-[450px] p-6 rounded-2xl border border-dark-200 bg-brand-50/20 text-dark-800 space-y-4 leading-relaxed font-sans text-sm sm:text-base">
                {form.content.split('\n\n').map((block, idx) => {
                  const trimmed = block.trim();
                  if (!trimmed) return null;
                  if (trimmed.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-bold text-brand-900 pt-3">{trimmed.replace('### ', '')}</h3>;
                  }
                  if (trimmed.startsWith('## ')) {
                    return <h2 key={idx} className="text-xl font-extrabold text-brand-900 pt-5 border-b border-dark-200 pb-1">{trimmed.replace('## ', '')}</h2>;
                  }
                  if (trimmed.startsWith('> ')) {
                    return <blockquote key={idx} className="p-4 rounded-xl bg-brand-100/50 border-l-4 border-brand-600 text-brand-900 font-medium italic my-2">{trimmed.replace('> ', '')}</blockquote>;
                  }
                  return <p key={idx}>{trimmed}</p>;
                })}
              </div>
            ) : (
              <textarea
                id="news-content-area"
                rows={18}
                required
                placeholder="Tulis artikel lengkap di sini. Gunakan pemisah dua enter antar paragraf untuk kerapian teks..."
                value={form.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full p-4 rounded-2xl border border-dark-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-xs sm:text-sm font-sans leading-relaxed resize-y custom-scrollbar"
              />
            )}

            {/* Word count & Reading time status */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-dark-400 font-semibold pt-1">
              <div className="flex items-center gap-3">
                <span>{wordCount} kata</span>
                <span>•</span>
                <span>{charCount} karakter</span>
              </div>
              <div className="flex items-center gap-1.5 text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimasi Baca: {form.reading_time || 1} menit</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Settings & SEO (4 Cols) ─── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Status & Visibilitas */}
          <div className="bg-white rounded-3xl p-6 border border-dark-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-dark-100 pb-3">
              <Layers className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-dark-900 uppercase tracking-wider">Status & Publikasi</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-dark-200 hover:border-brand-300 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-dark-900 block">Terbitkan (Live)</span>
                  <span className="text-[10px] text-dark-400">Dapat dibaca langsung oleh publik</span>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox w-4 h-4"
                  checked={form.is_published}
                  onChange={(e) => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-dark-200 hover:border-brand-300 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-dark-900 block">Artikel Pilihan (Featured)</span>
                  <span className="text-[10px] text-dark-400">Headline utama di portal berita</span>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox w-4 h-4"
                  checked={form.is_featured}
                  onChange={(e) => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-dark-200 hover:border-brand-300 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-dark-900 block">Tampil di Landing Page</span>
                  <span className="text-[10px] text-dark-400">Muncul di beranda depan</span>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox w-4 h-4"
                  checked={form.show_on_landing}
                  onChange={(e) => setForm(prev => ({ ...prev, show_on_landing: e.target.checked }))}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-gold-300" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Kategori & Gambar Sampul */}
          <div className="bg-white rounded-3xl p-6 border border-dark-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-dark-100 pb-3">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-dark-900 uppercase tracking-wider">Kategori & Media</h3>
            </div>

            {/* Kategori */}
            <div>
              <label className="form-label font-bold text-dark-900">Kategori</label>
              <input
                type="text"
                list="category-suggestions"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="form-input text-xs"
                placeholder="Pilih atau ketik kategori..."
              />
              <datalist id="category-suggestions">
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="form-label font-bold text-dark-900">URL Gambar Sampul</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="form-input text-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              {form.thumbnail_url && (
                <div className="mt-2.5 relative h-36 rounded-2xl overflow-hidden border border-dark-150 bg-dark-100">
                  <img
                    src={form.thumbnail_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Penulis & Tags */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="form-label font-bold text-dark-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-dark-500" /> Penulis Artikel
                </label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={(e) => setForm(prev => ({ ...prev, author_name: e.target.value }))}
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="form-label font-bold text-dark-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-dark-500" /> Tags (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="form-input text-xs"
                  placeholder="halal, umkm, bpjph, izin"
                />

                {tagsArray.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tagsArray.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-dark-100 text-dark-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Optimasi SEO & Google SERP Simulator */}
          <div className="bg-white rounded-3xl p-6 border border-dark-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-dark-100 pb-3">
              <Globe className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Optimasi Google SEO</h3>
            </div>

            {/* Google SERP Preview */}
            <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-dark-200 space-y-1">
              <div className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-brand-600" /> Pratinjau Google Search
              </div>
              <p className="text-[11px] text-dark-500 font-mono truncate">
                https://telemarketing.halalcore.id › news › {form.slug || 'slug-artikel'}
              </p>
              <h4 className="text-sm font-bold text-[#1a0dab] line-clamp-1 leading-snug">
                {form.meta_title || form.title || 'Judul Artikel HalalCore'}
              </h4>
              <p className="text-[11px] text-[#4d5156] line-clamp-2 leading-relaxed">
                {form.meta_description || form.excerpt || 'Deskripsi ringkasan artikel ini akan ditampilkan pada hasil pencarian Google...'}
              </p>
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label font-bold text-dark-900 !mb-0 text-xs">Meta Title</label>
                <span className={`text-[10px] font-mono ${(form.meta_title?.length || 0) > 60 ? 'text-rose-500 font-bold' : 'text-dark-400'}`}>
                  {form.meta_title?.length || 0} / 60
                </span>
              </div>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
                className="form-input text-xs"
                placeholder="Judul SEO untuk Google Search"
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="form-label font-bold text-dark-900 !mb-0 text-xs">Meta Description</label>
                <span className={`text-[10px] font-mono ${(form.meta_description?.length || 0) > 160 ? 'text-rose-500 font-bold' : 'text-dark-400'}`}>
                  {form.meta_description?.length || 0} / 160
                </span>
              </div>
              <textarea
                rows={3}
                value={form.meta_description}
                onChange={(e) => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
                className="form-input text-xs resize-none"
                placeholder="Deskripsi pencarian yang menarik & informatif (140-160 karakter)"
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="form-label font-bold text-dark-900 text-xs">Meta Keywords</label>
              <input
                type="text"
                value={form.meta_keywords}
                onChange={(e) => setForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                className="form-input text-xs"
                placeholder="sertifikasi halal gratis, panduan bpjph, halal mui"
              />
            </div>

            {/* OG Image */}
            <div>
              <label className="form-label font-bold text-dark-900 text-xs">OpenGraph Image (WA/FB Preview)</label>
              <input
                type="url"
                value={form.og_image_url}
                onChange={(e) => setForm(prev => ({ ...prev, og_image_url: e.target.value }))}
                className="form-input text-xs"
                placeholder="Default menggunakan gambar sampul"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
