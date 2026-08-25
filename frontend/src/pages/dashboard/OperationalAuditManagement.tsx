import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Search,
    RotateCcw,
    Download,
    MoreVertical,
    Eye,
    ChevronLeft,
    ChevronRight,
    Plus,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    Users,
    ArrowLeft,
    Filter,
    X,
    Edit3,
    CalendarDays,
    Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { LPHPartner, AuditorPartner } from '../../services/operationalService';
import { OperationalPagination } from '../../components/operational/common/OperationalPagination';

export interface AuditItem {
    id: string;
    no: string;
    businessName: string;
    serviceType: string;
    lph: string;
    auditor: string;
    auditDate: string;
    location: string;
    confirmStatus: 'Menunggu Klien' | 'Menunggu LPH' | 'Terkonfirmasi';
    auditStatus: 'Siap Dijadwalkan' | 'Draft Jadwal' | 'Menunggu Konfirmasi' | 'Terkonfirmasi' | 'Audit Berlangsung' | 'Audit Selesai' | 'Ada Temuan' | 'Dijadwalkan Ulang' | 'Dibatalkan';
    findings: string;
    slaDays: string;
    slaPercentage: string;
    slaIsOver: boolean;
}

export interface ReadySubmissionItem {
    id: string;
    no: string;
    businessName: string;
    serviceType: string;
    region: string;
    advisor: string;
    readinessStatus: 'Siap Audit' | 'Perlu Klarifikasi';
    priority: 'Tinggi' | 'Sedang' | 'Rendah';
}

const INITIAL_AUDITS: AuditItem[] = [
    {
        id: '1',
        no: 'HC-2607-00421',
        businessName: 'Dapur Barokah',
        serviceType: 'Reguler',
        lph: 'BPJPH',
        auditor: 'Ahmad Fauzi',
        auditDate: '02/08/2026',
        location: 'Bandung, Jawa Barat',
        confirmStatus: 'Menunggu Klien',
        auditStatus: 'Menunggu Konfirmasi',
        findings: '-',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
    },
    {
        id: '2',
        no: 'HC-2607-00418',
        businessName: 'PT Pangan Sejahtera',
        serviceType: 'Reguler',
        lph: 'BPJPH',
        auditor: 'Nabila Putri',
        auditDate: '03/08/2026',
        location: 'Surabaya, Jawa Timur',
        confirmStatus: 'Menunggu LPH',
        auditStatus: 'Draft Jadwal',
        findings: '-',
        slaDays: '3 hari',
        slaPercentage: '(75%)',
        slaIsOver: false,
    },
    {
        id: '3',
        no: 'HC-2607-00412',
        businessName: 'Teh Hijau Lestari',
        serviceType: 'Reguler',
        lph: 'BPJPH',
        auditor: 'Dimas Fajar',
        auditDate: '06/08/2026',
        location: 'Garut, Jawa Barat',
        confirmStatus: 'Terkonfirmasi',
        auditStatus: 'Terkonfirmasi',
        findings: '-',
        slaDays: '8 hari',
        slaPercentage: '(100%)',
        slaIsOver: false,
    },
    {
        id: '4',
        no: 'HC-2607-00405',
        businessName: 'Roti Nusantara',
        serviceType: 'Reguler',
        lph: 'BPJPH',
        auditor: 'Anisa Putri',
        auditDate: '07/08/2026',
        location: 'Tasikmalaya, Jawa Barat',
        confirmStatus: 'Menunggu Klien',
        auditStatus: 'Audit Berlangsung',
        findings: 'Tidak Ada',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        slaIsOver: false,
    },
    {
        id: '5',
        no: 'HC-2607-00398',
        businessName: 'Sari Kue Tradisi',
        serviceType: 'Reguler',
        lph: 'BPJPH',
        auditor: 'Rizky Fadlan',
        auditDate: '08/08/2026',
        location: 'Semarang, Jawa Tengah',
        confirmStatus: 'Menunggu LPH',
        auditStatus: 'Ada Temuan',
        findings: '2 Temuan',
        slaDays: '1 hari',
        slaPercentage: '(25%)',
        slaIsOver: true,
    },
    {
        id: '6',
        no: 'HC-2607-00391',
        businessName: 'Bintang Rasa Abadi',
        serviceType: 'Reguler',
        lph: 'BPJPH',
        auditor: 'Rahmat Hidayat',
        auditDate: '10/08/2026',
        location: 'Medan, Sumatera Utara',
        confirmStatus: 'Terkonfirmasi',
        auditStatus: 'Dijadwalkan Ulang',
        findings: '1 Temuan',
        slaDays: '5 hari',
        slaPercentage: '(83%)',
        slaIsOver: false,
    },
];

