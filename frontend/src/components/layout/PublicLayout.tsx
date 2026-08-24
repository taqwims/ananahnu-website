import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
    Menu, X, Phone, MapPin, Mail, User, LogOut, ChevronDown, 
    LayoutDashboard, ChevronRight,
    Facebook, Instagram, Youtube, Linkedin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Logo from '../ui/Logo';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatRoleName, formatWhatsAppUrl } from '../../utils/format';

const TELEMARKETING_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5174'
    : 'https://telemarketing.halalcore.id';

export default function PublicLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [layananDropdownOpen, setLayananDropdownOpen] = useState(false);
    const [untukSiapaDropdownOpen, setUntukSiapaDropdownOpen] = useState(false);

    const location = useLocation();
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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setLayananDropdownOpen(false);
        setUntukSiapaDropdownOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-800 bg-white selection:bg-emerald-100 selection:text-emerald-900">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo HalalCore + Powered by Ana Nahnu */}
                        <Link to="/" className="flex-shrink-0 flex items-center group py-1">
                            <Logo size="md" showPoweredBy={true} />
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex space-x-7 items-center">
                            <a 
                                href="/#home" 
                                className="text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
                            >
                                Beranda
                            </a>

                            {/* Layanan Dropdown */}
                            <div 
                                className="relative"
                                onMouseEnter={() => setLayananDropdownOpen(true)}
                                onMouseLeave={() => setLayananDropdownOpen(false)}
                            >
                                <button 
                                    className="flex items-center gap-1 text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors py-2 outline-none"
                                    onClick={() => setLayananDropdownOpen(!layananDropdownOpen)}
                                >
                                    <span>Layanan</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${layananDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {layananDropdownOpen && (
                                    <div className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <a 
                                            href="/#layanan" 
                                            className="block p-3 rounded-xl hover:bg-emerald-50/70 transition-colors group"
                                            onClick={() => setLayananDropdownOpen(false)}
                                        >
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">Reguler</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Pendampingan sertifikasi halal skala UKM & Menengah</div>
                                        </a>
                                        <a 
                                            href="/#layanan" 
                                            className="block p-3 rounded-xl hover:bg-emerald-50/70 transition-colors group"
                                            onClick={() => setLayananDropdownOpen(false)}
                                        >
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 flex items-center justify-between">
                                                <span>Self Declare (Fasilitasi)</span>
                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Rp 0</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">Fasilitasi subsidi pendaftaran BPJPH bagi UMK</div>
                                        </a>
                                        <a 
                                            href="/#layanan" 
                                            className="block p-3 rounded-xl hover:bg-emerald-50/70 transition-colors group"
                                            onClick={() => setLayananDropdownOpen(false)}
                                        >
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">Self Declare (Mandiri)</div>
                                            <div className="text-xs text-gray-500 mt-0.5">Proses pendaftaran mandiri terpandu</div>
                                        </a>
                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <a 
                                                href={formatWhatsAppUrl(publicSettings['COMPANY_PHONE'], "Halo HalalCore, saya ingin konsultasi pengurusan sertifikat halal")}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block p-2.5 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100/60 transition-colors flex items-center justify-between"
                                            >
                                                <span>Konsultasi Gratis via WhatsApp</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Untuk Siapa Dropdown */}
                            <div 
                                className="relative"
                                onMouseEnter={() => setUntukSiapaDropdownOpen(true)}
                                onMouseLeave={() => setUntukSiapaDropdownOpen(false)}
                            >
                                <button 
                                    className="flex items-center gap-1 text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors py-2 outline-none"
                                    onClick={() => setUntukSiapaDropdownOpen(!untukSiapaDropdownOpen)}
                                >
                                    <span>Untuk Siapa</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${untukSiapaDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {untukSiapaDropdownOpen && (
                                    <div className="absolute top-full left-0 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <a href="/#untuk-siapa" onClick={() => setUntukSiapaDropdownOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors">UMKM & Usaha Mikro</a>
                                        <a href="/#untuk-siapa" onClick={() => setUntukSiapaDropdownOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors">Kuliner & Minuman</a>
                                        <a href="/#untuk-siapa" onClick={() => setUntukSiapaDropdownOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors">Kosmetik & Obat Tradisional</a>
                                        <a href="/#untuk-siapa" onClick={() => setUntukSiapaDropdownOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors">Jasa & Layanan</a>
                                        <a href="/#untuk-siapa" onClick={() => setUntukSiapaDropdownOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors">Industri & Manufaktur</a>
                                    </div>
                                )}
                            </div>

                            <a href="/#proses" className="text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors">Alur Proses</a>
                            <a href="/#keunggulan" className="text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors">Keunggulan</a>
                            <Link to="/news" className="text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors">Berita & Edukasi</Link>
                            <a href="/#kontak" className="text-gray-700 hover:text-emerald-700 font-medium text-[15px] transition-colors">Kontak</a>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="hidden lg:flex items-center space-x-3">
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors outline-none"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                                                    alt={user.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-4 h-4 text-emerald-100" />
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 max-w-[110px] truncate">
                                            {user.full_name.split(' ')[0]}
                                        </span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Signed in as</p>
                                                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user.full_name}</p>
                                                    <p className="text-[11px] text-gray-500 uppercase font-medium">{user.role?.replace(/_/g, ' ')}</p>
                                                </div>
                                                
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors font-semibold"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                                                    Ke Dashboard
                                                </Link>
                                                
                                                <Link
                                                    to="/dashboard/profile"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors font-semibold"
                                                >
                                                    <User className="w-4 h-4 text-emerald-600" />
                                                    Profil Saya
                                                </Link>

                                                <hr className="border-gray-100 my-1" />

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
                                <>
                                    <Link 
                                        to="/login" 
                                        className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:text-emerald-800 hover:bg-gray-50 rounded-full transition-all"
                                    >
                                        Masuk
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        className="px-6 py-2.5 text-sm font-bold text-white bg-[#004033] hover:bg-[#002f26] rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
                                    >
                                        Daftar Sekarang
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center lg:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-700 hover:text-emerald-800 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                aria-label="Open Menu"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
                        <a href="/#home" className="block px-3 py-2.5 rounded-xl text-base font-semibold text-gray-800 hover:text-emerald-800 hover:bg-emerald-50">Beranda</a>
                        <a href="/#layanan" className="block px-3 py-2.5 rounded-xl text-base font-semibold text-gray-800 hover:text-emerald-800 hover:bg-emerald-50">Layanan Pendampingan</a>
                        <a href="/#proses" className="block px-3 py-2.5 rounded-xl text-base font-semibold text-gray-800 hover:text-emerald-800 hover:bg-emerald-50">Alur Proses</a>
                        <a href="/#untuk-siapa" className="block px-3 py-2.5 rounded-xl text-base font-semibold text-gray-800 hover:text-emerald-800 hover:bg-emerald-50">Untuk Siapa</a>
                        <Link to="/news" className="block px-3 py-2.5 rounded-xl text-base font-semibold text-gray-800 hover:text-emerald-800 hover:bg-emerald-50">Berita & Edukasi</Link>
                        <a href="/#kontak" className="block px-3 py-2.5 rounded-xl text-base font-semibold text-gray-800 hover:text-emerald-800 hover:bg-emerald-50">Kontak Kami</a>
                        <a href={`${TELEMARKETING_URL}/form`} className="block px-3 py-2.5 rounded-xl text-base font-bold text-amber-700 bg-amber-50">Daftar Sertifikasi Halal</a>
                        
                        <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl mb-2">
                                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.full_name}</p>
                                            <p className="text-xs text-gray-500 truncate">{formatRoleName(user.role || '')}</p>
                                        </div>
                                    </div>
                                    <Link to="/dashboard" className="w-full py-2.5 text-center rounded-xl bg-emerald-800 text-white font-bold text-sm">Ke Dashboard</Link>
                                    <button onClick={handleLogout} className="w-full py-2.5 text-center rounded-xl border border-red-200 text-red-600 font-bold text-sm">Keluar</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="w-full py-2.5 text-center rounded-xl border border-gray-200 text-gray-800 font-bold text-sm">Masuk</Link>
                                    <Link to="/register" className="w-full py-2.5 text-center rounded-xl bg-[#004033] text-white font-bold text-sm">Daftar Sekarang</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content View */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer Section */}
            <footer id="kontak" className="bg-[#00261f] text-white pt-16 pb-12 border-t border-emerald-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* 5 Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-emerald-900/60">
                        {/* Col 1: Brand Info & Powered by */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center">
                                <Logo size="md" variant="white" showPoweredBy={true} />
                            </div>
                            <p className="text-emerald-100/70 text-sm leading-relaxed max-w-sm">
                                HalalCore adalah platform pendampingan halal terpercaya yang membantu pelaku usaha mendapatkan Sertifikat Halal sesuai ketentuan BPJPH.
                            </p>
                            
                            {/* Social Media Links */}
                            <div className="flex items-center space-x-3 pt-2">
                                <a 
                                    href="https://facebook.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-9 h-9 rounded-full bg-emerald-900/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a 
                                    href="https://instagram.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-9 h-9 rounded-full bg-emerald-900/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a 
                                    href="https://youtube.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-9 h-9 rounded-full bg-emerald-900/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="w-4 h-4" />
                                </a>
                                <a 
                                    href="https://linkedin.com" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-9 h-9 rounded-full bg-emerald-900/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Col 2: Layanan */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Layanan</h4>
                            <ul className="space-y-2 text-sm text-emerald-100/70">
                                <li><a href="/#layanan" className="hover:text-emerald-300 transition-colors">Reguler</a></li>
                                <li><a href="/#layanan" className="hover:text-emerald-300 transition-colors">Self Declare (Fasilitasi)</a></li>
                                <li><a href="/#layanan" className="hover:text-emerald-300 transition-colors">Self Declare (Mandiri)</a></li>
                                <li><a href={formatWhatsAppUrl(publicSettings['COMPANY_PHONE'], "Halo HalalCore, saya ingin konsultasi")} target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors">Konsultasi Gratis</a></li>
                            </ul>
                        </div>

                        {/* Col 3: Untuk Anda & Perusahaan */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Untuk Anda</h4>
                            <ul className="space-y-2 text-sm text-emerald-100/70">
                                <li><a href="/#untuk-siapa" className="hover:text-emerald-300 transition-colors">UMKM</a></li>
                                <li><a href="/#untuk-siapa" className="hover:text-emerald-300 transition-colors">Perusahaan</a></li>
                                <li><Link to="/register" className="hover:text-emerald-300 transition-colors">Halal Advisor</Link></li>
                                <li><Link to="/track" className="hover:text-emerald-300 transition-colors">Lacak Status SH</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Kontak Kami */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Kontak Kami</h4>
                            <ul className="space-y-2.5 text-sm text-emerald-100/70">
                                <li className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span>{publicSettings['COMPANY_ADDRESS'] || 'Jl. Merdeka No. 123, Bandung, Jawa Barat, Indonesia'}</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>{publicSettings['COMPANY_PHONE'] || '+62 21 1234 5678'}</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>{publicSettings['COMPANY_EMAIL'] || 'info@halalcore.id'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Copyright & Legal */}
                    <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-emerald-200/50 gap-4">
                        <p>© {new Date().getFullYear()} HalalCore. All rights reserved. Powered by Ana Nahnu Indonesia.</p>
                        <div className="flex items-center space-x-6">
                            <a href="#" className="hover:text-emerald-200 transition-colors">Kebijakan Privasi</a>
                            <span>|</span>
                            <a href="#" className="hover:text-emerald-200 transition-colors">Syarat & Ketentuan</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
