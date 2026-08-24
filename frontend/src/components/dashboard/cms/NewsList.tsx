import { useState, useMemo } from 'react';
import { 
    Plus, Edit, Trash2, Eye, Search, 
    BookOpen, CheckCircle, Clock, ExternalLink,
    TrendingUp, Star, Home
} from 'lucide-react';
import type { News } from '../../../types';
import { getMediaUrl } from '../../../utils/media';

interface NewsListProps {
    news: News[];
    onAdd: () => void;
    onEdit: (item: News) => void;
    onDelete: (id: number) => void;
    onToggleStatus?: (id: number, currentStatus: boolean) => void;
    onToggleFeatured?: (id: number, currentStatus: boolean) => void;
    onToggleLanding?: (id: number, currentStatus: boolean) => void;
}

export const NewsList = ({ 
    news, 
    onAdd, 
    onEdit, 
    onDelete, 
    onToggleStatus,
    onToggleFeatured,
    onToggleLanding
}: NewsListProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
    const [displayFilter, setDisplayFilter] = useState<'ALL' | 'FEATURED' | 'LANDING'>('ALL');

    // Extract unique categories
    const categories = useMemo(() => {
        const set = new Set<string>();
        news.forEach(n => {
            if (n.category) set.add(n.category);
        });
        return Array.from(set);
    }, [news]);

    // Compute metrics
    const metrics = useMemo(() => {
        const total = news.length;
        const published = news.filter(n => n.is_published !== false).length;
        const drafts = total - published;
        const featured = news.filter(n => n.is_featured).length;
        const landing = news.filter(n => n.show_on_landing !== false).length;
        const totalViews = news.reduce((acc, n) => acc + (n.views || 0), 0);
        return { total, published, drafts, featured, landing, totalViews };
    }, [news]);

    // Filtered list
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            const matchesSearch = !searchQuery || 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.tags && item.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.slug.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            
            const isPub = item.is_published !== false;
            const matchesStatus = 
                selectedStatus === 'ALL' || 
                (selectedStatus === 'PUBLISHED' && isPub) || 
                (selectedStatus === 'DRAFT' && !isPub);

            const matchesDisplay = 
                displayFilter === 'ALL' ||
                (displayFilter === 'FEATURED' && item.is_featured) ||
                (displayFilter === 'LANDING' && item.show_on_landing !== false);

            return matchesSearch && matchesCategory && matchesStatus && matchesDisplay;
        });
    }, [news, searchQuery, selectedCategory, selectedStatus, displayFilter]);

    return (
        <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900 tracking-tight">{metrics.total}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Artikel</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-emerald-600 tracking-tight">{metrics.published}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Terbit / Live</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Star className="w-5 h-5 fill-amber-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-amber-600 tracking-tight">{metrics.featured}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Highlight Utama</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                        <Home className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-teal-600 tracking-tight">{metrics.landing}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tampil di Beranda</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-blue-600 tracking-tight">{metrics.totalViews.toLocaleString('id-ID')}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pembaca (Views)</div>
                    </div>
                </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari judul, tag, atau slug artikel..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-700"
                    >
                        <option value="ALL">Semua Kategori</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value as any)}
                        className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-700"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="PUBLISHED">Hanya Terbit</option>
                        <option value="DRAFT">Hanya Draf</option>
                    </select>

                    {/* Display Location Filter */}
                    <select
                        value={displayFilter}
                        onChange={e => setDisplayFilter(e.target.value as any)}
                        className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-700"
                    >
                        <option value="ALL">Semua Tampilan</option>
                        <option value="FEATURED">⭐ Highlight Utama</option>
                        <option value="LANDING">🏠 Tampil di Beranda</option>
                    </select>
                </div>

                {/* Add Article Button */}
                <button 
                    onClick={onAdd} 
                    className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                    <Plus className="w-4 h-4" /> Tulis Berita Baru
                </button>
            </div>

            {/* News List Content */}
            {filteredNews.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 mb-1">
                        {news.length === 0 ? 'Belum Ada Berita Diterbitkan' : 'Tidak Ada Berita yang Cocok'}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                        {news.length === 0 
                            ? 'Mulai buat artikel berita dan panduan halal teroptimasi SEO untuk meningkatkan visibilitas website di Google.'
                            : 'Coba ubah kata kunci pencarian atau filter kategori di atas.'}
                    </p>
                    {news.length === 0 && (
                        <button
                            onClick={onAdd}
                            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-brand-700 shadow-md transition-all"
                        >
                            <Plus className="w-4 h-4" /> Buat Artikel Pertama
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredNews.map(item => {
                        const isPub = item.is_published !== false;
                        const isFeat = !!item.is_featured;
                        const isLand = item.show_on_landing !== false;
                        const dateStr = item.published_at 
                            ? new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-';

                        return (
                            <div 
                                key={item.id} 
                                className={`p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group ${
                                    isFeat ? 'border-amber-200 bg-amber-50/10' : 'border-gray-100 hover:border-brand-200'
                                }`}
                            >
                                {/* Thumbnail & Info */}
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 relative">
                                        {item.thumbnail_url ? (
                                            <img
                                                src={getMediaUrl(item.thumbnail_url)}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onToggleStatus && onToggleStatus(item.id, isPub)}
                                            className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 ${
                                                isPub ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                                            }`}
                                            title={isPub ? 'Klik untuk ubah jadi Draf' : 'Klik untuk Publikasikan'}
                                        >
                                            {isPub ? 'LIVE' : 'DRAF'}
                                        </button>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                {item.category || 'Berita Halal'}
                                            </span>

                                            {/* Highlight Badge Button */}
                                            <button
                                                type="button"
                                                onClick={() => onToggleFeatured && onToggleFeatured(item.id, isFeat)}
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all hover:scale-105 ${
                                                    isFeat
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-700 border border-transparent'
                                                }`}
                                                title={isFeat ? 'Klik untuk batalkan status Highlight' : 'Klik untuk jadikan Highlight Utama'}
                                            >
                                                <Star className={`w-3 h-3 ${isFeat ? 'fill-amber-500 text-amber-500' : ''}`} />
                                                {isFeat ? 'Highlight Utama' : 'Jadikan Highlight'}
                                            </button>

                                            {/* Landing Display Badge Button */}
                                            <button
                                                type="button"
                                                onClick={() => onToggleLanding && onToggleLanding(item.id, isLand)}
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all hover:scale-105 ${
                                                    isLand
                                                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-teal-50 hover:text-teal-700 border border-transparent'
                                                }`}
                                                title={isLand ? 'Tampil di Halaman Beranda (Klik untuk sembunyikan)' : 'Tidak tampil di Beranda (Klik untuk tampilkan)'}
                                            >
                                                <Home className="w-3 h-3" />
                                                {isLand ? 'Di Beranda' : 'Non-Beranda'}
                                            </button>

                                            <span className="text-xs text-gray-400 font-medium">
                                                {dateStr}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-gray-900 text-base leading-snug truncate group-hover:text-brand-600 transition-colors">
                                            {item.title}
                                        </h4>

                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                            {item.excerpt || item.content?.replace(/<[^>]*>/g, '') || 'Belum ada ringkasan...'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400">
                                            <span className="font-mono text-gray-400 truncate max-w-[200px]">
                                                /news/{item.slug}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                                {(item.views || 0).toLocaleString('id-ID')} views
                                            </span>
                                            {item.reading_time && (
                                                <span className="flex items-center gap-1 text-amber-700">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    ~{item.reading_time} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-50 w-full md:w-auto justify-end">
                                    {/* Live Preview Button */}
                                    <a
                                        href={`/news/${item.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                                        title="Buka Halaman Live"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="px-3 py-2 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Edit / SEO</span>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Hapus Artikel"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NewsList;
