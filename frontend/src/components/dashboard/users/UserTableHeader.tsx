import { Plus, Shield, History } from 'lucide-react';

interface UserTableHeaderProps {
    onAddClick: () => void;
    onLogsClick?: () => void;
}

export const UserTableHeader = ({ onAddClick, onLogsClick }: UserTableHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-brand-600" />
                    Manajemen User
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola akun pengguna sistem dan riwayat audit aktivitas</p>
            </div>
            <div className="flex items-center gap-2.5">
                {onLogsClick && (
                    <button 
                        onClick={onLogsClick} 
                        className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-2 transition shadow-xs"
                    >
                        <History className="w-4 h-4 text-brand-600" />
                        <span>Riwayat Log</span>
                    </button>
                )}
                <button onClick={onAddClick} className="glass-button flex items-center gap-2 text-xs font-bold py-2.5 px-4">
                    <Plus className="w-4 h-4" /> Tambah User
                </button>
            </div>
        </div>
    );
};
