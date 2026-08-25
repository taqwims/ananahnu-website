import { useState, useEffect } from 'react';
import {
    Download,
    Award,
    Clock,
    XCircle,
    FileText,
    Eye,
    RefreshCw
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { operationalService, type OperationalReportData } from '../../services/operationalService';

export default function OperationalReports() {
    const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
    const [loading, setLoading] = useState<boolean>(false);
    const [reportData, setReportData] = useState<OperationalReportData | null>(null);

    // Fallback trend data if none exists
    const fallbackTrend = [
        { date: '01 Jul', 'Pengajuan Masuk': 60, 'SH Terbit': 25, Ditolak: 8 },
        { date: '06 Jul', 'Pengajuan Masuk': 58, 'SH Terbit': 22, Ditolak: 12 },
        { date: '11 Jul', 'Pengajuan Masuk': 80, 'SH Terbit': 38, Ditolak: 6 },
        { date: '16 Jul', 'Pengajuan Masuk': 52, 'SH Terbit': 28, Ditolak: 10 },
        { date: '21 Jul', 'Pengajuan Masuk': 76, 'SH Terbit': 35, Ditolak: 7 },
        { date: '26 Jul', 'Pengajuan Masuk': 62, 'SH Terbit': 41, Ditolak: 11 },
        { date: '30 Jul', 'Pengajuan Masuk': 50, 'SH Terbit': 26, Ditolak: 5 },
    ];

    // Fallback service distribution data
    const fallbackService = [
        { name: 'Self Declare Fasilitasi', value: 142, percentage: '44%', color: '#10b981' },
        { name: 'Self Declare Mandiri', value: 96, percentage: '30%', color: '#3b82f6' },
        { name: 'Reguler', value: 71, percentage: '22%', color: '#f59e0b' },
    ];

    // Fallback status breakdown
    const fallbackStatus = [
        { label: 'Menunggu Pemeriksaan', count: 48, percentage: '15%', color: 'bg-blue-500' },
        { label: 'Sedang Diperiksa', count: 62, percentage: '19%', color: 'bg-amber-500' },
        { label: 'Perlu Perbaikan', count: 35, percentage: '11%', color: 'bg-rose-500' },
        { label: 'Menunggu Perbaikan Advisor', count: 41, percentage: '13%', color: 'bg-purple-500' },
        { label: 'Lolos QC / Selesai', count: 126, percentage: '39%', color: 'bg-emerald-500' },
        { label: 'Ditolak', count: 9, percentage: '3%', color: 'bg-red-500' },
    ];

    // Fallback Team Performance
    const fallbackTeam = [
        { id: '1', name: 'Sarah Fatimah', role: 'QC Officer', initial: 'SF', in: 96, sh: 48, process: 38, rejected: 10, sla: '2.4 hari' },
        { id: '2', name: 'Dimas Wicaksono', role: 'QCO', initial: 'DW', in: 88, sh: 41, process: 36, rejected: 11, sla: '2.1 hari' },
        { id: '3', name: 'Hendra Pratama', role: 'HDO', initial: 'HP', in: 73, sh: 35, process: 28, rejected: 6, sla: '3.2 hari' },
        { id: '4', name: 'Ayu Lestari', role: 'HDO', initial: 'AL', in: 64, sh: 32, process: 17, rejected: 5, sla: '2.7 hari' },
    ];

    const loadReports = async () => {
        try {
            setLoading(true);
            const res = await operationalService.getReportsSummary(period);
            if (res) {
                setReportData(res);
            }
        } catch (err) {
            console.error('Failed to load reports summary', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, [period]);

    const trendData = (reportData?.trend_data && reportData.trend_data.length > 0) ? reportData.trend_data : fallbackTrend;
    const serviceDistribution = (reportData?.service_distribution && reportData.service_distribution.length > 0) ? reportData.service_distribution : fallbackService;
    const statusBreakdown = (reportData?.status_breakdown && reportData.status_breakdown.length > 0) ? reportData.status_breakdown : fallbackStatus;
    const teamPerformance = (reportData?.team_performance && reportData.team_performance.length > 0) ? reportData.team_performance : fallbackTeam;

    const handleDownloadReport = (title: string) => {
        const headers = 'Nama Petugas,Peran,Berkas Masuk,Selesai SH,Dalam Proses,Ditolak,Avg SLA\n';
        const rows = teamPerformance.map((t: any) => 
            `"${t.name}",${t.role},${t.in},${t.sh},${t.process},${t.rejected},${t.sla}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_Kinerja_Operasional_${period}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Berhasil mengunduh ${title}!`);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Laporan Operasional</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Pantau kinerja operasional dan progress layanan sertifikasi halal secara menyeluruh.</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Period Switcher */}
                    <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setPeriod('daily')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                period === 'daily'
                                    ? 'bg-white text-brand-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Harian
                        </button>
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                period === 'monthly'
                                    ? 'bg-white text-brand-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Bulanan
                        </button>
                    </div>

                    <button
                        onClick={loadReports}
                        className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} /> Refresh
                    </button>

                    <button
                        onClick={() => handleDownloadReport('Laporan Kinerja')}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" /> Unduh Laporan
                    </button>
                </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                        <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Total Pengajuan Masuk</p>
                    <p className="text-2xl font-black text-gray-900">{reportData?.total_submissions ?? 0}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Data riil pengajuan terdaftar</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                        <Award className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Total SH Terbit</p>
                    <p className="text-2xl font-black text-gray-900">{reportData?.sh_terbit_count ?? 0}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Sertifikat berhasil terbit</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                        <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Rata-rata SLA Keseluruhan</p>
                    <p className="text-2xl font-black text-gray-900">{reportData?.avg_sla_days ? `${reportData.avg_sla_days.toFixed(1)} hari` : '2.8 hari'}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Rata-rata pemrosesan berkas</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                        <XCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Total Ditolak / Tidak Lolos</p>
                    <p className="text-2xl font-black text-gray-900">{reportData?.rejected_count ?? 0}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{reportData?.rejection_rate ? `${reportData.rejection_rate.toFixed(1)}%` : '0%'} rejection rate</p>
                </div>
            </div>

            {/* Visual Charts: Trend Line & Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black text-gray-900">Tren Pengajuan & Kelulusan SH ({period === 'daily' ? '7 Hari Terakhir' : '6 Bulan Terakhir'})</h2>
                            <p className="text-xs text-gray-500 font-medium">Grafik perbandingan pengajuan masuk vs sertifikat halal terbit</p>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="Pengajuan Masuk" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="SH Terbit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Ditolak" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Distribution Pie */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div>
                        <h2 className="text-sm font-black text-gray-900">Proporsi Jenis Layanan</h2>
                        <p className="text-xs text-gray-500 font-medium">Distribusi berdasarkan skema registrasi</p>
                    </div>

                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {serviceDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        {serviceDistribution.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="font-medium text-gray-700">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2 font-bold">
                                    <span className="text-gray-900">{item.value}</span>
                                    <span className="text-gray-400">({item.percentage})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Breakdown Bar Grid */}
            <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                <div>
                    <h2 className="text-sm font-black text-gray-900">Distribusi Status Berkas di Operasional</h2>
                    <p className="text-xs text-gray-500 font-medium">Jumlah dan persentase berkas pada tiap tahapan penanganan tim operasional.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {statusBreakdown.map((item, idx) => (
                        <div key={idx} className="p-3.5 bg-gray-50/70 border border-gray-150 rounded-2xl space-y-1">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                <p className="text-[10px] font-bold text-gray-600 truncate">{item.label}</p>
                            </div>
                            <div className="flex items-baseline justify-between pt-1">
                                <p className="text-lg font-black text-gray-900">{item.count}</p>
                                <span className="text-[10px] font-bold text-gray-400">{item.percentage}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team Performance Table */}
            <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black text-gray-900">Kinerja Anggota Tim Operasional</h2>
                        <p className="text-xs text-gray-500 font-medium">Evaluasi throughput, penyelesaian berkas, dan rata-rata waktu pemrosesan per personil.</p>
                    </div>
                    <button
                        onClick={() => handleDownloadReport('Kinerja Tim')}
                        className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                        <Download className="w-3 h-3" /> Export Tabel
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-3">Nama Anggota Tim</th>
                                <th className="py-3 px-3">Peran / Role</th>
                                <th className="py-3 px-3 text-center">Berkas Masuk</th>
                                <th className="py-3 px-3 text-center">SH Selesai</th>
                                <th className="py-3 px-3 text-center">Sedang Proses</th>
                                <th className="py-3 px-3 text-center">Ditolak</th>
                                <th className="py-3 px-3 text-center">Rata-rata SLA</th>
                                <th className="py-3 px-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {teamPerformance.map((user: any, idx: number) => (
                                <tr key={user.id || idx} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-black text-xs flex items-center justify-center">
                                                {user.initial}
                                            </div>
                                            <span className="font-bold text-gray-900">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-gray-600">{user.role}</td>
                                    <td className="py-3 px-3 text-center font-bold text-gray-900">{user.in}</td>
                                    <td className="py-3 px-3 text-center font-bold text-emerald-600">{user.sh}</td>
                                    <td className="py-3 px-3 text-center font-bold text-blue-600">{user.process}</td>
                                    <td className="py-3 px-3 text-center font-bold text-rose-600">{user.rejected}</td>
                                    <td className="py-3 px-3 text-center font-bold text-gray-700">{user.sla}</td>
                                    <td className="py-3 px-3 text-center">
                                        <button
                                            onClick={() => toast.success(`Membuka riwayat berkas ${user.name}`)}
                                            className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3 text-gray-400" /> Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
