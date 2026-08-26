import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
    Search, Clock, 
    ArrowRight, ChevronRight, Sparkles, Newspaper
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import type { News } from '../../types';
import SEOHead from '../../components/seo/SEOHead';
import { getMediaUrl } from '../../utils/media';

const TELEMARKETING_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5174'
    : 'https://telemarketing.halalcore.id';

export default function NewsListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'ALL';
    const initialSearch = searchParams.get('q') || '';

    const [news, setNews] = useState<News[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/public/cms/news/categories');
                setCategories(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const params: any = { limit: 30 };
                if (selectedCategory && selectedCategory !== 'ALL') {
                    params.category = selectedCategory;
                }
                if (searchQuery.trim()) {
                    params.search = searchQuery.trim();
                }

                const res = await api.get('/public/cms/news', { params });
                setNews(res.data?.data || res.data || []);
            } catch (err) {
                console.error(err);
                setNews([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchNews, 200);
        return () => clearTimeout(timeoutId);
    }, [selectedCategory, searchQuery]);

    const handleCategorySelect = (cat: string) => {
        setSelectedCategory(cat);
        if (cat === 'ALL') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    // Featured top article (article marked as is_featured or first article if no search filter)
    const featuredArticle = useMemo(() => {
        if (news.length > 0 && !searchQuery && selectedCategory === 'ALL') {
            return news.find(n => n.is_featured) || news[0];
        }
        return null;
    }, [news, searchQuery, selectedCategory]);

    const regularArticles = useMemo(() => {
        if (featuredArticle) {
            return news.filter(n => n.id !== featuredArticle.id);
        }
        return news;
    }, [news, featuredArticle]);

    // Structured Data (JSON-LD Breadcrumbs & ItemList)
    const pageSchemas = useMemo(() => {
        const breadcrumbs = {
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
                    'name': 'Berita & Artikel Halal',
                    'item': 'https://halalcore.id/news'
                }
            ]
        };

        const itemList = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'Pusat Berita & Edukasi Sertifikasi Halal',
            'itemListElement': news.slice(0, 10).map((article, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'url': `https://halalcore.id/news/${article.slug}`,
                'name': article.title
            }))
        };

        return [breadcrumbs, itemList];
    }, [news]);

    return (
        <div className="min-h-screen bg-slate-50 text-gray-800">
            <SEOHead
                title="Pusat Edukasi & Berita Sertifikasi Halal Indonesia"
                description="Kumpulan berita halal terbaru, regulasi BPJPH, panduan sertifikasi halal online gratis dan reguler, serta tips bisnis halal terpercaya dari para ahli Halal Core."
                keywords="berita halal indonesia, regulasi bpjph 2026, panduan sertifikasi halal, syarat sertifikat halal, sihalal, tips umkm halal"
                ogType="website"
                canonicalUrl="https://halalcore.id/news"
                schema={pageSchemas}
            />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#004033] via-[#003328] to-[#00261f] text-white py-16 lg:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#C0A060_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-200/80 mb-6">
                        <Link to="/" className="hover:text-gold-400 transition-colors">Beranda</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-gold-400">Pusat Berita & Artikel</span>
                    </div>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-bold uppercase tracking-wider mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                            Knowledge & News Center
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                            Pusat Informasi & Edukasi Sertifikasi Halal
                        </h1>
                        <p className="text-base md:text-lg text-brand-100/80 leading-relaxed mb-8">
                            Temukan wawasan terbaru mengenai regulasi BPJPH, strategi sertifikasi halal efisien, studi kasus industri, dan panduan lengkap bagi pelaku usaha.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl flex items-center">
                            <Search className="w-5 h-5 text-brand-200 ml-3 shrink-0" />
                            <input
                                type="text"
                                placeholder="Cari topik, regulasi, kata kunci panduan..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-brand-200/60 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-3 text-xs text-brand-200 hover:text-white"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                    <button
                        onClick={() => handleCategorySelect('ALL')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === 'ALL'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-200 scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        Semua Topik
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                selectedCategory === cat
                                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200 scale-105'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-24 text-center">
                        <div className="inline-block w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-semibold text-gray-500">Memuat artikel edukasi halal...</p>
                    </div>
                ) : news.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
                        <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Tidak Ada Artikel yang Ditemukan</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            {searchQuery ? `Tidak ditemukan artikel untuk kata kunci "${searchQuery}".` : 'Belum ada artikel yang diterbitkan dalam kategori ini.'}
                        </p>
                        <button
                            onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-xs hover:bg-brand-700 transition-colors"
                        >
                            Lihat Semua Artikel
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* FEATURED SPOTLIGHT ARTICLE */}
                        {featuredArticle && (
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 group">
                                <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden bg-gray-900">
                                    <img
                                        src={getMediaUrl(featuredArticle.thumbnail_url) || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200'}
                                        alt={featuredArticle.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        fetchPriority="high"
                                        decoding="async"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden"></div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-gold-500 text-[#00261f] font-black rounded-lg text-xs uppercase tracking-wider shadow-lg">
                                            Artikel Utama
                                        </span>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold mb-3">
                                            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-black uppercase text-[10px]">
                                                {featuredArticle.category || 'Berita Halal'}
                                            </span>
                                            <span>
                                                {featuredArticle.published_at 
                                                    ? new Date(featuredArticle.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                                                    : ''}
                                            </span>
                                        </div>

                                        <Link to={`/news/${featuredArticle.slug}`}>
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 hover:text-brand-600 transition-colors leading-tight mb-4">
                                                {featuredArticle.title}
                                            </h2>
                                        </Link>

                                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-6">
                                            {featuredArticle.excerpt || featuredArticle.content?.replace(/<[^>]*>/g, '')}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                                                {featuredArticle.author_name ? featuredArticle.author_name.charAt(0) : 'H'}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900">{featuredArticle.author_name || 'Tim Halal Core'}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    ~{featuredArticle.reading_time || 3} menit baca
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/news/${featuredArticle.slug}`}
                                            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-100 transition-all hover:scale-105"
                                        >
                                            Baca Artikel <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ARTICLE GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {regularArticles.map(article => {
                                const dateStr = article.published_at 
                                    ? new Date(article.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : '';

                                return (
                                    <motion.article 
                                        key={article.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                                    >
                                        {/* Image */}
                                        <Link to={`/news/${article.slug}`} className="block relative h-52 overflow-hidden bg-gray-100">
                                            <img
                                                src={getMediaUrl(article.thumbnail_url) || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600&sig=${article.id}`}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-wider text-brand-800 shadow-sm">
                                                {article.category || 'Berita Halal'}
                                            </span>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-6 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                                                    <span>{dateStr}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> ~{article.reading_time || 3} min
                                                    </span>
                                                </div>

                                                <Link to={`/news/${article.slug}`}>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug line-clamp-2 mb-2">
                                                        {article.title}
                                                    </h3>
                                                </Link>

                                                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                                                    {article.excerpt || article.content?.replace(/<[^>]*>/g, '')}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-gray-500">
                                                    Oleh {article.author_name || 'Tim Halal Core'}
                                                </span>

                                                <Link
                                                    to={`/news/${article.slug}`}
                                                    className="text-xs font-bold text-brand-600 group-hover:text-brand-700 flex items-center gap-1"
                                                >
                                                    Baca <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* HALAL CERTIFICATION CTA BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-gradient-to-r from-[#004033] to-[#00261f] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl z-10">
                        <span className="px-3 py-1 bg-gold-500/20 border border-gold-500/30 text-gold-300 rounded-lg text-xs font-black uppercase tracking-wider mb-4 inline-block">
                            Pendampingan Sertifikasi Halal Resmi
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">
                            Siap Mendaftarkan Sertifikat Halal untuk Bisnis Anda?
                        </h3>
                        <p className="text-sm text-brand-100/80 leading-relaxed">
                            Konsultasikan kebutuhan sertifikasi halal reguler maupun self-declare bersama tim ahli Halal Core. Proses transparan, terintegrasi, dan terpercaya.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 z-10 shrink-0 w-full md:w-auto">
                        <a
                            href={`${TELEMARKETING_URL}/form`}
                            className="px-6 py-3.5 bg-gold-500 hover:bg-gold-400 text-[#00261f] rounded-xl font-bold text-sm shadow-xl text-center transition-all hover:scale-105"
                        >
                            Daftar Sertifikasi Sekarang
                        </a>
                        <Link
                            to="/track"
                            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-sm text-center transition-all"
                        >
                            Lacak Progres SH
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
