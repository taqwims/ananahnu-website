import { Menu, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from '../dashboard/NotificationDropdown';
import { useState } from 'react';
import ProfileModal from '../dashboard/ProfileModal';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
    const user = useAuthStore(state => state.user);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header className="glass-panel mx-4 mt-4 lg:mx-0 lg:mr-4 p-4 flex items-center justify-between sticky top-4 z-30">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-white/50 rounded-lg text-gray-600">
                    <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
                    Dashboard
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <NotificationDropdown />

                <div 
                    className="flex items-center gap-3 pl-4 border-l border-glass-border cursor-pointer group"
                    onClick={() => setIsProfileOpen(true)}
                    title="Pengaturan Profil"
                >
                    <div className="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
                        <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Guest'}</p>
                        <p className="text-xs text-gray-500 uppercase">{user?.role?.replace(/_/g, ' ') || 'Visitor'}</p>
                    </div>
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                        <User className="text-brand-600 w-5 h-5" />
                    </div>
                </div>
            </div>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </header>
    );
};

export default Header;
