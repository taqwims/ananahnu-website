import { Filter, Search } from 'lucide-react';
import type { TabType } from '../../../../hooks/useBillingManagement';

interface BillingFilterBarProps {
    activeTab: TabType;
    invFilterStatus: string;
    setInvFilterStatus: (s: string) => void;
    invFilterService: string;
    setInvFilterService: (s: string) => void;
    payFilterStatus: string;
    setPayFilterStatus: (s: string) => void;
    payFilterMethod: string;
    setPayFilterMethod: (s: string) => void;
    onResetPage: () => void;
}

export const BillingFilterBar = ({
    activeTab,
    invFilterStatus,
    setInvFilterStatus,
    invFilterService,
    setInvFilterService,
    payFilterStatus,
    setPayFilterStatus,
    payFilterMethod,
    setPayFilterMethod,
    onResetPage
}: BillingFilterBarProps) => {
    return (
        <div className="glass-panel p-4 flex flex-wrap items-center gap-4 border-white/40 shadow-xl shadow-brand-900/5">
            <div className="flex items-center gap-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
            </div>
            
            {activeTab === 'invoices' ? (
                <>
                    <select 
                        className="glass-input text-xs font-bold w-48 !py-2"
                        value={invFilterStatus}
                        onChange={e => { setInvFilterStatus(e.target.value); onResetPage(); }}
                    >
                        <option value="">Semua Status</option>
                        <option value="UNPAID">Belum Lunas</option>
                        <option value="PAID">Lunas</option>
                    </select>
                    <select 
                        className="glass-input text-xs font-bold w-48 !py-2"
                        value={invFilterService}
                        onChange={e => { setInvFilterService(e.target.value); onResetPage(); }}
                    >
                        <option value="">Semua Layanan</option>
                        <option value="REGULER">Reguler</option>
                        <option value="SELF_DECLARE">Self Declare</option>
                    </select>
                </>
            ) : (
                <>
                    <select 
                        className="glass-input text-xs font-bold w-48 !py-2"
                        value={payFilterStatus}
                        onChange={e => { setPayFilterStatus(e.target.value); onResetPage(); }}
                    >
                        <option value="">Semua Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="FAILED">Failed</option>
                    </select>
                    <select 
                        className="glass-input text-xs font-bold w-48 !py-2"
                        value={payFilterMethod}
                        onChange={e => { setPayFilterMethod(e.target.value); onResetPage(); }}
                    >
                        <option value="">Semua Metode</option>
                        <option value="MANUAL">Manual Transfer</option>
                        <option value="MIDTRANS">Midtrans Online</option>
                    </select>
                </>
            )}

            <div className="ml-auto relative hidden sm:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Cari ID atau Klien..." 
                    className="glass-input !pl-9 !py-2 text-xs w-64"
                />
            </div>
        </div>
    );
};
