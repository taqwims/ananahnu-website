import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminNews, getPublicNewsCategories,
  deleteNews, toggleNewsStatus, toggleNewsFeatured,
  type NewsArticle
} from '../../services/newsService';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Newspaper, Plus, Search, Eye, Edit3, Trash2,
  ExternalLink, CheckCircle2, Clock,
  FileText, Sparkles, ChevronLeft, ChevronRight,
  TrendingUp, BookOpen, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewsManagement() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'FEATURED'>('ALL');

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Categories
  const fetchCategories = async () => {
    try {
      const res = await getPublicNewsCategories();
      setCategories(res.data.data || []);
    } catch {
      // ignore
    }
  };

  // Load News
  const fetchNews = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (statusFilter === 'PUBLISHED') params.is_published = true;
      if (statusFilter === 'DRAFT') params.is_published = false;
      if (statusFilter === 'FEATURED') params.is_featured = true;

      const res = await getAdminNews(params);
      setArticles(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Gagal memuat data berita');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [page, search, selectedCategory, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = total;
    const published = articles.filter(a => a.is_published).length;
    const featured = articles.filter(a => a.is_featured).length;
    const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
    return { totalCount, published, featured, totalViews };
  }, [articles, total]);

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleNewsStatus(id);
      toast.success('Status publikasi berhasil diubah');
      fetchNews();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await toggleNewsFeatured(id);
      toast.success('Status featured berhasil diubah');
      fetchNews();
    } catch {
      toast.error('Gagal mengubah status featured');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteNews(deleteId);
      toast.success('Artikel berita berhasil dihapus');
      setDeleteId(null);
      fetchNews();
    } catch {
      toast.error('Gagal menghapus artikel');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Stats ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-900 tracking-tight flex items-center gap-2.5">
            <Newspaper className="w-7 h-7 text-brand-600" /> CMS Berita & Artikel SEO
          </h1>
          <p className="text-dark-500 text-xs sm:text-sm font-medium mt-1">
            Kelola artikel edukasi halal, regulasi, dan optimasi SEO Google untuk menjangkau calon klien.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchNews}
            className="p-2.5 rounded-xl border border-dark-200 bg-white hover:bg-dark-50 text-dark-600 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/dashboard/news/create')}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4 text-gold-300" /> Tulis Berita Baru
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-dark-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Total Artikel</p>
            <h3 className="text-xl font-black text-brand-900 mt-0.5">{stats.totalCount}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-dark-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Terbit (Live)</p>
            <h3 className="text-xl font-black text-emerald-700 mt-0.5">{stats.published}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-dark-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Featured / Pilihan</p>
            <h3 className="text-xl font-black text-amber-700 mt-0.5">{stats.featured}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-dark-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Total Pembaca</p>
            <h3 className="text-xl font-black text-indigo-700 mt-0.5">{stats.totalViews}</h3>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="p-4 rounded-2xl bg-white border border-dark-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari judul artikel, topik, atau kata kunci..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-dark-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-dark-200 bg-white focus:outline-none focus:border-brand-500 text-dark-700"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status buttons */}
          <div className="flex items-center p-0.5 bg-dark-100/70 rounded-xl border border-dark-200/50">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'FEATURED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-brand-800 shadow-xs'
                    : 'text-dark-500 hover:text-dark-800'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'PUBLISHED' ? 'Terbit' : st === 'DRAFT' ? 'Draft' : 'Featured'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Articles Table ─── */}
      <div className="bg-white rounded-2xl border border-dark-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-dark-400 font-medium">Memuat data artikel berita...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <FileText className="w-12 h-12 text-dark-300" />
            <p className="text-sm font-bold text-dark-700">Belum ada artikel berita ditemukan</p>
            <p className="text-xs text-dark-400 max-w-sm">
              Mulai tulis artikel edukasi sertifikasi halal untuk menarik audiens calon klien Anda.
            </p>
            <button
              onClick={() => navigate('/dashboard/news/create')}
              className="btn-primary mt-2 text-xs font-bold py-2 px-4"
            >
              + Tulis Artikel Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-dark-700">
              <thead className="bg-dark-50/70 border-b border-dark-100 text-[11px] uppercase tracking-wider text-dark-500 font-bold">
                <tr>
                  <th className="px-5 py-3.5">Artikel</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">SEO & Views</th>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-brand-50/20 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="px-5 py-4 max-w-md">
                      <div className="flex items-start gap-3">
                        <img
                          src={art.thumbnail_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=300&q=80'}
                          alt={art.title}
                          className="w-14 h-14 rounded-xl object-cover border border-dark-150 flex-shrink-0 bg-dark-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-dark-900 text-sm line-clamp-2 leading-snug hover:text-brand-700">
                            {art.title}
                          </h4>
                          <p className="text-[11px] text-dark-400 font-mono mt-0.5 truncate">
                            /{art.slug}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-dark-500 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-dark-400" /> {art.reading_time || 3} mnt baca
                            </span>
                            <span className="text-[10px] text-dark-400">•</span>
                            <span className="text-[10px] text-dark-500 font-semibold truncate">
                              Oleh: {art.author_name || 'Tim Halal Core'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200/60">
                        {art.category || 'Berita Halal'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <button
                          onClick={() => handleToggleStatus(art.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                            art.is_published
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-dark-100 text-dark-600 border border-dark-200 hover:bg-dark-200'
                          }`}
                          title="Klik untuk ubah status publikasi"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${art.is_published ? 'bg-emerald-500' : 'bg-dark-400'}`} />
                          {art.is_published ? 'Published' : 'Draft'}
                        </button>

                        <button
                          onClick={() => handleToggleFeatured(art.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            art.is_featured
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-dark-50 text-dark-400 hover:bg-amber-50 hover:text-amber-800'
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {art.is_featured ? 'Featured' : 'Regular'}
                        </button>
                      </div>
                    </td>

                    {/* SEO & Views */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-dark-800">
                          <Eye className="w-3.5 h-3.5 text-dark-400" />
                          <span>{art.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            art.meta_description ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {art.meta_description ? 'SEO OK' : 'No Meta'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-[11px] text-dark-500">
                      {formatDate(art.published_at || art.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/news/${art.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-dark-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                          title="Lihat Pratinjau Halaman"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => navigate(`/dashboard/news/edit/${art.id}`)}
                          className="p-2 rounded-xl text-dark-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                          title="Edit Artikel"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteId(art.id)}
                          className="p-2 rounded-xl text-dark-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Artikel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-dark-100 flex items-center justify-between">
            <span className="text-xs text-dark-500 font-semibold">
              Menampilkan {articles.length} dari total {total} artikel
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-xl border border-dark-200 disabled:opacity-30 hover:bg-dark-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-3 py-1 bg-brand-50 text-brand-800 rounded-lg">
                Halaman {page} / {Math.ceil(total / limit)}
              </span>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(prev => prev + 1)}
                className="p-2 rounded-xl border border-dark-200 disabled:opacity-30 hover:bg-dark-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="fixed inset-0 bg-dark-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-dark-900">Hapus Artikel Ini?</h3>
                <p className="text-xs text-dark-500 mt-1">Artikel yang dihapus tidak dapat dipulihkan kembali.</p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
