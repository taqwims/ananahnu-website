import { ChevronLeft, Loader2 } from 'lucide-react';
import { useSubmissionCreate } from '../../hooks/useSubmissionCreate';
import { VerificationAlert } from '../../components/dashboard/submission/create/VerificationAlert';
import { ClientInfoForm } from '../../components/dashboard/submission/create/ClientInfoForm';
import { SubmissionConfigForm } from '../../components/dashboard/submission/create/SubmissionConfigForm';
import { SubmissionActions } from '../../components/dashboard/submission/create/SubmissionActions';

export default function SubmissionCreate() {
    const {
        clientData, setClientData,
        configs,
        fieldValues, setFieldValues,
        loading,
        saving,
        uploading,
        isVerified,
        verStatus,
        handleFileUpload,
        handleSave,
        navigate
    } = useSubmissionCreate();

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Buat Pengajuan Baru</h1>
                    <p className="text-sm text-gray-500">Lengkapi data klien dan dokumen persyaratan</p>
                </div>
            </div>

            <VerificationAlert 
                isVerified={isVerified}
                verStatus={verStatus}
                onNavigateProfile={() => navigate('/dashboard/consultant-profile')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <ClientInfoForm 
                        clientData={clientData}
                        setClientData={setClientData}
                    />

                    <SubmissionConfigForm 
                        configs={configs}
                        fieldValues={fieldValues}
                        setFieldValues={setFieldValues}
                        uploading={uploading}
                        onFileUpload={handleFileUpload}
                    />
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
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
