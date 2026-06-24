import { Pencil, Trash2, Tag } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';

interface BillingComponentTableProps {
    components: any[];
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    provinces: any[];
    businessTypes: any[];
    products: any[];
    schemes: any[];
    scales: any[];
}

export const BillingComponentTable = ({
    components,
    onEdit,
    onDelete,
    provinces,
    businessTypes,
    products,
    schemes,
    scales
}: BillingComponentTableProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Tipe</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sifat</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batasan Wilayah / Klasifikasi</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {components.length === 0 ? (
                        <tr><td colSpan={6} className="py-12 text-center text-gray-400">Belum ada komponen biaya.</td></tr>
                    ) : components.map(c => (
                        <tr key={c.id} className="hover:bg-brand-50/20 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-800">{c.name}</div>
                                <div className="mt-1"><span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">{c.type}</span></div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shadow-sm ${
                                    c.category === 'REGISTRASI' ? 'bg-blue-100 text-blue-700' :
                                    c.category === 'PENETAPAN' ? 'bg-purple-100 text-purple-700' :
                                    c.category === 'PENDAMPINGAN' ? 'bg-green-100 text-green-700' :
                                    c.category === 'BPJPH' ? 'bg-indigo-100 text-indigo-700' :
                                    c.category === 'MUI' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {c.category}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-black text-gray-900">{formatRupiah(c.base_amount)}</div>
                            </td>
                            <td className="px-6 py-4">
                                {c.is_mandatory ? (
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md w-fit border border-brand-100">
                                        <Tag className="w-3 h-3" /> WAJIB
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md w-fit border border-gray-200">
                                            OPSIONAL
                                        </div>
                                        {c.form_field_config && (
                                            <span className="text-[9px] text-blue-600 font-extrabold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md mt-1 block w-fit truncate max-w-[150px]" title={`Dihubungkan dengan form field: ${c.form_field_config.field_label}`}>
                                                Form: {c.form_field_config.field_label}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                        {c.district_id ? 'Kecamatan (Satu Daerah)' : c.regency_id ? 'Kabupaten (Satu Daerah)' : c.province_id ? provinces.find(p => p.id === c.province_id)?.name || `#${c.province_id}` : 'Semua Wilayah'}
                                    </span>
                                    {(c.business_type_id || c.product_category_id) && (
                                        <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                                        {c.business_type_id ? businessTypes.find(bt => bt.id === c.business_type_id)?.name : 'Semua Bidang'} 
                                        {c.product_category_id ? ` • ${products.find(p => p.id === c.product_category_id)?.name}` : ''}
                                    </span>
                                )}
                                {(c.sales_scheme_id || c.business_scale_id) && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                        {c.sales_scheme_id ? schemes.find(s => s.id === c.sales_scheme_id)?.name : 'Semua Skema'} 
                                        {c.business_scale_id ? ` • ${scales.find(s => s.id === c.business_scale_id)?.name}` : ''}
                                    </span>
                                )}
                                <span className="text-xs text-gray-600 flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.data_source === 'MARKETING' ? 'bg-amber-400' : c.data_source === 'BOTH' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                                    Sumber: {c.data_source === 'BOTH' ? 'Semua' : ((c.data_source === 'ORGANIK' || c.data_source === 'TELEMARKETING' || !c.data_source) ? 'Organik / Telemarketing' : (c.data_source === 'MARKETING' ? 'Marketing (Partner)' : c.data_source))}
                                </span>
                            </div>
                        </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onEdit(c)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
