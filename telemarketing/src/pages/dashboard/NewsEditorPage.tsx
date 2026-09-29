import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAdminNewsByID, createNews, updateNews,
  getPublicNewsCategories, uploadNewsImage, type NewsInput
} from '../../services/newsService';
import { compressImage, resolveMediaUrl } from '../../utils/imageOptimizer';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Eye, Globe,
  FileText, Sparkles, Layers,
  Bold, Italic, Heading2, Heading3, Quote, List,
  ListOrdered, Link as LinkIcon, ImagePlus, UploadCloud,
  Clock, Tag, User, Save, ExternalLink, X,
  Check, Zap, Table as TableIcon, Plus, Minus
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

const TABLE_PRESETS = [
  {
    name: 'Skema & Biaya Sertifikasi',
    cols: ['Kategori / Jalur', 'Skala Usaha', 'Biaya Layanan', 'Estimasi Waktu'],
    rows: [
      ['Self Declare (SEHATI)', 'Usaha Mikro & Kecil (UMK)', 'Rp 0 (Subsidi BPJPH)', '12 - 21 Hari Kerja'],
      ['Self Declare Mandiri', 'Usaha Mikro & Kecil (UMK)', 'Terjangkau / Bimbingan', '7 - 14 Hari Kerja'],
      ['Sertifikasi Reguler', 'Menengah, Besar & Pabrik', 'Sesuai Tarif BPJPH & LPH', '21 - 35 Hari Kerja'],
    ],
  },
  {
    name: 'Daftar Dokumen Persyaratan',
    cols: ['No', 'Nama Dokumen / Syarat', 'Keterangan Kelengkapan'],
    rows: [
      ['1', 'NIB (Nomor Induk Berusaha)', 'Berbasis risiko (OSS RBA)'],
      ['2', 'KTP & Kontak Pemilik Usaha', 'Data penanggung jawab usaha'],
      ['3', 'Daftar Bahan & Komposisi', 'Dilengkapi sertifikat halal bahan baku'],
      ['4', 'Manual SJPH / Alur Produksi', 'Didampingi Halal Advisor'],
    ],
  },
  {
    name: 'Tahapan Proses Halal',
    cols: ['Tahap', 'Aktivitas', 'Pelaksana'],
    rows: [
      ['Tahap 1', 'Konsultasi & Verifikasi Berkas', 'HalalCore & Pelaku Usaha'],
      ['Tahap 2', 'Input Data & Validasi SIHALAL', 'Pendamping PPH / Auditor'],
      ['Tahap 3', 'Sidang Fatwa & Penerbitan Sertifikat', 'Komite Fatwa MUI & BPJPH'],
    ],
  },
];

