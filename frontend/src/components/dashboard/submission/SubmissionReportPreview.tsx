import { useState } from 'react';
import { Download, Printer, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { Submission, FormFieldValue } from '../../../types';
import toast from 'react-hot-toast';

interface SubmissionReportPreviewProps {
    submission: Submission;
    fieldValues: FormFieldValue[];
}

export default function SubmissionReportPreview({ submission, fieldValues = [] }: SubmissionReportPreviewProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const apiBase = import.meta.env.VITE_API_URL || '';
    const client = submission.client;

    // Group fields by step
    const groupedSteps: Record<number, { step_name: string; values: FormFieldValue[] }> = {};
    fieldValues.forEach(fv => {
        const stepNum = fv.form_field?.step_number || 1;
        const stepName = fv.form_field?.step_name || `Langkah ${stepNum}`;
        if (!groupedSteps[stepNum]) {
            groupedSteps[stepNum] = { step_name: stepName, values: [] };
        }
        groupedSteps[stepNum].values.push(fv);
    });

    const sortedSteps = Object.keys(groupedSteps)
        .map(Number)
        .sort((a, b) => a - b)
        .map(stepNum => groupedSteps[stepNum]);

    const handlePrintOrDownloadPDF = () => {
        const printElem = document.getElementById(`submission-report-doc-${submission.id}`);
        if (!printElem) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Gagal membuka jendela cetak. Izinkan popup browser Anda.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Data Pengajuan - ${client?.business_name || 'Halal'}</title>
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

    const handleDownloadPDF = () => {
        setDownloading(true);
        toast.loading('Membuka dialog cetak / simpan PDF...', { id: 'report-pdf' });
        setTimeout(() => {
            handlePrintOrDownloadPDF();
            setDownloading(false);
            toast.success('Silakan pilih "Simpan sebagai PDF" pada dialog cetak.', { id: 'report-pdf' });
        }, 300);
    };

    if (!client) return null;

    const today = new Date();
    const dateStr = submission.created_at 
        ? new Date(submission.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })
        : today.toLocaleDateString('id-ID', { dateStyle: 'long' });

    return (
        <div className="glass-panel p-6 sm:p-8 bg-white border border-gray-150 rounded-3xl space-y-6 shadow-xl">
            {/* Header Box & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5 no-print">
                <div 
                    className="flex items-center gap-3.5 cursor-pointer select-none"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                Laporan Data & Dokumen Pengajuan
                            </h3>
                            {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Pratinjau lengkap seluruh isian profil, foto produk, berkas legalitas, dan dokumen persyaratan.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintOrDownloadPDF}
                        className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        <Printer className="w-4 h-4 text-gray-600" />
                        <span>Cetak</span>
                    </button>
                </div>
            </div>

            {/* In-App Preview Sheet */}
            {!isCollapsed && (
                <div 
                    id={`submission-report-doc-${submission.id}`}
                    className="p-6 sm:p-10 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-8 font-sans text-xs sm:text-sm text-gray-900 leading-relaxed"
                >
                    {/* Header Kop Laporan */}
                    <div className="text-center border-b-2 border-gray-900 pb-6 space-y-1">
                        <h2 className="text-sm font-black tracking-widest uppercase text-indigo-900">
                            PT ANA NAHNU INDONESIA &bull; HALALCORE
                        </h2>
                        <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-gray-900">
                            LAPORAN DATA PENGAJUAN SERTIFIKASI HALAL
                        </h1>
                        <p className="text-[11px] text-gray-500 font-medium">
                            Nomor Resi: <strong className="font-mono text-gray-900">{submission.tracking_number || '-'}</strong> &bull; Layanan: <strong>{submission.service_type || '-'}</strong> &bull; Tanggal: <strong>{dateStr}</strong>
                        </p>
                    </div>

                    {/* Bagian A: Profil Usaha */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100">
                            A. INFORMASI PELAKU USAHA & USAHA
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden text-xs">
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50">
                                <span className="font-bold text-gray-600">Nama Usaha / Bisnis</span>
                                <span className="col-span-2 font-bold text-gray-900">{client.business_name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5">
                                <span className="font-bold text-gray-600">Nama Penanggung Jawab / Pemilik</span>
                                <span className="col-span-2 font-bold text-gray-900">{client.client_name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50">
                                <span className="font-bold text-gray-600">Nomor Induk Berusaha (NIB)</span>
                                <span className="col-span-2 font-mono font-bold text-gray-900">
                                    {client.nib && !client.nib.startsWith('DRAFT-') ? client.nib : '-'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5">
                                <span className="font-bold text-gray-600">Nomor Induk Kependudukan (NIK)</span>
                                <span className="col-span-2 font-mono font-bold text-gray-900">{client.nik || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50">
                                <span className="font-bold text-gray-600">Alamat Fasilitas / Tempat Usaha</span>
                                <span className="col-span-2 text-gray-900">{client.address || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5">
                                <span className="font-bold text-gray-600">Nomor Telepon / WhatsApp</span>
                                <span className="col-span-2 font-mono text-gray-900">{client.phone || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 border-b border-gray-200 p-2.5 bg-gray-50/50">
                                <span className="font-bold text-gray-600">Kelompok / Jenis Produk</span>
                                <span className="col-span-2 font-bold text-gray-900">{client.product_name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 p-2.5">
                                <span className="font-bold text-gray-600">Pendamping Halal</span>
                                <span className="col-span-2 font-bold text-indigo-700">
                                    {submission.consultant?.full_name || client.facilitator?.full_name || 'Pendamping Halal Terverifikasi'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bagian B: Step Dokumen & Persyaratan */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100">
                            B. DOKUMEN, FOTO & DATA PERSYARATAN
                        </h4>

                        {sortedSteps.length === 0 ? (
                            <div className="p-4 bg-white rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500">
                                Belum ada data isian formulir.
                            </div>
                        ) : (
                            sortedSteps.map((step, stepIdx) => (
                                <div key={stepIdx} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                                            Tahap {stepIdx + 1}
                                        </span>
                                        <h5 className="text-sm font-black text-gray-900">{step.step_name}</h5>
                                    </div>

                                    <div className="space-y-5">
                                        {step.values.map((fv, fvIdx) => {
                                            const type = fv.form_field?.input_type;
                                            const textVal = fv.text_value || '';
                                            const label = fv.form_field?.field_label || fv.form_field?.field_key || `Item ${fvIdx + 1}`;

                                            return (
                                                <div key={fvIdx} className="space-y-2 text-xs">
                                                    <p className="font-bold text-gray-800">{label}</p>

                                                    {/* FILE_UPLOAD */}
                                                    {type === 'FILE_UPLOAD' && (
                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                            {fv.file_url ? (
                                                                <div className="space-y-2">
                                                                    {fv.file_url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                                                                        <div className="rounded-lg overflow-hidden border border-gray-200 max-h-48 max-w-xs bg-white">
                                                                            <img 
                                                                                src={fv.file_url.startsWith('http') ? fv.file_url : `${apiBase}${fv.file_url}`} 
                                                                                alt={label} 
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-indigo-700 block">📄 File Dokumen</span>
                                                                    )}
                                                                    <a 
                                                                        href={fv.file_url.startsWith('http') ? fv.file_url : `${apiBase}${fv.file_url}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-indigo-600 font-bold underline inline-flex items-center gap-1 text-[11px]"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        Lihat / Unduh File ({fv.file_url.split('/').pop()})
                                                                    </a>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Belum diunggah</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* LINK */}
                                                    {type === 'LINK' && (
                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                            {fv.link_value ? (
                                                                <a 
                                                                    href={fv.link_value} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="text-indigo-600 font-bold underline inline-flex items-center gap-1 break-all"
                                                                >
                                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                                    {fv.link_value}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Belum diisi</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* REPEATER */}
                                                    {type === 'REPEATER' && (
                                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                            {(() => {
                                                                try {
                                                                    const items = JSON.parse(textVal);
                                                                    if (Array.isArray(items) && items.length > 0) {
                                                                        return (
                                                                            <ul className="list-disc list-inside space-y-1 text-gray-800">
                                                                                {items.map((item, i) => (
                                                                                    <li key={i}>{item}</li>
                                                                                ))}
                                                                            </ul>
                                                                        );
                                                                    }
                                                                } catch {}
                                                                return <p className="text-gray-800">{textVal || '-'}</p>;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* PRODUCT_LIST */}
                                                    {type === 'PRODUCT_LIST' && (
                                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                            {(() => {
                                                                try {
                                                                    const products: { nama: string; foto_url?: string }[] = JSON.parse(textVal);
                                                                    if (Array.isArray(products) && products.length > 0) {
                                                                        return (
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                                                                    <tr>
                                                                                        <th className="p-2 w-12 text-center">No</th>
                                                                                        <th className="p-2 text-left">Nama / Jenis Produk</th>
                                                                                        <th className="p-2 text-left w-36">Foto Produk</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {products.map((p, i) => {
                                                                                        const fFull = p.foto_url ? (p.foto_url.startsWith('http') ? p.foto_url : `${apiBase}${p.foto_url}`) : '';
                                                                                        return (
                                                                                            <tr key={i}>
                                                                                                <td className="p-2 text-center font-bold text-gray-500">{i + 1}</td>
                                                                                                <td className="p-2 font-bold text-gray-900">{p.nama}</td>
                                                                                                <td className="p-2">
                                                                                                    {fFull ? (
                                                                                                        <img src={fFull} alt={p.nama} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                                                                                    ) : (
                                                                                                        <span className="text-gray-400">-</span>
                                                                                                    )}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        );
                                                                    }
                                                                } catch {}
                                                                return <div className="p-3 text-gray-400 italic">Belum ada daftar produk</div>;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* INGREDIENT_LIST */}
                                                    {type === 'INGREDIENT_LIST' && (
                                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                            {(() => {
                                                                try {
                                                                    const ingredients: { nama: string; produsen?: string; penerbit?: string; no_id?: string; tanggal?: string }[] = JSON.parse(textVal);
                                                                    if (Array.isArray(ingredients) && ingredients.length > 0) {
                                                                        return (
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                                                                    <tr>
                                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                                        <th className="p-2 text-left">Nama Bahan</th>
                                                                                        <th className="p-2 text-left">Produsen</th>
                                                                                        <th className="p-2 text-left">Penerbit</th>
                                                                                        <th className="p-2 text-left">No. SH</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {ingredients.map((item, i) => (
                                                                                        <tr key={i}>
                                                                                            <td className="p-2 text-center font-bold text-gray-500">{i + 1}</td>
                                                                                            <td className="p-2 font-bold text-gray-900">{item.nama}</td>
                                                                                            <td className="p-2 text-gray-600">{item.produsen || '-'}</td>
                                                                                            <td className="p-2 text-gray-600">{item.penerbit || '-'}</td>
                                                                                            <td className="p-2 font-mono text-gray-800">{item.no_id || '-'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        );
                                                                    }
                                                                } catch {}
                                                                return <div className="p-3 text-gray-400 italic">Belum ada daftar bahan</div>;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* INGREDIENT_MATRIX */}
                                                    {type === 'INGREDIENT_MATRIX' && (
                                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                            {(() => {
                                                                try {
                                                                    const items: { nama_produk: string; bahan: string[] }[] = JSON.parse(textVal);
                                                                    if (Array.isArray(items) && items.length > 0) {
                                                                        return (
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                                                                    <tr>
                                                                                        <th className="p-2 w-12 text-center">No</th>
                                                                                        <th className="p-2 text-left w-1/3">Produk</th>
                                                                                        <th className="p-2 text-left">Bahan Digunakan</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {items.map((row, i) => (
                                                                                        <tr key={i}>
                                                                                            <td className="p-2 text-center font-bold text-gray-500">{i + 1}</td>
                                                                                            <td className="p-2 font-bold text-gray-900">{row.nama_produk}</td>
                                                                                            <td className="p-2 text-gray-700">
                                                                                                {(row.bahan || []).join(', ') || '-'}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        );
                                                                    }
                                                                } catch {}
                                                                return <div className="p-3 text-gray-400 italic">Belum ada matriks bahan</div>;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* ACTIVITY_PHOTOS */}
                                                    {type === 'ACTIVITY_PHOTOS' && (
                                                        <div className="space-y-2">
                                                            {(() => {
                                                                try {
                                                                    const items: { nama_kegiatan: string; fotos: string[] }[] = JSON.parse(textVal);
                                                                    if (Array.isArray(items) && items.length > 0) {
                                                                        return items.map((act, i) => (
                                                                            <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                                                                                <p className="font-bold text-gray-900">{act.nama_kegiatan}</p>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {(act.fotos || []).map((fUrl, fIdx) => {
                                                                                        const fFull = fUrl.startsWith('http') ? fUrl : `${apiBase}${fUrl}`;
                                                                                        return (
                                                                                            <img key={fIdx} src={fFull} alt={act.nama_kegiatan} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        ));
                                                                    }
                                                                } catch {}
                                                                return <div className="p-3 text-gray-400 italic">Belum ada foto kegiatan</div>;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* HALAL_TEAM */}
                                                    {type === 'HALAL_TEAM' && (
                                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                            {(() => {
                                                                try {
                                                                    const items: { nama: string; jabatan?: string; posisi_tim?: string; ttd_url?: string }[] = JSON.parse(textVal);
                                                                    if (Array.isArray(items) && items.length > 0) {
                                                                        return (
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                                                                    <tr>
                                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                                        <th className="p-2 text-left">Nama</th>
                                                                                        <th className="p-2 text-left">Jabatan</th>
                                                                                        <th className="p-2 text-left">Posisi Tim</th>
                                                                                        <th className="p-2 text-left w-24">Tanda Tangan</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-200">
                                                                                    {items.map((m, i) => {
                                                                                        const ttdFull = m.ttd_url ? (m.ttd_url.startsWith('http') ? m.ttd_url : `${apiBase}${m.ttd_url}`) : '';
                                                                                        return (
                                                                                            <tr key={i}>
                                                                                                <td className="p-2 text-center font-bold text-gray-500">{i + 1}</td>
                                                                                                <td className="p-2 font-bold text-gray-900">{m.nama}</td>
                                                                                                <td className="p-2 text-gray-600">{m.jabatan || '-'}</td>
                                                                                                <td className="p-2 text-gray-600">{m.posisi_tim || '-'}</td>
                                                                                                <td className="p-2">
                                                                                                    {ttdFull ? (
                                                                                                        <img src={ttdFull} alt={m.nama} className="h-10 object-contain" />
                                                                                                    ) : '-'}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        );
                                                                    }
                                                                } catch {}
                                                                return <div className="p-3 text-gray-400 italic">Belum ada tim halal</div>;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* DEFAULT / TEXT / DATE / NUMBER */}
                                                    {type !== 'FILE_UPLOAD' && type !== 'LINK' && type !== 'REPEATER' && type !== 'PRODUCT_LIST' && type !== 'INGREDIENT_LIST' && type !== 'INGREDIENT_MATRIX' && type !== 'ACTIVITY_PHOTOS' && type !== 'HALAL_TEAM' && (
                                                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 font-medium text-gray-900">
                                                            {textVal || '-'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
