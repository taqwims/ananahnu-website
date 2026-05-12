import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Filter,
    Eye,
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    Plus,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    FileText,
    LayoutGrid,
    CheckCircle2,
    XCircle,
    Loader2,
    Calendar,
    Briefcase,
    Users,
    User,
    ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import type { Submission } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { formatServiceType } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';

// Map status to colors
const STATUS_CONFIG: Record<string, { color: string, icon: any }> = {
    DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Clock },
    VERVAL_PENDAMPING: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    QC_OFFICER: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    DRAFTER: { color: 'bg-purple-100 text-purple-700', icon: FileText },
    QC_REVIEW: { color: 'bg-indigo-100 text-indigo-700', icon: Eye },
    SIDANG_FATWA: { color: 'bg-violet-100 text-violet-700', icon: LayoutGrid },
    SH_TERBIT: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle },
    REVISION: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

type SortKey = 'business_name' | 'service_type' | 'status' | 'created_at' | 'consultant' | 'coordinator';
type SortOrder = 'asc' | 'desc';

export default function SubmissionList() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isGrouped, setIsGrouped] = useState(true); // Default grouped
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSub, setNewSub] = useState({ businessName: '', serviceType: 'SELF_DECLARE' });

    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data || []);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const filteredData = useMemo(() => {
        return submissions.filter(s => {
            const matchSearch = s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
                s.id.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.facilitator?.full_name.toLowerCase().includes(search.toLowerCase()) ||
                s.client?.facilitator?.leader?.full_name.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === '' || s.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [submissions, search, statusFilter]);

    const groupedData = useMemo(() => {
        const groups: Record<string, { coordinator: string, submissions: Submission[] }> = {};

        filteredData.forEach(sub => {
            const coord = sub.client?.facilitator?.leader?.full_name || sub.client?.facilitator?.full_name || 'Umum / Tanpa Koordinator';
            if (!groups[coord]) {
                groups[coord] = { coordinator: coord, submissions: [] };
            }
            groups[coord].submissions.push(sub);
        });

        // Sort each group's submissions
        Object.values(groups).forEach(group => {
            group.submissions.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';
                if (sortKey === 'business_name') {
                    valA = a.client?.business_name.toLowerCase() || '';
                    valB = b.client?.business_name.toLowerCase() || '';
                } else if (sortKey === 'consultant') {
                    valA = a.client?.facilitator?.full_name.toLowerCase() || '';
                    valB = b.client?.facilitator?.full_name.toLowerCase() || '';
                } else {
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
                }
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [filteredData, sortKey, sortOrder]);

    const stats = useMemo(() => {
        return {
            total: submissions.length,
            pending: submissions.filter(s => s.status !== 'SH_TERBIT' && s.status !== 'REJECTED').length,
            completed: submissions.filter(s => s.status === 'SH_TERBIT').length,
            rejected: submissions.filter(s => s.status === 'REJECTED').length
        };
    }, [submissions]);

    const handleCreate = () => {
        navigate(`/dashboard/submissions/new?type=${newSub.serviceType}&name=${newSub.businessName}`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-brand-600 rounded-2xl shadow-lg shadow-brand-200">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        Daftar Pengajuan
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Kelola dan pantau status sertifikasi halal Anda</p>
                </div>

                {user?.role !== 'DRAFTER' && user?.role !== 'QC_OFFICER' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="group relative px-6 py-3 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-100 hover:scale-[1.02] transition-all flex items-center gap-2 overflow-hidden"
                    >
                        <Plus className="w-5 h-5" />
                        Buat Pengajuan Baru
                    </button>
                )}
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Pengajuan" value={stats.total} icon={FileText} color="text-brand-600" bg="bg-brand-50" />
                <StatCard label="Dalam Proses" value={stats.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard label="Selesai (SH Terbit)" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Ditolak" value={stats.rejected} icon={XCircle} color="text-red-600" bg="bg-red-50" />
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* Search & Filters */}
                <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between shadow-lg border border-white/40">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari Bisnis, Nama Klien, Konsultan..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/50 rounded-xl border border-gray-100">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Semua Status</option>
                                {Object.keys(STATUS_CONFIG).map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => setIsGrouped(!isGrouped)}
                            className={`p-2.5 rounded-xl border transition-all ${isGrouped ? 'bg-brand-600 text-white border-brand-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-brand-300'}`}
                            title={isGrouped ? "Nonaktifkan Pengelompokan" : "Aktifkan Pengelompokan"}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Data Table / List */}
                <div className="space-y-10">
                    {loading ? (
                        <div className="glass-panel p-20 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
                            <p className="mt-4 text-gray-500 font-medium">Memuat data pengajuan...</p>
                        </div>
                    ) : (isGrouped ? groupedData : [{ coordinator: 'Semua Pengajuan', submissions: filteredData }]).map((group, gIdx) => (
                        <div key={group.coordinator} className="space-y-4">
                            {/* Group Header */}
                            {isGrouped && (
                                <div
                                    className="flex items-center gap-4 px-2 cursor-pointer group/header"
                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [group.coordinator]: !prev[group.coordinator] }))}
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-black group-hover/header:bg-brand-200 transition-colors">
                                        {group.coordinator.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.coordinator}</h3>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{group.submissions.length} Pengajuan</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-px w-24 sm:w-48 bg-gradient-to-r from-gray-200 to-transparent"></div>
                                        <div className={`p-1.5 rounded-lg transition-colors ${expandedGroups[group.coordinator] ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedGroups[group.coordinator] ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {(expandedGroups[group.coordinator] || !isGrouped) && (
                                    <motion.div
                                        initial={isGrouped ? { height: 0, opacity: 0 } : false}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="glass-panel overflow-hidden border border-white/40 shadow-xl">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                                        <tr>
                                                            <th onClick={() => handleSort('business_name')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors w-[30%]">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    Bisnis & Layanan <SortIcon currentKey="business_name" activeKey={sortKey} order={sortOrder} />
                                                                </div>
                                                            </th>
                                                            <th onClick={() => handleSort('consultant')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    Konsultan <SortIcon currentKey="consultant" activeKey={sortKey} order={sortOrder} />
                                                                </div>
                                                            </th>
                                                            <th onClick={() => handleSort('status')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    Status <SortIcon currentKey="status" activeKey={sortKey} order={sortOrder} />
                                                                </div>
                                                            </th>
                                                            <th onClick={() => handleSort('created_at')} className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    Tgl Input <SortIcon currentKey="created_at" activeKey={sortKey} order={sortOrder} />
                                                                </div>
                                                            </th>
                                                            <th className="p-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {group.submissions.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="p-12 text-center text-gray-400 italic text-sm">Tidak ada data</td>
                                                            </tr>
                                                        ) : (
                                                            group.submissions.map((sub, idx) => (
                                                                <motion.tr
                                                                    initial={{ opacity: 0, y: 5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.02 }}
                                                                    key={sub.id}
                                                                    className="group hover:bg-brand-50/30 transition-all cursor-pointer"
                                                                    onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                                >
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700 font-black text-sm group-hover:scale-110 transition-transform shadow-sm">
                                                                                {sub.client?.business_name?.charAt(0) || '?'}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-gray-800 group-hover:text-brand-700 transition-colors">{sub.client?.business_name}</div>
                                                                                <div className="text-[10px] text-gray-500 font-medium">{sub.client?.client_name || 'Tanpa Nama Klien'}</div>
                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${sub.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                                                        }`}>
                                                                                        {formatServiceType(sub.service_type)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                                <User className="w-3 h-3" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-bold text-gray-700">{sub.client?.facilitator?.full_name}</div>
                                                                                <div className="text-[10px] text-gray-400 font-medium">Konsultan</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <StatusBadge status={sub.status} />
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="text-xs text-gray-600 font-medium">
                                                                            {new Date(sub.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-400">
                                                                            {new Date(sub.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-right">
                                                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white group-hover:bg-brand-600 group-hover:text-white text-gray-400 shadow-sm transition-all border border-gray-100">
                                                                            <ChevronRight className="w-4 h-4" />
                                                                        </div>
                                                                    </td>
                                                                </motion.tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Create (Tetap sama namun dirapikan sedikit) */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-brand-900 p-8 text-white">
                                <h3 className="text-2xl font-black tracking-tight">Mulai Pengajuan</h3>
                                <p className="text-brand-200 text-sm mt-1">Lengkapi data dasar untuk memulai proses sertifikasi</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Usaha / Produk</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                                        placeholder="Contoh: Katering Berkah"
                                        value={newSub.businessName}
                                        onChange={e => setNewSub({ ...newSub, businessName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Layanan</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                                        value={newSub.serviceType}
                                        onChange={e => setNewSub({ ...newSub, serviceType: e.target.value })}
                                    >
                                        <option value="SELF_DECLARE">Self Declare Fasilitasi (Gratis)</option>
                                        <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                                        <option value="REGULER">Reguler</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors" onClick={() => setShowCreateModal(false)}>Batal</button>
                                    <button onClick={handleCreate} disabled={!newSub.businessName} className="flex-[2] py-3 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-100 hover:bg-brand-700 disabled:opacity-30 transition-all">Lanjut ke Form</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string, value: number, icon: any, color: string, bg: string }) {
    return (
        <div className="glass-panel p-5 flex items-center gap-4 border border-white/60 shadow-md">
            <div className={`p-3 ${bg} rounded-2xl`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-black text-gray-900`}>{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-600', icon: Clock };
    const Icon = config.icon;
    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${config.color} shadow-sm border border-black/5`}>
            <Icon className="w-3 h-3" />
            {status.replace(/_/g, ' ')}
        </div>
    );
}

function SortIcon({ currentKey, activeKey, order }: { currentKey: string, activeKey: string, order: 'asc' | 'desc' }) {
    if (currentKey !== activeKey) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return order === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600" /> : <ArrowDown className="w-3 h-3 text-brand-600" />;
}
