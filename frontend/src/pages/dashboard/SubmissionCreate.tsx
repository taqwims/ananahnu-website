import { ChevronLeft, Loader2 } from 'lucide-react';
import { useSubmissionCreate } from '../../hooks/useSubmissionCreate';
import { VerificationAlert } from '../../components/dashboard/submission/create/VerificationAlert';
import { ClientInfoForm } from '../../components/dashboard/submission/create/ClientInfoForm';
import { SubmissionLiveCalculator } from '../../components/dashboard/submission/create/SubmissionLiveCalculator';
import { SubmissionActions } from '../../components/dashboard/submission/create/SubmissionActions';

export default function SubmissionCreate() {
    const {
        clientData, setClientData,
        loading,
        saving,
        isVerified,
        verStatus,
        handleSave,
        businessTypes,
        productCategories,
        businessScales,
        provinces,
        regencies,
        districts,
        navigate
    } = useSubmissionCreate();

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Buat Pengajuan Baru</h1>
                    <p className="text-sm text-gray-500">Lengkapi data klien dan kalkulasi biaya</p>
                </div>
            </div>

            <VerificationAlert 
                isVerified={isVerified}
                verStatus={verStatus}
                onNavigateProfile={() => navigate('/dashboard/consultant-profile')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <ClientInfoForm 
                        clientData={clientData}
                        setClientData={setClientData}
                        businessTypes={businessTypes}
                        productCategories={productCategories}
                        businessScales={businessScales}
                        provinces={provinces}
                        regencies={regencies}
                        districts={districts}
                    />

                    <div className="block lg:hidden space-y-6">
                        <SubmissionLiveCalculator clientData={clientData} setClientData={setClientData} />
                        <SubmissionActions 
                            onSave={handleSave}
                            saving={saving}
                            isVerified={isVerified}
                        />
                    </div>
                </div>

                {/* Sidebar Actions & Live Calculator */}
                <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-6">
                    <SubmissionLiveCalculator clientData={clientData} setClientData={setClientData} />
                    <SubmissionActions 
                        onSave={handleSave}
                        saving={saving}
                        isVerified={isVerified}
                    />
                </div>
            </div>
        </div>
    );
}