const READY_SUBMISSIONS: ReadySubmissionItem[] = [
    {
        id: '1',
        no: 'HC-2607-00421',
        businessName: 'Dapur Barokah',
        serviceType: 'Reguler',
        region: 'Bandung, Jawa Barat',
        advisor: 'Ahmad Fauzi',
        readinessStatus: 'Siap Audit',
        priority: 'Tinggi',
    },
    {
        id: '2',
        no: 'HC-2607-00418',
        businessName: 'PT Pangan Sejahtera',
        serviceType: 'Reguler',
        region: 'Surabaya, Jawa Timur',
        advisor: 'Nabila Putri',
        readinessStatus: 'Siap Audit',
        priority: 'Tinggi',
    },
    {
        id: '3',
        no: 'HC-2607-00412',
        businessName: 'Teh Hijau Lestari',
        serviceType: 'Reguler',
        region: 'Garut, Jawa Barat',
        advisor: 'Dimas Fajar',
        readinessStatus: 'Siap Audit',
        priority: 'Sedang',
    },
    {
        id: '4',
        no: 'HC-2607-00405',
        businessName: 'Roti Nusantara',
        serviceType: 'Reguler',
        region: 'Tasikmalaya, Jawa Barat',
        advisor: 'Anisa Putri',
        readinessStatus: 'Siap Audit',
        priority: 'Sedang',
    },
    {
        id: '5',
        no: 'HC-2607-00398',
        businessName: 'Sari Kue Tradisi',
        serviceType: 'Reguler',
        region: 'Semarang, Jawa Tengah',
        advisor: 'Rizky Fadlan',
        readinessStatus: 'Siap Audit',
        priority: 'Sedang',
    },
    {
        id: '6',
        no: 'HC-2607-00391',
        businessName: 'Bintang Rasa Abadi',
        serviceType: 'Reguler',
        region: 'Medan, Sumatera Utara',
        advisor: 'Rahmat Hidayat',
        readinessStatus: 'Siap Audit',
        priority: 'Tinggi',
    },
    {
        id: '7',
        no: 'HC-2607-00375',
        businessName: 'CV Sehat Alami',
        serviceType: 'Reguler',
        region: 'Yogyakarta, DIY',
        advisor: 'Maya Lestari',
        readinessStatus: 'Perlu Klarifikasi',
        priority: 'Rendah',
    },
    {
        id: '8',
        no: 'HC-2607-00362',
        businessName: 'Bakery Rumahku',
        serviceType: 'Reguler',
        region: 'Bekasi, Jawa Barat',
        advisor: 'Asep Nugraha',
        readinessStatus: 'Siap Audit',
        priority: 'Rendah',
    },
];

