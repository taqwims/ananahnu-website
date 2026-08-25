import { useState } from 'react';
import {
    Sliders,
    Bell,
    Key,
    Layers,
    Building2,
    Clock,
    Palette
} from 'lucide-react';
import { GeneralSettingsTab } from '../../components/operational/settings/GeneralSettingsTab';
import { AppearanceSettingsTab } from '../../components/operational/settings/AppearanceSettingsTab';
import { SecuritySettingsTab } from '../../components/operational/settings/SecuritySettingsTab';
import { QuotaSettingsTab } from '../../components/operational/settings/QuotaSettingsTab';
import { LphSettingsTab } from '../../components/operational/settings/LphSettingsTab';
import { SlaSettingsTab } from '../../components/operational/settings/SlaSettingsTab';
import { NotificationSettingsTab } from '../../components/operational/settings/NotificationSettingsTab';

export default function OperationalSettings() {
    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'security' | 'quota' | 'lph' | 'sla' | 'notifications'>('general');

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
                    Kelola preferensi antarmuka, target SLA, alokasi kuota fasilitasi, kemitraan LPH, keamanan, dan integrasi WhatsApp.
                </p>
            </div>

            {/* Main Tabs Navigation Bar */}
            <div className="flex border-b border-gray-200 text-xs font-bold overflow-x-auto gap-1">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'general'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Sliders className="w-4 h-4" /> Umum &amp; Profil
                </button>

                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'appearance'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Palette className="w-4 h-4" /> Tampilan &amp; Tema
                </button>

                <button
                    onClick={() => setActiveTab('quota')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'quota'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Layers className="w-4 h-4" /> Kuota Fasilitasi (SEHATI)
                </button>

                <button
                    onClick={() => setActiveTab('lph')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'lph'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Building2 className="w-4 h-4" /> Pengaturan LPH &amp; Auditor
                </button>

                <button
                    onClick={() => setActiveTab('sla')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'sla'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Clock className="w-4 h-4" /> Target SLA &amp; Workflow
                </button>

                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === 'notifications'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Bell className="w-4 h-4" /> WhatsApp &amp; Notifikasi
                </button>

                <button
                    onClick={() => setActiveTab('security')}
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
