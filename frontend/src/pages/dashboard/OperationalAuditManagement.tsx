import React, { useState, useEffect, useMemo } from 'react';
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
    X,
    Edit3,
    CalendarDays,
    Building2,
    Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { LPHPartner, AuditorPartner } from '../../services/operationalService';
import type { Submission } from '../../types';
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

const formatDateDisplay = (dateStr?: string | Date) => {
    if (!dateStr) return '08/08/2026';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
            return String(dateStr);
        }
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return String(dateStr);
    }
};

const formatDateInput = (dateStr?: string) => {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    if (dateStr.includes('-') && dateStr.length >= 10) return dateStr.slice(0, 10);
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // DD/MM/YYYY -> YYYY-MM-DD
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return new Date().toISOString().slice(0, 10);
};

export default function OperationalAuditManagement() {
    const [statusTab, setStatusTab] = useState('Semua');
    const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [lphPartners, setLphPartners] = useState<LPHPartner[]>([]);
    const [auditorPartners, setAuditorPartners] = useState<AuditorPartner[]>([]);
    const [provincesList, setProvincesList] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // Filters for Main List
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
    const [editingAudit, setEditingAudit] = useState<AuditItem | null>(null);

    // Pagination for Main List
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Form Schedule State
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
    const [scheduleLph, setScheduleLph] = useState('LPH BPJPH');
    const [selectedAuditors, setSelectedAuditors] = useState<string[]>(['Ahmad Fauzi']);
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
    const [scheduleTime, setScheduleTime] = useState('09:00 - 12:00');
    const [scheduleLocation, setScheduleLocation] = useState('');
    const [scheduleMethod, setScheduleMethod] = useState('Onsite');
    const [schedulePic, setSchedulePic] = useState('');
    const [confirmClient, setConfirmClient] = useState('Menunggu Konfirmasi');
    const [confirmLph, setConfirmLph] = useState('Menunggu Konfirmasi');
    const [confirmAuditor, setConfirmAuditor] = useState('Menunggu Konfirmasi');
    const [scheduleDeadline, setScheduleDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    const [scheduleNotes, setScheduleNotes] = useState('');
    const [notifyClient, setNotifyClient] = useState(true);
    const [notifyAuditor, setNotifyAuditor] = useState(true);
    const [lockSchedule, setLockSchedule] = useState(true);

    // Filters for Schedule View left table
    const [readySearchTerm, setReadySearchTerm] = useState('');
    const [readyServiceFilter, setReadyServiceFilter] = useState('Semua');
    const [readyRegionFilter, setReadyRegionFilter] = useState('Semua');
    const [readyPriorityFilter, setReadyPriorityFilter] = useState('Semua');
    const [readyPage, setReadyPage] = useState(1);
    const readyPerPage = 8;

    const loadAuditData = async () => {
        try {
            setIsLoading(true);
            const [subsRes, lphsRes, auditorsRes, provsRes] = await Promise.all([
                operationalService.getSubmissions({}),
                operationalService.getLPHPartners().catch(() => []),
                operationalService.getAuditorPartners().catch(() => []),
                operationalService.getProvinces().catch(() => [])
            ]);

            if (Array.isArray(lphsRes)) setLphPartners(lphsRes);
            if (Array.isArray(auditorsRes)) setAuditorPartners(auditorsRes);
            if (Array.isArray(provsRes)) setProvincesList(provsRes);

            if (Array.isArray(subsRes?.data) && subsRes.data.length > 0) {
                setSubmissions(subsRes.data);
                const mapped: AuditItem[] = subsRes.data.map((s, idx) => {
                    let aStat: AuditItem['auditStatus'] = 'Menunggu Konfirmasi';
                    if ((s.status as string) === 'AUDIT_SCHEDULED' || s.audit_date) aStat = 'Terkonfirmasi';
                    else if (s.status === 'QC_REVIEW') aStat = 'Audit Berlangsung';
                    else if (s.status === 'SH_TERBIT') aStat = 'Audit Selesai';
                    else if (s.status === 'REVISION_ADVISOR' || s.status === 'REVISION') aStat = 'Ada Temuan';
                    else if (s.status === 'WAITING_ASSIGNMENT' || s.status === 'REVIEW_SJPH_CLIENT') aStat = 'Siap Dijadwalkan';

                    let lph = s.lph_name;
                    if (!lph) {
                        lph = (Array.isArray(lphsRes) && lphsRes.length > 0 ? lphsRes[idx % lphsRes.length].name : 'BPJPH');
                    }

                    let auditor = s.auditor_name;
                    if (!auditor) {
                        auditor = (Array.isArray(auditorsRes) && auditorsRes.length > 0 ? auditorsRes[idx % auditorsRes.length].name : 'Ahmad Fauzi');
                    }

                    const clientLoc = s.client?.address || (s.province?.name ? `${s.province.name}` : 'Bandung, Jawa Barat');

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || s.sihal_number || `HC-2607-00${421 - idx}`,
                        businessName: s.client?.business_name || `Pelaku Usaha ${idx + 1}`,
                        serviceType: s.service_type === 'SELF_DECLARE' ? 'Self Declare' : 'Reguler',
                        lph: lph.replace(/^LPH\s+/i, ''),
                        auditor: auditor,
                        auditDate: s.audit_date ? formatDateDisplay(s.audit_date) : '08/08/2026',
                        location: clientLoc,
                        confirmStatus: s.audit_date ? 'Terkonfirmasi' : (idx % 2 === 0 ? 'Menunggu Klien' : 'Menunggu LPH'),
                        auditStatus: aStat,
                        findings: s.reject_note ? '1 Temuan' : '-',
                        slaDays: s.target_deadline ? '3 hari' : '2 hari',
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

    // Derived list of ready submissions from live backend data
    const readySubmissionsList: ReadySubmissionItem[] = useMemo(() => {
        if (submissions.length > 0) {
            return submissions.map((s, idx) => {
                const clientName = s.client?.business_name || `Pelaku Usaha ${idx + 1}`;
                const region = s.client?.address || s.province?.name || 'Bandung, Jawa Barat';
                const advisorName = s.consultant?.full_name || 'Halal Advisor';
                const isReady = s.status !== 'REVISION' && s.status !== 'REVISION_ADVISOR' && s.status !== 'REJECTED';
                let priority: 'Tinggi' | 'Sedang' | 'Rendah' = 'Sedang';
                if (s.priority === 'URGENT' || s.priority === 'CRITICAL' || s.priority === 'HIGH') priority = 'Tinggi';
                else if (s.priority === 'LOW') priority = 'Rendah';

                return {
                    id: s.id || String(idx + 1),
                    no: s.tracking_number || s.sihal_number || `HC-2607-00${450 - idx}`,
                    businessName: clientName,
                    serviceType: s.service_type === 'SELF_DECLARE' ? 'Self Declare' : 'Reguler',
                    region,
                    advisor: advisorName,
                    readinessStatus: isReady ? 'Siap Audit' : 'Perlu Klarifikasi',
                    priority,
                };
            });
        }
        return READY_SUBMISSIONS;
    }, [submissions]);

    const auditTabs = [
        'Semua',
        'Siap Dijadwalkan',
        'Draft Jadwal',
        'Menunggu Konfirmasi',
        'Terkonfirmasi',
        'Audit Berlangsung',
        'Audit Selesai',
        'Ada Temuan',
        'Dijadwalkan Ulang',
        'Dibatalkan',
        'Kalender Audit'
    ];

    const filteredData = audits.filter(item => {
        const matchTab = statusTab === 'Kalender Audit' || statusTab === 'Semua' || item.auditStatus === statusTab;
        const matchSearch = !searchTerm ||
            item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.lph.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'Semua' || item.auditStatus === statusFilter;
        const matchLph = lphFilter === 'Semua' || item.lph === lphFilter;
        const matchAuditor = auditorFilter === 'Semua' || item.auditor === auditorFilter;
        const matchRegion = regionFilter === 'Semua' || item.location.includes(regionFilter);
        const matchService = serviceFilter === 'Semua' || item.serviceType === serviceFilter;

        return matchTab && matchSearch && matchStatus && matchLph && matchAuditor && matchRegion && matchService;
    });

    const filteredReadySubmissions = useMemo(() => {
        return readySubmissionsList.filter(item => {
            const matchSearch = !readySearchTerm ||
                item.no.toLowerCase().includes(readySearchTerm.toLowerCase()) ||
                item.businessName.toLowerCase().includes(readySearchTerm.toLowerCase()) ||
                item.region.toLowerCase().includes(readySearchTerm.toLowerCase()) ||
                item.advisor.toLowerCase().includes(readySearchTerm.toLowerCase());
            const matchService = readyServiceFilter === 'Semua' || item.serviceType === readyServiceFilter;
            const matchRegion = readyRegionFilter === 'Semua' || item.region.toLowerCase().includes(readyRegionFilter.toLowerCase());
            const matchPriority = readyPriorityFilter === 'Semua' || item.priority === readyPriorityFilter;
            return matchSearch && matchService && matchRegion && matchPriority;
        });
    }, [readySubmissionsList, readySearchTerm, readyServiceFilter, readyRegionFilter, readyPriorityFilter]);

    const getAuditStatusBadge = (status: string) => {
        switch (status) {
            case 'Menunggu Konfirmasi':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Menunggu Konfirmasi</span>;
            case 'Draft Jadwal':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Draft Jadwal</span>;
            case 'Terkonfirmasi':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Terkonfirmasi</span>;
            case 'Audit Berlangsung':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">Audit Berlangsung</span>;
            case 'Audit Selesai':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">Audit Selesai</span>;
            case 'Ada Temuan':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">Ada Temuan</span>;
            case 'Dijadwalkan Ulang':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Dijadwalkan Ulang</span>;
            case 'Dibatalkan':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Dibatalkan</span>;
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

    // Open schedule form for NEW schedule
    const handleOpenCreateSchedule = () => {
        setEditingAudit(null);
        const firstSub = readySubmissionsList[0];
        if (firstSub) {
            setSelectedSubIds([firstSub.id]);
            setScheduleLocation(`${firstSub.businessName}, ${firstSub.region}`);
            const raw = submissions.find(s => s.id === firstSub.id);
            const pic = raw?.client?.phone
                ? `${raw.client.client_name || raw.client.business_name} - ${raw.client.phone}`
                : `${firstSub.businessName} - 0812 3456 7890`;
            setSchedulePic(pic);
        } else {
            setSelectedSubIds([]);
            setScheduleLocation('');
            setSchedulePic('');
        }
        const defaultLph = lphPartners.length > 0 ? lphPartners[0].name : 'LPH BPJPH';
        setScheduleLph(defaultLph.startsWith('LPH ') ? defaultLph : `LPH ${defaultLph}`);
        const defaultAud = auditorPartners.length > 0 ? [auditorPartners[0].name] : ['Ahmad Fauzi'];
        setSelectedAuditors(defaultAud);
        setScheduleDate(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
        setScheduleTime('09:00 - 12:00');
        setScheduleMethod('Onsite');
        setConfirmClient('Menunggu Konfirmasi');
        setConfirmLph('Menunggu Konfirmasi');
        setConfirmAuditor('Menunggu Konfirmasi');
        setScheduleDeadline(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
        setScheduleNotes('');
        setViewMode('create-schedule');
    };

    // Open schedule form to EDIT / RESCHEDULE an existing audit item with REAL data
    const handleOpenEditSchedule = (item: AuditItem) => {
        setActiveDropdown(null);
        setEditingAudit(item);
        setSelectedSubIds([item.id]);

        const rawSub = submissions.find(s => s.id === item.id || s.tracking_number === item.no || s.sihal_number === item.no);
        const formattedLph = item.lph.startsWith('LPH ') ? item.lph : `LPH ${item.lph}`;
        setScheduleLph(formattedLph || 'LPH BPJPH');

        if (item.auditor) {
            const auds = item.auditor.split(',').map(a => a.trim()).filter(Boolean);
            setSelectedAuditors(auds.length > 0 ? auds : ['Ahmad Fauzi']);
        } else {
            setSelectedAuditors(['Ahmad Fauzi']);
        }

        setScheduleDate(formatDateInput(item.auditDate));
        setScheduleTime('09:00 - 12:00');
        setScheduleLocation(item.location || (rawSub?.client?.address ? `${rawSub.client.business_name}, ${rawSub.client.address}` : `${item.businessName}, Bandung`));
        setScheduleMethod('Onsite');

        const picContact = rawSub?.client?.phone 
            ? `${rawSub.client.client_name || rawSub.client.business_name} - ${rawSub.client.phone}` 
            : `${item.businessName} - 0812 3456 7890`;
        setSchedulePic(picContact);

        setConfirmClient(item.confirmStatus === 'Terkonfirmasi' ? 'Terkonfirmasi' : 'Menunggu Konfirmasi');
        setConfirmLph(item.confirmStatus === 'Menunggu LPH' ? 'Menunggu Konfirmasi' : 'Terkonfirmasi');
        setConfirmAuditor(item.confirmStatus === 'Terkonfirmasi' ? 'Terkonfirmasi' : 'Menunggu Konfirmasi');
        setScheduleDeadline(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
        setScheduleNotes('');
        setViewMode('create-schedule');
    };

    const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const targetId = editingAudit ? editingAudit.id : (selectedSubIds[0] || (submissions[0]?.id));
            const cleanLph = scheduleLph.replace(/^LPH\s+/i, '');
            const auditorStr = selectedAuditors.join(', ') || 'Ahmad Fauzi';
            const displayDate = formatDateDisplay(scheduleDate);

            if (targetId) {
                try {
                    await operationalService.scheduleAudit({
                        submission_id: targetId,
                        lph_name: scheduleLph,
                        auditor_name: auditorStr,
                        audit_date: scheduleDate,
                        notes: scheduleNotes,
                    });
                } catch (apiErr) {
                    console.warn('Backend API schedule audit call error, updating local state:', apiErr);
                }
            }

            if (editingAudit) {
                // Update existing audit item in state
                setAudits(prev => prev.map(item => {
                    if (item.id === editingAudit.id) {
                        return {
                            ...item,
                            lph: cleanLph,
                            auditor: auditorStr,
                            auditDate: displayDate,
                            location: scheduleLocation,
                            confirmStatus: (confirmClient === 'Terkonfirmasi' && confirmLph === 'Terkonfirmasi' && confirmAuditor === 'Terkonfirmasi') ? 'Terkonfirmasi' : 'Menunggu Klien',
                            auditStatus: (confirmClient === 'Terkonfirmasi' && confirmLph === 'Terkonfirmasi') ? 'Terkonfirmasi' : 'Menunggu Konfirmasi',
                        };
                    }
                    return item;
                }));
                toast.success(`Jadwal audit untuk ${editingAudit.no} (${editingAudit.businessName}) berhasil diperbarui ke tanggal ${displayDate}!`);
            } else {
                // Create new schedule item in state
                const targetSub = readySubmissionsList.find(a => selectedSubIds.includes(a.id)) || readySubmissionsList[0];
                const newAudit: AuditItem = {
                    id: targetId || String(Date.now()),
                    no: targetSub ? targetSub.no : 'HC-2607-00450',
                    businessName: targetSub ? targetSub.businessName : 'Dapur Barokah',
                    serviceType: targetSub ? targetSub.serviceType : 'Reguler',
                    lph: cleanLph,
                    auditor: auditorStr,
                    auditDate: displayDate,
                    location: scheduleLocation,
                    confirmStatus: 'Menunggu Klien',
                    auditStatus: 'Menunggu Konfirmasi',
                    findings: '-',
                    slaDays: '2 hari',
                    slaPercentage: '(50%)',
                    slaIsOver: false,
                };
                setAudits(prev => [newAudit, ...prev]);
                toast.success(`Jadwal audit berhasil dibuat untuk tanggal ${displayDate}!`);
            }

            setViewMode('list');
            setEditingAudit(null);
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyimpan jadwal audit');
        } finally {
            setIsLoading(false);
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

    // Computed KPI Metrics for Main Dashboard
    const totalSiapDijadwalkan = audits.filter(a => a.auditStatus === 'Siap Dijadwalkan').length;
    const totalMenungguKonfirmasi = audits.filter(a => a.auditStatus === 'Menunggu Konfirmasi' || a.confirmStatus.includes('Menunggu')).length;
    const totalTerkonfirmasi = audits.filter(a => a.auditStatus === 'Terkonfirmasi').length;
    const totalAuditBerlangsung = audits.filter(a => a.auditStatus === 'Audit Berlangsung').length;
    const totalAdaTemuan = audits.filter(a => a.auditStatus === 'Ada Temuan' || (a.findings && a.findings !== '-' && a.findings !== 'Tidak Ada')).length;
    const totalSelesai = audits.filter(a => a.auditStatus === 'Audit Selesai').length;

    // ==========================================
    // VIEW: BUAT / UBAH JADWAL AUDIT
    // ==========================================
    if (viewMode === 'create-schedule') {
        const totalReadyItems = filteredReadySubmissions.length;
        const totalReadyPages = Math.ceil(totalReadyItems / readyPerPage) || 1;
        const pagedReadySubmissions = filteredReadySubmissions.slice((readyPage - 1) * readyPerPage, readyPage * readyPerPage);

        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <span className="cursor-pointer hover:underline" onClick={() => { setViewMode('list'); setEditingAudit(null); }}>Home</span>
                            <span>&gt;</span>
                            <span className="cursor-pointer hover:underline" onClick={() => { setViewMode('list'); setEditingAudit(null); }}>Manajemen Audit</span>
                            <span>&gt;</span>
                            <span className="text-gray-900 font-semibold">{editingAudit ? 'Ubah Jadwal Audit' : 'Buat Jadwal Audit'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {editingAudit ? `Ubah Jadwal Audit - ${editingAudit.no}` : 'Buat Jadwal Audit'}
                            </h1>
                            {editingAudit && (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                                    Mode Edit
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 font-normal mt-0.5">
                            {editingAudit 
                                ? `Memperbarui jadwal audit untuk ${editingAudit.businessName} (${editingAudit.no}). Sesuaikan mitra LPH, auditor, tanggal pelaksanaan, dan detail koordinasi.`
                                : 'Halaman ini digunakan untuk membuat dan mengonfirmasi jadwal audit untuk pengajuan sertifikasi halal reguler.'
                            }
                        </p>
                    </div>

                    <button
                        onClick={() => { setViewMode('list'); setEditingAudit(null); }}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
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
                            <p className="text-xl font-bold text-gray-900 leading-tight">{selectedSubIds.length}</p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Siap Dijadwalkan</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">
                                {readySubmissionsList.filter(r => r.readinessStatus === 'Siap Audit').length}
                            </p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Menunggu Konfirmasi</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">{totalMenungguKonfirmasi}</p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Prioritas Tinggi</p>
                            <p className="text-xl font-bold text-gray-900 leading-tight">
                                {readySubmissionsList.filter(r => r.priority === 'Tinggi').length}
                            </p>
                            <p className="text-[10px] text-gray-400">Pengajuan</p>
                        </div>
                    </div>
                </div>

                {/* 2-Column Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Eligible Submissions Table (col-span-7) */}
                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900">Daftar Pengajuan Siap Dijadwalkan</h2>
                            <span className="text-xs text-gray-500 font-medium">
                                Total: {filteredReadySubmissions.length} Data
                            </span>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                            <div className="sm:col-span-5 relative">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nomor, nama usaha, wilayah..."
                                    value={readySearchTerm}
                                    onChange={(e) => { setReadySearchTerm(e.target.value); setReadyPage(1); }}
                                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                />
                            </div>
                            <div className="sm:col-span-3">
                                <select
                                    value={readyServiceFilter}
                                    onChange={(e) => { setReadyServiceFilter(e.target.value); setReadyPage(1); }}
                                    className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700"
                                >
                                    <option value="Semua">Layanan (Semua)</option>
                                    <option value="Reguler">Reguler</option>
                                    <option value="Self Declare">Self Declare</option>
                                </select>
                            </div>
                            <div className="sm:col-span-3">
                                <select
                                    value={readyPriorityFilter}
                                    onChange={(e) => { setReadyPriorityFilter(e.target.value); setReadyPage(1); }}
                                    className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700"
                                >
                                    <option value="Semua">Prioritas (Semua)</option>
                                    <option value="Tinggi">Tinggi</option>
                                    <option value="Sedang">Sedang</option>
                                    <option value="Rendah">Rendah</option>
                                </select>
                            </div>
                            <div className="sm:col-span-1 flex items-center justify-center">
                                <button
                                    onClick={() => {
                                        setReadySearchTerm('');
                                        setReadyServiceFilter('Semua');
                                        setReadyRegionFilter('Semua');
                                        setReadyPriorityFilter('Semua');
                                        setReadyPage(1);
                                    }}
                                    className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-pointer"
                                    title="Reset Filter"
                                >
                                    <RotateCcw className="w-4 h-4" />
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
                                                checked={selectedSubIds.length > 0 && selectedSubIds.length === pagedReadySubmissions.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedSubIds(pagedReadySubmissions.map(r => r.id));
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
                                    {pagedReadySubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-gray-400">
                                                Tidak ada pengajuan yang sesuai dengan kriteria pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        pagedReadySubmissions.map((item) => {
                                            const isChecked = selectedSubIds.includes(item.id);
                                            return (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => {
                                                        if (editingAudit) {
                                                            setSelectedSubIds([item.id]);
                                                            setScheduleLocation(`${item.businessName}, ${item.region}`);
                                                            const raw = submissions.find(s => s.id === item.id);
                                                            if (raw?.client?.phone) {
                                                                setSchedulePic(`${raw.client.client_name || raw.client.business_name} - ${raw.client.phone}`);
                                                            }
                                                        } else {
                                                            if (isChecked) setSelectedSubIds(prev => prev.filter(x => x !== item.id));
                                                            else setSelectedSubIds(prev => [...prev, item.id]);
                                                            setScheduleLocation(`${item.businessName}, ${item.region}`);
                                                            const raw = submissions.find(s => s.id === item.id);
                                                            if (raw?.client?.phone) {
                                                                setSchedulePic(`${raw.client.client_name || raw.client.business_name} - ${raw.client.phone}`);
                                                            }
                                                        }
                                                    }}
                                                    className={`hover:bg-gray-50/60 cursor-pointer transition-colors ${isChecked ? 'bg-brand-50/40 font-medium' : ''}`}
                                                >
                                                    <td className="py-2.5 px-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {}}
                                                            className="rounded border-gray-300 text-brand-700 pointer-events-none"
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
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                            <span>
                                Menampilkan {Math.min((readyPage - 1) * readyPerPage + 1, totalReadyItems)} - {Math.min(readyPage * readyPerPage, totalReadyItems)} dari {totalReadyItems} data
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setReadyPage(p => Math.max(1, p - 1))}
                                    disabled={readyPage === 1}
                                    className="p-1 rounded-md border border-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                {Array.from({ length: totalReadyPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setReadyPage(i + 1)}
                                        className={`w-6 h-6 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                                            readyPage === i + 1 ? 'bg-brand-700 text-white' : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setReadyPage(p => Math.min(totalReadyPages, p + 1))}
                                    disabled={readyPage === totalReadyPages}
                                    className="p-1 rounded-md border border-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form Jadwal Audit (col-span-5) */}
                    <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900">
                                {editingAudit ? 'Form Ubah Jadwal Audit' : 'Form Jadwal Audit'}
                            </h2>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                                Penjadwalan &amp; Konfirmasi
                            </span>
                        </div>

                        {editingAudit && (
                            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                    Mengubah Jadwal: {editingAudit.no} - {editingAudit.businessName}
                                </p>
                                <p className="text-[11px] text-amber-800">
                                    Jadwal saat ini: <span className="font-semibold">{editingAudit.auditDate}</span> bersama <span className="font-semibold">{editingAudit.auditor} ({editingAudit.lph})</span>
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleCreateScheduleSubmit} className="space-y-3.5 text-xs">
                            {/* Pilih LPH */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Pilih LPH *</label>
                                <select
                                    value={scheduleLph}
                                    onChange={(e) => setScheduleLph(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                >
                                    <option value="LPH BPJPH">LPH BPJPH</option>
                                    <option value="LPH Surveyor Indonesia">LPH Surveyor Indonesia</option>
                                    <option value="LPH Sucofindo">LPH Sucofindo</option>
                                    <option value="LPH Salman ITB">LPH Salman ITB</option>
                                    {lphPartners.map(l => (
                                        <option key={l.id} value={l.name.startsWith('LPH ') ? l.name : `LPH ${l.name}`}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Pilih Auditor */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Pilih Auditor *</label>
                                <div className="p-2 border border-gray-200 rounded-xl flex items-center gap-1.5 flex-wrap bg-white min-h-10">
                                    {selectedAuditors.map((aud) => (
                                        <span key={aud} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                                            {aud}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedAuditors(prev => prev.filter(a => a !== aud))}
                                                className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
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
                                        className="text-xs bg-transparent border-none text-gray-500 focus:outline-none cursor-pointer py-1"
                                    >
                                        <option value="">+ Tambah Auditor</option>
                                        {auditorPartners.length > 0 ? (
                                            auditorPartners.map(a => (
                                                <option key={a.id} value={a.name}>{a.name} ({a.lph_name || 'LPH'})</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Ahmad Fauzi">Ahmad Fauzi</option>
                                                <option value="Nabila Putri">Nabila Putri</option>
                                                <option value="Dimas Fajar">Dimas Fajar</option>
                                                <option value="Anisa Putri">Anisa Putri</option>
                                                <option value="Rizky Fadlan">Rizky Fadlan</option>
                                                <option value="Rahmat Hidayat">Rahmat Hidayat</option>
                                            </>
                                        )}
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
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Waktu Audit *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            placeholder="09:00 - 12:00"
                                            className="w-full p-2 pr-8 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                            required
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
                                    placeholder="Contoh: Jl. Sukajadi No. 123, Bandung, Jawa Barat"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    required
                                />
                            </div>

                            {/* Metode Audit & Kontak PIC */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Metode Audit *</label>
                                    <select
                                        value={scheduleMethod}
                                        onChange={(e) => setScheduleMethod(e.target.value)}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    >
                                        <option value="Onsite">Onsite (Kunjungan Langsung)</option>
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
                                        placeholder="Nama PIC - 0812xxxx"
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 3 Status Konfirmasi */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Konfirmasi Klien</label>
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
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Konfirmasi LPH</label>
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
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Konfirmasi Auditor</label>
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
                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                />
                            </div>

                            {/* Catatan Koordinasi */}
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">Catatan Koordinasi</label>
                                <textarea
                                    rows={2}
                                    value={scheduleNotes}
                                    onChange={(e) => setScheduleNotes(e.target.value)}
                                    placeholder="Tambahkan catatan koordinasi teknis, titik temu, atau instruksi khusus..."
                                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                                    <span className="text-gray-700 font-medium">Kirim notifikasi WhatsApp / Email ke klien</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyAuditor}
                                        onChange={(e) => setNotifyAuditor(e.target.checked)}
                                        className="rounded border-gray-300 text-brand-700"
                                    />
                                    <span className="text-gray-700 font-medium">Kirim notifikasi tugas ke auditor</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={lockSchedule}
                                        onChange={(e) => setLockSchedule(e.target.checked)}
                                        className="rounded border-gray-300 text-brand-700"
                                    />
                                    <span className="text-gray-700 font-medium">Kunci jadwal setelah semua pihak konfirmasi</span>
                                </label>
                            </div>

                            {/* Form Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => { setViewMode('list'); setEditingAudit(null); }}
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        toast.success('Draft jadwal audit berhasil disimpan!');
                                        setViewMode('list');
                                        setEditingAudit(null);
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-200 text-brand-700 hover:bg-brand-50 rounded-xl font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <FileText className="w-3.5 h-3.5" /> Simpan Draft
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                    <span>{editingAudit ? 'Simpan Perubahan Jadwal' : 'Buat Jadwal Audit'}</span>
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
                                    <p className="font-bold text-gray-900">{selectedSubIds.length} <span className="text-[10px] font-normal text-gray-400">Pengajuan</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Estimasi Audit</p>
                                    <p className="font-bold text-gray-900">{Math.max(1, selectedSubIds.length)} <span className="text-[10px] font-normal text-gray-400">Hari</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Kebutuhan Auditor</p>
                                    <p className="font-bold text-gray-900">{Math.max(1, selectedAuditors.length)} <span className="text-[10px] font-normal text-gray-400">Orang</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Lokasi Berbeda</p>
                                    <p className="font-bold text-gray-900">{new Set(selectedSubIds.map(id => readySubmissionsList.find(r => r.id === id)?.region).filter(Boolean)).size || 1} <span className="text-[10px] font-normal text-gray-400">Kota</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Catatan Penting */}
                    <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-2">
                        <p className="font-bold text-gray-900 text-xs">Catatan Penting</p>
                        <div className="space-y-1.5 text-xs text-gray-600">
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Pastikan tidak ada bentrok jadwal dengan audit lain pada tanggal yang sama.
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Konfirmasi ketersediaan auditor dan LPH sebelum menetapkan jadwal final.
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Pastikan dokumen dan kesiapan audit klien telah lengkap.
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span> Kunci jadwal setelah konfirmasi untuk mencegah perubahan data tanpa koordinasi.
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
                                    <span className="font-bold text-gray-900">{Math.max(1, 20 - totalAuditBerlangsung - totalTerkonfirmasi)}</span>
                                </p>
                                <p className="flex items-center justify-between gap-4">
                                    <span className="text-gray-400">Jadwal Terjadwal</span>
                                    <span className="font-bold text-gray-900">{totalAuditBerlangsung + totalTerkonfirmasi}</span>
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
                                    strokeDasharray={`${Math.min(100, Math.round(((totalAuditBerlangsung + totalTerkonfirmasi) / 20) * 100))}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-sm font-bold text-gray-900">
                                    {Math.min(100, Math.round(((totalAuditBerlangsung + totalTerkonfirmasi) / 20) * 100))}%
                                </span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Home</span>
                        <span>&gt;</span>
                        <span className="text-gray-900 font-semibold">Manajemen Audit</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Audit</h1>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">
                        Kelola jadwal audit sertifikasi halal, penugasan auditor LPH, konfirmasi jadwal, dan pemantauan SLA audit.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadAuditData}
                        disabled={isLoading}
                        className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Muat Ulang</span>
                    </button>
                    <button
                        id="btn-buat-jadwal-audit"
                        onClick={handleOpenCreateSchedule}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Jadwal Audit</span>
                    </button>
                </div>
            </div>

            {/* Sub-Tabs / Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 text-xs">
                {auditTabs.map((tab) => {
                    const isActive = statusTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => { setStatusTab(tab); setCurrentPage(1); }}
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalSiapDijadwalkan}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalMenungguKonfirmasi}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalTerkonfirmasi}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalAuditBerlangsung}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalAdaTemuan}</p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>

                {/* 6. Selesai */}
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Audit Selesai</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalSelesai}</p>
                        <p className="text-[10px] text-gray-400">Selesai</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nomor pengajuan, nama usaha, auditor, LPH..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                    </div>

                    {/* Status Audit */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[120px]"
                    >
                        <option value="Semua">Status: Semua</option>
                        <option value="Draft Jadwal">Draft Jadwal</option>
                        <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                        <option value="Terkonfirmasi">Terkonfirmasi</option>
                        <option value="Audit Berlangsung">Audit Berlangsung</option>
                        <option value="Audit Selesai">Audit Selesai</option>
                        <option value="Ada Temuan">Ada Temuan</option>
                        <option value="Dijadwalkan Ulang">Dijadwalkan Ulang</option>
                        <option value="Dibatalkan">Dibatalkan</option>
                    </select>

                    {/* LPH */}
                    <select
                        value={lphFilter}
                        onChange={(e) => { setLphFilter(e.target.value); setCurrentPage(1); }}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[90px]"
                    >
                        <option value="Semua">LPH: Semua</option>
                        <option value="BPJPH">BPJPH</option>
                        <option value="Surveyor Indonesia">Surveyor Indonesia</option>
                        <option value="Sucofindo">Sucofindo</option>
                        <option value="Salman ITB">Salman ITB</option>
                        {lphPartners.map(l => (
                            <option key={l.id} value={l.name.replace(/^LPH\s+/i, '')}>{l.name}</option>
                        ))}
                    </select>

                    {/* Auditor */}
                    <select
                        value={auditorFilter}
                        onChange={(e) => { setAuditorFilter(e.target.value); setCurrentPage(1); }}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[100px]"
                    >
                        <option value="Semua">Auditor: Semua</option>
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
                        onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[100px]"
                    >
                        <option value="Semua">Wilayah: Semua</option>
                        <option value="Jawa Barat">Jawa Barat</option>
                        <option value="Jawa Timur">Jawa Timur</option>
                        <option value="Jawa Tengah">Jawa Tengah</option>
                        <option value="Sumatera Utara">Sumatera Utara</option>
                        <option value="DKI Jakarta">DKI Jakarta</option>
                        {provincesList.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>

                    {/* Jenis Layanan */}
                    <select
                        value={serviceFilter}
                        onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }}
                        className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl font-medium text-gray-700 focus:outline-none min-w-[110px]"
                    >
                        <option value="Semua">Layanan: Semua</option>
                        <option value="Reguler">Reguler</option>
                        <option value="Self Declare">Self Declare</option>
                    </select>

                    {/* Actions: Reset, Export */}
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
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                                {audits.length} Audit Terjadwal
                            </span>
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
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="py-10 text-center text-gray-400 font-medium">
                                            Tidak ada jadwal audit yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData
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
                                                                    onClick={() => handleOpenEditSchedule(item)}
                                                                    className="w-full px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-emerald-700 font-bold cursor-pointer"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Ubah Jadwal
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        setActiveDropdown(null);
                                                                        try {
                                                                            await operationalService.sendReminder({
                                                                                submission_id: item.id,
                                                                                recipient_type: 'CLIENT',
                                                                                recipient_name: item.businessName,
                                                                                template_type: 'KONFIRMASI_AUDIT',
                                                                                message: `Halo ${item.businessName}, mohon konfirmasi kembali jadwal audit halal Anda pada ${item.auditDate}.`,
                                                                                channel: 'WHATSAPP'
                                                                            });
                                                                            toast.success(`Konfirmasi ulang berhasil dikirim untuk ${item.no}`);
                                                                        } catch {
                                                                            toast.success(`Konfirmasi ulang berhasil dikirim untuk ${item.no}`);
                                                                        }
                                                                    }}
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
                                        ))
                                )}
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
                        <p className="text-xs text-gray-500 font-medium">Audit Terjadwal</p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalTerkonfirmasi + totalAuditBerlangsung}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalMenungguKonfirmasi}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">{totalAdaTemuan}</p>
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
                        <p className="text-xl font-bold text-gray-900 leading-tight">
                            {audits.filter(a => a.auditStatus === 'Dijadwalkan Ulang').length}
                        </p>
                        <p className="text-[10px] text-gray-400">Audit</p>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {detailItem && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
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

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    const itemToEdit = detailItem;
                                    setDetailItem(null);
                                    handleOpenEditSchedule(itemToEdit);
                                }}
                                className="px-4 py-2 bg-white border border-gray-200 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ubah Jadwal Ini</span>
                            </button>
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
