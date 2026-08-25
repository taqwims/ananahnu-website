import { useState, useEffect } from 'react';
import {
    Save,
    Send,
    Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';

export function NotificationSettingsTab() {
    const [fonnteToken, setFonnteToken] = useState('');
    const [waEnabled, setWaEnabled] = useState(true);
    const [testWaPhone, setTestWaPhone] = useState('081234567890');
    const [testWaMessage, setTestWaMessage] = useState(
        'Halo! Ini adalah pesan pengujian notifikasi WhatsApp dari sistem operasional Ananahnu HalalCore.'
    );
    const [isSavingWa, setIsSavingWa] = useState(false);
    const [isTestingWa, setIsTestingWa] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const sysSettings = await operationalService.getSystemSettings();
                if (sysSettings?.fonnte_token) setFonnteToken(sysSettings.fonnte_token);
                if (sysSettings?.wa_notifications_enabled !== undefined) {
                    setWaEnabled(sysSettings.wa_notifications_enabled === 'true');
                }
            } catch (err) {}
        };
        loadSettings();
    }, []);

    const handleSaveWaToken = async () => {
        try {
            setIsSavingWa(true);
            await operationalService.updateSystemSetting('fonnte_token', fonnteToken);
            await operationalService.updateSystemSetting('wa_notifications_enabled', String(waEnabled));
            toast.success('Pengaturan API WhatsApp Gateway Fonnte berhasil disimpan!');
        } catch (err) {
            toast.error('Gagal menyimpan token WhatsApp');
        } finally {
            setIsSavingWa(false);
        }
    };

    const handleTestWhatsApp = async () => {
        if (!testWaPhone) {
            toast.error('Masukkan nomor WhatsApp tujuan');
            return;
        }
        try {
            setIsTestingWa(true);
            const res = await operationalService.testWhatsApp(testWaPhone, testWaMessage);
            toast.success(res?.message || `Pesan pengujian berhasil dikirim ke ${testWaPhone}!`);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Gagal mengirim pesan pengujian WhatsApp');
        } finally {
            setIsTestingWa(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Konfigurasi Gateway WhatsApp */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h3 className="text-base font-black text-gray-900">Integrasi Gateway WhatsApp (Fonnte)</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Konfigurasi API token Fonnte untuk pengiriman otomatis notifikasi pengingat dan pengembalian berkas.</p>
                </div>

                <div className="space-y-4 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">API Token Fonnte *</label>
                        <input
                            type="password"
                            value={fonnteToken}
                            onChange={(e) => setFonnteToken(e.target.value)}
                            placeholder="Masukkan API Token Fonnte..."
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Aktifkan Pengiriman WhatsApp Otomatis</p>
                            <p className="text-[11px] text-gray-500">Notifikasi penugasan, SLA, dan revisi akan langsung dikirim ke WhatsApp pengguna terkait.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={waEnabled}
                            onChange={(e) => setWaEnabled(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded"
                        />
                    </label>

                    <div className="flex items-center justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleSaveWaToken}
                            disabled={isSavingWa}
                            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {isSavingWa ? 'Menyimpan...' : 'Simpan Token WhatsApp'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Testing Tool */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                    <h3 className="text-base font-black text-gray-900">Uji Coba Pengiriman Pesan WhatsApp</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Kirim pesan uji coba langsung ke nomor tujuan untuk memastikan gateway aktif.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Nomor WhatsApp Tujuan *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={testWaPhone}
                                onChange={(e) => setTestWaPhone(e.target.value)}
                                placeholder="081234567890"
                                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block font-bold text-gray-700 mb-1">Pesan Uji Coba *</label>
                        <textarea
                            rows={3}
                            value={testWaMessage}
                            onChange={(e) => setTestWaMessage(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleTestWhatsApp}
                        disabled={isTestingWa}
                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Send className="w-4 h-4" /> {isTestingWa ? 'Mengirim Uji Coba...' : 'Kirim Pesan Uji Coba'}
                    </button>
                </div>
            </div>
        </div>
    );
}
