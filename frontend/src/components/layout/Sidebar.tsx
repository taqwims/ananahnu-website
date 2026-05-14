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

    const groups: { name: string; roles?: string[]; links: SidebarLink[] }[] = [
        {
            name: 'Main Menu',
            links: [
                { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
                { name: 'Klien', to: '/dashboard/clients', icon: Users, roles: ['DIRECTOR', 'MANAGER', 'HALAL_KONSULTAN', 'KOORDINATOR', 'DRAFTER', 'QC_OFFICER', 'MARKETING'] },
                { name: 'Pengajuan', to: '/dashboard/submissions', icon: FileText, roles: ['DIRECTOR', 'MANAGER', 'HALAL_KONSULTAN', 'KOORDINATOR', 'QC_OFFICER', 'DRAFTER', 'MARKETING'] },
                { name: 'Tagihan Saya', to: '/dashboard/my-invoices', icon: CreditCard, roles: ['KOORDINATOR', 'HALAL_KONSULTAN', 'ADMIN', 'MARKETING'] },
            ]
        },
        {
            name: 'Workflow',
            roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN', 'HALAL_KONSULTAN'],
            links: [
                { name: 'Distribusi Data', to: '/dashboard/distribution', icon: Users, roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN'] },
                { name: 'Monitoring Drafter', to: '/dashboard/monitoring', icon: Monitor, roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN'] },
                { name: 'Profil Konsultan', to: '/dashboard/consultant-profile', icon: UserCheck, roles: ['HALAL_KONSULTAN'] },
            ]
        },
        {
            name: 'Jaringan & Referral',
            roles: ['KOORDINATOR', 'HALAL_KONSULTAN', 'MARKETING', 'ADMIN', 'DIRECTOR', 'FINANCE', 'ADMIN_KEUANGAN'],
            links: [
                { name: 'Tim Saya', to: '/dashboard/team', icon: UsersRound, roles: ['KOORDINATOR'] },
                { name: 'Referral Saya', to: '/dashboard/referrals', icon: TrendingUp, roles: ['HALAL_KONSULTAN', 'KOORDINATOR', 'MARKETING', 'ADMIN'] },
                { name: 'Analitik Referral', to: '/dashboard/admin-referrals', icon: TrendingUp, roles: ['ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
                { name: 'Fee Referral', to: '/dashboard/referral-fees', icon: DollarSign, roles: ['ADMIN_KEUANGAN', 'ADMIN_PELATIHAN', 'FINANCE', 'DIRECTOR', 'ADMIN'] },
                { name: 'Tarif Koordinator', to: '/dashboard/coordinator-rates', icon: CreditCard, roles: ['FINANCE', 'ADMIN_KEUANGAN', 'ADMIN', 'DIRECTOR'] },
            ]
        },
        {
            name: 'Operasional',
            roles: ['ADMIN_PELATIHAN', 'KOORDINATOR', 'DIRECTOR', 'MANAGER', 'ADMIN'],
            links: [
                { name: 'Verifikasi Konsultan', to: '/dashboard/consultant-verification', icon: Shield, roles: ['ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
                { name: 'Pelatihan', to: '/dashboard/training', icon: GraduationCap, roles: ['ADMIN_PELATIHAN', 'KOORDINATOR', 'DIRECTOR', 'MANAGER'] },
            ]
        },
        {
            name: 'Pengaturan Sistem',
            roles: ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN', 'FINANCE', 'ADMIN'],
            links: [
                { name: 'Manajemen Billing', to: '/dashboard/billing', icon: Receipt, roles: ['ADMIN_KEUANGAN', 'FINANCE', 'DIRECTOR', 'ADMIN'] },
                { name: 'Pengaturan Form', to: '/dashboard/form-config', icon: Settings, roles: ['DIRECTOR', 'MANAGER', 'ADMIN'] },
                { name: 'Master Biaya', to: '/dashboard/billing-config', icon: Receipt, roles: ['DIRECTOR', 'MANAGER', 'ADMIN'] },
                { name: 'Wilayah & Tarif', to: '/dashboard/geography', icon: MapPin, roles: ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN', 'ADMIN'] },
                { name: 'Manajemen User', to: '/dashboard/users', icon: Users, roles: ['DIRECTOR', 'ADMIN'] },
                { name: 'CMS', to: '/dashboard/cms', icon: BookOpen, roles: ['DIRECTOR', 'ADMIN'] },
            ]
        }
    ];

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
                    <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                        {groups.map((group) => {
                            const filteredLinks = group.links.filter(l => !l.roles || l.roles.includes(roleName));
                            if (filteredLinks.length === 0) return null;

                            return (
                                <div key={group.name} className="mb-6 last:mb-0">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-4">
                                        {group.name}
                                    </p>
                                    <div className="space-y-1">
                                        {filteredLinks.map((link) => (
                                            <NavLink
                                                key={link.to}
                                                to={link.to}
                                                end={link.to === '/dashboard'}
                                                className={({ isActive }) => `
                                                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                                                    ${isActive
                                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]'
                                                        : 'text-gray-500 hover:bg-white/60 hover:text-brand-600'}
                                                `}
                                            >
                                                <link.icon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'group-hover:scale-110' : ''}`} />
                                                <span className="truncate">{link.name}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="mt-auto p-4 border-t border-glass-border bg-white/20 backdrop-blur-sm">
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-black text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all active:scale-95 group"
                        >
                            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
