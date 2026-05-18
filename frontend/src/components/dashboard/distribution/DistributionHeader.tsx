import { Layers, FileText, LayoutGrid, Briefcase, Users } from 'lucide-react';

interface DistributionHeaderProps {
    stats: {
        total: number;
        reguler: number;
        selfDeclare: number;
        coordinators: number;
    };
}

export const DistributionHeader = ({ stats }: DistributionHeaderProps) => {
    return (
        <div className="relative overflow-hidden bg-brand-900 rounded-3xl p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Layers className="w-6 h-6 text-brand-200" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Antrian Distribusi Data</h1>
                    </div>
                    <p className="text-brand-100/80 max-w-md">
                        Kelola pembagian tugas dari Advisor ke Drafter. Gunakan bulk action untuk efisiensi distribusi.
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
                    <StatItem icon={FileText} label="Total" value={stats.total} color="bg-white/10" />
                    <StatItem icon={LayoutGrid} label="Reguler" value={stats.reguler} color="bg-blue-500/20" />
                    <StatItem icon={Briefcase} label="Self Declare" value={stats.selfDeclare} color="bg-purple-500/20" />
                    <StatItem icon={Users} label="Team" value={stats.coordinators} color="bg-amber-500/20" />
                </div>
            </div>
        </div>
    );
};

function StatItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    return (
        <div className={`p-4 rounded-2xl backdrop-blur-md ${color} border border-white/10 flex items-center gap-3`}>
            <div className="p-2 bg-white/10 rounded-lg">
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black">{value}</p>
            </div>
        </div>
    );
}
