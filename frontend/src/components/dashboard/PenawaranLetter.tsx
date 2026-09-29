import React from 'react';
import { terbilangRupiah, numberToIndonesianWord, getRomanMonth } from '../../utils/terbilang';
import { HEADER_LOGO_B64, TTD_STAMP_B64 } from '../../assets/images_b64';

export interface PenawaranData {
  documentNumber?: string;
  clientName: string;
  businessName?: string;
  businessType?: string;
  serviceType: string;
  serviceLabel?: string;
  location?: string;
  businessScale: string;
  branchCount: number;
  productCount: number;
  breakdown: Array<{
    name: string;
    category?: string;
    total: number;
  }>;
  grandTotal: number;
  date?: Date;
  directorName?: string;
}

export function formatRupiahDisplay(num: number): string {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

export const PenawaranLetter: React.FC<{ data: PenawaranData; id?: string }> = ({ data, id = 'printable-estimate-document' }) => {
  const date = data.date || new Date();
  const romanMonth = getRomanMonth(date);
  const year = date.getFullYear();
  const docNumber = data.documentNumber || `001/PNW-HC/${romanMonth}/${year}`;

  const businessTitle = data.businessName || data.clientName || 'Sindoro Hotel';
  const displayRecipient = data.businessName && data.clientName && data.businessName !== data.clientName
    ? `${data.clientName} (${data.businessName})`
    : (data.clientName || data.businessName || 'Sindoro Hotel');

  const businessTypeDesc = data.businessType || 'penyediaan makanan dan minuman dengan pengolahan';
  const branchWord = numberToIndonesianWord(data.branchCount);
  const serviceTypeDisplay = data.serviceLabel || (data.serviceType === 'REGULER' ? 'reguler' : data.serviceType === 'SELF_DECLARE_MANDIRI' ? 'self declare mandiri' : 'self declare');
  const scaleDisplay = data.businessScale.startsWith('Usaha') ? data.businessScale : `Usaha ${data.businessScale}`;

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans text-[11pt] leading-normal select-text"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        boxSizing: 'border-box',
        color: '#111827',
      }}
    >
      {/* ════════════════ PAGE 1 ════════════════ */}
      <div
        className="penawaran-page flex flex-col justify-between"
        style={{
          minHeight: '297mm',
          padding: '20mm 20mm 15mm 20mm',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        }}
      >
        <div>
          {/* Header (Kop Surat) */}
          <div className="flex items-start justify-between border-b-0 pb-3 mb-2">
            <div className="flex items-center">
              <img
                src={HEADER_LOGO_B64}
                alt="HalalCore Building Halal Business Excellence"
                className="h-14 object-contain"
                style={{ maxHeight: '56px' }}
              />
            </div>
            <div className="text-right text-[9.5pt] leading-[1.35] text-slate-700">
              <p className="font-bold text-[#1e3a8a] text-[11pt]">PT ANA NAHNU INDONESIA</p>
              <p>RT 005 RW 002, Dusun Cikohkol, Desa Sukasari</p>
              <p>Kecamatan Banjarsari, Kabupaten Ciamis, Jawa Barat 46383</p>
              <p>Email: ananahnuindonesia@gmail.com</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-4">
            <h1 className="text-[12pt] font-bold tracking-wide text-[#1e3a8a] uppercase">
              HALALCORE | PENDAMPINGAN PROSES SERTIFIKASI HALAL
            </h1>
          </div>

          {/* Document Meta Info */}
          <div className="mb-4 text-[10.5pt] leading-[1.4]">
            <table className="border-none p-0 text-[10.5pt]">
              <tbody>
                <tr>
                  <td className="w-24 font-normal py-0.5 text-slate-900">Nomor</td>
                  <td className="w-4 py-0.5">:</td>
                  <td className="py-0.5 font-normal">{docNumber}</td>
                </tr>
                <tr>
                  <td className="font-normal py-0.5 text-slate-900">Lampiran</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5 font-normal">-</td>
                </tr>
                <tr>
                  <td className="font-normal py-0.5 text-slate-900">Perihal</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5 font-normal">Penawaran Pendampingan Proses Sertifikasi Halal</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recipient */}
          <div className="mb-4 text-[10.5pt] leading-[1.4]">
            <p className="font-bold text-slate-900">Yth. Manajemen {displayRecipient}</p>
            <p className="text-slate-800">di tempat</p>
          </div>

          {/* Salutation & Opening */}
          <div className="space-y-3 mb-4 text-[10.5pt] leading-[1.45] text-justify text-slate-900">
            <p>Dengan hormat,</p>
            <p>
              Berdasarkan kebutuhan sertifikasi halal untuk {businessTitle}, kami dari PT Ana Nahnu Indonesia melalui
              layanan Halalcore menyampaikan penawaran pendampingan proses sertifikasi halal untuk bidang usaha{' '}
              {businessTypeDesc}.
            </p>
            <p>
              Penawaran ini mengacu pada simulasi estimasi biaya sertifikasi halal yang Bapak/Ibu sampaikan, dengan
              kriteria layanan {serviceTypeDisplay}, skala Kegiatan {scaleDisplay}, {branchWord} cabang, dan{' '}
              {data.productCount} produk.
            </p>
          </div>

          {/* Section A: Ruang Lingkup Layanan */}
          <div className="mb-4 text-[10.5pt] leading-[1.4]">
            <h2 className="font-bold text-[#1e3a8a] text-[11pt] mb-1.5">A. Ruang Lingkup Layanan</h2>
            <ul className="space-y-1 text-slate-900 pl-1">
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pemetaan unit usaha, dapur, outlet, menu/produk, bahan, pemasok, fasilitas, dan alur proses.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pendampingan penyusunan dan penerapan Sistem Jaminan Produk Halal (SJPH).</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pemeriksaan dokumen bahan dan pemenuhan bukti kehalalan bahan.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pendampingan registrasi BPJPH dan pengajuan pemeriksaan melalui LPH.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pendampingan persiapan dan pelaksanaan pemeriksaan/audit LPH.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pendampingan perbaikan dokumen atau temuan sampai tahapan pemeriksaan selesai.</span>
              </li>
            </ul>
          </div>

          {/* Section B: Data Dasar Penawaran */}
          <div className="mb-4 text-[10.5pt]">
            <h2 className="font-bold text-[#1e3a8a] text-[11pt] mb-1.5">B. Data Dasar Penawaran</h2>
            <table className="w-full border-collapse border border-slate-300 text-[10pt]">
              <thead>
                <tr className="bg-[#234b6e] text-white">
                  <th className="border border-slate-400/60 px-3 py-1.5 text-left font-bold w-1/2">Parameter</th>
                  <th className="border border-slate-400/60 px-3 py-1.5 text-left font-bold w-1/2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-900">
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Pemohon</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">{data.clientName || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Nama usaha</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">{data.businessName || data.clientName || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Jenis layanan</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">
                    {data.serviceLabel || (data.serviceType === 'REGULER' ? 'Sertifikasi reguler' : data.serviceType === 'SELF_DECLARE_MANDIRI' ? 'Self declare mandiri' : 'Self declare')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Lokasi</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">{data.location || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Skala Kegiatan Usaha</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">{scaleDisplay}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Jumlah cabang</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">{data.branchCount} cabang</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1 bg-white">Jumlah produk</td>
                  <td className="border border-slate-300 px-3 py-1 bg-white font-normal">{data.productCount} produk</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section C: Rincian Biaya */}
          <div className="mb-2 text-[10.5pt]">
            <h2 className="font-bold text-[#1e3a8a] text-[11pt] mb-1.5">C. Rincian Biaya</h2>
            <table className="w-full border-collapse border border-slate-300 text-[10pt]">
              <thead>
                <tr className="bg-[#234b6e] text-white">
                  <th className="border border-slate-400/60 px-2.5 py-1.5 text-left font-bold w-10">No.</th>
                  <th className="border border-slate-400/60 px-3 py-1.5 text-left font-bold">Komponen Biaya</th>
                  <th className="border border-slate-400/60 px-3 py-1.5 text-left font-bold w-48">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-900">
                {data.breakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 px-2.5 py-1 text-center align-top">{idx + 1}</td>
                    <td className="border border-slate-300 px-3 py-1 align-top font-normal">{item.name}</td>
                    <td className="border border-slate-300 px-3 py-1 align-top font-normal">
                      {formatRupiahDisplay(item.total)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-white">
                  <td colSpan={2} className="border border-slate-300 px-3 py-1.5 text-left">
                    Grand Total
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 text-left font-bold">
                    {formatRupiahDisplay(data.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-[10pt] font-bold text-slate-900">
              Terbilang: {terbilangRupiah(data.grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════ PAGE 2 ════════════════ */}
      <div
        className="penawaran-page flex flex-col justify-between"
        style={{
          minHeight: '297mm',
          padding: '20mm 20mm 15mm 20mm',
          boxSizing: 'border-box',
          pageBreakBefore: 'always',
          breakBefore: 'page',
        }}
      >
        <div>
          {/* Top Note */}
          <div className="mb-4 text-[10pt] italic text-slate-800 leading-[1.4] text-justify">
            <p>
              <span className="font-semibold not-italic">Catatan:</span> Nilai di atas merupakan estimasi berdasarkan data yang tersedia. Biaya final dapat disesuaikan
              apabila terdapat perubahan jumlah produk, cabang, kompleksitas proses, kebutuhan laboratorium, perjalanan,
              atau ketentuan resmi pihak berwenang.
            </p>
          </div>

          {/* Section D: Estimasi Tahapan dan Waktu */}
          <div className="mb-5 text-[10.5pt] leading-[1.4]">
            <h2 className="font-bold text-[#1e3a8a] text-[11pt] mb-2">D. Estimasi Tahapan dan Waktu</h2>
            <ul className="space-y-1 text-slate-900 pl-1">
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Persiapan data dan pemetaan: 1–3 hari kerja.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Penyusunan dan penyempurnaan SJPH: 7–14 hari kerja setelah dokumen lengkap.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Registrasi dan pengajuan pemeriksaan: mengikuti kesiapan dokumen dan sistem BPJPH.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pemeriksaan LPH dan tindak lanjut: mengikuti jadwal LPH serta hasil pemeriksaan.</span>
              </li>
            </ul>
          </div>

          {/* Section E: Ketentuan Pembayaran */}
          <div className="mb-5 text-[10.5pt] leading-[1.4]">
            <h2 className="font-bold text-[#1e3a8a] text-[11pt] mb-2">E. Ketentuan Pembayaran</h2>
            <ul className="space-y-1 text-slate-900 pl-1">
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>Pembayaran dilakukan sesuai termin yang disepakati dalam kontrak atau invoice resmi.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>
                  Biaya registrasi BPJPH, pemeriksaan LPH, dan penyelia halal dibayarkan sesuai komponen pada estimasi
                  biaya dan/atau tagihan resmi.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">&bull;</span>
                <span>
                  Biaya perjalanan, akomodasi, pengujian laboratorium, atau biaya tambahan lain di luar ruang lingkup tidak
                  termasuk dalam grand total kecuali dinyatakan tertulis.
                </span>
              </li>
            </ul>
          </div>

          {/* Closing Paragraph */}
          <div className="mb-8 text-[10.5pt] leading-[1.45] text-justify text-slate-900">
            <p>
              Demikian penawaran ini kami sampaikan. Kami berharap dapat mendukung {displayRecipient} dalam memenuhi
              persyaratan sertifikasi halal secara tertib, efektif, dan terdokumentasi. Atas perhatian dan kerja
              samanya, kami ucapkan terima kasih.
            </p>
          </div>

          {/* Signatures & Stamp */}
          <div className="text-[10.5pt] text-slate-900">
            <p className="font-normal mb-1">Hormat kami,</p>
            <p className="font-bold text-slate-900 mb-2">PT ANA NAHNU INDONESIA</p>

            <div className="my-2" style={{ width: '130px', height: '95px' }}>
              <img
                src={TTD_STAMP_B64}
                alt="Tanda Tangan dan Stempel Resmi Direktur PT Ana Nahnu Indonesia"
                className="w-full h-full object-contain"
                style={{ maxWidth: '130px', maxHeight: '95px' }}
              />
            </div>

            <p className="font-bold text-slate-900 text-[11pt]">{data.directorName || 'Hilpan Nugraha'}</p>
            <p className="text-slate-700 text-[10pt]">Direktur</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function generatePenawaranHTML(data: PenawaranData): string {
  const date = data.date || new Date();
  const romanMonth = getRomanMonth(date);
  const year = date.getFullYear();
  const docNumber = data.documentNumber || `001/PNW-HC/${romanMonth}/${year}`;

  const businessTitle = data.businessName || data.clientName || 'Sindoro Hotel';
  const displayRecipient = data.businessName && data.clientName && data.businessName !== data.clientName
    ? `${data.clientName} (${data.businessName})`
    : (data.clientName || data.businessName || 'Sindoro Hotel');

  const businessTypeDesc = data.businessType || 'penyediaan makanan dan minuman dengan pengolahan';
  const branchWord = numberToIndonesianWord(data.branchCount);
  const serviceTypeDisplay = data.serviceLabel || (data.serviceType === 'REGULER' ? 'reguler' : data.serviceType === 'SELF_DECLARE_MANDIRI' ? 'self declare mandiri' : 'self declare');
  const scaleDisplay = data.businessScale.startsWith('Usaha') ? data.businessScale : `Usaha ${data.businessScale}`;

  const breakdownRows = data.breakdown.map((item, idx) => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; vertical-align: top;">${idx + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top;">${item.name}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top;">${formatRupiahDisplay(item.total)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Penawaran Pendampingan Proses Sertifikasi Halal - ${data.clientName || 'HalalCore'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-size: 11pt;
      line-height: 1.45;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 20mm 15mm 20mm;
      margin: 0 auto;
      background: #ffffff;
      box-sizing: border-box;
      position: relative;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .page {
        margin: 0;
        width: 100%;
        min-height: 297mm;
        page-break-after: always;
        break-after: page;
      }
      .page:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
    }
    @media screen {
      .page {
        margin: 20px auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .header-logo {
      height: 54px;
      object-fit: contain;
    }
    .header-company {
      text-align: right;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #334155;
    }
    .header-company .company-name {
      font-weight: bold;
      color: #1e3a8a;
      font-size: 11pt;
      margin-bottom: 2px;
    }
    .doc-title {
      text-align: center;
      margin: 18px 0;
    }
    .doc-title h1 {
      font-size: 12pt;
      font-weight: bold;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 16px;
      font-size: 10.5pt;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 2px 0;
      border: none;
    }
    .recipient {
      margin-bottom: 16px;
      font-size: 10.5pt;
      line-height: 1.4;
    }
    .recipient .name {
      font-weight: bold;
    }
    .paragraph {
      margin-bottom: 12px;
      text-align: justify;
      font-size: 10.5pt;
      line-height: 1.45;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    .bullet-list {
      margin: 0 0 14px 0;
      padding-left: 18px;
      font-size: 10.5pt;
      line-height: 1.4;
    }
    .bullet-list li {
      margin-bottom: 3px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10pt;
    }
    table.data-table th {
      background-color: #234b6e;
      color: #ffffff;
      font-weight: bold;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #1c3c58;
    }
    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      color: #111827;
    }
    .terbilang-box {
      font-weight: bold;
      font-size: 10pt;
      margin-top: 6px;
      color: #111827;
    }
    .note-box {
      font-style: italic;
      font-size: 10pt;
      line-height: 1.4;
      margin-bottom: 16px;
      text-align: justify;
      color: #1f2937;
    }
    .signature-section {
      margin-top: 24px;
      font-size: 10.5pt;
      color: #111827;
    }
    .signature-img {
      width: 130px;
      height: 95px;
      object-fit: contain;
      margin: 6px 0;
    }
    .signer-name {
      font-weight: bold;
      font-size: 11pt;
      color: #111827;
      margin: 0;
    }
    .signer-role {
      color: #4b5563;
      font-size: 10pt;
      margin: 2px 0 0 0;
    }
  </style>
</head>
<body>

  <!-- ═══════════════ PAGE 1 ═══════════════ -->
  <div class="page">
    <div class="header">
      <div>
        <img src="${HEADER_LOGO_B64}" alt="HalalCore" class="header-logo" />
      </div>
      <div class="header-company">
        <div class="company-name">PT ANA NAHNU INDONESIA</div>
        <div>RT 005 RW 002, Dusun Cikohkol, Desa Sukasari</div>
        <div>Kecamatan Banjarsari, Kabupaten Ciamis, Jawa Barat 46383</div>
        <div>Email: ananahnuindonesia@gmail.com</div>
      </div>
    </div>

    <div class="doc-title">
      <h1>HALALCORE | PENDAMPINGAN PROSES SERTIFIKASI HALAL</h1>
    </div>

    <table class="meta-table">
      <tr>
        <td style="width: 90px;">Nomor</td>
        <td style="width: 15px;">:</td>
        <td>${docNumber}</td>
      </tr>
      <tr>
        <td>Lampiran</td>
        <td>:</td>
        <td>-</td>
      </tr>
      <tr>
        <td>Perihal</td>
        <td>:</td>
        <td>Penawaran Pendampingan Proses Sertifikasi Halal</td>
      </tr>
    </table>

    <div class="recipient">
      <div class="name">Yth. Manajemen ${displayRecipient}</div>
      <div>di tempat</div>
    </div>

    <div class="paragraph">
      Dengan hormat,
    </div>
    <div class="paragraph">
      Berdasarkan kebutuhan sertifikasi halal untuk ${businessTitle}, kami dari PT Ana Nahnu Indonesia melalui layanan Halalcore menyampaikan penawaran pendampingan proses sertifikasi halal untuk bidang usaha ${businessTypeDesc}.
    </div>
    <div class="paragraph">
      Penawaran ini mengacu pada simulasi estimasi biaya sertifikasi halal yang Bapak/Ibu sampaikan, dengan kriteria layanan ${serviceTypeDisplay}, skala Kegiatan ${scaleDisplay}, ${branchWord} cabang, dan ${data.productCount} produk.
    </div>

    <div class="section-title">A. Ruang Lingkup Layanan</div>
    <ul class="bullet-list">
      <li>Pemetaan unit usaha, dapur, outlet, menu/produk, bahan, pemasok, fasilitas, dan alur proses.</li>
      <li>Pendampingan penyusunan dan penerapan Sistem Jaminan Produk Halal (SJPH).</li>
      <li>Pemeriksaan dokumen bahan dan pemenuhan bukti kehalalan bahan.</li>
      <li>Pendampingan registrasi BPJPH dan pengajuan pemeriksaan melalui LPH.</li>
      <li>Pendampingan persiapan dan pelaksanaan pemeriksaan/audit LPH.</li>
      <li>Pendampingan perbaikan dokumen atau temuan sampai tahapan pemeriksaan selesai.</li>
    </ul>

    <div class="section-title">B. Data Dasar Penawaran</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 50%;">Parameter</th>
          <th style="width: 50%;">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pemohon</td>
          <td>${data.clientName || '-'}</td>
        </tr>
        <tr>
          <td>Nama usaha</td>
          <td>${data.businessName || data.clientName || '-'}</td>
        </tr>
        <tr>
          <td>Jenis layanan</td>
          <td>${data.serviceLabel || (data.serviceType === 'REGULER' ? 'Sertifikasi reguler' : data.serviceType === 'SELF_DECLARE_MANDIRI' ? 'Self declare mandiri' : 'Self declare')}</td>
        </tr>
        <tr>
          <td>Lokasi</td>
          <td>${data.location || '-'}</td>
        </tr>
        <tr>
          <td>Skala Kegiatan Usaha</td>
          <td>${scaleDisplay}</td>
        </tr>
        <tr>
          <td>Jumlah cabang</td>
          <td>${data.branchCount} cabang</td>
        </tr>
        <tr>
          <td>Jumlah produk</td>
          <td>${data.productCount} produk</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">C. Rincian Biaya</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 45px; text-align: center;">No.</th>
          <th>Komponen Biaya</th>
          <th style="width: 170px;">Nilai</th>
        </tr>
      </thead>
      <tbody>
        ${breakdownRows}
        <tr style="font-weight: bold; background-color: #ffffff;">
          <td colspan="2" style="border: 1px solid #cbd5e1; padding: 7px 10px;">Grand Total</td>
          <td style="border: 1px solid #cbd5e1; padding: 7px 10px;">${formatRupiahDisplay(data.grandTotal)}</td>
        </tr>
      </tbody>
    </table>
    <div class="terbilang-box">
      Terbilang: ${terbilangRupiah(data.grandTotal)}
    </div>
  </div>

  <!-- ═══════════════ PAGE 2 ═══════════════ -->
  <div class="page">
    <div class="note-box">
      <span style="font-weight: bold; font-style: normal;">Catatan:</span> Nilai di atas merupakan estimasi berdasarkan data yang tersedia. Biaya final dapat disesuaikan apabila terdapat perubahan jumlah produk, cabang, kompleksitas proses, kebutuhan laboratorium, perjalanan, atau ketentuan resmi pihak berwenang.
    </div>

    <div class="section-title">D. Estimasi Tahapan dan Waktu</div>
    <ul class="bullet-list">
      <li>Persiapan data dan pemetaan: 1–3 hari kerja.</li>
      <li>Penyusunan dan penyempurnaan SJPH: 7–14 hari kerja setelah dokumen lengkap.</li>
      <li>Registrasi dan pengajuan pemeriksaan: mengikuti kesiapan dokumen dan sistem BPJPH.</li>
      <li>Pemeriksaan LPH dan tindak lanjut: mengikuti jadwal LPH serta hasil pemeriksaan.</li>
    </ul>

    <div class="section-title">E. Ketentuan Pembayaran</div>
    <ul class="bullet-list">
      <li>Pembayaran dilakukan sesuai termin yang disepakati dalam kontrak atau invoice resmi.</li>
      <li>Biaya registrasi BPJPH, pemeriksaan LPH, dan penyelia halal dibayarkan sesuai komponen pada estimasi biaya dan/atau tagihan resmi.</li>
      <li>Biaya perjalanan, akomodasi, pengujian laboratorium, atau biaya tambahan lain di luar ruang lingkup tidak termasuk dalam grand total kecuali dinyatakan tertulis.</li>
    </ul>

    <div class="paragraph" style="margin-top: 16px; margin-bottom: 24px;">
      Demikian penawaran ini kami sampaikan. Kami berharap dapat mendukung ${displayRecipient} dalam memenuhi persyaratan sertifikasi halal secara tertib, efektif, dan terdokumentasi. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
    </div>

    <div class="signature-section">
      <div style="margin-bottom: 4px;">Hormat kami,</div>
      <div style="font-weight: bold; margin-bottom: 8px;">PT ANA NAHNU INDONESIA</div>

      <img src="${TTD_STAMP_B64}" alt="Tanda Tangan dan Cap PT Ana Nahnu Indonesia" class="signature-img" />

      <div class="signer-name">${data.directorName || 'Hilpan Nugraha'}</div>
      <div class="signer-role">Direktur</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}
