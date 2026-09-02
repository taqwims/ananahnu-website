import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Sliders,
    Bell,
    Key,
    Layers,
    Building2,
    Clock,
    Palette,
    Headphones
} from 'lucide-react';
import { ContactSettingsTab } from '../../components/operational/settings/ContactSettingsTab';
import { GeneralSettingsTab } from '../../components/operational/settings/GeneralSettingsTab';
import { AppearanceSettingsTab } from '../../components/operational/settings/AppearanceSettingsTab';
import { SecuritySettingsTab } from '../../components/operational/settings/SecuritySettingsTab';
import { QuotaSettingsTab } from '../../components/operational/settings/QuotaSettingsTab';
import { LphSettingsTab } from '../../components/operational/settings/LphSettingsTab';
import { SlaSettingsTab } from '../../components/operational/settings/SlaSettingsTab';
import { NotificationSettingsTab } from '../../components/operational/settings/NotificationSettingsTab';

export default function OperationalSettings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as any) || 'contacts';

    const [activeTab, setActiveTab] = useState<'contacts' | 'general' | 'appearance' | 'security' | 'quota' | 'lph' | 'sla' | 'notifications'>(
        ['contacts', 'general', 'appearance', 'security', 'quota', 'lph', 'sla', 'notifications'].includes(initialTab)
            ? initialTab
            : 'contacts'
    );

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    useEffect(() => {
        const tabParam = searchParams.get('tab') as typeof activeTab;
        if (tabParam && ['contacts', 'general', 'appearance', 'security', 'quota', 'lph', 'sla', 'notifications'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header Title */}
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                    <span>Home</span>
                    <span>/</span>
                    <span className="text-gray-800 font-bold">Pengaturan</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900">Pengaturan Sistem &amp; Operasional</h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Kelola kontak WhatsApp CS, profil perusahaan, target SLA, alokasi kuota fasilitasi, kemitraan LPH, dan integrasi WhatsApp.
                </p>
            </div>

            {/* Main Tabs Navigation Bar */}
            <div className="flex border-b border-gray-200 text-xs font-bold overflow-x-auto gap-1">
                <button
                    onClick={() => handleTabChange('contacts')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'contacts'
                            ? 'border-brand-700 text-brand-700 font-black'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Headphones className="w-4 h-4" /> Kontak &amp; CS WhatsApp
                </button>

                <button
                    onClick={() => handleTabChange('general')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'general'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Sliders className="w-4 h-4" /> Umum &amp; Profil
                </button>

                <button
                    onClick={() => handleTabChange('appearance')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'appearance'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Palette className="w-4 h-4" /> Tampilan &amp; Tema
                </button>

                <button
                    onClick={() => handleTabChange('quota')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'quota'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Layers className="w-4 h-4" /> Kuota Fasilitasi (SEHATI)
                </button>

                <button
                    onClick={() => handleTabChange('lph')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'lph'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Building2 className="w-4 h-4" /> Pengaturan LPH &amp; Auditor
                </button>

                <button
                    onClick={() => handleTabChange('sla')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'sla'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Clock className="w-4 h-4" /> Target SLA &amp; Workflow
                </button>

                <button
                    onClick={() => handleTabChange('notifications')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'notifications'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Bell className="w-4 h-4" /> WhatsApp Gateway
                </button>

                <button
                    onClick={() => handleTabChange('security')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'security'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Key className="w-4 h-4" /> Keamanan &amp; Hak Akses
                </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
                {activeTab === 'contacts' && <ContactSettingsTab />}
                {activeTab === 'general' && <GeneralSettingsTab />}
                {activeTab === 'appearance' && <AppearanceSettingsTab />}
                {activeTab === 'quota' && <QuotaSettingsTab />}
                {activeTab === 'lph' && <LphSettingsTab />}
                {activeTab === 'sla' && <SlaSettingsTab />}
                {activeTab === 'notifications' && <NotificationSettingsTab />}
                {activeTab === 'security' && <SecuritySettingsTab />}
            </div>
        </div>
    );
}
