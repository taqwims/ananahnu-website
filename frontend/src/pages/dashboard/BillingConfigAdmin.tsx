import { Loader2, DollarSign } from 'lucide-react';
import { useBillingConfig } from '../../hooks/useBillingConfig';
import { BillingTabs } from '../../components/dashboard/billing/BillingTabs';
import { GlobalSettingsPanel } from '../../components/dashboard/billing/GlobalSettingsPanel';
import { BillingComponentForm } from '../../components/dashboard/billing/BillingComponentForm';
import { BillingComponentTable } from '../../components/dashboard/billing/BillingComponentTable';
import { MasterDataManagement } from '../../components/dashboard/billing/MasterDataManagement';

export default function BillingConfigAdmin() {
    const {
        loading,
        activeMainTab,
        setActiveMainTab,
        activeTab,
        setActiveTab,
        products,
        scales,
        provinces,
        regencies,
        districts,
        components,
        schemes,
        businessTypes,
        systemSettings,
        setSystemSettings,
        editingId,
        formData,
        setFormData,
        handleSave,
        handleDelete,
        handleEdit,
        resetForm,
        handleUpdateSystemSetting
    } = useBillingConfig();

    if (loading) {
        return (
            <div className="p-8 flex justify-center h-[60vh] items-center">
                <Loader2 className="animate-spin text-brand-600 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl">
                            <DollarSign className="w-6 h-6 text-brand-600" />
                        </div>
                        Master Biaya &amp; Klasifikasi
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Atur skema harga, komponen biaya, dan klasifikasi produk dengan mudah</p>
                </div>
            </div>

            <BillingTabs
                activeMainTab={activeMainTab}
                setActiveMainTab={setActiveMainTab}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Content Areas */}
            {activeMainTab === 'settings' && (
                <GlobalSettingsPanel
                    systemSettings={systemSettings}
                    setSystemSettings={setSystemSettings}
                    onUpdate={handleUpdateSystemSetting}
                />
            )}

            {activeMainTab === 'components' && (
                <div className="space-y-6">
                    <BillingComponentForm
                        formData={formData}
                        setFormData={setFormData}
                        editingId={editingId}
                        onSave={handleSave}
                        onReset={resetForm}
                        provinces={provinces}
                        regencies={regencies}
                        districts={districts}
                        businessTypes={businessTypes}
                        products={products}
                        schemes={schemes}
                        scales={scales}
                    />
                    <BillingComponentTable
                        components={components}
                        onEdit={handleEdit}
                        onDelete={(id) => handleDelete('/billing-config/components', id)}
                        provinces={provinces}
                        businessTypes={businessTypes}
                        products={products}
                        schemes={schemes}
                        scales={scales}
                    />
                </div>
            )}

            {activeMainTab === 'master_data' && (
                <MasterDataManagement
                    activeTab={activeTab}
                    formData={formData}
                    setFormData={setFormData}
                    editingId={editingId}
                    onSave={handleSave}
                    onReset={resetForm}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    businessTypes={businessTypes}
                    products={products}
                    scales={scales}
                    schemes={schemes}
                />
            )}
        </div>
    );
}
