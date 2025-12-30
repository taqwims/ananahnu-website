import { Link, Outlet } from 'react-router-dom';
import { Menu, X, ShieldCheck, Phone, MapPin, Mail } from 'lucide-react';
import { useState } from 'react';

export default function PublicLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-800">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900">Ananahnu Halal</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8 items-center">
                            <a href="#home" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">Home</a>
                            <a href="#about" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">About</a>
                            <a href="#services" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">Services</a>
                            <a href="#news" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">News</a>
                            <a href="#contact" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">Contact</a>
                            <Link to="/login" className="px-4 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 font-bold shadow-lg shadow-brand-200 transition-all hover:scale-105 active:scale-95">
                                Client Login
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
                            <a href="#home" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Home</a>
                            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">About</a>
                            <a href="#services" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Services</a>
                            <a href="#news" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">News</a>
                            <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50">Contact</a>
                            <Link to="/login" className="block w-full mt-4 px-5 py-3 text-center rounded-lg bg-brand-600 text-white font-bold">Client Login</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-6 h-6 text-brand-400" />
                                <span className="font-bold text-xl">Ananahnu Halal</span>
                            </div>
                            <p className="text-gray-400 max-w-sm">
                                Trusted Halal Verification Agency providing professional consultation and certification services for your business growth.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Verify Certificate</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
                            <ul className="space-y-3 text-gray-400">
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-500" />
                                    <span>Jl. Halal Toyyiban No. 123, Jakarta Selatan, Indonesia</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-brand-500" />
                                    <span>+62 21 5555 1234</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-brand-500" />
                                    <span>info@ananahnu.id</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                        <p>&copy; 2024 Ananahnu Halal Agency. All rights reserved.</p>
                        <p>Designed with <span className="text-red-500">♥</span> for Ummah</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
