import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicNewsDetail, type NewsArticle } from '../../services/newsService';
import {
  Clock, Share2, ArrowRight,
  ArrowLeft, ChevronRight, Check, MessageCircle,
  Eye, Calendar, User, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPublicNewsDetail(slug)
      .then((res) => {
        const art = res.data.data;
        setArticle(art);
        setRelatedArticles(res.data.related || []);

        // Dynamic Document Title
        const pageTitle = art.meta_title || `${art.title} | HalalCore`;
        document.title = pageTitle;

        // Dynamic Meta Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', art.meta_description || art.excerpt || art.title);

        // Dynamic Meta Keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords && art.meta_keywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        if (metaKeywords && art.meta_keywords) {
          metaKeywords.setAttribute('content', art.meta_keywords);
        }

        // Dynamic Canonical Link
        const canonicalHref = art.canonical_url || window.location.href;
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
          linkCanonical = document.createElement('link');
          linkCanonical.setAttribute('rel', 'canonical');
          document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', canonicalHref);

        // Dynamic OpenGraph Tags
        const updateOg = (prop: string, val: string) => {
          let og = document.querySelector(`meta[property="${prop}"]`);
          if (!og) {
            og = document.createElement('meta');
            og.setAttribute('property', prop);
            document.head.appendChild(og);
          }
          og.setAttribute('content', val);
        };

        updateOg('og:title', art.meta_title || art.title);
        updateOg('og:description', art.meta_description || art.excerpt || art.title);
        updateOg('og:image', art.og_image_url || art.thumbnail_url);
        updateOg('og:url', window.location.href);
        updateOg('og:type', 'article');

        // Dynamic JSON-LD Structured Data for Google Rich Snippets
        const existingScript = document.getElementById('jsonld-article');
        if (existingScript) {
          existingScript.remove();
        }
        const script = document.createElement('script');
        script.id = 'jsonld-article';
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: art.title,
          description: art.excerpt || art.meta_description,
          image: [art.thumbnail_url],
          datePublished: art.published_at || art.created_at,
          dateModified: art.updated_at || art.published_at,
          author: [{
            '@type': 'Person',
            name: art.author_name || 'Tim Halal Core',
          }],
          publisher: {
            '@type': 'Organization',
            name: 'HalalCore Indonesia',
            logo: {
              '@type': 'ImageObject',
              url: `${window.location.origin}/icon.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': window.location.href,
          },
        });
        document.head.appendChild(script);
      })
      .catch(() => {
        toast.error('Artikel berita tidak ditemukan');
      })
      .finally(() => setLoading(false));

    return () => {
      const script = document.getElementById('jsonld-article');
      if (script) script.remove();
    };
  }, [slug]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success('Tautan artikel berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWA = () => {
    if (!article) return;
    const text = encodeURIComponent(`*${article.title}*\n\nBaca artikel selengkapnya di HalalCore:\n${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFB = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!article) return;
    const text = encodeURIComponent(`${article.title} via @halalcore.id`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-500 font-medium">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-brand-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl text-center border border-dark-100 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-dark-900">Artikel Tidak Ditemukan</h2>
          <p className="text-xs text-dark-500">
            Artikel yang Anda cari mungkin telah dipindahkan atau dinonaktifkan.
          </p>
          <button
            onClick={() => navigate('/news')}
            className="btn-primary w-full text-xs font-bold py-3"
          >
            Kembali ke Halaman Berita
          </button>
        </div>
      </div>
    );
  }

  const tagsList = article.tags ? article.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-brand-50/20 flex flex-col font-sans">
      {/* ─── Top Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-brand-100/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo iconOnly={true} size="sm" clickable={false} />
              <div>
                <span className="font-extrabold text-base text-brand-800 tracking-tight block leading-tight">
                  HalalCore
                </span>
                <span className="text-[9px] text-gold-600 font-bold uppercase tracking-widest block -mt-0.5">
                  Berita & Edukasi
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/news"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-dark-600 hover:text-brand-700 px-3 py-2 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Semua Artikel
              </Link>
              <Link
                to="/form"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-550 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
              >
                Konsultasi Gratis <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Breadcrumb ─── */}
      <div className="bg-white/60 border-b border-dark-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-dark-400 overflow-x-auto whitespace-nowrap custom-scrollbar">
            <Link to="/" className="hover:text-brand-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3 text-dark-300" />
            <Link to="/news" className="hover:text-brand-700 transition-colors">Berita</Link>
            <ChevronRight className="w-3 h-3 text-dark-300" />
            <span className="text-brand-700 font-bold">{article.category || 'Edukasi Halal'}</span>
            <ChevronRight className="w-3 h-3 text-dark-300" />
            <span className="text-dark-600 truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
          </div>
        </div>
      </div>

      {/* ─── Article Header ─── */}
      <header className="bg-white border-b border-dark-100 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-200/60">
              {article.category || 'Berita Halal'}
            </span>
            {article.is_featured && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gold-400 text-brand-950">
                Artikel Pilihan
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-dark-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-sm sm:text-base text-dark-600 leading-relaxed font-medium">
              {article.excerpt}
            </p>
          )}

          {/* Author, Date & Stats Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dark-100 text-xs text-dark-500">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold font-mono">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-dark-900 leading-tight">{article.author_name || 'Tim Halal Core'}</p>
                <p className="text-[11px] text-dark-400">Konsultan & Spesialis Halal</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold text-dark-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-dark-400" />
                {formatDate(article.published_at || article.created_at)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-dark-400" />
                {article.reading_time || 3} mnt baca
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-dark-400" />
                {article.views || 0} views
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Article Main Body ─── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8 flex-1">
        {/* Featured Image */}
        {article.thumbnail_url && (
          <div className="rounded-3xl overflow-hidden border border-dark-150 shadow-md bg-dark-100 max-h-[450px]">
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Paragraphs */}
        <article className="bg-white rounded-3xl border border-dark-100 p-6 sm:p-10 shadow-xs space-y-5 text-dark-800 text-sm sm:text-base leading-relaxed font-sans">
          {article.content.split('\n\n').map((block, i) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            // Handle Markdown Subheadings (## or ###)
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={i} className="text-lg font-bold text-brand-900 pt-4 pb-1">
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={i} className="text-xl font-extrabold text-brand-900 pt-6 pb-2 border-b border-dark-100">
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={i} className="p-4 rounded-2xl bg-brand-50/60 border-l-4 border-brand-600 text-brand-900 font-medium italic my-4">
                  {trimmed.replace('> ', '')}
                </blockquote>
              );
            }

            return (
              <p key={i} className="text-dark-700 leading-relaxed font-normal">
                {trimmed}
              </p>
            );
          })}

          {/* Tags */}
          {tagsList.length > 0 && (
            <div className="pt-6 border-t border-dark-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-dark-400 mr-1">Tags:</span>
              {tagsList.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-lg text-xs font-semibold bg-dark-50 text-dark-600 border border-dark-150">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Social Share Box */}
          <div className="pt-6 border-t border-dark-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-50/30 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-dark-700">
              <Share2 className="w-4 h-4 text-brand-600" />
              <span>Bagikan artikel ini:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWA}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>

              <button
                onClick={handleShareFB}
                className="px-3.5 py-2 rounded-xl bg-[#1877F2] hover:brightness-110 text-white text-xs font-bold transition-all shadow-xs"
              >
                Facebook
              </button>

              <button
                onClick={handleShareTwitter}
                className="px-3.5 py-2 rounded-xl bg-black hover:bg-dark-800 text-white text-xs font-bold transition-all shadow-xs"
              >
                X (Twitter)
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin' : 'Salin Link'}
              </button>
            </div>
          </div>
        </article>

        {/* ─── Embedded Consultation CTA Box ─── */}
        <section className="bg-gradient-brand text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="max-w-xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-gold-300 text-xs font-extrabold uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Konsultasi Sertifikasi Halal
            </div>
            <h3 className="text-xl sm:text-2xl font-black leading-snug">
              Bingung Memulai Sertifikasi Halal untuk Produk Usaha Anda?
            </h3>
            <p className="text-xs sm:text-sm text-brand-100/80 leading-relaxed font-medium">
              Tim spesialis HalalCore siap mendampingi Anda 100% online secara gratis. Dari penentuan rute Self Declare / Reguler hingga persiapan dokumen SJPH.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/form"
                className="px-6 py-3 bg-gradient-gold text-[#00261f] font-extrabold text-xs sm:text-sm rounded-full hover:brightness-105 transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                Jadwalkan Konsultasi Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Related Articles ─── */}
        {relatedArticles.length > 0 && (
          <div className="space-y-4 pt-6">
            <h3 className="text-lg font-black text-brand-900">Artikel Terkait Lainnya</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.slice(0, 2).map((rel) => (
                <Link
                  key={rel.id}
                  to={`/news/${rel.slug}`}
                  className="p-4 rounded-2xl bg-white border border-dark-100 shadow-xs hover:shadow-md hover:border-brand-200 transition-all flex gap-3.5 items-center group"
                >
                  <img
                    src={rel.thumbnail_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=200&q=80'}
                    alt={rel.title}
                    className="w-16 h-16 rounded-xl object-cover border border-dark-150 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {rel.category || 'Berita Halal'}
                    </span>
                    <h4 className="text-xs font-bold text-dark-900 group-hover:text-brand-700 transition-colors line-clamp-2 mt-1">
                      {rel.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
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
