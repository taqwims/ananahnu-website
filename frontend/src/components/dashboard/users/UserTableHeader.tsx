import { Plus, Shield } from 'lucide-react';

interface UserTableHeaderProps {
    onAddClick: () => void;
}

export const UserTableHeader = ({ onAddClick }: UserTableHeaderProps) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-brand-600" />
                    Manajemen User
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola akun pengguna sistem</p>
            </div>
            <button onClick={onAddClick} className="glass-button flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah User
            </button>
        </div>
    );
};
