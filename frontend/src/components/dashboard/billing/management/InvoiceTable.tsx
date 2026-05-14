import { CheckCircle, Clock } from 'lucide-react';
import type { Invoice } from '../../../../types';
import { formatServiceType, formatRupiah } from '../../../../utils/format';

interface InvoiceTableProps {
    invoices: Invoice[];
    onMarkPaid: (id: number) => Promise<void>;
}

export const InvoiceTable = ({ invoices, onMarkPaid }: InvoiceTableProps) => {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Utama</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sumber Harga</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Nominal</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {invoices.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data tagihan ditemukan</td></tr>
                    ) : (
                        invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-brand-50/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-800">{inv.submission?.client?.business_name || 'Manual Billing'}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono text-gray-400">#{inv.id}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-tighter">{formatServiceType(inv.service_type)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {inv.pricing_source ? (
                                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-wider">
                                            {inv.pricing_source.replace(/_/g, ' ')}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-brand-600">{formatRupiah(inv.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {inv.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {inv.status === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {inv.status === 'UNPAID' ? (
                                        <button 
                                            onClick={() => onMarkPaid(inv.id)}
                                            className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-700 transition-all active:scale-95 shadow-md shadow-brand-100"
                                        >
                                            Konfirmasi Lunas
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Dibayar Pada</span>
                                            <span className="text-xs text-emerald-600 font-black">{inv.paid_at ? formatDate(inv.paid_at) : formatDate(inv.created_at)}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
