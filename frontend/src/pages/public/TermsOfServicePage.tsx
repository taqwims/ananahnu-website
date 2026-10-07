import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Scale, Printer } from 'lucide-react';

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
            const scrollPosition = window.scrollY + 150;
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
        <div className="bg-white min-h-screen text-slate-800 font-sans antialiased">
            {/* Minimal Sub-Header */}
            <div className="border-b border-slate-200 bg-slate-50/60 sticky top-16 sm:top-20 z-20 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Beranda</span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-900 font-semibold">Syarat & Ketentuan</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline text-slate-400">Terakhir diperbarui: 7 Oktober 2024</span>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Dokumen</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Sticky Table of Contents (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-4">
                        <div className="sticky top-36 space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <p className="font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Scale className="w-3.5 h-3.5 text-emerald-700" />
                                    Perjanjian Penggunaan
                                </p>
                                <p className="text-slate-500 leading-relaxed">
                                    Syarat dan ketentuan ini berlaku untuk setiap pelaku usaha, perorangan, atau konsultan yang menggunakan ekosistem HalalCore.
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
                                                ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-700 -ml-[13px] pl-3'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                    >
                                        {sec.title}
                                    </button>
                                ))}
                            </nav>

                            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                                <p>Konsultasi Legal:</p>
                                <a href="mailto:legal@halalcore.id" className="text-emerald-700 hover:underline font-semibold mt-0.5 block">
                                    legal@halalcore.id
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Legal Content */}
                    <main className="lg:col-span-8 prose prose-slate max-w-none">
                        <header className="mb-10 pb-8 border-b border-slate-200">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                                Syarat & Ketentuan Layanan (Terms of Service)
                            </h1>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Mohon membaca Syarat & Ketentuan ini secara seksama sebelum mengakses atau menggunakan portal, sistem pengajuan, dan modul bimbingan HalalCore yang dioperasikan oleh PT Ana Nahnu Indonesia.
                            </p>
                        </header>

                        <div className="space-y-10 text-sm text-slate-700 leading-relaxed">
                            {/* Section 1 */}
                            <section id="ketentuan-umum" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    1. Ketentuan Umum & Definisi
                                </h2>
                                <p>Dalam dokumen Syarat & Ketentuan ini:</p>
                                <ul className="list-disc pl-5 space-y-1.5 mt-1 text-slate-600">
                                    <li><strong>"HalalCore" / "Kami":</strong> Merujuk pada PT Ana Nahnu Indonesia, badan hukum yang menyediakan platform digital konsultasi sertifikasi halal, pelatihan, dan manajemen berkas SJPH.</li>
                                    <li><strong>"Klien" / "Pengguna":</strong> Pelaku usaha (mikro, kecil, menengah, atau besar) serta konsultan pendamping halal yang terdaftar pada sistem.</li>
                                    <li><strong>"BPJPH":</strong> Badan Penyelenggara Jaminan Produk Halal pada Kementerian Agama Republik Indonesia.</li>
                                    <li><strong>"LPH":</strong> Lembaga Pemeriksa Halal yang berwenang melakukan kegiatan pemeriksaan dan/atau pengujian kehalalan produk.</li>
                                    <li><strong>"SJPH":</strong> Sistem Jaminan Produk Halal yang disusun oleh pelaku usaha untuk menjaga kesinambungan proses produk halal.</li>
                                </ul>
                            </section>

                            {/* Section 2 */}
                            <section id="ruang-lingkup-layanan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    2. Ruang Lingkup Layanan
                                </h2>
                                <p>HalalCore menyediakan jasa konsultasi dan fasilitas teknologi yang mencakup:</p>
                                <ol className="list-decimal pl-5 space-y-1 mt-1 text-slate-600">
                                    <li>Pendampingan penyusunan berkas administrasi dan Manual SJPH (jalur Reguler maupun Self Declare).</li>
                                    <li>Audit awal (pre-audit assessment) untuk meninjau kecukupan dokumen bahan baku dan fasilitas pabrik/outlet.</li>
                                    <li>Bimbingan pendaftaran dan penginputan data permohonan ke portal SIHALAL BPJPH.</li>
                                    <li>Pelatihan Penyelia Halal dan Auditor Internal Halal bersertifikat.</li>
                                    <li>Pemantauan status pengajuan permohonan sertifikat halal hingga penetapan fatwa.</li>
                                </ol>
                            </section>

                            {/* Section 3 */}
                            <section id="kewajiban-klien" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    3. Kewajiban & Integritas Klien
                                </h2>
                                <p>Klien menyetujui dan berkewajiban untuk:</p>
                                <ul className="list-disc pl-5 space-y-1.5 mt-1 text-slate-600">
                                    <li>Memberikan dokumen legalitas yang sah (KTP, NIK 16 digit, NIB 13 digit, NPWP) serta data bahan baku yang akurat dan benar.</li>
                                    <li>Tidak memalsukan, memanipulasi, atau menyembunyikan bahan non-halal, bahan kritis tanpa sertifikat, atau bahan yang dilarang syariat Islam.</li>
                                    <li>Menjaga komitmen kehalalan fasilitas produksi dari kontaminasi najis atau bahan yang tidak diizinkan.</li>
                                    <li>Menjaga kerahasiaan kata sandi (password) akun platform HalalCore dan bertanggung jawab atas setiap akses yang dilakukan melalui akun tersebut.</li>
                                </ul>
                            </section>

                            {/* Section 4 */}
                            <section id="peran-halalcore" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    4. Peran & Batasan Tanggung Jawab
                                </h2>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed mb-3">
                                    <strong>Batasan Kewenangan:</strong> HalalCore berperan sebagai <em>Konsultan Pendamping Teknis & Administratif</em>. Ketetapan status Halal (Fatwa) merupakan wewenang mutlak <strong>Komisi Fatwa MUI / Komite Fatwa Produk Halal</strong>, dan penerbitan Sertifikat Halal resmi merupakan wewenang <strong>BPJPH Kementerian Agama RI</strong>.
                                </div>
                                <p>
                                    HalalCore tidak bertanggung jawab apabila terjadi penolakan atau keterlambatan proses sertifikasi yang diakibatkan oleh:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li>Ketidakakuratan atau pemalsuan data bahan baku yang diserahkan oleh Klien.</li>
                                    <li>Kegagalan Klien dalam melengkapi perbaikan temuan audit LPH dalam batas waktu yang ditentukan regulasi.</li>
                                    <li>Perubahan kebijakan regulasi pemerintah atau gangguan sistem SIHALAL BPJPH di luar kendali wajar HalalCore (force majeure).</li>
                                </ul>
                            </section>

                            {/* Section 5 */}
                            <section id="biaya-pembayaran" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    5. Biaya, Invoice, & Voucher Promo
                                </h2>
                                <ul className="list-disc pl-5 space-y-1.5 mt-1 text-slate-600">
                                    <li><strong>Penetapan Biaya:</strong> Biaya jasa pendampingan dicantumkan secara transparan pada Surat Penawaran Harga (SPH) atau Invoice resmi bersistem HalalCore.</li>
                                    <li><strong>Kode Voucher / Promo:</strong> Kupon promo potongan biaya hanya berlaku untuk kode yang terverifikasi aktif pada sistem database HalalCore dan tidak dapat diuangkan.</li>
                                    <li><strong>Kebijakan Pengembalian Dana:</strong> Biaya yang telah disetorkan untuk pendaftaran resmi ke sistem pemerintah atau biaya operasional audit LPH yang telah berjalan bersifat non-refundable, kecuali diatur secara tertulis dalam SPK khusus.</li>
                                </ul>
                            </section>

                            {/* Section 6 */}
                            <section id="kerahasiaan-haki" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    6. Kerahasiaan (NDA) & Hak Cipta
                                </h2>
                                <p>
                                    <strong>Kerahasiaan Resep & Data Dagang:</strong> HalalCore mengikat seluruh staf dan konsultan pada perjanjian kerahasiaan non-disclosure. Resep, formula, diagram alir rahasia, dan daftar pemasok Klien dijaga kerahasiaannya dan hanya disampaikan kepada auditor resmi BPJPH/LPH.
                                </p>
                                <p className="mt-2">
                                    <strong>Hak Atas Kekayaan Intelektual (HAKI):</strong> Semua template SJPH, modul pelatihan, merek dagang HalalCore, logo, dan kode piranti lunak adalah kekayaan intelektual milik PT Ana Nahnu Indonesia yang dilindungi hukum.
                                </p>
                            </section>

                            {/* Section 7 */}
                            <section id="pembatalan-pengakhiran" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    7. Pembatalan & Pengakhiran Layanan
                                </h2>
                                <p>
                                    HalalCore berhak menghentikan layanan pendampingan atau membekukan akun Pengguna secara sepihak apabila ditemukan adanya:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li>Tindakan penipuan, manipulasi bahan haram/najis, atau pemalsuan identitas hukum.</li>
                                    <li>Penyalahgunaan fasilitas platform untuk tindakan ilegal atau melanggar UU ITE.</li>
                                    <li>Pelanggaran berat terhadap komitmen jaminan produk halal.</li>
                                </ul>
                            </section>

                            {/* Section 8 */}
                            <section id="hukum-sengketa" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    8. Hukum yang Berlaku & Penyelesaian Sengketa
                                </h2>
                                <p>
                                    Syarat & Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan secara musyawarah mufakat. Apabila tidak tercapai mufakat dalam waktu 30 (tiga puluh) hari kalender, para pihak sepakat menyelesaikannya melalui Pengadilan Negeri di wilayah hukum kedudukan PT Ana Nahnu Indonesia.
                                </p>
                            </section>

                            {/* Section 9 */}
                            <section id="kontak-legal" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    9. Kontak & Bantuan Hukum
                                </h2>
                                <p>
                                    Untuk korespondensi resmi atau pertanyaan seputar ketentuan perjanjian ini:
                                </p>
                                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                                    <p className="font-bold text-slate-900">Divisi Legal & Kepatuhan Korporasi</p>
                                    <p className="text-slate-700">PT Ana Nahnu Indonesia</p>
                                    <p className="text-slate-600">Email: <a href="mailto:legal@halalcore.id" className="text-emerald-700 font-semibold hover:underline">legal@halalcore.id</a> / <a href="mailto:info@halalcore.id" className="text-emerald-700 font-semibold hover:underline">info@halalcore.id</a></p>
                                    <p className="text-slate-600">Telepon: +62 21 1234 5678</p>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
