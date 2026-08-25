import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Clock, Eye, Share2, ArrowLeft, 
    ChevronRight, MessageCircle, 
    Facebook, Twitter, Linkedin, Copy, Check,
    Tag, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { News } from '../../types';
import SEOHead from '../../components/seo/SEOHead';
import ArticleContentRenderer from '../../components/common/ArticleContentRenderer';
import { getMediaUrl, getAbsoluteMediaUrl } from '../../utils/media';

const TELEMARKETING_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5174'
    : 'https://telemarketing.halalcore.id';

export default function NewsDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [article, setArticle] = useState<News | null>(null);
    const [relatedNews, setRelatedNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Track scroll progress
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight > 0) {
                const currentProgress = (window.scrollY / totalHeight) * 100;
                setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch article detail
    useEffect(() => {
        if (!slug) return;
        setLoading(true);

        api.get(`/public/cms/news/${slug}`)
            .then(res => {
                setArticle(res.data?.data || res.data);
                setRelatedNews(res.data?.related || []);
            })
            .catch(err => {
                console.error(err);
                toast.error('Artikel tidak ditemukan');
                navigate('/news');
            })
            .finally(() => {
                setLoading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
    }, [slug, navigate]);

    // Parse Table of Contents from content
    const tableOfContents = useMemo(() => {
        if (!article?.content) return [];
        const lines = article.content.split('\n');
        const headings: Array<{ id: string; text: string; level: number }> = [];

        lines.forEach((line: string) => {
            const h2Match = line.match(/^##\s+(.+)$/);
            const h3Match = line.match(/^###\s+(.+)$/);

            if (h2Match) {
                const text = h2Match[1].trim();
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                headings.push({ id, text, level: 2 });
            } else if (h3Match) {
                const text = h3Match[1].trim();
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                headings.push({ id, text, level: 3 });
            }
        });

        return headings;
    }, [article?.content]);

    // Copy link helper
    const handleCopyLink = () => {
        const shareBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://halalcore.id';
        const linkToCopy = article?.slug ? `${shareBaseUrl}/share/news/${article.slug}` : window.location.href;
        navigator.clipboard.writeText(linkToCopy);
        setCopied(true);
        toast.success('Tautan artikel berhasil disalin!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Formatted date string
    const formattedDate = useMemo(() => {
        if (!article?.published_at) return '';
        return new Date(article.published_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }, [article?.published_at]);

    // Tag list
    const tagList = useMemo(() => {
        if (!article?.tags) return [];
        return article.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }, [article?.tags]);

    // Google JSON-LD Article Schema
    const articleSchema = useMemo(() => {
        if (!article) return null;
        const pageUrl = `https://halalcore.id/news/${article.slug}`;
        const rawImg = article.og_image_url || article.thumbnail_url || 'https://halalcore.id/icon.png';
        const imageUrl = getAbsoluteMediaUrl(rawImg);

        return [
            {
                '@context': 'https://schema.org',
                '@type': 'NewsArticle',
                'mainEntityOfPage': {
                    '@type': 'WebPage',
                    '@id': pageUrl
                },
                'headline': article.meta_title || article.title,
                'description': article.meta_description || article.excerpt,
                'image': [imageUrl],
                'datePublished': article.published_at || article.created_at,
                'dateModified': article.updated_at || article.published_at || article.created_at,
                'author': {
                    '@type': 'Person',
                    'name': article.author_name || 'Tim Halal Core',
                    'url': 'https://halalcore.id'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': 'Halal Core',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': 'https://halalcore.id/icon.png'
                    }
                },
                'articleSection': article.category || 'Berita Halal',
                'keywords': article.meta_keywords || article.tags
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'Beranda',
                        'item': 'https://halalcore.id/'
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': 'Berita',
                        'item': 'https://halalcore.id/news'
                    },
                    {
                        '@type': 'ListItem',
                        'position': 3,
                        'name': article.title,
                        'item': pageUrl
                    }
                ]
            }
        ];
    }, [article]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-gray-500">Memuat artikel lengkap...</p>
            </div>
        );
    }

    if (!article) return null;

    const shareBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://halalcore.id';
    const shareUrl = `${shareBaseUrl}/share/news/${article.slug}`;
    const shareText = `${article.title} - Baca selengkapnya di Halal Core:`;

    return (
        <div className="min-h-screen bg-slate-50 text-gray-800 pb-20">
            {/* Dynamic SEO Meta Tags & Google JSON-LD Schema */}
            <SEOHead
                title={article.meta_title || article.title}
                description={article.meta_description || article.excerpt}
                keywords={article.meta_keywords || article.tags}
                author={article.author_name || 'Tim Halal Core'}
                ogImage={getAbsoluteMediaUrl(article.og_image_url || article.thumbnail_url)}
                ogType="article"
                canonicalUrl={`https://halalcore.id/news/${article.slug}`}
                publishedTime={article.published_at}
                modifiedTime={article.updated_at}
                section={article.category}
                tags={tagList}
                schema={articleSchema || undefined}
            />

            {/* Reading Progress Bar (Fixed Top) */}
            <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-200 z-50">
                <div 
                    className="h-full bg-gradient-to-r from-brand-600 via-emerald-500 to-gold-500 transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Article Header & Breadcrumbs */}
            <header className="bg-white border-b border-gray-100 pt-8 pb-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    {/* Navigation Back & Breadcrumb */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <Link 
                            to="/news" 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Pusat Berita
                        </Link>

                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium truncate">
                            <Link to="/" className="hover:text-gray-700">Home</Link>
                            <ChevronRight className="w-3 h-3" />
                            <Link to="/news" className="hover:text-gray-700">News</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-brand-600 font-semibold">{article.category || 'Berita Halal'}</span>
                        </div>
                    </div>

                    {/* Category Pill */}
                    <div className="mb-4">
                        <span className="px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-black uppercase tracking-wider border border-brand-100">
                            {article.category || 'Berita Halal'}
                        </span>
                    </div>

                    {/* Article Title (H1 for SEO) */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-6">
                        {article.title}
                    </h1>

                    {/* Excerpt / Lead */}
                    {article.excerpt && (
                        <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed mb-6 border-l-4 border-gold-400 pl-4 bg-gold-50/30 py-2 rounded-r-xl">
                            {article.excerpt}
                        </p>
                    )}

                    {/* Author, Date, Reading Time, Views Metas */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-600 to-[#00261f] text-white flex items-center justify-center font-bold text-sm shadow-md">
                                {article.author_name ? article.author_name.charAt(0) : 'H'}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">{article.author_name || 'Tim Halal Core'}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span>{formattedDate}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" /> ~{article.reading_time || 3} menit baca
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Views & Quick Share */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <Eye className="w-4 h-4 text-blue-500" />
                                <span className="font-bold">{(article.views || 0).toLocaleString('id-ID')}</span> views
                            </div>

                            <button
                                onClick={handleCopyLink}
                                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border border-gray-100"
                                title="Salin Tautan Artikel"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Article Content & Sidebar */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* Featured Image */}
                {article.thumbnail_url && (
                    <div className="mb-10 rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-gray-900 max-h-[500px]">
                        <img
                            src={getMediaUrl(article.thumbnail_url)}
                            alt={article.title}
                            className="w-full h-full object-cover max-h-[500px]"
                        />
                    </div>
                )}

                {/* Table of Contents (Daftar Isi) */}
                {tableOfContents.length > 1 && (
                    <div className="mb-10 p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                            <Bookmark className="w-4 h-4 text-brand-600" />
                            Daftar Isi Pembahasan
                        </div>
                        <nav className="space-y-1.5">
                            {tableOfContents.map((h, i) => (
                                <a
                                    key={i}
                                    href={`#${h.id}`}
                                    className={`block text-sm text-gray-600 hover:text-brand-600 transition-colors py-1 ${
                                        h.level === 3 ? 'pl-4 text-xs text-gray-500' : 'font-medium'
                                    }`}
                                >
                                    • {h.text}
                                </a>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Article Body */}
                <article className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
                    <ArticleContentRenderer content={article.content} />
                </article>

                {/* Tags */}
                {tagList.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-2">
                            <Tag className="w-3.5 h-3.5" /> Tags:
                        </span>
                        {tagList.map((tag, idx) => (
                            <Link
                                key={idx}
                                to={`/news?q=${encodeURIComponent(tag)}`}
                                className="px-3 py-1 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-xs font-semibold text-gray-600 transition-colors"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                {/* 1-Click Social Share Bar */}
                <div className="mt-10 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-emerald-950">Bagikan Artikel Bermanfaat Ini</div>
                            <div className="text-xs text-emerald-700">Bantu rekan dan pelaku usaha lain memahami proses sertifikasi halal</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* WhatsApp */}
                        <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                        >
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>

                        {/* Facebook */}
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl transition-transform hover:scale-105 shadow-sm"
                            title="Share ke Facebook"
                        >
                            <Facebook className="w-4 h-4" />
                        </a>

                        {/* Twitter */}
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-black hover:bg-gray-800 text-white rounded-xl transition-transform hover:scale-105 shadow-sm"
                            title="Share ke Twitter"
                        >
                            <Twitter className="w-4 h-4" />
                        </a>

                        {/* LinkedIn */}
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#0A66C2] hover:bg-[#095196] text-white rounded-xl transition-transform hover:scale-105 shadow-sm"
                            title="Share ke LinkedIn"
                        >
                            <Linkedin className="w-4 h-4" />
                        </a>

                        {/* Copy link */}
                        <button
                            onClick={handleCopyLink}
                            className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span>Salin</span>
                        </button>
                    </div>
                </div>

                {/* HALAL CERTIFICATION CTA BANNER */}
                <div className="mt-12 bg-[#004033] text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 max-w-xl">
                        <span className="px-3 py-1 bg-gold-500 text-[#00261f] rounded-lg text-xs font-black uppercase tracking-wider mb-4 inline-block">
                            Layanan Halal Core Resmi
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">
                            Butuh Pendampingan Sertifikasi Halal untuk Produk Anda?
                        </h3>
                        <p className="text-sm text-brand-100/80 leading-relaxed mb-6">
                            Dapatkan pendampingan langsung dari konsultan profesional Halal Core untuk skema Self-Declare maupun Sertifikasi Halal Reguler.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={`${TELEMARKETING_URL}/form`}
                                className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-[#00261f] rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-105"
                            >
                                Daftar Sertifikasi Halal
                            </a>
                            <Link
                                to="/track"
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-sm transition-all"
                            >
                                Cek Status Pengajuan
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RELATED ARTICLES */}
                {relatedNews.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                Artikel Terkait Lainnya
                            </h3>
                            <Link to="/news" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
                                Lihat Semua <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedNews.map(rel => (
                                <Link
                                    key={rel.id}
                                    to={`/news/${rel.slug}`}
                                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                                >
                                    <div className="h-40 bg-gray-100 overflow-hidden relative">
                                        <img
                                            src={rel.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600'}
                                            alt={rel.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded text-[10px] font-black uppercase">
                                            {rel.category || 'Berita'}
                                        </span>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 mb-2 leading-snug">
                                            {rel.title}
                                        </h4>
                                        <div className="text-[11px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-50">
                                            <span>~{rel.reading_time || 3} min</span>
                                            <span className="text-brand-600 font-bold flex items-center gap-0.5">
                                                Baca <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
