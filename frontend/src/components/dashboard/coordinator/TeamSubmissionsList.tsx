import { CheckCircle, Clock, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Submission } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface TeamSubmissionsListProps {
    submissions: Submission[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    WAITING_PAYMENT: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    VERVAL_PENDAMPING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
    QC_OFFICER: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
    DRAFTER: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Clock },
    SIDANG_FATWA: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Clock },
    SH_TERBIT: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: CheckCircle },
    REVISION: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
};

export const TeamSubmissionsList = ({ submissions }: TeamSubmissionsListProps) => {
    if (submissions.length === 0) {
        return (
            <div className="glass-panel p-20 text-center text-gray-400 border-dashed border-2 border-gray-100">
                <div className="p-6 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-gray-800">Tidak Ada Pengajuan</h3>
                <p className="text-sm font-medium mt-2 max-w-xs mx-auto">Tim Anda belum memproses pengajuan apapun dalam periode ini.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel overflow-hidden border border-gray-100 divide-y divide-gray-50">
            {submissions.map(sub => {
                const status = STATUS_COLORS[sub.status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };
                return (
                    <div key={sub.id} className="p-6 hover:bg-brand-50/20 transition-all flex flex-col sm:flex-row items-center justify-between gap-6 group">
                        <div className="flex items-center gap-6 w-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${status.bg} ${status.text}`}>
                                <status.icon className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-black text-gray-800 tracking-tight group-hover:text-brand-600 transition-colors">
                                    {sub.client?.business_name || 'Unit Usaha Tanpa Nama'}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                    <p className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest">NIB: {sub.client?.nib || '-'}</p>
                                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{formatServiceType(sub.service_type)}</p>
                                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(sub.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                            <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border ${status.bg} ${status.text} border-transparent group-hover:border-current transition-all`}>
                                {sub.status.replace(/_/g, ' ')}
                            </span>
                            <Link 
                                to={`/dashboard/submissions/${sub.id}`} 
                                className="p-3 bg-white text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl transition-all shadow-sm border border-gray-100 group-hover:shadow-lg"
                            >
                                <Eye className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
