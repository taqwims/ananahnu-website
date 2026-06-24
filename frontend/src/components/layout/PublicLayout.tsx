import { Link, Outlet } from 'react-router-dom';
import { Menu, X, Phone, MapPin, Mail, User, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from '../ui/Logo';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const TELEMARKETING_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5174'
    : 'https://telemarketing.halalcore.id';

export default function PublicLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const role = user?.role ?? '';

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

    useEffect(() => {
        api.get('/system-settings/public')
            .then(res => {
                setPublicSettings(res.data || {});
            })
            .catch(() => {});
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-800">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Logo size="md" />
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8 items-center">
                            <a href="/#home" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">Home</a>
                            <a href="/#about" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">About</a>
                            <a href="/#services" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">Services</a>
                            <a href="/#news" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">News</a>
                            <a href="/#contact" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">Contact</a>
                            <a href={`${TELEMARKETING_URL}/form`} className="text-amber-600 hover:text-amber-700 font-bold transition-colors">Sertifikasi Halal</a>
                            
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors outline-none"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center border border-gray-100 overflow-hidden shadow-sm">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                                                    alt={user.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="text-white w-4 h-4" />
                                            )}
                                        </div>
                                        <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                                            {user.full_name.split(' ')[0]}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-3 border-b border-gray-50">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Signed in as</p>
                                                    <p className="text-sm font-bold text-gray-800 truncate">{user.full_name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-medium">{user.role?.replace(/_/g, ' ')}</p>
                                                </div>
                                                
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors font-semibold"
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Ke Dashboard
                                                </Link>
                                                
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
                            ) : (
                                <Link to="/login" className="px-6 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 font-bold shadow-lg shadow-brand-200 transition-all hover:scale-105 active:scale-95">
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-500 hover:text-gray-700 p-2"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top-2">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <a href="/#home" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Home</a>
                            <a href="/#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">About</a>
                            <a href="/#services" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Services</a>
                            <a href="/#news" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">News</a>
                            <a href="/#contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Contact</a>
                            <a href={`${TELEMARKETING_URL}/form`} className="block px-3 py-2 rounded-md text-base font-bold text-amber-600 hover:text-amber-700 hover:bg-brand-50">Sertifikasi Halal</a>
                            
                            {user ? (
                                <div className="pt-4 pb-2 border-t border-gray-100 mt-4 px-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center border border-gray-100 overflow-hidden shadow-sm">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                                                    alt={user.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="text-white w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.full_name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.role?.replace(/_/g, ' ')}</p>
                                        </div>
                                    </div>
                                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Dashboard</Link>
                                    <Link to="/dashboard/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Profil Saya</Link>
                                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Keluar</button>
                                </div>
                            ) : (
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full mt-4 px-5 py-3 text-center rounded-lg bg-brand-600 text-white font-bold">Login</Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-[#00261f] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <Logo size="md" variant="white" className="!items-start" />
                            </div>
                            <p className="text-brand-100/70 max-w-sm leading-relaxed">
                                Building Halal Business Excellence through professional advisory, training, and certification systems.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-gold-400">Quick Links</h4>
                            <ul className="space-y-3 text-brand-100/60">
                                <li><a href={`${TELEMARKETING_URL}/form`} className="text-gold-400 font-bold hover:text-gold-300 transition-colors">Daftar Sertifikasi Halal</a></li>
                                <li><a href="#" className="hover:text-gold-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-gold-400 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-gold-400 transition-colors">Verify Certificate</a></li>
                                <li><a href="#" className="hover:text-gold-400 transition-colors">Halal Standards</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-gold-400">Contact Us</h4>
                            <ul className="space-y-4 text-brand-100/60">
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold-500" />
                                    <span>{publicSettings['COMPANY_ADDRESS'] || 'Halal Core Center, Jakarta, Indonesia'}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gold-500" />
                                    <span>{publicSettings['COMPANY_PHONE'] || '+62 21 5555 1234'}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gold-500" />
                                    <span>{publicSettings['COMPANY_EMAIL'] || 'info@halalcore.id'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-brand-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-brand-100/40 text-sm">
                        <p>&copy; {new Date().getFullYear()} Halal Core Agency. All rights reserved.</p>
                        <p>Empowering the Global Halal Ecosystem</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
