import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface SubmissionStatsProps {
    stats: {
        total: number;
        pending: number;
        completed: number;
        rejected: number;
    };
}

export const SubmissionStats = ({ stats }: SubmissionStatsProps) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Pengajuan" value={stats.total} icon={FileText} color="text-brand-600" bg="bg-brand-50" />
            <StatCard label="Dalam Proses" value={stats.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
            <StatCard label="Selesai (SH Terbit)" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard label="Ditolak" value={stats.rejected} icon={XCircle} color="text-red-600" bg="bg-red-50" />
        </div>
    );
};

function StatCard({ label, value, icon: Icon, color, bg }: { label: string, value: number, icon: any, color: string, bg: string }) {
    return (
        <div className="glass-panel p-5 flex items-center gap-4 border border-white/60 shadow-md">
            <div className={`p-3 ${bg} rounded-2xl`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-black text-gray-900`}>{value}</p>
            </div>
        </div>
    );
}
