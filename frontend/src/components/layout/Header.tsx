import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from '../dashboard/NotificationDropdown';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const role = user?.role ?? '';
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = () => {
        const isClient = role === 'CLIENT';
        logout();
        if (isClient) {
            const telemarketingUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:5174'
                : 'https://telemarketing.halalcore.id';
            window.location.replace(`${telemarketingUrl}/login`);
        } else {
            setIsDropdownOpen(false);
        }
    };

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

                <div className="relative">
                    <div 
                        className="flex items-center gap-3 pl-4 border-l border-glass-border cursor-pointer group"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        title="Menu Profil"
                    >
                        <div className="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
                            <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Guest'}</p>
                            <p className="text-xs text-gray-500 uppercase">{user?.role?.replace(/_/g, ' ') || 'Visitor'}</p>
                        </div>
                        <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                            {user?.avatar_url ? (
                                <img 
                                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`} 
                                    alt={user.full_name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="text-white w-5 h-5" />
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Link
                                    to="/dashboard/profile"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors font-semibold"
                                >
                                    <User className="w-4 h-4" />
                                    Profil Saya
                                </Link>

                                <hr className="border-gray-50 my-1" />

                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-semibold text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
