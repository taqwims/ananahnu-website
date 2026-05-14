import { formatServiceType } from '../../../utils/format';

const FORM_TYPES = ['SELF_DECLARE', 'SELF_DECLARE_MANDIRI', 'REGULER', 'RECRUITMENT'] as const;

interface FormConfigTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const FormConfigTabs = ({ activeTab, onTabChange }: FormConfigTabsProps) => {
    return (
        <div className="flex gap-2 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar">
            {FORM_TYPES.map(type => (
                <button
                    key={type}
                    onClick={() => onTabChange(type)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTab === type
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 scale-105'
                            : 'bg-white/80 text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-100'
                    }`}
                >
                    {formatServiceType(type)}
                </button>
            ))}
        </div>
    );
};
