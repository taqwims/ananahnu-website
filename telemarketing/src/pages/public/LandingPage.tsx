import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Headphones, ShieldCheck, Zap, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
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
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-brand-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-md">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-brand-800 tracking-tight block leading-tight">
                  HalalCore
                </span>
                <span className="text-[10px] text-gold-600 font-bold uppercase tracking-wider block -mt-1">
                  Telemarketing
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-brand-800 hover:text-brand-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/form"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                Daftar Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#004033] to-[#00261f] text-white py-24 lg:py-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#C0A060" d="M44.5,-76.4C58.9,-69.3,71.8,-59.1,79.8,-46.3C87.8,-33.5,90.9,-18.1,88.5,-3.3C86.1,11.5,78.2,25.7,68.6,37.8C59,49.9,47.8,59.9,35.3,66.5C22.8,73.1,9.1,76.3,-3.8,82.9C-16.7,89.5,-28.9,99.5,-40.4,98.6C-51.9,97.7,-62.7,85.9,-70.5,72.4C-78.3,58.9,-83.1,43.7,-85.2,28.2C-87.3,12.7,-86.7,-3.1,-82.1,-17.5C-77.5,-31.9,-68.9,-44.9,-57.4,-53.6C-45.9,-62.3,-31.5,-66.7,-17.8,-68.8C-4.1,-70.9,8.9,-70.7,21.9,-70.7" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="px-3 py-1.5 bg-brand-800/50 backdrop-blur-sm border border-brand-600 text-brand-100 rounded-full font-bold text-xs uppercase tracking-wider">
                  Layanan Tele-Pendampingan Resmi
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight"
              >
                Sertifikasi Halal Kini <br />
                <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                  Lebih Mudah & Terbimbing
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg text-brand-100/80 max-w-xl leading-relaxed"
              >
                Dapatkan pendampingan langsung secara online oleh tim spesialis HalalCore. Dari verifikasi bahan baku, klasifikasi rute, hingga penandatanganan kesepakatan secara digital.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <Link
                  to="/form"
                  className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-[#00261f] rounded-full font-bold text-lg transition-all flex items-center gap-2 shadow-xl"
                >
                  Mulai Pengajuan Halal <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#alur"
                  className="px-8 py-4 border border-brand-400 bg-brand-800/50 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-brand-800 transition-all flex items-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" /> Lihat Alur
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-6 pt-6 border-t border-brand-700 max-w-md"
              >
                <div>
                  <h4 className="text-2xl font-extrabold text-white">100%</h4>
                  <p className="text-xs text-brand-200 font-medium">Proses Online</p>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-white">Gratis</h4>
                  <p className="text-xs text-brand-200 font-medium">Bimbingan Awal</p>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-white">Resmi</h4>
                  <p className="text-xs text-brand-200 font-medium">Regulator BPJPH</p>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 relative flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-sm relative z-10"
              >
                {/* Decorative Box background */}
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-gold-500/20 rounded-2xl -z-10 border border-gold-500/30" />

                {/* Main Card Graphic */}
                <div className="glass-card p-8 border border-brand-500/20 space-y-6 !bg-white/95 !text-dark-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark-400 uppercase tracking-wide">Status Pendampingan</p>
                      <p className="text-sm font-extrabold text-brand-900">Queue Teleconference OK</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-brand-800">Video Call Penjadwalan</span>
                        <span className="text-[10px] font-bold bg-brand-200 text-brand-800 px-2 py-0.5 rounded-full">Zoom Meeting</span>
                      </div>
                      <p className="text-xs text-dark-600 font-medium">Tim telemarketer kami siap membantu menentukan klasifikasi produk Anda.</p>
                    </div>
                    <div className="p-4 bg-gold-50 border border-gold-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gold-800">Kontrak Elektronik</span>
                        <span className="text-[10px] font-bold bg-gold-200 text-gold-800 px-2 py-0.5 rounded-full">Digital Sign</span>
                      </div>
                      <p className="text-xs text-dark-600 font-medium">Tanda tangan Service Agreement instan di browser untuk menjamin kepastian tarif.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dark-100 mt-4">
                    <div className="flex justify-between items-center text-xs font-medium text-dark-500 mt-2">
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

      {/* Keunggulan Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-gold-600 font-bold uppercase tracking-wider text-xs block">Keunggulan Kami</span>
            <h2 className="text-4xl font-extrabold text-gray-900">Mengapa Memilih Tele-Pendampingan HalalCore?</h2>
            <p className="text-gray-600 text-lg leading-relaxed">Kami memberikan kepastian hukum dan teknis sejak awal pengajuan agar usaha Anda terhindar dari salah klasifikasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 space-y-4 hover:shadow-xl hover:border-brand-100 transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur Section */}
      <section id="alur" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-brand-600 font-bold uppercase tracking-wider text-xs block">Proses Bimbingan</span>
            <h2 className="text-4xl font-extrabold text-gray-900">Alur Pendampingan Sertifikasi Halal</h2>
            <p className="text-gray-600 text-lg leading-relaxed">Simak 4 langkah sederhana dari pendaftaran awal hingga terbitnya sertifikat halal resmi Anda.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((st, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-transparent hover:border-brand-100 shadow-sm hover:shadow-xl relative space-y-4 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gold-50 text-gold-600 font-extrabold text-xl flex items-center justify-center">
                  {st.num}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{st.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#004033] text-white text-center relative overflow-hidden">
        {/* Background texture overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-4xl font-bold mb-6">Siap Melangkah Bersama HalalCore?</h2>
          <p className="text-xl text-brand-100/70 max-w-2xl mx-auto mb-12">
            Daftarkan bisnis Anda hari ini dan tim telemarketer kami akan segera menjadwalkan konsultasi gratis untuk Anda.
          </p>
          <div className="flex justify-center gap-4 pt-4 flex-col sm:flex-row">
            <Link
              to="/form"
              className="px-10 py-4 bg-gold-500 hover:bg-gold-400 text-[#00261f] rounded-full font-bold text-lg transition-all shadow-xl active:scale-95"
            >
              Mulai Formulir Sekarang
            </Link>
            <Link
              to="/login"
              className="px-10 py-4 border border-brand-400 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full font-bold text-lg transition-all active:scale-95"
            >
              Portal Telemarketer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#00261f] text-brand-200 text-sm border-t border-brand-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="font-bold text-white text-lg">HalalCore</p>
          <p className="text-sm text-brand-400">© 2026 PT Ana Nahnu Indonesia. Semua Hak Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </div>
  );
}
