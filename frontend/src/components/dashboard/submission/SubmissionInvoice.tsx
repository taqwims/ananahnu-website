import { Receipt, Download } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface SubmissionInvoiceProps {
    invoice: any;
    submissionId?: string;
}

export const SubmissionInvoice = ({ invoice, submissionId }: SubmissionInvoiceProps) => {
    const isPaid = invoice.status === 'PAID';

    const handleDownload = async () => {
        if (!submissionId) return;
        try {
            const toastId = toast.loading('Mengunduh Invoice...');
            const res = await api.get(`/documents/submissions/${submissionId}/invoice-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_Lunas.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Invoice berhasil diunduh', { id: toastId });
        } catch (error) {
            toast.error('Gagal mengunduh invoice');
            console.error('Download error:', error);
        }
    };

    return (
        <div className={`glass-panel p-6 shadow-xl border ${isPaid ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'}`}>
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <Receipt className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Tagihan Layanan</h3>
                </div>
                {isPaid && submissionId && (
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-all border border-brand-100"
                    >
                        <Download className="w-4 h-4" />
                        Unduh Invoice
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/60 p-4 rounded-2xl border border-white/88 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                    <p className="text-2xl font-black text-brand-600">{formatCurrency(invoice.amount)}</p>
                </div>
                <div className="bg-white/60 p-4 rounded-2xl border border-white/88 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Pembayaran</p>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isPaid ? '✓ Lunas' : '⏳ Menunggu'}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pihak Pembayar</p>
                    <p className="text-sm font-bold text-gray-800">{invoice.payer?.full_name || 'UMKM (Eksternal)'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jenis Layanan</p>
                    <p className="text-sm font-bold text-gray-800">{invoice.service_type?.replace(/_/g, ' ')}</p>
                </div>
            </div>
        </div>
    );
};
