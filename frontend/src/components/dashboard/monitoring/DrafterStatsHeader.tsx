import { Monitor, Activity, Layers, Clock, Zap, Briefcase } from 'lucide-react';

interface DrafterStatsHeaderProps {
    stats: {
        total: number;
        ongoing: number;
        completed: number;
        reguler: number;
        selfDeclare: number;
        drafterActive: number;
    };
}

export const DrafterStatsHeader = ({ stats }: DrafterStatsHeaderProps) => {
    return (
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-600 rounded-2xl shadow-xl shadow-brand-100">
                            <Monitor className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Drafter Analytics</h1>
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                <Activity className="w-3 h-3" />
                                <span>Monitoring Beban Kerja & Performa</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <AnalyticCard label="Total Tugas" value={stats.total} icon={Layers} color="bg-brand-50 text-brand-600" />
                    <AnalyticCard label="On Going" value={stats.ongoing} icon={Clock} color="bg-amber-50 text-amber-600" />
                    <AnalyticCard label="Self Declare" value={stats.selfDeclare} icon={Zap} color="bg-purple-50 text-purple-600" />
                    <AnalyticCard label="Reguler" value={stats.reguler} icon={Briefcase} color="bg-blue-50 text-blue-600" />
                </div>
            </div>
        </div>
    );
};

function AnalyticCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className={`p-4 rounded-[1.75rem] ${color} transition-all hover:scale-105 duration-300`}>
            <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
                <p className="text-2xl font-black">{value}</p>
            </div>
        </div>
    );
}
