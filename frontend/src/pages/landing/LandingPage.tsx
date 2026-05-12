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
        // Parallel Fetching
        const loadData = async () => {
            try {
                const [newsRes, welcomeRes, aboutRes] = await Promise.all([
                    api.get('/public/cms/news').catch(() => ({ data: [] })),
                    api.get('/public/cms/blocks/welcome_message').catch(() => ({ data: null })),
                    api.get('/public/cms/blocks/about_us').catch(() => ({ data: null })),
                ]);
                setNews(newsRes.data);
                setWelcomeBlock(welcomeRes.data);
                setAboutBlock(aboutRes.data);
            } catch (err) {
                console.error("Failed to load CMS content", err);
            }
        };
        loadData();
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section id="home" className="relative bg-gradient-to-br from-brand-900 to-brand-800 text-white py-24 lg:py-32 overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFFFFF" d="M44.5,-76.4C58.9,-69.3,71.8,-59.1,79.8,-46.3C87.8,-33.5,90.9,-18.1,88.5,-3.3C86.1,11.5,78.2,25.7,68.6,37.8C59,49.9,47.8,59.9,35.3,66.5C22.8,73.1,9.1,76.3,-3.8,82.9C-16.7,89.5,-28.9,99.5,-40.4,98.6C-51.9,97.7,-62.7,85.9,-70.5,72.4C-78.3,58.9,-83.1,43.7,-85.2,28.2C-87.3,12.7,-86.7,-3.1,-82.1,-17.5C-77.5,-31.9,-68.9,-44.9,-57.4,-53.6C-45.9,-62.3,-31.5,-66.7,-17.8,-68.8C-4.1,-70.9,8.9,-70.7,21.9,-70.7" transform="translate(100 100)" />
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
                            {welcomeBlock?.content || "Your Trusted Partner in Halal Certification"}
                        </h1>
                        <p className="text-xl text-brand-100 mb-8 max-w-2xl leading-relaxed">
                            We help businesses achieve Halal compliance efficiently and transparently. Join thousands of certified partners today.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="/track" className="px-8 py-4 bg-white text-brand-700 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:shadow-xl shadow-lg flex items-center gap-2">
                                Lacak Progres SH <ArrowRight className="w-5 h-5" />
                            </a>
                            <a href="/register" className="px-8 py-4 border border-brand-400 bg-brand-800/50 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-brand-800 transition-all">
                                Daftar Konsultan
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* About CMS Section */}
            <section id="about" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                alt="Team Meeting"
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                        <div>
                            <span className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-2 block">Who We Are</span>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Ananahnu Agency</h2>
                            <div className="prose prose-lg text-gray-600 mb-8">
                                {aboutBlock?.content || "Ananahnu is a leading Halal Verification Agency dedicated to simplifying the certification process for SMEs and Enterprises alike. Our team of experts ensures strict adherence to Syariah compliance."}
                            </div>
                            <ul className="space-y-4">
                                {['Official Partner of BPJPH', 'Fast Track Processing', 'Expert Consultation'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <span className="font-medium text-gray-800">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section id="news" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <span className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-2 block">Latest Updates</span>
                            <h2 className="text-4xl font-bold text-gray-900">News & Articles</h2>
                        </div>
                        <a href="#" className="hidden md:flex items-center gap-2 text-brand-600 font-bold hover:underline">View All News <ArrowUpRight className="w-5 h-5" /></a>
                    </div>

                    {news.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No news articles published yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {news.map(article => (
                                <div key={article.id} className="group cursor-pointer">
                                    <div className="h-48 bg-gray-200 rounded-xl mb-4 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-brand-900/10 group-hover:bg-brand-900/0 transition-colors"></div>
                                        {/* Placeholder Image */}
                                        <img src={`https://source.unsplash.com/random/800x600?sig=${article.id}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="News" />
                                    </div>
                                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded mb-2 inline-block">{article.category}</span>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{article.title}</h3>
                                    <p className="text-gray-500 line-clamp-2 text-sm">{article.content}</p>
                                    <span className="text-xs text-gray-400 mt-4 block">{new Date(article.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="py-24 bg-brand-900 text-white text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-6">Ready to Get Certified?</h2>
                    <p className="text-xl text-brand-100 mb-10">Start your journey towards Halal compliance today. Our team is ready to assist you every step of the way.</p>
                    <div className="flex justify-center gap-4">
                        <a href="/track" className="px-8 py-4 bg-white text-brand-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-lg">
                            Lacak Sekarang
                        </a>
                        <a href="/register" className="px-8 py-4 border border-brand-400 bg-transparent text-white rounded-full font-bold text-lg hover:bg-brand-800 transition-all">
                            Gabung Konsultan
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
