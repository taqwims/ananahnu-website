import { Link } from 'react-router-dom';
import { 
    Users, 
    CheckCircle, 
    Clock, 
    ExternalLink, 
    Building2, 
    TrendingUp 
} from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { Commission } from '../../../types';

export type CommissionDisplayType = 'DIRECT_SALES' | 'OVERRIDE' | 'REFERRAL';

interface CommissionsTableProps {
    commissions: Commission[];
    isLoading: boolean;
    type?: CommissionDisplayType;
    title?: string;
    subtitle?: string;
}

export const CommissionsTable = ({
    commissions,
    isLoading,
    type = 'DIRECT_SALES',
    title,
    subtitle
}: CommissionsTableProps) => {

    const getHeaderConfig = () => {
        if (type === 'DIRECT_SALES') {
            return {
                icon: <Building2 className="w-5 h-5 text-brand-600" />,
                title: title || 'Daftar Pendampingan & Komisi Langsung Klien',
                subtitle: subtitle || 'Komisi pendampingan sertifikasi halal yang didapatkan langsung dari klien binaan Anda',
                emptyTitle: 'Belum ada komisi pendampingan dari klien.',
                emptySubtitle: 'Komisi akan otomatis tercatat setelah klien Anda melakukan pembayaran sertifikasi halal.'
            };
        }
        if (type === 'OVERRIDE') {
            return {
                icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
                title: title || 'Riwayat Insentif Override Halal Manager',
                subtitle: subtitle || 'Insentif manajerial yang diperoleh dari performa Halal Advisor binaan Anda',
                emptyTitle: 'Belum ada insentif override yang tercatat.',
                emptySubtitle: 'Insentif override akan muncul saat Halal Advisor binaan Anda menyelesaikan transaksi klien.'
            };
        }
        return {
            icon: <Users className="w-5 h-5 text-blue-600" />,
            title: title || 'Riwayat Insentif Referral Mitra',
            subtitle: subtitle || 'Insentif dari mitra atau advisor baru yang mendaftar melalui kode referral Anda',
            emptyTitle: 'Belum ada insentif referral yang tercatat.',
            emptySubtitle: 'Bagikan kode referral Anda kepada calon mitra untuk mulai mendapatkan insentif referral.'
        };
    };

    const header = getHeaderConfig();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        {header.icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{header.title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{header.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                        Total {commissions.length} Transaksi
                    </span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/70 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            {type === 'DIRECT_SALES' && (
                                <>
                                    <th className="px-6 py-4">Klien / Pelaku Usaha</th>
                                    <th className="px-6 py-4">Pengajuan & Layanan</th>
                                    <th className="px-6 py-4">Biaya Pendampingan</th>
                                    <th className="px-6 py-4">Komisi Langsung</th>
                                </>
                            )}

                            {type === 'OVERRIDE' && (
                                <>
                                    <th className="px-6 py-4">Halal Advisor Binaan</th>
                                    <th className="px-6 py-4">Klien Binaan</th>
                                    <th className="px-6 py-4">Omset / Nilai Transaksi</th>
                                    <th className="px-6 py-4">Insentif Override</th>
                                </>
                            )}

                            {type === 'REFERRAL' && (
                                <>
                                    <th className="px-6 py-4">Mitra yang Direferensikan</th>
                                    <th className="px-6 py-4">Keterangan / Pengajuan</th>
                                    <th className="px-6 py-4">Nominal Komisi</th>
                                </>
                            )}

                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Tanggal</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-xs font-medium text-gray-400">Memuat data komisi...</p>
                                </td>
                            </tr>
                        ) : commissions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-14 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                                        {header.icon}
                                    </div>
                                    <p className="text-gray-700 font-bold">{header.emptyTitle}</p>
                                    <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto">{header.emptySubtitle}</p>
                                </td>
                            </tr>
                        ) : (
                            commissions.map((c) => {
                                const subId = c.submission?.id || c.submission_id;
                                const clientName = c.submission?.client?.business_name || c.submission?.client?.client_name || 'Pelaku Usaha';
                                const clientPic = c.submission?.client?.client_name;
                                const clientPhone = c.submission?.client?.phone;
                                
                                const advisorName = c.submission?.consultant?.full_name || c.referred?.full_name || c.user?.full_name || '-';
                                const advisorCode = c.submission?.consultant?.referral_code || c.referred?.referral_code || (c.referred_id ? c.referred_id.slice(0, 8) : null);

                                return (
                                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                                        {/* KOLOM UNTUK KOMISI LANGSUNG (DIRECT_SALES) */}
                                        {type === 'DIRECT_SALES' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{clientName}</span>
                                                        {clientPic && clientPic !== clientName && (
                                                            <span className="text-xs text-gray-500">PIC: {clientPic}</span>
                                                        )}
                                                        {clientPhone && (
                                                            <span className="text-[11px] text-gray-400 font-mono mt-0.5">{clientPhone}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        {c.submission?.service_type && (
                                                            <span className="text-[10px] text-brand-700 font-black uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded-md self-start border border-brand-100">
                                                                {c.submission.service_type.replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                        {c.submission?.tracking_number && (
                                                            <span className="text-xs font-mono text-gray-500 font-semibold mt-1">
                                                                #{c.submission.tracking_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 font-semibold">
                                                    {formatRupiah(c.base_omset || 0)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-base font-black text-brand-600">
                                                        {formatRupiah(c.amount)}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {/* KOLOM UNTUK OVERRIDE (HALAL MANAGER) */}
                                        {type === 'OVERRIDE' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{advisorName}</span>
                                                        {advisorCode && (
                                                            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded self-start mt-0.5">
                                                                Reg: #{advisorCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {c.submission?.client?.business_name || (subId ? 'Pengajuan Klien' : 'Pengajuan')}
                                                        </span>
                                                        {c.submission?.tracking_number && (
                                                            <span className="text-[10px] font-mono text-gray-400">
                                                                #{c.submission.tracking_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 font-semibold">
                                                    {formatRupiah(c.base_omset || 0)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-base font-black text-emerald-600">
                                                        {formatRupiah(c.amount)}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {/* KOLOM UNTUK REFERRAL */}
                                        {type === 'REFERRAL' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{advisorName}</span>
                                                        {c.referred?.email && (
                                                            <span className="text-xs text-gray-400">{c.referred.email}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {c.submission?.client?.business_name ? `Pengajuan: ${c.submission.client.business_name}` : 'Registrasi Referral Mitra'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-base font-black text-blue-600">
                                                        {formatRupiah(c.amount)}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {/* KOLOM STATUS */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {c.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {c.status === 'PAID' ? 'Dibayar' : 'Pending'}
                                            </span>
                                        </td>

                                        {/* KOLOM TANGGAL */}
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>

                                        {/* KOLOM AKSI */}
                                        <td className="px-6 py-4 text-center">
                                            {subId ? (
                                                <Link 
                                                    to={`/dashboard/submissions/${subId}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white border border-brand-200 rounded-xl text-xs font-bold transition-all shadow-sm group/btn"
                                                    title="Lihat Detail Pengajuan"
                                                >
                                                    <span>Detail</span>
                                                    <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-300 font-medium">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
