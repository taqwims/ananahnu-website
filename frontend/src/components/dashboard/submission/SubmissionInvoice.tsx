import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

interface SubmissionInvoiceProps {
    invoice: any;
}

export const SubmissionInvoice = ({ invoice }: SubmissionInvoiceProps) => {
    const isPaid = invoice.status === 'PAID';

    return (
        <div className={`glass-panel p-6 shadow-xl border ${isPaid ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-xl ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Tagihan Layanan</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                    <p className="text-2xl font-black text-brand-600">{formatCurrency(invoice.amount)}</p>
                </div>
                <div className="bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
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
