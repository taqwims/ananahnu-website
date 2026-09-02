import { useState } from 'react';
import { Download, Loader2, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { Submission } from '../../../types';
import toast from 'react-hot-toast';
import { submissionService } from '../../../services/submissionService';

interface SJPHTextPreviewProps {
    submission: Submission;
}

export default function SJPHTextPreview({ submission }: SJPHTextPreviewProps) {
    const [downloading, setDownloading] = useState(false);
    const client = submission.client;

    const handlePrint = () => {
        const printElem = document.getElementById(`sjph-doc-${submission.id}`);
        if (!printElem) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Gagal membuka jendela cetak. Izinkan popup pada browser Anda.');
            return;
        }
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dokumen SJPH - ${client?.business_name || client?.client_name || 'Pelaku Usaha'}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        .no-print { display: none !important; }
                        body { -webkit-print-color-adjust: exact; padding: 0; }
                    }
                    body { padding: 24px; font-family: ui-sans-serif, system-ui, sans-serif; background: #fff; color: #111827; }
                </style>
            </head>
            <body>
                ${printElem.outerHTML}
                <script>
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadSJPH = async () => {
        try {
            setDownloading(true);
            toast.loading('Menyiapkan Dokumen SJPH (PDF)...', { id: 'download-sjph' });
            await submissionService.downloadSJPH(submission.id);
            toast.success('Dokumen SJPH berhasil diunduh', { id: 'download-sjph' });
        } catch (e: any) {
            toast.error(e.message || 'Gagal mengunduh Dokumen SJPH', { id: 'download-sjph' });
        } finally {
            setDownloading(false);
        }
    };

    if (!client) return null;

    const businessName = client.business_name || client.client_name || 'Pelaku Usaha';
    const clientName = client.client_name || businessName;
    const address = client.address || '-';
    const nib = client.nib && !client.nib.startsWith('DRAFT-') ? client.nib : '-';
    const nik = client.nik || '-';
    const productName = client.product_name || 'Produk Makanan / Minuman';
    const advisorName = submission.consultant?.full_name || client.facilitator?.full_name || 'Pendamping Halal Terverifikasi';
    const advisorPhone = submission.consultant?.phone || client.facilitator?.phone || '-';

    const today = new Date();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 no-print">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                            <ShieldCheck className="w-4 h-4" />
                        </span>
                        <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                            Dokumen Sistem Jaminan Produk Halal (SJPH)
                        </h4>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium mt-1">
                        Format resmi sesuai standar BPJPH Kemenag RI. Anda dapat meninjau, mencetak, atau mengunduh sebagai PDF.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={handleDownloadSJPH}
                        disabled={downloading}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>Download PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        title="Cetak Dokumen"
                    >
                        <Printer className="w-4 h-4 text-emerald-700" />
                        <span>Cetak</span>
                    </button>
                </div>
            </div>

            {/* In-App Printable Document Sheet */}
            <div 
                id={`sjph-doc-${submission.id}`}
                className="bg-white p-5 sm:p-12 rounded-3xl border border-gray-200 shadow-xl space-y-8 font-sans text-gray-900 leading-relaxed text-xs sm:text-sm overflow-hidden break-words"
            >
                {/* Header Kop */}
                <div className="text-center border-b-2 border-gray-900 pb-6 space-y-1">
                    <h2 className="text-sm sm:text-lg font-black tracking-tight uppercase text-gray-900">
                        MANUAL SISTEM JAMINAN PRODUK HALAL (SJPH)
                    </h2>
                    <h3 className="text-xs sm:text-base font-black text-emerald-800 uppercase tracking-wide">
                        {businessName}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-600 font-medium">
                        Berdasarkan Keputusan Kepala Badan Penyelenggara Jaminan Produk Halal (BPJPH) Kemenag RI
                    </p>
                </div>

                {/* Info Table */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                        I. INFORMASI DAN PROFIL PELAKU USAHA
                    </h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Nama Usaha / Merk</span>
                            <span className="sm:col-span-2 font-bold text-gray-900 break-words">{businessName}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 p-2.5 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Penanggung Jawab / Pimpinan</span>
                            <span className="sm:col-span-2 font-bold text-gray-900 break-words">{clientName}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Nomor Induk Berusaha (NIB)</span>
                            <span className="sm:col-span-2 font-mono font-bold text-gray-900 break-words">{nib}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 p-2.5 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Nomor Induk Kependudukan (NIK)</span>
                            <span className="sm:col-span-2 font-mono font-bold text-gray-900 break-words">{nik}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Alamat Fasilitas Produksi</span>
                            <span className="sm:col-span-2 text-gray-900 font-medium break-words">{address}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-200 p-2.5 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Kelompok / Jenis Produk</span>
                            <span className="sm:col-span-2 font-bold text-gray-900 break-words">{productName}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 p-2.5 bg-gray-50/50 gap-0.5 sm:gap-0">
                            <span className="font-bold text-gray-600 sm:col-span-1">Pendamping Proses Produk Halal</span>
                            <span className="sm:col-span-2 font-bold text-emerald-800 break-words">{advisorName} ({advisorPhone})</span>
                        </div>
                    </div>
                </div>

                {/* BAB I: KOMITMEN DAN TANGGUNG JAWAB */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                        II. KOMITMEN DAN TANGGUNG JAWAB
                    </h4>
                    
                    <div className="space-y-2 text-xs text-gray-700 leading-relaxed pl-1">
                        <div>
                            <p className="font-bold text-gray-900">2.1 Kebijakan Halal</p>
                            <p className="mt-1">
                                Kami selaku pimpinan <strong>{businessName}</strong> berkomitmen penuh untuk senantiasa memproduksi makanan/minuman dan barang halal secara konsisten sesuai dengan syariat Islam dan regulasi Badan Penyelenggara Jaminan Produk Halal (BPJPH). Kami memastikan seluruh bahan, fasilitas, dan alur proses produksi terbebas dari kontaminasi najis dan bahan haram.
                            </p>
                        </div>
                        <div className="pt-2">
                            <p className="font-bold text-gray-900">2.2 Tanggung Jawab Manajemen Puncak & Sumber Daya Manusia</p>
                            <p className="mt-1">
                                Pimpinan usaha bertanggung jawab langsung dalam penetapan tim manajemen halal internal, mengalokasikan sumber daya yang cukup untuk menjaga integritas halal, serta memberikan pengarahan berkala kepada seluruh pekerja agar mematuhi standar higienitas dan kehalalan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* BAB II: BAHAN DAN PROSES PRODUK HALAL */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                        III. BAHAN DAN PROSES PRODUK HALAL (PPH)
                    </h4>
                    
                    <div className="space-y-2 text-xs text-gray-700 leading-relaxed pl-1">
                        <div>
                            <p className="font-bold text-gray-900">3.1 Kriteria Bahan Baku & Bahan Tambahan</p>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                                <li>Semua bahan yang digunakan berasal dari bahan yang jelas kehalalannya (daftar bahan positif atau bersertifikat halal resmi).</li>
                                <li>Tidak menggunakan bahan yang mengandung babi, turunan babi, alkohol/khamr, darah, bangkai, atau bahan berbahaya.</li>
                                <li>Penyimpanan bahan baku dilakukan di tempat yang bersih, tertutup, dan terpisah dari bahan non-halal.</li>
                            </ul>
                        </div>
                        <div className="pt-2">
                            <p className="font-bold text-gray-900">3.2 Lokasi, Tempat, dan Alat Produksi</p>
                            <ul className="list-disc list-inside space-y-1 mt-1">
                                <li>Fasilitas dan peralatan produksi hanya digunakan khusus untuk proses produk halal.</li>
                                <li>Ruang pengolahan dijaga kebersihannya dan bebas dari lalu lintas hewan peliharaan maupun hama.</li>
                                <li>Peralatan dicuci menggunakan air bersih yang mengalir dan sabun yang aman.</li>
                            </ul>
                        </div>
                        <div className="pt-2">
                            <p className="font-bold text-gray-900">3.3 Pengemasan, Penyimpanan, dan Distribusi</p>
                            <p className="mt-1">
                                Kemasan produk terbuat dari bahan yang bersih, aman (food grade), tidak beracun, dan tidak terkontaminasi najis. Penyimpanan produk jadi terjamin kebersihannya sebelum didistribusikan kepada konsumen.
                            </p>
                        </div>
                    </div>
                </div>

                {/* BAB III: PEMANTAUAN DAN EVALUASI */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                        IV. PEMANTAUAN, EVALUASI, DAN PENANGANAN KETIDAKSESUAIAN
                    </h4>
                    
                    <div className="space-y-2 text-xs text-gray-700 leading-relaxed pl-1">
                        <p>
                            1. <strong>Audit Internal:</strong> Pemeriksaan mandiri pelaksanaan SJPH dilakukan minimal 1 (satu) kali setahun atau setiap terdapat perubahan formula bahan/proses produksi.
                        </p>
                        <p>
                            2. <strong>Penanganan Produk Tidak Sesuai:</strong> Jika ditemukan bahan atau produk yang tidak memenuhi kriteria halal, produk tersebut segera dikarantina, tidak boleh dijual/diedarkan, dan dimusnahkan secara tercatat.
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-600 mb-6">
                        <span>Ditetapkan di: <strong>{address.split(',')[0] || 'Tempat Usaha'}</strong></span>
                        <span>Tanggal: <strong>{dateStr}</strong></span>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center pt-2">
                        <div className="space-y-14">
                            <p className="font-bold text-xs text-gray-800 uppercase tracking-wider">
                                Pimpinan Pelaku Usaha
                            </p>
                            <div>
                                <p className="font-black text-xs text-gray-900 uppercase underline">
                                    {clientName}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">Penanggung Jawab Usaha</p>
                            </div>
                        </div>

                        <div className="space-y-14">
                            <p className="font-bold text-xs text-gray-800 uppercase tracking-wider">
                                Pendamping Proses Produk Halal (PPH)
                            </p>
                            <div>
                                <p className="font-black text-xs text-emerald-800 uppercase underline">
                                    {advisorName}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">Pendamping Halal Terverifikasi</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-3 rounded-xl bg-gray-50 border border-gray-200 text-center text-[10px] text-gray-500 font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Dokumen ini dibuat dan disahkan secara elektronik melalui Sistem Manajemen Sertifikasi Halal PT Ana Nahnu Indonesia (Halalcore).
                    </div>
                </div>
            </div>
        </div>
    );
}
