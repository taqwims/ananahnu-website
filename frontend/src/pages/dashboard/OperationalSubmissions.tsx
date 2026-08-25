import { useState, useEffect } from 'react';
import {
    FileText,
    Users,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    RotateCcw,
    Download,
    UserPlus,
    MoreVertical,
    Eye,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Printer,
    Save,
    Calendar,
    Shield,
    Layers,
    Tag,
    RefreshCw,
    MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { User } from '../../types';
import type { SubmissionItem } from '../../types/operational';
import {
    PriorityBadge,
    CompletenessBadge,
    AssignStatusBadge,
    SlaBadge
} from '../../components/operational/common/OperationalBadges';
import { SingleAssignModal } from '../../components/operational/modals/SingleAssignModal';
import { SendReminderModal } from '../../components/operational/modals/SendReminderModal';
import { ReturnAdvisorModal } from '../../components/operational/modals/ReturnAdvisorModal';
import { ChangePriorityModal } from '../../components/operational/modals/ChangePriorityModal';

const INITIAL_SUBMISSIONS: SubmissionItem[] = [
    {
        id: '1',
        no: 'REG-2607-1023',
        date: '29/07/2026',
        businessName: 'CV Maju Bersama',
        serviceType: 'Reguler',
        advisor: 'Anisa Putri',
        region: 'Bandung',
        completeness: 'Lengkap',
        assignStatus: 'Belum Ditugaskan',
        priority: 'Tinggi',
        age: '2 hari',
        sla: 'Dalam SLA',
    },
    {
        id: '2',
        no: 'SDM-2607-1041',
        date: '29/07/2026',
        businessName: 'Dapur Sehat Ibu Nia',
        serviceType: 'Self Declare Mandiri',
        advisor: 'Rahmat Hidayat',
        region: 'Ciamis',
        completeness: 'Perlu Perbaikan',
        assignStatus: 'Ditugaskan ke QCO',
        priority: 'Normal',
        age: '1 hari',
        sla: 'Dalam SLA',
    },
    {
        id: '3',
        no: 'SDF-2607-1048',
        date: '30/07/2026',
        businessName: 'Teh Hijau Lestari',
        serviceType: 'Self Declare Fasilitasi',
        advisor: 'Siti Aisyah',
        region: 'Garut',
        completeness: 'Lengkap',
        assignStatus: 'Belum Ditugaskan',
        priority: 'Mendesak',
        age: '6 jam',
        sla: 'Dalam SLA',
    },
    {
        id: '4',
        no: 'REG-2607-0988',
        date: '28/07/2026',
        businessName: 'Roti Nusantara',
        serviceType: 'Reguler',
        advisor: 'Dimas Fajar',
        region: 'Tasikmalaya',
        completeness: 'Belum Lengkap',
        assignStatus: 'Menunggu Review',
        priority: 'Normal',
        age: '3 hari',
        sla: 'Mendekati SLA',
    },
    {
        id: '5',
        no: 'SDF-2607-0977',
        date: '27/07/2026',
        businessName: 'Bintang Rasa Abadi',
        serviceType: 'Self Declare Fasilitasi',
        advisor: 'Anisa Putri',
        region: 'Sumedang',
        completeness: 'Lengkap',
        assignStatus: 'Belum Ditugaskan',
        priority: 'Kritis',
        age: '4 hari',
        sla: 'Melewati SLA',
    },
    {
        id: '6',
        no: 'REG-2607-0993',
        date: '26/07/2026',
        businessName: 'Kopi Nusantara',
        serviceType: 'Reguler',
        advisor: 'Ayu Lestari',
        region: 'Cimahi',
        completeness: 'Perlu Perbaikan',
        assignStatus: 'Ditugaskan ke QCO',
        priority: 'Tinggi',
        age: '5 hari',
        sla: 'Melewati SLA',
    },
    {
        id: '7',
        no: 'SDM-2607-1012',
        date: '28/07/2026',
        businessName: 'Sehat Alami Snack',
        serviceType: 'Self Declare Mandiri',
        advisor: 'Siti Aisyah',
        region: 'Garut',
        completeness: 'Lengkap',
        assignStatus: 'Ditugaskan ke QCO',
        priority: 'Normal',
        age: '2 hari',
        sla: 'Dalam SLA',
    },
];

export default function OperationalSubmissions() {
    const [submissions, setSubmissions] = useState<SubmissionItem[]>(INITIAL_SUBMISSIONS);
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('Semua');
    const [regionFilter, setRegionFilter] = useState('Semua');
    const [advisorFilter, setAdvisorFilter] = useState('Semua');
    const [completenessFilter, setCompletenessFilter] = useState('Semua');
    const [priorityFilter, setPriorityFilter] = useState('Semua');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Return to advisor, Priority, Single Assign & Reminder Modals
    const [returnModalSub, setReturnModalSub] = useState<SubmissionItem | null>(null);
    const [priorityModalSub, setPriorityModalSub] = useState<SubmissionItem | null>(null);
    const [singleAssignModalSub, setSingleAssignModalSub] = useState<SubmissionItem | null>(null);
    const [reminderModalSub, setReminderModalSub] = useState<SubmissionItem | null>(null);


    // Modal Views
    const [viewMode, setViewMode] = useState<'list' | 'batch-assign' | 'detail'>('list');
    const [detailSubmission, setDetailSubmission] = useState<SubmissionItem | null>(null);
    const [detailTab, setDetailTab] = useState<'info' | 'business' | 'pic' | 'products' | 'docs' | 'history'>('info');

    // Batch Assign Form State
    const [assignTarget, setAssignTarget] = useState('Verifikasi QCO');
    const [selectedStaff, setSelectedStaff] = useState('');
    const [distMode, setDistMode] = useState('Bagi Rata');
    const [targetDeadline, setTargetDeadline] = useState('2026-08-05');
    const [assignPriority, setAssignPriority] = useState('Mengikuti prioritas asli');
    const [assignNotes, setAssignNotes] = useState('Mohon dilakukan verifikasi sesuai checklist dan standar terbaru.');
    const [notifyStaff, setNotifyStaff] = useState(true);
    const [keepPriorityFlag, setKeepPriorityFlag] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subsRes, staffRes] = await Promise.all([
                operationalService.getSubmissions(),
                operationalService.getStaffList()
            ]);

            if (staffRes && staffRes.length > 0) {
                setStaffList(staffRes);
                setSelectedStaff(staffRes[0].full_name || staffRes[0].username || '');
            }

            if (subsRes?.data && subsRes.data.length > 0) {
                const mapped: SubmissionItem[] = subsRes.data.map((s, idx) => {
                    const st = s.service_type === 'SELF_DECLARE'
                        ? (s.self_declare_type === 'MANDIRI' ? 'Self Declare Mandiri' : 'Self Declare Fasilitasi')
                        : 'Reguler';
                    
                    let pVal: 'Tinggi' | 'Normal' | 'Mendesak' | 'Kritis' = 'Normal';
                    if (s.priority === 'HIGH') pVal = 'Tinggi';
                    else if (s.priority === 'URGENT') pVal = 'Mendesak';
                    else if (s.priority === 'CRITICAL') pVal = 'Kritis';

                    let aStat: 'Belum Ditugaskan' | 'Ditugaskan ke QCO' | 'Menunggu Review' = 'Belum Ditugaskan';
                    if (s.status === 'QC_OFFICER' || s.status === 'DRAFTER') aStat = 'Ditugaskan ke QCO';
                    else if (s.status === 'QC_REVIEW') aStat = 'Menunggu Review';

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || `SUB-${s.id?.substring(0, 8) || String(idx + 1)}`,
                        date: s.created_at ? new Date(s.created_at).toLocaleDateString('id-ID') : '29/07/2026',
                        businessName: s.client?.business_name || 'Pelaku Usaha',
                        serviceType: st,
                        advisor: s.consultant?.full_name || 'Halal Advisor',
                        region: s.client?.address ? s.client.address.split(',')[0] : 'Bandung',
                        completeness: s.field_values && s.field_values.length > 3 ? 'Lengkap' : 'Belum Lengkap',
                        assignStatus: aStat,
                        priority: pVal,
                        age: '2 hari',
                        sla: 'Dalam SLA',
                    };
                });
                setSubmissions(mapped);
            }
        } catch (err) {
            console.error('Failed to load operational submissions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtered data
    const filteredData = submissions.filter(item => {
        const matchSearch = item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.advisor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchService = serviceFilter === 'Semua' || item.serviceType === serviceFilter;
        const matchRegion = regionFilter === 'Semua' || item.region === regionFilter;
        const matchAdvisor = advisorFilter === 'Semua' || item.advisor === advisorFilter;
        const matchCompleteness = completenessFilter === 'Semua' || item.completeness === completenessFilter;
        const matchPriority = priorityFilter === 'Semua' || item.priority === priorityFilter;
        return matchSearch && matchService && matchRegion && matchAdvisor && matchCompleteness && matchPriority;
    });

    // Computed stats from real data
    const statsTotal = submissions.length;
    const statsBelumDitugaskan = submissions.filter(s => s.assignStatus === 'Belum Ditugaskan').length;
    const statsLengkap = submissions.filter(s => s.completeness === 'Lengkap').length;
    const statsPerluValidasi = submissions.filter(s => s.completeness === 'Belum Lengkap' || s.completeness === 'Perlu Perbaikan').length;
    const statsPrioritasTinggi = submissions.filter(s => s.priority === 'Tinggi' || s.priority === 'Mendesak' || s.priority === 'Kritis').length;
    const statsSelfDeclare = submissions.filter(s => s.serviceType.startsWith('Self Declare')).length;
    const statsReguler = submissions.filter(s => s.serviceType === 'Reguler').length;
    const statsSiapDitugaskan = submissions.filter(s => s.assignStatus === 'Belum Ditugaskan' && s.completeness === 'Lengkap').length;

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(i => i.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBatchAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const staffObj = staffList.find(s => s.full_name === selectedStaff || s.username === selectedStaff) || staffList[0];
        const staffId = staffObj?.id;

        try {
            if (staffId && selectedIds.length > 0) {
                await operationalService.bulkAssign({
                    submission_ids: selectedIds,
                    assignee_id: staffId,
                    target_role: assignTarget.includes('QCO') ? 'QCO' : 'DRAFTER',
                    dist_mode: distMode === 'Bagi Rata' ? 'BAGI_RATA' : 'ROUND_ROBIN',
                    priority: assignPriority.includes('Tinggi') ? 'HIGH' : 'NORMAL',
                    notes: assignNotes,
                });
            }
            toast.success(`Berhasil menugaskan ${selectedIds.length > 0 ? selectedIds.length : 'semua'} pengajuan ke ${selectedStaff}!`);
            setSubmissions(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, assignStatus: 'Ditugaskan ke QCO' } : s));
            setSelectedIds([]);
            setViewMode('list');
        } catch (err) {
            toast.error('Gagal melakukan penugasan massal');
        }
    };



    const handleExportCSV = () => {
        const headers = 'No,No Pengajuan,Tanggal,Nama Usaha,Layanan,Advisor,Wilayah,Kelengkapan,Status,Prioritas\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},${item.date},"${item.businessName}",${item.serviceType},"${item.advisor}",${item.region},${item.completeness},${item.assignStatus},${item.priority}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Daftar_Pengajuan_Operasional_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('File CSV berhasil diunduh.');
    };

    const handleOpenDetail = (sub: SubmissionItem) => {
        setDetailSubmission(sub);
        setViewMode('detail');
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setServiceFilter('Semua');
        setRegionFilter('Semua');
        setAdvisorFilter('Semua');
        setCompletenessFilter('Semua');
        setPriorityFilter('Semua');
    };


    // ==========================================
    // VIEW: DETAIL PENGAJUAN
    // ==========================================
    if (viewMode === 'detail' && detailSubmission) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Home</span>
                            <span>/</span>
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Pengajuan Masuk</span>
                            <span>/</span>
                            <span className="text-gray-800 font-bold">Detail Pengajuan Penugasan</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Detail Pengajuan Penugasan</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Cetak Ringkasan
                        </button>
                    </div>
                </div>

                {/* Top Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">No. Pengajuan</p>
                        <p className="text-xs font-mono font-black text-gray-900 mt-1">{detailSubmission.no}</p>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Jenis Layanan</p>
                        <p className="text-xs font-black text-gray-900 mt-1">{detailSubmission.serviceType}</p>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Advisor</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">{detailSubmission.advisor}</p>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tahap Kerja</p>
                        <p className="text-xs font-bold text-brand-600 mt-1">QCO</p>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Prioritas</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">{detailSubmission.priority}</p>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tanggal Input</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">{detailSubmission.date}</p>
                    </div>
                    <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Sumber</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1">HalalCore Web</p>
                    </div>
                </div>

                {/* Main 2-Column Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Tabs & Sections */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Tab Headers */}
                        <div className="flex border-b border-gray-200 overflow-x-auto gap-4">
                            {[
                                { key: 'info', label: 'Informasi Pengajuan' },
                                { key: 'business', label: 'Data Usaha' },
                                { key: 'pic', label: 'Penanggung Jawab' },
                                { key: 'products', label: 'Produk' },
                                { key: 'docs', label: 'Dokumen' },
                                { key: 'history', label: 'Riwayat Aktivitas' }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setDetailTab(tab.key as any)}
                                    className={`pb-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                                        detailTab === tab.key
                                            ? 'border-brand-600 text-brand-600'
                                            : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Section A: Informasi Usaha */}
                        <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-brand-50 text-brand-700 text-xs flex items-center justify-center font-bold">A</span>
                                Informasi Usaha
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-gray-400 font-medium">Nama Usaha</p>
                                    <p className="font-bold text-gray-800 mt-0.5">{detailSubmission.businessName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Kategori Usaha</p>
                                    <p className="font-bold text-gray-800 mt-0.5">Industri Kecil Obat Tradisional / Pangan</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">NIB</p>
                                    <p className="font-mono font-bold text-gray-800 mt-0.5">0220101234567</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Skala Usaha</p>
                                    <p className="font-bold text-gray-800 mt-0.5">Kecil / Mikro</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Alamat Usaha</p>
                                    <p className="font-bold text-gray-800 mt-0.5">Jl. Kesehatan No. 12, {detailSubmission.region}, Jawa Barat</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Kontak HP / Email</p>
                                    <p className="font-bold text-gray-800 mt-0.5">0812-3456-7890 • admin@{detailSubmission.businessName.toLowerCase().replace(/\s+/g, '')}.co.id</p>
                                </div>
                            </div>
                        </div>

                        {/* Section B: Informasi Layanan */}
                        <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-brand-50 text-brand-700 text-xs flex items-center justify-center font-bold">B</span>
                                Informasi Layanan
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-gray-400 font-medium">Skema Layanan</p>
                                    <p className="font-bold text-gray-800 mt-0.5">{detailSubmission.serviceType}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Target SLA</p>
                                    <p className="font-bold text-gray-800 mt-0.5">30 hari kalender</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Advisor Pendamping</p>
                                    <p className="font-bold text-gray-800 mt-0.5">{detailSubmission.advisor}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium">Tahap Tujuan</p>
                                    <p className="font-bold text-emerald-700 mt-0.5">QCO (Quality Control)</p>
                                </div>
                            </div>
                        </div>

                        {/* Section C: Catatan Penugasan */}
                        <div className="p-6 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3">
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-brand-50 text-brand-700 text-xs flex items-center justify-center font-bold">C</span>
                                Catatan Penugasan
                            </h3>
                            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-900 font-medium">
                                Produk obat herbal & suplemen makanan. Dokumen uji lab dan sertifikat bahan baku telah terlampir lengkap.
                            </div>
                        </div>

                        {/* Section D: Ringkasan Data Pendukung */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="p-3 bg-white border border-gray-150 rounded-2xl text-center shadow-sm">
                                <p className="text-[10px] text-gray-400 font-bold">Produk</p>
                                <p className="text-lg font-black text-gray-900">6</p>
                                <p className="text-[9px] text-gray-400">produk</p>
                            </div>
                            <div className="p-3 bg-white border border-gray-150 rounded-2xl text-center shadow-sm">
                                <p className="text-[10px] text-gray-400 font-bold">Dokumen</p>
                                <p className="text-lg font-black text-gray-900">8</p>
                                <p className="text-[9px] text-gray-400">dokumen</p>
                            </div>
                            <div className="p-3 bg-white border border-gray-150 rounded-2xl text-center shadow-sm">
                                <p className="text-[10px] text-gray-400 font-bold">Pernyataan</p>
                                <p className="text-lg font-black text-gray-900">15</p>
                                <p className="text-[9px] text-gray-400">pernyataan</p>
                            </div>
                            <div className="p-3 bg-white border border-gray-150 rounded-2xl text-center shadow-sm">
                                <p className="text-[10px] text-gray-400 font-bold">Riwayat Audit</p>
                                <p className="text-lg font-black text-gray-900">0</p>
                                <p className="text-[9px] text-gray-400">kegiatan</p>
                            </div>
                            <div className="p-3 bg-white border border-gray-150 rounded-2xl text-center shadow-sm">
                                <p className="text-[10px] text-gray-400 font-bold">Status Risiko</p>
                                <p className="text-xs font-black text-emerald-600 mt-1">Rendah</p>
                                <p className="text-[9px] text-emerald-500">Normal</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Status & Timeline & Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Status Saat Ini */}
                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Status Saat Ini</p>
                            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-900">Siap Ditugaskan ke QCO</p>
                                    <p className="text-[10px] text-emerald-700">Menunggu konfirmasi penugasan.</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Proses */}
                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                            <p className="text-xs font-black text-gray-900">Timeline Proses</p>

                            <div className="space-y-3 relative pl-4 border-l-2 border-emerald-500 ml-2">
                                <div className="relative">
                                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-gray-800">Pengajuan Diterima</p>
                                    <p className="text-[10px] text-gray-400">24 Jun 2026 09:12</p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-gray-800">Masuk Penugasan Massal</p>
                                    <p className="text-[10px] text-gray-400">24 Jun 2026 10:03</p>
                                </div>

                                <div className="relative">
                                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-emerald-700">Siap Ditugaskan ke QCO</p>
                                    <p className="text-[10px] text-gray-400">24 Jun 2026 10:05</p>
                                </div>

                                <div className="relative opacity-40">
                                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-gray-600">Proses QCO</p>
                                </div>

                                <div className="relative opacity-40">
                                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-gray-600">Proses HDO</p>
                                </div>

                                <div className="relative opacity-40">
                                    <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-gray-300 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-gray-600">Verifikasi / Audit</p>
                                </div>
                            </div>
                        </div>

                        {/* Ringkasan Penugasan */}
                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                            <p className="font-black text-gray-900">Ringkasan Penugasan</p>
                            <div className="space-y-2 border-t border-gray-100 pt-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Petugas Tujuan:</span>
                                    <span className="font-bold text-gray-800">Petugas QCO</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Deadline / SLA:</span>
                                    <span className="font-bold text-gray-800">24 Jul 2026 (30 hari)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Mode Pembagian:</span>
                                    <span className="font-bold text-gray-800">Merata ke satu petugas</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    toast.success('Pengajuan berhasil ditugaskan!');
                                    setViewMode('list');
                                }}
                                className="w-full py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Konfirmasi Penugasan
                            </button>
                            <button
                                onClick={() => {
                                    toast.success('Draft penugasan disimpan.');
                                    setViewMode('list');
                                }}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Simpan Draft
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW: TUGASKAN MASSAL
    // ==========================================
    if (viewMode === 'batch-assign') {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Dashboard</span>
                            <span>/</span>
                            <span className="cursor-pointer hover:underline" onClick={() => setViewMode('list')}>Pengajuan Masuk</span>
                            <span>/</span>
                            <span className="text-gray-800 font-bold">Tugaskan Massal</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Tugaskan Massal</h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Halaman untuk menugaskan banyak pengajuan sekaligus kepada staf sesuai tahapan kerja.</p>
                    </div>
                </div>

                {/* Top Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mb-2">
                            <FileText className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Total Dipilih</p>
                        <p className="text-2xl font-black text-gray-900">{selectedIds.length > 0 ? selectedIds.length : statsTotal}</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black mb-2">
                            <Users className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Siap Ditugaskan</p>
                        <p className="text-2xl font-black text-gray-900">{statsSiapDitugaskan}</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mb-2">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Prioritas Tinggi</p>
                        <p className="text-2xl font-black text-gray-900">{statsPrioritasTinggi}</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black mb-2">
                            <Shield className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Self Declare</p>
                        <p className="text-2xl font-black text-gray-900">{statsSelfDeclare}</p>
                    </div>

                    <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black mb-2">
                            <Layers className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-400">Reguler</p>
                        <p className="text-2xl font-black text-gray-900">{statsReguler}</p>
                    </div>
                </div>

                {/* 2 Column Form & Selected Table */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Table of Selected Submissions */}
                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black text-gray-900">Daftar Pengajuan Terpilih</h2>
                            <span className="text-xs font-bold text-gray-400">{selectedIds.length > 0 ? selectedIds.length : statsTotal} data</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                    <tr>
                                        <th className="py-2.5 px-3">
                                            <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                        </th>
                                        <th className="py-2.5 px-3">No. Pengajuan</th>
                                        <th className="py-2.5 px-3">Usaha / Pemohon</th>
                                        <th className="py-2.5 px-3">Jenis Layanan</th>
                                        <th className="py-2.5 px-3">Advisor</th>
                                        <th className="py-2.5 px-3">Prioritas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {submissions.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="py-3 px-3">
                                                <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                                            </td>
                                            <td className="py-3 px-3 font-mono font-bold text-gray-800">{item.no}</td>
                                            <td className="py-3 px-3 font-bold text-gray-800">{item.businessName}</td>
                                            <td className="py-3 px-3 text-gray-600">{item.serviceType}</td>
                                            <td className="py-3 px-3 text-gray-600">{item.advisor}</td>
                                            <td className="py-3 px-3"><PriorityBadge priority={item.priority} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Impact Summary & Important Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                                <p className="font-black text-gray-800">Ringkasan Dampak Penugasan</p>
                                <p className="text-gray-500">• Total pengajuan terpilih: 24</p>
                                <p className="text-gray-500">• Akan ditugaskan ke: {selectedStaff}</p>
                                <p className="text-gray-500">• Perkiraan penambahan antrean: +24</p>
                                <p className="text-gray-500">• Perkiraan SLA terjaga: 92% → 91%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5">
                                <p className="font-black text-amber-900">Catatan Penting</p>
                                <p className="text-amber-800">• Pastikan beban kerja staf masih dalam batas wajar.</p>
                                <p className="text-amber-800">• Prioritas Tinggi/Kritis akan tetap diutamakan.</p>
                                <p className="text-amber-800">• Penugasan massal bersifat permanen setelah dikonfirmasi.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form Penugasan Massal */}
                    <div className="lg:col-span-5 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-5">
                        <h2 className="text-sm font-black text-gray-900">Form Penugasan Massal</h2>

                        <form onSubmit={handleBatchAssignSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Tahap Penugasan *</label>
                                <select
                                    value={assignTarget}
                                    onChange={(e) => setAssignTarget(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    <option value="Verifikasi QCO">Verifikasi QCO</option>
                                    <option value="Penyusunan HDO">Penyusunan HDO</option>
                                    <option value="Verifikasi Self Declare">Verifikasi Self Declare</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pilih Staf QCO *</label>
                                <select
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    <option value="Rahmat Hidayat">Rahmat Hidayat (Antrean: 9)</option>
                                    <option value="Anisa Putri">Anisa Putri (Antrean: 14)</option>
                                    <option value="Dimas Fajar">Dimas Fajar (Antrean: 7)</option>
                                    <option value="Siti Aisyah">Siti Aisyah (Antrean: 11)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Mode Pembagian *</label>
                                <select
                                    value={distMode}
                                    onChange={(e) => setDistMode(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    <option value="Bagi Rata">Bagi Rata (Merata ke staf terpilih)</option>
                                    <option value="Prioritas Kapasitas Terendah">Prioritas Kapasitas Terendah</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Target SLA / Deadline *</label>
                                <input
                                    type="date"
                                    value={targetDeadline}
                                    onChange={(e) => setTargetDeadline(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Prioritas Penugasan *</label>
                                <select
                                    value={assignPriority}
                                    onChange={(e) => setAssignPriority(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    <option value="Mengikuti prioritas asli">Mengikuti prioritas asli</option>
                                    <option value="Tingkatkan ke Mendesak">Tingkatkan ke Mendesak</option>
                                    <option value="Set Normal Semua">Set Normal Semua</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Catatan Penugasan</label>
                                <textarea
                                    rows={3}
                                    value={assignNotes}
                                    onChange={(e) => setAssignNotes(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    placeholder="Tambahkan catatan khusus untuk tim..."
                                />
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyStaff}
                                        onChange={(e) => setNotifyStaff(e.target.checked)}
                                        className="rounded text-brand-600"
                                    />
                                    <span className="font-medium text-gray-700">Kirim notifikasi ke staf terpilih</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={keepPriorityFlag}
                                        onChange={(e) => setKeepPriorityFlag(e.target.checked)}
                                        className="rounded text-brand-600"
                                    />
                                    <span className="font-medium text-gray-700">Pertahankan flag prioritas pengajuan</span>
                                </label>
                            </div>

                            {/* Workload card of selected staff */}
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                                <p className="text-[11px] font-black text-gray-700">Beban Kerja Staf Terpilih ({selectedStaff})</p>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="p-2 bg-white rounded-xl border border-gray-150">
                                        <p className="text-[9px] text-gray-400 font-bold">Antrean</p>
                                        <p className="text-sm font-black text-gray-900">27</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-xl border border-gray-150">
                                        <p className="text-[9px] text-gray-400 font-bold">Diproses</p>
                                        <p className="text-sm font-black text-gray-900">12</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-xl border border-gray-150">
                                        <p className="text-[9px] text-gray-400 font-bold">Selesai</p>
                                        <p className="text-sm font-black text-gray-900">38</p>
                                    </div>
                                    <div className="p-2 bg-white rounded-xl border border-gray-150">
                                        <p className="text-[9px] text-gray-400 font-bold">SLA</p>
                                        <p className="text-sm font-black text-emerald-600">92%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-1.5"
                                >
                                    <UserPlus className="w-4 h-4" /> Tugaskan Massal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW: MAIN SUBMISSIONS LIST
    // ==========================================
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Top Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span className="text-gray-800 font-bold">Pengajuan Masuk</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Pengajuan Masuk</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Kelola berkas masuk, validasi kelengkapan, dan distribusikan penugasan ke tim.</p>
                </div>
            </div>

            {/* 5 KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                        <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Total Pengajuan</p>
                    <p className="text-2xl font-black text-gray-900">{statsTotal}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{filteredData.length} setelah filter</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                        <Users className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Belum Ditugaskan</p>
                    <p className="text-2xl font-black text-gray-900">{statsBelumDitugaskan}</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">{statsTotal > 0 ? Math.round((statsBelumDitugaskan / statsTotal) * 100) : 0}% dari total</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Lengkap</p>
                    <p className="text-2xl font-black text-gray-900">{statsLengkap}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">{statsTotal > 0 ? Math.round((statsLengkap / statsTotal) * 100) : 0}% dari total</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Perlu Validasi</p>
                    <p className="text-2xl font-black text-gray-900">{statsPerluValidasi}</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">{statsTotal > 0 ? Math.round((statsPerluValidasi / statsTotal) * 100) : 0}% dari total</p>
                </div>

                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
                        <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500">Prioritas Tinggi</p>
                    <p className="text-2xl font-black text-gray-900">{statsPrioritasTinggi}</p>
                    <p className="text-[10px] text-red-600 font-bold mt-1">{statsPrioritasTinggi > 0 ? 'Perlu segera ditugaskan' : 'Semua normal'}</p>
                </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nomor pengajuan, nama usaha, advisor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Action buttons on right */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadData}
                            className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} /> Refresh
                        </button>
                        <button
                            onClick={handleResetFilter}
                            className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-gray-500" /> Reset Filter
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
                        </button>
                        <button
                            onClick={() => setViewMode('batch-assign')}
                            className="px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-brand-700/20"
                        >
                            <UserPlus className="w-4 h-4" /> Tugaskan Massal
                        </button>
                    </div>
                </div>

                {/* Dropdown Filters Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Jenis Layanan</label>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Reguler">Reguler</option>
                            <option value="Self Declare Mandiri">Self Declare Mandiri</option>
                            <option value="Self Declare Fasilitasi">Self Declare Fasilitasi</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Wilayah</label>
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Bandung">Bandung</option>
                            <option value="Ciamis">Ciamis</option>
                            <option value="Garut">Garut</option>
                            <option value="Tasikmalaya">Tasikmalaya</option>
                            <option value="Sumedang">Sumedang</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Halal Advisor</label>
                        <select
                            value={advisorFilter}
                            onChange={(e) => setAdvisorFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Anisa Putri">Anisa Putri</option>
                            <option value="Rahmat Hidayat">Rahmat Hidayat</option>
                            <option value="Siti Aisyah">Siti Aisyah</option>
                            <option value="Dimas Fajar">Dimas Fajar</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Status Kelengkapan</label>
                        <select
                            value={completenessFilter}
                            onChange={(e) => setCompletenessFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Lengkap">Lengkap</option>
                            <option value="Perlu Validasi">Perlu Validasi</option>
                            <option value="Data Kurang">Data Kurang</option>
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
                            <option value="Tinggi">Tinggi</option>
                            <option value="Normal">Normal</option>
                            <option value="Mendesak">Mendesak</option>
                            <option value="Kritis">Kritis</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Periode</label>
                        <div className="flex items-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">27/07 - 30/07/2026</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-900">Daftar Pengajuan Masuk</h2>
                    <span className="text-xs font-bold text-gray-400">{filteredData.length} data</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                        onChange={toggleSelectAll}
                                        className="rounded text-brand-600"
                                    />
                                </th>
                                <th className="py-3 px-3">No Pengajuan</th>
                                <th className="py-3 px-3">Tanggal Masuk</th>
                                <th className="py-3 px-3">Pelaku Usaha / Nama Usaha</th>
                                <th className="py-3 px-3">Jenis Layanan</th>
                                <th className="py-3 px-3">Halal Advisor</th>
                                <th className="py-3 px-3">Wilayah</th>
                                <th className="py-3 px-3">Kelengkapan Awal</th>
                                <th className="py-3 px-3">Status Penugasan</th>
                                <th className="py-3 px-3">Prioritas</th>
                                <th className="py-3 px-3">Usia Pengajuan</th>
                                <th className="py-3 px-3">SLA</th>
                                <th className="py-3 px-3 text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                            className="rounded text-brand-600"
                                        />
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-gray-800">{item.no}</td>
                                    <td className="py-3 px-3 text-gray-500">{item.date}</td>
                                    <td className="py-3 px-3 font-bold text-gray-900">{item.businessName}</td>
                                    <td className="py-3 px-3 text-gray-600">{item.serviceType}</td>
                                    <td className="py-3 px-3 text-gray-600">{item.advisor}</td>
                                    <td className="py-3 px-3 text-gray-600">{item.region}</td>
                                    <td className="py-3 px-3"><CompletenessBadge status={item.completeness} /></td>
                                    <td className="py-3 px-3"><AssignStatusBadge status={item.assignStatus} /></td>
                                    <td className="py-3 px-3"><PriorityBadge priority={item.priority} /></td>
                                    <td className="py-3 px-3 font-medium text-gray-700">{item.age}</td>
                                    <td className="py-3 px-3"><SlaBadge sla={item.sla} /></td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5 relative">
                                            <button
                                                onClick={() => handleOpenDetail(item)}
                                                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 shadow-sm"
                                            >
                                                Detail
                                            </button>
                                            <button
                                                onClick={() => setSingleAssignModalSub(item)}
                                                className="px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                                            >
                                                Tugaskan
                                            </button>

                                            {/* Dropdown Toggle */}
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {/* 3-dots Dropdown Menu */}
                                            {activeDropdown === item.id && (
                                                <div className="absolute right-0 top-8 z-30 w-52 bg-white rounded-2xl shadow-xl border border-gray-150 py-2 text-left text-xs font-bold text-gray-700">
                                                    <button
                                                        onClick={() => { setActiveDropdown(null); handleOpenDetail(item); }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-gray-400" /> Lihat Detail
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            setSingleAssignModalSub(item);
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5 text-gray-400" /> Tugaskan
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            setReminderModalSub(item);
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Kirim Pengingat
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            toast.success('Mode edit data dibuka.');
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-gray-400" /> Edit Data
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            setReturnModalSub(item);
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 text-red-500" /> Kembalikan ke Advisor
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            setPriorityModalSub(item);
                                                        }}
                                                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <Tag className="w-3.5 h-3.5 text-gray-400" /> Tandai Prioritas
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
                    <span>Menampilkan {filteredData.length} dari {submissions.length} pengajuan</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-1 rounded-lg bg-brand-700 text-white font-bold">1</button>
                        <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Validasi Wajib Checklist Indicators */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3">
                <div>
                    <p className="text-xs font-black text-gray-900">Validasi Wajib</p>
                    <p className="text-[10px] text-gray-400 font-medium">Pastikan kelengkapan dokumen wajib sebelum penugasan.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800 text-[11px]">NIK</p>
                            <p className="text-[9px] text-gray-500">Verifikasi identitas</p>
                        </div>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800 text-[11px]">NIB</p>
                            <p className="text-[9px] text-gray-500">Nomor Induk Berusaha</p>
                        </div>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800 text-[11px]">Foto Produk</p>
                            <p className="text-[9px] text-gray-500">Jelas &amp; terbaru</p>
                        </div>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800 text-[11px]">Dokumen Penyelia</p>
                            <p className="text-[9px] text-gray-500">Sertifikat aktif</p>
                        </div>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800 text-[11px]">Daftar Bahan</p>
                            <p className="text-[9px] text-gray-500">Lengkap &amp; jelas</p>
                        </div>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-800 text-[11px]">Foto Produksi</p>
                            <p className="text-[9px] text-amber-700">Area produksi</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Kembalikan ke Advisor */}
            <ReturnAdvisorModal
                isOpen={!!returnModalSub}
                onClose={() => setReturnModalSub(null)}
                submissionId={returnModalSub?.id || ''}
                submissionNo={returnModalSub?.no || ''}
                businessName={returnModalSub?.businessName || ''}
                advisorName={returnModalSub?.advisor || ''}
                onSuccess={() => {
                    if (returnModalSub) {
                        setSubmissions(prev => prev.map(s => s.id === returnModalSub.id ? { ...s, assignStatus: 'Menunggu Review', priority: 'Kritis' } : s));
                    }
                }}
            />

            {/* Modal: Tandai Prioritas */}
            <ChangePriorityModal
                isOpen={!!priorityModalSub}
                onClose={() => setPriorityModalSub(null)}
                submissionId={priorityModalSub?.id || ''}
                submissionNo={priorityModalSub?.no || ''}
                currentPriority={priorityModalSub?.priority || 'Normal'}
                onSuccess={(newPriority) => {
                    if (priorityModalSub) {
                        setSubmissions(prev => prev.map(s => s.id === priorityModalSub.id ? { ...s, priority: newPriority } : s));
                    }
                }}
            />

            {/* Modal: Tugaskan Satuan */}
            <SingleAssignModal
                isOpen={!!singleAssignModalSub}
                onClose={() => setSingleAssignModalSub(null)}
                submissionId={singleAssignModalSub?.id || ''}
                submissionNo={singleAssignModalSub?.no || ''}
                businessName={singleAssignModalSub?.businessName || ''}
                currentStage="Verifikasi QCO"
                staffList={staffList}
                onSuccess={() => {
                    if (singleAssignModalSub) {
                        setSubmissions(prev => prev.map(s => s.id === singleAssignModalSub.id ? { ...s, assignStatus: 'Ditugaskan ke QCO' } : s));
                    }
                }}
            />

            {/* Modal: Kirim Pengingat */}
            <SendReminderModal
                isOpen={!!reminderModalSub}
                onClose={() => setReminderModalSub(null)}
                submissionId={reminderModalSub?.id || ''}
                submissionNo={reminderModalSub?.no || ''}
                businessName={reminderModalSub?.businessName || ''}
                advisorName={reminderModalSub?.advisor || ''}
                defaultRecipient="ADVISOR"
            />
        </div>
    );
}
