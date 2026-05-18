import { useState } from 'react';
import { 
    CheckCircle2,
    FileText,
    Bell,
    CreditCard,
    UserCheck,
    Calendar,
    Award,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { TemplateField } from '../../components/dashboard/notification/TemplateField';
import { NotificationHeader } from '../../components/dashboard/notification/NotificationHeader';
import { WhatsAppGatewayCard } from '../../components/dashboard/notification/WhatsAppGatewayCard';
import { NotificationGuide } from '../../components/dashboard/notification/NotificationGuide';

const NotificationSettings = () => {
    const { 
        settings, 
        loading, 
        isSaving, 
        fetchSettings, 
        updateSetting, 
        updateLocalSetting 
    } = useSystemSettings();

    const [showTokenModal, setShowTokenModal] = useState(false);
    const [pendingToken, setPendingToken] = useState('');

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin"></div>
                    <Bell className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-600 animate-pulse" />
                </div>
                <p className="text-gray-500 font-medium animate-pulse">Memuat pengaturan...</p>
            </div>
        );
    }

    return (
        <div className="p-6 w-full">
            <NotificationHeader onRefresh={fetchSettings} />

            <ConfirmModal
                isOpen={showTokenModal}
                onClose={() => setShowTokenModal(false)}
                onConfirm={() => {
                    updateSetting('fonnte_token', pendingToken);
                    setShowTokenModal(false);
                }}
                title="Perbarui API Token"
                message="Apakah Anda yakin ingin memperbarui API Token WhatsApp? Pastikan token baru sudah valid agar notifikasi tidak terhenti."
                confirmText="Ya, Perbarui"
                variant="warning"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Connectivity Settings */}
                <div className="lg:col-span-1 space-y-8">
                    <WhatsAppGatewayCard 
                        token={settings['fonnte_token'] || ''}
                        onTokenChange={(val) => updateLocalSetting('fonnte_token', val)}
                        onTokenUpdate={() => {
                            setPendingToken(settings['fonnte_token'] || '');
                            setShowTokenModal(true);
                        }}
                        isEnabled={settings['wa_notifications_enabled'] === 'true'}
                        onToggle={(val) => updateSetting('wa_notifications_enabled', val ? 'true' : 'false', true)}
                        isSaving={isSaving}
                    />

                    <NotificationGuide />
                </div>

                {/* Right Column: Templates Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h2 className="font-bold text-gray-900">Manajemen Template Notifikasi</h2>
                            </div>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                            <TemplateField 
                                label="Pengajuan Diterima"
                                icon={<CheckCircle2 className="w-4 h-4" />}
                                value={settings['template_submit'] || ''}
                                placeholder="Halo {{client_name}}, pengajuan {{business_name}} telah kami terima..."
                                onChange={(val) => updateLocalSetting('template_submit', val)}
                                onSave={() => updateSetting('template_submit', settings['template_submit'] || '')}
                                enableApp={settings['enable_app_submit'] === 'true'}
                                enableWA={settings['enable_wa_submit'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_submit', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_submit', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Submit Baru"
                                variables={['client_name', 'business_name', 'tracking_number']}
                            />

                            <TemplateField 
                                label="Tagihan Baru"
                                icon={<CreditCard className="w-4 h-4" />}
                                value={settings['template_payment_needed'] || ''}
                                placeholder="Halo {{client_name}}, pengajuan {{business_name}} menunggu pembayaran..."
                                onChange={(val) => updateLocalSetting('template_payment_needed', val)}
                                onSave={() => updateSetting('template_payment_needed', settings['template_payment_needed'] || '')}
                                enableApp={settings['enable_app_payment_needed'] === 'true'}
                                enableWA={settings['enable_wa_payment_needed'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_payment_needed', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_payment_needed', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Waiting Payment"
                                variables={['client_name', 'business_name']}
                            />

                            <TemplateField 
                                label="Pembayaran Berhasil"
                                icon={<CreditCard className="w-4 h-4" />}
                                value={settings['template_payment_success'] || ''}
                                placeholder="Halo {{client_name}}, pembayaran Rp {{amount}} telah kami terima..."
                                onChange={(val) => updateLocalSetting('template_payment_success', val)}
                                onSave={() => updateSetting('template_payment_success', settings['template_payment_success'] || '')}
                                enableApp={settings['enable_app_payment_success'] === 'true'}
                                enableWA={settings['enable_wa_payment_success'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_payment_success', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_payment_success', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Settlement/Verified"
                                variables={['client_name', 'business_name', 'amount']}
                            />

                            <TemplateField 
                                label="Pembayaran Ditolak"
                                icon={<CreditCard className="w-4 h-4" />}
                                value={settings['template_payment_rejected'] || ''}
                                placeholder="Halo {{client_name}}, pembayaran Rp {{amount}} ditolak..."
                                onChange={(val) => updateLocalSetting('template_payment_rejected', val)}
                                onSave={() => updateSetting('template_payment_rejected', settings['template_payment_rejected'] || '')}
                                enableApp={settings['enable_app_payment_rejected'] === 'true'}
                                enableWA={settings['enable_wa_payment_rejected'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_payment_rejected', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_payment_rejected', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Verification Failed"
                                variables={['client_name', 'business_name', 'amount']}
                            />

                            <TemplateField 
                                label="Penugasan Drafter"
                                icon={<UserCheck className="w-4 h-4" />}
                                value={settings['template_drafter_assigned'] || ''}
                                placeholder="Halo {{drafter_name}}, Anda ditugaskan untuk {{business_name}}..."
                                onChange={(val) => updateLocalSetting('template_drafter_assigned', val)}
                                onSave={() => updateSetting('template_drafter_assigned', settings['template_drafter_assigned'] || '')}
                                enableApp={settings['enable_app_drafter_assigned'] === 'true'}
                                enableWA={settings['enable_wa_drafter_assigned'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_drafter_assigned', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_drafter_assigned', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Internal • Drafter"
                                variables={['drafter_name', 'business_name']}
                            />

                            <TemplateField 
                                label="Penugasan Advisor"
                                icon={<ShieldCheck className="w-4 h-4" />}
                                value={settings['template_consultant_assigned'] || ''}
                                placeholder="Halo {{consultant_name}}, Anda ditunjuk untuk {{business_name}}..."
                                onChange={(val) => updateLocalSetting('template_consultant_assigned', val)}
                                onSave={() => updateSetting('template_consultant_assigned', settings['template_consultant_assigned'] || '')}
                                enableApp={settings['enable_app_consultant_assigned'] === 'true'}
                                enableWA={settings['enable_wa_consultant_assigned'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_consultant_assigned', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_consultant_assigned', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Internal • Pendamping"
                                variables={['consultant_name', 'business_name']}
                            />

                            <TemplateField 
                                label="Jadwal Audit (Klien)"
                                icon={<Calendar className="w-4 h-4" />}
                                value={settings['template_audit_scheduled_client'] || ''}
                                placeholder="Jadwal audit untuk {{business_name}} pada {{date}}..."
                                onChange={(val) => updateLocalSetting('template_audit_scheduled_client', val)}
                                onSave={() => updateSetting('template_audit_scheduled_client', settings['template_audit_scheduled_client'] || '')}
                                enableApp={settings['enable_app_audit_scheduled_client'] === 'true'}
                                enableWA={settings['enable_wa_audit_scheduled_client'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_audit_scheduled_client', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_audit_scheduled_client', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Penetapan Jadwal"
                                variables={['client_name', 'business_name', 'date']}
                            />

                            <TemplateField 
                                label="Jadwal Audit (Internal)"
                                icon={<Calendar className="w-4 h-4" />}
                                value={settings['template_audit_scheduled_internal'] || ''}
                                placeholder="Jadwal audit pengajuan {{business_name}} pada {{date}}..."
                                onChange={(val) => updateLocalSetting('template_audit_scheduled_internal', val)}
                                onSave={() => updateSetting('template_audit_scheduled_internal', settings['template_audit_scheduled_internal'] || '')}
                                enableApp={settings['enable_app_audit_scheduled_internal'] === 'true'}
                                enableWA={settings['enable_wa_audit_scheduled_internal'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_audit_scheduled_internal', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_audit_scheduled_internal', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Drafter/Advisor • Penetapan Jadwal"
                                variables={['business_name', 'date']}
                            />

                            <TemplateField 
                                label="SH Terbit (Klien)"
                                icon={<Award className="w-4 h-4" />}
                                value={settings['template_sh_terbit_client'] || ''}
                                placeholder="Selamat! Sertifikat Halal {{business_name}} telah terbit..."
                                onChange={(val) => updateLocalSetting('template_sh_terbit_client', val)}
                                onSave={() => updateSetting('template_sh_terbit_client', settings['template_sh_terbit_client'] || '')}
                                enableApp={settings['enable_app_sh_terbit_client'] === 'true'}
                                enableWA={settings['enable_wa_sh_terbit_client'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_sh_terbit_client', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_sh_terbit_client', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Done"
                                variables={['client_name', 'business_name', 'tracking_number']}
                            />

                            <TemplateField 
                                label="SH Terbit (Internal)"
                                icon={<Award className="w-4 h-4" />}
                                value={settings['template_sh_terbit_internal'] || ''}
                                placeholder="SH untuk {{business_name}} telah terbit..."
                                onChange={(val) => updateLocalSetting('template_sh_terbit_internal', val)}
                                onSave={() => updateSetting('template_sh_terbit_internal', settings['template_sh_terbit_internal'] || '')}
                                enableApp={settings['enable_app_sh_terbit_internal'] === 'true'}
                                enableWA={settings['enable_wa_sh_terbit_internal'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_sh_terbit_internal', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_sh_terbit_internal', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Advisor/Fasilitator • Done"
                                variables={['consultant_name', 'business_name']}
                            />

                            <TemplateField 
                                label="Catatan Revisi (Klien)"
                                icon={<RefreshCw className="w-4 h-4" />}
                                value={settings['template_revision_client'] || ''}
                                placeholder="Halo {{client_name}}, pengajuan {{business_name}} memerlukan revisi: {{note}}"
                                onChange={(val) => updateLocalSetting('template_revision_client', val)}
                                onSave={() => updateSetting('template_revision_client', settings['template_revision_client'] || '')}
                                enableApp={settings['enable_app_revision_client'] === 'true'}
                                enableWA={settings['enable_wa_revision_client'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_revision_client', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_revision_client', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Klien • Feedback"
                                variables={['client_name', 'business_name', 'note']}
                            />

                            <TemplateField 
                                label="Catatan Revisi (Internal)"
                                icon={<RefreshCw className="w-4 h-4" />}
                                value={settings['template_revision_internal'] || ''}
                                placeholder="Halo {{drafter_name}}, {{business_name}} dikembalikan: {{note}}"
                                onChange={(val) => updateLocalSetting('template_revision_internal', val)}
                                onSave={() => updateSetting('template_revision_internal', settings['template_revision_internal'] || '')}
                                enableApp={settings['enable_app_revision_internal'] === 'true'}
                                enableWA={settings['enable_wa_revision_internal'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_revision_internal', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_revision_internal', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Drafter/Advisor • Feedback"
                                variables={['drafter_name', 'business_name', 'note']}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
