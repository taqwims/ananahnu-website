import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    X,
    CreditCard,
    BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
    const logout = useAuthStore(state => state.logout);
    // const role = useAuthStore(state => state.user?.role);

    const links = [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Clients', to: '/dashboard/clients', icon: Users, roles: ['ADMIN', 'DIRECTOR', 'MARKETING', 'VERVAL_PENDAMPING'] }, // Example roles
        { name: 'Submissions', to: '/dashboard/submissions', icon: FileText },
        { name: 'CMS', to: '/dashboard/cms', icon: BookOpen, roles: ['ADMIN'] },
        { name: 'Payments', to: '/dashboard/payments', icon: CreditCard, roles: ['ADMIN', 'FINANCE'] },
    ];

    // Filter links based on role (simple check)
    // In real app, complex permission check
    const filteredLinks = links;

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={toggle}
                        className="fixed inset-0 bg-black z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.div
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass-panel m-0 lg:m-4 lg:rounded-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ borderRight: '1px solid rgba(255,255,255,0.4)' }}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-glass-border flex items-center justify-between">
                        <span className="text-xl font-bold text-brand-700 tracking-tight">Ananahnu</span>
                        <button onClick={toggle} className="lg:hidden text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {filteredLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                            ${isActive
                                        ? 'bg-brand-100 text-brand-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}
                        `}
                            >
                                <link.icon className="w-5 h-5" />
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t border-glass-border">
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};
export default Sidebar;
