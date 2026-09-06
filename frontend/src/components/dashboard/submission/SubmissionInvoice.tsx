import { useState } from 'react';
import { Receipt, Download, ChevronDown, ChevronUp, Layers, HelpCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { Submission } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import ManageCostComponentsModal from './ManageCostComponentsModal';

interface SubmissionInvoiceProps {
    invoice: any;
    submissionId?: string;
    submission?: Submission;
    onRefresh?: () => void;
}

export const SubmissionInvoice = ({ invoice, submissionId, submission, onRefresh }: SubmissionInvoiceProps) => {
    const { user } = useAuthStore();
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const isPaid = invoice.status === 'PAID';

    const canManagePricing = user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'DIRECTOR' || user?.role === 'MARKETING';

    const handleDownload = async () => {
        if (!submissionId) return;
        try {
            const toastId = toast.loading('Mengunduh Invoice...');
            const res = await api.get(`/documents/submissions/${submissionId}/invoice-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${isPaid ? 'Lunas' : 'Tagihan'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Invoice berhasil diunduh', { id: toastId });
        } catch (error) {
            toast.error('Gagal mengunduh invoice');
            console.error('Download error:', error);
        }
    };

    // Calculate total contract value (100%) and termin percentages
    const isReguler = invoice.service_type === 'REGULER' || invoice.type === 'DP' || invoice.type === 'PELUNASAN';
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
        <div className={`glass-panel p-4 sm:p-7 shadow-xl border rounded-3xl transition-all space-y-5 sm:space-y-6 overflow-hidden ${isPaid ? 'bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border-emerald-200' : 'bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-200'
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
                                ? `Tagihan Tahap 1: Uang Muka (Down Payment ${dpPct}%) untuk memulai audit & verifikasi dokumen`
                                : isPelunasan
                                    ? `Tagihan Tahap 2: Pelunasan Akhir (${pelunasanPct}%) setelah Sertifikat Halal terbit`
                                    : 'Rincian biaya administrasi dan pendampingan sertifikasi halal'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap">
                    {canManagePricing && submission && (
                        <button
                            type="button"
                            onClick={() => setShowManageModal(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-all border border-brand-200 shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-brand-600 shrink-0" />
                            <span>Kelola Komponen Harga</span>
                        </button>
                    )}
                    {submissionId && (
                        <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200 shadow-sm"
                        >
                            <Download className="w-4 h-4 text-brand-600 shrink-0" />
                            <span>Unduh Invoice {isPaid ? 'Lunas' : ''}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Tagihan Saat Ini (Nominal Aktif) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 min-w-0">
                    <div className="flex items-center justify-between text-gray-400 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                            {isDP ? 'Tagihan Termin 1 (70%)' : isPelunasan ? 'Tagihan Termin 2 (30%)' : 'Total Tagihan'}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded shrink-0">
                            {isDP ? 'DP 70%' : isPelunasan ? 'Pelunasan 30%' : '100%'}
                        </span>
                    </div>
                    <p className="text-[15px] sm:text-base font-black text-brand-700 truncate" title={formatCurrency(invoice.amount)}>{formatCurrency(invoice.amount)}</p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                        {isDP ? 'Harus dibayar diawal' : isPelunasan ? 'Harus dibayar saat ini' : 'Nominal yang harus dibayar'}
                    </p>
                </div>

                {/* 2. Total Nilai Kontrak Layanan (100%) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 min-w-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">
                        Total Nilai Kontrak (100%)
                    </span>
                    <p className="text-[15px] sm:text-base font-black text-gray-800 truncate" title={formatCurrency(totalContractValue)}>{formatCurrency(totalContractValue)}</p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                        Sesuai tertera di kontrak layanan
                    </p>
                </div>

                {/* 3. Sisa Pelunasan / Status DP */}
                {isReguler ? (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 min-w-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">
                            {isPelunasan ? 'DP Termin 1 (70%)' : 'Sisa Termin 2 (30%)'}
                        </span>
                        <p className="text-[15px] sm:text-base font-black text-indigo-600 truncate" title={formatCurrency(isPelunasan ? dpAmount : pelunasanAmount)}>
                            {formatCurrency(isPelunasan ? dpAmount : pelunasanAmount)}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium truncate">
                            {isPelunasan ? 'Sudah terbayar di awal' : 'Ditagihkan saat SH Terbit'}
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

                {/* 4. Status Pembayaran */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 flex flex-col justify-between min-w-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">
                        Status Pembayaran
                    </span>
                    <div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {isPaid ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                            <span className="truncate">{isPaid ? 'Lunas Terbayar' : 'Menunggu Bayar'}</span>
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
                            <strong> Termin 1 (DP 70% = {formatCurrency(dpAmount)})</strong> dibayarkan diawal untuk proses audit & verifikasi berkas, dan
                            <strong> Termin 2 (Pelunasan 30% = {formatCurrency(pelunasanAmount)})</strong> dibayarkan saat Sertifikat Halal resmi terbit.
                        </p>
                    </div>
                </div>
            )}

            {/* Optional Cost Breakdown Toggle */}
            {(breakdownItems.length > 0 || (canManagePricing && submission)) && (
                <div className="pt-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex-1 flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/80 text-xs font-bold text-gray-700 transition-all gap-2"
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
                        {canManagePricing && submission && (
                            <button
                                type="button"
                                onClick={() => setShowManageModal(true)}
                                className="px-3.5 py-3 sm:py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                                title="Tambah atau kelola komponen harga"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Tambah Komponen</span>
                            </button>
                        )}
                    </div>

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
                                        {breakdownItems.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-6 text-center text-gray-400 italic">
                                                    Belum ada rincian komponen harga. Klik tombol "Tambah Komponen" di atas untuk menambahkan komponen biaya.
                                                </td>
                                            </tr>
                                        )}
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

            {showManageModal && submission && (
                <ManageCostComponentsModal
                    isOpen={showManageModal}
                    onClose={() => setShowManageModal(false)}
                    submission={submission}
                    onSaved={() => {
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
};
