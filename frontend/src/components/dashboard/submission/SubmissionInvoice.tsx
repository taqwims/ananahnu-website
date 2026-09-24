import { useState } from 'react';
import { Receipt, Download, ChevronDown, ChevronUp, Layers, HelpCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { Submission } from '../../../types';

interface SubmissionInvoiceProps {
    invoice: any;
    submissionId?: string;
    submission?: Submission;
    onRefresh?: () => void;
}

export const SubmissionInvoice = ({ invoice, submissionId, submission }: SubmissionInvoiceProps) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const isPaid = invoice.status === 'PAID';

    // Calculate total contract value (100%) and termin percentages
    const isReguler = invoice.service_type === 'REGULER' || invoice.type === 'DP' || invoice.type === 'PELUNASAN' || submission?.service_type === 'REGULER';
    const paymentScheme = submission?.cost_detail?.payment_scheme || (invoice.type === 'FULL' ? 'FULL' : (isReguler ? 'TERMIN' : 'FULL'));
    const isTermin = isReguler && paymentScheme !== 'FULL';

    // Dynamic DP percentage (default 70% if termin)
    const dpPct = submission?.cost_detail?.dp_percentage || invoice.percentage || 70;
    const pelunasanPct = 100 - dpPct;

    const isDP = invoice.type === 'DP' || (isTermin && invoice.type !== 'PELUNASAN' && invoice.type !== 'FULL');
    const isPelunasan = invoice.type === 'PELUNASAN';
    const isFull = invoice.type === 'FULL' || paymentScheme === 'FULL' || invoice.service_type === 'SELF_DECLARE_MANDIRI';
    const isFree = invoice.service_type === 'SELF_DECLARE' && (!submission?.self_declare_type || submission?.self_declare_type === 'GRATIS');

    // Determine Total Contract Value (100%)
    let totalContractValue = submission?.cost_detail?.total_amount || 0;
    if (totalContractValue === 0) {
        if (isDP && invoice.amount > 0) {
            totalContractValue = Math.round(invoice.amount / (dpPct / 100));
        } else if (isPelunasan && invoice.amount > 0) {
            totalContractValue = Math.round(invoice.amount / (pelunasanPct / 100));
        } else {
            totalContractValue = invoice.amount || 0;
        }
    }

    const dpAmount = Math.round(totalContractValue * (dpPct / 100));
    const pelunasanAmount = Math.round(totalContractValue * (pelunasanPct / 100));

    // Find DP and Pelunasan invoices in submission.invoices list
    const dpInvoice = submission?.invoices?.find(inv => inv.type === 'DP') || (isDP ? invoice : null);
    const pelunasanInvoice = submission?.invoices?.find(inv => inv.type === 'PELUNASAN') || (isPelunasan ? invoice : null);

    const isDpPaid = dpInvoice?.status === 'PAID' || (isDP && isPaid) || (isPelunasan && isPaid);
    const isPelunasanPaid = pelunasanInvoice?.status === 'PAID' || (isPelunasan && isPaid);

    // Remaining balance
    let remainingBalance = 0;
    if (isTermin) {
        if (!isDpPaid && !isPelunasanPaid) {
            remainingBalance = totalContractValue;
        } else if (isDpPaid && !isPelunasanPaid) {
            remainingBalance = pelunasanAmount;
        } else {
            remainingBalance = 0;
        }
    } else {
        remainingBalance = isPaid ? 0 : totalContractValue;
    }

    const handleDownload = async (type?: 'DP' | 'PELUNASAN' | 'FULL') => {
        if (!submissionId) return;
        try {
            const toastId = toast.loading(`Mengunduh Invoice ${type ? (type === 'DP' ? `Termin 1 (DP ${dpPct}%)` : `Termin 2 (Pelunasan ${pelunasanPct}%)`) : ''}...`);
            const urlParam = type ? `?type=${type}` : '';
            const res = await api.get(`/documents/submissions/${submissionId}/invoice-pdf${urlParam}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${type || 'Tagihan'}_${submission?.client?.business_name || 'Pelanggan'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Invoice berhasil diunduh', { id: toastId });
        } catch (error) {
            toast.error('Gagal mengunduh invoice');
            console.error('Download error:', error);
        }
    };

    // Parse cost breakdown data if available
    let breakdownItems: any[] = [];
    if (submission?.cost_detail?.cost_breakdown_data) {
        try {
            const raw = JSON.parse(submission.cost_detail.cost_breakdown_data);
            if (Array.isArray(raw)) {
                breakdownItems = raw;
            }
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className={`glass-panel p-4 sm:p-7 shadow-xl border rounded-3xl transition-all space-y-5 sm:space-y-6 overflow-hidden ${
            isPaid ? 'bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border-emerald-200' : 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-200'
        }`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Tagihan Layanan</h3>
                            {isTermin ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 max-w-full break-words inline-block">
                                    <span className="hidden sm:inline">Skema Termin Bertahap ({dpPct}% DP + {pelunasanPct}% Pelunasan)</span>
                                    <span className="sm:hidden">Termin {dpPct}% DP + {pelunasanPct}% Pelunasan</span>
                                </span>
                            ) : isFull ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 max-w-full break-words inline-block">
                                    Skema Pembayaran Penuh (100%)
                                </span>
                            ) : isFree ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 max-w-full break-words inline-block">
                                    Fasilitasi BPJPH (Gratis Rp 0)
                                </span>
                            ) : null}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 break-words">
                            {isDP
                                ? `Tagihan Tahap 1: Uang Muka (Down Payment ${dpPct}%) untuk memulai audit & verifikasi berkas`
                                : isPelunasan
                                    ? `Tagihan Tahap 2: Pelunasan Akhir (${pelunasanPct}%) setelah Sertifikat Halal terbit`
                                    : 'Rincian biaya administrasi dan pendampingan sertifikasi halal'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap">
                    {submissionId && (
                        <>
                            {isTermin ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleDownload('DP')}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all border border-blue-200 shadow-sm"
                                        title={`Unduh Invoice Termin 1 DP ${dpPct}%`}
                                    >
                                        <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>PDF Termin 1 (DP {dpPct}%)</span>
                                    </button>
                                    <button
                                        onClick={() => handleDownload('PELUNASAN')}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-200 shadow-sm"
                                        title={`Unduh Invoice Termin 2 Pelunasan ${pelunasanPct}%`}
                                    >
                                        <Download className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                        <span>PDF Termin 2 (Pelunasan {pelunasanPct}%)</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleDownload()}
                                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200 shadow-sm"
                                >
                                    <Download className="w-4 h-4 text-brand-600 shrink-0" />
                                    <span>Unduh Invoice {isPaid ? 'Lunas' : ''}</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Nilai Kontrak Layanan (100%) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 min-w-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">
                        Total Nilai Kontrak (100%)
                    </span>
                    <p className="text-[15px] sm:text-base font-black text-gray-900 truncate" title={formatCurrency(totalContractValue)}>
                        {formatCurrency(totalContractValue)}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                        Sesuai kontrak pendampingan
                    </p>
                </div>

                {/* 2. Termin 1: DP (X%) */}
                <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-1 min-w-0 ${
                    isDpPaid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-gray-100'
                }`}>
                    <div className="flex items-center justify-between text-gray-400 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                            Termin 1: DP ({dpPct}%)
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isDpPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {isDpPaid ? 'LUNAS' : 'BELUM BAYAR'}
                        </span>
                    </div>
                    <p className="text-[15px] sm:text-base font-black text-blue-700 truncate" title={formatCurrency(dpAmount)}>
                        {formatCurrency(dpAmount)}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                        {isDpPaid ? 'Terbayar di awal proses' : 'Harus dibayar sebelum proses'}
                    </p>
                </div>

                {/* 3. Termin 2: Pelunasan (100-X%) */}
                {isReguler ? (
                    <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-1 min-w-0 ${
                        isPelunasanPaid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between text-gray-400 gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                                Termin 2: Pelunasan ({pelunasanPct}%)
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                                isPelunasanPaid ? 'bg-emerald-100 text-emerald-800' : (submission?.status === 'SH_TERBIT' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600')
                            }`}>
                                {isPelunasanPaid ? 'LUNAS' : (submission?.status === 'SH_TERBIT' ? 'DITAGIHKAN' : 'MENUNGGU SH')}
                            </span>
                        </div>
                        <p className="text-[15px] sm:text-base font-black text-indigo-700 truncate" title={formatCurrency(pelunasanAmount)}>
                            {formatCurrency(pelunasanAmount)}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium truncate">
                            {isPelunasanPaid ? 'Lunas terbayar' : (submission?.status === 'SH_TERBIT' ? 'Sertifikat Halal terbit - Silakan lunasi' : 'Ditagihkan saat SH Terbit')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 min-w-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">
                            Pihak Pembayar
                        </span>
                        <p className="text-sm sm:text-base font-black text-gray-800 truncate" title={invoice.payer?.full_name || 'UMKM (Eksternal)'}>
                            {invoice.payer?.full_name || 'UMKM (Eksternal)'}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium truncate">
                            Penanggung jawab pembayaran
                        </p>
                    </div>
                )}

                {/* 4. Sisa Tagihan Kontrak */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 flex flex-col justify-between min-w-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">
                        Sisa Tagihan Kontrak
                    </span>
                    <div>
                        <p className={`text-[15px] sm:text-base font-black truncate ${
                            remainingBalance === 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`} title={formatCurrency(remainingBalance)}>
                            {formatCurrency(remainingBalance)}
                        </p>
                        <div className="mt-1">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                remainingBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {remainingBalance === 0 ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
                                <span className="truncate">{remainingBalance === 0 ? 'Kontrak Lunas' : 'Belum Lunas'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation Note */}
            {isReguler && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="space-y-1 text-xs text-blue-900">
                        <p className="font-bold">
                            Penjelasan Skema Pembayaran Layanan Reguler:
                        </p>
                        <p className="text-blue-800 leading-relaxed">
                            Total nilai kontrak layanan pendampingan sertifikasi halal adalah <strong className="font-black">{formatCurrency(totalContractValue)}</strong>.
                            Sesuai ketentuan, pembayaran dibagi dalam 2 termin:
                            <strong> Termin 1 (DP {dpPct}% = {formatCurrency(dpAmount)})</strong> dibayarkan diawal untuk proses audit & verifikasi berkas, dan
                            <strong> Termin 2 (Pelunasan {pelunasanPct}% = {formatCurrency(pelunasanAmount)})</strong> dibayarkan saat Sertifikat Halal resmi terbit.
                        </p>
                    </div>
                </div>
            )}

            {/* Optional Cost Breakdown Toggle */}
            {breakdownItems.length > 0 && (
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/80 text-xs font-bold text-gray-700 transition-all gap-2"
                    >
                        <span className="flex items-center gap-2 min-w-0 text-left">
                            <Layers className="w-4 h-4 text-brand-600 shrink-0" />
                            <span className="truncate sm:whitespace-normal">Rincian Komponen Biaya Layanan ({breakdownItems.length} Komponen)</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-brand-700 font-bold shrink-0">
                            {showBreakdown ? 'Sembunyikan' : 'Lihat Rincian'}
                            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </span>
                    </button>

                    {showBreakdown && (
                        <div className="mt-3 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm animate-fadeIn">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-xs text-left min-w-[300px]">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500">
                                        <tr>
                                            <th className="py-2.5 px-3 sm:px-4">Nama Komponen</th>
                                            <th className="hidden sm:table-cell py-2.5 px-4 text-center">Kategori</th>
                                            <th className="py-2.5 px-3 sm:px-4 text-right">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {breakdownItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="py-2.5 px-3 sm:px-4">
                                                    <p className="font-bold text-gray-800 text-xs leading-snug">{item.name}</p>
                                                    <span className="sm:hidden mt-1 inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[9px] font-bold uppercase">
                                                        {item.category || 'LAYANAN'}
                                                    </span>
                                                </td>
                                                <td className="hidden sm:table-cell py-2.5 px-4 text-center">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold">
                                                        {item.category || 'LAYANAN'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 sm:px-4 text-right font-black text-gray-900 whitespace-nowrap align-top sm:align-middle text-xs sm:text-sm">
                                                    {formatCurrency(item.total || item.amount || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50 font-black text-gray-900 border-t-2 border-gray-200">
                                            <td className="py-3 px-3 sm:px-4">
                                                <span className="hidden sm:inline">TOTAL NILAI KONTRAK (100%)</span>
                                                <span className="sm:hidden text-xs">TOTAL (100%)</span>
                                            </td>
                                            <td className="hidden sm:table-cell"></td>
                                            <td className="py-3 px-3 sm:px-4 text-right text-brand-700 text-xs sm:text-sm font-black whitespace-nowrap">
                                                {formatCurrency(totalContractValue)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
