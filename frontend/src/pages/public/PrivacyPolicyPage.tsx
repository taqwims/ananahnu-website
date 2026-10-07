import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Shield, Printer } from 'lucide-react';

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
                        <span className="text-slate-900 font-semibold">Kebijakan Privasi</span>
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
                                    <Shield className="w-3.5 h-3.5 text-emerald-700" />
                                    Legal & Kepatuhan
                                </p>
                                <p className="text-slate-500 leading-relaxed">
                                    Dokumen ini mengikat seluruh pengguna platform dan layanan konsultasi HalalCore.
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
                                <p>Butuh bantuan hukum?</p>
                                <a href="mailto:privacy@halalcore.id" className="text-emerald-700 hover:underline font-semibold mt-0.5 block">
                                    privacy@halalcore.id
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Legal Content */}
                    <main className="lg:col-span-8 prose prose-slate max-w-none">
                        <header className="mb-10 pb-8 border-b border-slate-200">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                                Kebijakan Privasi & Pelindungan Data Pribadi
                            </h1>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                PT Ana Nahnu Indonesia ("HalalCore", "Kami") menetapkan Kebijakan Privasi ini sebagai wujud komitmen transparansi dan kepatuhan penuh terhadap ketentuan peraturan perundang-undangan di bidang pelindungan data pribadi di Republik Indonesia.
                            </p>
                        </header>

                        <div className="space-y-10 text-sm text-slate-700 leading-relaxed">
                            {/* Section 1 */}
                            <section id="pendahuluan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    1. Pendahuluan & Dasar Hukum
                                </h2>
                                <p>
                                    Kebijakan Privasi ini mengatur tata cara perolehan, pengumpulan, pengolahan, penganalisisan, penyimpanan, perbaikan, penampilan, pengumuman, pengalihan, pengungkapan, dan penghapusan data pribadi Pengguna platform HalalCore.
                                </p>
                                <p className="mt-2">
                                    Kebijakan ini disusun berdasarkan landasan hukum:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).</li>
                                    <li>Undang-Undang Nomor 33 Tahun 2014 tentang Jaminan Produk Halal beserta perubahannya (UU Cipta Kerja).</li>
                                    <li>Peraturan Pemerintah Nomor 39 Tahun 2021 tentang Penyelenggaraan Bidang Jaminan Produk Halal.</li>
                                    <li>Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik sebagaimana telah diubah terakhir dengan UU Nomor 1 Tahun 2024.</li>
                                </ul>
                            </section>

                            {/* Section 2 */}
                            <section id="data-dikumpulkan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    2. Data Pribadi yang Dikumpulkan
                                </h2>
                                <p>
                                    Dalam rangka penyediaan layanan pendampingan dan sertifikasi halal, kami mengumpulkan data berupa:
                                </p>
                                <div className="mt-3 space-y-3">
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                                        <p className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">A. Data Identitas Penanggung Jawab</p>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Nama lengkap, Nomor Induk Kependudukan (NIK 16 digit), salinan Kartu Tanda Penduduk (e-KTP), jabatan dalam badan usaha, alamat surat elektronik (email), dan nomor telepon seluler / WhatsApp aktif.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                                        <p className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">B. Data Legalitas Usaha & Fasilitas</p>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Nomor Induk Berusaha (NIB 13 digit), NPWP badan/perorangan, alamat fasilitas produksi, denah alur proses produksi, daftar bahan baku, sertifikat halal bahan pendukung, serta dokumen ketertelusuran produk.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                                        <p className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">C. Data Teknis & Akses Platform</p>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Alamat IP, tipe peramban, log aktivitas verifikasi dokumen, serta riwayat interaksi dalam portal sistem HalalCore.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section id="tujuan-pemrosesan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    3. Tujuan Pemrosesan Data
                                </h2>
                                <p>Kami memproses data pribadi dan data usaha Anda semata-mata untuk:</p>
                                <ol className="list-decimal pl-5 space-y-1.5 mt-2 text-slate-600">
                                    <li>Melakukan verifikasi keabsahan identitas pemohon dan legalitas usaha pelaku usaha.</li>
                                    <li>Menyusun dokumen Sistem Jaminan Produk Halal (SJPH / Manual Halal) sesuai pedoman BPJPH.</li>
                                    <li>Mendaftarkan permohonan sertifikasi halal ke sistem informasi resmi SIHALAL milik BPJPH dan Lembaga Pemeriksa Halal (LPH).</li>
                                    <li>Menjalankan koordinasi penjadwalan audit, audit kecukupan, audit lapangan, serta sidang fatwa.</li>
                                    <li>Menerbitkan dokumen administrasi resmi berupa Surat Penawaran Harga (SPH), Invoice pembayaran, dan tanda terima.</li>
                                    <li>Memberikan pembaruan status dan layanan purna-sertifikasi (pemeliharaan komitmen halal).</li>
                                </ol>
                            </section>

                            {/* Section 4 */}
                            <section id="dasar-hukum-pemrosesan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    4. Landasan Pemrosesan & Persetujuan
                                </h2>
                                <p>
                                    Pemrosesan data pribadi oleh HalalCore didasarkan pada:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li><strong>Persetujuan Eksplisit (Explicit Consent):</strong> Persetujuan yang diberikan oleh Pengguna saat mendaftar akun atau menandatangani formulir pengajuan pendampingan.</li>
                                    <li><strong>Pelaksanaan Perjanjian:</strong> Pemenuhan hak dan kewajiban kontraktual antara HalalCore dan Pengguna terkait jasa konsultasi halal.</li>
                                    <li><strong>Kewajiban Hukum:</strong> Pemenuhan ketentuan regulasi mandatori sertifikasi halal berdasarkan hukum RI.</li>
                                </ul>
                            </section>

                            {/* Section 5 */}
                            <section id="pengungkapan-pihak-ketiga" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    5. Pengungkapan kepada Pihak Ketiga
                                </h2>
                                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-lg text-xs leading-relaxed mb-3">
                                    <strong>Prinsip Kerahasiaan:</strong> HalalCore tidak pernah dan tidak akan pernah menjual, menyewakan, atau memperdagangkan data pribadi maupun rahasia formula produk klien kepada pihak ketiga manapun untuk tujuan komersial atau periklanan.
                                </div>
                                <p>
                                    Data hanya diungkapkan secara terbatas dan proporsional kepada instansi dan lembaga resmi berikut:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li><strong>BPJPH (Badan Penyelenggara Jaminan Produk Halal):</strong> Selaku regulator utama penerbitan sertifikat halal.</li>
                                    <li><strong>Lembaga Pemeriksa Halal (LPH):</strong> Lembaga independen terakreditasi yang bertugas melakukan audit lapangan dan pengujian laboratorium.</li>
                                    <li><strong>Komisi Fatwa MUI / Komite Fatwa Produk Halal:</strong> Lembaga yang berwenang menetapkan fatwa kehalalan produk.</li>
                                    <li><strong>Penyedia Infrastruktur Keamanan:</strong> Mitra penyedia layanan komputasi awan dan gerbang pembayaran (payment gateway) resmi yang tunduk pada standar ISO/IEC 27001 dan PCI-DSS.</li>
                                </ul>
                            </section>

                            {/* Section 6 */}
                            <section id="keamanan-penyimpanan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    6. Keamanan & Retensi Data
                                </h2>
                                <p>
                                    HalalCore menerapkan standar keamanan teknis dan organisasi yang ketat, meliputi:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li>Enkripsi data saat transit (SSL/TLS 256-bit) dan enkripsi data saat istirahat (encryption-at-rest).</li>
                                    <li>Kontrol akses berbasis peran (Role-Based Access Control / RBAC) sehingga hanya staf dan konsultan bersertifikat yang dapat melihat berkas.</li>
                                    <li>Sanitasi dan validasi ketat terhadap setiap input formulir untuk memitigasi serangan siber (XSS, SQL Injection).</li>
                                </ul>
                                <p className="mt-2">
                                    Data disimpan selama masa berlakunya sertifikat halal (4 tahun) ditambah periode retensi arsip audit yang diwajibkan oleh regulasi jaminan produk halal.
                                </p>
                            </section>

                            {/* Section 7 */}
                            <section id="hak-subjek-data" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    7. Hak-Hak Subjek Data Pribadi
                                </h2>
                                <p>
                                    Sesuai Pasal 5 sampai dengan Pasal 13 UU PDP, Pengguna memiliki hak:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                                    <li>Mendapatkan informasi mengenai kejelasan identitas, dasar kepentingan hukum, dan tujuan permintaan data.</li>
                                    <li>Mengakses dan memperoleh salinan data pribadi yang dikelola oleh HalalCore.</li>
                                    <li>Melengkapi, memperbarui, dan/atau memperbaiki ketidakakuratan data pribadi.</li>
                                    <li>Menarik kembali persetujuan pemrosesan data pribadi (sepanjang tidak melanggar kewajiban hukum yang sedang berjalan).</li>
                                    <li>Mengajukan keberatan atas tindakan pengambilan keputusan yang hanya didasarkan pada pemrosesan otomatis.</li>
                                </ul>
                            </section>

                            {/* Section 8 */}
                            <section id="perubahan-kebijakan" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    8. Pembaruan Kebijakan Privasi
                                </h2>
                                <p>
                                    Kami berhak mengubah atau memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan perkembangan hukum, regulasi BPJPH, atau penyempurnaan layanan. Perubahan akan diberitahukan melalui portal resmi atau email terdaftar.
                                </p>
                            </section>

                            {/* Section 9 */}
                            <section id="kontak-dpo" className="scroll-mt-28">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
                                    9. Kontak Petugas Pelindungan Data (DPO)
                                </h2>
                                <p>
                                    Untuk pertanyaan, permintaan hak subjek data, atau pelaporan keluhan terkait pelindungan data pribadi, silakan hubungi:
                                </p>
                                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                                    <p className="font-bold text-slate-900">Unit Kepatuhan & Data Protection Officer</p>
                                    <p className="text-slate-700">PT Ana Nahnu Indonesia</p>
                                    <p className="text-slate-600">Email: <a href="mailto:privacy@halalcore.id" className="text-emerald-700 font-semibold hover:underline">privacy@halalcore.id</a></p>
                                    <p className="text-slate-600">Alamat: Halal Core Center, Jakarta, Indonesia</p>
                                    <p className="text-slate-600">Layanan Pelanggan: +62 21 1234 5678 / +62 815-6495-5280</p>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
