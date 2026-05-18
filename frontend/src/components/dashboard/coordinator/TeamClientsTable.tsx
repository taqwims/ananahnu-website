import { Briefcase } from 'lucide-react';
import type { Client } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface TeamClientsTableProps {
    clients: Client[];
}

export const TeamClientsTable = ({ clients }: TeamClientsTableProps) => {
    if (clients.length === 0) {
        return (
            <div className="glass-panel p-20 text-center text-gray-400 border-dashed border-2 border-gray-100">
                <div className="p-6 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-gray-800">Belum Ada Klien</h3>
                <p className="text-sm font-medium mt-2 max-w-xs mx-auto">Tim Anda belum memiliki klien yang terdaftar di sistem.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Informasi Usaha</th>
                            <th className="px-8 py-5">Jenis Produk</th>
                            <th className="px-8 py-5">Layanan</th>
                            <th className="px-8 py-5">Advisor</th>
                            <th className="px-8 py-5">Kontak</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {clients.map(c => (
                            <tr key={c.id} className="hover:bg-brand-50/20 transition-all group">
                                <td className="px-8 py-6">
                                    <p className="text-sm font-black text-gray-900 group-hover:text-brand-600 transition-colors">{c.business_name}</p>
                                    <p className="text-[10px] font-black font-mono text-gray-400 mt-1 tracking-widest uppercase">NIB: {c.nib}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-xs font-bold text-gray-600">{c.product_name}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                        c.service_type === 'REGULER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                    }`}>
                                        {formatServiceType(c.service_type)}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-xs">
                                            {c.facilitator?.full_name?.charAt(0)}
                                        </div>
                                        <p className="text-xs font-black text-gray-700">{c.facilitator?.full_name || 'Tidak Ditugaskan'}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-xs font-black text-brand-600 tracking-wider">{c.phone || '-'}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
