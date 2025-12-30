import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

const StatsCard = ({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) => {
    return (
        <div className="glass-panel p-6 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {trend && (
                    <p className={`text-xs font-medium mt-2 flex items-center ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {trend} from last month
                    </p>
                )}
            </div>
            <div className="p-3 bg-brand-50 rounded-lg">
                <Icon className="w-6 h-6 text-brand-600" />
            </div>
        </div>
    );
};

export default StatsCard;
