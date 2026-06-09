import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Headphones, ShieldCheck, Zap, PlayCircle, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAIN_APP_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5173'
  : 'https://halalcore.id';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const steps = [
    {
      num: '1',
      title: 'Isi Formulir Singkat',
      desc: 'Masukkan data dasar profil usaha Anda seperti skala usaha, lokasi, dan bahan baku yang digunakan.',
    },
    {
      num: '2',
      title: 'Konsultasi Teleconference',
      desc: 'Penjadwalan otomatis video call dengan telemarketer kami untuk mendampingi klasifikasi pengajuan.',
    },
    {
      num: '3',
      title: 'Verifikasi & Pembuatan Akun',
      desc: 'Sistem memverifikasi kelayakan usaha Anda dan membuat akun eksklusif di portal sertifikasi HalalCore.',
    },
    {
      num: '4',
      title: 'Sertifikat Halal Terbit',
      desc: 'Proses pengajuan dilanjutkan secara efisien di platform kami hingga sertifikat resmi diterbitkan.',
    },
  ];

  const features = [
    {
      icon: Headphones,
      title: 'Pendampingan Personal Online',
      desc: 'Konsultasi interaktif gratis melalui Zoom, Google Meet, atau WhatsApp dengan telemarketer profesional kami.',
    },
    {
      icon: Zap,
      title: 'Klasifikasi Rute Otomatis',
      desc: 'Sistem cerdas kami langsung mengarahkan Anda ke rute Reguler (Teleconference) atau Self Declare secara real-time.',
    },
    {
      icon: ShieldCheck,
      title: 'Kepatuhan & Keamanan Data',
      desc: 'Perjanjian layanan (Service Agreement) ditandatangani secara elektronik demi kenyamanan dan kekuatan hukum.',
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
                className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-md shadow-brand-600/15"
              >
                <Headphones className="w-4.5 h-4.5 text-white" />
              </motion.div>
              <div>
                <span className="font-extrabold text-base text-brand-800 tracking-tight block leading-tight">
                  HalalCore
                </span>
                <span className="text-[9px] text-gold-600 font-bold uppercase tracking-widest block -mt-0.5">
                  Telemarketing
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href={`${MAIN_APP_URL}/track`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-sm font-semibold text-dark-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all cursor-pointer"
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
                Daftar Sekarang <ArrowRight className="w-3.5 h-3.5" />
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
                <a
                  href={`${MAIN_APP_URL}/track`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm font-semibold text-dark-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all cursor-pointer"
                >
                  Lacak Progress
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
                  Daftar Sekarang →
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
                  Layanan Tele-Pendampingan Resmi
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-tight"
              >
                Sertifikasi Halal Kini <br className="hidden sm:block" />
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
                Dapatkan pendampingan langsung secara online oleh tim spesialis HalalCore. Dari verifikasi bahan baku, klasifikasi rute, hingga penandatanganan kesepakatan secara digital.
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
                  Mulai Pengajuan Halal <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={`${MAIN_APP_URL}/track`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 border border-brand-400/30 bg-white/5 backdrop-blur-md text-white rounded-full font-bold text-base sm:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Lacak Progress
                </a>
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
                  <p className="text-[10px] sm:text-xs text-brand-200 font-bold">Bimbingan Awal</p>
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
                      <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Status Pendampingan</p>
                      <p className="text-sm font-extrabold text-brand-800">Queue Teleconference OK</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-brand-50 border border-brand-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-brand-800">Video Call Penjadwalan</span>
                        <span className="text-[10px] font-extrabold bg-brand-200 text-brand-800 px-2 py-0.5 rounded-full">Zoom Meeting</span>
                      </div>
                      <p className="text-[11px] text-dark-600 font-medium">Tim telemarketer kami siap membantu menentukan klasifikasi produk Anda.</p>
                    </div>
                    <div className="p-3.5 bg-gold-50 border border-gold-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gold-800">Kontrak Elektronik</span>
                        <span className="text-[10px] font-extrabold bg-gold-200 text-gold-800 px-2 py-0.5 rounded-full">Digital Sign</span>
                      </div>
                      <p className="text-[11px] text-dark-600 font-medium">Tanda tangan Service Agreement instan di browser untuk menjamin kepastian tarif.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dark-100 mt-4">
                    <div className="flex justify-between items-center text-xs font-bold text-dark-500 mt-2">
                      <span>Mitra Terdaftar</span>
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
            <span className="text-gold-600 font-bold uppercase tracking-wider text-xs block">Keunggulan Kami</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-800">Mengapa Memilih Tele-Pendampingan HalalCore?</h2>
            <p className="text-dark-500 text-base sm:text-lg leading-relaxed font-medium">Kami memberikan kepastian hukum dan teknis sejak awal pengajuan agar usaha Anda terhindar dari salah klasifikasi.</p>
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
            <span className="text-brand-600 font-bold uppercase tracking-wider text-xs block">Proses Bimbingan</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-800">Alur Pendampingan Sertifikasi Halal</h2>
            <p className="text-dark-500 text-base sm:text-lg leading-relaxed font-medium">Simak 4 langkah sederhana dari pendaftaran awal hingga terbitnya sertifikat halal resmi Anda.</p>
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

      {/* ─── CTA Section ─── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-brand text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-5 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Siap Melangkah Bersama HalalCore?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-brand-100/75 max-w-2xl mx-auto font-medium">
            Daftarkan bisnis Anda hari ini dan tim telemarketer kami akan segera menjadwalkan konsultasi gratis untuk Anda.
          </p>
          <div className="flex justify-center gap-3 sm:gap-4 pt-4 flex-col sm:flex-row">
            <Link
              to="/form"
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-gold text-[#00261f] rounded-full font-extrabold text-base sm:text-lg shadow-xl hover:brightness-105 transition-all active:scale-95"
            >
              Mulai Formulir Sekarang
            </Link>
            <Link
              to="/login"
              className="px-8 sm:px-10 py-3.5 sm:py-4 border border-brand-400 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full font-extrabold text-base sm:text-lg transition-all active:scale-95"
            >
              Portal Telemarketer
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 sm:py-12 bg-brand-800 text-center border-t border-brand-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-extrabold text-white text-lg tracking-wide">HalalCore</p>
          <p className="text-xs text-brand-300 font-medium">© 2026 PT Ana Nahnu Indonesia. Semua Hak Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </div>
  );
}
