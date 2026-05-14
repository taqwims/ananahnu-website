import { MessageSquare, Save, ShieldCheck } from 'lucide-react';

interface WhatsAppGatewayCardProps {
    token: string;
    onTokenChange: (v: string) => void;
    onTokenUpdate: () => void;
    isEnabled: boolean;
    onToggle: (v: boolean) => void;
    isSaving: boolean;
}

export const WhatsAppGatewayCard = ({
    token,
    onTokenChange,
    onTokenUpdate,
    isEnabled,
    onToggle,
    isSaving
}: WhatsAppGatewayCardProps) => {
    return (
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
                                value={token}
                                onChange={(e) => onTokenChange(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white outline-none transition-all font-mono text-sm"
                                placeholder="token-api-fonnte"
                            />
                            <button
                                onClick={onTokenUpdate}
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
                                    checked={isEnabled}
                                    onChange={(e) => onToggle(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
