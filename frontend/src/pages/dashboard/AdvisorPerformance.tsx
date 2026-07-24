import { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Filter, 
    Calendar, 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Loader2,
    RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AdvisorPerformance {
    advisor_id: string;
    advisor_name: string;
    email: string;
    phone: string;
    manager_id?: string;
    manager_name: string;
    self_declare_count: number;
    reguler_count: number;
    total_clients: number;
    productivity_status: 'produktif' | 'Aktif' | 'pasif' | string;
}

export default function AdvisorPerformance() {
    const [performances, setPerformances] = useState<AdvisorPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [managerFilter, setManagerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const fetchPerformance = async () => {
        setLoading(true);
        try {
            const params: any = { period };
            if (managerFilter) params.manager_id = managerFilter;
            const res = await api.get('/consultant/advisor-performance', { params });
            setPerformances(res.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal memuat data performa Halal Advisor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, [period, managerFilter]);

    // Extract unique manager names for dropdown
    const uniqueManagers = useMemo(() => {
        const managersMap = new Map<string, string>();
        performances.forEach(p => {
            if (p.manager_id && p.manager_name && p.manager_name !== '-') {
                managersMap.set(p.manager_id, p.manager_name);
            }
        });
        return Array.from(managersMap.entries()).map(([id, name]) => ({ id, name }));
    }, [performances]);

    // Filtered data
    const filteredPerformances = useMemo(() => {
        return performances.filter(p => {
            const matchSearch = 
                (p.advisor_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.manager_name || '').toLowerCase().includes(search.toLowerCase());
            
            const matchStatus = !statusFilter || p.productivity_status.toLowerCase() === statusFilter.toLowerCase();
            return matchSearch && matchStatus;
        });
    }, [performances, search, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = performances.length;
        const produktif = performances.filter(p => p.productivity_status.toLowerCase() === 'produktif').length;
        const aktif = performances.filter(p => p.productivity_status.toLowerCase() === 'aktif').length;
        const pasif = performances.filter(p => p.productivity_status.toLowerCase() === 'pasif').length;
        return { total, produktif, aktif, pasif };
    }, [performances]);

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'produktif') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Produktif
                </span>
            );
        }
        if (s === 'aktif') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Aktif
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Pasif
            </span>
        );
    };

    return (
        <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-2xl text-brand-600 shadow-xs">
                            <Users className="w-6 h-6" />
                        </div>
                        Performa Halal Advisor
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        Evaluasi tingkat produktivitas dan keaktifan Halal Advisor berdasarkan tim Halal Manager.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-xs">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <select 
                            value={period} 
                            onChange={e => setPeriod(e.target.value)} 
                            className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
                        >
                            <option value="">Semua Periode</option>
                            <option value={new Date().toISOString().slice(0, 7)}>Bulan Ini ({new Date().toISOString().slice(0, 7)})</option>
                        </select>
                        <input 
                            type="month" 
                            value={period} 
                            onChange={e => setPeriod(e.target.value)} 
                            className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer border-l border-gray-200 pl-2"
                        />
                    </div>
                    <button 
                        onClick={fetchPerformance} 
                        className="p-2.5 bg-white hover:bg-gray-50 text-gray-600 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-xs"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 bg-white/70 border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Advisor</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total}</h3>
                    </div>
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-xl border border-brand-100">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="glass-panel p-5 bg-white/70 border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Produktif</p>
                        <h3 className="text-2xl font-black text-emerald-900 mt-1">{stats.produktif}</h3>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">&gt; 10 SD atau &gt; 1 Reguler</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                <div className="glass-panel p-5 bg-white/70 border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Aktif</p>
                        <h3 className="text-2xl font-black text-blue-900 mt-1">{stats.aktif}</h3>
                        <p className="text-[10px] text-blue-600 font-bold mt-0.5">1-10 SD atau 1 Reguler</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="glass-panel p-5 bg-white/70 border border-gray-100 shadow-sm rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pasif</p>
                        <h3 className="text-2xl font-black text-gray-700 mt-1">{stats.pasif}</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">0 Klien Bulan Ini</p>
                    </div>
                    <div className="p-3 bg-gray-100 text-gray-500 rounded-xl border border-gray-200">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter & Table Bar */}
            <div className="glass-panel p-6 shadow-xl border border-white/50 bg-white/80 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input 
                            type="text"
                            placeholder="Cari nama advisor, email, atau manager..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                            <select
                                value={managerFilter}
                                onChange={e => setManagerFilter(e.target.value)}
                                className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                <option value="">Semua Halal Manager</option>
                                {uniqueManagers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20"
                        >
                            <option value="">Semua Status</option>
                            <option value="produktif">Produktif</option>
                            <option value="aktif">Aktif</option>
                            <option value="pasif">Pasif</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-150 shadow-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-150 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-4 py-3.5">Halal Advisor</th>
                                <th className="px-4 py-3.5">Halal Manager (Tim)</th>
                                <th className="px-4 py-3.5 text-center">Self Declare</th>
                                <th className="px-4 py-3.5 text-center">Reguler</th>
                                <th className="px-4 py-3.5 text-center">Total Klien</th>
                                <th className="px-4 py-3.5 text-right">Status Performa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500 font-bold">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                                            <span>Memuat data performa Halal Advisor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPerformances.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <span>Tidak ada data Halal Advisor ditemukan</span>
                                    </td>
                                </tr>
                            ) : (
                                filteredPerformances.map(p => (
                                    <tr key={p.advisor_id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3.5 font-bold text-gray-800">
                                            <div className="font-bold text-gray-900">{p.advisor_name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono font-medium">{p.email || '-'} {p.phone ? `(${p.phone})` : ''}</div>
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-brand-700">
                                            {p.manager_name}
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-bold text-gray-700">
                                            <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-mono">{p.self_declare_count}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-bold text-gray-700">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-mono">{p.reguler_count}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-black text-gray-900 text-sm">
                                            {p.total_clients}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            {getStatusBadge(p.productivity_status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
