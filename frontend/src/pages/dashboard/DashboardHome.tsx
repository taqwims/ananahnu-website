import { useEffect, useState } from 'react';
import { Users, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatsCard from '../../components/ui/StatsCard';
import api from '../../services/api';
import { formatNumber } from '../../utils/format';
import type { AuditLog } from '../../types';

interface DashboardStats {
    total_clients: number;
    sh_terbit: number;
    sidang_fatwa: number;
    pending: number;
}

const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#f43f5e'];

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activitiesRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/activities')
                ]);
                setStats(statsRes.data);
                setActivities(activitiesRes.data || []);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

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
                    value={formatNumber(stats?.total_clients || 0)}
                    icon={Users}
                    trend="+12%"
                    trendUp={true}
                />
                <StatsCard
                    title="SH Terbit"
                    value={formatNumber(stats?.sh_terbit || 0)}
                    icon={CheckCircle}
                    trend="+5%"
                    trendUp={true}
                />
                <StatsCard
                    title="Proses Fatwa"
                    value={formatNumber(stats?.sidang_fatwa || 0)}
                    icon={FileText}
                />
                <StatsCard
                    title="Pending Actions"
                    value={formatNumber(stats?.pending || 0)}
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
                        {activities.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                        ) : (
                            activities.map(activity => (
                                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-[10px] font-bold">
                                        {activity.action.substring(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">
                                            {activity.notes || activity.action}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {formatTimeAgo(activity.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
