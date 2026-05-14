import { UsersRound, Briefcase, FileText } from 'lucide-react';
import type { TabKey } from '../../../hooks/useCoordinatorDashboard';

interface DashboardTabsProps {
    activeTab: TabKey;
    onTabChange: (key: TabKey) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'team', label: 'Anggota Tim', icon: UsersRound },
        { key: 'clients', label: 'Klien Tim', icon: Briefcase },
        { key: 'submissions', label: 'Pengajuan Tim', icon: FileText },
    ];

    return (
        <div className="flex gap-4 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`pb-2 px-6 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
                        activeTab === tab.key 
                        ? 'text-brand-600 border-b-2 border-brand-600 scale-105' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
