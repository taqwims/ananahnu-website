import { Plus, Tag } from 'lucide-react';
import type { MainTab, TabKey } from '../../../hooks/useBillingConfig';

interface BillingTabsProps {
    activeMainTab: MainTab;
    setActiveMainTab: (t: MainTab) => void;
    activeTab: TabKey;
    setActiveTab: (t: TabKey) => void;
}

export const BillingTabs = ({
    activeMainTab,
    setActiveMainTab,
    activeTab,
    setActiveTab
}: BillingTabsProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'components', label: 'Komponen Biaya Reguler', icon: Plus },
                    { key: 'scheme_prices', label: 'Tarif Skema Penjualan', icon: Tag },
                    { key: 'self_declare', label: 'Tarif Self Declare Mandiri', icon: Tag },
                    { key: 'facilitation', label: 'Tarif SH Fasilitasi', icon: Tag },
                    { key: 'master_data', label: 'Klasifikasi & Master', icon: Tag },
                    { key: 'settings', label: 'Identitas Perusahaan', icon: Tag },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveMainTab(tab.key as MainTab);
                            if (tab.key === 'master_data') setActiveTab('business_types');
                            else setActiveTab('components');
                        }}
                        className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
                            activeMainTab === tab.key ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeMainTab === 'master_data' && (
                <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl w-full xl:w-auto">
                    {[
                        { key: 'business_types', label: 'Bidang' },
                        { key: 'products', label: 'Produk' },
                        { key: 'scales', label: 'Skala Usaha' },
                        { key: 'schemes', label: 'Skema' },
                    ].map(sub => (
                        <button
                            key={sub.key}
                            onClick={() => setActiveTab(sub.key as TabKey)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 xl:flex-none text-center ${
                                activeTab === sub.key ? 'bg-white text-brand-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
