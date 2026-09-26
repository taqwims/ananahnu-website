import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Headphones, ShieldCheck, Zap, PlayCircle, Menu, X, MapPin, Phone, Mail, Newspaper, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import { getPublicNews, type NewsArticle } from '../../services/newsService';

const MAIN_APP_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5173'
  : 'https://halalcore.id';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    getPublicNews({ limit: 3, landing_only: true })
      .then((res) => {
        setLatestNews(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  const steps = [
    {
      num: '1',
      title: 'Isi Formulir Konsultasi',
      desc: 'Masukkan data profil usaha, skala bisnis, lokasi, serta detail produk yang ingin dikonsultasikan.',
    },
    {
      num: '2',
      title: 'Konfirmasi & Jadwal',
      desc: 'Tim konsultan kami akan menghubungi Anda melalui WhatsApp untuk mengonfirmasi jadwal sesi bimbingan.',
    },
    {
      num: '3',
      title: 'Sesi Konsultasi & Bimbingan',
      desc: 'Diskusi interaktif online via Video Call / Chat untuk klasifikasi rute (Self Declare vs Reguler) & bahan baku.',
    },
    {
      num: '4',
      title: 'Rekomendasi & Roadmap',
      desc: 'Dapatkan rekomendasi teknis, checklist kelengkapan berkas, dan langkah pengajuan sertifikasi halal Anda.',
    },
  ];

  const features = [
    {
      icon: Headphones,
      title: 'Konsultasi Personal Online',
      desc: 'Bimbingan interaktif online melalui Zoom, Google Meet, atau WhatsApp bersama konsultan spesialis HalalCore.',
    },
    {
      icon: Zap,
      title: 'Klasifikasi Rute Tepat & Akurat',
      desc: 'Analisis cerdas untuk memastikan rute yang sesuai (Self Declare atau Reguler) sesuai regulasi BPJPH terkini.',
    },
    {
      icon: ShieldCheck,
      title: 'Panduan Lengkap & Transparan',
      desc: 'Informasi transparan mengenai pemenuhan syarat, kesiapan dokumen SJPH, dan estimasi waktu proses tanpa biaya tersembunyi.',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-50/30">
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
                  Konsultasi Halal
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/news"
                className="px-3.5 py-2 text-sm font-semibold text-dark-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
              >
                Artikel & Berita
              </Link>
              <a
                href={`${MAIN_APP_URL}/track`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-sm font-semibold text-dark-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all cursor-pointer"
              >
                Lacak Progress
              </a>
              <a
                href={`${MAIN_APP_URL}/register`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all cursor-pointer"
              >
                Gabung Advisor
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

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-brand-100/60 bg-white/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-2">
                <Link
                  to="/news"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-dark-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
                >
                  Artikel & Berita
                </Link>
                <a
                  href={`${MAIN_APP_URL}/track`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm font-semibold text-dark-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all cursor-pointer"
                >
                  Lacak Progress
                </a>
                <a
                  href={`${MAIN_APP_URL}/register`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm font-semibold text-brand-650 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all cursor-pointer"
                >
                  Gabung Advisor
                </a>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-dark-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/form"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-4 py-3 bg-brand-600 hover:bg-brand-550 text-white text-sm font-bold rounded-xl transition-all text-center shadow-sm"
                >
                  Konsultasi Sekarang →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative bg-gradient-brand text-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-52 sm:w-80 h-52 sm:h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-brand-100 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                  Layanan Konsultasi Halal Online
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-tight"
              >
                Konsultasi Sertifikasi Halal <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                  Lebih Mudah & Terbimbing
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-base sm:text-lg text-brand-100/80 max-w-xl leading-relaxed font-medium"
              >
                Dapatkan bimbingan dan konsultasi langsung secara online oleh konsultan HalalCore. Dari identifikasi bahan baku, klasifikasi rute Self Declare / Reguler, hingga panduan langkah sertifikasi halal usaha Anda.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4"
              >
                <Link
                  to="/form"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-gold text-[#00261f] rounded-full font-bold text-base sm:text-lg hover:shadow-lg hover:shadow-gold-500/10 hover:brightness-105 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Mulai Konsultasi Sekarang <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/news"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 border border-brand-400/30 bg-white/5 backdrop-blur-md text-white rounded-full font-bold text-base sm:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Baca Panduan & Berita
                </Link>
                <a
                  href="#alur"
                  className="px-5 sm:px-6 py-3.5 sm:py-4 text-brand-200 hover:text-white rounded-full font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" /> Lihat Alur
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-4 sm:gap-6 pt-5 sm:pt-6 border-t border-white/10 max-w-sm sm:max-w-md"
              >
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white">100%</h4>
                  <p className="text-[10px] sm:text-xs text-brand-200 font-bold">Proses Online</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white">Gratis</h4>
                  <p className="text-[10px] sm:text-xs text-brand-200 font-bold">Konsultasi Awal</p>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-white">Resmi</h4>
                  <p className="text-[10px] sm:text-xs text-brand-200 font-bold">Regulator BPJPH</p>
                </div>
              </motion.div>
            </div>

            {/* Hero Card - Hidden on small mobile, visible from sm */}
            <div className="hidden sm:flex lg:col-span-5 relative justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-sm relative z-10"
              >
                {/* Decorative Box background */}
                <div className="absolute -bottom-5 -right-5 w-full h-full bg-gold-500/10 rounded-2xl -z-10 border border-gold-500/20" />

                {/* Main Card Graphic */}
                <div className="glass-card p-6 sm:p-8 border border-white/10 space-y-5 !bg-white/95 !text-dark-800 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Status Konsultasi</p>
                      <p className="text-sm font-extrabold text-brand-800">Sesi Konsultasi Terjadwal</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-brand-50 border border-brand-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-brand-800">Konsultasi Interaktif</span>
                        <span className="text-[10px] font-extrabold bg-brand-200 text-brand-800 px-2 py-0.5 rounded-full">Zoom / Meet / WA</span>
                      </div>
                      <p className="text-[11px] text-dark-600 font-medium">Tim konsultan kami siap membantu menentukan klasifikasi dan strategi sertifikasi produk Anda.</p>
                    </div>
                    <div className="p-3.5 bg-gold-50 border border-gold-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gold-800">Analisis Kelayakan</span>
                        <span className="text-[10px] font-extrabold bg-gold-200 text-gold-800 px-2 py-0.5 rounded-full">Self Declare / Reguler</span>
                      </div>
                      <p className="text-[11px] text-dark-600 font-medium">Identifikasi rute terbaik yang sesuai dengan karakteristik produk dan skala usaha Anda.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dark-100 mt-4">
                    <div className="flex justify-between items-center text-xs font-bold text-dark-500 mt-2">
                      <span>Mitra Terbimbing</span>
                      <span>15.000+ UKM</span>
                    </div>
                    <div className="w-full bg-dark-100 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-brand-600 h-full w-[88%] rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Keunggulan Section ─── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-gold-600 font-bold uppercase tracking-wider text-xs block">Keunggulan Layanan</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-800">Mengapa Berkonsultasi dengan HalalCore?</h2>
            <p className="text-dark-500 text-base sm:text-lg leading-relaxed font-medium">Kami memberikan kepastian teknis dan regulasi sejak awal pengajuan agar usaha Anda terhindar dari salah klasifikasi.</p>
          </div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {features.map((feat, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
                }}
                whileHover={{ y: -6 }}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-dark-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100/30 group-hover:scale-110 group-hover:bg-brand-600 transition-all duration-300 mb-4">
                  <feat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-dark-900 group-hover:text-brand-700 transition-colors mb-2">{feat.title}</h3>
                <p className="text-sm text-dark-500 leading-relaxed font-medium">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Alur Section ─── */}
      <section id="alur" className="py-16 sm:py-20 lg:py-24 bg-brand-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-brand-600 font-bold uppercase tracking-wider text-xs block">Proses Konsultasi</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-800">Alur Konsultasi Sertifikasi Halal</h2>
            <p className="text-dark-500 text-base sm:text-lg leading-relaxed font-medium">Simak 4 langkah mudah dari pengisian formulir hingga kesiapan pengajuan sertifikat halal resmi Anda.</p>
          </div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 relative"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
          >
            {steps.map((st, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
                }}
                whileHover={{ y: -6 }}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-dark-100 shadow-sm hover:shadow-xl relative space-y-3 sm:space-y-4 transition-all duration-300"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gold-50 text-gold-600 font-extrabold text-lg sm:text-xl flex items-center justify-center border border-gold-100/20 shadow-inner">
                  {st.num}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-dark-900">{st.title}</h3>
                <p className="text-sm text-dark-500 leading-relaxed font-medium">{st.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── News & Educational Articles Preview Section ─── */}
      {latestNews.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-brand-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-gold-600 font-bold uppercase tracking-wider text-xs block mb-1">
                  Edukasi & Regulasi Halal
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-800">
                  Artikel & Panduan Terbaru
                </h2>
                <p className="text-dark-500 text-sm sm:text-base mt-2 max-w-xl">
                  Dapatkan wawasan seputar regulasi BPJPH, tips lolos audit halal, dan panduan sertifikasi halal terkini.
                </p>
              </div>

              <Link
                to="/news"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors"
              >
                Lihat Semua Artikel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {latestNews.map((news) => (
                <article
                  key={news.id}
                  className="bg-brand-50/30 rounded-2xl border border-dark-100 overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-200 transition-all flex flex-col group"
                >
                  <Link to={`/news/${news.slug}`} className="block h-48 overflow-hidden relative">
                    <img
                      src={news.thumbnail_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80'}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-md text-brand-800 shadow-sm">
                        {news.category || 'Edukasi Halal'}
                      </span>
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-dark-400 font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{news.reading_time || 3} mnt baca</span>
                      </div>

                      <Link to={`/news/${news.slug}`}>
                        <h3 className="font-extrabold text-dark-900 text-base leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-dark-500 line-clamp-2 leading-relaxed">
                        {news.excerpt || news.content.slice(0, 100)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-dark-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-dark-400">
                        {news.author_name || 'Tim Halal Core'}
                      </span>
                      <Link
                        to={`/news/${news.slug}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        Baca <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Section ─── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-brand text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-5 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Siap Berkonsultasi Mengenai Sertifikasi Halal?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-brand-100/75 max-w-2xl mx-auto font-medium">
            Daftarkan kebutuhan konsultasi bisnis Anda hari ini dan tim konsultan kami akan segera menjadwalkan sesi konsultasi gratis untuk Anda.
          </p>
          <div className="flex justify-center gap-3 sm:gap-4 pt-4 flex-col sm:flex-row">
            <Link
              to="/form"
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-gold text-[#00261f] rounded-full font-extrabold text-base sm:text-lg shadow-xl hover:brightness-105 transition-all active:scale-95"
            >
              Mulai Konsultasi Sekarang
            </Link>
            <Link
              to="/login"
              className="px-8 sm:px-10 py-3.5 sm:py-4 border border-brand-400 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full font-extrabold text-base sm:text-lg transition-all active:scale-95"
            >
              Portal Konsultan
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#00261f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Logo size="md" variant="white" className="!items-start" clickable={true} />
              </div>
              <p className="text-brand-100/70 max-w-sm leading-relaxed text-sm font-medium">
                Building Halal Business Excellence through professional advisory, training, and certification systems.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-gold-400">Quick Links</h4>
              <ul className="space-y-3 text-brand-100/60 text-sm font-medium">
                <li><Link to="/news" className="text-gold-400 font-bold hover:text-gold-300 transition-colors flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5" /> Artikel & Berita Halal</Link></li>
                <li><a href={`${MAIN_APP_URL}/register`} target="_blank" rel="noopener noreferrer" className="hover:text-gold-300 transition-colors">Daftar Halal Advisor</a></li>
                <li><Link to="/form" className="hover:text-gold-400 transition-colors">Formulir Konsultasi</Link></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-gold-400">Contact Us</h4>
              <ul className="space-y-4 text-brand-100/60 text-sm font-medium">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold-500" />
                  <span>Halal Core Center, Jakarta, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gold-500" />
                  <span>+62 21 5555 1234</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gold-500" />
                  <span>info@halalcore.id</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-brand-100/40 text-sm">
            <p>&copy; {new Date().getFullYear()} PT Ana Nahnu Indonesia. All rights reserved.</p>
            <p>Empowering the Global Halal Ecosystem</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


