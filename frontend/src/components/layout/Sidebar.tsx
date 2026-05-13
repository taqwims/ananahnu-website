import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    X,
    CreditCard,
    BookOpen,
    UserCheck,
    UsersRound,
    GraduationCap,
    Receipt,
    Settings,
    MapPin,
    DollarSign,
    Monitor,
    Shield,
    TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

import Logo from '../ui/Logo';

interface SidebarLink {
    name: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
}

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const roleName = user?.role || '';

    const links: SidebarLink[] = [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Klien', to: '/dashboard/clients', icon: Users, roles: ['DIRECTOR', 'MANAGER', 'HALAL_KONSULTAN', 'KOORDINATOR', 'DRAFTER', 'QC_OFFICER', 'MARKETING'] },
        { name: 'Pengajuan', to: '/dashboard/submissions', icon: FileText, roles: ['DIRECTOR', 'MANAGER', 'HALAL_KONSULTAN', 'KOORDINATOR', 'QC_OFFICER', 'DRAFTER', 'MARKETING'] },
        { name: 'Distribusi Data', to: '/dashboard/distribution', icon: Users, roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN'] },
        { name: 'Monitoring Drafter', to: '/dashboard/monitoring', icon: Monitor, roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN'] },
        { name: 'Profil Konsultan', to: '/dashboard/consultant-profile', icon: UserCheck, roles: ['HALAL_KONSULTAN'] },
        { name: 'Tim Saya', to: '/dashboard/team', icon: UsersRound, roles: ['KOORDINATOR'] },
        { name: 'Referral Saya', to: '/dashboard/referrals', icon: TrendingUp, roles: ['HALAL_KONSULTAN', 'KOORDINATOR', 'MARKETING', 'ADMIN'] },
        { name: 'Analitik Referral', to: '/dashboard/admin-referrals', icon: TrendingUp, roles: ['ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
        { name: 'Fee Referral', to: '/dashboard/referral-fees', icon: DollarSign, roles: ['ADMIN_KEUANGAN', 'ADMIN_PELATIHAN', 'FINANCE', 'DIRECTOR', 'ADMIN'] },
        { name: 'Verifikasi Konsultan', to: '/dashboard/consultant-verification', icon: Shield, roles: ['ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
        { name: 'Pelatihan', to: '/dashboard/training', icon: GraduationCap, roles: ['ADMIN_PELATIHAN', 'KOORDINATOR', 'DIRECTOR', 'MANAGER'] },
        { name: 'Keuangan', to: '/dashboard/finance', icon: Receipt, roles: ['ADMIN_KEUANGAN', 'FINANCE', 'DIRECTOR'] },
        { name: 'Pembayaran', to: '/dashboard/payments', icon: CreditCard, roles: ['FINANCE', 'ADMIN_KEUANGAN', 'DIRECTOR'] },
        { name: 'Pengaturan Form', to: '/dashboard/form-config', icon: Settings, roles: ['DIRECTOR', 'MANAGER'] },
        { name: 'Master Biaya', to: '/dashboard/billing-config', icon: Receipt, roles: ['DIRECTOR', 'MANAGER'] },
        { name: 'Wilayah & Tarif', to: '/dashboard/geography', icon: MapPin, roles: ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN'] },
        { name: 'Manajemen User', to: '/dashboard/users', icon: Users, roles: ['DIRECTOR'] },
        { name: 'CMS', to: '/dashboard/cms', icon: BookOpen, roles: ['DIRECTOR'] },
    ];

    // Filter links based on role
    const filteredLinks = links.filter(l => !l.roles || l.roles.includes(roleName));

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
                        <Logo size="sm" className="!items-start" />
                        <button onClick={toggle} className="lg:hidden text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* User Info */}
                    {user && (
                        <div className="px-4 py-3 border-b border-glass-border">
                            <p className="text-sm font-medium text-gray-800 truncate">{user.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{roleName.replace(/_/g, ' ')}</p>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {filteredLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === '/dashboard'}
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
                    {/* Coordinator Billing */}
                    {(user?.role === 'KOORDINATOR' || user?.role === 'HALAL_KONSULTAN' || user?.role === 'ADMIN') && (
                        <div className="mt-6 px-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Tagihan</p>
                            <NavLink to="/dashboard/my-invoices" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}>
                                <CreditCard className="w-5 h-5" />
                                Tagihan Saya
                            </NavLink>
                        </div>
                    )}

                    {/* Finance Specific */}
                    {(user?.role === 'FINANCE' || user?.role === 'ADMIN_KEUANGAN' || user?.role === 'ADMIN' || user?.role === 'DIRECTOR') && (
                        <div className="mt-6 px-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Finance & Billing</p>
                            <NavLink to="/dashboard/coordinator-rates" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}>
                                <DollarSign className="w-5 h-5" />
                                Tarif Koordinator
                            </NavLink>
                            <NavLink to="/dashboard/all-invoices" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'}`}>
                                <FileText className="w-5 h-5" />
                                Daftar Tagihan
                            </NavLink>
                        </div>
                    )}

                    <div className="mt-auto p-4 border-t border-glass-border">
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
