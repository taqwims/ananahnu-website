import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Scale, Printer } from 'lucide-react';
import Logo from '../../components/ui/Logo';

const SECTIONS = [
  { id: 'ketentuan-umum', title: '1. Ketentuan Umum & Definisi' },
  { id: 'ruang-lingkup-layanan', title: '2. Ruang Lingkup Layanan' },
  { id: 'kewajiban-klien', title: '3. Kewajiban & Integritas Klien' },
  { id: 'peran-halalcore', title: '4. Peran & Batasan Tanggung Jawab' },
  { id: 'biaya-pembayaran', title: '5. Biaya, Invoice, & Voucher' },
  { id: 'kerahasiaan-haki', title: '6. Kerahasiaan (NDA) & Hak Cipta' },
  { id: 'pembatalan-pengakhiran', title: '7. Pembatalan & Pengakhiran Layanan' },
  { id: 'hukum-sengketa', title: '8. Hukum yang Berlaku & Sengketa' },
  { id: 'kontak-legal', title: '9. Kontak & Bantuan Hukum' },
];

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('ketentuan-umum');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Syarat & Ketentuan Layanan | HalalCore';

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
            <span className="text-slate-900 font-semibold">Syarat & Ketentuan</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-slate-400 text-[11px]">Ketentuan Penggunaan Layanan</span>
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
                  <Scale className="w-3.5 h-3.5 text-[#004033]" />
                  Perjanjian Layanan
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Syarat dan ketentuan ini berlaku untuk seluruh pengguna portal HalalCore.
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
                <p>Konsultasi Legal:</p>
                <a href="mailto:legal@halalcore.id" className="text-[#004033] hover:underline font-semibold mt-0.5 block">
                  legal@halalcore.id
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-2xs">
            <header className="mb-8 pb-6 border-b border-slate-100">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                Syarat & Ketentuan Layanan
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Syarat dan ketentuan ini mengatur penggunaan seluruh layanan bimbingan, konsultasi online, dan persiapan dokumen sertifikasi halal yang diselenggarakan oleh PT Ana Nahnu Indonesia.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span>Efektif: 1 Januari 2024</span>
                <span>•</span>
                <span>Pembaruan: Oktober 2024</span>
                <span>•</span>
                <span>Versi 2.0</span>
              </div>
            </header>

            <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <section id="ketentuan-umum" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  1. Ketentuan Umum & Definisi
                </h2>
                <p className="text-slate-600">
                  Dengan mengirimkan formulir konsultasi atau mendaftar di HalalCore, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan ini tanpa paksaan.
                </p>
              </section>

              <section id="ruang-lingkup-layanan" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  2. Ruang Lingkup Layanan
                </h2>
                <p className="text-slate-600">
                  HalalCore mendampingi pelaku usaha dalam penyusunan Manual SJPH, validasi bahan halal, pelatihan penyelia halal, dan penginputan permohonan ke portal SIHALAL BPJPH & Lembaga Pemeriksa Halal (LPH).
                </p>
              </section>

              <section id="kewajiban-klien" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  3. Kewajiban & Integritas Klien
                </h2>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600 text-xs">
                  <li>Memberikan identitas resmi yang valid (NIK 16 digit, NIB 13 digit, NPWP).</li>
                  <li>Menjamin keterbukaan daftar bahan dan tidak menggunakan bahan najis atau non-halal.</li>
                  <li>Mematuhi prosedur standar kehalalan yang disyaratkan regulator.</li>
                </ul>
              </section>

              <section id="peran-halalcore" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  4. Peran & Batasan Tanggung Jawab
                </h2>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700">
                  <strong>Pemberitahuan Wewenang:</strong> HalalCore berperan sebagai pendamping teknis dan dokumen. Keputusan fatwa halal sepenuhnya merupakan hak prerogatif <strong>Komisi Fatwa MUI / Komite Fatwa Produk Halal</strong>, dan penerbitan Sertifikat Halal adalah wewenang <strong>BPJPH Kementerian Agama RI</strong>.
                </div>
              </section>

              <section id="biaya-pembayaran" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  5. Biaya, Invoice, & Voucher
                </h2>
                <p className="text-slate-600 text-xs">
                  Semua transaksi resmi diterbitkan melalui invoice bersistem. Biaya pendaftaran yang telah dialokasikan untuk registrasi BPJPH atau audit operasional LPH bersifat non-refundable.
                </p>
              </section>

              <section id="kerahasiaan-haki" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  6. Kerahasiaan (NDA) & Hak Cipta
                </h2>
                <p className="text-slate-600 text-xs">
                  Resep dan formula produk klien dijaga kerahasiaannya dengan standar Non-Disclosure Agreement (NDA). Seluruh materi dan modul HalalCore adalah hak cipta PT Ana Nahnu Indonesia.
                </p>
              </section>

              <section id="hukum-sengketa" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  7. Hukum yang Berlaku
                </h2>
                <p className="text-slate-600 text-xs">
                  Syarat dan ketentuan ini tunduk pada hukum Negara Kesatuan Republik Indonesia. Perselisihan diselesaikan melalui musyawarah mufakat atau yurisdiksi Pengadilan Negeri setempat.
                </p>
              </section>

              <section id="kontak-legal" className="scroll-mt-28">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2">
                  8. Kontak Bantuan
                </h2>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-slate-900">PT Ana Nahnu Indonesia (HalalCore)</p>
                  <p className="text-slate-600">Email Legal: <a href="mailto:legal@halalcore.id" className="text-[#004033] font-bold hover:underline">legal@halalcore.id</a></p>
                  <p className="text-slate-600">Hotline CS: +62 815-6495-5280</p>
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
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-gold-300 font-bold hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/form" className="hover:text-white transition-colors">Formulir Konsultasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
