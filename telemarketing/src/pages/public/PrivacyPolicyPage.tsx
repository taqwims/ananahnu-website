import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Shield, Printer } from 'lucide-react';
import Logo from '../../components/ui/Logo';

const SECTIONS = [
  { id: 'pendahuluan', title: '1. Pendahuluan & Dasar Hukum' },
  { id: 'data-dikumpulkan', title: '2. Data Pribadi yang Dikumpulkan' },
  { id: 'tujuan-pemrosesan', title: '3. Tujuan Pemrosesan Data' },
  { id: 'dasar-hukum-pemrosesan', title: '4. Landasan Pemrosesan & Persetujuan' },
  { id: 'pengungkapan-pihak-ketiga', title: '5. Pengungkapan kepada Pihak Ketiga' },
  { id: 'keamanan-penyimpanan', title: '6. Keamanan & Retensi Data' },
  { id: 'hak-subjek-data', title: '7. Hak-Hak Subjek Data Pribadi' },
  { id: 'perubahan-kebijakan', title: '8. Pembaruan Kebijakan Privasi' },
  { id: 'kontak-dpo', title: '9. Kontak Petugas Pelindungan Data' },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('pendahuluan');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Kebijakan Privasi | HalalCore';

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const section = document.getElementById(SECTIONS[i].id);
        if (section) {
          const top = section.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#fcfdfd] min-h-screen text-slate-800 font-sans antialiased flex flex-col">
      {/* ─── Top Header / Navigation ─── */}
      <header className="sticky top-0 z-40 bg-[#00261f] border-b border-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="white" clickable={true} />
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs font-semibold text-brand-100/80 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>
            <Link
              to="/form"
              className="px-3.5 py-1.5 bg-gradient-gold text-[#00261f] font-bold text-xs rounded-full hover:brightness-105 transition-all shadow-xs"
            >
              Konsultasi
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb & Print Subbar */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-slate-900 transition-colors font-medium">Beranda</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-900 font-semibold">Kebijakan Privasi</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-slate-400 text-[11px]">UU No. 27/2022 (UU PDP)</span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors text-[11px]"
            >
              <Printer className="w-3 h-3" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                <p className="font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#004033]" />
                  Legal & Kepatuhan
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Dokumen kebijakan pelindungan data pribadi PT Ana Nahnu Indonesia (HalalCore).
                </p>
              </div>

              <nav className="space-y-0.5 border-l border-slate-200 pl-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Daftar Isi</p>
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`block w-full text-left py-1.5 px-2 rounded-md text-xs transition-colors font-medium ${
                      activeSection === sec.id
                        ? 'bg-emerald-50 text-[#004033] font-bold border-l-2 border-[#004033] -ml-[13px] pl-3'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
                <p>Pertanyaan privasi data:</p>
                <a href="mailto:privacy@halalcore.id" className="text-[#004033] hover:underline font-semibold mt-0.5 block">
                  privacy@halalcore.id
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-2xs">
            <header className="mb-8 pb-6 border-b border-slate-100">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                Kebijakan Privasi & Pelindungan Data
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                PT Ana Nahnu Indonesia ("HalalCore") berkomitmen penuh terhadap transparansi dan pemenuhan ketentuan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span>Efektif: 1 Januari 2024</span>
                <span>•</span>
                <span>Pembaruan: Oktober 2024</span>
                <span>•</span>
                <span>Versi 2.1</span>
              </div>
            </header>

            <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <section id="pendahuluan" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  1. Pendahuluan & Dasar Hukum
                </h2>
                <p>
                  Kebijakan Privasi ini menguraikan dasar perolehan, penyimpanan, pengolahan, dan pengamanan data pribadi Pengguna platform serta formulir konsultasi halal HalalCore.
                </p>
                <p className="mt-2 text-slate-600">
                  Landasan regulasi yang berlaku:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600 text-xs">
                  <li>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).</li>
                  <li>UU No. 33 Tahun 2014 jo UU Cipta Kerja tentang Jaminan Produk Halal.</li>
                  <li>PP No. 39 Tahun 2021 tentang Penyelenggaraan Bidang Jaminan Produk Halal.</li>
                </ul>
              </section>

              <section id="data-dikumpulkan" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  2. Data Pribadi yang Dikumpulkan
                </h2>
                <div className="space-y-2.5 mt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide mb-1">A. Data Identitas Penanggung Jawab</p>
                    <p className="text-xs text-slate-600">Nama lengkap pemohon, NIK (16 digit), nomor WhatsApp/telepon, email, dan jabatan usaha.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide mb-1">B. Data Legalitas Usaha</p>
                    <p className="text-xs text-slate-600">NIB (13 digit), NPWP, alamat fasilitas/pabrik, daftar bahan baku, dan matriks produk halal.</p>
                  </div>
                </div>
              </section>

              <section id="tujuan-pemrosesan" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  3. Tujuan Pemrosesan Data
                </h2>
                <p>Data yang diserahkan digunakan untuk:</p>
                <ol className="list-decimal pl-5 space-y-1 mt-1 text-slate-600 text-xs">
                  <li>Menganalisis kesiapan dokumen dan kelayakan bahan halal sebelum audit resmi.</li>
                  <li>Menyusun Manual Sistem Jaminan Produk Halal (SJPH).</li>
                  <li>Mendaftarkan permohonan ke portal SIHALAL BPJPH dan Lembaga Pemeriksa Halal (LPH).</li>
                  <li>Komunikasi penjadwalan konsultasi dan pengiriman update status sertifikasi.</li>
                </ol>
              </section>

              <section id="dasar-hukum-pemrosesan" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  4. Landasan Pemrosesan & Persetujuan
                </h2>
                <p className="text-slate-600">
                  Pemrosesan dilakukan berdasarkan persetujuan eksplisit Pengguna saat submit formulir konsultasi atau pendaftaran, serta pemenuhan kewajiban perundang-undangan sertifikasi halal Republik Indonesia.
                </p>
              </section>

              <section id="pengungkapan-pihak-ketiga" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  5. Pengungkapan kepada Pihak Ketiga
                </h2>
                <p className="text-slate-600">
                  HalalCore tidak memperjualbelikan atau menyewakan data Anda kepada pihak ketiga manapun. Data hanya diteruskan secara sah kepada regulator resmi sertifikasi halal (BPJPH, LPH, dan Komisi Fatwa MUI).
                </p>
              </section>

              <section id="keamanan-penyimpanan" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  6. Keamanan & Retensi Data
                </h2>
                <p className="text-slate-600">
                  Data disimpan secara terenkripsi (SSL/TLS 256-bit) dan hanya dapat diakses oleh konsultan bersertifikat dengan otorisasi berbasis peran (RBAC). Data disimpan sesuai masa berlaku sertifikat halal (4 tahun).
                </p>
              </section>

              <section id="hak-subjek-data" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  7. Hak-Hak Subjek Data Pribadi
                </h2>
                <p className="text-slate-600">
                  Anda berhak mengakses, memperbaiki, memperbarui, atau meminta penghapusan data pribadi Anda sesuai dengan ketentuan perundang-undangan yang berlaku.
                </p>
              </section>

              <section id="kontak-dpo" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  8. Kontak Petugas Pelindungan Data (DPO)
                </h2>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-slate-900">PT Ana Nahnu Indonesia (HalalCore)</p>
                  <p className="text-slate-600">Email DPO: <a href="mailto:privacy@halalcore.id" className="text-[#004033] font-bold hover:underline">privacy@halalcore.id</a></p>
                  <p className="text-slate-600">WhatsApp: +62 815-6495-5280</p>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="bg-[#00261f] text-white mt-16 border-t border-brand-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-brand-100/60 gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="white" clickable={false} />
            <span>&copy; {new Date().getFullYear()} PT Ana Nahnu Indonesia.</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <Link to="/" className="hover:text-white transition-colors">Beranda</Link>
            <Link to="/privacy-policy" className="text-gold-300 font-bold hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/form" className="hover:text-white transition-colors">Formulir Konsultasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
