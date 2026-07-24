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
    DollarSign,
    Monitor,
    Shield,
    TrendingUp,
    ShieldCheck,
    MessageSquare,
    UserCircle,
    BarChart3,
    Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { canAccess } from '../../config/rbac';
import Logo from '../ui/Logo';
import { formatRoleName } from '../../utils/format';

interface SidebarLink {
    name: string;
    /** Path relatif dari /dashboard/ — harus sama dengan key di PAGE_ROLES */
    pathKey: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroup {
    name: string;
    links: SidebarLink[];
}

const GROUPS: SidebarGroup[] = [
    {
        name: 'Main Menu',
        links: [
            { name: 'Dashboard',    pathKey: '',            to: '/dashboard',                    icon: LayoutDashboard },
            { name: 'Profil Saya',  pathKey: 'profile',     to: '/dashboard/profile',            icon: UserCircle },
            { name: 'Klien',        pathKey: 'clients',     to: '/dashboard/clients',            icon: Users },
            { name: 'Pengajuan',    pathKey: 'submissions', to: '/dashboard/submissions',        icon: FileText },
            { name: 'Tagihan Self Declare', pathKey: 'my-invoices', to: '/dashboard/my-invoices',        icon: CreditCard },
            { name: 'Estimasi Biaya', pathKey: 'estimasi',   to: '/dashboard/estimasi',           icon: DollarSign },
        ],
    },
    {
        name: 'Workflow',
        links: [
            { name: 'Distribusi Data',        pathKey: 'distribution',          to: '/dashboard/distribution',          icon: Users },
            { name: 'Monitoring Drafter',     pathKey: 'monitoring',            to: '/dashboard/monitoring',            icon: Monitor },
            { name: 'Ruang Kerja Drafter',    pathKey: 'drafter-workspace',     to: '/dashboard/drafter-workspace',     icon: ShieldCheck },
            { name: 'Ruang Kerja QC',         pathKey: 'qc-workspace',          to: '/dashboard/qc-workspace',          icon: ShieldCheck },
            { name: 'Penerbitan SH (Finance & Legal)', pathKey: 'sh-workspace', to: '/dashboard/sh-workspace',          icon: Award },
            { name: 'Jaringan Halal Advisor', pathKey: 'advisors',              to: '/dashboard/advisors',              icon: UsersRound },
            { name: 'Monitoring Draft',       pathKey: 'draft-monitoring',      to: '/dashboard/draft-monitoring',      icon: BarChart3 },
            { name: 'Profil Advisor',         pathKey: 'consultant-profile',    to: '/dashboard/consultant-profile',    icon: UserCheck },
            { name: 'Jenjang Karir',          pathKey: 'karir',                 to: '/dashboard/karir',                 icon: Award },
        ],
    },
    {
        name: 'Jaringan & Referral',
        links: [
            { name: 'Tim Saya',          pathKey: 'team',              to: '/dashboard/team',              icon: UsersRound },
            { name: 'Referral Saya',     pathKey: 'referrals',         to: '/dashboard/referrals',         icon: TrendingUp },
            { name: 'Analitik Referral', pathKey: 'admin-referrals',   to: '/dashboard/admin-referrals',   icon: TrendingUp },
            { name: 'Fee Referral',      pathKey: 'referral-fees',     to: '/dashboard/referral-fees',     icon: DollarSign },
        ],
    },
    {
        name: 'Operasional',
        links: [
            { name: 'Verifikasi Advisor',  pathKey: 'consultant-verification', to: '/dashboard/consultant-verification', icon: Shield },
            { name: 'Pelatihan',           pathKey: 'training',                to: '/dashboard/training',                icon: GraduationCap },
            { name: 'Pengajuan Promosi',   pathKey: 'admin-promosi',           to: '/dashboard/admin-promosi',           icon: Award },
            { name: 'Performa Advisor',    pathKey: 'advisor-performance',     to: '/dashboard/advisor-performance',     icon: TrendingUp },
        ],
    },
    {
        name: 'Pengaturan Sistem',
        links: [
            { name: 'Manajemen Billing', pathKey: 'billing',               to: '/dashboard/billing',               icon: Receipt },
            { name: 'Pengaturan Form',   pathKey: 'form-config',           to: '/dashboard/form-config',           icon: Settings },
            { name: 'Master Biaya',      pathKey: 'billing-config',        to: '/dashboard/billing-config',        icon: Receipt },
            { name: 'Manajemen User',    pathKey: 'users',                 to: '/dashboard/users',                 icon: Users },
            { name: 'Notifikasi',        pathKey: 'notification-settings', to: '/dashboard/notification-settings', icon: MessageSquare },
            { name: 'CMS',               pathKey: 'cms',                   to: '/dashboard/cms',                   icon: BookOpen },
        ],
    },
    {
        name: 'Keuangan',
        links: [
            { name: 'Dashboard Keuangan',  pathKey: 'finance',               to: '/dashboard/finance',               icon: Wallet },
            { name: 'Pengaturan Komisi dan Insentif', pathKey: 'fee-config',  to: '/dashboard/fee-config',           icon: DollarSign },
        ],
    },
    {
        name: 'Business Development',
        links: [
            { name: 'Dashboard BD',        pathKey: 'bizdev',                to: '/dashboard/bizdev',                icon: BarChart3 },
        ],
    },
];

interface SidebarProps {
    isOpen: boolean;
    toggle: () => void;
}

const Sidebar = ({ isOpen, toggle }: SidebarProps) => {
    const { user, logout } = useAuthStore();
    const role = user?.role || '';

    const handleLogout = () => {
        logout();
    };

    const getLinkName = (link: SidebarLink) => {
        const isHalalAgency = role === 'HALAL_ADVISOR' || role === 'HALAL_MANAGER' || role === 'HALAL_DIRECTOR';
        if (isHalalAgency) {
            if (link.pathKey === 'advisors') return 'Jaringan Halal Advisor';
            if (link.pathKey === 'referrals') return 'Insentif Saya';
        }
        return link.name;
    };

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggle}
                        className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                className={`
                    fixed inset-y-0 left-0 z-50 flex w-72 flex-col
                    border-r border-glass-border bg-white/80 backdrop-blur-md transition-all duration-300
                    lg:static lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex h-full flex-col">
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
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{formatRoleName(role)}</p>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                        {GROUPS.map((group) => {
                            // Filter link berdasarkan RBAC — hanya tampilkan yang boleh diakses
                            const visibleLinks = group.links.filter(l => canAccess(role, l.pathKey));
                            if (visibleLinks.length === 0) return null;

                            return (
                                <div key={group.name} className="mb-6 last:mb-0">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-4">
                                        {group.name}
                                    </p>
                                    <div className="space-y-1">
                                        {visibleLinks.map((link) => (
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
                                                <link.icon className="w-5 h-5" />
                                                <span className="truncate">{getLinkName(link)}</span>
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
                            onClick={handleLogout}
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
