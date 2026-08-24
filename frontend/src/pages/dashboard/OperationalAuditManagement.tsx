import { useState, useEffect } from 'react';
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
    Award,
    Building2,
    CalendarDays,
    ArrowLeft,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { LPHPartner, AuditorPartner } from '../../services/operationalService';

interface AuditItem {
    id: string;
    no: string;
    businessName: string;
    serviceType: string;
    lph: string;
    auditor: string;
    auditDate: string;
    location: string;
    confirmStatus: 'Menunggu Klien' | 'Menunggu LPH' | 'Terkonfirmasi';
    auditStatus: 'Siap Dijadwalkan' | 'Draft Jadwal' | 'Menunggu Konfirmasi' | 'Terkonfirmasi' | 'Audit Berlangsung' | 'Audit Selesai' | 'Ada Temuan' | 'Dijadwalkan Ulang';
    findings: string;
    slaDays: string;
    slaPercentage: string;
    slaIsOver: boolean;
}

const INITIAL_AUDITS: AuditItem[] = [
    {
        id: '1',
        no: 'HC-2607-00421',
        businessName: 'Dapur Barokah',
        serviceType: 'Reguler',
        lph: 'LPH BPJPH',
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
        lph: 'LPH LPPOM MUI',
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
];

export default function OperationalAuditManagement() {
    const [statusTab, setStatusTab] = useState('Semua');
    const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
    const [lphPartners, setLphPartners] = useState<LPHPartner[]>([]);
    const [auditorPartners, setAuditorPartners] = useState<AuditorPartner[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lphFilter, setLphFilter] = useState('Semua');
    const [auditorFilter, setAuditorFilter] = useState('Semua');
    const [regionFilter, setRegionFilter] = useState('Semua');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Sub-view: Buat Jadwal Audit
    const [viewMode, setViewMode] = useState<'list' | 'create-schedule'>('list');

    // Create Schedule Form State
    const [selectedSubId, setSelectedSubId] = useState('');
    const [scheduleLph, setScheduleLph] = useState('LPH BPJPH');
    const [scheduleAuditor, setScheduleAuditor] = useState('Ahmad Fauzi');
    const [scheduleDate, setScheduleDate] = useState('2026-08-08');
    const [scheduleTime, setScheduleTime] = useState('09:00 - 12:00');
    const [scheduleLocation, setScheduleLocation] = useState('Bandung, Jawa Barat');
    const [scheduleMethod, setScheduleMethod] = useState('Onsite');
    const [schedulePic, setSchedulePic] = useState('Andi Setiawan - 0812 3456 7890');
    const [scheduleDeadline, setScheduleDeadline] = useState('2026-08-03');
    const [scheduleNotes, setScheduleNotes] = useState('');

    const loadAuditData = async () => {
        try {
            setLoading(true);
            const [subsRes, lphsRes, auditorsRes] = await Promise.all([
                operationalService.getSubmissions({ service_type: 'REGULER' }),
                operationalService.getLPHPartners(),
                operationalService.getAuditorPartners(),
            ]);

            if (Array.isArray(lphsRes)) setLphPartners(lphsRes);
            if (Array.isArray(auditorsRes)) setAuditorPartners(auditorsRes);

            if (Array.isArray(subsRes?.data)) {
                if (subsRes.data.length > 0) {
                    const mapped: AuditItem[] = subsRes.data.map((s, idx) => {
                        let aStat: AuditItem['auditStatus'] = 'Siap Dijadwalkan';
                        if (String(s.status) === 'AUDIT_SCHEDULED' || s.audit_date) aStat = 'Terkonfirmasi';
                        else if (s.status === 'QC_REVIEW') aStat = 'Audit Berlangsung';

                        return {
                            id: s.id || String(idx + 1),
                            no: s.tracking_number || `HC-${s.id?.substring(0, 8) || String(idx + 1)}`,
                            businessName: s.client?.business_name || 'Pelaku Usaha',
                            serviceType: 'Reguler',
                            lph: s.lph_name || (Array.isArray(lphsRes) && lphsRes.length > 0 ? lphsRes[0].name : 'LPH LPPOM MUI'),
                            auditor: s.auditor_name || (Array.isArray(auditorsRes) && auditorsRes.length > 0 ? auditorsRes[0].name : 'Dr. Ir. Budi Santoso, M.Si'),
                            auditDate: s.audit_date ? new Date(s.audit_date).toLocaleDateString('id-ID') : '14 Hari Lagi',
                            location: s.client?.address || 'Bandung, Jawa Barat',
                            confirmStatus: s.audit_date ? 'Terkonfirmasi' : 'Menunggu LPH',
                            auditStatus: aStat,
                            findings: '-',
                            slaDays: '3 hari',
                            slaPercentage: '(60%)',
                            slaIsOver: false,
                        };
                    });
                    setAudits(mapped);
                    if (mapped.length > 0) {
                        setSelectedSubId(mapped[0].id);
                        setScheduleLocation(mapped[0].location);
                    }
                } else {
                    setAudits([]);
                }
            }
        } catch (err) {
            console.error('Failed to load audit data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuditData();
    }, []);

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
        'Kalender Audit'
    ];

    const filteredData = audits.filter(item => {
        const matchTab = statusTab === 'Semua' || item.auditStatus === statusTab;
        const matchSearch = item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchLph = lphFilter === 'Semua' || item.lph === lphFilter;
        const matchAuditor = auditorFilter === 'Semua' || item.auditor === auditorFilter;
        const matchRegion = regionFilter === 'Semua' || item.location.includes(regionFilter);
        return matchTab && matchSearch && matchLph && matchAuditor && matchRegion;
    });

    const getAuditStatusBadge = (status: string) => {
        switch (status) {
            case 'Menunggu Konfirmasi':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Menunggu Konfirmasi</span>;
            case 'Draft Jadwal':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Draft Jadwal</span>;
            case 'Terkonfirmasi':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Terkonfirmasi</span>;
            case 'Audit Berlangsung':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Audit Berlangsung</span>;
            case 'Ada Temuan':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Ada Temuan</span>;
            case 'Dijadwalkan Ulang':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Dijadwalkan Ulang</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const getConfirmBadge = (status: string) => {
        switch (status) {
            case 'Terkonfirmasi':
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">Terkonfirmasi</span>;
            case 'Menunggu LPH':
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">Menunggu LPH</span>;
            default:
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">Menunggu Klien</span>;
        }
    };

    const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetSub = audits.find(a => a.id === selectedSubId) || audits[0];

        try {
            if (targetSub) {
                await operationalService.scheduleAudit({
                    submission_id: targetSub.id,
                    lph_name: scheduleLph,
                    auditor_name: scheduleAuditor,
                    audit_date: scheduleDate,
                    notes: scheduleNotes,
                });
            }
            toast.success(`Jadwal audit berhasil dibuat untuk tanggal ${scheduleDate}!`);
            loadAuditData();
            setViewMode('list');
        } catch (err) {
            toast.error('Gagal membuat jadwal audit');
        }
    };

    const handleExportCSV = () => {
        const headers = 'No,No Registrasi,Nama Usaha,LPH,Auditor,Tanggal Audit,Lokasi,Konfirmasi,Status Audit\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},"${item.businessName}","${item.lph}","${item.auditor}",${item.auditDate},"${item.location}",${item.confirmStatus},${item.auditStatus}`
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
                            <span>/</span>
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Manajemen Audit</span>
                            <span>/</span>
                            <span className="text-gray-800 font-bold">Buat Jadwal Audit</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Buat Jadwal Audit</h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Halaman ini digunakan untuk membuat dan mengonfirmasi jadwal audit untuk pengajuan sertifikasi halal reguler.</p>
                    </div>

                    <button
                        onClick={() => setViewMode('list')}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 font-bold">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">Pengajuan Dipilih</p>
                        <p className="text-2xl font-black text-gray-900">12</p>
                        <p className="text-[10px] text-gray-400 font-medium">Pengajuan</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">Siap Dijadwalkan</p>
                        <p className="text-2xl font-black text-gray-900">8</p>
                        <p className="text-[10px] text-gray-400 font-medium">Pengajuan</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 font-bold">
                            <Clock className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">Menunggu Konfirmasi</p>
                        <p className="text-2xl font-black text-gray-900">3</p>
                        <p className="text-[10px] text-gray-400 font-medium">Pengajuan</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2 font-bold">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">Prioritas Tinggi</p>
                        <p className="text-2xl font-black text-gray-900">2</p>
                        <p className="text-[10px] text-gray-400 font-medium">Pengajuan</p>
                    </div>
                </div>

                {/* 2 Column View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Eligible Submissions Table */}
                    <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-gray-900">Daftar Pengajuan Siap Dijadwalkan</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                    <tr>
                                        <th className="py-2 px-2.5">
                                            <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                        </th>
                                        <th className="py-2 px-2.5">Nomor Pengajuan</th>
                                        <th className="py-2 px-2.5">Usaha</th>
                                        <th className="py-2 px-2.5">Wilayah</th>
                                        <th className="py-2 px-2.5">Kesiapan</th>
                                        <th className="py-2 px-2.5">Prioritas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {audits.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedSubId(item.id);
                                                setScheduleLocation(item.location);
                                            }}
                                            className={`hover:bg-gray-50/50 cursor-pointer ${selectedSubId === item.id ? 'bg-brand-50/60' : ''}`}
                                        >
                                            <td className="py-2.5 px-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubId === item.id}
                                                    onChange={() => {
                                                        setSelectedSubId(item.id);
                                                        setScheduleLocation(item.location);
                                                    }}
                                                    className="rounded text-brand-600"
                                                />
                                            </td>
                                            <td className="py-2.5 px-2.5 font-mono font-bold text-brand-700">{item.no}</td>
                                            <td className="py-2.5 px-2.5 font-bold text-gray-900">{item.businessName}</td>
                                            <td className="py-2.5 px-2.5 text-gray-500">{item.location}</td>
                                            <td className="py-2.5 px-2.5">
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">
                                                    Siap Audit
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-2.5">
                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold">
                                                    Tinggi
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Impact Summary & Important Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs">
                            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                                <p className="font-black text-gray-800">Ringkasan Dampak Jadwal</p>
                                <p className="text-gray-500">• Total Pengajuan dipilih: 12</p>
                                <p className="text-gray-500">• Estimasi Audit: 3 Hari</p>
                                <p className="text-gray-500">• Kebutuhan Auditor: 1 Orang</p>
                                <p className="text-gray-500">• Lokasi Berbeda: 4 Kota</p>
                            </div>
                            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1">
                                <p className="font-black text-amber-900">Catatan Penting</p>
                                <p className="text-amber-800 text-[11px]">• Pastikan tidak ada bentrok jadwal dengan audit lain.</p>
                                <p className="text-amber-800 text-[11px]">• Konfirmasi ketersediaan auditor dan LPH sebelum membuat jadwal.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form Jadwal Audit */}
                    <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-gray-900">Form Jadwal Audit</h2>

                        <form onSubmit={handleCreateScheduleSubmit} className="space-y-3.5 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Pilih LPH *</label>
                                    <select
                                        value={scheduleLph}
                                        onChange={(e) => setScheduleLph(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        {lphPartners.length > 0 ? (
                                            lphPartners.map(l => (
                                                <option key={l.id} value={l.name}>{l.name} ({l.region})</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="LPH BPJPH">LPH BPJPH</option>
                                                <option value="LPH Surveyor Indonesia">LPH Surveyor Indonesia</option>
                                                <option value="LPH Sucofindo">LPH Sucofindo</option>
                                                <option value="LPH Salman ITB">LPH Salman ITB</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Pilih Auditor *</label>
                                    <select
                                        value={scheduleAuditor}
                                        onChange={(e) => setScheduleAuditor(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        {auditorPartners.length > 0 ? (
                                            auditorPartners.map(a => (
                                                <option key={a.id} value={a.name}>{a.name} ({a.lph_name})</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Ahmad Fauzi">Ahmad Fauzi (Kapasitas: 18 audit)</option>
                                                <option value="Nabila Putri">Nabila Putri (Kapasitas: 12 audit)</option>
                                                <option value="Dimas Fajar">Dimas Fajar (Kapasitas: 14 audit)</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Audit *</label>
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Waktu Audit *</label>
                                    <input
                                        type="text"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Lokasi Audit *</label>
                                <input
                                    type="text"
                                    value={scheduleLocation}
                                    onChange={(e) => setScheduleLocation(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Metode Audit *</label>
                                    <select
                                        value={scheduleMethod}
                                        onChange={(e) => setScheduleMethod(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Onsite">Onsite (Kunjungan Lapangan)</option>
                                        <option value="Online">Online (Daring / Hybrid)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kontak PIC Usaha *</label>
                                    <input
                                        type="text"
                                        value={schedulePic}
                                        onChange={(e) => setSchedulePic(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Konfirmasi Klien</label>
                                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px]">
                                        <option>Menunggu Konfirmasi</option>
                                        <option>Terkonfirmasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Konfirmasi LPH</label>
                                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px]">
                                        <option>Menunggu Konfirmasi</option>
                                        <option>Terkonfirmasi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Konfirmasi Auditor</label>
                                    <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px]">
                                        <option>Menunggu Konfirmasi</option>
                                        <option>Terkonfirmasi</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Deadline Konfirmasi</label>
                                <input
                                    type="date"
                                    value={scheduleDeadline}
                                    onChange={(e) => setScheduleDeadline(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Koordinasi</label>
                                <textarea
                                    rows={2}
                                    value={scheduleNotes}
                                    onChange={(e) => setScheduleNotes(e.target.value)}
                                    placeholder="Tambahkan catatan koordinasi atau informasi penting lainnya..."
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                    <span className="font-medium text-gray-700">Kirim notifikasi ke klien</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                    <span className="font-medium text-gray-700">Kirim notifikasi ke auditor</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                    <span className="font-medium text-gray-700">Kunci jadwal setelah konfirmasi</span>
                                </label>
                            </div>

                            {/* Auditor Gauge */}
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400">Beban Jadwal Auditor</p>
                                    <p className="text-xs font-black text-gray-900 mt-0.5">65% Kapasitas Terpakai</p>
                                </div>
                                <div className="text-[10px] text-gray-500 text-right">
                                    <span>Jadwal Tersedia: <b className="text-emerald-700">7</b></span> • <span>Terjadwal: <b className="text-gray-900">13</b></span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-1.5"
                                >
                                    <Calendar className="w-4 h-4" /> Buat Jadwal Audit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW: AUDIT LIST
    // ==========================================
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Home</span>
                        <span>/</span>
                        <span className="text-gray-800 font-bold">Manajemen Audit</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Manajemen Audit</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Atur penjadwalan audit reguler, penugasan LPH & auditor, serta pantau status hasil temuan.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadAuditData}
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
                        onClick={() => setViewMode('create-schedule')}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Buat Jadwal Audit
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-2 pb-1">
                {auditTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusTab(tab)}
                        className={`pb-2.5 px-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                            statusTab === tab
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 6 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-black text-gray-900">18</p>
                    <p className="text-[10px] font-bold text-teal-700 mt-0.5">Siap Dijadwalkan</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2">
                        <Clock className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-black text-gray-900">12</p>
                    <p className="text-[10px] font-bold text-amber-700 mt-0.5">Menunggu Konfirmasi</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-black text-gray-900">24</p>
                    <p className="text-[10px] font-bold text-blue-700 mt-0.5">Terkonfirmasi</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-black text-gray-900">7</p>
                    <p className="text-[10px] font-bold text-purple-700 mt-0.5">Audit Berlangsung</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-black text-gray-900">9</p>
                    <p className="text-[10px] font-bold text-rose-700 mt-0.5">Ada Temuan</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                        <Award className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-black text-gray-900">31</p>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Sertifikat Terbit</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                    <div className="relative lg:col-span-2">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nomor pengajuan, nama usaha, NIB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        />
                    </div>

                    <div>
                        <select
                            value={lphFilter}
                            onChange={(e) => setLphFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">LPH (Semua)</option>
                            <option value="BPJPH">LPH BPJPH</option>
                            <option value="Surveyor Indonesia">Surveyor Indonesia</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={auditorFilter}
                            onChange={(e) => setAuditorFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Auditor (Semua)</option>
                            <option value="Ahmad Fauzi">Ahmad Fauzi</option>
                            <option value="Nabila Putri">Nabila Putri</option>
                            <option value="Dimas Fajar">Dimas Fajar</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Wilayah (Semua)</option>
                            <option value="Jawa Barat">Jawa Barat</option>
                            <option value="Jawa Timur">Jawa Timur</option>
                            <option value="Jawa Tengah">Jawa Tengah</option>
                        </select>
                    </div>

                    <div>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setLphFilter('Semua');
                                setAuditorFilter('Semua');
                                setRegionFilter('Semua');
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
                                <th className="py-3 px-3">No. Pengajuan</th>
                                <th className="py-3 px-3">Usaha</th>
                                <th className="py-3 px-3">Jenis Layanan</th>
                                <th className="py-3 px-3">LPH</th>
                                <th className="py-3 px-3">Auditor</th>
                                <th className="py-3 px-3">Tanggal Audit</th>
                                <th className="py-3 px-3">Lokasi</th>
                                <th className="py-3 px-3">Konfirmasi</th>
                                <th className="py-3 px-3">Status Audit</th>
                                <th className="py-3 px-3">Temuan</th>
                                <th className="py-3 px-3">SLA / Tenggat</th>
                                <th className="py-3 px-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3 font-mono font-black text-brand-700">{item.no}</td>
                                    <td className="py-3 px-3 font-bold text-gray-900">{item.businessName}</td>
                                    <td className="py-3 px-3 text-gray-600">{item.serviceType}</td>
                                    <td className="py-3 px-3 font-bold text-gray-700">{item.lph}</td>
                                    <td className="py-3 px-3 text-gray-700 font-medium">{item.auditor}</td>
                                    <td className="py-3 px-3 text-gray-600">{item.auditDate}</td>
                                    <td className="py-3 px-3 text-gray-500">{item.location}</td>
                                    <td className="py-3 px-3">{getConfirmBadge(item.confirmStatus)}</td>
                                    <td className="py-3 px-3">{getAuditStatusBadge(item.auditStatus)}</td>
                                    <td className="py-3 px-3 font-bold text-gray-700">{item.findings}</td>
                                    <td className="py-3 px-3">
                                        <span className="font-bold text-emerald-600">
                                            {item.slaDays} <span className="text-[10px] font-normal">{item.slaPercentage}</span>
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 relative">
                                            <button
                                                onClick={() => toast.success(`Detail audit ${item.no}`)}
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
                                                        <Eye className="w-3.5 h-3.5 text-gray-400" /> Detail Jadwal
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); toast.success('Jadwal audit dikonfirmasi'); }}
                                                        className="w-full px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Konfirmasi Jadwal
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); toast.success('Reschedule jadwal audit'); }}
                                                        className="w-full px-4 py-2 hover:bg-amber-50 text-amber-700 flex items-center gap-2"
                                                    >
                                                        <CalendarDays className="w-3.5 h-3.5 text-amber-600" /> Reschedule
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
                    <span>Menampilkan 1-6 dari 12 data</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button className="px-3 py-1 rounded-lg bg-brand-700 text-white font-bold">1</button>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">2</button>
                        <button className="px-3 py-1 rounded-lg hover:bg-gray-50 font-medium">3</button>
                        <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Bottom Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-white border border-gray-150 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold">Audit minggu ini</p>
                        <p className="text-base font-black text-gray-900">14 <span className="text-xs font-normal text-gray-400">Audit</span></p>
                    </div>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold">Belum dikonfirmasi</p>
                        <p className="text-base font-black text-gray-900">5 <span className="text-xs font-normal text-gray-400">Audit</span></p>
                    </div>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold">Temuan terbuka</p>
                        <p className="text-base font-black text-gray-900">9 <span className="text-xs font-normal text-gray-400">Audit</span></p>
                    </div>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold">Jadwal ulang</p>
                        <p className="text-base font-black text-gray-900">3 <span className="text-xs font-normal text-gray-400">Audit</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
