import { Loader2 } from 'lucide-react';
import { useBillingManagement } from '../../hooks/useBillingManagement';
import { BillingStatsHeader } from '../../components/dashboard/billing/management/BillingStatsHeader';
import { BillingTabSwitcher } from '../../components/dashboard/billing/management/BillingTabSwitcher';
import { BillingFilterBar } from '../../components/dashboard/billing/management/BillingFilterBar';
import { InvoiceTable } from '../../components/dashboard/billing/management/InvoiceTable';
import { PaymentTable } from '../../components/dashboard/billing/management/PaymentTable';
import { BillingPagination } from '../../components/dashboard/billing/management/BillingPagination';
import { motion, AnimatePresence } from 'framer-motion';

export default function BillingManagement() {
    const {
        activeTab,
        setActiveTab,
        loading,
        invoices,
        invTotal,
        invPage,
        setInvPage,
        invFilterStatus,
        setInvFilterStatus,
        invFilterService,
        setInvFilterService,
        payments,
        payTotal,
        payPage,
        setPayPage,
        payFilterStatus,
        setPayFilterStatus,
        payFilterMethod,
        setPayFilterMethod,
        verifying,
        markPaid,
        verifyPayment,
        syncPayment,
        stats
    } = useBillingManagement();

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6 pb-12">
            <BillingStatsHeader stats={stats} />

            <BillingTabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    <BillingFilterBar
                        activeTab={activeTab}
                        invFilterStatus={invFilterStatus}
                        setInvFilterStatus={setInvFilterStatus}
                        invFilterService={invFilterService}
                        setInvFilterService={setInvFilterService}
                        payFilterStatus={payFilterStatus}
                        setPayFilterStatus={setPayFilterStatus}
                        payFilterMethod={payFilterMethod}
                        setPayFilterMethod={setPayFilterMethod}
                        onResetPage={() => activeTab === 'invoices' ? setInvPage(1) : setPayPage(1)}
                    />

                    <div className="glass-panel overflow-hidden border-white/40 shadow-2xl shadow-brand-900/5">
                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Memuat Data...</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'invoices' ? (
                                    <InvoiceTable invoices={invoices} onMarkPaid={markPaid} />
                                ) : (
                                    <PaymentTable 
                                        payments={payments} 
                                        onVerify={verifyPayment} 
                                        onSync={syncPayment} 
                                        verifying={verifying} 
                                    />
                                )}

                                <BillingPagination
                                    count={activeTab === 'invoices' ? invoices.length : payments.length}
                                    total={activeTab === 'invoices' ? invTotal : payTotal}
                                    page={activeTab === 'invoices' ? invPage : payPage}
                                    setPage={activeTab === 'invoices' ? setInvPage : setPayPage}
                                />
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
