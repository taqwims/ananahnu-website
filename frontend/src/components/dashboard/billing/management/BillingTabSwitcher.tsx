import { FileText, CreditCard } from 'lucide-react';
import type { TabType } from '../../../../hooks/useBillingManagement';

interface BillingTabSwitcherProps {
    activeTab: TabType;
    setActiveTab: (t: TabType) => void;
}

export const BillingTabSwitcher = ({ activeTab, setActiveTab }: BillingTabSwitcherProps) => {
    return (
        <div className="flex p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 w-fit">
            <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'invoices' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                    : 'text-gray-500 hover:bg-white/60'
                }`}
            >
                <FileText className="w-4 h-4" />
                Daftar Tagihan
            </button>
            <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'payments' 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                    : 'text-gray-500 hover:bg-white/60'
                }`}
            >
                <CreditCard className="w-4 h-4" />
                Konfirmasi Transaksi
            </button>
        </div>
    );
};
