import { BookOpen, Globe, Award, Package } from 'lucide-react';
import type { TabKey } from '../../../hooks/useCMSDashboard';

interface CMSTabsProps {
    activeTab: TabKey;
    setActiveTab: (key: TabKey) => void;
}

export const CMSTabs = ({ activeTab, setActiveTab }: CMSTabsProps) => {
    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'news', label: 'Berita', icon: BookOpen },
        { key: 'blocks', label: 'Content Blocks', icon: Globe },
        { key: 'affiliates', label: 'Affiliates', icon: Award },
        { key: 'products', label: 'Produk Bersertifikat', icon: Package },
    ];

    return (
        <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 px-4 font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                        activeTab === tab.key 
                        ? 'text-brand-600 border-b-2 border-brand-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
