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
    Award,
    Receipt,
    Settings,
    MapPin,
    DollarSign,
    Monitor,
    Shield,
    TrendingUp,
    ShieldCheck,
    MessageSquare,
    UserCircle,
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
                { name: 'Profil Saya', to: '/dashboard/profile', icon: Settings },
                { name: 'Klien', to: '/dashboard/clients', icon: Users, roles: ['DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'DRAFTER', 'QC_OFFICER', 'MARKETING', 'VERIFIKATOR'] },
                { name: 'Pengajuan', to: '/dashboard/submissions', icon: FileText, roles: ['DIRECTOR', 'MANAGER', 'HALAL_ADVISOR', 'HALAL_MANAGER', 'QC_OFFICER', 'DRAFTER', 'MARKETING', 'VERIFIKATOR'] },
                { name: 'Tagihan Saya', to: '/dashboard/my-invoices', icon: CreditCard, roles: ['HALAL_MANAGER', 'HALAL_ADVISOR', 'ADMIN', 'MARKETING'] },
            ]
        },
        {
            name: 'Workflow',
            roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN', 'HALAL_ADVISOR', 'VERIFIKATOR'],
            links: [
                { name: 'Distribusi Data', to: '/dashboard/distribution', icon: Users, roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN', 'VERIFIKATOR'] },
                { name: 'Monitoring Drafter', to: '/dashboard/monitoring', icon: Monitor, roles: ['QC_OFFICER', 'DIRECTOR', 'ADMIN', 'VERIFIKATOR'] },
                { name: 'Ruang Kerja Drafter', to: '/dashboard/drafter-workspace', icon: ShieldCheck, roles: ['DRAFTER', 'ADMIN'] },
                { name: 'Ruang Kerja QC', to: '/dashboard/qc-workspace', icon: ShieldCheck, roles: ['QC_OFFICER', 'ADMIN'] },
                { name: 'Ruang Kerja Verifikator', to: '/dashboard/verifikator-workspace', icon: ShieldCheck, roles: ['VERIFIKATOR', 'ADMIN'] },
                { name: 'Profil Advisor', to: '/dashboard/consultant-profile', icon: UserCheck, roles: ['HALAL_ADVISOR'] },
                { name: 'Jenjang Karir', to: '/dashboard/karir', icon: Award, roles: ['HALAL_ADVISOR', 'HALAL_MANAGER'] },
            ]
        },
        {
            name: 'Jaringan & Referral',
            roles: ['HALAL_MANAGER', 'HALAL_ADVISOR', 'MARKETING', 'ADMIN', 'DIRECTOR', 'ADMIN_KEUANGAN'],
            links: [
                { name: 'Tim Saya', to: '/dashboard/team', icon: UsersRound, roles: ['HALAL_MANAGER'] },
                { name: 'Referral Saya', to: '/dashboard/referrals', icon: TrendingUp, roles: ['HALAL_ADVISOR', 'HALAL_MANAGER', 'MARKETING', 'ADMIN'] },
                { name: 'Analitik Referral', to: '/dashboard/admin-referrals', icon: TrendingUp, roles: ['ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
                { name: 'Fee Referral', to: '/dashboard/referral-fees', icon: DollarSign, roles: ['ADMIN_KEUANGAN', 'ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
                { name: 'Tarif Halal Manager', to: '/dashboard/coordinator-rates', icon: CreditCard, roles: ['ADMIN_KEUANGAN', 'ADMIN', 'DIRECTOR'] },
            ]
        },
        {
            name: 'Operasional',
            roles: ['ADMIN_PELATIHAN', 'HALAL_MANAGER', 'DIRECTOR', 'MANAGER', 'ADMIN'],
            links: [
                { name: 'Verifikasi Advisor', to: '/dashboard/consultant-verification', icon: Shield, roles: ['ADMIN_PELATIHAN', 'DIRECTOR', 'ADMIN'] },
                { name: 'Pelatihan', to: '/dashboard/training', icon: GraduationCap, roles: ['ADMIN_PELATIHAN', 'HALAL_MANAGER', 'DIRECTOR', 'MANAGER'] },
                { name: 'Pengajuan Promosi', to: '/dashboard/admin-promosi', icon: Award, roles: ['ADMIN_PELATIHAN', 'ADMIN'] },
            ]
        },
        {
            name: 'Pengaturan Sistem',
            roles: ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN', 'ADMIN'],
            links: [
                { name: 'Manajemen Billing', to: '/dashboard/billing', icon: Receipt, roles: ['ADMIN_KEUANGAN', 'DIRECTOR', 'ADMIN'] },
                { name: 'Pengaturan Form', to: '/dashboard/form-config', icon: Settings, roles: ['DIRECTOR', 'MANAGER', 'ADMIN'] },
                { name: 'Master Biaya', to: '/dashboard/billing-config', icon: Receipt, roles: ['DIRECTOR', 'MANAGER', 'ADMIN'] },
                { name: 'Wilayah & Tarif', to: '/dashboard/geography', icon: MapPin, roles: ['DIRECTOR', 'MANAGER', 'ADMIN_KEUANGAN', 'ADMIN'] },
                { name: 'Manajemen User', to: '/dashboard/users', icon: Users, roles: ['DIRECTOR', 'ADMIN'] },
                { name: 'Notifikasi', to: '/dashboard/notification-settings', icon: MessageSquare, roles: ['DIRECTOR', 'ADMIN'] },
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
                        <div className="px-4 py-4 border-b border-glass-border flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100 overflow-hidden shrink-0 shadow-sm">
                                {user.avatar_url ? (
                                    <img 
                                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL}${user.avatar_url}`} 
                                        alt={user.full_name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserCircle className="w-6 h-6 text-brand-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{user.full_name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{roleName.replace(/_/g, ' ')}</p>
                            </div>
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