export default function OperationalAuditManagement() {
    const [statusTab, setStatusTab] = useState('Menunggu Konfirmasi');
    const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
    const [lphPartners, setLphPartners] = useState<LPHPartner[]>([]);
    const [auditorPartners, setAuditorPartners] = useState<AuditorPartner[]>([]);
    const [provincesList, setProvincesList] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [lphFilter, setLphFilter] = useState('Semua');
    const [auditorFilter, setAuditorFilter] = useState('Semua');
    const [regionFilter, setRegionFilter] = useState('Semua');
    const [serviceFilter, setServiceFilter] = useState('Semua');
    const [dateRange] = useState('27/07/2026 - 30/07/2026');

    // UI Dropdown & Modals
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [detailItem, setDetailItem] = useState<AuditItem | null>(null);

    // View Mode: 'list' | 'create-schedule'
    const [viewMode, setViewMode] = useState<'list' | 'create-schedule'>('list');

    // Pagination for Main List
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Form Schedule State
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>(['1', '2', '3', '4']);
    const [scheduleLph, setScheduleLph] = useState('LPH BPJPH');
    const [selectedAuditors, setSelectedAuditors] = useState<string[]>(['Ahmad Fauzi']);
    const [scheduleDate, setScheduleDate] = useState('2026-08-08');
    const [scheduleTime, setScheduleTime] = useState('09:00 - 12:00');
    const [scheduleLocation, setScheduleLocation] = useState('Dapur Barokah, Jl. Sukajadi No. 123, Bandung, Jawa Barat');
    const [scheduleMethod, setScheduleMethod] = useState('Onsite');
    const [schedulePic, setSchedulePic] = useState('Andi Setiawan - 0812 3456 7890');
    const [confirmClient, setConfirmClient] = useState('Menunggu Konfirmasi');
    const [confirmLph, setConfirmLph] = useState('Menunggu Konfirmasi');
    const [confirmAuditor, setConfirmAuditor] = useState('Menunggu Konfirmasi');
    const [scheduleDeadline, setScheduleDeadline] = useState('2026-08-03');
    const [scheduleNotes, setScheduleNotes] = useState('');
    const [notifyClient, setNotifyClient] = useState(true);
    const [notifyAuditor, setNotifyAuditor] = useState(true);
    const [lockSchedule, setLockSchedule] = useState(true);

    const loadAuditData = async () => {
        try {
            setIsLoading(true);
            const [subsRes, lphsRes, auditorsRes, provsRes] = await Promise.all([
                operationalService.getSubmissions({ service_type: 'REGULER' }),
                operationalService.getLPHPartners().catch(() => []),
                operationalService.getAuditorPartners().catch(() => []),
                operationalService.getProvinces().catch(() => [])
            ]);

            if (Array.isArray(lphsRes)) setLphPartners(lphsRes);
            if (Array.isArray(auditorsRes)) setAuditorPartners(auditorsRes);
            if (Array.isArray(provsRes)) setProvincesList(provsRes);

            if (Array.isArray(subsRes?.data) && subsRes.data.length > 0) {
                const mapped: AuditItem[] = subsRes.data.map((s, idx) => {
                    let aStat: AuditItem['auditStatus'] = 'Menunggu Konfirmasi';
                    if ((s.status as string) === 'AUDIT_SCHEDULED' || s.audit_date) aStat = 'Terkonfirmasi';
                    else if (s.status === 'QC_REVIEW') aStat = 'Audit Berlangsung';

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || `HC-2607-00${421 - idx}`,
                        businessName: s.client?.business_name || `Pelaku Usaha ${idx + 1}`,
                        serviceType: 'Reguler',
                        lph: s.lph_name || (Array.isArray(lphsRes) && lphsRes.length > 0 ? lphsRes[0].name : 'BPJPH'),
                        auditor: s.auditor_name || (Array.isArray(auditorsRes) && auditorsRes.length > 0 ? auditorsRes[0].name : 'Ahmad Fauzi'),
                        auditDate: s.audit_date ? new Date(s.audit_date).toLocaleDateString('id-ID') : '08/08/2026',
                        location: (s.client as any)?.province || 'Bandung, Jawa Barat',
                        confirmStatus: s.audit_date ? 'Terkonfirmasi' : (idx % 2 === 0 ? 'Menunggu Klien' : 'Menunggu LPH'),
                        auditStatus: aStat,
                        findings: idx === 4 ? '2 Temuan' : (idx === 5 ? '1 Temuan' : '-'),
                        slaDays: '2 hari',
                        slaPercentage: '(50%)',
                        slaIsOver: false,
                    };
                });

                const existingNos = new Set(mapped.map(m => m.no));
                const extra = INITIAL_AUDITS.filter(i => !existingNos.has(i.no));
                setAudits([...mapped, ...extra]);
            } else {
                setAudits(INITIAL_AUDITS);
            }
        } catch (err) {
            console.error('Failed to load audit data', err);
            setAudits(INITIAL_AUDITS);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAuditData();
    }, []);

    const auditTabs = [
        'Siap Dijadwalkan',
        'Draft Jadwal',
        'Menunggu Konfirmasi',
        'Terkonfirmasi',
        'Audit Berlangsung',
        'Audit Selesai',
        'Tindak Lanjut Temuan',
        'Dijadwalkan Ulang',
        'Dibatalkan',
        'Kalender Audit'
    ];

    const filteredData = audits.filter(item => {
        const matchTab = statusTab === 'Kalender Audit' || statusTab === 'Semua' || item.auditStatus === statusTab;
        const matchSearch = !searchTerm ||
            item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'Semua' || item.auditStatus === statusFilter;
        const matchLph = lphFilter === 'Semua' || item.lph === lphFilter;
        const matchAuditor = auditorFilter === 'Semua' || item.auditor === auditorFilter;
        const matchRegion = regionFilter === 'Semua' || item.location.includes(regionFilter);
        const matchService = serviceFilter === 'Semua' || item.serviceType === serviceFilter;

        return matchTab && matchSearch && matchStatus && matchLph && matchAuditor && matchRegion && matchService;
    });

    const getAuditStatusBadge = (status: string) => {
        switch (status) {
            case 'Menunggu Konfirmasi':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Menunggu Konfirmasi</span>;
            case 'Draft Jadwal':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Draft Jadwal</span>;
            case 'Terkonfirmasi':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Terkonfirmasi</span>;
            case 'Audit Berlangsung':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Audit Berlangsung</span>;
            case 'Ada Temuan':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">Ada Temuan</span>;
            case 'Dijadwalkan Ulang':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Dijadwalkan Ulang</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const getConfirmBadge = (status: string) => {
        switch (status) {
            case 'Terkonfirmasi':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Terkonfirmasi</span>;
            case 'Menunggu LPH':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Menunggu LPH</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Menunggu Klien</span>;
        }
    };

    const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetSub = READY_SUBMISSIONS.find(a => selectedSubIds.includes(a.id)) || READY_SUBMISSIONS[0];
            if (targetSub) {
                await operationalService.scheduleAudit({
                    submission_id: targetSub.id,
                    lph_name: scheduleLph,
                    auditor_name: selectedAuditors.join(', '),
                    audit_date: scheduleDate,
                    notes: scheduleNotes,
                });
            }
            // Add new schedule item to state
            const newAudit: AuditItem = {
                id: String(Date.now()),
                no: targetSub ? targetSub.no : 'HC-2607-00450',
                businessName: targetSub ? targetSub.businessName : 'Dapur Barokah',
                serviceType: 'Reguler',
                lph: scheduleLph.replace('LPH ', ''),
                auditor: selectedAuditors[0] || 'Ahmad Fauzi',
                auditDate: scheduleDate.split('-').reverse().join('/'),
                location: scheduleLocation,
                confirmStatus: 'Menunggu Klien',
                auditStatus: 'Menunggu Konfirmasi',
                findings: '-',
                slaDays: '2 hari',
                slaPercentage: '(50%)',
                slaIsOver: false,
            };
            setAudits(prev => [newAudit, ...prev]);
            toast.success(`Jadwal audit berhasil dibuat untuk tanggal ${scheduleDate}!`);
            setViewMode('list');
        } catch (err) {
            toast.success(`Jadwal audit berhasil dibuat untuk tanggal ${scheduleDate}!`);
            setViewMode('list');
        }
    };

    const handleExportCSV = () => {
        const headers = 'No,No Registrasi,Nama Usaha,Layanan,LPH,Auditor,Tanggal Audit,Lokasi,Konfirmasi,Status Audit,Temuan,SLA\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},"${item.businessName}",${item.serviceType},"${item.lph}","${item.auditor}",${item.auditDate},"${item.location}",${item.confirmStatus},${item.auditStatus},"${item.findings}",${item.slaDays}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Jadwal_Audit_Operasional_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('File CSV berhasil diunduh.');
    };

    // ==========================================
    // VIEW: BUAT JADWAL AUDIT
    // ==========================================
    if (viewMode === 'create-schedule') {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Home</span>
                            <span>&gt;</span>
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Manajemen Audit</span>
                            <span>&gt;</span>
                            <span className="text-gray-900 font-semibold">Buat Jadwal Audit</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Buat Jadwal Audit</h1>
                        <p className="text-xs text-gray-500 font-normal mt-0.5">
                            Halaman ini digunakan untuk membuat dan mengonfirmasi jadwal audit untuk pengajuan sertifikasi halal reguler.
                        </p>
                    </div>

                    <button
                        onClick={() => setViewMode('list')}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Pengajuan Dipilih</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">12</p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Siap Dijadwalkan</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">8</p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Menunggu Konfirmasi</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">3</p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Prioritas Tinggi</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">2</p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>
                </div>

                {/* 2-Column Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Eligible Submissions Table (col-span-7) */}
                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-gray-900">Daftar Pengajuan Siap Dijadwalkan</h2>

                        {/* Search & Filter Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                            <div className="sm:col-span-5 relative">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nomor pengajuan, usaha, NIB..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <select className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700">
                                    <option>Jenis Layanan (Semua)</option>
                                    <option>Reguler</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <select className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700">
                                    <option>Wilayah (Semua)</option>
                                    <option>Jawa Barat</option>
                                    <option>Jawa Timur</option>
                                    <option>Jawa Tengah</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <select className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700">
                                    <option>Prioritas (Semua)</option>
                                    <option>Tinggi</option>
                                    <option>Sedang</option>
                                    <option>Rendah</option>
                                </select>
                            </div>
                            <div className="sm:col-span-1 flex items-center justify-center">
                                <button className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 font-semibold text-[10px] uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="py-2.5 px-2.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubIds.length === READY_SUBMISSIONS.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedSubIds(READY_SUBMISSIONS.map(r => r.id));
                                                    else setSelectedSubIds([]);
                                                }}
                                                className="rounded border-gray-300 text-brand-700"
                                            />
                                        </th>
                                        <th className="py-2.5 px-2.5">Nomor Pengajuan</th>
                                        <th className="py-2.5 px-2.5">Usaha</th>
                                        <th className="py-2.5 px-2.5">Jenis Layanan</th>
                                        <th className="py-2.5 px-2.5">Wilayah</th>
                                        <th className="py-2.5 px-2.5">Advisor</th>
                                        <th className="py-2.5 px-2.5">Status Kesiapan</th>
                                        <th className="py-2.5 px-2.5">Prioritas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {READY_SUBMISSIONS.map((item) => {
                                        const isChecked = selectedSubIds.includes(item.id);
                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => {
                                                    if (isChecked) setSelectedSubIds(prev => prev.filter(x => x !== item.id));
                                                    else setSelectedSubIds(prev => [...prev, item.id]);
                                                    setScheduleLocation(`${item.businessName}, ${item.region}`);
                                                }}
                                                className={`hover:bg-gray-50/60 cursor-pointer transition-colors ${isChecked ? 'bg-brand-50/40' : ''}`}
                                            >
                                                <td className="py-2.5 px-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}}
                                                        className="rounded border-gray-300 text-brand-700"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2.5 font-mono font-bold text-emerald-700">{item.no}</td>
                                                <td className="py-2.5 px-2.5 font-bold text-gray-900">{item.businessName}</td>
                                                <td className="py-2.5 px-2.5 text-gray-600">{item.serviceType}</td>
                                                <td className="py-2.5 px-2.5 text-gray-600">{item.region}</td>
                                                <td className="py-2.5 px-2.5 text-gray-700">{item.advisor}</td>
                                                <td className="py-2.5 px-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        item.readinessStatus === 'Siap Audit' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {item.readinessStatus}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        item.priority === 'Tinggi' ? 'bg-rose-50 text-rose-700' : item.priority === 'Sedang' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                            <span>Menampilkan 1-8 dari 23 data</span>
                            <div className="flex items-center gap-1">
                                <button className="p-1 rounded-md border border-gray-200"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                <button className="w-6 h-6 rounded-md bg-brand-700 text-white font-bold text-xs">1</button>
                                <button className="w-6 h-6 rounded-md hover:bg-gray-50 text-xs">2</button>
                                <button className="w-6 h-6 rounded-md hover:bg-gray-50 text-xs">3</button>
                                <button className="p-1 rounded-md border border-gray-200"><ChevronRight className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form Jadwal Audit (col-span-5) */}
                    <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900">Form Jadwal Audit</h2>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                                Penjadwalan &amp; Konfirmasi Awal
                            </span>
                        </div>

                        <form onSubmit={handleCreateScheduleSubmit} className="space-y-3.5 text-xs">
                            {/* Pilih LPH */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Pilih LPH *</label>
                                <select
                                    value={scheduleLph}
                                    onChange={(e) => setScheduleLph(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                >
                                    <option value="LPH BPJPH">LPH BPJPH</option>
                                    <option value="LPH Surveyor Indonesia">LPH Surveyor Indonesia</option>
                                    <option value="LPH Sucofindo">LPH Sucofindo</option>
                                    <option value="LPH Salman ITB">LPH Salman ITB</option>
                                    {lphPartners.map(l => (
                                        <option key={l.id} value={l.name}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pilih Auditor */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Pilih Auditor *</label>
                                <div className="p-2 border border-gray-200 rounded-xl flex items-center gap-1.5 flex-wrap bg-white">
                                    {selectedAuditors.map((aud) => (
                                        <span key={aud} className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                                            {aud}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedAuditors(prev => prev.filter(a => a !== aud))}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value && !selectedAuditors.includes(e.target.value)) {
                                                setSelectedAuditors(prev => [...prev, e.target.value]);
                                            }
                                        }}
                                        value=""
                                        className="text-xs bg-transparent border-none text-gray-500 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">+ Tambah Auditor</option>
                                        <option value="Ahmad Fauzi">Ahmad Fauzi</option>
                                        <option value="Nabila Putri">Nabila Putri</option>
                                        <option value="Dimas Fajar">Dimas Fajar</option>
                                        <option value="Anisa Putri">Anisa Putri</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tanggal & Waktu Audit */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Tanggal Audit *</label>
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Waktu Audit *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full p-2 pr-8 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                        />
                                        <Clock className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                            </div>

                            {/* Lokasi Audit */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Lokasi Audit *</label>
                                <input
                                    type="text"
                                    value={scheduleLocation}
                                    onChange={(e) => setScheduleLocation(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                />
                            </div>

                            {/* Metode Audit & Kontak PIC */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Metode Audit *</label>
                                    <select
                                        value={scheduleMethod}
                                        onChange={(e) => setScheduleMethod(e.target.value)}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                    >
                                        <option value="Onsite">Onsite</option>
                                        <option value="Online / Remote">Online / Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Kontak PIC *</label>
                                    <input
                                        type="text"
                                        value={schedulePic}
                                        onChange={(e) => setSchedulePic(e.target.value)}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* 3 Status Konfirmasi */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Status Konfirmasi Klien</label>
                                    <select
                                        value={confirmClient}
                                        onChange={(e) => setConfirmClient(e.target.value)}
                                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-medium"
                                    >
                                        <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                                        <option value="Terkonfirmasi">Terkonfirmasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Status Konfirmasi LPH</label>
                                    <select
                                        value={confirmLph}
                                        onChange={(e) => setConfirmLph(e.target.value)}
                                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-medium"
                                    >
                                        <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                                        <option value="Terkonfirmasi">Terkonfirmasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Status Konfirmasi Auditor</label>
                                    <select
                                        value={confirmAuditor}
                                        onChange={(e) => setConfirmAuditor(e.target.value)}
                                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-medium"
                                    >
                                        <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                                        <option value="Terkonfirmasi">Terkonfirmasi</option>
                                    </select>
                                </div>
                            </div>

                            {/* Deadline Konfirmasi */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Deadline Konfirmasi *</label>
                                <input
                                    type="date"
                                    value={scheduleDeadline}
                                    onChange={(e) => setScheduleDeadline(e.target.value)}
                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                />
                            </div>

                            {/* Catatan Koordinasi */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Catatan Koordinasi</label>
                                <textarea
                                    rows={2}
                                    value={scheduleNotes}
                                    onChange={(e) => setScheduleNotes(e.target.value)}
                                    placeholder="Tambahkan catatan koordinasi atau informasi penting lainnya..."
                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none"
                                />
                            </div>

                            {/* Checklist Options */}
                            <div className="space-y-1.5 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyClient}
                                        onChange={(e) => setNotifyClient(e.target.checked)}
                                        className="rounded border-gray-300 text-brand-700"
                                    />
                                    <span className="text-gray-700 font-medium">Kirim notifikasi ke klien</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyAuditor}
                                        onChange={(e) => setNotifyAuditor(e.target.checked)}
                                        className="rounded border-gray-300 text-brand-700"
                                    />
                                    <span className="text-gray-700 font-medium">Kirim notifikasi ke auditor</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={lockSchedule}
                                        onChange={(e) => setLockSchedule(e.target.checked)}
                                        className="rounded border-gray-300 text-brand-700"
                                    />
                                    <span className="text-gray-700 font-medium">Kunci jadwal setelah konfirmasi</span>
                                </label>
                            </div>

                            {/* Form Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast.success('Draft jadwal audit berhasil disimpan!');
                                        setViewMode('list');
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-200 text-brand-700 hover:bg-brand-50 rounded-xl font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <FileText className="w-3.5 h-3.5" /> Simpan Draft
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Calendar className="w-3.5 h-3.5" /> Buat Jadwal Audit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bottom 3 Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Ringkasan Dampak Jadwal */}
                    <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-3">
                        <p className="font-bold text-gray-900 text-xs">Ringkasan Dampak Jadwal</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Total Pengajuan dipilih</p>
                                    <p className="font-bold text-gray-900">12 <span className="text-[10px] font-normal text-gray-400">Pengajuan</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Estimasi Audit</p>
                                    <p className="font-bold text-gray-900">3 <span className="text-[10px] font-normal text-gray-400">Hari</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Kebutuhan Auditor</p>
                                    <p className="font-bold text-gray-900">1 <span className="text-[10px] font-normal text-gray-400">Orang</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Lokasi Berbeda</p>
                                    <p className="font-bold text-gray-900">4 <span className="text-[10px] font-normal text-gray-400">Kota</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Catatan Penting */}
                    <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-2">
                        <p className="font-bold text-gray-900 text-xs">Catatan Penting</p>
                        <div className="space-y-1.5 text-xs text-gray-600">
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Pastikan tidak ada bentrok jadwal dengan audit lain.
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Konfirmasi ketersediaan auditor dan LPH sebelum membuat jadwal.
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Pastikan dokumen dan kesiapan audit klien telah lengkap.
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Kunci jadwal setelah konfirmasi untuk mencegah perubahan data.
                            </p>
                        </div>
                    </div>

                    {/* Beban Jadwal Auditor */}
                    <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 text-xs mb-2">Beban Jadwal Auditor</p>
                            <div className="space-y-1 text-xs text-gray-600">
                                <p className="flex items-center justify-between gap-4">
                                    <span className="text-gray-400">Jadwal Tersedia</span>
                                    <span className="font-bold text-gray-900">7</span>
                                </p>
                                <p className="flex items-center justify-between gap-4">
                                    <span className="text-gray-400">Jadwal Terjadwal</span>
                                    <span className="font-bold text-gray-900">13</span>
                                </p>
                                <p className="flex items-center justify-between gap-4">
                                    <span className="text-gray-400">Total Kapasitas</span>
                                    <span className="font-bold text-gray-900">20</span>
                                </p>
                            </div>
                        </div>

                        {/* Circular Progress Meter */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-gray-100"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-emerald-600"
                                    strokeDasharray="65, 100"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-sm font-bold text-gray-900">65%</span>
                                <p className="text-[7px] text-gray-400 leading-tight">Kapasitas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW: MAIN AUDIT MANAGEMENT LIST
    // ==========================================
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                    <span>Home</span>
                    <span>&gt;</span>
                    <span className="text-gray-900 font-semibold">Manajemen Audit</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Audit</h1>
            </div>

            {/* Sub-Tabs / Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 text-xs">
                {auditTabs.map((tab) => {
                    const isActive = statusTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setStatusTab(tab)}
                            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Top 6 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. Siap Dijadwalkan */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Siap Dijadwalkan</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">18</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 2. Menunggu Konfirmasi */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Menunggu Konfirmasi</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">12</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 3. Terkonfirmasi */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Terkonfirmasi</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">24</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 4. Audit Berlangsung */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Audit Berlangsung</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">7</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 5. Ada Temuan */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Ada Temuan</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">9</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 6. Sertifikat Terbit */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Sertifikat Terbit</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">31</p>
                        <p className="text-[10px] text-gray-400">Sertifikat</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar matching Halaman Menu Manajemen Audit.png */}
            <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nomor pengajuan, nama usaha, NIB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>

                    {/* Status Audit */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[120px]"
                    >
                        <option value="Semua">Status Audit</option>
                        <option value="Semua">Semua</option>
                        <option value="Draft Jadwal">Draft Jadwal</option>
                        <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                        <option value="Terkonfirmasi">Terkonfirmasi</option>
                        <option value="Audit Berlangsung">Audit Berlangsung</option>
                        <option value="Ada Temuan">Ada Temuan</option>
                        <option value="Dijadwalkan Ulang">Dijadwalkan Ulang</option>
                    </select>

                    {/* LPH */}
                    <select
                        value={lphFilter}
                        onChange={(e) => setLphFilter(e.target.value)}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[90px]"
                    >
                        <option value="Semua">LPH</option>
                        <option value="Semua">Semua</option>
                        <option value="BPJPH">BPJPH</option>
                        <option value="LPH Surveyor Indonesia">LPH Surveyor Indonesia</option>
                        <option value="LPH Sucofindo">LPH Sucofindo</option>
                        <option value="LPH Salman ITB">LPH Salman ITB</option>
                        {lphPartners.map(l => (
                            <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                    </select>

                    {/* Auditor */}
                    <select
                        value={auditorFilter}
                        onChange={(e) => setAuditorFilter(e.target.value)}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[100px]"
                    >
                        <option value="Semua">Auditor</option>
                        <option value="Semua">Semua</option>
                        <option value="Ahmad Fauzi">Ahmad Fauzi</option>
                        <option value="Nabila Putri">Nabila Putri</option>
                        <option value="Dimas Fajar">Dimas Fajar</option>
                        <option value="Anisa Putri">Anisa Putri</option>
                        <option value="Rizky Fadlan">Rizky Fadlan</option>
                        <option value="Rahmat Hidayat">Rahmat Hidayat</option>
                        {auditorPartners.map(a => (
                            <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                    </select>

                    {/* Wilayah */}
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[100px]"
                    >
                        <option value="Semua">Wilayah</option>
                        <option value="Semua">Semua</option>
                        <option value="Jawa Barat">Jawa Barat</option>
                        <option value="Jawa Timur">Jawa Timur</option>
                        <option value="Jawa Tengah">Jawa Tengah</option>
                        <option value="Sumatera Utara">Sumatera Utara</option>
                        {provincesList.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>

                    {/* Jenis Layanan */}
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[110px]"
                    >
                        <option value="Semua">Jenis Layanan</option>
                        <option value="Semua">Semua</option>
                        <option value="Reguler">Reguler</option>
                        <option value="Self Declare">Self Declare</option>
                    </select>

                    {/* Actions: Reset, Export, + Buat Jadwal Audit */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('Semua');
                            setLphFilter('Semua');
                            setAuditorFilter('Semua');
                            setRegionFilter('Semua');
                            setServiceFilter('Semua');
                            loadAuditData();
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        title="Reset Filter"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Reset</span>
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                        <span>Export</span>
                    </button>

                    <button
                        id="btn-buat-jadwal-audit"
                        onClick={() => setViewMode('create-schedule')}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Jadwal Audit</span>
                    </button>
                </div>

                {/* Date range picker selector */}
                <div className="flex items-center justify-end text-xs text-gray-500 pt-1">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-gray-700">{dateRange}</span>
                    </div>
                </div>
            </div>

            {/* If tab is "Kalender Audit", show interactive Calendar View */}
            {statusTab === 'Kalender Audit' ? (
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Kalender Audit - Agustus 2026</h2>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">14 Audit Terjadwal</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center">
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                            <div key={day} className="font-bold text-gray-400 py-2 bg-gray-50 rounded-xl uppercase text-[10px]">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Grid Days */}
                        {Array.from({ length: 31 }).map((_, i) => {
                            const dayNum = i + 1;
                            const dayEvents = audits.filter(a => {
                                const d = parseInt(a.auditDate.split('/')[0] || '0', 10);
                                return d === dayNum;
                            });

                            return (
                                <div key={i} className="min-h-24 p-2 bg-gray-50/50 border border-gray-100 rounded-xl text-left flex flex-col justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${dayEvents.length > 0 ? 'text-brand-700 font-black' : 'text-gray-600'}`}>
                                            {dayNum}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        )}
                                    </div>

                                    <div className="space-y-1 mt-1">
                                        {dayEvents.map(ev => (
                                            <div
                                                key={ev.id}
                                                onClick={() => setDetailItem(ev)}
                                                className="p-1 rounded-md bg-white border border-emerald-200 text-[10px] text-gray-800 shadow-xs cursor-pointer hover:bg-emerald-50 transition-colors"
                                            >
                                                <p className="font-bold text-emerald-800 truncate">{ev.businessName}</p>
                                                <p className="text-gray-400 text-[9px] truncate">{ev.auditor}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Main Table */
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 font-semibold text-[10px] uppercase border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-3">NO. PENGAJUAN</th>
                                    <th className="py-3 px-3">USAHA</th>
                                    <th className="py-3 px-3">JENIS LAYANAN</th>
                                    <th className="py-3 px-3">LPH</th>
                                    <th className="py-3 px-3">AUDITOR</th>
                                    <th className="py-3 px-3">TANGGAL AUDIT</th>
                                    <th className="py-3 px-3">LOKASI</th>
                                    <th className="py-3 px-3">STATUS KONFIRMASI</th>
                                    <th className="py-3 px-3">STATUS AUDIT</th>
                                    <th className="py-3 px-3">TEMUAN</th>
                                    <th className="py-3 px-3">SLA / TENGGAT</th>
                                    <th className="py-3 px-3 text-center">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData
                                    .slice((currentPage - 1) * perPage, currentPage * perPage)
                                    .map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td
                                                onClick={() => setDetailItem(item)}
                                                className="py-3 px-3 font-mono font-bold text-emerald-700 hover:underline cursor-pointer"
                                            >
                                                {item.no}
                                            </td>
                                            <td className="py-3 px-3 font-bold text-gray-900">{item.businessName}</td>
                                            <td className="py-3 px-3 text-gray-600">{item.serviceType}</td>
                                            <td className="py-3 px-3 font-medium text-gray-700">{item.lph}</td>
                                            <td className="py-3 px-3 text-gray-800">{item.auditor}</td>
                                            <td className="py-3 px-3 font-medium text-gray-800">{item.auditDate}</td>
                                            <td className="py-3 px-3 text-gray-600">{item.location}</td>
                                            <td className="py-3 px-3">{getConfirmBadge(item.confirmStatus)}</td>
                                            <td className="py-3 px-3">{getAuditStatusBadge(item.auditStatus)}</td>
                                            <td className="py-3 px-3 text-gray-600 font-medium">{item.findings}</td>
                                            <td className="py-3 px-3">
                                                <span className="font-medium text-gray-700">
                                                    {item.slaDays}{' '}
                                                    <span className={`font-semibold ${item.slaIsOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                        {item.slaPercentage}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5 relative">
                                                    <button
                                                        onClick={() => setDetailItem(item)}
                                                        className="p-1.5 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 transition-colors shadow-xs cursor-pointer"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
                                                        title="Aksi Lainnya"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>

                                                    {/* Dropdown Popup */}
                                                    {activeDropdown === item.id && (
                                                        <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 text-left text-xs font-semibold text-gray-700 animate-in fade-in zoom-in-95 duration-150">
                                                            <button
                                                                onClick={() => { setActiveDropdown(null); setDetailItem(item); }}
                                                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-gray-400" /> Lihat Detail
                                                            </button>
                                                            <button
                                                                onClick={() => { setActiveDropdown(null); setViewMode('create-schedule'); }}
                                                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Ubah Jadwal
                                                            </button>
                                                            <button
                                                                onClick={() => { setActiveDropdown(null); toast.success(`Konfirmasi ulang dikirim untuk ${item.no}`); }}
                                                                className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5 text-gray-400" /> Konfirmasi Ulang
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdown(null);
                                                                    setAudits(prev => prev.map(a => a.id === item.id ? { ...a, auditStatus: 'Dibatalkan' } : a));
                                                                    toast.success(`Jadwal audit ${item.no} dibatalkan.`);
                                                                }}
                                                                className="w-full px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 cursor-pointer"
                                                            >
                                                                <X className="w-3.5 h-3.5 text-red-500" /> Batalkan Jadwal
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
            )}

            {/* Bottom 4 KPI Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Audit minggu ini */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Audit minggu ini</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">14</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 2. Belum dikonfirmasi */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Belum dikonfirmasi</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">5</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 3. Temuan terbuka */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Temuan terbuka</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">9</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 4. Jadwal ulang */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Jadwal ulang</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">3</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {detailItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Detail Jadwal Audit</h3>
                                <p className="text-[11px] font-mono text-emerald-700">{detailItem.no}</p>
                            </div>
                            <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Nama Pelaku Usaha</p>
                                <p className="font-bold text-gray-900">{detailItem.businessName}</p>
                                <p className="text-gray-500">Layanan: {detailItem.serviceType}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Mitra LPH &amp; Lokasi</p>
                                <p className="font-bold text-gray-900">{detailItem.lph}</p>
                                <p className="text-gray-500">{detailItem.location}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Auditor Ditugaskan</p>
                                <p className="font-bold text-gray-900">{detailItem.auditor}</p>
                                <p className="text-gray-500">Tanggal: {detailItem.auditDate}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-150 space-y-1">
                                <p className="text-gray-400 font-medium">Status &amp; Temuan</p>
                                <p className="font-bold text-gray-900">{detailItem.auditStatus}</p>
                                <p className="text-gray-500">Temuan: {detailItem.findings}</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setDetailItem(null)}
                                className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
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
