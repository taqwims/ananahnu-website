import { Bell, RefreshCw } from 'lucide-react';

interface NotificationHeaderProps {
    onRefresh: () => void;
}

export const NotificationHeader = ({ onRefresh }: NotificationHeaderProps) => {
    return (
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
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all text-sm font-medium"
            >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
            </button>
        </div>
    );
};
