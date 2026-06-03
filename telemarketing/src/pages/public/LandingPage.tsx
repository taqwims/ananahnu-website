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
    <div className="min-h-screen bg-gradient-main">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-primary-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-primary-800 tracking-tight block leading-tight">
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
                className="text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors"
              >
                Portal Staff
              </Link>
              <Link
                to="/form"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                Daftar Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gold-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-full font-bold text-xs uppercase tracking-wider">
                  Layanan Tele-Pendampingan Resmi
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary-900 tracking-tight leading-tight"
              >
                Sertifikasi Halal Kini <br />
                <span className="bg-gradient-to-r from-primary-600 to-gold-600 bg-clip-text text-transparent">
                  Lebih Mudah & Terbimbing
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg text-dark-600 max-w-xl leading-relaxed"
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
                  className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-base hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-600/10"
                >
                  Mulai Pengajuan Halal <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#alur"
                  className="px-8 py-4 bg-white border border-dark-200 text-dark-700 hover:bg-dark-50 rounded-xl font-bold text-base transition-all flex items-center gap-2"
                >
                  <PlayCircle className="w-5 h-5 text-primary-500" /> Lihat Alur
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-6 pt-6 border-t border-dark-200 max-w-md"
              >
                <div>
                  <h4 className="text-2xl font-extrabold text-primary-800">100%</h4>
                  <p className="text-xs text-dark-500 font-medium">Proses Online</p>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-primary-800">Gratis</h4>
                  <p className="text-xs text-dark-500 font-medium">Bimbingan Awal</p>
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-primary-800">Resmi</h4>
                  <p className="text-xs text-dark-500 font-medium">Regulator BPJPH</p>
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
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-gold-100/70 rounded-2xl -z-10 border border-gold-200/40" />

                {/* Main Card Graphic */}
                <div className="glass-card p-8 border border-primary-500/10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark-400 uppercase tracking-wide">Status Pendampingan</p>
                      <p className="text-sm font-extrabold text-primary-900">Queue Teleconference OK</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-primary-800">Video Call Penjadwalan</span>
                        <span className="text-[10px] font-bold bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full">Zoom Meeting</span>
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

                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs font-medium text-dark-500">
                      <span>Mitra Terdaftar</span>
                      <span>15.000+ UKM</span>
                    </div>
                    <div className="w-full bg-dark-100 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-primary-600 h-full w-[88%] rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-gold-600 font-bold uppercase tracking-wider text-xs block">Keunggulan Kami</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-900">Mengapa Memilih Tele-Pendampingan HalalCore?</h2>
            <p className="text-dark-500 text-base">Kami memberikan kepastian hukum dan teknis sejak awal pengajuan agar usaha Anda terhindar dari salah klasifikasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <div key={i} className="p-8 rounded-2xl bg-primary-50/40 border border-primary-500/5 space-y-4 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary-600/10 flex items-center justify-center">
                  <feat.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-primary-900">{feat.title}</h3>
                <p className="text-sm text-dark-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur Section */}
      <section id="alur" className="py-20 bg-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-primary-600 font-bold uppercase tracking-wider text-xs block">Proses Bimbingan</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-900">Alur Pendampingan Sertifikasi Halal</h2>
            <p className="text-dark-500 text-base">Simak 4 langkah sederhana dari pendaftaran awal hingga terbitnya sertifikat halal resmi Anda.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((st, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-dark-200/50 shadow-sm relative space-y-3 hover:border-primary-500/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-600 font-extrabold text-lg flex items-center justify-center">
                  {st.num}
                </div>
                <h3 className="text-base font-extrabold text-primary-900">{st.title}</h3>
                <p className="text-xs text-dark-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white text-center relative overflow-hidden">
        {/* Background texture overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-10" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Siap Melangkah Bersama HalalCore?</h2>
          <p className="text-base text-primary-100/90 max-w-xl mx-auto">
            Daftarkan bisnis Anda hari ini dan tim telemarketer kami akan segera menjadwalkan konsultasi gratis untuk Anda.
          </p>
          <div className="flex justify-center gap-4 pt-4 flex-col sm:flex-row">
            <Link
              to="/form"
              className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-primary-900 rounded-xl font-bold text-base transition-all shadow-lg active:scale-95"
            >
              Mulai Formulir Sekarang
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-primary-400 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-base transition-all active:scale-95"
            >
              Portal Telemarketer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-primary-800 text-primary-200 text-sm border-t border-primary-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="font-bold text-white text-base">HalalCore</p>
          <p className="text-xs text-primary-300">© 2026 PT Ana Nahnu Indonesia. Semua Hak Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </div>
  );
}
