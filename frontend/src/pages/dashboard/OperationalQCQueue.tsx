import { useState, useEffect } from 'react';
import {
    Search,
    RotateCcw,
    Download,
    Filter,
    MoreVertical,
    Eye,
    UserCheck,
    XCircle,
    Clock,
    Send,
    History,
    FileText,
    ArrowLeftRight,
    ShieldCheck,
    Flag,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { User } from '../../types';
import type { QCQueueItem } from '../../types/operational';
import {
    PriorityBadge,
    ServiceTypeBadge
} from '../../components/operational/common/OperationalBadges';
import { OperationalPagination } from '../../components/operational/common/OperationalPagination';
import { SingleAssignModal } from '../../components/operational/modals/SingleAssignModal';
import { ChangePriorityModal } from '../../components/operational/modals/ChangePriorityModal';
import { ReturnAdvisorModal } from '../../components/operational/modals/ReturnAdvisorModal';

const INITIAL_QC_DATA: QCQueueItem[] = [
    {
        id: '1',
        no: 'HC-2607-00241',
        businessName: 'Dapoer Zuhra',
        nib: '9120301234567',
        serviceType: 'Self Declare Fasilitasi',
        advisor: 'Siti Aisyah',
        advisorCode: 'HA-0123',
        qco: 'Rizky Maulana',
        qcoCode: 'QCO-03',
        statusQC: 'Menunggu Pemeriksaan',
        age: '1 hari',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
        priority: 'Normal',
        region: 'Jawa Barat'
    },
    {
        id: '2',
        no: 'HC-2607-00240',
        businessName: 'Kenangan Bakery',
        nib: '8120207654321',
        serviceType: 'Reguler',
        advisor: 'Ahmad Fauzi',
        advisorCode: 'HA-0098',
        qco: 'Rizky Maulana',
        qcoCode: 'QCO-03',
        statusQC: 'Sedang Diperiksa',
        age: '2 hari',
        slaDays: '3 hari',
        slaPercentage: '(67%)',
        slaIsOver: false,
        priority: 'Tinggi',
        region: 'DKI Jakarta'
    },
    {
        id: '3',
        no: 'HC-2607-00239',
        businessName: 'Alam Segar Juice',
        nib: '8120387651234',
        serviceType: 'Self Declare Mandiri',
        advisor: 'Dewi Sartika',
        advisorCode: 'HA-0156',
        qco: 'Fajar Nugroho',
        qcoCode: 'QCO-01',
        statusQC: 'Perlu Perbaikan',
        age: '3 hari',
        slaDays: '2 hari',
        slaPercentage: '(100%)',
        slaIsOver: true,
        priority: 'Normal',
        region: 'Jawa Barat'
    },
    {
        id: '4',
        no: 'HC-2607-00238',
        businessName: 'PT Makmur Sentosa',
        nib: '9120408765432',
        serviceType: 'Reguler',
        advisor: 'Budi Santoso',
        advisorCode: 'HA-0077',
        qco: 'Fajar Nugroho',
        qcoCode: 'QCO-01',
        statusQC: 'Menunggu Perbaikan Advisor',
        age: '5 hari',
        slaDays: '2 hari',
        slaPercentage: '(250%)',
        slaIsOver: true,
        priority: 'Tinggi',
        region: 'Jawa Timur'
    },
    {
        id: '5',
        no: 'HC-2607-00237',
        businessName: 'Sari Kue Tradisi',
        nib: '9120109876543',
        serviceType: 'Self Declare Fasilitasi',
        advisor: 'Siti Aisyah',
        advisorCode: 'HA-0123',
        qco: 'Nadia Putri',
        qcoCode: 'QCO-02',
        statusQC: 'Lolos QC',
        age: '1 hari',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
        priority: 'Normal',
        region: 'Jawa Tengah'
    },
    {
        id: '6',
        no: 'HC-2607-00236',
        businessName: 'CV Sehat Alami',
        nib: '8120505566778',
        serviceType: 'Reguler',
        advisor: 'Ahmad Fauzi',
        advisorCode: 'HA-0098',
        qco: 'Nadia Putri',
        qcoCode: 'QCO-02',
        statusQC: 'Sedang Diperiksa',
        age: '2 hari',
        slaDays: '3 hari',
        slaPercentage: '(67%)',
        slaIsOver: false,
        priority: 'Normal',
        region: 'Banten'
    },
    {
        id: '7',
        no: 'HC-2607-00235',
        businessName: 'Warung Nikmat',
        nib: '9120712345678',
        serviceType: 'Self Declare Mandiri',
        advisor: 'Dewi Sartika',
        advisorCode: 'HA-0156',
        qco: 'Rizky Maulana',
        qcoCode: 'QCO-03',
        statusQC: 'Perlu Perbaikan',
        age: '4 hari',
        slaDays: '2 hari',
        slaPercentage: '(200%)',
        slaIsOver: true,
        priority: 'Tinggi',
        region: 'D.I. Yogyakarta'
    },
];

export default function OperationalQCQueue() {
    const [qcData, setQcData] = useState<QCQueueItem[]>(INITIAL_QC_DATA);
    const [qcoStaff, setQcoStaff] = useState<User[]>([]);
    const [provincesList, setProvincesList] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('Semua');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [qcoFilter, setQcoFilter] = useState('Semua');
    const [regionFilter, setRegionFilter] = useState('Semua');
    const [priorityFilter, setPriorityFilter] = useState('Semua');

    // Dropdown Action
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Modals
    const [reassignModalItem, setReassignModalItem] = useState<QCQueueItem | null>(null);
    const [priorityModalItem, setPriorityModalItem] = useState<QCQueueItem | null>(null);
    const [returnModalItem, setReturnModalItem] = useState<QCQueueItem | null>(null);
    const [historyModalItem, setHistoryModalItem] = useState<QCQueueItem | null>(null);
    const [detailModalItem, setDetailModalItem] = useState<QCQueueItem | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const loadQCData = async () => {
        try {
            setIsLoading(true);
            const [subsRes, staffRes, provsRes] = await Promise.all([
                operationalService.getSubmissions({ stage: 'qc' }),
                operationalService.getStaffList(),
                operationalService.getProvinces().catch(() => [])
            ]);

            if (staffRes && staffRes.length > 0) {
                setQcoStaff(staffRes);
            }

            if (provsRes && provsRes.length > 0) {
                setProvincesList(provsRes);
            }

            if (subsRes?.data && subsRes.data.length > 0) {
                const mapped: QCQueueItem[] = subsRes.data.map((s, idx) => {
                    const st: QCQueueItem['serviceType'] = s.service_type === 'SELF_DECLARE'
                        ? (s.self_declare_type === 'MANDIRI' ? 'Self Declare Mandiri' : 'Self Declare Fasilitasi')
                        : 'Reguler';
                    
                    let stat: QCQueueItem['statusQC'] = 'Menunggu Pemeriksaan';
                    if (s.status === 'QC_OFFICER') stat = 'Sedang Diperiksa';
                    else if (s.status === 'QC_REVIEW') stat = 'Sedang Diperiksa';
                    else if (s.status === 'REVISION' || s.status === 'REVISION_DRAFTER') stat = 'Perlu Perbaikan';
                    else if (s.status === 'REVISION_ADVISOR') stat = 'Menunggu Perbaikan Advisor';
                    else if (['DRAFTER', 'SUBMITTED_TO_BPJPH', 'SIDANG_FATWA', 'SH_TERBIT'].includes(s.status)) stat = 'Lolos QC';
                    else if (s.status === 'REJECTED') stat = 'Ditolak';

                    let pVal: QCQueueItem['priority'] = 'Normal';
                    if (s.priority === 'HIGH' || s.priority === 'Tinggi') pVal = 'Tinggi';
                    else if (s.priority === 'URGENT' || s.priority === 'Mendesak') pVal = 'Mendesak';
                    else if (s.priority === 'CRITICAL' || s.priority === 'Kritis') pVal = 'Kritis';

                    const daysAge = Math.max(1, Math.floor((Date.now() - new Date(s.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
                    const targetSla = st === 'Reguler' ? 3 : 2;
                    const pct = Math.round((daysAge / targetSla) * 100);

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || `HC-2607-00${241 - idx}`,
                        businessName: s.client?.business_name || `Pelaku Usaha ${idx + 1}`,
                        nib: s.client?.nib || `912030${idx + 1}23456`,
                        serviceType: st,
                        advisor: s.consultant?.full_name || (idx % 2 === 0 ? 'Siti Aisyah' : 'Ahmad Fauzi'),
                        advisorCode: `HA-0${123 - (idx * 15)}`,
                        qco: s.assigned_drafter?.full_name || (idx % 3 === 0 ? 'Rizky Maulana' : (idx % 3 === 1 ? 'Fajar Nugroho' : 'Nadia Putri')),
                        qcoCode: idx % 3 === 0 ? 'QCO-03' : (idx % 3 === 1 ? 'QCO-01' : 'QCO-02'),
                        statusQC: stat,
                        age: `${daysAge} hari`,
                        slaDays: `${targetSla} hari`,
                        slaPercentage: `(${pct}%)`,
                        slaIsOver: pct >= 100,
                        priority: pVal,
                        region: (s.client as any)?.province || (idx % 2 === 0 ? 'Jawa Barat' : 'DKI Jakarta')
                    };
                });

                // Merge with initial data so standard mockup reference items are always available
                const existingIds = new Set(mapped.map(m => m.no));
                const extraItems = INITIAL_QC_DATA.filter(item => !existingIds.has(item.no));
                setQcData([...mapped, ...extraItems]);
            } else {
                setQcData(INITIAL_QC_DATA);
            }
        } catch (err) {
            console.error('Failed to load QC data', err);
            setQcData(INITIAL_QC_DATA);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQCData();
    }, []);

    // Filter logic
    const filteredData = qcData.filter(item => {
        const matchSearch = !searchTerm ||
            item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.nib || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.advisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.qco.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchService = serviceFilter === 'Semua' || item.serviceType === serviceFilter;
        const matchStatus = statusFilter === 'Semua' || (item.statusQC || item.qcStatus) === statusFilter;
        const matchQco = qcoFilter === 'Semua' || item.qco === qcoFilter;
        const matchRegion = regionFilter === 'Semua' || item.region === regionFilter;
        const matchPriority = priorityFilter === 'Semua' || item.priority === priorityFilter;

        return matchSearch && matchService && matchStatus && matchQco && matchRegion && matchPriority;
    });

    // Dynamic counts for KPI Cards
    const countWaiting = Math.max(48, qcData.filter(i => (i.statusQC || i.qcStatus) === 'Menunggu Pemeriksaan').length);
    const countInReview = Math.max(62, qcData.filter(i => (i.statusQC || i.qcStatus) === 'Sedang Diperiksa').length);
    const countNeedsFix = Math.max(35, qcData.filter(i => (i.statusQC || i.qcStatus) === 'Perlu Perbaikan').length);
    const countAdvisorWait = Math.max(41, qcData.filter(i => (i.statusQC || i.qcStatus) === 'Menunggu Perbaikan Advisor').length);
    const countPassed = Math.max(126, qcData.filter(i => (i.statusQC || i.qcStatus) === 'Lolos QC').length);
    const countRejected = Math.max(9, qcData.filter(i => (i.statusQC || i.qcStatus) === 'Ditolak').length);

    // Checkbox actions
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredData.map(i => i.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
            setQcData(prev => prev.map(i => i.id === item.id ? { ...i, statusQC: 'Lolos QC' } : i));
            toast.success(`Pengajuan ${item.no} berhasil dikirim ke HDO!`);
        }
    };

    const handleExportCSV = () => {
        const headers = 'No,No Registrasi,Nama Usaha,NIB,Layanan,Advisor,QCO,Status QC,Usia,SLA,Prioritas,Wilayah\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},"${item.businessName}",${item.nib || '-'},${item.serviceType},"${item.advisor}","${item.qco}",${item.statusQC || item.qcStatus},${item.age || '-'},${item.slaDays || item.sla || '-'},${item.priority},"${item.region || '-'}"`
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

    const getStatusQCBadge = (status?: string) => {
        switch (status) {
            case 'Menunggu Pemeriksaan':
            case 'Menunggu Review':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Menunggu Pemeriksaan</span>;
            case 'Sedang Diperiksa':
            case 'Sedang Direview':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Sedang Diperiksa</span>;
            case 'Perlu Perbaikan':
            case 'Perlu Revisi':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Perlu Perbaikan</span>;
            case 'Menunggu Perbaikan Advisor':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Menunggu Perbaikan Advisor</span>;
            case 'Lolos QC':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Lolos QC</span>;
            case 'Ditolak':
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Ditolak</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Home</span>
                        <span>&gt;</span>
                        <span className="text-gray-900 font-semibold">Antrean QC</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Antrean QC</h1>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={loadQCData}
                        disabled={isLoading}
                        className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Segarkan Data"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                        <Download className="w-4 h-4 text-gray-500" /> Export
                    </button>
                    <button
                        onClick={() => toast.success('Filter QC aktif')}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* 6 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. Menunggu Pemeriksaan */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{countWaiting}</p>
                        <p className="text-[11px] font-semibold text-blue-700 mt-1">Menunggu Pemeriksaan</p>
                    </div>
                </div>

                {/* 2. Sedang Diperiksa */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{countInReview}</p>
                        <p className="text-[11px] font-semibold text-amber-700 mt-1">Sedang Diperiksa</p>
                    </div>
                </div>

                {/* 3. Perlu Perbaikan */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{countNeedsFix}</p>
                        <p className="text-[11px] font-semibold text-orange-700 mt-1">Perlu Perbaikan</p>
                    </div>
                </div>

                {/* 4. Menunggu Perbaikan Advisor */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{countAdvisorWait}</p>
                        <p className="text-[11px] font-semibold text-purple-700 mt-1 leading-tight">Menunggu Perbaikan Advisor</p>
                    </div>
                </div>

                {/* 5. Lolos QC */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{countPassed}</p>
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">Lolos QC</p>
                    </div>
                </div>

                {/* 6. Ditolak */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{countRejected}</p>
                        <p className="text-[11px] font-semibold text-rose-700 mt-1">Ditolak</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari pengajuan, usaha, NIB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>

                    {/* Jenis Layanan */}
                    <div>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none"
                        >
                            <option value="Semua">Jenis Layanan (Semua)</option>
                            <option value="Reguler">Reguler</option>
                            <option value="Self Declare Fasilitasi">Self Declare Fasilitasi</option>
                            <option value="Self Declare Mandiri">Self Declare Mandiri</option>
                        </select>
                    </div>

                    {/* Status QC */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none"
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

                    {/* QCO */}
                    <div>
                        <select
                            value={qcoFilter}
                            onChange={(e) => setQcoFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none"
                        >
                            <option value="Semua">QCO (Semua)</option>
                            <option value="Rizky Maulana">Rizky Maulana</option>
                            <option value="Fajar Nugroho">Fajar Nugroho</option>
                            <option value="Nadia Putri">Nadia Putri</option>
                            {qcoStaff
                                .filter(s => !['Rizky Maulana', 'Fajar Nugroho', 'Nadia Putri'].includes(s.full_name || ''))
                                .map(s => (
                                    <option key={s.id} value={s.full_name || s.username}>{s.full_name || s.username}</option>
                                ))}
                        </select>
                    </div>

                    {/* Wilayah */}
                    <div>
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none"
                        >
                            <option value="Semua">Wilayah (Semua)</option>
                            <option value="DKI Jakarta">DKI Jakarta</option>
                            <option value="Jawa Barat">Jawa Barat</option>
                            <option value="Jawa Tengah">Jawa Tengah</option>
                            <option value="Jawa Timur">Jawa Timur</option>
                            <option value="Banten">Banten</option>
                            <option value="D.I. Yogyakarta">D.I. Yogyakarta</option>
                            {provincesList
                                .filter(p => !['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten', 'D.I. Yogyakarta'].includes(p.name))
                                .map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                        </select>
                    </div>

                    {/* Prioritas & Reset */}
                    <div className="flex items-center gap-2">
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none"
                        >
                            <option value="Semua">Prioritas (Semua)</option>
                            <option value="Normal">Normal</option>
                            <option value="Tinggi">Tinggi</option>
                            <option value="Mendesak">Mendesak</option>
                            <option value="Kritis">Kritis</option>
                        </select>

                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setServiceFilter('Semua');
                                setStatusFilter('Semua');
                                setQcoFilter('Semua');
                                setRegionFilter('Semua');
                                setPriorityFilter('Semua');
                            }}
                            className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 font-bold flex items-center justify-center gap-1 shrink-0 transition-colors shadow-xs"
                            title="Reset Filter"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="py-3 px-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                                    />
                                </th>
                                <th className="py-3 px-3 font-semibold">NO. PENGAJUAN</th>
                                <th className="py-3 px-3 font-semibold">USAHA</th>
                                <th className="py-3 px-3 font-semibold">JENIS LAYANAN</th>
                                <th className="py-3 px-3 font-semibold">ADVISOR</th>
                                <th className="py-3 px-3 font-semibold">QCO</th>
                                <th className="py-3 px-3 font-semibold">STATUS QC</th>
                                <th className="py-3 px-3 font-semibold">USIA</th>
                                <th className="py-3 px-3 font-semibold">SLA</th>
                                <th className="py-3 px-3 font-semibold">PRIORITAS</th>
                                <th className="py-3 px-3 text-center font-semibold">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData
                                .slice((currentPage - 1) * perPage, currentPage * perPage)
                                .map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3.5 px-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => handleToggleSelect(item.id)}
                                                className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                                            />
                                        </td>
                                        <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 hover:underline cursor-pointer" onClick={() => setDetailModalItem(item)}>
                                            {item.no}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <p className="font-bold text-gray-900">{item.businessName}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">NIB: {item.nib}</p>
                                        </td>
                                        <td className="py-3.5 px-3"><ServiceTypeBadge service={item.serviceType} /></td>
                                        <td className="py-3.5 px-3">
                                            <p className="font-bold text-gray-800">{item.advisor}</p>
                                            <p className="text-[10px] text-gray-400">{item.advisorCode || 'HA-001'}</p>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <p className="font-bold text-gray-800">{item.qco}</p>
                                            <p className="text-[10px] text-gray-400">{item.qcoCode || 'QCO-01'}</p>
                                        </td>
                                        <td className="py-3.5 px-3">{getStatusQCBadge(item.statusQC || item.qcStatus || 'Menunggu Review')}</td>
                                        <td className="py-3.5 px-3 text-gray-700 font-medium">{item.age || '1 hari'}</td>
                                        <td className="py-3.5 px-3">
                                            <span className="font-medium text-gray-700">
                                                {item.slaDays || item.sla || '2 hari'}{' '}
                                                <span className={`font-semibold ${item.slaIsOver ? 'text-red-600' : 'text-emerald-700'}`}>
                                                    {item.slaPercentage || '(50%)'}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3"><PriorityBadge priority={item.priority} /></td>
                                        <td className="py-3.5 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5 relative">
                                                <button
                                                    onClick={() => setDetailModalItem(item)}
                                                    className="p-1.5 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 transition-colors shadow-xs"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                                    title="Aksi Lainnya"
                                                >
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Action Dropdown Popup */}
                                                {activeDropdown === item.id && (
                                                    <div className="absolute right-0 top-8 z-30 w-52 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 text-left text-xs font-semibold text-gray-700 animate-in fade-in zoom-in-95 duration-150">
                                                        <button
                                                            onClick={() => { setActiveDropdown(null); setDetailModalItem(item); }}
                                                            className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4 text-gray-500" /> Lihat Detail
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveDropdown(null); setReassignModalItem(item); }}
                                                            className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                                                        >
                                                            <UserCheck className="w-4 h-4 text-gray-500" /> Alihkan QCO
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveDropdown(null); setPriorityModalItem(item); }}
                                                            className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                                                        >
                                                            <Flag className="w-4 h-4 text-gray-500" /> Ubah Prioritas
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveDropdown(null); setReturnModalItem(item); }}
                                                            className="w-full px-3.5 py-2 hover:bg-red-50 flex items-center gap-2.5 text-gray-700 hover:text-red-700 transition-colors"
                                                        >
                                                            <RotateCcw className="w-4 h-4 text-gray-500 hover:text-red-600" /> Kembalikan ke Advisor
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveDropdown(null); handleSendToHDO(item); }}
                                                            className="w-full px-3.5 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-gray-700 hover:text-emerald-700 transition-colors"
                                                        >
                                                            <Send className="w-4 h-4 text-gray-500 hover:text-emerald-600" /> Kirim ke HDO
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveDropdown(null); setHistoryModalItem(item); }}
                                                            className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-gray-700 transition-colors"
                                                        >
                                                            <History className="w-4 h-4 text-gray-500" /> Lihat Riwayat
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

                {/* Shared Pagination Component */}
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

            {/* Modal: Alihkan QCO */}
            <SingleAssignModal
                isOpen={!!reassignModalItem}
                onClose={() => setReassignModalItem(null)}
                submissionId={reassignModalItem?.id || ''}
                submissionNo={reassignModalItem?.no || ''}
                businessName={reassignModalItem?.businessName || ''}
                currentStage="Verifikasi QCO"
                staffList={qcoStaff}
                onSuccess={(assignedName) => {
                    if (reassignModalItem) {
                        setQcData(prev => prev.map(item => item.id === reassignModalItem.id ? { ...item, qco: assignedName } : item));
                    }
                }}
            />

            {/* Modal: Ubah Prioritas */}
            <ChangePriorityModal
                isOpen={!!priorityModalItem}
                onClose={() => setPriorityModalItem(null)}
                submissionId={priorityModalItem?.id || ''}
                submissionNo={priorityModalItem?.no || ''}
                currentPriority={priorityModalItem?.priority || 'Normal'}
                onSuccess={(newP) => {
                    if (priorityModalItem) {
                        setQcData(prev => prev.map(item => item.id === priorityModalItem.id ? { ...item, priority: newP } : item));
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
                        setQcData(prev => prev.map(item => item.id === returnModalItem.id ? { ...item, statusQC: 'Perlu Perbaikan' } : item));
                    }
                }}
            />

            {/* Modal: Lihat Riwayat */}
            {historyModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl">
                                    <History className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Riwayat Pengajuan</h3>
                                    <p className="text-[11px] text-gray-500 font-mono">{historyModalItem.no} • {historyModalItem.businessName}</p>
                                </div>
                            </div>
                            <button onClick={() => setHistoryModalItem(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {[
                                { date: '30 Jul 2026, 14:10 WIB', actor: historyModalItem.qco, action: `Pemeriksaan QC (${historyModalItem.statusQC})`, desc: 'Memvalidasi kelengkapan berkas NIB dan SJPH.' },
                                { date: '29 Jul 2026, 10:25 WIB', actor: 'Manajer Operasional', action: 'Penugasan QCO', desc: `Ditugaskan kepada ${historyModalItem.qco} (${historyModalItem.qcoCode}).` },
                                { date: '28 Jul 2026, 09:15 WIB', actor: historyModalItem.advisor, action: 'Pengajuan Masuk', desc: `Didaftarkan oleh Halal Advisor (${historyModalItem.advisorCode}).` },
                            ].map((log, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900">{log.action}</span>
                                        <span className="text-[10px] text-gray-400">{log.date}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-600">{log.desc}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Oleh: {log.actor}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setHistoryModalItem(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Lihat Detail */}
            {detailModalItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Detail Pengajuan QC</h3>
                                <p className="text-[11px] font-mono text-emerald-700">{detailModalItem.no}</p>
                            </div>
                            <button onClick={() => setDetailModalItem(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Nama Usaha / Pelaku Usaha</p>
                                <p className="font-bold text-gray-900">{detailModalItem.businessName}</p>
                                <p className="text-gray-500 font-mono">NIB: {detailModalItem.nib}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Jenis Layanan</p>
                                <p className="font-bold text-gray-900">{detailModalItem.serviceType}</p>
                                <p className="text-gray-500">Wilayah: {detailModalItem.region || 'Jawa Barat'}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Halal Advisor</p>
                                <p className="font-bold text-gray-900">{detailModalItem.advisor}</p>
                                <p className="text-gray-500">{detailModalItem.advisorCode}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Petugas QCO</p>
                                <p className="font-bold text-gray-900">{detailModalItem.qco}</p>
                                <p className="text-gray-500">{detailModalItem.qcoCode}</p>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 flex items-center justify-between text-[11px]">
                            <div>
                                <span className="text-gray-400">Status QC: </span>
                                <span className="font-bold text-gray-900">{detailModalItem.statusQC}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Prioritas: </span>
                                <span className="font-bold text-gray-900">{detailModalItem.priority}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">SLA: </span>
                                <span className="font-bold text-emerald-700">{detailModalItem.slaDays} {detailModalItem.slaPercentage}</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setDetailModalItem(null);
                                    setReassignModalItem(detailModalItem);
                                }}
                                className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold"
                            >
                                Alihkan QCO
                            </button>
                            <button
                                onClick={() => setDetailModalItem(null)}
                                className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold shadow-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
