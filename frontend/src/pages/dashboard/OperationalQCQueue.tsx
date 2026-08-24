import { useState, useEffect } from 'react';
import {
    Search,
    RotateCcw,
    Download,
    Filter,
    MoreVertical,
    Eye,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Send,
    History,
    Edit3,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { User } from '../../types';

interface QCQueueItem {
    id: string;
    no: string;
    businessName: string;
    nib: string;
    serviceType: 'Self Declare Fasilitasi' | 'Reguler' | 'Self Declare Mandiri';
    advisor: string;
    advisorCode: string;
    qco: string;
    qcoCode: string;
    statusQC: 'Menunggu Pemeriksaan' | 'Sedang Diperiksa' | 'Perlu Perbaikan' | 'Menunggu Perbaikan Advisor' | 'Lolos QC' | 'Ditolak';
    age: string;
    slaDays: string;
    slaPercentage: string;
    slaIsOver: boolean;
    priority: 'Normal' | 'Tinggi' | 'Mendesak' | 'Kritis';
}

const INITIAL_QC_DATA: QCQueueItem[] = [
    {
        id: '1',
        no: 'HC-2607-00241',
        businessName: 'Dapoer Zuhra',
        nib: '9120301234567',
        serviceType: 'Self Declare Fasilitasi',
        advisor: 'Siti Aisyah',
        advisorCode: 'HA-0123',
        qco: 'Sarah Fatimah',
        qcoCode: 'QCO-01',
        statusQC: 'Menunggu Pemeriksaan',
        age: '1 hari',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
        priority: 'Normal',
    },
    {
        id: '2',
        no: 'HC-2607-00240',
        businessName: 'Kenangan Bakery',
        nib: '8120207654321',
        serviceType: 'Reguler',
        advisor: 'Ahmad Fauzi',
        advisorCode: 'HA-0098',
        qco: 'Dimas Wicaksono',
        qcoCode: 'QCO-02',
        statusQC: 'Sedang Diperiksa',
        age: '2 hari',
        slaDays: '3 hari',
        slaPercentage: '(67%)',
        slaIsOver: false,
        priority: 'Tinggi',
    },
    {
        id: '3',
        no: 'HC-2607-00239',
        businessName: 'Alam Segar Juice',
        nib: '8120387651234',
        serviceType: 'Self Declare Mandiri',
        advisor: 'Dewi Sartika',
        advisorCode: 'HA-0156',
        qco: 'Sarah Fatimah',
        qcoCode: 'QCO-01',
        statusQC: 'Perlu Perbaikan',
        age: '3 hari',
        slaDays: '2 hari',
        slaPercentage: '(100%)',
        slaIsOver: false,
        priority: 'Normal',
    },
    {
        id: '4',
        no: 'HC-2607-00238',
        businessName: 'PT Makmur Sentosa',
        nib: '9120408765432',
        serviceType: 'Reguler',
        advisor: 'Budi Santoso',
        advisorCode: 'HA-0077',
        qco: 'Dimas Wicaksono',
        qcoCode: 'QCO-02',
        statusQC: 'Menunggu Perbaikan Advisor',
        age: '5 hari',
        slaDays: '2 hari',
        slaPercentage: '(250%)',
        slaIsOver: true,
        priority: 'Tinggi',
    },
];

export default function OperationalQCQueue() {
    const [qcData, setQcData] = useState<QCQueueItem[]>(INITIAL_QC_DATA);
    const [qcoStaff, setQcoStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('Semua');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [qcoFilter, setQcoFilter] = useState('Semua');
    const [priorityFilter, setPriorityFilter] = useState('Semua');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Modal state for Alihkan QCO
    const [reassignModalItem, setReassignModalItem] = useState<QCQueueItem | null>(null);
    const [targetQco, setTargetQco] = useState('');

    // Modal state for Return to Advisor
    const [returnModalItem, setReturnModalItem] = useState<QCQueueItem | null>(null);
    const [returnNote, setReturnNote] = useState('');

    const loadQCData = async () => {
        try {
            setLoading(true);
            const [subsRes, staffRes] = await Promise.all([
                operationalService.getSubmissions({ stage: 'qc' }),
                operationalService.getStaffList()
            ]);

            if (staffRes && staffRes.length > 0) {
                setQcoStaff(staffRes);
                setTargetQco(staffRes[0].full_name || staffRes[0].username || '');
            }

            if (subsRes?.data && subsRes.data.length > 0) {
                const mapped: QCQueueItem[] = subsRes.data.map((s, idx) => {
                    const st = s.service_type === 'SELF_DECLARE'
                        ? (s.self_declare_type === 'MANDIRI' ? 'Self Declare Mandiri' : 'Self Declare Fasilitasi')
                        : 'Reguler';
                    
                    let stat: QCQueueItem['statusQC'] = 'Menunggu Pemeriksaan';
                    if (s.status === 'QC_OFFICER') stat = 'Sedang Diperiksa';
                    else if (s.status === 'QC_REVIEW') stat = 'Sedang Diperiksa';
                    else if (s.status === 'REVISION_ADVISOR') stat = 'Menunggu Perbaikan Advisor';
                    else if (s.status === 'REJECTED') stat = 'Ditolak';

                    let pVal: QCQueueItem['priority'] = 'Normal';
                    if (s.priority === 'HIGH') pVal = 'Tinggi';
                    else if (s.priority === 'URGENT') pVal = 'Mendesak';
                    else if (s.priority === 'CRITICAL') pVal = 'Kritis';

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || `HC-${s.id?.substring(0, 8) || String(idx + 1)}`,
                        businessName: s.client?.business_name || 'Pelaku Usaha',
                        nib: s.client?.nib || '9120301234567',
                        serviceType: st,
                        advisor: s.consultant?.full_name || 'Halal Advisor',
                        advisorCode: 'HA-01',
                        qco: s.assigned_drafter?.full_name || 'Sarah Fatimah',
                        qcoCode: 'QCO-01',
                        statusQC: stat,
                        age: '2 hari',
                        slaDays: '2 hari',
                        slaPercentage: '(50%)',
                        slaIsOver: false,
                        priority: pVal,
                    };
                });
                setQcData(mapped);
            }
        } catch (err) {
            console.error('Failed to load QC data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQCData();
    }, []);

    const filteredData = qcData.filter(item => {
        const matchSearch = item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nib.toLowerCase().includes(searchTerm.toLowerCase());
        const matchService = serviceFilter === 'Semua' || item.serviceType === serviceFilter;
        const matchStatus = statusFilter === 'Semua' || item.statusQC === statusFilter;
        const matchQco = qcoFilter === 'Semua' || item.qco === qcoFilter;
        const matchPriority = priorityFilter === 'Semua' || item.priority === priorityFilter;
        return matchSearch && matchService && matchStatus && matchQco && matchPriority;
    });

    const handleReassignSubmit = async () => {
        if (!reassignModalItem) return;
        const staffObj = qcoStaff.find(s => s.full_name === targetQco || s.username === targetQco) || qcoStaff[0];
        try {
            if (staffObj) {
                await operationalService.assignSubmission(reassignModalItem.id, {
                    assignee_id: staffObj.id,
                    target_role: 'QCO',
                    notes: `Dialihkan ke ${targetQco}`,
                });
            }
            setQcData(prev => prev.map(item => item.id === reassignModalItem.id ? { ...item, qco: targetQco } : item));
            toast.success(`Pengajuan ${reassignModalItem.no} berhasil dialihkan ke ${targetQco}`);
            setReassignModalItem(null);
        } catch (err) {
            toast.error('Gagal mengalihkan QCO');
        }
    };

    const handleReturnAdvisorSubmit = async () => {
        if (!returnModalItem) return;
        try {
            await operationalService.returnToAdvisor(returnModalItem.id, returnNote);
            toast.success(`Pengajuan ${returnModalItem.no} berhasil dikembalikan ke Halal Advisor.`);
            setQcData(prev => prev.map(i => i.id === returnModalItem.id ? { ...i, statusQC: 'Menunggu Perbaikan Advisor' } : i));
            setReturnModalItem(null);
            setReturnNote('');
        } catch (err) {
            toast.error('Gagal mengembalikan pengajuan');
        }
    };

    const handleSendToHDO = async (item: QCQueueItem) => {
        try {
            const drafter = qcoStaff.find(s => s.role === 'DRAFTER') || qcoStaff[0];
            if (drafter) {
                await operationalService.assignSubmission(item.id, {
                    assignee_id: drafter.id,
                    target_role: 'DRAFTER',
                    notes: 'Lolos QC dan siap disusun HDO',
                });
            }
            toast.success(`Pengajuan ${item.no} berhasil dikirim ke HDO!`);
            setQcData(prev => prev.map(i => i.id === item.id ? { ...i, statusQC: 'Lolos QC' } : i));
        } catch (err) {
            toast.error('Gagal mengirim ke HDO');
        }
    };

    const handleExportCSV = () => {
        const headers = 'No,No Registrasi,Nama Usaha,NIB,Layanan,Advisor,QCO,Status QC,Prioritas\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},"${item.businessName}",${item.nib},${item.serviceType},"${item.advisor}","${item.qco}",${item.statusQC},${item.priority}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Antrean_QC_Operasional_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('File CSV berhasil diunduh.');
    };

    const getStatusQCBadge = (status: string) => {
        switch (status) {
            case 'Menunggu Pemeriksaan':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Menunggu Pemeriksaan</span>;
            case 'Sedang Diperiksa':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Sedang Diperiksa</span>;
            case 'Perlu Perbaikan':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Perlu Perbaikan</span>;
            case 'Menunggu Perbaikan Advisor':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Menunggu Perbaikan Advisor</span>;
            case 'Lolos QC':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Lolos QC</span>;
            case 'Ditolak':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">Ditolak</span>;
            default:
                return null;
        }
    };

    const getServiceTypeBadge = (service: string) => {
        switch (service) {
            case 'Self Declare Fasilitasi':
                return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700">Self Declare Fasilitasi</span>;
            case 'Self Declare Mandiri':
                return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700">Self Declare Mandiri</span>;
            default:
                return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700">Reguler</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Home</span>
                        <span>/</span>
                        <span className="text-gray-800 font-bold">Antrean QC</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Antrean QC</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Pantau dan kelola antrean pemeriksaan kualitas dokumen sertifikasi halal.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadQCData}
                        className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} /> Refresh
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
                    </button>
                    <button
                        onClick={() => toast.success('Menerapkan filter QC')}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                    >
                        <Filter className="w-3.5 h-3.5" /> Filter
                    </button>
                </div>
            </div>

            {/* 6 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2">
                        <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-gray-900">48</p>
                    <p className="text-[10px] font-bold text-blue-700 mt-0.5">Menunggu Pemeriksaan</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2">
                        <UserCheck className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-gray-900">62</p>
                    <p className="text-[10px] font-bold text-amber-700 mt-0.5">Sedang Diperiksa</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-2">
                        <RotateCcw className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-gray-900">35</p>
                    <p className="text-[10px] font-bold text-rose-700 mt-0.5">Perlu Perbaikan</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-2">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-gray-900">41</p>
                    <p className="text-[10px] font-bold text-purple-700 mt-0.5 leading-tight">Menunggu Perbaikan Advisor</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-gray-900">126</p>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Lolos QC</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold mb-2">
                        <XCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-black text-gray-900">9</p>
                    <p className="text-[10px] font-bold text-red-700 mt-0.5">Ditolak</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                    <div className="relative lg:col-span-2">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari pengajuan, usaha, NIB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        />
                    </div>

                    <div>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Jenis Layanan (Semua)</option>
                            <option value="Reguler">Reguler</option>
                            <option value="Self Declare Fasilitasi">Self Declare Fasilitasi</option>
                            <option value="Self Declare Mandiri">Self Declare Mandiri</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Status QC (Semua)</option>
                            <option value="Menunggu Pemeriksaan">Menunggu Pemeriksaan</option>
                            <option value="Sedang Diperiksa">Sedang Diperiksa</option>
                            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                            <option value="Menunggu Perbaikan Advisor">Menunggu Perbaikan Advisor</option>
                            <option value="Lolos QC">Lolos QC</option>
                            <option value="Ditolak">Ditolak</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={qcoFilter}
                            onChange={(e) => setQcoFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">QCO (Semua)</option>
                            <option value="Rizky Maulana">Rizky Maulana</option>
                            <option value="Fajar Nugroho">Fajar Nugroho</option>
                            <option value="Nadia Putri">Nadia Putri</option>
                        </select>
                    </div>

                    <div>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setServiceFilter('Semua');
                                setStatusFilter('Semua');
                                setQcoFilter('Semua');
                                setPriorityFilter('Semua');
                            }}
                            className="w-full py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 font-bold flex items-center justify-center gap-1"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-gray-400" /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-3">
                                    <input type="checkbox" className="rounded text-brand-600" />
                                </th>
                                <th className="py-3 px-3">No. Pengajuan</th>
                                <th className="py-3 px-3">Usaha</th>
                                <th className="py-3 px-3">Jenis Layanan</th>
                                <th className="py-3 px-3">Advisor</th>
                                <th className="py-3 px-3">QCO</th>
                                <th className="py-3 px-3">Status QC</th>
                                <th className="py-3 px-3">Usia</th>
                                <th className="py-3 px-3">SLA</th>
                                <th className="py-3 px-3">Prioritas</th>
                                <th className="py-3 px-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3">
                                        <input type="checkbox" className="rounded text-brand-600" />
                                    </td>
                                    <td className="py-3 px-3 font-mono font-black text-brand-700">{item.no}</td>
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-gray-900">{item.businessName}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">NIB: {item.nib}</p>
                                    </td>
                                    <td className="py-3 px-3">{getServiceTypeBadge(item.serviceType)}</td>
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-gray-800">{item.advisor}</p>
                                        <p className="text-[10px] text-gray-400">{item.advisorCode}</p>
                                    </td>
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-gray-800">{item.qco}</p>
                                        <p className="text-[10px] text-gray-400">{item.qcoCode}</p>
                                    </td>
                                    <td className="py-3 px-3">{getStatusQCBadge(item.statusQC)}</td>
                                    <td className="py-3 px-3 text-gray-600 font-medium">{item.age}</td>
                                    <td className="py-3 px-3">
                                        <span className={`font-bold ${item.slaIsOver ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {item.slaDays} <span className="text-[10px] font-normal">{item.slaPercentage}</span>
                                        </span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                            item.priority === 'Tinggi' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 relative">
                                            <button
                                                onClick={() => toast.success(`Melihat detail pengajuan ${item.no}`)}
                                                className="p-1.5 bg-gray-50 hover:bg-brand-50 hover:text-brand-600 text-gray-500 rounded-lg border border-gray-200"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </button>

                                            {activeDropdown === item.id && (
                                                <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 text-left text-xs font-bold text-gray-700">
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); toast.success(`Detail ${item.no}`); }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-gray-400" /> Lihat Detail
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); setReassignModalItem(item); }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5 text-gray-400" /> Alihkan QCO
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); toast.success('Prioritas diubah'); }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Ubah Prioritas
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); setReturnModalItem(item); }}
                                                        className="w-full px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 text-red-500" /> Kembalikan ke Advisor
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); handleSendToHDO(item); }}
                                                        className="w-full px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"
                                                    >
                                                        <Send className="w-3.5 h-3.5 text-emerald-600" /> Kirim ke HDO
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); toast.success('Membuka riwayat'); }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <History className="w-3.5 h-3.5 text-gray-400" /> Lihat Riwayat
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

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-3 text-xs text-gray-500">
                    <span>Menampilkan 1 - 10 dari 321 data</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="px-3 py-1 rounded-lg bg-brand-700 text-white font-bold">1</button>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">2</button>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">3</button>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">4</button>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">5</button>
                        <span className="px-1">...</span>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">33</button>
                        <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Modal Alihkan QCO */}
            {reassignModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <h3 className="text-base font-black text-gray-900">Alihkan Petugas QCO</h3>
                        <p className="text-xs text-gray-500">
                            Pindahkan tugas pemeriksaan untuk nomor pengajuan <span className="font-bold text-brand-700">{reassignModalItem.no}</span> ({reassignModalItem.businessName}).
                        </p>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Petugas Saat Ini</label>
                                <input
                                    type="text"
                                    disabled
                                    value={`${reassignModalItem.qco} (${reassignModalItem.qcoCode})`}
                                    className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pilih QCO Pengganti *</label>
                                <select
                                    value={targetQco}
                                    onChange={(e) => setTargetQco(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    <option value="Nadia Putri">Nadia Putri (QCO-02) • Antrean: 11</option>
                                    <option value="Fajar Nugroho">Fajar Nugroho (QCO-01) • Antrean: 7</option>
                                    <option value="Rizky Maulana">Rizky Maulana (QCO-03) • Antrean: 14</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => setReassignModalItem(null)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReassignSubmit}
                                className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md"
                            >
                                Simpan Pengalihan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Kembalikan ke Advisor */}
            {returnModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <h3 className="text-base font-black text-gray-900">Kembalikan ke Halal Advisor</h3>
                        <p className="text-xs text-gray-500">
                            Kembalikan pengajuan <span className="font-bold text-brand-700">{returnModalItem.no}</span> ({returnModalItem.businessName}) ke Halal Advisor untuk revisi berkas.
                        </p>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Revisi / Alasan Pengembalian *</label>
                                <textarea
                                    rows={3}
                                    value={returnNote}
                                    onChange={(e) => setReturnNote(e.target.value)}
                                    placeholder="Tuliskan data atau dokumen apa yang belum lengkap / perlu diperbaiki..."
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => setReturnModalItem(null)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReturnAdvisorSubmit}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md"
                            >
                                Kembalikan Berkas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