export default function NewsEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Cover image upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // In-content image modal state
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [insertTab, setInsertTab] = useState<'upload' | 'url'>('upload');
  const [insertCaption, setInsertCaption] = useState('');
  const [insertUrl, setInsertUrl] = useState('');
  const [insertFile, setInsertFile] = useState<File | null>(null);
  const [insertPreview, setInsertPreview] = useState('');
  const [uploadingInline, setUploadingInline] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);

  // Table Generator Modal State
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableColCount, setTableColCount] = useState(3);
  const [tableRowCount, setTableRowCount] = useState(3);
  const [tableHeaders, setTableHeaders] = useState<string[]>(['Kolom 1', 'Kolom 2', 'Kolom 3']);

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

  // ─── Handle Cover Image Upload ───
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const toastId = toast.loading('Mengompres & mengunggah gambar sampul...');
    try {
      const compressed = await compressImage(file, { maxWidth: 1400, quality: 0.84 });
      const res = await uploadNewsImage(compressed);
      const uploadedUrl = res.data.url;

      setForm(prev => ({
        ...prev,
        thumbnail_url: uploadedUrl,
        og_image_url: prev.og_image_url || uploadedUrl,
      }));
      toast.success('Gambar sampul berhasil diunggah & dioptimasi!', { id: toastId });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal mengunggah gambar sampul';
      toast.error(msg, { id: toastId });
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // ─── Handle In-Content Image Selection ───
  const handleInlineFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInsertFile(file);
    const objectUrl = URL.createObjectURL(file);
    setInsertPreview(objectUrl);
    if (!insertCaption) {
      const defaultName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setInsertCaption(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    }
  };

  // ─── Submit In-Content Image to Editor ───
  const handleInsertInlineImage = async () => {
    let finalUrl = insertUrl.trim();

    if (insertTab === 'upload') {
      if (!insertFile) {
        toast.error('Silakan pilih berkas gambar terlebih dahulu');
        return;
      }

      setUploadingInline(true);
      const toastId = toast.loading('Mengompres & mengunggah gambar ke server...');
      try {
        const compressed = await compressImage(insertFile, { maxWidth: 1280, quality: 0.82 });
        const res = await uploadNewsImage(compressed);
        finalUrl = res.data.url;
        toast.success('Gambar berhasil diunggah!', { id: toastId });
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal mengunggah gambar';
        toast.error(msg, { id: toastId });
        setUploadingInline(false);
        return;
      } finally {
        setUploadingInline(false);
      }
    } else {
      if (!finalUrl) {
        toast.error('Masukkan URL gambar');
        return;
      }
    }

    const captionText = insertCaption.trim() || 'Foto Ilustrasi';
    const markdownTag = `\n\n![${captionText}](${finalUrl})\n\n`;

    const textarea = document.getElementById('news-content-area') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = form.content;
      const updated = current.substring(0, start) + markdownTag + current.substring(end);
      handleContentChange(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + markdownTag.length, start + markdownTag.length);
      }, 60);
    } else {
      handleContentChange(form.content + markdownTag);
    }

    setInsertModalOpen(false);
    setInsertCaption('');
    setInsertUrl('');
    setInsertFile(null);
    setInsertPreview('');
    toast.success('Gambar berhasil disisipkan di posisi kursor!');
  };

  // ─── Table Insertion Handlers ───
  const handleColCountChange = (delta: number) => {
    const next = Math.max(2, Math.min(8, tableColCount + delta));
    setTableColCount(next);
    setTableHeaders(prev => {
      const updated = [...prev];
      while (updated.length < next) {
        updated.push(`Kolom ${updated.length + 1}`);
      }
      return updated.slice(0, next);
    });
  };

  const handleApplyPresetTable = (preset: typeof TABLE_PRESETS[0]) => {
    let md = `\n\n| ${preset.cols.join(' | ')} |\n`;
    md += `| ${preset.cols.map(() => ':---').join(' | ')} |\n`;
    for (const r of preset.rows) {
      md += `| ${r.join(' | ')} |\n`;
    }
    md += '\n';

    const textarea = document.getElementById('news-content-area') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = form.content;
      const updated = current.substring(0, start) + md + current.substring(end);
      handleContentChange(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + md.length, start + md.length);
      }, 50);
    } else {
      handleContentChange(form.content + md);
    }
    setTableModalOpen(false);
    toast.success(`Tabel "${preset.name}" berhasil disisipkan!`);
  };

  const handleInsertCustomTable = () => {
    const cols = tableHeaders.slice(0, tableColCount);
    let md = `\n\n| ${cols.join(' | ')} |\n`;
    md += `| ${cols.map(() => ':---').join(' | ')} |\n`;

    for (let r = 1; r <= tableRowCount; r++) {
      const rowData = cols.map((_, cIdx) => `Baris ${r} Data ${cIdx + 1}`);
      md += `| ${rowData.join(' | ')} |\n`;
    }
    md += '\n';

    const textarea = document.getElementById('news-content-area') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = form.content;
      const updated = current.substring(0, start) + md + current.substring(end);
      handleContentChange(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + md.length, start + md.length);
      }, 50);
    } else {
      handleContentChange(form.content + md);
    }
    setTableModalOpen(false);
    toast.success('Tabel kustom berhasil disisipkan!');
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

                {/* ─── In-Content Image Insertion Button ─── */}
                <button
                  type="button"
                  onClick={() => setInsertModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Sisipkan Gambar di Posisi Kursor"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-brand-600" />
                  <span>+ Gambar</span>
                </button>

                {/* ─── In-Content Table Insertion Button ─── */}
                <button
                  type="button"
                  onClick={() => setTableModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Sisipkan Tabel Data"
                >
                  <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Tabel</span>
                </button>

                <div className="h-4 w-px bg-dark-200 mx-1" />

                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    previewMode
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewMode ? 'Mode Tulis' : 'Pratinjau'}</span>
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="min-h-[450px] p-6 rounded-2xl border border-dark-200 bg-brand-50/20 text-dark-800 space-y-4 leading-relaxed font-sans text-sm sm:text-base">
                {form.content.split('\n\n').map((block, idx) => {
                  const trimmed = block.trim();
                  if (!trimmed) return null;

                  // 1. In-Content Image Parser
                  const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
                  if (imgMatch) {
                    const caption = imgMatch[1];
                    const imgUrl = imgMatch[2];
                    return (
                      <figure key={idx} className="my-5 rounded-2xl overflow-hidden border border-dark-200 bg-white shadow-xs">
                        <img
                          src={resolveMediaUrl(imgUrl)}
                          alt={caption}
                          loading="lazy"
                          className="w-full max-h-[480px] object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        {caption && (
                          <figcaption className="p-2.5 text-center text-xs text-dark-500 font-medium italic bg-dark-50/70 border-t border-dark-100">
                            📷 {caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }

                  // 2. Table Parser (| Col 1 | Col 2 |)
                  if (trimmed.includes('|') && trimmed.includes('---')) {
                    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
                    let headerRow: string[] = [];
                    const bodyRows: string[][] = [];
                    let foundHeader = false;

                    for (const line of lines) {
                      if (line.includes('---')) continue;
                      const cleanCells = line
                        .replace(/^\|/, '')
                        .replace(/\|$/, '')
                        .split('|')
                        .map(c => c.trim());

                      if (!foundHeader && cleanCells.length > 0) {
                        headerRow = cleanCells;
                        foundHeader = true;
                      } else if (cleanCells.length > 0) {
                        bodyRows.push(cleanCells);
                      }
                    }

                    if (foundHeader) {
                      return (
                        <div key={idx} className="my-6 overflow-x-auto rounded-2xl border border-dark-200 bg-white shadow-xs">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead className="bg-brand-50/80 border-b border-dark-200 text-brand-950 font-extrabold uppercase text-[11px] tracking-wider">
                              <tr>
                                {headerRow.map((th, thIdx) => (
                                  <th key={thIdx} className="px-4 py-3 border-r border-dark-200/60 last:border-r-0">
                                    {th}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-100 text-dark-700">
                              {bodyRows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-brand-50/20 transition-colors">
                                  {row.map((td, tdIdx) => (
                                    <td key={tdIdx} className="px-4 py-3 border-r border-dark-100 last:border-r-0 leading-relaxed">
                                      {td}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                  }

                  if (trimmed.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-bold text-brand-900 pt-3">{trimmed.replace('### ', '')}</h3>;
                  }
                  if (trimmed.startsWith('## ')) {
                    return <h2 key={idx} className="text-xl font-extrabold text-brand-900 pt-5 border-b border-dark-200 pb-1">{trimmed.replace('## ', '')}</h2>;
                  }
                  if (trimmed.startsWith('> ')) {
                    return <blockquote key={idx} className="p-4 rounded-xl bg-brand-100/50 border-l-4 border-brand-600 text-brand-900 font-medium italic my-2">{trimmed.replace('> ', '')}</blockquote>;
                  }
                  return <p key={idx} className="text-dark-700">{trimmed}</p>;
                })}
              </div>
            ) : (
              <textarea
                id="news-content-area"
                rows={18}
                required
                placeholder="Tulis artikel lengkap di sini. Gunakan tombol '+ Gambar' untuk menyisipkan foto atau '+ Tabel' untuk menyisipkan tabel perbandingan/data..."
                value={form.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full p-4 rounded-2xl border border-dark-200 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-xs sm:text-sm font-sans leading-relaxed resize-y custom-scrollbar font-mono"
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
                  className="form-checkbox w-4 h-4 text-brand-600"
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
                  className="form-checkbox w-4 h-4 text-brand-600"
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
                  className="form-checkbox w-4 h-4 text-brand-600"
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
              <h3 className="text-xs font-bold text-dark-900 uppercase tracking-wider">Kategori & Media Sampul</h3>
            </div>

            {/* Kategori */}
            <div>
              <label className="form-label font-bold text-dark-900 text-xs">Kategori</label>
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

            {/* Thumbnail / Gambar Sampul dengan Upload Otomatis */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label font-bold text-dark-900 text-xs !mb-0">
                  Gambar Sampul (Cover Image)
                </label>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Auto-compress
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
              />

              {/* Upload Button Trigger & URL Input */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/40 hover:bg-brand-50 text-brand-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {uploadingCover ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah & Mengompres...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-brand-600" />
                      <span>Upload Gambar dari Perangkat</span>
                    </>
                  )}
                </button>

                <div className="relative">
                  <input
                    type="text"
                    value={form.thumbnail_url}
                    onChange={(e) => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    className="form-input text-[11px] font-mono pr-7"
                    placeholder="https://... atau /uploads/..."
                  />
                  {form.thumbnail_url && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, thumbnail_url: '' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Thumbnail */}
              {form.thumbnail_url && (
                <div className="mt-2.5 relative h-36 rounded-2xl overflow-hidden border border-dark-150 bg-dark-100 shadow-xs">
                  <img
                    src={resolveMediaUrl(form.thumbnail_url)}
                    alt="Preview Sampul"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-semibold backdrop-blur-xs">
                    Pratinjau Sampul
                  </span>
                </div>
              )}
            </div>

            {/* Penulis & Tags */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="form-label font-bold text-dark-900 flex items-center gap-1.5 text-xs">
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
                <label className="form-label font-bold text-dark-900 flex items-center gap-1.5 text-xs">
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
          </div>
        </div>
      </div>

      {/* ─── In-Content Image Insertion Modal ─── */}
      <AnimatePresence>
        {insertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!uploadingInline) setInsertModalOpen(false);
              }}
              className="fixed inset-0 bg-dark-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-dark-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dark-900">Sisipkan Gambar ke Tulisan</h3>
                    <p className="text-[11px] text-dark-400">Gambar akan muncul tepat di posisi kursor artikel Anda</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInsertModalOpen(false)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-dark-700 hover:bg-dark-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs: Upload File vs Image URL */}
              <div className="flex p-1 bg-dark-100/70 rounded-xl border border-dark-200/50">
                <button
                  type="button"
                  onClick={() => setInsertTab('upload')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    insertTab === 'upload'
                      ? 'bg-white text-brand-800 shadow-xs'
                      : 'text-dark-500 hover:text-dark-800'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File (Direkomendasikan)
                </button>
                <button
                  type="button"
                  onClick={() => setInsertTab('url')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    insertTab === 'url'
                      ? 'bg-white text-brand-800 shadow-xs'
                      : 'text-dark-500 hover:text-dark-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> URL Eksternal
                </button>
              </div>

              {/* Tab Content 1: Upload */}
              {insertTab === 'upload' ? (
                <div className="space-y-3">
                  <input
                    ref={inlineFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleInlineFileSelect}
                  />

                  {insertPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-dark-200 h-44 bg-dark-100 flex items-center justify-center">
                      <img
                        src={insertPreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setInsertFile(null);
                          setInsertPreview('');
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark-900/70 text-white hover:bg-rose-600 transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                        <Check className="w-3 h-3" /> Berkas Siap Diunggah (Auto-Compressed)
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => inlineFileInputRef.current?.click()}
                      className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-dark-800">Klik untuk pilih gambar dari komputer / HP</p>
                        <p className="text-[10px] text-dark-400 mt-0.5">JPG, PNG, WebP (Otomatis dikompres agar loading cepat & ringan)</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="form-label font-bold text-dark-900 text-xs">URL Gambar</label>
                  <input
                    type="url"
                    value={insertUrl}
                    onChange={(e) => setInsertUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... atau link gambar"
                    className="form-input text-xs"
                  />
                  {insertUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-dark-200 h-36 bg-dark-100 mt-2">
                      <img
                        src={resolveMediaUrl(insertUrl)}
                        alt="Preview URL"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Caption Field */}
              <div>
                <label className="form-label font-bold text-dark-900 text-xs">
                  Keterangan Foto / Caption (Opsional)
                </label>
                <input
                  type="text"
                  value={insertCaption}
                  onChange={(e) => setInsertCaption(e.target.value)}
                  placeholder="Contoh: Dokumen SJPH saat ditinjau auditor halal BPJPH"
                  className="form-input text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={uploadingInline}
                  onClick={() => setInsertModalOpen(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={uploadingInline || (insertTab === 'upload' && !insertFile) || (insertTab === 'url' && !insertUrl.trim())}
                  onClick={handleInsertInlineImage}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
                >
                  {uploadingInline ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-gold-300" />
                      <span>Sisipkan ke Tulisan</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Table Generator Modal ─── */}
      <AnimatePresence>
        {tableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTableModalOpen(false)}
              className="fixed inset-0 bg-dark-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-dark-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dark-900">Sisipkan Tabel Data</h3>
                    <p className="text-[11px] text-dark-400">Pilih template siap pakai atau atur jumlah kolom dan baris</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="p-1.5 rounded-lg text-dark-400 hover:text-dark-700 hover:bg-dark-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Table Templates */}
              <div>
                <label className="text-xs font-bold text-dark-800 block mb-2">
                  Template Tabel Populer
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TABLE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPresetTable(preset)}
                      className="p-2.5 rounded-xl border border-dark-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition-all group"
                    >
                      <span className="text-xs font-bold text-dark-900 group-hover:text-brand-800 block">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-dark-400 block mt-0.5">
                        {preset.cols.length} Kolom &bull; {preset.rows.length} Baris
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Grid Dimension Selector */}
              <div className="p-4 rounded-2xl bg-dark-50/70 border border-dark-150 space-y-3">
                <span className="text-xs font-bold text-dark-900 block">
                  Atau Buat Tabel Kustom
                </span>

                <div className="grid grid-cols-2 gap-4">
                  {/* Columns */}
                  <div>
                    <span className="text-[11px] text-dark-500 font-semibold block mb-1.5">Jumlah Kolom</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleColCountChange(-1)}
                        className="p-1.5 rounded-lg border border-dark-200 bg-white hover:bg-dark-50 text-dark-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-dark-900 w-8 text-center">{tableColCount}</span>
                      <button
                        type="button"
                        onClick={() => handleColCountChange(1)}
                        className="p-1.5 rounded-lg border border-dark-200 bg-white hover:bg-dark-50 text-dark-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rows */}
                  <div>
                    <span className="text-[11px] text-dark-500 font-semibold block mb-1.5">Jumlah Baris</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTableRowCount(prev => Math.max(1, prev - 1))}
                        className="p-1.5 rounded-lg border border-dark-200 bg-white hover:bg-dark-50 text-dark-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-dark-900 w-8 text-center">{tableRowCount}</span>
                      <button
                        type="button"
                        onClick={() => setTableRowCount(prev => Math.min(15, prev + 1))}
                        className="p-1.5 rounded-lg border border-dark-200 bg-white hover:bg-dark-50 text-dark-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column Headers Input */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-dark-500 font-semibold block">Nama Judul Kolom (Header)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from({ length: tableColCount }).map((_, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={tableHeaders[idx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTableHeaders(prev => {
                            const copy = [...prev];
                            copy[idx] = val;
                            return copy;
                          });
                        }}
                        className="form-input text-xs py-1.5"
                        placeholder={`Kolom ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleInsertCustomTable}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
                >
                  <Check className="w-4 h-4 text-gold-300" />
                  <span>Sisipkan Tabel Ini</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </form>
  );
}
