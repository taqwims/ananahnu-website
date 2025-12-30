import { useEffect, useState } from 'react';
import { Users, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatsCard from '../../components/ui/StatsCard';
import api from '../../services/api';

interface DashboardStats {
    total_clients: number;
    sh_terbit: number;
    sidang_fatwa: number;
    pending: number;
}

const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#f43f5e'];

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    }

    const pieData = [
        { name: 'SH Terbit', value: stats?.sh_terbit || 0 },
        { name: 'Sidang Fatwa', value: stats?.sidang_fatwa || 0 },
        { name: 'Pending', value: stats?.pending || 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Clients"
                    value={stats?.total_clients || 0}
                    icon={Users}
                    trend="+12%"
                    trendUp={true}
                />
                <StatsCard
                    title="SH Terbit"
                    value={stats?.sh_terbit || 0}
                    icon={CheckCircle}
                    trend="+5%"
                    trendUp={true}
                />
                <StatsCard
                    title="Proses Fatwa"
                    value={stats?.sidang_fatwa || 0}
                    icon={FileText}
                />
                <StatsCard
                    title="Pending Actions"
                    value={stats?.pending || 0}
                    icon={Clock}
                    trend="-2%"
                    trendUp={false}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Submission Status Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                                <span>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Placeholder for Recent Activity */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                    UD
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">UD. Sejahtera Abadi submitted documents</p>
                                    <p className="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
