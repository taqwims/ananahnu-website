import { useState, useEffect, useMemo } from 'react';
import { 
    Search, 
    Loader2, 
    Monitor,
    Clock,
    User,
    ArrowUpRight,
    ChevronDown,
    Layers,
    BarChart3,
    Activity,
    Briefcase,
    Zap
} from 'lucide-react';
import api from '../../services/api';
import type { Submission } from '../../types';
import { formatServiceType } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STATUS_PROGRESS: Record<string, { label: string, color: string, percent: number }> = {
    DRAFTER: { label: 'Pengerjaan Drafter', color: 'bg-purple-500', percent: 25 },
    QC_REVIEW: { label: 'Review QC', color: 'bg-blue-500', percent: 50 },
    SIDANG_FATWA: { label: 'Sidang Fatwa', color: 'bg-brand-500', percent: 75 },
    SH_TERBIT: { label: 'Selesai (SH Terbit)', color: 'bg-emerald-500', percent: 100 },
};

type TabType = 'ongoing' | 'completed';
type ServiceFilter = 'ALL' | 'REGULER' | 'SELF_DECLARE';

export default function DrafterMonitoring() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('ongoing');
    const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('ALL');
    const [expandedDrafters, setExpandedDrafters] = useState<Record<string, boolean>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions');
            const allSub = res.data || [];
            setSubmissions(allSub.filter((s: any) => (s as any).assigned_drafter_id));
        } catch (err) {
            console.error('Failed to load monitoring data:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const ongoing = submissions.filter(s => s.status !== 'SH_TERBIT');
        const completed = submissions.filter(s => s.status === 'SH_TERBIT');
        
        return {
            total: submissions.length,
            ongoing: ongoing.length,
            completed: completed.length,
            reguler: submissions.filter(s => s.service_type === 'REGULER').length,
            selfDeclare: submissions.filter(s => s.service_type !== 'REGULER').length,
            drafterActive: new Set(ongoing.map(s => (s as any).assigned_drafter_id)).size,
        };
    }, [submissions]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            const matchesTab = activeTab === 'completed' ? s.status === 'SH_TERBIT' : s.status !== 'SH_TERBIT';
            const isReguler = s.service_type === 'REGULER';
            const matchesService = serviceFilter === 'ALL' || 
                                (serviceFilter === 'REGULER' && isReguler) || 
                                (serviceFilter === 'SELF_DECLARE' && !isReguler);
            
            const searchLower = search.toLowerCase();
            const matchesSearch = s.client?.business_name.toLowerCase().includes(searchLower) ||
                                s.client?.client_name?.toLowerCase().includes(searchLower) ||
                                (s as any).assigned_drafter?.full_name.toLowerCase().includes(searchLower);

            return matchesTab && matchesService && matchesSearch;
        });
    }, [submissions, activeTab, serviceFilter, search]);

    const groupedByDrafter = useMemo(() => {
        const groups: Record<string, { 
            drafterID: string, 
            drafterName: string, 
            submissions: Submission[],
            analytics: {
                reguler: number,
                sd_mandiri: number,
                sd_gratis: number,
                total_sh: number
            }
        }> = {};
        
        filteredSubmissions.forEach(sub => {
            const drafter = (sub as any).assigned_drafter?.full_name || 'Tanpa Nama';
            const drafterID = (sub as any).assigned_drafter_id || 'unassigned';
            
            if (!groups[drafterID]) {
                // Calculate historical SH stats for this drafter from ALL submissions (not just filtered)
                const drafterSubmissions = submissions.filter(s => (s as any).assigned_drafter_id === drafterID && s.status === 'SH_TERBIT');
                
                groups[drafterID] = { 
                    drafterID, 
                    drafterName: drafter, 
                    submissions: [],
                    analytics: {
                        reguler: drafterSubmissions.filter(s => s.service_type === 'REGULER').length,
                        sd_mandiri: drafterSubmissions.filter(s => s.service_type === 'SELF_DECLARE_MANDIRI').length,
                        sd_gratis: drafterSubmissions.filter(s => s.service_type === 'SELF_DECLARE').length,
                        total_sh: drafterSubmissions.length
                    }
                };
            }
            groups[drafterID].submissions.push(sub);
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [filteredSubmissions, submissions]);

    const toggleDrafter = (id: string) => {
        setExpandedDrafters(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-2xl">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-600 rounded-2xl shadow-xl shadow-brand-100">
                                <Monitor className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Drafter Analytics</h1>
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                    <Activity className="w-3 h-3" />
                                    <span>Monitoring Beban Kerja & Performa</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                        <AnalyticCard label="Total Tugas" value={stats.total} icon={Layers} color="bg-brand-50 text-brand-600" />
                        <AnalyticCard label="On Going" value={stats.ongoing} icon={Clock} color="bg-amber-50 text-amber-600" />
                        <AnalyticCard label="Self Declare" value={stats.selfDeclare} icon={Zap} color="bg-purple-50 text-purple-600" />
                        <AnalyticCard label="Reguler" value={stats.reguler} icon={Briefcase} color="bg-blue-50 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                {/* Tabs */}
                <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full sm:w-fit">
                    <TabButton active={activeTab === 'ongoing'} label="Sedang Berjalan" count={stats.ongoing} onClick={() => setActiveTab('ongoing')} />
                    <TabButton active={activeTab === 'completed'} label="Telah Selesai" count={stats.completed} onClick={() => setActiveTab('completed')} />
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Cari Drafter atau Nama Bisnis..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <FilterButton active={serviceFilter === 'ALL'} label="Semua" onClick={() => setServiceFilter('ALL')} />
                        <FilterButton active={serviceFilter === 'REGULER'} label="Reguler" onClick={() => setServiceFilter('REGULER')} />
                        <FilterButton active={serviceFilter === 'SELF_DECLARE'} label="Self Declare" onClick={() => setServiceFilter('SELF_DECLARE')} />
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {groupedByDrafter.length === 0 ? (
                    <div className="lg:col-span-2 glass-panel p-20 text-center text-gray-400">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium italic">Tidak ada data pengerjaan yang sesuai dengan filter</p>
                    </div>
                ) : (
                    groupedByDrafter.map((group, gIdx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gIdx * 0.05 }}
                            key={group.drafterID} 
                            className="glass-panel p-6 border border-white/40 shadow-xl flex flex-col h-full hover:shadow-2xl hover:border-brand-100 transition-all group/card"
                        >
                                <div 
                                    className="flex items-center justify-between mb-2 cursor-pointer group/header"
                                    onClick={() => toggleDrafter(group.drafterID)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover/card:scale-110 transition-transform">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                             <h3 className="text-xl font-black text-gray-800 tracking-tight">{group.drafterName}</h3>
                                             <div className="flex items-center gap-2">
                                                 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.submissions.length} Pengajuan Aktif</p>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <div className="hidden sm:flex flex-col items-end px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                             <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Total SH Terbit</span>
                                             <span className="text-sm font-black text-emerald-700 leading-none">{group.analytics.total_sh}</span>
                                         </div>
                                         <div className={`p-2.5 rounded-xl transition-all ${expandedDrafters[group.drafterID] ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
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
                                             className="overflow-hidden"
                                         >
                                             <div className="pt-6 space-y-4">
                                                 {/* Per-Drafter Analytics Breakdown */}
                                                 <div className="grid grid-cols-3 gap-2 pb-4 border-b border-gray-50">
                                                     <DrafterStat label="Reguler" value={group.analytics.reguler} color="text-blue-600" bg="bg-blue-50" />
                                                     <DrafterStat label="SD Mandiri" value={group.analytics.sd_mandiri} color="text-purple-600" bg="bg-purple-50" />
                                                     <DrafterStat label="SD Gratis" value={group.analytics.sd_gratis} color="text-emerald-600" bg="bg-emerald-50" />
                                                 </div>
                                                {group.submissions.map(sub => {
                                                    const progress = STATUS_PROGRESS[sub.status] || { label: sub.status, color: 'bg-gray-400', percent: 0 };
                                                    const isReguler = sub.service_type === 'REGULER';
                                                    return (
                                                        <div key={sub.id} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all group/item relative overflow-hidden">
                                                            <div className={`absolute top-0 right-0 w-1 h-full ${isReguler ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${isReguler ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                            {formatServiceType(sub.service_type)}
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-gray-400">#{sub.id.split('-')[0]}</span>
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-800 leading-tight pr-8">{sub.client?.business_name}</h4>
                                                                    <p className="text-[10px] text-gray-500 font-medium">{sub.client?.client_name || 'Tanpa Nama Klien'}</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                                                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                                                >
                                                                    <ArrowUpRight className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                                    <span className="text-gray-400">{progress.label}</span>
                                                                    <span className="text-brand-600">{progress.percent}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${progress.percent}%` }}
                                                                        className={`h-full ${progress.color} rounded-full shadow-sm`}
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
                                    <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                                        <div className="flex -space-x-3 overflow-hidden">
                                            {group.submissions.slice(0, 4).map((s, i) => (
                                                <div key={s.id} className={`inline-block h-8 w-8 rounded-full ring-4 ring-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${s.service_type === 'REGULER' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                                    {i + 1}
                                                </div>
                                            ))}
                                            {group.submissions.length > 4 && (
                                                <div className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">
                                                    +{group.submissions.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => toggleDrafter(group.drafterID)}
                                            className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-colors"
                                        >
                                            Lihat List Pekerjaan
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

function AnalyticCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className={`p-4 rounded-[1.75rem] ${color} transition-all hover:scale-105 duration-300`}>
            <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
                <p className="text-2xl font-black">{value}</p>
            </div>
        </div>
    );
}

function TabButton({ active, label, count, onClick }: { active: boolean, label: string, count: number, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                active ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            {label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {count}
            </span>
        </button>
    );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                active ? 'bg-gray-100 text-brand-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
            {label}
        </button>
    );
}

function DrafterStat({ label, value, color, bg }: { label: string, value: number, color: string, bg: string }) {
    return (
        <div className={`p-2 rounded-xl ${bg} flex flex-col items-center justify-center border border-white/50`}>
            <span className={`text-[11px] font-black ${color}`}>{value}</span>
            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
    );
}
