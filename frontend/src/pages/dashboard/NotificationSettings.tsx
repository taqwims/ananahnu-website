import { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    ShieldCheck, 
    CheckCircle2,
    Settings,
    FileText,
    Bell,
    Smartphone,
    CreditCard,
    UserCheck,
    Calendar,
    Award,
    RefreshCw,
    Save
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal';

const NotificationSettings = () => {
    const [settings, setSettings] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [pendingToken, setPendingToken] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/system-settings');
            setSettings(response.data || {});
        } catch (err: any) {
            toast.error('Gagal mengambil pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: string, value: string, silent = false) => {
        try {
            setIsSaving(true);
            await api.put('/system-settings', { key, value });
            setSettings(prev => ({ ...prev, [key]: value }));
            if (!silent) toast.success('Pengaturan berhasil diperbarui');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

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
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-700 p-8 rounded-2xl text-white shadow-lg shadow-brand-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                        <Bell className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Pusat Notifikasi</h1>
                        <p className="text-brand-100 opacity-90">Konfigurasi saluran pengiriman dan template pesan sistem</p>
                    </div>
                </div>
                <button 
                    onClick={fetchSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                </button>
            </div>

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
                    {/* Fonnte Integration Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-900">WhatsApp Gateway</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Fonnte API Token
                                    </label>
                                    <div className="relative group/input">
                                        <input
                                            type="password"
                                            value={settings['fonnte_token'] || ''}
                                            onChange={(e) => setSettings(prev => ({ ...prev, fonnte_token: e.target.value }))}
                                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white outline-none transition-all font-mono text-sm"
                                            placeholder="token-api-fonnte"
                                        />
                                        <button
                                            onClick={() => {
                                                setPendingToken(settings['fonnte_token'] || '');
                                                setShowTokenModal(true);
                                            }}
                                            disabled={isSaving}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Update Token"
                                        >
                                            <Save className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-400">
                                        Hubungkan akun Anda di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-brand-600 font-bold hover:underline">Fonnte.com</a>
                                    </p>
                                </div>

                                <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-brand-600" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Status Global</p>
                                                <p className="text-[10px] text-gray-500 font-medium">WhatsApp Notifications</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={settings['wa_notifications_enabled'] === 'true'}
                                                onChange={(e) => updateSetting('wa_notifications_enabled', e.target.checked ? 'true' : 'false', true)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Guide Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Settings className="w-5 h-5 text-brand-400" />
                            </div>
                            <h3 className="font-bold">Panduan Singkat</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">1</div>
                                <div>
                                    <p className="text-xs text-white font-bold mb-1">Kontrol Saluran (App & WA)</p>
                                    <p className="text-[10px] text-gray-300 leading-relaxed">Gunakan tombol <b>App</b> untuk notifikasi di dashboard sistem, dan <b>WA</b> untuk pengiriman pesan WhatsApp langsung ke user.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">2</div>
                                <div>
                                    <p className="text-xs text-white font-bold mb-1">Variabel Dinamis</p>
                                    <p className="text-[10px] text-gray-300 leading-relaxed">Masukkan kode <code>{"{{variabel}}"}</code> untuk data otomatis. Klik/hover label variabel di bawah kotak teks untuk melihat opsi yang tersedia.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">3</div>
                                <div>
                                    <p className="text-xs text-white font-bold mb-1">Status Gateway</p>
                                    <p className="text-[10px] text-gray-300 leading-relaxed">Pastikan <b>Status Global</b> aktif agar pengiriman WA berfungsi. Jika OFF, semua notifikasi WA akan tertahan meskipun tombol WA di template aktif.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
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
                                onChange={(val) => setSettings(prev => ({ ...prev, template_submit: val }))}
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
                                label="Pembayaran Berhasil"
                                icon={<CreditCard className="w-4 h-4" />}
                                value={settings['template_payment_success'] || ''}
                                placeholder="Halo {{client_name}}, pembayaran Rp {{amount}} telah kami terima..."
                                onChange={(val) => setSettings(prev => ({ ...prev, template_payment_success: val }))}
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
                                label="Penugasan Drafter"
                                icon={<UserCheck className="w-4 h-4" />}
                                value={settings['template_drafter_assigned'] || ''}
                                placeholder="Halo {{drafter_name}}, Anda ditugaskan untuk {{business_name}}..."
                                onChange={(val) => setSettings(prev => ({ ...prev, template_drafter_assigned: val }))}
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
                                label="Penugasan Konsultan"
                                icon={<ShieldCheck className="w-4 h-4" />}
                                value={settings['template_consultant_assigned'] || ''}
                                placeholder="Halo {{consultant_name}}, Anda ditunjuk untuk {{business_name}}..."
                                onChange={(val) => setSettings(prev => ({ ...prev, template_consultant_assigned: val }))}
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
                                onChange={(val) => setSettings(prev => ({ ...prev, template_audit_scheduled_client: val }))}
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
                                onChange={(val) => setSettings(prev => ({ ...prev, template_audit_scheduled_internal: val }))}
                                onSave={() => updateSetting('template_audit_scheduled_internal', settings['template_audit_scheduled_internal'] || '')}
                                enableApp={settings['enable_app_audit_scheduled_internal'] === 'true'}
                                enableWA={settings['enable_wa_audit_scheduled_internal'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_audit_scheduled_internal', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_audit_scheduled_internal', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Drafter/Konsultan • Penetapan Jadwal"
                                variables={['business_name', 'date']}
                            />

                            <TemplateField 
                                label="SH Terbit (Klien)"
                                icon={<Award className="w-4 h-4" />}
                                value={settings['template_sh_terbit_client'] || ''}
                                placeholder="Selamat! Sertifikat Halal {{business_name}} telah terbit..."
                                onChange={(val) => setSettings(prev => ({ ...prev, template_sh_terbit_client: val }))}
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
                                onChange={(val) => setSettings(prev => ({ ...prev, template_sh_terbit_internal: val }))}
                                onSave={() => updateSetting('template_sh_terbit_internal', settings['template_sh_terbit_internal'] || '')}
                                enableApp={settings['enable_app_sh_terbit_internal'] === 'true'}
                                enableWA={settings['enable_wa_sh_terbit_internal'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_sh_terbit_internal', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_sh_terbit_internal', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Konsultan/Fasilitator • Done"
                                variables={['consultant_name', 'business_name']}
                            />

                            <TemplateField 
                                label="Catatan Revisi (Klien)"
                                icon={<RefreshCw className="w-4 h-4" />}
                                value={settings['template_revision_client'] || ''}
                                placeholder="Halo {{client_name}}, pengajuan {{business_name}} memerlukan revisi: {{note}}"
                                onChange={(val) => setSettings(prev => ({ ...prev, template_revision_client: val }))}
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
                                onChange={(val) => setSettings(prev => ({ ...prev, template_revision_internal: val }))}
                                onSave={() => updateSetting('template_revision_internal', settings['template_revision_internal'] || '')}
                                enableApp={settings['enable_app_revision_internal'] === 'true'}
                                enableWA={settings['enable_wa_revision_internal'] === 'true'}
                                onToggleApp={(val) => updateSetting('enable_app_revision_internal', val ? 'true' : 'false')}
                                onToggleWA={(val) => updateSetting('enable_wa_revision_internal', val ? 'true' : 'false')}
                                disabled={isSaving}
                                hint="Drafter/Konsultan • Feedback"
                                variables={['drafter_name', 'business_name', 'note']}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TemplateFieldProps {
    label: string;
    icon?: React.ReactNode;
    value: string;
    placeholder: string;
    onChange: (val: string) => void;
    onSave: () => void;
    enableApp: boolean;
    enableWA: boolean;
    onToggleApp: (val: boolean) => void;
    onToggleWA: (val: boolean) => void;
    disabled: boolean;
    hint: string;
    variables?: string[];
}

const TemplateField = ({ 
    label, icon, value, placeholder, onChange, onSave, 
    enableApp, enableWA, onToggleApp, onToggleWA,
    disabled, hint, variables = [] 
}: TemplateFieldProps) => (
    <div className="space-y-4 group/field">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover/field:bg-brand-50 group-hover/field:text-brand-600 transition-colors">
                    {icon}
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-800 block leading-tight">{label}</label>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{hint}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <ChannelToggle 
                    label="App" 
                    icon={<Smartphone className="w-3 h-3" />} 
                    checked={enableApp} 
                    onChange={(val) => onToggleApp(val)} 
                />
                <ChannelToggle 
                    label="WA" 
                    icon={<MessageSquare className="w-3 h-3" />} 
                    checked={enableWA} 
                    onChange={(val) => onToggleWA(val)} 
                />
                <button
                    onClick={onSave}
                    disabled={disabled}
                    className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-100 transition-all disabled:opacity-50"
                    title="Simpan Template"
                >
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>

        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white outline-none transition-all text-sm resize-none shadow-inner"
            />
            {variables.length > 0 && (
                <div className="absolute bottom-3 right-4 flex gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                    {variables.map(v => (
                        <span key={v} className="text-[9px] font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                            {`{{${v}}}`}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const ChannelToggle = ({ label, icon, checked, onChange }: { label: string, icon: React.ReactNode, checked: boolean, onChange: (val: boolean) => void }) => (
    <button 
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all ${
            checked 
            ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' 
            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
        }`}
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
        <div className={`w-2 h-2 rounded-full ${checked ? 'bg-brand-600 animate-pulse' : 'bg-gray-200'}`} />
    </button>
);

export default NotificationSettings;
