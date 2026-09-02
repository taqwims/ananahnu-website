import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import type { Submission, User, FormFieldValue } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface SubmissionHeaderProps {
    submission: Submission;
    user: User | null;
    fieldValues?: FormFieldValue[];
}

export const SubmissionHeader = ({ submission, user }: SubmissionHeaderProps) => {
    const navigate = useNavigate();
    const serviceType = submission.service_type || submission.client?.service_type || '';


    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 p-4 sm:p-5 rounded-2xl backdrop-blur-md border border-white/80 shadow-xs">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <button 
                    onClick={() => navigate('/dashboard/submissions')} 
                    className="p-2 hover:bg-white rounded-xl transition-all shadow-xs border border-gray-100 shrink-0"
                    title="Kembali ke Daftar Ajuan"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">Detail Pengajuan</h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium truncate" title={submission.client?.business_name || ''}>
                        Bisnis: <span className="font-semibold text-gray-700">{submission.client?.business_name || '-'}</span>
                    </p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto sm:ml-auto justify-start sm:justify-end">
                {serviceType && (
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs shrink-0 ${
                        serviceType === 'REGULER' || serviceType === 'SELF_DECLARE_MANDIRI' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                        {formatServiceType(serviceType)}
                    </span>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 font-black text-[10px] uppercase tracking-wider shadow-xs shrink-0">
                    {submission.status.replace(/_/g, ' ')}
                </span>
                {submission.tracking_number && (
                    <div className="flex flex-col items-start sm:items-end bg-white/90 px-3 py-1.5 rounded-xl border border-gray-150 shadow-xs shrink-0">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">No. Resi</span>
                        <span className="text-xs sm:text-sm font-black text-brand-600 font-mono leading-none break-all">{submission.tracking_number}</span>
                    </div>
                )}

                {user?.role === 'DRAFTER' && submission.status === 'DRAFTER' && (
                    <button 
                        onClick={() => navigate(`/dashboard/drafter-workspace?id=${submission.id}`)}
                        className="px-3.5 py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-brand-100 hover:scale-105 transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Buka di Ruang Kerja</span>
                    </button>
                )}
            </div>
        </div>
    );
};
