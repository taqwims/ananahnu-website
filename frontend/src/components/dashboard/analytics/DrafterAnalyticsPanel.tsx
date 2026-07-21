import { useState, useEffect } from 'react';
import { Calendar, FileCheck, FileX, BarChart3, Loader2 } from 'lucide-react';
import api from '../../../services/api';

interface DrafterStat {
    month: string;
    drafter_id: string;
    drafter_name: string;
    new_submissions_count: number;
    returned_submissions_count: number;
    total_processed: number;
}

export const DrafterAnalyticsPanel = () => {
    const [stats, setStats] = useState<DrafterStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await api.get('/submissions/analytics/drafter-monthly');
                setStats(res.data || []);
            } catch (err) {
                console.error('Failed to load drafter analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const months = Array.from(new Set(stats.map(s => s.month))).sort().reverse();

    const filteredStats = selectedMonth === 'ALL' 
        ? stats 
        : stats.filter(s => s.month === selectedMonth);

    const totalNew = filteredStats.reduce((acc, curr) => acc + (curr.new_submissions_count || 0), 0);
    const totalReturned = filteredStats.reduce((acc, curr) => acc + (curr.returned_submissions_count || 0), 0);
    const totalAll = totalNew + totalReturned;

    return (
        <div className="glass-panel p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-brand-600" />
                        Analitik Pengerjaan Drafter
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Statistik bulanan pengerjaan Data Baru vs Data Pengembalian (Revisi)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <select
                        className="glass-input text-xs font-bold py-2 px-3"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    >
                        <option value="ALL">Semua Bulan</option>
                        {months.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Data Baru</span>
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-emerald-900 mt-2">{totalNew}</p>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                        {totalAll > 0 ? Math.round((totalNew / totalAll) * 100) : 0}% dari total pengerjaan
                    </p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Data Pengembalian</span>
                        <FileX className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-amber-900 mt-2">{totalReturned}</p>
                    <p className="text-[10px] font-semibold text-amber-600 mt-1">
                        {totalAll > 0 ? Math.round((totalReturned / totalAll) * 100) : 0}% dari total pengerjaan
                    </p>
                </div>

                <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Total Diproses</span>
                        <BarChart3 className="w-5 h-5 text-brand-600" />
                    </div>
                    <p className="text-3xl font-black text-brand-900 mt-2">{totalAll}</p>
                    <p className="text-[10px] font-semibold text-brand-600 mt-1">Berkas diselesaikan</p>
                </div>
            </div>

            {/* Detailed Table */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
            ) : filteredStats.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">Belum ada data pengerjaan drafter</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Bulan</th>
                                <th className="px-4 py-3">Nama Drafter</th>
                                <th className="px-4 py-3 text-center">Data Baru</th>
                                <th className="px-4 py-3 text-center">Data Pengembalian</th>
                                <th className="px-4 py-3 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStats.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/80 transition">
                                    <td className="px-4 py-3 font-mono text-gray-600 font-bold">{item.month}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{item.drafter_name}</td>
                                    <td className="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                                        {item.new_submissions_count}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-amber-600 bg-amber-50/30">
                                        {item.returned_submissions_count}
                                    </td>
                                    <td className="px-4 py-3 text-center font-black text-gray-900">
                                        {item.total_processed}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
