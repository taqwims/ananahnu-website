import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import type { Submission, User } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface SubmissionHeaderProps {
    submission: Submission;
    user: User | null;
}

export const SubmissionHeader = ({ submission, user }: SubmissionHeaderProps) => {
    const navigate = useNavigate();
    const serviceType = submission.service_type || submission.client?.service_type || '';


    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/40 p-4 rounded-2xl backdrop-blur-md border border-white/60">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/80 rounded-xl transition-all shadow-sm">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Detail Pengajuan</h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Bisnis: {submission.client?.business_name}</p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 sm:ml-auto w-full sm:w-auto">
                {serviceType && (
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                        serviceType === 'REGULER' || serviceType === 'SELF_DECLARE_MANDIRI' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                        {formatServiceType(serviceType)}
                    </span>
                )}
                <span className="px-3 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 font-black text-[10px] uppercase tracking-wider shadow-sm">
                    {submission.status.replace(/_/g, ' ')}
                </span>
                {submission.tracking_number && (
                    <div className="flex flex-col items-start sm:items-end bg-white/60 px-3 py-1.5 rounded-xl border border-white/80 shadow-sm min-w-[120px]">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">No. Resi</span>
                        <span className="text-sm font-black text-brand-600 font-mono leading-none">{submission.tracking_number}</span>
                    </div>
                )}

                {user?.role === 'DRAFTER' && submission.status === 'DRAFTER' && (
                    <button 
                        onClick={() => navigate(`/dashboard/drafter-workspace?id=${submission.id}`)}
                        className="px-4 py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Buka di Ruang Kerja
                    </button>
                )}
            </div>
        </div>
    );
};
