import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HelpCircle,
    BookOpen,
    MessageSquare,
    Phone,
    Mail,
    Download,
    Printer,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    CheckCircle2,
    FileText,
    Users,
    Calendar,
    Award,
    Shield,
    ThumbsUp,
    ThumbsDown,
    PlayCircle,
    CreditCard,
    DollarSign,
    UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { systemSettingsService } from '../../services/systemSettingsService';
import { formatWhatsAppUrl } from '../../utils/format';

export default function OperationalHelp() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const isClient = user?.role === 'CLIENT';

    const [viewMode, setViewMode] = useState<'hub' | 'reader'>('hub');
    const [tab, setTab] = useState<'guide' | 'faq' | 'contact' | 'report'>('guide');
    const [expandedAccordion, setExpandedAccordion] = useState<number | null>(0);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
    const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);
    const [adminWaPhone, setAdminWaPhone] = useState('6281564955280');
    const [supportEmail, setSupportEmail] = useState('support@halalcore.id');
    const [operationalHours, setOperationalHours] = useState('Senin–Jumat 08.00–17.00 WIB');
    const [waDefaultMessage, setWaDefaultMessage] = useState('Halo Admin HalalCore, saya butuh bantuan.');

    useEffect(() => {
        systemSettingsService.getAll().then(res => {
            const p = res?.CS_PHONE || res?.cs_phone || res?.company_phone || res?.admin_whatsapp_number;
            if (p) setAdminWaPhone(p);
            const email = res?.SUPPORT_EMAIL || res?.support_email || res?.company_email || res?.COMPANY_EMAIL;
            if (email) setSupportEmail(email);
            const hours = res?.OPERATIONAL_HOURS || res?.operational_hours;
            if (hours) setOperationalHours(hours);
            const msg = res?.WHATSAPP_DEFAULT_MESSAGE || res?.whatsapp_default_message;
            if (msg) setWaDefaultMessage(msg);
        }).catch(() => {});
    }, []);

    const clientGuides = [
        {
            title: 'Cara Mengajukan Sertifikasi Halal',
            desc: 'Panduan melengkapi identitas pemilik, NIB, data produk, dan persyaratan usaha.',
            steps: [
                'Buka menu Dashboard lalu klik tombol "Mulai Pengajuan".',
                'Isi data identitas pelaku usaha (KTP, NIK, dan Nomor Kontak aktif).',
                'Lengkapi profil usaha dan legalitas (NIB, skala usaha, kategori produk, dan foto produk).',
                'Pilih atau masukkan kode Halal Advisor (pendamping halal) Anda.',
                'Klik "Kirim Pengajuan" untuk memulai proses verifikasi berkas.',
            ]
        },
        {
            title: 'Verifikasi Dokumen Kontrak & Pembayaran',
            desc: 'Langkah membaca, memverifikasi kontrak pendampingan sebelum menyelesaikan tagihan.',
            steps: [
                'Buka menu "Daftar Ajuan" lalu pilih pengajuan Anda.',
                'Buka Tab "2. Dokumen Kontrak" untuk meninjau rincian biaya dan pasal perjanjian.',
                'Centang persetujuan verifikasi kontrak layanan pendampingan.',
                'Buka Tab "3. Pembayaran" untuk melihat tagihan dan klik "Bayar Sekarang" via Midtrans.',
                'Pilih metode pembayaran (Transfer Bank, QRIS, Virtual Account) dan selesaikan transaksi.',
            ]
        },
        {
            title: 'Akses & Persetujuan Dokumen SJPH',
            desc: 'Persetujuan Sistem Jaminan Produk Halal setelah pembayaran lunas.',
            steps: [
                'Setelah pembayaran berhasil terkonfirmasi lunas, Tab "4. Dokumen SJPH" akan otomatis terbuka.',
                'Tinjau dokumen format resmi SJPH yang telah disiapkan sesuai standar BPJPH.',
                'Aktifkan toggle switch "Setujui Dokumen SJPH untuk Melanjutkan Proses".',
                'Pengajuan Anda akan otomatis diteruskan ke tim Manager Operasional untuk proses audit/sidang fatwa.',
            ]
        },
        {
            title: 'Penerbitan & Pengunduhan Sertifikat Halal (SH)',
            desc: 'Cara mengunduh sertifikat halal resmi setelah sidang fatwa selesai.',
            steps: [
                'Setelah sidang fatwa MUI menetapkan kehalalan produk, status ajuan menjadi "SH Terbit".',
                'Buka detail ajuan Anda di HalalCore.',
                'Klik tombol "Unduh Sertifikat Halal" untuk mengunduh dokumen resmi dalam format PDF.',
            ]
        }
    ];

    const clientFaqs = [
        {
            q: 'Apa perbedaan Sertifikasi Halal Reguler dan Self Declare?',
            a: 'Sertifikasi Self Declare diperuntukkan bagi usaha mikro/kecil dengan produk berisiko rendah dan bahan yang sudah pasti halal tanpa proses audit laboratorium rumit. Sedangkan Reguler diperuntukkan bagi usaha menengah/besar atau produk yang membutuhkan pemeriksaan oleh Lembaga Pemeriksa Halal (LPH) dan auditor halal.'
        },
        {
            q: 'Mengapa saya harus memverifikasi dokumen kontrak sebelum membayar?',
            a: 'Verifikasi dokumen kontrak memastikan seluruh data pelaku usaha, rincian biaya layanan, hak, serta kewajiban kedua belah pihak telah disepakati secara sah dan transparan sebelum transaksi pembayaran diproses.'
        },
        {
            q: 'Kapan Dokumen SJPH dapat saya akses?',
            a: 'Dokumen SJPH (Sistem Jaminan Produk Halal) dapat diakses pada Tab ke-4 segera setelah pembayaran tagihan pendampingan berhasil dikonfirmasi (lunas).'
        },
        {
            q: 'Bagaimana metode pembayaran yang didukung HalalCore?',
            a: 'HalalCore mendukung berbagai metode pembayaran otomatis melalui Midtrans Snap, termasuk Virtual Account Bank (BCA, Mandiri, BNI, BRI, Permata), QRIS (GoPay, OVO, ShopeePay), dan transfer langsung.'
        },
        {
            q: 'Bagaimana jika pengajuan saya membutuhkan revisi data?',
            a: 'Jika ada data yang belum lengkap atau perlu diperbaiki, Anda akan menerima pemberitahuan revisi beserta catatan perbaikan dari Halal Advisor atau tim QC. Anda dapat langsung mengedit data pada halaman detail pengajuan lalu mengirimkannya kembali.'
        },
        {
            q: 'Bagaimana cara menghubungi Admin atau CS HalalCore?',
            a: 'Anda dapat menghubungi layanan pelanggan resmi HalalCore melalui tombol WhatsApp yang tersedia di bagian bawah menu sidebar, atau melalui kontak dukungan di halaman Pusat Bantuan ini.'
        }
    ];

    const operationalFaqs = [
        {
            q: 'Bagaimana cara memfilter pengajuan yang belum memiliki advisor?',
            a: 'Buka menu Pengajuan Masuk atau Dashboard Marketing, pilih tab "Butuh Tunjuk Advisor" untuk menyaring pengajuan yang belum ditentukan pendampingnya.'
        },
        {
            q: 'Siapa yang berwenang menetapkan tanggal audit sertifikasi reguler?',
            a: 'Penetapan tanggal audit dilakukan oleh Manager Operasional setelah berkoordinasi dengan pihak LPH dan auditor halal mitra.'
        },
        {
            q: 'Bagaimana alur pengembalian berkas yang perlu perbaikan?',
            a: 'Tim QC atau Verifikator dapat menggunakan tombol "Pengembalian Data / Catatan Revisi" di panel Workflow Actions dan memilih tujuan (Klien, Advisor, atau Drafter).'
        }
    ];

    const guides = [
        {
            title: 'Cara mengelola pengajuan masuk',
            desc: 'Pelajari langkah untuk memeriksa, memfilter, dan menindaklanjuti pengajuan yang masuk.',
            steps: [
                'Buka menu Pengajuan Masuk dari sidebar utama.',
                'Gunakan filter jenis layanan, wilayah, atau halal advisor untuk menyaring data.',
                'Periksa status kelengkapan awal dokumen wajib (NIK, NIB, foto produk, penyelia halal).',
                'Klik tombol Detail untuk melihat berkas secara utuh, atau klik Tugaskan untuk mendistribusikan ke tim QCO.',
            ]
        },
        {
            title: 'Cara menugaskan QCO, HDO, dan Verifikator',
            desc: 'Panduan penugasan petugas dan pengaturan alur kerja verifikasi.',
            steps: [
                'Pilih pengajuan menggunakan checkbox di halaman Pengajuan Masuk.',
                'Klik tombol "Tugaskan Massal" di pojok kanan atas filter bar.',
                'Pilih tahapan kerja (Verifikasi QCO atau Penyusunan HDO) dan nama petugas yang dituju.',
                'Tentukan target SLA dan mode pembagian (bagi rata atau sesuai kapasitas terendah).',
                'Klik "Konfirmasi Penugasan" untuk menyelesaikan delegasi tugas.',
            ]
        },
        {
            title: 'Cara mengatur kuota fasilitasi self declare',
            desc: 'Atur kuota per wilayah/periode untuk fasilitasi sertifikasi self declare.',
            steps: [
                'Masuk ke menu Pengaturan, lalu pilih tab "Pengaturan Kuota Fasilitasi".',
                'Periksa total alokasi SEHATI dan jumlah kuota yang telah terpakai.',
                'Masukkan jumlah penggunaan kuota harian pada kolom yang tersedia per wilayah provinsi.',
                'Klik tombol "Simpan Update Harian" untuk memperbarui data realtime.',
            ]
        },
        {
            title: 'Cara melihat pengajuan melewati SLA',
            desc: 'Lihat daftar pengajuan yang melewati SLA dan langkah penanganannya.',
            steps: [
                'Pada Dashboard Overview, perhatikan kartu merah "Melewati SLA" atau panel "Perlu Tindakan".',
                'Klik pada peringatan tersebut untuk membuka daftar berkas yang terlambat.',
                'Gunakan aksi titik tiga lalu pilih "Alihkan QCO" atau "Eskalasi" untuk mempercepat penyelesaian berkas.',
            ]
        },
        {
            title: 'Cara membuat jadwal audit',
            desc: 'Buat dan kelola jadwal audit reguler maupun khusus.',
            steps: [
                'Buka menu Manajemen Audit dari sidebar utama.',
                'Klik tombol "Buat Jadwal Audit" di kanan atas.',
                'Pilih satu atau beberapa berkas pengajuan siap audit dari tabel sebelah kiri.',
                'Lengkapi form penjadwalan di sebelah kanan (LPH mitra, Auditor, Tanggal & Jam, Lokasi Onsite/Online).',
                'Kirim konfirmasi ke pihak klien dan auditor.',
            ]
        },
        {
            title: 'Cara menindaklanjuti pengembalian data',
            desc: 'Panduan menindaklanjuti pengajuan yang dikembalikan oleh auditor/validator.',
            steps: [
                'Periksa daftar berkas berstatus "Perlu Perbaikan" di Antrean QC atau Self Declare.',
                'Buka detail catatan pengembalian dari auditor/petugas.',
                'Klik "Kembalikan ke Advisor" dengan melampirkan catatan perbaikan spesifik.',
            ]
        }
    ];

    // ==========================================
    // VIEW: READER MODE PANDUAN PENGGUNA
    // ==========================================
    if (viewMode === 'reader') {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('hub')}>Pusat Bantuan</span>
                            <span>/</span>
                            <span className="text-gray-800 font-bold">Panduan Pengguna</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Panduan Pengguna HalalCore</h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Pelajari alur kerja dan fitur HalalCore melalui panduan langkah demi langkah.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toast.success('Mengunduh Panduan PDF...')}
                            className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5 text-gray-500" /> Unduh Panduan PDF
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <Printer className="w-3.5 h-3.5 text-gray-500" /> Cetak
                        </button>
                    </div>
                </div>

                {/* 3-Column Layout: TOC, Content, Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Table of Contents */}
                    <div className="lg:col-span-3 bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-4">
                        <p className="text-xs font-black text-gray-900">Daftar Isi</p>

                        <div className="space-y-1 text-xs">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-between cursor-pointer">
                                <span>1. Pengenalan HalalCore</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                            <div className="pl-4 space-y-1 text-[11px] text-gray-600">
                                <p className="font-bold text-emerald-700 cursor-pointer">• Tentang HalalCore</p>
                                <p className="hover:text-gray-900 cursor-pointer">• Peran Manajer Operasional</p>
                                <p className="hover:text-gray-900 cursor-pointer">• Mengenal Dashboard</p>
                            </div>

                            <div className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between cursor-pointer">
                                <span>2. Pengajuan & Verifikasi</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between cursor-pointer">
                                <span>3. Antrian QC dan HDO</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between cursor-pointer">
                                <span>4. Verifikasi Self Declare</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between cursor-pointer">
                                <span>5. Manajemen Audit</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between cursor-pointer">
                                <span>6. Laporan Operasional</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <div className="p-2 rounded-xl hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between cursor-pointer">
                                <span>7. Pengaturan & Hak Akses</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Middle: Reader Content */}
                    <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                        <div>
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                                BAB 1
                            </span>
                            <h2 className="text-xl font-black text-gray-900 mt-2">Tentang HalalCore</h2>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                HalalCore adalah sistem informasi halal yang membantu pengelolaan proses sertifikasi, verifikasi, audit, dan pelaporan operasional secara terintegrasi.
                            </p>
                        </div>

                        {/* Tujuan Panduan info box */}
                        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-1">
                            <p className="font-black text-emerald-900 flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-emerald-600" />
                                Tujuan Panduan
                            </p>
                            <p className="text-emerald-800 text-[11px] leading-relaxed">
                                Panduan ini membantu Manajer Operasional memahami fitur utama dan menjalankan proses kerja secara konsisten.
                            </p>
                        </div>

                        {/* Fitur Utama Cards Grid */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Fitur Utama</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                        <span>Kelola Pengajuan</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Pantau dan proses pengajuan sertifikasi halal.</p>
                                </div>

                                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        <span>Verifikasi Berjenjang</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Kelola proses QC, HDO, dan Self Declare.</p>
                                </div>

                                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        <Users className="w-4 h-4 text-amber-600" />
                                        <span>Manajemen Audit</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Atur penugasan LPH dan auditor.</p>
                                </div>

                                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        <Award className="w-4 h-4 text-purple-600" />
                                        <span>Laporan Operasional</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Pantau kinerja melalui laporan dan dashboard.</p>
                                </div>
                            </div>
                        </div>

                        {/* Alur Kerja Utama Stepper */}
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Alur Kerja Utama</h3>

                            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                                {[
                                    { num: '1', title: 'Pengajuan Masuk', sub: 'Usaha mengajukan sertifikasi halal.' },
                                    { num: '2', title: 'QC', sub: 'Review kelayakan dokumen oleh QC.' },
                                    { num: '3', title: 'HDO', sub: 'Verifikasi lapangan oleh HDO.' },
                                    { num: '4', title: 'Audit', sub: 'Audit oleh LPH dan auditor.' },
                                    { num: '5', title: 'Selesai', sub: 'Sertifikat diterbitkan dan terverifikasi.' },
                                ].map((step, idx) => (
                                    <div key={idx} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                        <div className="w-5 h-5 mx-auto rounded-full bg-brand-700 text-white font-bold text-[9px] flex items-center justify-center">
                                            {step.num}
                                        </div>
                                        <p className="font-bold text-gray-900">{step.title}</p>
                                        <p className="text-[9px] text-gray-400 leading-tight">{step.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Chapter Navigation */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                            <button
                                onClick={() => setViewMode('hub')}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold"
                            >
                                ← Kembali ke Pusat Bantuan
                            </button>
                            <button
                                onClick={() => toast.success('Membuka Bab 2: Peran Manajer Operasional')}
                                className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1"
                            >
                                <span>Selanjutnya: Peran Manajer Operasional</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Reading Progress & Feedback */}
                    <div className="lg:col-span-3 space-y-5">
                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3">
                            <p className="text-xs font-black text-gray-900">Progress Membaca</p>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center text-xs font-black text-gray-900">
                                    12%
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-800">1 dari 8 bab</p>
                                    <p className="text-[10px] text-gray-400">selesai dibaca</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                            <p className="font-black text-gray-900">Bantuan Terkait</p>
                            <div className="space-y-2">
                                <button className="w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><PlayCircle className="w-4 h-4 text-brand-600" /> Video Pengenalan</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button className="w-full p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-600" /> FAQ Pengguna Baru</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Feedback Card */}
                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                            <p className="font-black text-gray-900">Apakah panduan ini membantu?</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => { setFeedbackGiven('yes'); toast.success('Terima kasih atas feedback Anda!'); }}
                                    className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                                        feedbackGiven === 'yes' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" /> Ya
                                </button>
                                <button
                                    onClick={() => { setFeedbackGiven('no'); toast.success('Terima kasih, kami akan terus meningkatkan panduan.'); }}
                                    className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 ${
                                        feedbackGiven === 'no' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <ThumbsDown className="w-3.5 h-3.5" /> Tidak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW: HELP HUB (MAIN MENU BANTUAN)
    // ==========================================
    const activeGuides = isClient ? clientGuides : guides;
    const activeFaqs = isClient ? clientFaqs : operationalFaqs;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    {isClient ? 'Pusat Bantuan & Panduan Pelaku Usaha' : 'Pusat Bantuan Operasional'}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {isClient 
                        ? 'Panduan lengkap pengajuan sertifikasi halal, verifikasi kontrak, pembayaran, akses SJPH, dan tanya-jawab umum.' 
                        : 'Pusat bantuan, panduan penggunaan, dan dukungan sistem untuk Manajer Operasional.'}
                </p>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-4">
                {[
                    { key: 'guide', label: 'Panduan' },
                    { key: 'faq', label: 'FAQ' },
                    { key: 'contact', label: 'Kontak Dukungan' },
                    { key: 'report', label: 'Pelaporan Masalah' },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className={`pb-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                            tab === t.key
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Main 2-Column Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Mode FAQ */}
                    {tab === 'faq' ? (
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-brand-600" />
                                    Pertanyaan yang Sering Diajukan (FAQ)
                                </h2>
                            </div>

                            <div className="space-y-2 text-xs">
                                {activeFaqs.map((faq, idx) => {
                                    const isExpanded = expandedFaq === idx;
                                    return (
                                        <div key={idx} className="border border-gray-150 rounded-2xl overflow-hidden">
                                            <button
                                                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                                                className="w-full p-4 bg-white hover:bg-gray-50 flex items-center justify-between text-left font-bold text-gray-800 transition-colors"
                                            >
                                                <span className="text-gray-900 font-bold">{faq.q}</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />}
                                            </button>
                                            {isExpanded && (
                                                <div className="p-4 bg-gray-50/80 border-t border-gray-150 text-[11px] text-gray-600 leading-relaxed font-medium">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : tab === 'contact' ? (
                        /* Mode Kontak Dukungan */
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                            <h2 className="text-sm font-black text-gray-900">Hubungi Tim Layanan HalalCore</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-xs">WhatsApp Admin Resmi</h4>
                                    <p className="text-[10px] text-gray-500">Respon cepat via pesan WhatsApp untuk konsultasi dan kendala teknis.</p>
                                    <a 
                                        href={formatWhatsAppUrl(adminWaPhone, waDefaultMessage)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline pt-2"
                                    >
                                        Buka Chat WhatsApp →
                                    </a>
                                </div>
                                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-xs">Email Support</h4>
                                    <p className="text-[10px] text-gray-500">Kirimkan pertanyaan resmi atau lampiran berkas via email.</p>
                                    <a 
                                        href={`mailto:${supportEmail}`} 
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline pt-2"
                                    >
                                        {supportEmail} →
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : tab === 'report' ? (
                        /* Mode Pelaporan Masalah */
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">Laporkan Kendala atau Masalah</h2>
                            <p className="text-xs text-gray-500">Sampaikan kendala teknis yang Anda alami saat menggunakan sistem.</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Judul Kendala</label>
                                    <input className="glass-input w-full text-xs" placeholder="Contoh: Kesulitan mengunggah file KTP" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Deskripsi Lengkap</label>
                                    <textarea className="glass-input w-full text-xs" rows={4} placeholder="Jelaskan detail kendala yang dialami..."></textarea>
                                </div>
                                <button 
                                    onClick={() => toast.success('Laporan Anda berhasil dikirim ke tim support!')}
                                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                                >
                                    Kirim Laporan
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Mode Default: Panduan Pengguna Accordion */
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-gray-900">
                                    {isClient ? 'Panduan Pengajuan Sertifikasi Halal' : 'Panduan Pengguna'}
                                </h2>
                                <button
                                    onClick={() => setViewMode('reader')}
                                    className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                                >
                                    Buka Reader Mode →
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                {activeGuides.map((item, idx) => {
                                    const isExpanded = expandedAccordion === idx;
                                    return (
                                        <div key={idx} className="border border-gray-150 rounded-2xl overflow-hidden">
                                            <button
                                                onClick={() => setExpandedAccordion(isExpanded ? null : idx)}
                                                className="w-full p-4 bg-white hover:bg-gray-50 flex items-center justify-between text-left font-bold text-gray-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{item.title}</p>
                                                        <p className="text-[10px] text-gray-400 font-normal">{item.desc}</p>
                                                    </div>
                                                </div>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </button>

                                            {isExpanded && (
                                                <div className="p-4 bg-gray-50 border-t border-gray-150 space-y-2 text-[11px] text-gray-700">
                                                    <p className="font-bold text-gray-900 mb-1">Langkah-langkah:</p>
                                                    {item.steps.map((step, sIdx) => (
                                                        <div key={sIdx} className="flex items-start gap-2">
                                                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                                                {sIdx + 1}
                                                            </span>
                                                            <p>{step}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Panduan Cepat / Akses Menu Cepat */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-black text-gray-900">Akses Cepat Fitur</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {isClient ? (
                                <>
                                    <div
                                        onClick={() => navigate('/dashboard/submissions')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Daftar Ajuan</p>
                                            <p className="text-[10px] text-gray-500">Lihat seluruh riwayat & status berkas Anda.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/submissions')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Pembayaran Pengajuan</p>
                                            <p className="text-[10px] text-gray-500">Selesaikan pembayaran di Tab 3 detail pengajuan.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/estimasi')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Perhitungan Tarif</p>
                                            <p className="text-[10px] text-gray-500">Simulasi biaya sertifikasi reguler.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/profile')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                                <UserCircle className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Profil Usaha</p>
                                            <p className="text-[10px] text-gray-500">Perbarui data profil & kontak akun.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div
                                        onClick={() => navigate('/dashboard/pengajuan-masuk')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Pengajuan Masuk</p>
                                            <p className="text-[10px] text-gray-500">Kelola dan tindak lanjuti pengajuan yang masuk.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/pengajuan-masuk')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Penugasan & Alur</p>
                                            <p className="text-[10px] text-gray-500">Atur penugasan QCO, HDO, dan Verifikator.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/manajemen-audit')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Manajemen Audit</p>
                                            <p className="text-[10px] text-gray-500">Buat jadwal, monitor pelaksanaan audit.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/pengaturan-operasional')}
                                        className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <p className="font-bold text-gray-900">Kuota Fasilitasi</p>
                                            <p className="text-[10px] text-gray-500">Atur kuota fasilitasi self declare per periode.</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-brand-600 mt-3 flex items-center gap-1">Buka →</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Kontak WhatsApp, Status, dll. */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Hubungi Dukungan */}
                    <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <p className="font-black text-gray-900 text-sm">Hubungi Layanan Bantuan</p>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 pt-3 text-gray-600">
                            <div className="flex items-start gap-2.5">
                                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400">WhatsApp Resmi CS</p>
                                    <p className="font-bold text-gray-800">{adminWaPhone}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400">Email Resmi</p>
                                    <p className="font-bold text-gray-800 break-all">{supportEmail}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400">Jam Layanan</p>
                                    <p className="font-bold text-gray-800">{operationalHours}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <a
                                href={formatWhatsAppUrl(adminWaPhone, waDefaultMessage)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4" /> Chat WhatsApp Admin
                            </a>
                            <button
                                onClick={() => toast.success('Mengunduh panduan lengkap...')}
                                className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Unduh Panduan PDF
                            </button>
                        </div>
                    </div>

                    {/* Status Sistem */}
                    <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <p className="font-black text-gray-900">Status Sistem</p>
                        </div>
                        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-0.5">
                            <p className="font-bold text-emerald-900">Sistem berjalan normal</p>
                            <p className="text-[10px] text-emerald-700">Layanan HalalCore aktif & terhubung BPJPH.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
