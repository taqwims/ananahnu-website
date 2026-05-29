import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Newspaper, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import type { News, ContentBlock } from '../../types';

export default function LandingPage() {
    const [news, setNews] = useState<News[]>([]);
    const [welcomeBlock, setWelcomeBlock] = useState<ContentBlock | null>(null);
    const [aboutBlock, setAboutBlock] = useState<ContentBlock | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            const [newsRes, welcomeRes, aboutRes] = await Promise.allSettled([
                api.get('/public/cms/news').catch(() => ({ data: [] })),
                api.get('/public/cms/blocks/welcome_message').catch(() => ({ data: null })),
                api.get('/public/cms/blocks/about_us').catch(() => ({ data: null })),
            ]);

            if (cancelled) return;

            if (newsRes.status === 'fulfilled') setNews(newsRes.value.data ?? []);
            if (welcomeRes.status === 'fulfilled') setWelcomeBlock(welcomeRes.value.data);
            if (aboutRes.status === 'fulfilled') setAboutBlock(aboutRes.value.data);
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section id="home" className="relative bg-gradient-to-br from-[#004033] to-[#00261f] text-white py-24 lg:py-32 overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#C0A060" d="M44.5,-76.4C58.9,-69.3,71.8,-59.1,79.8,-46.3C87.8,-33.5,90.9,-18.1,88.5,-3.3C86.1,11.5,78.2,25.7,68.6,37.8C59,49.9,47.8,59.9,35.3,66.5C22.8,73.1,9.1,76.3,-3.8,82.9C-16.7,89.5,-28.9,99.5,-40.4,98.6C-51.9,97.7,-62.7,85.9,-70.5,72.4C-78.3,58.9,-83.1,43.7,-85.2,28.2C-87.3,12.7,-86.7,-3.1,-82.1,-17.5C-77.5,-31.9,-68.9,-44.9,-57.4,-53.6C-45.9,-62.3,-31.5,-66.7,-17.8,-68.8C-4.1,-70.9,8.9,-70.7,21.9,-70.7" transform="translate(100 100)" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                            {welcomeBlock?.content || "Building Halal Business Excellence"}
                        </h1>
                        <p className="text-xl text-brand-100/80 mb-10 max-w-2xl leading-relaxed">
                            Empowering the global Halal ecosystem through professional advisory, specialized training, and integrated certification systems.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="/track" className="px-8 py-4 bg-gold-500 text-[#00261f] rounded-full font-bold text-lg hover:bg-gold-400 transition-all hover:shadow-xl shadow-lg flex items-center gap-2">
                                Lacak Progres SH <ArrowRight className="w-5 h-5" />
                            </a>
                            <a href="/register" className="px-8 py-4 border border-brand-400 bg-brand-800/50 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-brand-800 transition-all">
                                Gabung Advisor
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* About CMS Section */}
            <section id="about" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjehK-7dO2ryv_QPg1pm8K7dik1R-ZQcR37A&s"
                                alt="Halal Core Team"
                                className="rounded-2xl shadow-2xl relative z-10"
                            />
                            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-gold-100 rounded-2xl -z-0"></div>
                        </div>
                        <div>
                            <span className="text-gold-600 font-bold uppercase tracking-wider text-sm mb-2 block">Our Mission</span>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Halal Core</h2>
                            <div className="prose prose-lg text-gray-600 mb-8 leading-relaxed">
                                {aboutBlock?.content || "Halal Core is a premier institution focused on elevating Halal standards globally. We provide a comprehensive ecosystem for businesses to navigate the complexities of Halal certification and operational excellence."}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { text: 'Advisory Services', color: 'text-green-600' },
                                    { text: 'Professional Training', color: 'text-gold-600' },
                                    { text: 'Digital Systems', color: 'text-blue-600' },
                                    { text: 'Certification Support', color: 'text-purple-600' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <CheckCircle className={`w-5 h-5 ${item.color}`} />
                                        <span className="font-bold text-gray-800 text-sm">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section id="news" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <span className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-2 block">Insights</span>
                            <h2 className="text-4xl font-bold text-gray-900">Knowledge Center</h2>
                        </div>
                        <a href="#" className="hidden md:flex items-center gap-2 text-brand-600 font-bold hover:underline">View All Articles <ArrowUpRight className="w-5 h-5" /></a>
                    </div>

                    {news.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No updates published yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {news.map(article => (
                                <div key={article.id} className="group cursor-pointer bg-white p-4 rounded-2xl border border-transparent hover:border-brand-100 hover:shadow-xl transition-all">
                                    <div className="h-48 bg-gray-200 rounded-xl mb-4 overflow-hidden relative">
                                        <img src={`https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&sig=${article.id}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="News" />
                                    </div>
                                    <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2 py-1 rounded mb-2 inline-block uppercase tracking-wider">{article.category}</span>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{article.title}</h3>
                                    <p className="text-gray-500 line-clamp-2 text-sm">{article.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="py-24 bg-[#004033] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <h2 className="text-4xl font-bold mb-6">Ready to Lead with Halal Core?</h2>
                    <p className="text-xl text-brand-100/70 mb-12">Join our network of professionals and businesses committed to Halal excellence.</p>
                    <div className="flex justify-center gap-4 flex-col sm:flex-row">
                        <a href="/track" className="px-10 py-4 bg-gold-500 text-[#00261f] rounded-full font-bold text-lg hover:bg-gold-400 transition-all shadow-xl">
                            Lacak Progres Sertifikat
                        </a>
                        <a href="/register" className="px-10 py-4 border border-brand-400 bg-white/10 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all">
                            Daftar Sebagai Advisor
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
