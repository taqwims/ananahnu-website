interface DashboardStatsProps {
    teamCount: number;
    verifiedCount: number;
    clientCount: number;
    activeSubmissionCount: number;
}

export const DashboardStats = ({
    teamCount,
    verifiedCount,
    clientCount,
    activeSubmissionCount
}: DashboardStatsProps) => {
    const stats = [
        { label: 'Anggota Tim', value: teamCount, color: 'text-gray-800', bg: 'bg-white' },
        { label: 'Profil Terverifikasi', value: verifiedCount, color: 'text-emerald-600', bg: 'bg-white' },
        { label: 'Total Klien', value: clientCount, color: 'text-brand-600', bg: 'bg-white' },
        { label: 'Pengajuan Aktif', value: activeSubmissionCount, color: 'text-purple-600', bg: 'bg-white' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className={`glass-panel p-6 border-transparent hover:border-brand-100 transition-all group`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-600 transition-colors">{stat.label}</p>
                    <p className={`text-3xl font-black mt-2 tracking-tighter ${stat.color}`}>{stat.value}</p>
                    <div className="w-10 h-1 bg-gray-50 mt-4 rounded-full overflow-hidden">
                        <div className={`h-full ${stat.color.replace('text', 'bg')} opacity-20 w-1/2`}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};
