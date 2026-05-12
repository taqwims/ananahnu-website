import { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    FileText, 
    CheckCircle, 
    Search, 
    Loader2, 
    UserPlus,
    Layers,
    LayoutGrid,
    Clock,
    Briefcase,
    ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import type { Submission, User } from '../../types';
import { formatServiceType } from '../../utils/format';
import { motion } from 'framer-motion';

export default function DistributionAdmin() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [drafters, setDrafters] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIDs, setSelectedIDs] = useState<string[]>([]);
    const [selectedDrafter, setSelectedDrafter] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subRes, drafterRes] = await Promise.all([
                api.get('/submissions', { params: { status: 'QC_OFFICER' } }),
                api.get('/admin/users/drafters')
            ]);
            setSubmissions(subRes.data || []);
            setDrafters(drafterRes.data || []);
        } catch (err) {
            console.error('Failed to load distribution data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIDs(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAssign = async () => {
        if (!selectedDrafter) {
            alert('Silakan pilih Drafter terlebih dahulu');
            return;
        }
        if (selectedIDs.length === 0) return;

        const drafterName = drafters.find(d => d.id === selectedDrafter)?.full_name;
        if (!confirm(`Distribusikan ${selectedIDs.length} pengajuan ke ${drafterName}?`)) return;

        setAssigning(true);
        try {
            await api.post('/submissions/bulk-assign-drafter', {
                ids: selectedIDs,
                drafter_id: selectedDrafter
            });
            setSelectedIDs([]);
            setSelectedDrafter('');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal mendistribusikan data');
        } finally {
            setAssigning(false);
        }
    };

    // Grouping Logic
    const groupedData = useMemo(() => {
        const filtered = submissions.filter(s => 
            s.client?.business_name.toLowerCase().includes(search.toLowerCase()) ||
            s.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.client?.facilitator?.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.client?.facilitator?.leader?.full_name.toLowerCase().includes(search.toLowerCase())
        );

        const groups: Record<string, { submissions: Submission[], coordinator: string }> = {};
        
        filtered.forEach(sub => {
            const coord = sub.client?.facilitator?.leader?.full_name || sub.client?.facilitator?.full_name || 'Umum';
            if (!groups[coord]) {
                groups[coord] = { coordinator: coord, submissions: [] };
            }
            groups[coord].submissions.push(sub);
        });

        return Object.values(groups).sort((a, b) => b.submissions.length - a.submissions.length);
    }, [submissions, search]);

    const stats = useMemo(() => {
        return {
            total: submissions.length,
            reguler: submissions.filter(s => s.service_type === 'REGULER').length,
            selfDeclare: submissions.filter(s => s.service_type !== 'REGULER').length,
            coordinators: new Set(submissions.map(s => s.client?.facilitator?.leader?.id || s.client?.facilitator?.id)).size
        };
    }, [submissions]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-gray-500 font-medium animate-pulse">Menyiapkan data distribusi...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-brand-900 rounded-3xl p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Layers className="w-6 h-6 text-brand-200" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">Antrian Distribusi Data</h1>
                        </div>
                        <p className="text-brand-100/80 max-w-md">
                            Kelola pembagian tugas dari Konsultan ke Drafter. Gunakan bulk action untuk efisiensi distribusi.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
                        <StatItem icon={FileText} label="Total" value={stats.total} color="bg-white/10" />
                        <StatItem icon={LayoutGrid} label="Reguler" value={stats.reguler} color="bg-blue-500/20" />
                        <StatItem icon={Briefcase} label="Self Declare" value={stats.selfDeclare} color="bg-purple-500/20" />
                        <StatItem icon={Users} label="Team" value={stats.coordinators} color="bg-amber-500/20" />
                    </div>
                </div>
            </div>

            {/* Control Bar (Sticky) */}
            <div className="sticky top-4 z-30 glass-panel p-4 shadow-xl border border-white/40 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[300px] relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Cari Bisnis, Klien, Konsultan, atau Koordinator..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:block text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Drafter</p>
                        <p className="text-xs text-gray-500">{selectedIDs.length} data terpilih</p>
                    </div>
                    <select 
                        className="glass-input py-2.5 text-sm w-56 border-brand-100"
                        value={selectedDrafter}
                        onChange={e => setSelectedDrafter(e.target.value)}
                    >
                        <option value="">-- Pilih Drafter --</option>
                        {drafters.map(d => (
                            <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleBulkAssign}
                        disabled={assigning || selectedIDs.length === 0 || !selectedDrafter}
                        className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 disabled:opacity-30 disabled:shadow-none transition-all flex items-center gap-2"
                    >
                        {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Ditribusikan
                    </button>
                </div>
            </div>

            {/* Grouped Content */}
            <div className="space-y-10">
                {groupedData.length === 0 ? (
                    <div className="glass-panel p-20 text-center text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">Tidak ada data yang cocok dengan kriteria pencarian</p>
                    </div>
                ) : (
                    groupedData.map((group, gIdx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gIdx * 0.05 }}
                            key={group.coordinator} 
                            className="space-y-4"
                        >
                            {/* Group Header */}
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-black">
                                    {group.coordinator.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight">{group.coordinator}</h3>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{group.submissions.length} Pengajuan</p>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                            </div>

                            {/* Group Table */}
                            <div className="glass-panel overflow-hidden border border-white/40 shadow-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 w-12 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                    checked={group.submissions.every(s => selectedIDs.includes(s.id))}
                                                    onChange={() => {
                                                        const groupIDs = group.submissions.map(s => s.id);
                                                        const allIn = groupIDs.every(id => selectedIDs.includes(id));
                                                        if (allIn) {
                                                            setSelectedIDs(prev => prev.filter(id => !groupIDs.includes(id)));
                                                        } else {
                                                            setSelectedIDs(prev => Array.from(new Set([...prev, ...groupIDs])));
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Bisnis & Klien</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Konsultan</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelengkapan Data</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {group.submissions.map(sub => (
                                            <tr key={sub.id} className={`group hover:bg-brand-50/30 transition-all ${selectedIDs.includes(sub.id) ? 'bg-brand-50/50' : ''}`}>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                                        checked={selectedIDs.includes(sub.id)}
                                                        onChange={() => toggleSelection(sub.id)}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-800 group-hover:text-brand-700 transition-colors">{sub.client?.business_name}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">{sub.client?.client_name || 'Tanpa Nama Klien'}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                                            sub.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {formatServiceType(sub.service_type)}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-mono">ID: {sub.id.substring(0, 8)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            {sub.client?.facilitator?.full_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-700">{sub.client?.facilitator?.full_name}</div>
                                                            <div className="text-[10px] text-gray-400">Halal Konsultan</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {sub.client?.nib && !sub.client.nib.startsWith('DRAFT-') ? (
                                                        <div className="flex items-center gap-1.5 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-xs font-bold">NIB Valid</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-amber-500">
                                                            <Clock className="w-4 h-4" />
                                                            <span className="text-xs font-bold italic">NIB Pending</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs text-gray-600 font-medium">
                                                        {new Date(sub.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {new Date(sub.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <a 
                                                        href={`/dashboard/submissions/${sub.id}`} 
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-black text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Review Detail <ChevronRight className="w-3 h-3" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    return (
        <div className={`p-4 rounded-2xl backdrop-blur-md ${color} border border-white/10 flex items-center gap-3`}>
            <div className="p-2 bg-white/10 rounded-lg">
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black">{value}</p>
            </div>
        </div>
    );
}
