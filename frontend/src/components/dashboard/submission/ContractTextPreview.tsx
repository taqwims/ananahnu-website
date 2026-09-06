import { useState, useEffect } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import type { Submission } from '../../../types';
import toast from 'react-hot-toast';
import { submissionService } from '../../../services/submissionService';
import { systemSettingsService } from '../../../services/systemSettingsService';
import logoImg from '../../../assets/logo.png';

interface ContractTextPreviewProps {
    submission: Submission;
}

const formatFieldLabel = (label?: string, key?: string) => {
    const raw = (label || key || '').trim();
    if (!raw) return '-';
    const dict: Record<string, string> = {
        'ingredient list': 'Daftar Bahan (Ingredient List)',
        'ingredient_list': 'Daftar Bahan (Ingredient List)',
        'product_list': 'Daftar Produk',
        'product list': 'Daftar Produk',
        'matrix_bahan': 'Matriks Bahan',
        'ingredient_matrix': 'Matriks Bahan',
        'email': 'Email Akun OSS',
        'password': 'Password Akun OSS',
    };
    if (dict[raw.toLowerCase()]) return dict[raw.toLowerCase()];
    return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const renderFieldValue = (raw?: string) => {
    if (!raw) return <span className="text-gray-400 italic">-</span>;
    const trimmed = raw.trim();

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
            const parsed = JSON.parse(trimmed);

            // 1. Array of Objects (e.g. ingredient list, product list)
            if (Array.isArray(parsed)) {
                if (parsed.length === 0) return <span className="text-gray-400 italic">Tidak ada data</span>;

                if (typeof parsed[0] === 'object' && parsed[0] !== null) {
                    const allKeys = Array.from(new Set(parsed.flatMap(item => Object.keys(item || {}))));

                    const formatHeader = (k: string) => {
                        const map: Record<string, string> = {
                            nama: 'Nama Bahan / Produk',
                            nama_bahan: 'Nama Bahan',
                            nama_produk: 'Nama Produk',
                            produsen: 'Produsen / Pabrik',
                            penerbit: 'Lembaga Penerbit Halal',
                            no_id: 'No. Sertifikat / ID',
                            no_sertifikat: 'No. Sertifikat',
                            tanggal: 'Masa Berlaku / Tanggal',
                            merk: 'Merek',
                            status: 'Status',
                            bahan: 'Bahan',
                        };
                        return map[k.toLowerCase()] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    };

                    return (
                        <div className="overflow-x-auto my-1">
                            <table className="w-full text-[11px] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <thead>
                                    <tr className="bg-sky-50/80 text-sky-950 font-bold border-b border-gray-200 text-left">
                                        <th className="p-1.5 border-r border-gray-200 text-center w-8">No</th>
                                        {allKeys.map(k => (
                                            <th key={k} className="p-1.5 border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                                                {formatHeader(k)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {parsed.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/60">
                                            <td className="p-1.5 border-r border-gray-200 text-center font-bold text-gray-500 bg-gray-50/30">
                                                {idx + 1}
                                            </td>
                                            {allKeys.map(k => {
                                                const val = item[k];
                                                const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '-');
                                                return (
                                                    <td key={k} className="p-1.5 border-r border-gray-200 text-gray-800 last:border-r-0 break-words font-medium">
                                                        {valStr}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                // 2. Array of Strings / Primitives
                return (
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-800">
                        {parsed.map((item, i) => (
                            <li key={i}>{String(item)}</li>
                        ))}
                    </ul>
                );
            }

            // 3. Single Object
            if (typeof parsed === 'object' && parsed !== null) {
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        {Object.entries(parsed).map(([k, v]) => (
                            <div key={k} className="flex gap-1.5">
                                <span className="font-bold text-gray-600 capitalize">{k.replace(/_/g, ' ')}:</span>
                                <span className="text-gray-900">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                        ))}
                    </div>
                );
            }
        } catch {
            // Fall through to plain text if JSON parse fails
        }
    }

    return <span>{raw}</span>;
};

export default function ContractTextPreview({ submission }: ContractTextPreviewProps) {
    const [downloading, setDownloading] = useState(false);
    const [supportEmail, setSupportEmail] = useState('support@halalcore.id');
    const client = submission.client;

    useEffect(() => {
        systemSettingsService.getAll().then(res => {
            const email = res?.SUPPORT_EMAIL || res?.support_email || res?.company_email || res?.COMPANY_EMAIL;
            if (email) setSupportEmail(email);
        }).catch(() => {});
    }, []);

    const handlePrint = () => {
        const printElem = document.getElementById(`contract-doc-${submission.id}`);
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
                <title>Kontrak Layanan Pendampingan - ${submission.tracking_number || ''}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        .no-print { display: none !important; }
                        body { -webkit-print-color-adjust: exact; padding: 0; }
                    }
                    body { padding: 20px; font-family: ui-sans-serif, system-ui, sans-serif; background: #fff; }
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

    if (!client) return null;
    const clientName = client.business_name || client.client_name;
    const address = client.address || '-';
    const idDisplay = client.nib ? (client.nik ? `${client.nik} / ${client.nib}` : client.nib) : (client.nik || '-');
    const advisorName = submission.consultant?.full_name || 'PT Ana Nahnu Indonesia';
    const advisorId = submission.consultant?.id ? submission.consultant.id.substring(0, 8) : '-';
    const brandName = submission.field_values?.find(
        fv => fv.form_field?.field_key === 'brand_name' || fv.form_field?.field_key === 'nama_merk' || fv.form_field?.field_key === 'merk'
    )?.text_value || client.business_name || '-';

    const clientEmail = submission.field_values?.find(
        fv => fv.form_field?.field_key === 'email'
    )?.text_value || '-';

    const clientPartyDesc = client.business_name ? 'Badan Usaha' : 'Pelaku Usaha';

    // Parse breakdown
    let breakdown: any[] = [];
    try {
        if (submission.cost_detail?.cost_breakdown_data) {
            const raw = JSON.parse(submission.cost_detail.cost_breakdown_data);
            if (Array.isArray(raw)) {
                breakdown = raw.filter((item: any) => {
                    if (!item) return false;
                    const cat = item.category?.toUpperCase();
                    if (submission.service_type === 'SELF_DECLARE_MANDIRI') {
                        if (cat === 'LPH' || cat === 'MUI') return false;
                    }
                    return true;
                });
            }
        }
    } catch (e) {
        console.error(e);
    }

    // Format Rupiah helper
    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const calculatedTotal = breakdown.reduce((sum, item) => sum + (typeof item.total === 'number' ? item.total : 0), 0);
    const totalAmount = calculatedTotal > 0 
        ? calculatedTotal 
        : (submission.cost_detail?.total_amount 
            || submission.invoice?.amount 
            || (submission.invoices && submission.invoices.length > 0 ? submission.invoices[0].amount : (submission.service_type === 'SELF_DECLARE_MANDIRI' ? 230000 : 0)));

    if (breakdown.length === 0) {
        if (submission.service_type === 'SELF_DECLARE_MANDIRI') {
            breakdown = [
                {
                    name: 'Biaya Self Declare Mandiri',
                    category: 'PENDAMPINGAN',
                    unit_cost: totalAmount > 0 ? totalAmount : 230000,
                    total: totalAmount > 0 ? totalAmount : 230000,
                }
            ];
        }
    }
    const today = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const contractDay = days[today.getDay()];
    const contractDateText = `${today.getDate()} ${months[today.getMonth() + 1]} ${today.getFullYear()}`;
    const generatedAtLocal = contractDateText;

    const handleDownloadContract = async () => {
        try {
            setDownloading(true);
            toast.loading('Mengunduh Kontrak...', { id: 'download-contract' });
            await submissionService.downloadContract(submission.id, 'pdf');
            toast.success('Kontrak berhasil diunduh', { id: 'download-contract' });
        } catch (e: any) {
            toast.error(e.message || 'Gagal mengunduh kontrak', { id: 'download-contract' });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/80 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 font-sans no-print">
                <div className="min-w-0">
                    <span className="text-xs font-bold text-indigo-950 block truncate">Dokumen Kontrak Layanan Pendampingan</span>
                    <span className="text-[11px] text-indigo-700 block">Unduh dokumen Kontrak Layanan & Lampiran Data (PDF) atau cetak draf.</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={handleDownloadContract}
                        disabled={downloading}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>Download PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                    >
                        <Printer className="w-4 h-4 text-gray-500" />
                        <span>Cetak Draf</span>
                    </button>
                </div>
            </div>

            <div id={`contract-doc-${submission.id}`} className="space-y-8 text-xs text-gray-800 leading-relaxed font-serif bg-white p-4 sm:p-10 border border-gray-200 rounded-xl shadow-lg overflow-hidden break-words">
                {/* Logo and Header Block */}
                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div className="text-left space-y-1 font-sans">
                    <p className="text-[10px] font-bold text-amber-700 tracking-wider">PERJANJIAN LAYANAN</p>
                    <h2 className="text-xl font-black text-sky-900 tracking-wide">KONTRAK PENDAMPINGAN</h2>
                    <h3 className="text-md font-bold text-sky-900 tracking-wide">SERTIFIKASI HALAL</h3>
                    <p className="text-xs text-gray-600 font-mono">Nomor: {submission.contract_number || 'DRAFT'}</p>
                </div>
                <div className="flex items-center">
                    <img src={logoImg} alt="HalalCore" className="h-11 w-auto object-contain" />
                </div>
            </div>

            {/* Meta Table */}
            <div className="font-sans overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden min-w-[340px]">
                    <tbody>
                        <tr>
                            <td className="w-1/3 border border-gray-200 bg-sky-50/50 p-2.5 font-bold text-sky-900">Nomor Pengajuan</td>
                            <td className="border border-gray-200 p-2.5 text-gray-700">{submission.tracking_number || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-200 bg-sky-50/50 p-2.5 font-bold text-sky-900">Status Dokumen</td>
                            <td className="border border-gray-200 p-2.5 font-bold text-gray-700">{(submission.status as string) === 'READY_FOR_SIGNATURE' ? 'READY FOR SIGNATURE' : (submission.status as string) === 'SIGNED' ? 'SIGNED' : 'DRAFT'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-200 bg-sky-50/50 p-2.5 font-bold text-sky-900">Skema / Paket</td>
                            <td className="border border-gray-200 p-2.5 text-gray-700">{submission.service_type} / {brandName}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-200 bg-sky-50/50 p-2.5 font-bold text-sky-900">Tanggal Dibuat</td>
                            <td className="border border-gray-200 p-2.5 text-gray-700">{generatedAtLocal}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Orange Notice Block */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-sans">
                <p className="text-xs text-slate-700">
                    <strong className="text-amber-700">PENTING. </strong>
                    Dokumen berstatus DRAFT belum mengikat Para Pihak. Perjanjian menjadi efektif setelah ditandatangani oleh kedua pihak dan persyaratan mulai layanan pada Pasal 6 terpenuhi.
                </p>
            </div>

            {/* Intro */}
            <div className="space-y-4 font-sans text-xs text-gray-700 text-justify">
                <p>
                    Pada hari ini, <strong>{contractDay}</strong>, tanggal <strong>{contractDateText}</strong>, bertempat di <strong>Ciamis</strong>, Para Pihak menerangkan dan menyepakati Perjanjian Layanan Pendampingan Sertifikasi Halal (selanjutnya disebut "Perjanjian") sebagai berikut:
                </p>
                
                <div className="space-y-1">
                    <p className="font-bold text-sky-900 uppercase">PIHAK PERTAMA - PENYEDIA LAYANAN</p>
                    <p>
                        PT ANA NAHNU INDONESIA, badan hukum Indonesia dengan NIB 0411230033734 dan alamat di Dusun Cikohkol, Desa Sukasari, Kecamatan Banjarsari, Kabupaten Ciamis, Jawa Barat 46383, pemilik dan pengelola platform Halalcore, dalam Perjanjian ini diwakili oleh <strong>{advisorName}</strong>, ID Halal Advisor <strong>{advisorId}</strong>, yang bertindak untuk dan atas nama PT Ana Nahnu Indonesia, selanjutnya disebut "PIHAK PERTAMA".
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="font-bold text-sky-900 uppercase">PIHAK KEDUA - KLIEN/PELAKU USAHA</p>
                    <p>
                        <strong>{clientName}</strong>, {clientPartyDesc}, NIK/NIB/nomor identitas <strong>{idDisplay}</strong>, beralamat di {address}, dalam hal merupakan badan usaha diwakili secara sah oleh <strong>{client.client_name}</strong> selaku Pemohon, selanjutnya disebut "PIHAK KEDUA".
                    </p>
                </div>

                <p>
                    PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut "Para Pihak" dan masing-masing disebut "Pihak".
                </p>
                <p>
                    Para Pihak terlebih dahulu menerangkan bahwa PIHAK PERTAMA menyediakan jasa konsultasi dan pendampingan administratif sertifikasi halal; PIHAK KEDUA bermaksud mengajukan sertifikasi halal atas produk/usaha sebagaimana Ringkasan Pengajuan; dan keputusan penerbitan sertifikat halal sepenuhnya berada pada lembaga yang berwenang sesuai peraturan perundang-undangan.
                </p>
            </div>

            {/* Pasals */}
            <div className="space-y-6 text-xs font-sans text-gray-700 text-justify">
                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 1</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">DEFINISI</h5>
                    <p className="pl-6 -indent-6">    (1)  "Halalcore" adalah platform dan merek layanan milik PT Ana Nahnu Indonesia yang digunakan untuk pengelolaan data, dokumen, komunikasi, pembayaran, dan status pendampingan.</p>
                    <p className="pl-6 -indent-6">    (2)  "Halal Advisor" adalah personel yang ditunjuk PIHAK PERTAMA sebagai penghubung dan pelaksana pendampingan. Halal Advisor bukan BPJPH, auditor halal, LPH, Pendamping Proses Produk Halal, Penyelia Halal, maupun lembaga penetap kehalalan, kecuali memiliki penunjukan terpisah yang sah untuk fungsi tersebut.</p>
                    <p className="pl-6 -indent-6">    (3)  "Ringkasan Pengajuan" adalah Lampiran 1 yang memuat data klien, skema layanan, ruang lingkup, produk/fasilitas, biaya, dan ketentuan khusus yang menjadi satu kesatuan dengan Perjanjian.</p>
                    <p className="pl-6 -indent-6">    (4)  "Hari Kerja" adalah Senin sampai Jumat, selain hari libur nasional dan hari yang ditetapkan sebagai hari libur oleh Pemerintah Republik Indonesia.</p>
                    <p className="pl-6 -indent-6">    (5)  "Pihak Berwenang" adalah BPJPH dan/atau lembaga lain yang secara hukum menjalankan pemeriksaan, pendampingan proses produk halal, penetapan kehalalan, penerbitan sertifikat, atau fungsi lain dalam penyelenggaraan jaminan produk halal.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 2</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">OBJEK DAN RUANG LINGKUP LAYANAN</h5>
                    <p className="pl-6 -indent-6">    (1)  PIHAK KEDUA menunjuk PIHAK PERTAMA untuk memberikan pendampingan sertifikasi halal dengan skema {submission.service_type} dan paket {brandName} atas ruang lingkup sebagaimana Lampiran 1.</p>
                    <p className="pl-6 -indent-6">    (2)  Layanan dapat meliputi penilaian awal kelayakan skema; penyampaian daftar kebutuhan data; pemeriksaan kelengkapan administratif; pendampingan penyusunan dokumen Sistem Jaminan Produk Halal; pendampingan input atau pengajuan pada sistem resmi; koordinasi proses verifikasi, pemeriksaan, audit, atau pendampingan yang relevan; tindak lanjut koreksi administratif; pemantauan status; dan penyerahan salinan sertifikat apabila terbit.</p>
                    <p className="pl-6 -indent-6">    (3)  Komponen yang secara tegas ditandai "Termasuk" dalam Lampiran 1 merupakan kewajiban PIHAK PERTAMA. Komponen yang ditandai "Tidak Termasuk" atau tidak dicantumkan bukan bagian dari harga Perjanjian.</p>
                    <p className="pl-6 -indent-6">    (4)  Untuk skema pernyataan pelaku usaha/self declare, pernyataan kehalalan dan dokumen yang menurut sistem wajib disetujui pelaku usaha tetap harus ditandatangani atau diafirmasi sendiri oleh PIHAK KEDUA. Halal Advisor tidak berwenang menggantikan pernyataan faktual PIHAK KEDUA.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 3</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">LAYANAN YANG DIKECUALIKAN DAN PERUBAHAN RUANG LINGKUP</h5>
                    <p className="pl-6 -indent-6">    (1)  Kecuali dinyatakan termasuk dalam Lampiran 1, layanan ini tidak mencakup pengurusan NIB atau perizinan usaha lain; pengujian laboratorium; pengadaan atau penggantian bahan; renovasi fasilitas; biaya perjalanan di luar wilayah layanan; biaya resmi BPJPH/LPH/lembaga fatwa; pelatihan Penyelia Halal; penerjemahan; legalisasi dokumen; perubahan sertifikat setelah terbit; dan layanan pemeliharaan pascasertifikasi.</p>
                    <p className="pl-6 -indent-6">    (2)  Penambahan merek, produk, varian, gerai, fasilitas, lokasi produksi, bahan berisiko, atau perubahan skema setelah Perjanjian efektif merupakan perubahan ruang lingkup dan harus memperoleh persetujuan tertulis Para Pihak mengenai tambahan biaya dan waktu.</p>
                    <p className="pl-6 -indent-6">    (3)  PIHAK PERTAMA tidak boleh menagihkan biaya tambahan tanpa persetujuan PIHAK KEDUA. Perubahan tarif pihak ketiga hanya dapat diteruskan kepada PIHAK KEDUA setelah disertai penjelasan dan persetujuan tertulis.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 4</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">HAK DAN KEWAJIBAN PIHAK PERTAMA</h5>
                    <p className="pl-6 -indent-6">    (1)  Memberikan layanan secara profesional, transparan, beritikad baik, dan sesuai ruang lingkup yang disepakati.</p>
                    <p className="pl-6 -indent-6">    (2)  Menunjuk Halal Advisor sebagai narahubung dan, bila diperlukan, menggantinya dengan personel lain yang setara dengan pemberitahuan kepada PIHAK KEDUA.</p>
                    <p className="pl-6 -indent-6">    (3)  Menyampaikan daftar kebutuhan, kekurangan dokumen, status penting, serta permintaan perbaikan melalui dashboard dan/atau kanal komunikasi resmi.</p>
                    <p className="pl-6 -indent-6">    (4)  Menjaga kerahasiaan data PIHAK KEDUA and menggunakannya hanya untuk pelaksanaan layanan, pemenuhan kewajiban hukum, pengendalian mutu, dan kepentingan lain yang telah disetujui.</p>
                    <p className="pl-6 -indent-6">    (5)  Memperbaiki tanpa biaya jasa tambahan apabila pengajuan dikembalikan semata-mata karena kesalahan administratif PIHAK PERTAMA, sepanjang data sumber dari PIHAK KEDUA benar dan tidak berubah.</p>
                    <p className="pl-6 -indent-6">    (6)  Menerbitkan invoice/kuitansi resmi dan menerima pembayaran hanya melalui metode pembayaran resmi yang tercantum pada invoice atau dashboard.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 5</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">HAK DAN KEWAJIBAN PIHAK KEDUA</h5>
                    <p className="pl-6 -indent-6">    (1)  Memberikan data, dokumen, keterangan bahan, produk, proses, fasilitas, dan kondisi usaha yang benar, lengkap, mutakhir, serta dapat dipertanggungjawabkan.</p>
                    <p className="pl-6 -indent-6">    (2)  Menunjuk personel yang berwenang, memberikan akses yang wajar untuk pemeriksaan/pengambilan bukti, menghadiri audit atau pendampingan, dan merespons permintaan perbaikan paling lambat 3 (Tiga) Hari Kerja atau dalam batas waktu pihak berwenang.</p>
                    <p className="pl-6 -indent-6">    (3)  Menjaga kesesuaian bahan dan proses dengan data yang diajukan, menerapkan kewajiban Sistem Jaminan Produk Halal, serta memberitahukan perubahan bahan, pemasok, produk, proses, lokasi, atau personel terkait.</p>
                    <p className="pl-6 -indent-6">    (4)  Memastikan telah memperoleh hak penggunaan merek, dokumen, foto, sertifikat bahan, dan informasi pihak ketiga yang diserahkan kepada PIHAK PERTAMA.</p>
                    <p className="pl-6 -indent-6">    (5)  Membayar biaya sesuai Lampiran 1 dan tidak melakukan pembayaran pribadi kepada Halal Advisor. Pembayaran kepada rekening pribadi atau tanpa kuitansi resmi tidak dianggap sebagai pembayaran kepada PIHAK PERTAMA, kecuali dikonfirmasi tertulis oleh perusahaan.</p>
                    <p className="pl-6 -indent-6">    (6)  Memeriksa draf sebelum diajukan. Persetujuan PIHAK KEDUA melalui dashboard, tanda tangan, OTP, atau mekanisme afirmasi lain merupakan konfirmasi bahwa data yang diajukan telah diperiksa.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 6</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">MULAI LAYANAN, JANGKA WAKTU, DAN PENUNDAAN</h5>
                    <p className="pl-6 -indent-6">    (1)  Perjanjian efektif pada tanggal ditandatangani oleh Para Pihak. Pekerjaan mulai dihitung setelah PIHAK PERTAMA menerima pembayaran tahap pertama dan dokumen minimum yang ditandai wajib pada Lampiran 1.</p>
                    <p className="pl-6 -indent-6">    (2)  Target penyelesaian pekerjaan yang berada dalam kendali PIHAK PERTAMA adalah 6 (Enam) Hari Kerja, dengan rincian tahap pada Lampiran 1. Target ini bukan jaminan tanggal terbit sertifikat.</p>
                    <p className="pl-6 -indent-6">    (3)  Waktu tunggu akibat jadwal atau sistem pihak berwenang; proses pemeriksaan/audit; sidang/penetapan kehalalan; penerbitan sertifikat; permintaan tambahan dari pihak berwenang; gangguan sistem nasional; atau keterlambatan PIHAK KEDUA tidak dihitung sebagai keterlambatan PIHAK PERTAMA.</p>
                    <p className="pl-6 -indent-6">    (4)  Jika PIHAK KEDUA tidak merespons atau tidak melengkapi persyaratan selama 3 (Tiga) hari kalender sejak pengingat terakhir, pengajuan dapat berstatus Ditunda. Setelah 15 (Lima Belas) hari kalender, PIHAK PERTAMA dapat menutup layanan dengan pemberitahuan, tanpa menghapus hak PIHAK KEDUA atas rekonsiliasi pembayaran menurut Pasal 8.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 7</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">BIAYA, DAN PEMBAYARAN</h5>
                    <p className="pl-6 -indent-6">    (1)  Nilai Perjanjian adalah sebesar {formatRupiah(totalAmount)} ({submission.cost_detail?.total_amount ? 'Terbilang Terlampir' : '-'}), dengan rincian pada Lampiran 1.</p>
                    <p className="pl-6 -indent-6">    (2)  Pembayaran dilakukan 100% ketika tanda tangan kontrak.</p>
                    <p className="pl-6 -indent-6">    (3)  Setiap perubahan nilai Perjanjian wajib tercatat dalam dashboard, invoice, atau addendum yang disetujui Para Pihak.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 8</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">PEMBATALAN, PENGAKHIRAN, DAN PENGEMBALIAN DANA</h5>
                    <p className="pl-6 -indent-6">    (1)  Sebelum pekerjaan dimulai, PIHAK KEDUA dapat membatalkan layanan dan menerima pengembalian pembayaran setelah dikurangi biaya pihak ketiga yang telah dibayarkan dan biaya administrasi yang telah diinformasikan dalam Lampiran 1.</p>
                    <p className="pl-6 -indent-6">    (2)  Setelah pekerjaan dimulai, pembatalan oleh PIHAK KEDUA diselesaikan melalui rekonsiliasi berdasarkan pekerjaan yang telah dilaksanakan, biaya pihak ketiga yang tidak dapat ditarik kembali, serta kewajiban yang telah timbul. Kelebihan pembayaran, jika ada, dikembalikan paling lambat 14 Hari Kerja setelah rekonsiliasi disepakati.</p>
                    <p className="pl-6 -indent-6">    (3)  PIHAK PERTAMA dapat menangguhkan atau mengakhiri layanan apabila terdapat data palsu, ketidaksesuaian substansial, kegiatan yang melanggar hukum, penolakan memenuhi kewajiban penting, atau tunggakan pembayaran; dengan pemberitahuan dan kesempatan perbaikan yang wajar, kecuali pelanggaran tidak dapat diperbaiki.</p>
                    <p className="pl-6 -indent-6">    (4)  Apabila PIHAK PERTAMA menghentikan layanan tanpa kesalahan PIHAK KEDUA, PIHAK PERTAMA mengembalikan bagian biaya jasa untuk pekerjaan yang belum dilaksanakan, tidak termasuk biaya pihak ketiga yang sah dan tidak dapat ditarik kembali.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 9</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">KEPUTUSAN SERTIFIKASI DAN BATAS TANGGUNG JAWAB</h5>
                    <p className="pl-6 -indent-6">    (1)  PIHAK PERTAMA tidak menjanjikan atau menjamin diterbitkannya sertifikat halal, karena verifikasi, pemeriksaan, penetapan kehalalan, dan penerbitan sertifikat merupakan kewenangan pihak berwenang.</p>
                    <p className="pl-6 -indent-6">    (2)  PIHAK PERTAMA bertanggung jawab atas mutu jasa pendampingan sesuai Perjanjian, tetapi tidak bertanggung jawab atas penolakan, pengembalian, penundaan, pembekuan, atau pencabutan yang timbul karena data/kondisi PIHAK KEDUA; ketidaksesuaian bahan atau proses; perubahan kebijakan; keputusan pihak berwenang; atau keadaan di luar kendali wajar PIHAK PERTAMA.</p>
                    <p className="pl-6 -indent-6">    (3)  Tidak ada ketentuan dalam Perjanjian ini yang membatasi hak PIHAK KEDUA berdasarkan peraturan perlindungan konsumen atau mengecualikan tanggung jawab yang menurut hukum tidak dapat dikesampingkan.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 10</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">KERAHASIAAN DAN PELINDUNGAN DATA PRIBADI</h5>
                    <p className="pl-6 -indent-6">    (1)  PIHAK KEDUA memberikan persetujuan kepada PIHAK PERTAMA untuk mengumpulkan, menggunakan, menyimpan, memperbaiki, mengirimkan, dan mengungkapkan data yang relevan sejauh diperlukan untuk pelaksanaan layanan, termasuk kepada BPJPH, LPH, LP3H/P3H, lembaga/komite fatwa, laboratorium, penyedia tanda tangan elektronik, penyedia sistem, dan mitra operasional yang berwenang.</p>
                    <p className="pl-6 -indent-6">    (2)  PIHAK PERTAMA wajib menerapkan pengamanan yang wajar, pembatasan akses, pencatatan aktivitas, dan retensi data sesuai tujuan pemrosesan serta ketentuan hukum. Data tidak digunakan untuk pemasaran di luar layanan tanpa persetujuan terpisah.</p>
                    <p className="pl-6 -indent-6">    (3)  PIHAK KEDUA dapat mengajukan permintaan akses, koreksi, atau hak lain atas data pribadi melalui <strong>privasi@halalcore.id</strong>, sepanjang tidak bertentangan dengan kewajiban retensi, pembuktian transaksi, atau kewajiban hukum PIHAK PERTAMA.</p>
                    <p className="pl-6 -indent-6">    (4)  Kewajiban kerahasiaan tetap berlaku setelah Perjanjian berakhir, kecuali informasi telah tersedia untuk umum secara sah, diterima secara sah dari pihak lain, atau wajib diungkap berdasarkan hukum.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 11</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">KONTRAK DAN TANDA TANGAN ELEKTRONIK</h5>
                    <p className="pl-6 -indent-6">    (1)  Para Pihak setuju bahwa Perjanjian, persetujuan, invoice, bukti pembayaran, notifikasi, dan rekaman aktivitas dalam dashboard dapat berbentuk Informasi Elektronik atau Dokumen Elektronik dan dapat digunakan sebagai alat bukti sesuai hukum.</p>
                    <p className="pl-6 -indent-6">    (2)  Penandatanganan dapat dilakukan secara basah atau elektronik. Untuk penandatanganan elektronik, sistem wajib merekam identitas penanda tangan, versi dokumen, tanggal dan waktu, metode autentikasi, serta jejak audit yang dapat digunakan untuk memverifikasi persetujuan dan mendeteksi perubahan setelah penandatanganan.</p>
                    <p className="pl-6 -indent-6">    (3)  Setiap perubahan substansi setelah salah satu pihak menandatangani membatalkan status tanda tangan sebelumnya dan mengharuskan penandatanganan ulang oleh kedua pihak.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 12</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">KEADAAN KAHAR</h5>
                    <p className="pl-6 -indent-6">    (1)  Keadaan Kahar adalah peristiwa di luar kendali wajar Pihak yang terdampak, termasuk bencana, kebakaran besar, wabah, perang, kerusuhan, gangguan luas sistem pemerintah/telekomunikasi, kebijakan pemerintah yang langsung menghambat pelaksanaan, atau peristiwa lain yang sejenis.</p>
                    <p className="pl-6 -indent-6">    (2)  Pihak yang terdampak wajib memberitahukan keadaan tersebut secepatnya disertai penjelasan yang wajar. Kewajiban yang terdampak ditunda selama Keadaan Kahar dan Para Pihak bermusyawarah untuk menyesuaikan jadwal atau mengakhiri bagian layanan yang tidak dapat dilaksanakan.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 13</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">KOMUNIKASI, PENGADUAN, DAN PENYELESAIAN PERSELISIHAN</h5>
                    <p className="pl-6 -indent-6">    (1)  Komunikasi resmi dilakukan melalui dashboard Halalcore dan/atau kontak Para Pihak pada Lampiran 1. Perubahan kontak wajib diberitahukan.</p>
                    <p className="pl-6 -indent-6">    (2)  Pengaduan layanan disampaikan melalui <strong>complaint@halalcore.id</strong> dan ditanggapi paling lambat 1 Hari Kerja.</p>
                    <p className="pl-6 -indent-6">    (3)  Perselisihan diselesaikan terlebih dahulu melalui musyawarah selama paling lama 30 (tiga puluh) hari kalender sejak pemberitahuan tertulis. Jika tidak tercapai kesepakatan, Para Pihak dapat menggunakan mekanisme penyelesaian sengketa konsumen apabila berlaku atau mengajukan sengketa kepada pengadilan yang berwenang menurut ketentuan hukum acara.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 14</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">KETENTUAN LAIN-LAIN</h5>
                    <p className="pl-6 -indent-6">    (1)  Lampiran, persetujuan perubahan ruang lingkup, dan addendum yang ditandatangani atau diafirmasi Para Pihak merupakan bagian yang tidak terpisahkan dari Perjanjian.</p>
                    <p className="pl-6 -indent-6">    (2)  Jika terdapat pertentangan, urutan keberlakuan adalah addendum terbaru, naskah Perjanjian, Lampiran 1, kemudian komunikasi operasional; kecuali secara tegas disepakati lain.</p>
                    <p className="pl-6 -indent-6">    (3)  Ketidakberlakuan satu ketentuan tidak membatalkan ketentuan lainnya. Ketentuan yang tidak berlaku diganti dengan ketentuan sah yang paling mendekati maksud awal Para Pihak.</p>
                    <p className="pl-6 -indent-6">    (4)  PIHAK KEDUA tidak boleh mengalihkan Perjanjian tanpa persetujuan tertulis PIHAK PERTAMA. PIHAK PERTAMA dapat menggunakan personel atau mitra pelaksana dengan tetap bertanggung jawab atas koordinasi layanan dan pelindungan data sesuai Perjanjian.</p>
                    <p className="pl-6 -indent-6">    (5)  Perjanjian tidak diperpanjang secara otomatis. Layanan pascasertifikasi atau pengajuan baru memerlukan pesanan layanan baru atau addendum.</p>
                </div>

                <div>
                    <h4 className="font-bold text-center uppercase mb-1 text-sky-900">PASAL 15</h4>
                    <h5 className="font-bold text-center uppercase mb-2 text-sky-900">PENUTUP</h5>
                    <p>Para Pihak menyatakan telah membaca, memahami, memiliki kewenangan untuk menandatangani, memperoleh kesempatan yang cukup untuk bertanya, dan menyetujui seluruh isi Perjanjian tanpa paksaan, kekhilafan, atau penipuan. Perjanjian dibuat dalam Bahasa Indonesia dan berlaku sejak tanggal efektif sebagaimana Pasal 6.</p>
                </div>
            </div>

            {/* Signature Block (Side-by-side) */}
            <div className="font-sans space-y-4 pt-6">
                <h4 className="font-bold text-center uppercase text-sky-900 text-xs tracking-wider">TANDA TANGAN PARA PIHAK</h4>
                <div className="grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Pihak Pertama Column */}
                    <div className="border-r border-gray-200 flex flex-col justify-between">
                        <div className="bg-sky-900 text-white font-bold p-2 text-center text-xs">PIHAK PERTAMA</div>
                        <div className="bg-slate-50/50 p-3 text-center border-b border-gray-100 min-h-[44px] flex flex-col justify-center">
                            <p className="font-bold text-[10px] text-gray-800">PT ANA NAHNU INDONESIA</p>
                            <p className="text-[9px] text-gray-500">melalui Halal Advisor yang berwenang</p>
                        </div>
                        {/* Signature Area */}
                        <div className="p-6 flex justify-center items-center h-28 bg-white">
                            <div className="w-20 h-20 border border-gray-100 rounded flex items-center justify-center bg-sky-50/20 text-sky-700 text-[10px] font-mono text-center leading-tight">
                                QR CODE<br/>VERIFIKASI
                            </div>
                        </div>
                        <div className="p-3 text-center border-t border-gray-100 bg-slate-50/30">
                            <p className="font-bold text-xs text-sky-900">{advisorName}</p>
                            <p className="text-[9px] text-gray-500">ID Advisor: {advisorId}</p>
                        </div>
                        <div className="p-2.5 text-center bg-slate-100 border-t border-gray-200 text-[9px] text-gray-500 leading-tight">
                            Ditandatangani: {generatedAtLocal}<br/>
                            Metode: Tanda Tangan Elektronik (OTP)
                        </div>
                    </div>

                    {/* Pihak Kedua Column */}
                    <div className="flex flex-col justify-between">
                        <div className="bg-sky-900 text-white font-bold p-2 text-center text-xs">PIHAK KEDUA</div>
                        <div className="bg-slate-50/50 p-3 text-center border-b border-gray-100 min-h-[44px] flex flex-col justify-center">
                            <p className="font-bold text-[10px] text-gray-800">{clientName}</p>
                            <p className="text-[9px] text-gray-500">{clientPartyDesc}</p>
                        </div>
                        {/* Signature Area */}
                        <div className="p-6 flex justify-center items-center h-28 bg-white">
                            <div className="w-20 h-20 border border-gray-100 rounded flex items-center justify-center bg-sky-50/20 text-sky-700 text-[10px] font-mono text-center leading-tight">
                                QR CODE<br/>VERIFIKASI
                            </div>
                        </div>
                        <div className="p-3 text-center border-t border-gray-100 bg-slate-50/30">
                            <p className="font-bold text-xs text-sky-900">{client.client_name}</p>
                            <p className="text-[9px] text-gray-500">Pemohon</p>
                        </div>
                        <div className="p-2.5 text-center bg-slate-100 border-t border-gray-200 text-[9px] text-gray-500 leading-tight">
                            Ditandatangani: {generatedAtLocal}<br/>
                            Metode: Tanda Tangan Elektronik (OTP)
                        </div>
                    </div>
                </div>
            </div>

            {/* Lampiran 1 */}
            <div className="border-t-2 border-dashed border-gray-200 pt-8 space-y-6 text-xs font-sans text-gray-700">
                <div>
                    <h3 className="text-sm font-bold text-sky-900 uppercase">LAMPIRAN 1</h3>
                    <h4 className="text-xs font-bold text-gray-600 uppercase">RINGKASAN PENGAJUAN DAN PESANAN LAYANAN</h4>
                    <p className="text-[10px] text-gray-400 font-mono italic">Lampiran Perjanjian Nomor: {submission.contract_number || 'DRAFT'} | Pengajuan {submission.tracking_number || '-'}</p>
                </div>

                {/* Table Identitas */}
                <div className="space-y-2">
                    <h5 className="font-bold text-sky-900 text-xs">A. IDENTITAS PENGAJU</h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden min-w-[340px]">
                            <tbody>
                                <tr>
                                    <td className="w-1/3 border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Nama Pelaku Usaha</td>
                                    <td className="border border-gray-200 p-2">{client.client_name}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Nama Usaha / Merek</td>
                                    <td className="border border-gray-200 p-2">{clientName} / {brandName}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">NIB</td>
                                    <td className="border border-gray-200 p-2">{client.nib || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Skala Usaha</td>
                                    <td className="border border-gray-200 p-2">{submission.cost_detail?.business_scale?.name || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Alamat Usaha</td>
                                    <td className="border border-gray-200 p-2 break-words">{address}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Narahubung</td>
                                    <td className="border border-gray-200 p-2">{client.client_name} | {client.phone} | {clientEmail}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table Ruang Lingkup */}
                <div className="space-y-2">
                    <h5 className="font-bold text-sky-900 text-xs">B. RUANG LINGKUP PENGAJUAN</h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden min-w-[340px]">
                            <tbody>
                                <tr>
                                    <td className="w-1/3 border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Skema</td>
                                    <td className="border border-gray-200 p-2">{submission.service_type}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Paket</td>
                                    <td className="border border-gray-200 p-2">{brandName}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Kategori Produk</td>
                                    <td className="border border-gray-200 p-2">{submission.cost_detail?.product_category?.name || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Produk/Varian</td>
                                    <td className="border border-gray-200 p-2">{submission.product_count} produk/varian — {brandName}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Pabrik/Cabang</td>
                                    <td className="border border-gray-200 p-2">{submission.branch_count} lokasi — Lokasi Fasilitas Utama</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Ketentuan Khusus</td>
                                    <td className="border border-gray-200 p-2">-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Table Rincian Biaya (Dynamic) */}
                <div className="space-y-2">
                    <h5 className="font-bold text-sky-900 text-xs">C. RINCIAN BIAYA</h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden min-w-[340px]">
                            <thead>
                                <tr className="bg-sky-900 text-white text-left font-bold">
                                    <th className="p-2.5">Komponen Biaya</th>
                                    <th className="p-2.5 text-right w-1/3">Jumlah</th>
                                </tr>
                            </thead>
                        <tbody>
                            {breakdown.length > 0 ? (
                                breakdown.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30">
                                        <td className="border border-gray-200 p-2.5">{item.name}</td>
                                        <td className="border border-gray-200 p-2.5 text-right font-medium">
                                            {item.total < 0 || item.category?.toUpperCase() === 'DISKON' 
                                                ? `(${formatRupiah(Math.abs(item.total))})`
                                                : formatRupiah(item.total)
                                            }
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="border border-gray-200 p-2.5">
                                        {submission.service_type === 'SELF_DECLARE_MANDIRI' ? 'Biaya Self Declare Mandiri' : 'Jasa Pendampingan'}
                                    </td>
                                    <td className="border border-gray-200 p-2.5 text-right">{formatRupiah(totalAmount)}</td>
                                </tr>
                            )}
                            <tr className="bg-sky-50 font-bold text-sky-900 text-sm">
                                <td className="border border-gray-200 p-2.5">TOTAL</td>
                                <td className="border border-gray-200 p-2.5 text-right">{formatRupiah(totalAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Table Kontak Resmi */}
                <div className="space-y-2">
                    <h5 className="font-bold text-sky-900 text-xs">D. KONTAK RESMI</h5>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[10px] space-y-1 font-sans text-slate-700">
                        <p>
                            <strong>D. KONTAK RESMI.</strong> Halal Advisor: {advisorName} (ID {advisorId}), {submission.consultant?.phone || '-'}, {submission.consultant?.email || '-'} | Layanan pelanggan: {supportEmail}.
                        </p>
                    </div>
                </div>

                {/* Bottom disclaimer */}
                <p className="text-[10px] text-gray-500 italic mt-2">
                    Lampiran ini dibuat otomatis dari data pengajuan dan disetujui bersamaan dengan Perjanjian. Perubahan setelah finalisasi harus tercatat sebagai revisi atau addendum dan ditandatangani ulang bila mengubah substansi hak atau kewajiban Para Pihak.
                </p>
            </div>

            {/* Lampiran 2 */}
            <div className="border-t-2 border-dashed border-gray-200 pt-8 space-y-6 font-sans text-xs text-gray-700">
                <div>
                    <h3 className="text-sm font-bold text-sky-900 uppercase">LAMPIRAN 2</h3>
                    <h4 className="text-xs font-bold text-gray-600 uppercase">PERSETUJUAN PENGAJUAN DAN KUASA TERBATAS</h4>
                </div>
                <div className="space-y-2 text-justify">
                    <p>PIHAK KEDUA dengan ini:</p>
                    <p className="pl-6 -indent-6">    (1)  menyatakan seluruh data, dokumen, foto, daftar bahan, daftar produk, dan uraian proses yang diberikan adalah benar, lengkap, dan sesuai kondisi usaha pada saat diajukan;</p>
                    <p className="pl-6 -indent-6">    (2)  memberikan kuasa terbatas kepada PT Ana Nahnu Indonesia melalui Halal Advisor yang ditunjuk untuk menyiapkan, memasukkan, mengunggah, mengoreksi, memantau, dan mengomunikasikan data pengajuan pada sistem resmi, sejauh diizinkan oleh sistem dan hukum;</p>
                    <p className="pl-6 -indent-6">    (3)  memahami bahwa kuasa terbatas ini tidak mencakup kewenangan untuk membuat pernyataan palsu, mengubah fakta usaha, menandatangani pernyataan kehalalan yang wajib dilakukan pelaku usaha, menerima dana atas nama PIHAK KEDUA, atau melakukan tindakan lain di luar pengurusan administratif pengajuan;</p>
                    <p className="pl-6 -indent-6">    (4)  menyetujui penyampaian data kepada pihak berwenang dan mitra pemrosesan yang diperlukan sebagaimana Pasal 10; dan</p>
                    <p className="pl-6 -indent-6">    (5)  wajib segera mencabut atau memperbarui kuasa apabila terjadi perubahan wakil, kontak, produk, bahan, proses, fasilitas, atau keadaan lain yang memengaruhi pengajuan.</p>
                    <p className="pt-2">Persetujuan ini berlaku sejak Perjanjian efektif sampai pengajuan selesai, dihentikan, atau kuasa dicabut secara tertulis. Pencabutan tidak memengaruhi tindakan sah yang telah dilakukan sebelum pemberitahuan diterima.</p>
                </div>

                <div className="space-y-4 pt-4">
                    <h5 className="font-bold text-center uppercase text-sky-900 text-xs">KONFIRMASI PIHAK KEDUA</h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden min-w-[340px]">
                            <tbody>
                                <tr>
                                    <td className="w-1/3 border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Nama Penanda Tangan</td>
                                    <td className="border border-gray-200 p-2">{client.client_name}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Kapasitas</td>
                                    <td className="border border-gray-200 p-2">Pemohon</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Tanggal/Waktu</td>
                                    <td className="border border-gray-200 p-2">{generatedAtLocal}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-200 bg-sky-50/50 p-2 font-bold text-sky-900">Tanda Tangan/Afirmasi</td>
                                    <td className="border border-gray-200 p-2">
                                        <div className="inline-flex items-center space-x-2 border border-green-200 bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            <span className="font-bold">DISETUJUI SECARA ELEKTRONIK</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Lampiran 3: Dokumen, Foto Persyaratan & Data Usaha (SJPH) */}
            <div className="border-t-2 border-dashed border-gray-200 pt-8 space-y-6 font-sans text-xs text-gray-700">
                <div>
                    <h3 className="text-sm font-bold text-sky-900 uppercase">LAMPIRAN 3</h3>
                    <h4 className="text-xs font-bold text-gray-600 uppercase">DOKUMEN, FOTO PERSYARATAN & DATA USAHA (SJPH)</h4>
                    <p className="text-[11px] text-gray-500 mt-1">
                        Kumpulan dokumen legalitas, foto persyaratan, dan rincian data yang diunggah oleh pelaku usaha untuk pendampingan sertifikasi halal.
                    </p>
                </div>

                {/* Grid Dokumen & Foto */}
                <div className="space-y-4">
                    <h5 className="font-bold text-sky-900 text-xs uppercase">A. DOKUMEN & FOTO PERSYARATAN</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* 1. File NIB */}
                        {client.nib_file_url && (
                            <div className="p-3 border border-gray-200 rounded-xl bg-slate-50/50 space-y-2">
                                <span className="text-[10px] font-black text-sky-900 uppercase block">Dokumen NIB</span>
                                {client.nib_file_url.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                                    <div className="rounded-lg overflow-hidden border border-gray-200 h-36 bg-white flex items-center justify-center">
                                        <img 
                                            src={client.nib_file_url.startsWith('http') ? client.nib_file_url : `${import.meta.env.VITE_API_URL}${client.nib_file_url}`} 
                                            alt="Dokumen NIB" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-36 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-700 p-2 text-center">
                                        <span className="font-bold text-xs">📄 File NIB (.PDF)</span>
                                    </div>
                                )}
                                <a 
                                    href={client.nib_file_url.startsWith('http') ? client.nib_file_url : `${import.meta.env.VITE_API_URL}${client.nib_file_url}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[10px] text-indigo-600 font-bold underline block truncate"
                                >
                                    Lihat / Unduh File
                                </a>
                            </div>
                        )}

                        {/* 2. File dari Form Fields */}
                        {submission.field_values?.filter(fv => fv.file_url || (fv.text_value && (fv.text_value.startsWith('/uploads') || fv.text_value.startsWith('http')))).map((fv, idx) => {
                            const fileUrl = fv.file_url || fv.text_value || '';
                            const isImg = fileUrl.match(/\.(jpeg|jpg|png|webp)$/i);
                            const label = fv.form_field?.field_label || fv.form_field?.field_key || `Lampiran ${idx + 1}`;
                            return (
                                <div key={idx} className="p-3 border border-gray-200 rounded-xl bg-slate-50/50 space-y-2">
                                    <span className="text-[10px] font-black text-sky-900 uppercase block truncate" title={label}>{label}</span>
                                    {isImg ? (
                                        <div className="rounded-lg overflow-hidden border border-gray-200 h-36 bg-white flex items-center justify-center">
                                            <img 
                                                src={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL}${fileUrl}`} 
                                                alt={label} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-36 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-700 p-2 text-center">
                                            <span className="font-bold text-xs">📄 Dokumen / Berkas</span>
                                        </div>
                                    )}
                                    <a 
                                        href={fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL}${fileUrl}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-[10px] text-indigo-600 font-bold underline block truncate"
                                    >
                                        Lihat File Asli
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>



                {/* Table Data Isian Form */}
                {submission.field_values && submission.field_values.filter(fv => fv.text_value && !fv.text_value.startsWith('/uploads') && !fv.text_value.startsWith('http')).length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h5 className="font-bold text-sky-900 text-xs uppercase">B. DATA ISIAN PROFIL & PROSES PRODUK</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse border border-gray-200 rounded-lg overflow-hidden min-w-[340px]">
                                <thead>
                                    <tr className="bg-sky-50 font-bold text-sky-900 text-left">
                                        <th className="p-2.5 border border-gray-200 w-1/3">Keterangan / Pertanyaan</th>
                                        <th className="p-2.5 border border-gray-200">Jawaban / Nilai Isian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submission.field_values.filter(fv => fv.text_value && !fv.text_value.startsWith('/uploads') && !fv.text_value.startsWith('http')).map((fv, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/40">
                                            <td className="border border-gray-200 p-2 font-bold text-gray-700 bg-gray-50/30 align-top">
                                                {formatFieldLabel(fv.form_field?.field_label, fv.form_field?.field_key)}
                                            </td>
                                            <td className="border border-gray-200 p-2 text-gray-900 font-medium break-words align-top">
                                                {renderFieldValue(fv.text_value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);
}
