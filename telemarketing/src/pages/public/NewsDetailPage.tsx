import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicNewsDetail, type NewsArticle } from '../../services/newsService';
import {
  Clock, Share2, ArrowRight,
  ArrowLeft, ChevronRight, Check,
  Eye, Calendar, User, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import { resolveMediaUrl } from '../../utils/imageOptimizer';
import ArticleContentRenderer from '../../components/common/ArticleContentRenderer';

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

        // Dynamic OpenGraph & Twitter Tags
        const updateMeta = (attr: 'property' | 'name', prop: string, val: string) => {
          let meta = document.querySelector(`meta[${attr}="${prop}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attr, prop);
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', val);
        };

        const resolvedCoverUrl = resolveMediaUrl(art.og_image_url || art.thumbnail_url || '/icon.png');
        const absoluteOgImage = resolvedCoverUrl.startsWith('http')
          ? resolvedCoverUrl
          : `${window.location.origin}${resolvedCoverUrl.startsWith('/') ? '' : '/'}${resolvedCoverUrl}`;

        updateMeta('property', 'og:title', art.meta_title || art.title);
        updateMeta('property', 'og:description', art.meta_description || art.excerpt || art.title);
        updateMeta('property', 'og:image', absoluteOgImage);
        updateMeta('property', 'og:image:secure_url', absoluteOgImage);
        updateMeta('property', 'og:url', window.location.href);
        updateMeta('property', 'og:type', 'article');

        updateMeta('name', 'twitter:card', 'summary_large_image');
        updateMeta('name', 'twitter:title', art.meta_title || art.title);
        updateMeta('name', 'twitter:description', art.meta_description || art.excerpt || art.title);
        updateMeta('name', 'twitter:image', absoluteOgImage);

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
          image: [absoluteOgImage],
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

// ─── Authentic Brand SVG Icons ───
const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XTwitterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
  </svg>
);

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

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  const handleShareTelegram = () => {
    if (!article) return;
    const text = encodeURIComponent(article.title);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-500 font-medium">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ─── Top Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-dark-100 shadow-xs">
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
      <div className="bg-white border-b border-dark-100">
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
      <header className="bg-white border-b border-dark-100 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-dark-100 text-brand-900 border border-dark-200">
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
            <p className="text-base sm:text-lg text-dark-600 leading-relaxed font-normal">
              {article.excerpt}
            </p>
          )}

          {/* Author, Date & Stats Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dark-100 text-xs text-dark-500">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-dark-100 text-brand-800 flex items-center justify-center font-bold font-mono">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-8 flex-1 bg-white">
        {/* Featured Cover Image */}
        {article.thumbnail_url && (
          <div className="rounded-2xl overflow-hidden border border-dark-150 shadow-xs bg-dark-100 max-h-[500px]">
            <img
              src={resolveMediaUrl(article.thumbnail_url)}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80';
              }}
            />
          </div>
        )}

        {/* Clean Article Content (Cardless, Seamless Editorial Flow) */}
        <article className="space-y-6 text-dark-800 text-base sm:text-lg leading-relaxed font-sans">
          <ArticleContentRenderer content={article.content} />

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

          {/* Social Share Strip with Authentic Brand Icons */}
          <div className="pt-6 border-t border-dark-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-dark-50/80 border border-dark-150">
            <div className="flex items-center gap-2 text-xs font-bold text-dark-700">
              <Share2 className="w-4 h-4 text-brand-700" />
              <span>Bagikan artikel ini:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleShareWA}
                className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="Bagikan ke WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFB}
                className="p-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center"
                title="Bagikan ke Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </button>

              {/* X / Twitter */}
              <button
                onClick={handleShareTwitter}
                className="p-2.5 rounded-xl bg-black hover:bg-dark-850 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center"
                title="Bagikan ke X (Twitter)"
              >
                <XTwitterIcon className="w-4 h-4" />
              </button>

              {/* Telegram */}
              <button
                onClick={handleShareTelegram}
                className="p-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center"
                title="Bagikan ke Telegram"
              >
                <TelegramIcon className="w-4 h-4" />
              </button>

              {/* LinkedIn */}
              <button
                onClick={handleShareLinkedIn}
                className="p-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#095196] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center"
                title="Bagikan ke LinkedIn"
              >
                <LinkedInIcon className="w-4 h-4" />
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-white border border-dark-200 hover:bg-dark-50 text-dark-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="Salin Tautan Artikel"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Tautan'}</span>
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
                    src={resolveMediaUrl(rel.thumbnail_url) || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=200&q=80'}
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
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/form" className="hover:text-gold-300 transition-colors">Formulir Konsultasi</Link>
            <Link to="/login" className="hover:text-white transition-colors">Portal Konsultan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
