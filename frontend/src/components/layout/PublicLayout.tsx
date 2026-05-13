import { Link, Outlet } from 'react-router-dom';
import { Menu, X, Phone, MapPin, Mail } from 'lucide-react';
import { useState } from 'react';
import Logo from '../ui/Logo';

export default function PublicLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                            <Link to="/login" className="px-6 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 font-bold shadow-lg shadow-brand-200 transition-all hover:scale-105 active:scale-95">
                                Login
                            </Link>
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
                            <Link to="/login" className="block w-full mt-4 px-5 py-3 text-center rounded-lg bg-brand-600 text-white font-bold">Login</Link>
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
                                    <span>Halal Core Center, Jakarta, Indonesia</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gold-500" />
                                    <span>+62 21 5555 1234</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gold-500" />
                                    <span>info@halalcore.id</span>
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
