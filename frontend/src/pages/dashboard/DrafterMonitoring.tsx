import { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    CheckCircle2, 
    Search, 
    Loader2, 
    Monitor,
    Clock,
    User,
    ArrowUpRight,
    Eye,
    ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import type { Submission } from '../../types';
import { formatServiceType } from '../../utils/format';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const STATUS_PROGRESS: Record<string, { label: string, color: string, percent: number }> = {
    DRAFTER: { label: 'Pengerjaan Drafter', color: 'bg-purple-500', percent: 25 },
    QC_REVIEW: { label: 'Review QC', color: 'bg-blue-500', percent: 50 },
    SIDANG_FATWA: { label: 'Sidang Fatwa', color: 'bg-brand-500', percent: 75 },
    SH_TERBIT: { label: 'Selesai (SH Terbit)', color: 'bg-emerald-500', percent: 100 },
};

export default function DrafterMonitoring() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedDrafters, setExpandedDrafters] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all submissions that have been assigned to a drafter
            const res = await api.get('/submissions');
            const allSub = res.data || [];
            // Filter only those assigned to a drafter
            setSubmissions(allSub.filter((s: any) => s.assigned_drafter_id));
        } catch (err) {
            console.error('Failed to load monitoring data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Grouping by Drafter
    const groupedByDrafter = useMemo(() => {
        const filtered = submissions.filter(s => 
            s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
            s.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
            (s as any).assigned_drafter?.full_name.toLowerCase().includes(search.toLowerCase())
        );

        const groups: Record<string, { drafterID: string, drafterName: string, submissions: Submission[] }> = {};
        
        filtered.forEach(sub => {
            const drafter = (sub as any).assigned_drafter?.full_name || 'Tanpa Nama';
            const drafterID = (sub as any).assigned_drafter_id || 'unassigned';
            if (!groups[drafterID]) {
                groups[drafterID] = { drafterID, drafterName: drafter, submissions: [] };
            }
            groups[drafterID].submissions.push(sub);
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [submissions, search]);

    const toggleDrafter = (id: string) => {
        setExpandedDrafters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const stats = useMemo(() => {
        return {
            active: submissions.filter(s => s.status === 'DRAFTER').length,
            review: submissions.filter(s => s.status === 'QC_REVIEW').length,
            fatwa: submissions.filter(s => s.status === 'SIDANG_FATWA').length,
            completed: submissions.filter(s => s.status === 'SH_TERBIT').length,
        };
    }, [submissions]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium">Menghubungkan ke pemantauan...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Monitoring */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-brand-600 rounded-2xl shadow-lg shadow-brand-100">
                            <Monitor className="w-6 h-6 text-white" />
                        </div>
                        Monitoring Drafter
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Pantau progres pengerjaan data oleh tim Drafter</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <SummaryCard label="Pengerjaan" value={stats.active} icon={Clock} color="text-brand-600" />
                    <SummaryCard label="Review QC" value={stats.review} icon={Eye} color="text-brand-600" />
                    <SummaryCard label="Selesai" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" />
                </div>
            </div>

            {/* Search Bar */}
            <div className="glass-panel p-4 shadow-xl border border-white/40 group">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Cari Drafter atau Nama Bisnis..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {groupedByDrafter.length === 0 ? (
                    <div className="lg:col-span-2 glass-panel p-20 text-center text-gray-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">Belum ada data pengerjaan yang aktif</p>
                    </div>
                ) : (
                    groupedByDrafter.map((group, gIdx) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: gIdx * 0.05 }}
                            key={group.drafterName} 
                            className="glass-panel p-6 border border-white/40 shadow-xl flex flex-col h-full"
                        >
                                <div 
                                    className="flex items-center justify-between mb-2 cursor-pointer group/header"
                                    onClick={() => toggleDrafter(group.drafterID)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover/header:bg-brand-100 transition-colors">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.drafterName}</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.submissions.length} Pengajuan Ditangani</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:block p-2 bg-brand-50 rounded-lg text-brand-600 font-bold text-xs">
                                            DRAFTER TEAM
                                        </div>
                                        <div className={`p-2 rounded-xl transition-colors ${expandedDrafters[group.drafterID] ? 'bg-brand-100 text-brand-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedDrafters[group.drafterID] ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {expandedDrafters[group.drafterID] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 space-y-4">
                                                {group.submissions.map(sub => {
                                                    const progress = STATUS_PROGRESS[sub.status] || { label: sub.status, color: 'bg-gray-400', percent: 0 };
                                                    return (
                                                        <div key={sub.id} className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group/item">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <h4 className="font-bold text-gray-800 group-hover/item:text-brand-600 transition-colors">{sub.client?.business_name}</h4>
                                                                    <p className="text-[10px] text-gray-500 font-medium mb-1">{sub.client?.client_name || 'Tanpa Nama Klien'}</p>
                                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">{formatServiceType(sub.service_type)}</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                                    className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                                                >
                                                                    <ArrowUpRight className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                                    <span className="text-gray-500">{progress.label}</span>
                                                                    <span className="text-brand-600">{progress.percent}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${progress.percent}%` }}
                                                                        className={`h-full ${progress.color} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {!expandedDrafters[group.drafterID] && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {group.submissions.slice(0, 3).map((s, i) => (
                                                <div key={s.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-brand-100 flex items-center justify-center text-[8px] font-bold text-brand-600">
                                                    {i + 1}
                                                </div>
                                            ))}
                                            {group.submissions.length > 3 && (
                                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                                    +{group.submissions.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => toggleDrafter(group.drafterID)}
                                            className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className="bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/40 shadow-sm flex items-center gap-3">
            <Icon className={`w-4 h-4 ${color}`} />
            <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-black text-gray-800 leading-none">{value}</p>
            </div>
        </div>
    );
}
