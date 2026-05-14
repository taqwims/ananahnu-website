import { MapPin } from 'lucide-react';
import { useGeographyAdmin } from '../../hooks/useGeographyAdmin';
import { GeographyBreadcrumb } from '../../components/dashboard/geography/GeographyBreadcrumb';
import { ProvinceList } from '../../components/dashboard/geography/ProvinceList';
import { RegencyList } from '../../components/dashboard/geography/RegencyList';
import { DistrictList } from '../../components/dashboard/geography/DistrictList';
import { BillingRatesSection } from '../../components/dashboard/geography/BillingRatesSection';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function GeographyAdmin() {
    const {
        provinces, regencies, districts, rates,
        selectedProvince, setSelectedProvince,
        selectedRegency, setSelectedRegency,
        deselectRegency,
        showAddProvince, setShowAddProvince,
        showAddRegency, setShowAddRegency,
        showAddDistrict, setShowAddDistrict,
        showAddRate, setShowAddRate,
        newName, setNewName,
        rateForm, setRateForm,
        confirmModal, setConfirmModal,
        resetNavigation,
        addProvince, addRegency, addDistrict, addRate,
        deleteProvince, deleteRegency, deleteDistrict, deleteRate
    } = useGeographyAdmin();

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl">
                            <MapPin className="w-6 h-6 text-brand-600" />
                        </div>
                        Master Wilayah & Tarif
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Kelola data wilayah hierarkis dan tarif khusus per daerah</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Geography Navigation */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                        <GeographyBreadcrumb 
                            selectedProvince={selectedProvince}
                            selectedRegency={selectedRegency}
                            onReset={resetNavigation}
                            onBackToProvince={deselectRegency}
                        />

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                            {/* Province Level */}
                            {!selectedProvince && (
                                <ProvinceList 
                                    provinces={provinces}
                                    onSelect={setSelectedProvince}
                                    onDelete={deleteProvince}
                                    showAdd={showAddProvince}
                                    setShowAdd={setShowAddProvince}
                                    newName={newName}
                                    setNewName={setNewName}
                                    onAdd={addProvince}
                                />
                            )}

                            {/* Regency Level */}
                            {selectedProvince && !selectedRegency && (
                                <RegencyList 
                                    regencies={regencies}
                                    onSelect={setSelectedRegency}
                                    onDelete={deleteRegency}
                                    showAdd={showAddRegency}
                                    setShowAdd={setShowAddRegency}
                                    newName={newName}
                                    setNewName={setNewName}
                                    onAdd={addRegency}
                                />
                            )}

                            {/* District Level */}
                            {selectedRegency && (
                                <DistrictList 
                                    districts={districts}
                                    onDelete={deleteDistrict}
                                    showAdd={showAddDistrict}
                                    setShowAdd={setShowAddDistrict}
                                    newName={newName}
                                    setNewName={setNewName}
                                    onAdd={addDistrict}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Billing Rates */}
                <div className="lg:col-span-5">
                    <BillingRatesSection 
                        rates={rates}
                        selectedRegency={selectedRegency}
                        onDelete={deleteRate}
                        showAdd={showAddRate}
                        setShowAdd={setShowAddRate}
                        rateForm={rateForm}
                        setRateForm={setRateForm}
                        onAdd={addRate}
                    />
                </div>
            </div>
            
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}
