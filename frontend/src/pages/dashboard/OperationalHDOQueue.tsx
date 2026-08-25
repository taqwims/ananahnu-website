import { useState, useEffect } from 'react';
import {
    Search,
    RotateCcw,
    Download,
    MoreVertical,
    Send,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    RefreshCw,
    UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { User } from '../../types';
import type { HDOQueueItem } from '../../types/operational';
import { ServiceTypeBadge } from '../../components/operational/common/OperationalBadges';
import { OperationalPagination } from '../../components/operational/common/OperationalPagination';
import { SingleAssignModal } from '../../components/operational/modals/SingleAssignModal';
import { ReturnAdvisorModal } from '../../components/operational/modals/ReturnAdvisorModal';

const INITIAL_HDO_DATA: HDOQueueItem[] = [
    {
        id: '1',
        no: 'HC-2607-00321',
        businessName: 'Dapur Barokah',
        serviceType: 'Self Declare Fasilitasi',
        advisor: 'Siti Aisyah',
        hdo: 'Hendra Pratama',
        statusHDO: 'Menunggu Penyusunan',
        progress: 45,
        sihalalNo: 'SH-2607-1012',
        age: '1 hari',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
        priority: 'Normal',
    },
    {
        id: '2',
        no: 'HC-2607-00320',
        businessName: 'PT Pangan Sejahtera',
        serviceType: 'Reguler',
        advisor: 'Ahmad Fauzi',
        hdo: 'Ayu Lestari',
        statusHDO: 'Sedang Disusun',
        progress: 72,
        sihalalNo: 'SH-2607-1011',
        age: '2 hari',
        slaDays: '3 hari',
        slaPercentage: '(67%)',
        slaIsOver: false,
        priority: 'Tinggi',
    },
    {
        id: '3',
        no: 'HC-2607-00319',
        businessName: 'Teh Hijau Lestari',
        serviceType: 'Self Declare Mandiri',
        advisor: 'Dewi Sartika',
        hdo: 'Hendra Pratama',
        statusHDO: 'Menunggu Data Tambahan',
        progress: 38,
        sihalalNo: '-',
        age: '3 hari',
        slaDays: '2 hari',
        slaPercentage: '(100%)',
        slaIsOver: false,
        priority: 'Normal',
    },
    {
        id: '4',
        no: 'HC-2607-00318',
        businessName: 'Roti Nusantara',
        serviceType: 'Reguler',
        advisor: 'Dimas Fajar',
        hdo: 'Ayu Lestari',
        statusHDO: 'Siap Submit SIHALAL',
        progress: 95,
        sihalalNo: 'SH-2607-1009',
        age: '1 hari',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
        priority: 'Mendesak',
    },
];

export default function OperationalHDOQueue() {
    const [hdoData, setHdoData] = useState<HDOQueueItem[]>(INITIAL_HDO_DATA);
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('Semua');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [hdoFilter, setHdoFilter] = useState('Semua');
    const [priorityFilter, setPriorityFilter] = useState('Semua');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Modal state
    const [reassignModalItem, setReassignModalItem] = useState<HDOQueueItem | null>(null);
    const [returnModalItem, setReturnModalItem] = useState<HDOQueueItem | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const loadHDOData = async () => {
        try {
            setLoading(true);
            const [subsRes, staffRes] = await Promise.all([
                operationalService.getSubmissions({ stage: 'hdo' }),
                operationalService.getStaffList()
            ]);

            if (staffRes && staffRes.length > 0) {
                setStaffList(staffRes);
            }

            if (subsRes?.data && subsRes.data.length > 0) {
                const mapped: HDOQueueItem[] = subsRes.data.map((s, idx) => {
                    const st = s.service_type === 'SELF_DECLARE'
                        ? (s.self_declare_type === 'MANDIRI' ? 'Self Declare Mandiri' : 'Self Declare Fasilitasi')
                        : 'Reguler';
                    
                    let stat: HDOQueueItem['statusHDO'] = 'Menunggu Penyusunan';
                    if (s.status === 'DRAFTER') stat = 'Sedang Disusun';
                    else if (s.status === 'REVISION_DRAFTER') stat = 'Menunggu Data Tambahan';
                    else if (s.status === 'SUBMITTED_TO_BPJPH') stat = 'Selesai HDO';

                    let pVal: HDOQueueItem['priority'] = 'Normal';
                    if (s.priority === 'HIGH') pVal = 'Tinggi';
                    else if (s.priority === 'URGENT') pVal = 'Mendesak';
                    else if (s.priority === 'CRITICAL') pVal = 'Kritis';

                    const fieldCount = s.field_values?.length || 0;
                    const calcProgress = Math.min(100, Math.max(30, fieldCount * 18));

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || `HC-${s.id?.substring(0, 8) || String(idx + 1)}`,
                        businessName: s.client?.business_name || 'Pelaku Usaha',
                        serviceType: st,
                        advisor: s.consultant?.full_name || 'Halal Advisor',
                        hdo: s.assigned_drafter?.full_name || 'Hendra Pratama',
                        statusHDO: stat,
                        progress: calcProgress,
                        sihalalNo: s.sihal_number || `SH-2607-${1000 + idx}`,
                        age: '2 hari',
                        slaDays: '3 hari',
                        slaPercentage: '(67%)',
                        slaIsOver: false,
                        priority: pVal,
                    };
                });
                setHdoData(mapped);
            }
        } catch (err) {
            console.error('Failed to load HDO data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHDOData();
    }, []);

    const filteredData = hdoData.filter(item => {
        const matchSearch = item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sihalalNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchService = serviceFilter === 'Semua' || item.serviceType === serviceFilter;
        const matchStatus = statusFilter === 'Semua' || item.statusHDO === statusFilter;
        const matchHdo = hdoFilter === 'Semua' || item.hdo === hdoFilter;
        const matchPriority = priorityFilter === 'Semua' || item.priority === priorityFilter;
        return matchSearch && matchService && matchStatus && matchHdo && matchPriority;
    });

    const getStatusHDOBadge = (status: string) => {
        switch (status) {
            case 'Menunggu Penyusunan':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Menunggu Penyusunan</span>;
            case 'Sedang Disusun':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Sedang Disusun</span>;
            case 'Menunggu Data Tambahan':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Menunggu Data Tambahan</span>;
            case 'Siap Submit SIHALAL':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Siap Submit SIHALAL</span>;
            case 'Dikembalikan SIHALAL':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">Dikembalikan SIHALAL</span>;
            case 'Selesai HDO':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Selesai HDO</span>;
            default:
                return null;
        }
    };

    const handleSubmitSIHALAL = (item: HDOQueueItem) => {
        toast.success(`Pengajuan ${item.no} berhasil disubmit ke SIHALAL BPJPH!`);
        setHdoData(prev => prev.map(i => i.id === item.id ? { ...i, statusHDO: 'Selesai HDO', progress: 100 } : i));
    };

    const handleExportCSV = () => {
        const headers = 'No,No Registrasi,Nama Usaha,Layanan,Advisor,HDO,Status HDO,Progress,No SIHALAL,Prioritas\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},"${item.businessName}",${item.serviceType},"${item.advisor}","${item.hdo}",${item.statusHDO},${item.progress}%,${item.sihalalNo},${item.priority}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Antrean_HDO_Operasional_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('File CSV berhasil diunduh.');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Home</span>
                        <span>/</span>
                        <span className="text-gray-800 font-bold">Antrean HDO</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Antrean Halal Document Officer (HDO)</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Pantau dan kelola proses penyusunan dokumen halal dan submission ke SIHALAL.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadHDOData}
                        className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} /> Refresh
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
                    </button>
                </div>
            </div>

            {/* 7 KPI Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                        <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Menunggu Disusun</p>
                    <p className="text-xl font-black text-gray-900">{hdoData.filter(i => i.statusHDO === 'Menunggu Penyusunan').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                        <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Sedang Disusun</p>
                    <p className="text-xl font-black text-gray-900">{hdoData.filter(i => i.statusHDO === 'Sedang Disusun').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Data Kurang</p>
                    <p className="text-xl font-black text-gray-900">{hdoData.filter(i => i.statusHDO === 'Menunggu Data Tambahan').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                        <Send className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Siap Submit</p>
                    <p className="text-xl font-black text-gray-900">{hdoData.filter(i => i.statusHDO === 'Siap Submit SIHALAL').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-1.5">
                        <RotateCcw className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Dikembalikan</p>
                    <p className="text-xl font-black text-gray-900">{hdoData.filter(i => i.statusHDO === 'Dikembalikan SIHALAL').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Selesai HDO</p>
                    <p className="text-xl font-black text-gray-900">{hdoData.filter(i => i.statusHDO === 'Selesai HDO').length}</p>
                </div>

                <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-1.5">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-red-800">Melewati SLA</p>
                    <p className="text-xl font-black text-red-600">{hdoData.filter(i => i.slaIsOver).length}</p>
                </div>
            </div>

            {/* Filter Card */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari no registrasi, nama usaha, no SIHALAL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setServiceFilter('Semua');
                            setStatusFilter('Semua');
                            setHdoFilter('Semua');
                            setPriorityFilter('Semua');
                        }}
                        className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-gray-500" /> Reset Filter
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Jenis Layanan</label>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Self Declare Fasilitasi">Self Declare Fasilitasi</option>
                            <option value="Reguler">Reguler</option>
                            <option value="Self Declare Mandiri">Self Declare Mandiri</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Status HDO</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Menunggu Penyusunan">Menunggu Penyusunan</option>
                            <option value="Sedang Disusun">Sedang Disusun</option>
                            <option value="Menunggu Data Tambahan">Menunggu Data Tambahan</option>
                            <option value="Siap Submit SIHALAL">Siap Submit SIHALAL</option>
                            <option value="Selesai HDO">Selesai HDO</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Petugas HDO</label>
                        <select
                            value={hdoFilter}
                            onChange={(e) => setHdoFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Hendra Pratama">Hendra Pratama</option>
                            <option value="Ayu Lestari">Ayu Lestari</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Prioritas</label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Normal">Normal</option>
                            <option value="Tinggi">Tinggi</option>
                            <option value="Mendesak">Mendesak</option>
                            <option value="Kritis">Kritis</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-900">Daftar Antrean HDO</h2>
                    <span className="text-xs font-bold text-gray-400">{filteredData.length} data</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-3">No. Registrasi</th>
                                <th className="py-3 px-3">Nama Usaha</th>
                                <th className="py-3 px-3">Jenis Layanan</th>
                                <th className="py-3 px-3">Halal Advisor</th>
                                <th className="py-3 px-3">Petugas HDO</th>
                                <th className="py-3 px-3">Status HDO</th>
                                <th className="py-3 px-3">Kelengkapan</th>
                                <th className="py-3 px-3">No. SIHALAL</th>
                                <th className="py-3 px-3">SLA</th>
                                <th className="py-3 px-3 text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData
                                .slice((currentPage - 1) * perPage, currentPage * perPage)
                                .map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3 font-mono font-bold text-gray-800">{item.no}</td>
                                    <td className="py-3 px-3 font-bold text-gray-900">{item.businessName}</td>
                                    <td className="py-3 px-3"><ServiceTypeBadge service={item.serviceType} /></td>
                                    <td className="py-3 px-3 text-gray-600">{item.advisor}</td>
                                    <td className="py-3 px-3 font-bold text-gray-800">{item.hdo}</td>
                                    <td className="py-3 px-3">{getStatusHDOBadge(item.statusHDO)}</td>
                                    <td className="py-3 px-3">
                                        <div className="w-24 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span>{item.progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        item.progress >= 90 ? 'bg-emerald-500' :
                                                        item.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`}
                                                    style={{ width: `${item.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-gray-600">{item.sihalalNo}</td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                            item.slaIsOver ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                            {item.slaDays} {item.slaPercentage}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 relative">
                                            <button
                                                onClick={() => handleSubmitSIHALAL(item)}
                                                className="px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold shadow-sm"
                                            >
                                                Submit
                                            </button>

                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {activeDropdown === item.id && (
                                                <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 text-left text-xs font-bold text-gray-700">
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            setReassignModalItem(item);
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5 text-gray-400" /> Alihkan Petugas HDO
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            setReturnModalItem(item);
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 text-red-500" /> Kembalikan ke Advisor
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Shared Pagination */}
                <OperationalPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredData.length / perPage) || 1}
                    totalItems={filteredData.length}
                    perPage={perPage}
                    onPageChange={setCurrentPage}
                    onPerPageChange={(newP) => {
                        setPerPage(newP);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Modal: Alihkan Petugas HDO */}
            <SingleAssignModal
                isOpen={!!reassignModalItem}
                onClose={() => setReassignModalItem(null)}
                submissionId={reassignModalItem?.id || ''}
                submissionNo={reassignModalItem?.no || ''}
                businessName={reassignModalItem?.businessName || ''}
                currentStage="Penyusunan HDO"
                staffList={staffList}
                onSuccess={(assignedName) => {
                    if (reassignModalItem) {
                        setHdoData(prev => prev.map(item => item.id === reassignModalItem.id ? { ...item, hdo: assignedName } : item));
                    }
                }}
            />

            {/* Modal: Kembalikan ke Advisor */}
            <ReturnAdvisorModal
                isOpen={!!returnModalItem}
                onClose={() => setReturnModalItem(null)}
                submissionId={returnModalItem?.id || ''}
                submissionNo={returnModalItem?.no || ''}
                businessName={returnModalItem?.businessName || ''}
                advisorName={returnModalItem?.advisor || ''}
                onSuccess={() => {
                    if (returnModalItem) {
                        setHdoData(prev => prev.map(i => i.id === returnModalItem.id ? { ...i, statusHDO: 'Menunggu Data Tambahan' } : i));
                    }
                }}
            />
        </div>
    );
}
