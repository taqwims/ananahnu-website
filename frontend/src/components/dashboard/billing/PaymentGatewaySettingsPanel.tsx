import { useState } from 'react';
import { CreditCard, Zap, CheckCircle2, Eye, EyeOff, Copy, Check, Server, Globe, Building, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentGatewaySettingsPanelProps {
    systemSettings: Record<string, string>;
    setSystemSettings: (s: any) => void;
    onUpdate: (key: string, value: string) => Promise<void>;
}

export const PaymentGatewaySettingsPanel = ({
    systemSettings,
    setSystemSettings,
    onUpdate
}: PaymentGatewaySettingsPanelProps) => {
    const [showMayarKey, setShowMayarKey] = useState(false);
    const [showMidtransServerKey, setShowMidtransServerKey] = useState(false);
    const [showMidtransClientKey, setShowMidtransClientKey] = useState(false);
    const [copiedMayarWebhook, setCopiedMayarWebhook] = useState(false);
    const [copiedMidtransWebhook, setCopiedMidtransWebhook] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    const activeGateway = (systemSettings['PAYMENT_GATEWAY_ACTIVE'] || 'MIDTRANS').toUpperCase();
    const isMayarProd = systemSettings['MAYAR_IS_PRODUCTION'] === 'true';
    const isMidtransProd = systemSettings['MIDTRANS_IS_PRODUCTION'] === 'true';
    const isManualEnabled = systemSettings['PAYMENT_MANUAL_ENABLED'] !== 'false';

    const apiBaseUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://app.ananahnu.id');
    const mayarWebhookUrl = `${apiBaseUrl}/payments/mayar/webhook`;
    const midtransWebhookUrl = `${apiBaseUrl}/payments/midtrans/webhook`;

    const handleSaveSingle = async (key: string, value: string, label: string) => {
        setSaving(key);
        try {
            await onUpdate(key, value);
            toast.success(`${label} berhasil disimpan!`);
        } catch (err: any) {
            toast.error(`Gagal menyimpan ${label}`);
        } finally {
            setSaving(null);
        }
    };

    const handleSelectGateway = async (gateway: 'MIDTRANS' | 'MAYAR') => {
        setSystemSettings((p: any) => ({ ...p, 'PAYMENT_GATEWAY_ACTIVE': gateway }));
        await handleSaveSingle('PAYMENT_GATEWAY_ACTIVE', gateway, `Gateway aktif ${gateway}`);
    };

    const handleCopy = (text: string, type: 'mayar' | 'midtrans') => {
        navigator.clipboard.writeText(text);
        if (type === 'mayar') {
            setCopiedMayarWebhook(true);
            setTimeout(() => setCopiedMayarWebhook(false), 2000);
        } else {
            setCopiedMidtransWebhook(true);
            setTimeout(() => setCopiedMidtransWebhook(false), 2000);
        }
        toast.success("URL Webhook disalin ke clipboard!");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Header & Active Gateway Switcher */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-brand-50 text-brand-600 rounded-2xl">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Pilihan Gateway Pembayaran Aktif</h2>
                            <p className="text-xs text-gray-500">Tentukan gateway pembayaran online utama yang digunakan klien & pengguna saat checkout</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Midtrans Card */}
                    <div
                        onClick={() => handleSelectGateway('MIDTRANS')}
                        className={`relative cursor-pointer rounded-3xl p-6 border-2 transition-all flex flex-col justify-between gap-4 ${activeGateway === 'MIDTRANS'
                                ? 'border-brand-500 bg-brand-50/40 shadow-lg shadow-brand-100 ring-2 ring-brand-500/20'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }`}
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl font-black text-sm tracking-wider ${activeGateway === 'MIDTRANS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        MIDTRANS
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base">Midtrans Snap</h3>
                                        <p className="text-xs text-gray-500">Payment Gateway Indonesia</p>
                                    </div>
                                </div>
                                {activeGateway === 'MIDTRANS' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                        Nonaktif
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed">
                                Mendukung popup modal Snap in-app, QRIS Gopay/ShopeePay, Virtual Account BCA, Mandiri, BNI, BRI, Permata, serta gerai ritel.
                            </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className={`font-semibold px-2.5 py-0.5 rounded-full ${isMidtransProd ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                Mode: {isMidtransProd ? 'Production' : 'Sandbox (Testing)'}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSelectGateway('MIDTRANS'); }}
                                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${activeGateway === 'MIDTRANS'
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                {activeGateway === 'MIDTRANS' ? '✓ Gateway Terpilih' : 'Pilih Midtrans'}
                            </button>
                        </div>
                    </div>

                    {/* Mayar.id Card */}
                    <div
                        onClick={() => handleSelectGateway('MAYAR')}
                        className={`relative cursor-pointer rounded-3xl p-6 border-2 transition-all flex flex-col justify-between gap-4 ${activeGateway === 'MAYAR'
                                ? 'border-emerald-500 bg-emerald-50/40 shadow-lg shadow-emerald-100 ring-2 ring-emerald-500/20'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }`}
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl font-black text-sm tracking-wider ${activeGateway === 'MAYAR' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        MAYAR.ID
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base">Mayar.id Gateway</h3>
                                        <p className="text-xs text-gray-500">Invoice & Checkout Platform</p>
                                    </div>
                                </div>
                                {activeGateway === 'MAYAR' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                        Nonaktif
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed">
                                Halaman checkout instan Mayar.id, QRIS real-time, Virtual Account seluruh bank, Kartu Kredit/Debit, dan notifikasi otomatis webhook.
                            </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className={`font-semibold px-2.5 py-0.5 rounded-full ${isMayarProd ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                Mode: {isMayarProd ? 'Production' : 'Sandbox (api.mayar.io)'}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSelectGateway('MAYAR'); }}
                                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${activeGateway === 'MAYAR'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                {activeGateway === 'MAYAR' ? '✓ Gateway Terpilih' : 'Pilih Mayar.id'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Mayar.id Configuration Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Konfigurasi Mayar.id</h3>
                            <p className="text-xs text-gray-500">Atur API Key dan Mode Lingkungan Mayar.id</p>
                        </div>
                    </div>
                    {activeGateway === 'MAYAR' && (
                        <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Gateway Aktif
                        </span>
                    )}
                </div>

                <div className="space-y-5">
                    {/* API Key */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Mayar API Key</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showMayarKey ? "text" : "password"}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                                    value={systemSettings['MAYAR_API_KEY'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({ ...p, 'MAYAR_API_KEY': e.target.value }))}
                                    placeholder="Masukkan API Key dari Dashboard Mayar (Integration > API Keys)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMayarKey(!showMayarKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showMayarKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={() => handleSaveSingle('MAYAR_API_KEY', systemSettings['MAYAR_API_KEY'] || '', 'API Key Mayar')}
                                disabled={saving === 'MAYAR_API_KEY'}
                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-100 transition-all disabled:opacity-50"
                            >
                                {saving === 'MAYAR_API_KEY' ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">Dapatkan API Key di Mayar Dashboard → Menu <strong>Integration</strong> → <strong>API Keys</strong>.</p>
                    </div>

                    {/* Environment Switcher */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Mode Lingkungan (Environment)</label>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="mayar_env"
                                        checked={!isMayarProd}
                                        onChange={() => {
                                            setSystemSettings((p: any) => ({ ...p, 'MAYAR_IS_PRODUCTION': 'false' }));
                                            handleSaveSingle('MAYAR_IS_PRODUCTION', 'false', 'Mode Sandbox Mayar');
                                        }}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>Sandbox / Staging (api.mayar.io)</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="mayar_env"
                                        checked={isMayarProd}
                                        onChange={() => {
                                            setSystemSettings((p: any) => ({ ...p, 'MAYAR_IS_PRODUCTION': 'true' }));
                                            handleSaveSingle('MAYAR_IS_PRODUCTION', 'true', 'Mode Production Mayar');
                                        }}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>Production (api.mayar.id)</span>
                                </label>
                            </div>
                        </div>

                        {/* Optional Redirect URL */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Custom Redirect URL (Opsional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                    value={systemSettings['MAYAR_REDIRECT_URL'] || ''}
                                    onChange={e => setSystemSettings((p: any) => ({ ...p, 'MAYAR_REDIRECT_URL': e.target.value }))}
                                    placeholder="Contoh: https://app.ananahnu.id/dashboard/invoices"
                                />
                                <button
                                    onClick={() => handleSaveSingle('MAYAR_REDIRECT_URL', systemSettings['MAYAR_REDIRECT_URL'] || '', 'Redirect URL Mayar')}
                                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Webhook Info */}
                    <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-emerald-600" />
                                URL Webhook Notifikasi Mayar (Salin ke Dashboard Mayar)
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(mayarWebhookUrl, 'mayar')}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-xs"
                            >
                                {copiedMayarWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedMayarWebhook ? 'Tersalin!' : 'Salin URL'}
                            </button>
                        </div>
                        <p className="text-xs font-mono bg-white p-2.5 rounded-xl border border-emerald-200 text-emerald-950 select-all break-all">
                            {mayarWebhookUrl}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                            Masukkan URL di atas ke menu <strong>Integration → Webhook</strong> di dashboard Mayar.id agar pembayaran otomatis terkonfirmasi saat klien membayar.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Midtrans Configuration Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Server className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Konfigurasi Midtrans</h3>
                            <p className="text-xs text-gray-500">Atur Server Key, Client Key, dan Environment Midtrans</p>
                        </div>
                    </div>
                    {activeGateway === 'MIDTRANS' && (
                        <span className="self-start sm:self-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Gateway Aktif
                        </span>
                    )}
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Server Key */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Midtrans Server Key</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showMidtransServerKey ? "text" : "password"}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        value={systemSettings['MIDTRANS_SERVER_KEY'] || ''}
                                        onChange={e => setSystemSettings((p: any) => ({ ...p, 'MIDTRANS_SERVER_KEY': e.target.value }))}
                                        placeholder="SB-Mid-server-..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowMidtransServerKey(!showMidtransServerKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        {showMidtransServerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleSaveSingle('MIDTRANS_SERVER_KEY', systemSettings['MIDTRANS_SERVER_KEY'] || '', 'Server Key Midtrans')}
                                    disabled={saving === 'MIDTRANS_SERVER_KEY'}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 transition-all disabled:opacity-50"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>

                        {/* Client Key */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Midtrans Client Key</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showMidtransClientKey ? "text" : "password"}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        value={systemSettings['MIDTRANS_CLIENT_KEY'] || ''}
                                        onChange={e => setSystemSettings((p: any) => ({ ...p, 'MIDTRANS_CLIENT_KEY': e.target.value }))}
                                        placeholder="SB-Mid-client-..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowMidtransClientKey(!showMidtransClientKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        {showMidtransClientKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleSaveSingle('MIDTRANS_CLIENT_KEY', systemSettings['MIDTRANS_CLIENT_KEY'] || '', 'Client Key Midtrans')}
                                    disabled={saving === 'MIDTRANS_CLIENT_KEY'}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-100 transition-all disabled:opacity-50"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Environment Switcher */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Mode Lingkungan Midtrans</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 max-w-md">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                <input
                                    type="radio"
                                    name="midtrans_env"
                                    checked={!isMidtransProd}
                                    onChange={() => {
                                        setSystemSettings((p: any) => ({ ...p, 'MIDTRANS_IS_PRODUCTION': 'false' }));
                                        handleSaveSingle('MIDTRANS_IS_PRODUCTION', 'false', 'Mode Sandbox Midtrans');
                                    }}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Sandbox (Testing)</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                                <input
                                    type="radio"
                                    name="midtrans_env"
                                    checked={isMidtransProd}
                                    onChange={() => {
                                        setSystemSettings((p: any) => ({ ...p, 'MIDTRANS_IS_PRODUCTION': 'true' }));
                                        handleSaveSingle('MIDTRANS_IS_PRODUCTION', 'true', 'Mode Production Midtrans');
                                    }}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Production</span>
                            </label>
                        </div>
                    </div>

                    {/* Webhook Info */}
                    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-blue-600" />
                                URL Webhook Notifikasi Midtrans (Payment Notification URL)
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(midtransWebhookUrl, 'midtrans')}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-xs"
                            >
                                {copiedMidtransWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedMidtransWebhook ? 'Tersalin!' : 'Salin URL'}
                            </button>
                        </div>
                        <p className="text-xs font-mono bg-white p-2.5 rounded-xl border border-blue-200 text-blue-950 select-all break-all">
                            {midtransWebhookUrl}
                        </p>
                        <p className="text-[11px] text-blue-700">
                            Masukkan URL di atas pada Midtrans Dashboard → <strong>Settings → Configuration → Payment Notification URL</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* 4. Manual Bank Transfer Configuration */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Rekening Tujuan Transfer Manual</h3>
                            <p className="text-xs text-gray-500">Informasi rekening bank yang ditampilkan kepada klien untuk pembayaran transfer manual</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                            <input
                                type="checkbox"
                                checked={isManualEnabled}
                                onChange={(e) => {
                                    const val = e.target.checked ? 'true' : 'false';
                                    setSystemSettings((p: any) => ({ ...p, 'PAYMENT_MANUAL_ENABLED': val }));
                                    handleSaveSingle('PAYMENT_MANUAL_ENABLED', val, 'Status Transfer Manual');
                                }}
                                className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span>Opsi Transfer Manual Aktif</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bank Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Bank</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-semibold"
                                value={systemSettings['PAYMENT_BANK_NAME'] || 'BNI'}
                                onChange={e => setSystemSettings((p: any) => ({ ...p, 'PAYMENT_BANK_NAME': e.target.value }))}
                                placeholder="Contoh: BNI / Mandiri / BCA"
                            />
                            <button
                                onClick={() => handleSaveSingle('PAYMENT_BANK_NAME', systemSettings['PAYMENT_BANK_NAME'] || 'BNI', 'Nama Bank')}
                                className="px-3.5 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor Rekening</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono font-bold"
                                value={systemSettings['PAYMENT_BANK_ACCOUNT_NO'] || '1825073247'}
                                onChange={e => setSystemSettings((p: any) => ({ ...p, 'PAYMENT_BANK_ACCOUNT_NO': e.target.value }))}
                                placeholder="Contoh: 1825073247"
                            />
                            <button
                                onClick={() => handleSaveSingle('PAYMENT_BANK_ACCOUNT_NO', systemSettings['PAYMENT_BANK_ACCOUNT_NO'] || '1825073247', 'Nomor Rekening')}
                                className="px-3.5 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Atas Nama Rekening</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-semibold"
                                value={systemSettings['PAYMENT_BANK_ACCOUNT_NAME'] || 'PT. Ana Nahnu Indonesia'}
                                onChange={e => setSystemSettings((p: any) => ({ ...p, 'PAYMENT_BANK_ACCOUNT_NAME': e.target.value }))}
                                placeholder="Contoh: PT. Ana Nahnu Indonesia"
                            />
                            <button
                                onClick={() => handleSaveSingle('PAYMENT_BANK_ACCOUNT_NAME', systemSettings['PAYMENT_BANK_ACCOUNT_NAME'] || 'PT. Ana Nahnu Indonesia', 'Atas Nama')}
                                className="px-3.5 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold">Informasi Keamanan Kunci Rahasia</p>
                    <p className="mt-0.5 text-amber-700">
                        Kunci Server Key Midtrans dan API Key Mayar hanya disimpan secara aman di server dan tidak pernah terekspos ke publik atau browser klien.
                    </p>
                </div>
            </div>
        </div>
    );
};
