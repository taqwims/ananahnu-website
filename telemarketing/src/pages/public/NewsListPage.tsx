import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicNews, getPublicNewsCategories, type NewsArticle } from '../../services/newsService';
import { motion } from 'framer-motion';
import {
  Search, Clock, ArrowRight, BookOpen,
  Newspaper, Menu, X, Sparkles, MessageCircle
} from 'lucide-react';
import Logo from '../../components/ui/Logo';

const MAIN_APP_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5173'
  : 'https://halalcore.id';

export default function NewsListPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  useEffect(() => {
    // Dynamic document title & canonical
    document.title = 'Berita & Edukasi Sertifikasi Halal | HalalCore';
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', window.location.href);

    getPublicNewsCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {
      page,
      limit,
    };
    if (search.trim()) params.search = search.trim();
    if (selectedCategory) params.category = selectedCategory;

    getPublicNews(params)
      .then((res) => {
        setArticles(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, selectedCategory]);

  const featuredArticle = articles.find(a => a.is_featured) || articles[0];
  const regularArticles = articles.filter(a => a.id !== featuredArticle?.id);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <div className="min-h-screen bg-brand-50/30 flex flex-col font-sans">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-brand-100/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="flex-shrink-0"
              >
                <Logo iconOnly={true} size="sm" clickable={false} />
              </motion.div>
              <div>
                <span className="font-extrabold text-base text-brand-800 tracking-tight block leading-tight">
                  HalalCore
                </span>
                <span className="text-[9px] text-gold-600 font-bold uppercase tracking-widest block -mt-0.5">
                  Berita & Edukasi
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                className="px-3.5 py-2 text-sm font-semibold text-dark-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
              >
                Beranda
              </Link>
              <Link
                to="/news"
                className="px-3.5 py-2 text-sm font-bold text-brand-700 bg-brand-50 rounded-lg transition-all"
              >
                Artikel & Berita
              </Link>
              <a
                href={`${MAIN_APP_URL}/track`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-sm font-semibold text-dark-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
              >
                Lacak Progress
              </a>
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-semibold text-dark-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
              >
                Login
              </Link>
              <Link
                to="/form"
                className="ml-1 px-5 py-2.5 bg-brand-600 hover:bg-brand-550 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-brand-600/20 flex items-center gap-1.5 active:scale-[0.97]"
              >
                Konsultasi Sekarang <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-dark-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-brand-100/60 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-brand-50 rounded-xl"
            >
              Beranda
            </Link>
            <Link
              to="/news"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-bold text-brand-700 bg-brand-50 rounded-xl"
            >
              Artikel & Berita
            </Link>
            <Link
              to="/form"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full px-4 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl text-center shadow-sm"
            >
              Konsultasi Sekarang →
            </Link>
          </div>
        )}
      </nav>

      {/* ─── Hero Header ─── */}
      <section className="bg-gradient-brand text-white py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-gold-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Pusat Edukasi & Informasi Halal
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Wawasan & Berita Terkini Sertifikasi Halal
            </h1>
            <p className="text-sm sm:text-base text-brand-100/80 leading-relaxed font-medium">
              Pelajari regulasi BPJPH, tips lolos audit halal, panduan sertifikasi gratis Self Declare, hingga update kebijakan halal nasional untuk kemajuan bisnis Anda.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-2 border-b border-dark-100">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            <button
              onClick={() => {
                setSelectedCategory('');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === ''
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white border border-dark-200 text-dark-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              Semua Topik
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-white border border-dark-200 text-dark-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari artikel edukasi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-dark-200 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-dark-400 font-medium">Memuat artikel terbaru...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dark-100 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-dark-300 mx-auto" />
            <h3 className="text-base font-bold text-dark-800">Tidak ada artikel yang cocok</h3>
            <p className="text-xs text-dark-400 max-w-sm mx-auto">
              Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Hero Article (if page 1 and no specific search) */}
            {page === 1 && !search && featuredArticle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden rounded-3xl border border-brand-100/80 bg-white shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-64 sm:h-80 lg:h-96 overflow-hidden relative">
                    <img
                      src={featuredArticle.thumbnail_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80'}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gold-400 text-brand-950 shadow-md">
                        Pilihan Utama
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-dark-400 font-semibold">
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-800 font-bold text-[11px]">
                        {featuredArticle.category || 'Edukasi Halal'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {featuredArticle.reading_time || 3} mnt baca
                      </span>
                    </div>

                    <Link to={`/news/${featuredArticle.slug}`}>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-brand-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {featuredArticle.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-dark-500 line-clamp-3 leading-relaxed">
                      {featuredArticle.excerpt || featuredArticle.content.slice(0, 160)}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-dark-400 font-medium">
                        {formatDate(featuredArticle.published_at)}
                      </span>
                      <Link
                        to={`/news/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 group-hover:text-brand-900"
                      >
                        Baca Selengkapnya <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid of Articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(page === 1 && !search ? regularArticles : articles).map((article, idx) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-dark-100 shadow-xs hover:shadow-xl hover:border-brand-200 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <Link to={`/news/${article.slug}`} className="block relative h-48 overflow-hidden bg-dark-100">
                    <img
                      src={article.thumbnail_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-md text-brand-800 shadow-sm">
                        {article.category || 'Berita Halal'}
                      </span>
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-dark-400 font-semibold">
                        <span>{formatDate(article.published_at)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {article.reading_time || 3} mnt
                        </span>
                      </div>

                      <Link to={`/news/${article.slug}`}>
                        <h3 className="font-extrabold text-dark-900 text-base leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-dark-500 line-clamp-2 leading-relaxed">
                        {article.excerpt || article.content.slice(0, 120)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-dark-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-dark-400 truncate max-w-[150px]">
                        {article.author_name || 'Tim Halal Core'}
                      </span>
                      <Link
                        to={`/news/${article.slug}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        Baca <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-dark-200 bg-white disabled:opacity-30 hover:bg-dark-50 transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="text-xs font-bold px-4 py-2 bg-brand-50 text-brand-800 rounded-xl">
                  {page} / {Math.ceil(total / limit)}
                </span>
                <button
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-dark-200 bg-white disabled:opacity-30 hover:bg-dark-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Bottom Consultation CTA Banner ─── */}
        <section className="bg-gradient-brand text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-xl mt-12">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
            <Newspaper className="w-72 h-72" />
          </div>
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-gold-300 text-[11px] font-black uppercase tracking-wider inline-block">
              Konsultasi Halal Online
            </span>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              Ingin Usaha Anda Segera Memiliki Sertifikat Halal Resmi?
            </h2>
            <p className="text-xs sm:text-sm text-brand-100/80 leading-relaxed font-medium">
              Konsultasikan produk, bahan baku, dan skala bisnis Anda langsung bersama konsultan profesional HalalCore.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/form"
                className="px-6 py-3 bg-gradient-gold text-[#00261f] font-extrabold text-xs sm:text-sm rounded-full hover:brightness-105 transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                Mulai Konsultasi Gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/6281564955280"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-full transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp Support
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[#00261f] text-white mt-16 border-t border-brand-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between text-xs text-brand-100/60 gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="white" clickable={false} />
            <span>&copy; {new Date().getFullYear()} HalalCore - PT Ana Nahnu Indonesia.</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <Link to="/news" className="hover:text-white transition-colors">Berita</Link>
            <Link to="/form" className="hover:text-gold-300 transition-colors">Formulir Konsultasi</Link>
            <Link to="/login" className="hover:text-white transition-colors">Portal Konsultan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
