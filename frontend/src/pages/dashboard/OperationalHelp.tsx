import { useState } from 'react';
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
    ExternalLink,
    FileText,
    Users,
    Calendar,
    Award,
    Shield,
    ThumbsUp,
    ThumbsDown,
    PlayCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OperationalHelp() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'hub' | 'reader'>('hub');
    const [tab, setTab] = useState<'guide' | 'faq' | 'contact' | 'report'>('guide');
    const [expandedAccordion, setExpandedAccordion] = useState<number | null>(0);
    const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

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
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bantuan</h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Pusat bantuan, panduan penggunaan, dan dukungan sistem untuk Manajer Operasional.</p>
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
                {/* Left: Panduan Pengguna Accordions & Panduan Cepat Cards */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Panduan Pengguna Accordion */}
                    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black text-gray-900">Panduan Pengguna</h2>
                            <button
                                onClick={() => setViewMode('reader')}
                                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                            >
                                Buka Reader Mode →
                            </button>
                        </div>

                        <div className="space-y-2 text-xs">
                            {guides.map((item, idx) => {
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

                    {/* Panduan Cepat Cards */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-black text-gray-900">Panduan Cepat</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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
                        </div>
                    </div>
                </div>

                {/* Right: Hubungi Dukungan, Status Sistem, Dokumen Populer */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Hubungi Dukungan */}
                    <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <p className="font-black text-gray-900 text-sm">Hubungi Dukungan</p>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 pt-3 text-gray-600">
                            <div className="flex items-start gap-2.5">
                                <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400">Email</p>
                                    <p className="font-bold text-gray-800">support@halalcore.id</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400">WhatsApp / Telepon</p>
                                    <p className="font-bold text-gray-800">0812-3456-7890</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <HelpCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] text-gray-400">Jam Layanan</p>
                                    <p className="font-bold text-gray-800">Senin–Jumat 08.00–17.00 WIB</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => toast.success('Tiket bantuan dibuat')}
                                className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-2"
                            >
                                <Mail className="w-4 h-4" /> Kirim Tiket Bantuan
                            </button>
                            <button
                                onClick={() => toast.success('Mengunduh panduan lengkap...')}
                                className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Unduh Panduan
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
                            <p className="text-[10px] text-emerald-700">Semua layanan berjalan dengan baik.</p>
                        </div>
                        <p className="text-[11px] font-bold text-brand-600 cursor-pointer hover:underline">Lihat Detail Status →</p>
                    </div>

                    {/* Dokumentasi Populer */}
                    <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                        <p className="font-black text-gray-900">Dokumentasi Populer</p>
                        <div className="space-y-2">
                            <a href="#" className="flex items-center justify-between text-gray-700 hover:text-brand-700 py-1 font-medium border-b border-gray-100">
                                <span>Panduan Dashboard</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                            <a href="#" className="flex items-center justify-between text-gray-700 hover:text-brand-700 py-1 font-medium border-b border-gray-100">
                                <span>SOP Operasional</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                            <a href="#" className="flex items-center justify-between text-gray-700 hover:text-brand-700 py-1 font-medium border-b border-gray-100">
                                <span>Panduan Self Declare</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                            <a href="#" className="flex items-center justify-between text-gray-700 hover:text-brand-700 py-1 font-medium">
                                <span>Panduan Audit Reguler</span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
