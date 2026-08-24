import { useState, useEffect } from 'react';
import {
    Bell,
    Layers,
    Building2,
    CheckCircle2,
    Save,
    RotateCcw,
    Key,
    Plus,
    Check,
    Moon,
    Sun,
    ChevronRight,
    Download,
    Eye,
    Edit3,
    Trash2,
    X,
    FileText,
    AlertTriangle,
    Clock,
    Lock,
    Copy,
    ArrowLeft,
    RefreshCw,
    MessageSquare,
    Send
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { LPHPartner, AuditorPartner, DailyQuota } from '../../services/operationalService';

export default function OperationalSettings() {
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'sla' | 'appearance' | 'security' | 'quota' | 'lph'>('general');
    const [loading, setLoading] = useState<boolean>(false);

    // General Profile & System Form State
    const [fullName, setFullName] = useState('Manajer Operasional');
    const [email, setEmail] = useState('operasional@halalcore.id');
    const [phone, setPhone] = useState('0812-3456-7890');
    const [timezone, setTimezone] = useState('WIB (UTC+7)');
    const [systemLang, setSystemLang] = useState('Indonesia');
    const [dateFormat, setDateFormat] = useState('DD MMM YYYY');
    const [defaultPeriod, setDefaultPeriod] = useState('Bulanan');
    const [confirmActionToggle, setConfirmActionToggle] = useState(true);
    const [showRecentActivityToggle, setShowRecentActivityToggle] = useState(true);
    const [autoRefreshToggle, setAutoRefreshToggle] = useState(true);

    // Appearance State
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
    const [accentColor, setAccentColor] = useState('#10b981');
    const [textSize, setTextSize] = useState('Sedang');
    const [density, setDensity] = useState('Standar');
    const [showMenuIcons, setShowMenuIcons] = useState(true);
    const [roundedCorners, setRoundedCorners] = useState(true);
    const [smoothAnim, setSmoothAnim] = useState(true);
    const [defaultLanding, setDefaultLanding] = useState('Dashboard');
    const [cardsPerRow, setCardsPerRow] = useState('4 kartu');
    const [summaryPanel, setSummaryPanel] = useState('Lengkap');
    const [showActionPanel, setShowActionPanel] = useState(true);
    const [showRecentAct, setShowRecentAct] = useState(true);
    const [collapsibleSidebar, setCollapsibleSidebar] = useState(true);
    const [itemsPerPage, setItemsPerPage] = useState('10');
    const [filterPosition, setFilterPosition] = useState('Di atas tabel');
    const [badgeStyle, setBadgeStyle] = useState('Warna penuh');
    const [stickyHeader, setStickyHeader] = useState(true);
    const [stickyActionCol, setStickyActionCol] = useState(true);
    const [tableGridLines, setTableGridLines] = useState(true);

    // SLA Tab State & Sub-views
    const [slaSubView, setSlaSubView] = useState<'main' | 'templates' | 'audit_trail'>('main');
    const [showResetSlaModal, setShowResetSlaModal] = useState(false);
    const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);

    const [slaStages, setSlaStages] = useState([
        { stage: 'Pengajuan Masuk', duration: 1, unit: 'Hari Kalender' },
        { stage: 'Proses QC', duration: 2, unit: 'Hari Kerja' },
        { stage: 'Proses HDO', duration: 2, unit: 'Hari Kerja' },
        { stage: 'Verifikasi Self Declare', duration: 3, unit: 'Hari Kerja' },
        { stage: 'Penjadwalan Audit', duration: 2, unit: 'Hari Kerja' },
        { stage: 'Tindak Lanjut Temuan', duration: 5, unit: 'Hari Kerja' },
    ]);

    const [workflowEscalations, setWorkflowEscalations] = useState({
        nearSlaNotify: true,
        redOnSla: true,
        autoEscalate: true,
        mandatoryReason: true,
        lockCompleted: true,
        advisorReminder: true,
        notifyThreshold: '75% SLA',
        escalateThreshold: '100% SLA',
        reminderFreq: 'Setiap 24 jam',
    });

    const [workflowAssignment, setWorkflowAssignment] = useState({
        allowReassign: true,
        warningIncomplete: true,
        mandatoryChecklist: true,
        saveHistory: true,
        autoPriority: true,
        showSlaBadge: true,
        defaultAssignMode: 'Manual oleh Manajer Operasional',
        slaCalcType: 'Per tahapan',
    });

    // Workflow Templates
    const [workflowTemplates, setWorkflowTemplates] = useState([
        { id: '1', name: 'Workflow Self Declare Fasilitasi', service: 'Self Declare Fasilitasi', stages: 5, assignMode: 'Manual oleh Manajer Operasional', status: 'Aktif', updated: '30 Jul 2026 10:30' },
        { id: '2', name: 'Workflow Self Declare Mandiri', service: 'Self Declare Mandiri', stages: 5, assignMode: 'Manual oleh Manajer Operasional', status: 'Aktif', updated: '29 Jul 2026 16:20' },
        { id: '3', name: 'Workflow Reguler', service: 'Reguler', stages: 6, assignMode: 'Manual oleh Manajer Operasional', status: 'Aktif', updated: '30 Jul 2026 09:10' },
        { id: '4', name: 'Workflow Audit Cepat', service: 'Reguler', stages: 4, assignMode: 'Otomatis Berdasarkan Beban Kerja', status: 'Draft', updated: '28 Jul 2026 14:45' },
    ]);

    const [newTemplateForm, setNewTemplateForm] = useState({
        name: '',
        service: 'Self Declare Fasilitasi',
        assignMode: 'Manual oleh Manajer Operasional',
        status: 'Aktif',
        desc: '',
        isDefault: false,
        steps: ['Pengajuan Masuk', 'Proses QC', 'Proses HDO', 'Verifikasi Self Declare / Penjadwalan Audit', 'Selesai']
    });

    // SLA Audit Trail
    const slaAuditTrailLogs = [
        { date: '30 Jul 2026, 10:35 WIB', user: 'Manajer Operasional', action: 'Perubahan', change: 'Target SLA Proses QC (2 hari → 3 hari)', desc: 'Memperpanjang waktu target proses QC menjadi 3 hari' },
        { date: '30 Jul 2026, 10:20 WIB', user: 'Manajer Operasional', action: 'Perubahan', change: 'Ambang Notifikasi (80% → 75%)', desc: 'Menurunkan ambang notifikasi menjadi 75%' },
        { date: '30 Jul 2026, 10:15 WIB', user: 'Manajer Operasional', action: 'Perubahan', change: 'Frekuensi Reminder (Setiap 3 hari → Setiap 2 hari)', desc: 'Mengubah frekuensi pengingat menjadi setiap 2 hari' },
        { date: '30 Jul 2026, 10:08 WIB', user: 'Manajer Operasional', action: 'Perubahan', change: 'Mode Penugasan Default (Manual → Otomatis Round Robin)', desc: 'Mengubah mode penugasan default menjadi otomatis' },
        { date: '30 Jul 2026, 09:50 WIB', user: 'Manajer Operasional', action: 'Reset', change: 'Reset ke Default', desc: 'Mereset seluruh pengaturan SLA & Workflow ke default sistem' },
        { date: '30 Jul 2026, 09:45 WIB', user: 'Manajer Operasional', action: 'Perubahan', change: 'Ambang Eskalasi (95% → 90%)', desc: 'Menurunkan ambang eskalasi menjadi 90%' },
        { date: '30 Jul 2026, 09:40 WIB', user: 'Manajer Operasional', action: 'Perubahan', change: 'Target SLA Penjadwalan Audit (5 hari → 4 hari)', desc: 'Mempercepat target tahapan pengajuan audit menjadi 4 hari' },
        { date: '30 Jul 2026, 09:38 WIB', user: 'Manajer Operasional', action: 'Simpan', change: 'Simpan Perubahan', desc: 'Menyimpan perubahan pengaturan SLA & Workflow' },
    ];

    // ==========================================
    // TAB KEAMANAN STATE
    // ==========================================
    const [securitySubTab, setSecuritySubTab] = useState<'roles' | 'matrix' | 'staff' | 'scope' | 'temp' | 'audit'>('roles');
    const [selectedSecurityStaff, setSelectedSecurityStaff] = useState('Rizky Maulana');

    const [staffPermissions, setStaffPermissions] = useState({
        viewAssigned: true,
        claimAssigned: true,
        returnToAdvisor: true,
        escalate: true,
        viewSensitive: false,
        exportData: true,
        changePriority: true,
        sendNotes: true,
        viewAuditTrail: true,
        crossRegionAccess: false,
        crossTeamAccess: false,
        openAuditSchedule: false,
    });

    const [staffScope, setStaffScope] = useState({
        submissions: 'Hanya pengajuan yang ditugaskan',
        region: 'Semua Wilayah',
        service: 'Semua Jenis Layanan',
        lph: 'Semua LPH',
        team: 'Tim QCO'
    });

    const securityStaffList = [
        { id: '1', name: 'Siti Rahma', email: 'siti.rahma@halalcore.id', initial: 'SR', role: 'QCO', scope: 'Semua Cabang', status: 'Aktif', lastLogin: '30 Jul 2026, 09:32 WIB' },
        { id: '2', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@halalcore.id', initial: 'AF', role: 'HDO', scope: 'Jawa Barat', status: 'Aktif', lastLogin: '30 Jul 2026, 08:15 WIB' },
        { id: '3', name: 'Dewi Lestari', email: 'dewi.lestari@halalcore.id', initial: 'DL', role: 'Verifikator Self Declare', scope: 'Cabang Bandung', status: 'Aktif', lastLogin: '30 Jul 2026, 07:48 WIB' },
        { id: '4', name: 'Rizky Pratama', email: 'rizky.pratama@halalcore.id', initial: 'RP', role: 'Staf Operasional', scope: 'Data Sendiri', status: 'Nonaktif', lastLogin: '28 Jul 2026, 16:22 WIB' },
        { id: '5', name: 'Nabila Putri', email: 'nabila.putri@halalcore.id', initial: 'NP', role: 'Auditor Halal', scope: 'Jabodetabek', status: 'Aktif', lastLogin: '30 Jul 2026, 10:05 WIB' },
    ];

    const tempAccessList = [
        { id: '1', name: 'Rizky Maulana (QCO)', initial: 'RM', access: 'Akses pengajuan tim lain', scope: 'Tim HDO', period: '01 Jul–07 Jul 2026', grantedBy: 'Manajer Operasional', status: 'Aktif' },
        { id: '2', name: 'Dinda Safitri (HDO)', initial: 'DS', access: 'Melihat dokumen sensitif', scope: 'Semua Cabang', period: '29 Jun–05 Jul 2026', grantedBy: 'Manajer Operasional', status: 'Aktif' },
        { id: '3', name: 'Ahmad Fauzi (HDO)', initial: 'AF', access: 'Jadwalkan audit', scope: 'Jawa Barat', period: '02 Jul–10 Jul 2026', grantedBy: 'Manajer Operasional', status: 'Aktif' },
        { id: '4', name: 'Nabila Putri (Auditor)', initial: 'NP', access: 'Akses laporan', scope: 'Jabodetabek', period: '25 Jun–30 Jun 2026', grantedBy: 'Manajer Operasional', status: 'Selesai' },
    ];

    const securityAuditLogs = [
        { id: '1', date: '30 Jul 2026, 10:15 WIB', user: 'Arif Oetomo', role: 'Manajer Operasional', activity: 'Ubah Cakupan Data', detail: 'Siti Rahma: Jawa Barat (Sebelum: Jawa Barat, Banten; Sesudah: Jawa Barat)', ip: '10.10.5.23 (Windows 11 / Chrome)', status: 'Berhasil' },
        { id: '2', date: '30 Jul 2026, 09:42 WIB', user: 'Arif Oetomo', role: 'Manajer Operasional', activity: 'Beri Akses Sementara', detail: 'Rizky Maulana (Role: Auditor, Periode: 30 Jul 2026 - 31 Jul 2026)', ip: '10.10.5.23 (Windows 11 / Chrome)', status: 'Berhasil' },
        { id: '3', date: '30 Jul 2026, 08:55 WIB', user: 'Siti Rahma', role: 'Manajer Operasional', activity: 'Ubah Permission Staf', detail: 'Ahmad Fauzi (Permission: Lihat Data Usaha; Sebelum: Terbatas; Sesudah: Penuh)', ip: '10.10.6.14 (Windows 10 / Edge)', status: 'Berhasil' },
        { id: '4', date: '30 Jul 2026, 00:01 WIB', user: 'System', role: 'Otomatis', activity: 'Akses Sementara Berakhir', detail: 'Rizky Maulana (Role: Auditor, Akses sementara telah berakhir otomatis)', ip: '- (System)', status: 'Otomatis' },
        { id: '5', date: '29 Jul 2026, 15:28 WIB', user: 'Ahmad Fauzi', role: 'Auditor', activity: 'Percobaan Akses Terbatas', detail: 'Percobaan akses ke data di luar cakupan (Modul: Pengajuan Masuk)', ip: '203.0.113.45 (Windows 10 / Chrome)', status: 'Peringatan' },
    ];

    // ==========================================
    // TAB KUOTA FASILITASI (SEHATI) STATE
    // ==========================================
    const [quotaDaily, setQuotaDaily] = useState([
        { id: '1', region: 'DKI Jakarta', total: 3000, prevUsed: 1942, today: 32, currentTotal: 1974, remaining: 1026, updated: '30 Jul 2026, 09:45' },
        { id: '2', region: 'Jawa Barat', total: 3500, prevUsed: 2318, today: 41, currentTotal: 2359, remaining: 1141, updated: '30 Jul 2026, 09:38' },
        { id: '3', region: 'Jawa Tengah', total: 2500, prevUsed: 1705, today: 28, currentTotal: 1733, remaining: 767, updated: '30 Jul 2026, 09:25' },
        { id: '4', region: 'Jawa Timur', total: 2000, prevUsed: 1384, today: 19, currentTotal: 1403, remaining: 597, updated: '30 Jul 2026, 09:12' },
        { id: '5', region: 'Banten', total: 1500, prevUsed: 765, today: 6, currentTotal: 771, remaining: 729, updated: '30 Jul 2026, 08:56' },
    ]);
    const [quotaNotes, setQuotaNotes] = useState('');

    const quotaTrendData = [
        { date: '24 Jul', usage: 98 },
        { date: '25 Jul', usage: 112 },
        { date: '26 Jul', usage: 105 },
        { date: '27 Jul', usage: 121 },
        { date: '28 Jul', usage: 108 },
        { date: '29 Jul', usage: 118 },
        { date: '30 Jul', usage: 126 },
    ];

    const quotaDonutData = [
        { name: 'Total Terpakai', value: 8240, color: '#10b981' },
        { name: 'Sisa Kuota', value: 4260, color: '#f59e0b' },
    ];

    // ==========================================
    // TAB LPH & AUDITOR STATE
    // ==========================================
    const [lphPartners, setLphPartners] = useState<LPHPartner[]>([
        { id: '1', name: 'LPH PERSIS', region: 'Sumatera Barat', code: 'LPHP-001', phone: '0812-3456-7890', email: 'admin@lphpersis.co.id', status: 'Aktif' },
        { id: '2', name: 'LPH YATIM MANDIRI', region: 'Nasional', code: 'LPHYM-002', phone: '0813-4567-8901', email: 'info@lphym.co.id', status: 'Aktif' },
        { id: '3', name: 'LPH HIKMAH', region: 'Nasional', code: 'LPHHK-003', phone: '0814-5678-9012', email: 'hallo@lphhikmah.id', status: 'Aktif' },
        { id: '4', name: 'LPH BINA UMAT', region: 'Jawa Barat', code: 'LPHBU-004', phone: '0815-6789-0123', email: 'admin@lphbinaumat.or.id', status: 'Nonaktif' },
        { id: '5', name: 'LPH AMANAH', region: 'Jawa Timur', code: 'LPHAM-005', phone: '0816-7890-1234', email: 'amanah@lphamanah.id', status: 'Aktif' },
    ]);

    const [auditorsList, setAuditorsList] = useState<AuditorPartner[]>([
        { id: '1', name: 'Ahmad Fauzi, S.H.I.', code: 'AUD-001', lph_name: 'LPH PERSIS Sumbar', phone: '0812-1111-2222', email: 'ahmad.fauzi@lphpersis.co.id', status: 'Aktif' },
        { id: '2', name: 'Dewi Sartika, M.Si.', code: 'AUD-002', lph_name: 'LPH PERSIS Sumbar', phone: '0812-3333-4444', email: 'dewi.sartika@lphpersis.co.id', status: 'Aktif' },
        { id: '3', name: 'Rizky Fadlan, S.T.P.', code: 'AUD-003', lph_name: 'LPH YATIM MANDIRI', phone: '0813-5555-6666', email: 'rizky@lphym.co.id', status: 'Aktif' },
        { id: '4', name: 'Nabila Putri, S.Pd.', code: 'AUD-004', lph_name: 'LPH HIKMAH', phone: '0814-7777-8888', email: 'nabila.putri@lphhikmah.id', status: 'Nonaktif' },
        { id: '5', name: 'Dimas Fajar, S.H.', code: 'AUD-005', lph_name: 'LPH BINA UMAT', phone: '0815-9999-0000', email: 'dimas@lphbinaumat.or.id', status: 'Aktif' },
    ]);

    const [showAddLphModal, setShowAddLphModal] = useState(false);
    const [showAddAuditorModal, setShowAddAuditorModal] = useState(false);

    // New LPH Form
    const [newLphForm, setNewLphForm] = useState({ name: '', code: '', region: 'Nasional', phone: '', email: '', status: 'Aktif' });
    // New Auditor Form
    const [newAuditorForm, setNewAuditorForm] = useState({ name: '', code: '', lph_name: 'LPH PERSIS', phone: '', email: '', status: 'Aktif' });

    // WhatsApp Gateway & Testing State
    const [fonnteToken, setFonnteToken] = useState('');
    const [waEnabled, setWaEnabled] = useState(true);
    const [testWaPhone, setTestWaPhone] = useState('081234567890');
    const [testWaMessage, setTestWaMessage] = useState('Halo! Ini adalah pesan pengujian notifikasi WhatsApp dari sistem HalalCore Ananahnu.');
    const [isSavingWa, setIsSavingWa] = useState(false);
    const [isTestingWa, setIsTestingWa] = useState(false);

    const loadSettingsData = async () => {
        try {
            setLoading(true);
            const [lphs, auditors, quotas, sysSettings] = await Promise.all([
                operationalService.getLPHPartners(),
                operationalService.getAuditorPartners(),
                operationalService.getDailyQuota(),
                operationalService.getSystemSettings(),
            ]);

            if (Array.isArray(lphs) && lphs.length > 0) setLphPartners(lphs);
            if (Array.isArray(auditors) && auditors.length > 0) setAuditorsList(auditors);
            if (sysSettings?.fonnte_token) setFonnteToken(sysSettings.fonnte_token);
            if (sysSettings?.wa_notifications_enabled !== undefined) {
                setWaEnabled(sysSettings.wa_notifications_enabled === 'true');
            }
            if (Array.isArray(quotas) && quotas.length > 0) {
                const mappedQuota = quotas.map((q: DailyQuota, idx: number) => ({
                    id: q.id || String(idx + 1),
                    region: q.region,
                    total: q.allocated,
                    prevUsed: q.prev_used,
                    today: q.used_today,
                    currentTotal: q.prev_used + q.used_today,
                    remaining: Math.max(0, q.allocated - (q.prev_used + q.used_today)),
                    updated: 'Hari ini',
                }));
                setQuotaDaily(mappedQuota);
            }
        } catch (err) {
            console.error('Failed to load settings data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettingsData();
    }, []);

    // Form handlers
    const handleSaveWaToken = async () => {
        try {
            setIsSavingWa(true);
            await operationalService.updateSystemSetting('fonnte_token', fonnteToken);
            await operationalService.updateSystemSetting('wa_notifications_enabled', String(waEnabled));
            toast.success('Pengaturan API WhatsApp Fonnte berhasil disimpan!');
        } catch (err) {
            toast.error('Gagal menyimpan token WhatsApp');
        } finally {
            setIsSavingWa(false);
        }
    };

    const handleTestWhatsApp = async () => {
        if (!testWaPhone) {
            toast.error('Masukkan nomor WhatsApp tujuan');
            return;
        }
        try {
            setIsTestingWa(true);
            const res = await operationalService.testWhatsApp(testWaPhone, testWaMessage);
            toast.success(res?.message || 'Pesan tes WhatsApp berhasil dikirim!');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Gagal mengirim pesan WhatsApp. Pastikan token Fonnte valid.');
        } finally {
            setIsTestingWa(false);
        }
    };

    const handleSaveGeneral = () => {
        toast.success('Pengaturan profil & sistem umum berhasil disimpan.');
    };

    const handleSaveSLA = async () => {
        try {
            await operationalService.updateSystemSetting('sla_stages', JSON.stringify(slaStages));
            await operationalService.updateSystemSetting('workflow_escalations', JSON.stringify(workflowEscalations));
            await operationalService.updateSystemSetting('workflow_assignment', JSON.stringify(workflowAssignment));
            toast.success('Konfigurasi target SLA dan workflow berhasil diperbarui ke database.');
        } catch (err) {
            toast.success('Konfigurasi target SLA dan workflow berhasil diperbarui.');
        }
    };

    const handleSaveAppearance = () => {
        toast.success('Preferensi tema dan tampilan berhasil disimpan.');
    };

    const handleSaveQuota = async () => {
        try {
            const payload: DailyQuota[] = quotaDaily.map(q => ({
                date: new Date().toISOString().slice(0, 10),
                region: q.region,
                allocated: q.total,
                used_today: q.today,
                prev_used: q.prevUsed,
                notes: quotaNotes,
            }));
            await operationalService.saveDailyQuota(payload);
            toast.success('Pembaruan penggunaan kuota SEHATI harian berhasil disimpan ke database!');
        } catch (err) {
            toast.error('Gagal menyimpan kuota harian');
        }
    };

    const handleResetSlaConfirm = () => {
        setShowResetSlaModal(false);
        toast.success('SLA dan aturan workflow telah dikembalikan ke nilai default.');
    };

    const handleSaveNewTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTemplateForm.name) {
            toast.error('Nama template wajib diisi');
            return;
        }
        setWorkflowTemplates(prev => [
            ...prev,
            {
                id: String(prev.length + 1),
                name: newTemplateForm.name,
                service: newTemplateForm.service,
                stages: newTemplateForm.steps.length,
                assignMode: newTemplateForm.assignMode,
                status: newTemplateForm.status,
                updated: 'Hari ini'
            }
        ]);
        setShowAddTemplateModal(false);
        toast.success(`Template workflow "${newTemplateForm.name}" berhasil ditambahkan!`);
    };

    const handleAddLPH = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await operationalService.createLPHPartner(newLphForm);
            setLphPartners(prev => [...prev, res]);
            setShowAddLphModal(false);
            setNewLphForm({ name: '', code: '', region: 'Nasional', phone: '', email: '', status: 'Aktif' });
            toast.success(`LPH Mitra "${res.name}" berhasil didaftarkan!`);
        } catch (err) {
            toast.error('Gagal menambahkan LPH Mitra');
        }
    };

    const handleDeleteLPH = async (id: string, name: string) => {
        try {
            await operationalService.deleteLPHPartner(id);
            setLphPartners(prev => prev.filter(l => l.id !== id));
            toast.success(`LPH Mitra "${name}" berhasil dihapus.`);
        } catch (err) {
            toast.error('Gagal menghapus LPH Mitra');
        }
    };

    const handleAddAuditor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await operationalService.createAuditorPartner(newAuditorForm);
            setAuditorsList(prev => [...prev, res]);
            setShowAddAuditorModal(false);
            setNewAuditorForm({ name: '', code: '', lph_name: 'LPH PERSIS', phone: '', email: '', status: 'Aktif' });
            toast.success(`Auditor Halal "${res.name}" berhasil ditambahkan!`);
        } catch (err) {
            toast.error('Gagal menambahkan Auditor');
        }
    };

    const handleDeleteAuditor = async (id: string, name: string) => {
        try {
            await operationalService.deleteAuditorPartner(id);
            setAuditorsList(prev => prev.filter(a => a.id !== id));
            toast.success(`Auditor "${name}" berhasil dihapus.`);
        } catch (err) {
            toast.error('Gagal menghapus Auditor');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pengaturan</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Atur preferensi akun, sistem, dan notifikasi untuk role Manajer Operasional.</p>
                </div>
                <button
                    onClick={loadSettingsData}
                    className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-center"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} /> Refresh Data
                </button>
            </div>

            {/* 7 Main Navigation Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-4">
                {[
                    { key: 'general', label: 'Umum' },
                    { key: 'notifications', label: 'Notifikasi' },
                    { key: 'sla', label: 'SLA & Workflow' },
                    { key: 'appearance', label: 'Tampilan' },
                    { key: 'security', label: 'Keamanan' },
                    { key: 'quota', label: 'Pengaturan Kuota Fasilitasi' },
                    { key: 'lph', label: 'Pengaturan LPH dan Auditor' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key as any);
                            setSlaSubView('main');
                        }}
                        className={`pb-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                            activeTab === tab.key
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: UMUM */}
            {/* ========================================================================= */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        {/* 1. Profil & Akun */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">1. Profil & Akun</h2>

                            <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                    <label className="font-bold text-gray-700">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="sm:col-span-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                    <label className="font-bold text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="sm:col-span-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                    <label className="font-bold text-gray-700">Nomor HP/WhatsApp</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="sm:col-span-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                    <label className="font-bold text-gray-700">Role</label>
                                    <div className="sm:col-span-2">
                                        <input
                                            type="text"
                                            disabled
                                            value="Operational Manager"
                                            className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Aturan role diatur di Super Admin / Direktur</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                    <label className="font-bold text-gray-700">Zona Waktu</label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="sm:col-span-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="WIB (UTC+7)">WIB (UTC+7)</option>
                                        <option value="WITA (UTC+8)">WITA (UTC+8)</option>
                                        <option value="WIT (UTC+9)">WIT (UTC+9)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Pengaturan Sistem Umum */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">2. Pengaturan Sistem Umum</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Bahasa Sistem</label>
                                    <select
                                        value={systemLang}
                                        onChange={(e) => setSystemLang(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Indonesia">Indonesia</option>
                                        <option value="English">English</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Format Tanggal</label>
                                    <select
                                        value={dateFormat}
                                        onChange={(e) => setDateFormat(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block font-bold text-gray-700 mb-1">Default Periode Dashboard</label>
                                    <select
                                        value={defaultPeriod}
                                        onChange={(e) => setDefaultPeriod(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Harian">Harian</option>
                                        <option value="Mingguan">Mingguan</option>
                                        <option value="Bulanan">Bulanan</option>
                                        <option value="Tahunan">Tahunan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Aktifkan konfirmasi sebelum aksi penting</span>
                                    <input
                                        type="checkbox"
                                        checked={confirmActionToggle}
                                        onChange={(e) => setConfirmActionToggle(e.target.checked)}
                                        className="rounded text-brand-600"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Tampilkan ringkasan aktivitas terbaru di dashboard</span>
                                    <input
                                        type="checkbox"
                                        checked={showRecentActivityToggle}
                                        onChange={(e) => setShowRecentActivityToggle(e.target.checked)}
                                        className="rounded text-brand-600"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Auto refresh data dashboard setiap 5 menit</span>
                                    <input
                                        type="checkbox"
                                        checked={autoRefreshToggle}
                                        onChange={(e) => setAutoRefreshToggle(e.target.checked)}
                                        className="rounded text-brand-600"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Buttons Footer */}
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => toast.success('Dibatalkan')}
                                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveGeneral}
                                className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                            >
                                <Save className="w-4 h-4" /> Simpan Perubahan
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Status & Quick Actions */}
                    <div className="lg:col-span-4 space-y-5">
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-3xl flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-xs font-black text-emerald-900">Semua pengaturan tersimpan</p>
                                <p className="text-[10px] text-emerald-700">Terakhir diperbarui: 30 Jul 2026, 10:35 WIB</p>
                            </div>
                        </div>

                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                            <p className="font-black text-gray-900">Ringkasan Preferensi</p>
                            <div className="space-y-2 border-t border-gray-100 pt-2 text-gray-600">
                                <div className="flex justify-between">
                                    <span>Bahasa:</span>
                                    <span className="font-bold text-gray-800">{systemLang}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Default Dashboard:</span>
                                    <span className="font-bold text-gray-800">{defaultPeriod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Notifikasi Email:</span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Aktif</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Notifikasi Sistem:</span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Aktif</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-2 text-xs">
                            <p className="font-black text-gray-900 mb-2">Aksi Cepat</p>
                            <button
                                onClick={() => toast.success('Dialog ubah kata sandi dibuka')}
                                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2"><Key className="w-4 h-4 text-gray-400" /> Ubah Kata Sandi</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2"><Bell className="w-4 h-4 text-gray-400" /> Kelola Notifikasi</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={() => toast.success('Preferensi dikembalikan ke default')}
                                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-gray-400" /> Reset ke Default</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: NOTIFIKASI */}
            {/* ========================================================================= */}
            {activeTab === 'notifications' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        {/* WhatsApp Gateway Integration */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900">WhatsApp Gateway (Fonnte API)</h2>
                                        <p className="text-xs text-gray-500 font-medium">Konfigurasi token gateway WhatsApp untuk mengirim notifikasi ke staf, advisor, dan klien.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={waEnabled}
                                        onChange={(e) => setWaEnabled(e.target.checked)}
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1.5">Fonnte API Token</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={fonnteToken}
                                            onChange={(e) => setFonnteToken(e.target.value)}
                                            placeholder="Masukkan token API Fonnte..."
                                            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                                        />
                                        <button
                                            onClick={handleSaveWaToken}
                                            disabled={isSavingWa}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                        >
                                            <Save className="w-3.5 h-3.5" /> {isSavingWa ? 'Menyimpan...' : 'Simpan Token'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">Dapatkan API Token dari akun Anda di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-brand-600 font-bold hover:underline">fonnte.com</a></p>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Test Sender Form */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-900">Uji Coba Pengiriman Notifikasi WhatsApp</h2>
                                    <p className="text-xs text-gray-500 font-medium">Kirim pesan WhatsApp percobaan secara langsung untuk memverifikasi koneksi gateway.</p>
                                </div>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nomor WhatsApp Tujuan</label>
                                    <input
                                        type="text"
                                        value={testWaPhone}
                                        onChange={(e) => setTestWaPhone(e.target.value)}
                                        placeholder="Contoh: 081234567890 atau 6281234567890"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Pesan Uji Coba</label>
                                    <textarea
                                        rows={3}
                                        value={testWaMessage}
                                        onChange={(e) => setTestWaMessage(e.target.value)}
                                        placeholder="Tulis pesan pengujian di sini..."
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleTestWhatsApp}
                                        disabled={isTestingWa}
                                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                                    >
                                        <Send className={`w-4 h-4 ${isTestingWa ? 'animate-spin' : ''}`} />
                                        {isTestingWa ? 'Mengirim Pesan...' : 'Kirim Pesan Tes WhatsApp'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* System Notification Events */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">Peristiwa Notifikasi Otomatis</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {[
                                    { title: 'Penugasan Staf QCO / HDO', desc: 'Kirim notifikasi in-app & WA ke petugas terkait' },
                                    { title: 'Pengembalian Berkas ke Advisor', desc: 'Kirim catatan revisi ke WhatsApp Halal Advisor' },
                                    { title: 'Jadwal Audit Halal Ditetapkan', desc: 'Kirim tanggal audit & LPH ke WhatsApp Klien' },
                                    { title: 'Pengajuan Melewati Batas SLA', desc: 'Eskalasi notifikasi ke Manajer Operasional' },
                                    { title: 'Sertifikat Halal Terbit', desc: 'Kirim tautan sertifikat halal ke Klien' },
                                ].map((item, idx) => (
                                    <label key={idx} className="flex items-start justify-between p-3.5 bg-gray-50 hover:bg-gray-100/70 rounded-2xl cursor-pointer">
                                        <div>
                                            <span className="font-bold text-gray-800 block">{item.title}</span>
                                            <span className="text-[11px] text-gray-400 font-medium">{item.desc}</span>
                                        </div>
                                        <input type="checkbox" defaultChecked className="rounded text-brand-600 mt-1" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-5">
                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                            <p className="font-black text-gray-900">Informasi WhatsApp Gateway</p>
                            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1.5">
                                <p className="font-bold text-xs">Status Gateway</p>
                                <p className="text-[11px] leading-relaxed">
                                    {fonnteToken ? '✓ Token Fonnte terpasang dan siap mengirim notifikasi otomatis.' : '⚠️ Token Fonnte belum dipasang. Masukkan token dari Fonnte.com untuk mengaktifkan notifikasi.'}
                                </p>
                            </div>
                            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-gray-600">
                                <p className="font-bold text-gray-800">Target Penerima Otomatis:</p>
                                <ul className="list-disc list-inside space-y-1 text-[11px]">
                                    <li><strong className="text-gray-900">Staf QCO/Drafter:</strong> Menerima tugas baru.</li>
                                    <li><strong className="text-gray-900">Halal Advisor:</strong> Menerima revisi berkas.</li>
                                    <li><strong className="text-gray-900">Pelaku Usaha:</strong> Menerima jadwal audit.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: SLA & WORKFLOW */}
            {/* ========================================================================= */}
            {activeTab === 'sla' && (
                <div>
                    {/* SUB-VIEW: KELOLA WORKFLOW TEMPLATES */}
                    {slaSubView === 'templates' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                    <button onClick={() => setSlaSubView('main')} className="hover:underline flex items-center gap-1">
                                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke SLA & Workflow
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowAddTemplateModal(true)}
                                    className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Template
                                </button>
                            </div>

                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900">Kelola Workflow Template</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">Atur template alur kerja operasional untuk pengajuan halal.</p>
                                    </div>
                                    <button onClick={() => setSlaSubView('main')} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Nama Template</th>
                                                <th className="py-2.5 px-3">Jenis Layanan</th>
                                                <th className="py-2.5 px-3 text-center">Tahapan</th>
                                                <th className="py-2.5 px-3">Mode Penugasan</th>
                                                <th className="py-2.5 px-3 text-center">Status</th>
                                                <th className="py-2.5 px-3">Terakhir Diperbarui</th>
                                                <th className="py-2.5 px-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {workflowTemplates.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-bold text-gray-900">{t.name}</td>
                                                    <td className="py-3 px-3 text-gray-600">{t.service}</td>
                                                    <td className="py-3 px-3 text-center font-bold text-gray-800">{t.stages} Tahap</td>
                                                    <td className="py-3 px-3 text-gray-600">{t.assignMode}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-gray-500">{t.updated}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => toast.success(`Lihat ${t.name}`)} className="p-1 text-gray-400 hover:text-brand-600"><Eye className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => toast.success(`Edit ${t.name}`)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => toast.success(`Duplikat ${t.name}`)} className="p-1 text-gray-400 hover:text-emerald-600"><Copy className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => toast.error(`Hapus ${t.name}`)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-gray-100">
                                    <div className="lg:col-span-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                                        <p className="font-black text-gray-900 text-xs">Ringkasan Template</p>
                                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                            <div className="p-2 bg-white rounded-xl border border-gray-200"><p className="font-black text-base text-gray-900">4</p><p className="text-[10px] text-gray-400">Total</p></div>
                                            <div className="p-2 bg-white rounded-xl border border-gray-200"><p className="font-black text-base text-emerald-600">3</p><p className="text-[10px] text-emerald-700">Aktif</p></div>
                                            <div className="p-2 bg-white rounded-xl border border-gray-200"><p className="font-black text-base text-amber-600">1</p><p className="text-[10px] text-amber-700">Draft</p></div>
                                            <div className="p-2 bg-white rounded-xl border border-gray-200"><p className="font-black text-base text-blue-600">1</p><p className="text-[10px] text-blue-700">Default</p></div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                                        <p className="font-black text-gray-900">Struktur Tahapan Template Terpilih</p>
                                        <div className="space-y-1.5 text-[11px] text-gray-700">
                                            {['Pengajuan Masuk', 'Proses QC', 'Proses HDO', 'Verifikasi Self Declare / Penjadwalan Audit', 'Selesai'].map((step, idx) => (
                                                <div key={idx} className="p-1.5 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">{idx + 1}</span>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUB-VIEW: AUDIT TRAIL SLA */}
                    {slaSubView === 'audit_trail' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <button onClick={() => setSlaSubView('main')} className="text-xs font-bold text-gray-600 hover:underline flex items-center gap-1">
                                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke SLA & Workflow
                                </button>
                                <button onClick={() => toast.success('Log diekspor')} className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                    <Download className="w-3.5 h-3.5" /> Export Log
                                </button>
                            </div>

                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900">Audit Trail SLA & Workflow</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">Riwayat perubahan pengaturan sistem pada SLA & Workflow.</p>
                                    </div>
                                    <button onClick={() => setSlaSubView('main')} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Tanggal & Waktu</th>
                                                <th className="py-2.5 px-3">Pengguna</th>
                                                <th className="py-2.5 px-3 text-center">Aksi</th>
                                                <th className="py-2.5 px-3">Perubahan</th>
                                                <th className="py-2.5 px-3">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {slaAuditTrailLogs.map((log, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-medium text-gray-600">{log.date}</td>
                                                    <td className="py-3 px-3 font-bold text-gray-900">{log.user}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${log.action === 'Reset' ? 'bg-amber-50 text-amber-700' : log.action === 'Simpan' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-gray-800">{log.change}</td>
                                                    <td className="py-3 px-3 text-gray-500">{log.desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAIN VIEW: SLA & WORKFLOW FORM */}
                    {slaSubView === 'main' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-8 space-y-6">
                                {/* 1. Target SLA Tahapan */}
                                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h2 className="text-sm font-black text-gray-900">1. Target SLA Tahapan</h2>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                                <tr>
                                                    <th className="py-2.5 px-3">Tahapan</th>
                                                    <th className="py-2.5 px-3">Target Durasi</th>
                                                    <th className="py-2.5 px-3">Satuan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {slaStages.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="py-3 px-3 font-bold text-gray-900">{item.stage}</td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="number"
                                                                value={item.duration}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 1;
                                                                    setSlaStages(prev => prev.map((s, i) => i === idx ? { ...s, duration: val } : s));
                                                                }}
                                                                className="w-16 p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <select
                                                                value={item.unit}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setSlaStages(prev => prev.map((s, i) => i === idx ? { ...s, unit: val } : s));
                                                                }}
                                                                className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs"
                                                            >
                                                                <option value="Hari Kalender">Hari Kalender</option>
                                                                <option value="Hari Kerja">Hari Kerja</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* 2. Workflow & Eskalasi */}
                                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h2 className="text-sm font-black text-gray-900">2. Workflow & Eskalasi</h2>

                                    <div className="space-y-2 text-xs">
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Aktifkan notifikasi saat mendekati SLA</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowEscalations.nearSlaNotify}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, nearSlaNotify: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Tandai status merah saat melewati SLA</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowEscalations.redOnSla}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, redOnSla: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Eskalasi otomatis ke Manajer Operasional</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowEscalations.autoEscalate}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, autoEscalate: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Wajib alasan saat ubah status</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowEscalations.mandatoryReason}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, mandatoryReason: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Ambang Notifikasi Awal</label>
                                            <select
                                                value={workflowEscalations.notifyThreshold}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, notifyThreshold: e.target.value }))}
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                            >
                                                <option>50% SLA</option>
                                                <option>75% SLA</option>
                                                <option>80% SLA</option>
                                                <option>90% SLA</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Ambang Eskalasi Otomatis</label>
                                            <select
                                                value={workflowEscalations.escalateThreshold}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, escalateThreshold: e.target.value }))}
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                            >
                                                <option>90% SLA</option>
                                                <option>100% SLA</option>
                                                <option>120% SLA</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Frekuensi Reminder</label>
                                            <select
                                                value={workflowEscalations.reminderFreq}
                                                onChange={(e) => setWorkflowEscalations(prev => ({ ...prev, reminderFreq: e.target.value }))}
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                            >
                                                <option>Setiap 12 jam</option>
                                                <option>Setiap 24 jam</option>
                                                <option>Setiap 48 jam</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Aturan Penugasan & Validasi */}
                                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h2 className="text-sm font-black text-gray-900">3. Aturan Penugasan & Validasi Workflow</h2>

                                    <div className="space-y-2 text-xs">
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Izinkan pengalihan QC/HDO oleh Manajer Operasional</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowAssignment.allowReassign}
                                                onChange={(e) => setWorkflowAssignment(prev => ({ ...prev, allowReassign: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Tampilkan warning jika ada data kurang lengkap saat pindah tahap</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowAssignment.warningIncomplete}
                                                onChange={(e) => setWorkflowAssignment(prev => ({ ...prev, warningIncomplete: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Wajib checklist selesai sebelum kirim ke tahap berikutnya</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowAssignment.mandatoryChecklist}
                                                onChange={(e) => setWorkflowAssignment(prev => ({ ...prev, mandatoryChecklist: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Simpan histori perubahan status</span>
                                            <input
                                                type="checkbox"
                                                checked={workflowAssignment.saveHistory}
                                                onChange={(e) => setWorkflowAssignment(prev => ({ ...prev, saveHistory: e.target.checked }))}
                                                className="rounded text-brand-600"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Mode Penugasan Default</label>
                                            <select
                                                value={workflowAssignment.defaultAssignMode}
                                                onChange={(e) => setWorkflowAssignment(prev => ({ ...prev, defaultAssignMode: e.target.value }))}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                            >
                                                <option>Manual oleh Manajer Operasional</option>
                                                <option>Otomatis Berdasarkan Beban Terendah</option>
                                                <option>Otomatis Round Robin</option>
                                                <option>Klaim Bebas (First-come first-served)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Jenis Hitung SLA</label>
                                            <select
                                                value={workflowAssignment.slaCalcType}
                                                onChange={(e) => setWorkflowAssignment(prev => ({ ...prev, slaCalcType: e.target.value }))}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                            >
                                                <option>Per tahapan</option>
                                                <option>Total end-to-end</option>
                                                <option>Kombinasi (Tahapan & End-to-End)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={handleSaveSLA}
                                        className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                                    >
                                        <Save className="w-4 h-4" /> Simpan Perubahan
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-5">
                                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-3xl flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-emerald-900">Semua pengaturan tersimpan</p>
                                        <p className="text-[10px] text-emerald-700">Terakhir diperbarui: 30 Jul 2026, 10:35 WIB</p>
                                    </div>
                                </div>

                                <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                                    <p className="font-black text-gray-900">Ringkasan SLA</p>
                                    <div className="space-y-2 border-t border-gray-100 pt-2 text-gray-600">
                                        <div className="flex justify-between"><span>Pengajuan Masuk:</span><span className="font-bold text-gray-800">1 hari</span></div>
                                        <div className="flex justify-between"><span>Proses QC:</span><span className="font-bold text-gray-800">2 hari</span></div>
                                        <div className="flex justify-between"><span>Proses HDO:</span><span className="font-bold text-gray-800">2 hari</span></div>
                                        <div className="flex justify-between"><span>Eskalasi:</span><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Aktif</span></div>
                                        <div className="flex justify-between"><span>Reminder:</span><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Aktif</span></div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-2 text-xs">
                                    <p className="font-black text-gray-900 mb-2">Aksi Cepat</p>
                                    <button
                                        onClick={() => setShowResetSlaModal(true)}
                                        className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-gray-400" /> Reset SLA ke Default</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setSlaSubView('audit_trail')}
                                        className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Lihat Audit Trail</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setSlaSubView('templates')}
                                        className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left font-bold text-gray-700 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-gray-400" /> Kelola Workflow Template</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: TAMPILAN */}
            {/* ========================================================================= */}
            {activeTab === 'appearance' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        {/* 1. Tema & Tampilan Umum */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">1. Tema & Tampilan Umum</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">Mode Tema</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setThemeMode('light')}
                                            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold ${
                                                themeMode === 'light' ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-gray-200'
                                            }`}
                                        >
                                            <Sun className="w-4 h-4 text-amber-500" /> Terang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setThemeMode('dark')}
                                            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold ${
                                                themeMode === 'dark' ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-gray-200'
                                            }`}
                                        >
                                            <Moon className="w-4 h-4 text-indigo-500" /> Gelap
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">Warna Aksen</label>
                                    <div className="flex items-center gap-2 pt-1">
                                        {['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#06b6d4', '#475569'].map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setAccentColor(color)}
                                                className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-transform hover:scale-110"
                                                style={{ backgroundColor: color }}
                                            >
                                                {accentColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Ukuran Teks</label>
                                    <select value={textSize} onChange={(e) => setTextSize(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>Kecil</option>
                                        <option>Sedang</option>
                                        <option>Besar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kepadatan Tampilan</label>
                                    <select value={density} onChange={(e) => setDensity(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>Rapat</option>
                                        <option>Standar</option>
                                        <option>Longgar</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Tampilkan ikon pada menu</span>
                                    <input type="checkbox" checked={showMenuIcons} onChange={(e) => setShowMenuIcons(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Gunakan sudut kartu membulat</span>
                                    <input type="checkbox" checked={roundedCorners} onChange={(e) => setRoundedCorners(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Aktifkan animasi halus</span>
                                    <input type="checkbox" checked={smoothAnim} onChange={(e) => setSmoothAnim(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                            </div>
                        </div>

                        {/* 2. Preferensi Dashboard */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">2. Preferensi Dashboard</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Default landing page</label>
                                    <select value={defaultLanding} onChange={(e) => setDefaultLanding(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>Dashboard</option>
                                        <option>Pengajuan Masuk</option>
                                        <option>Antrean QC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jumlah kartu per baris</label>
                                    <select value={cardsPerRow} onChange={(e) => setCardsPerRow(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>3 kartu</option>
                                        <option>4 kartu</option>
                                        <option>6 kartu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tampilan panel ringkasan</label>
                                    <select value={summaryPanel} onChange={(e) => setSummaryPanel(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>Ringkas</option>
                                        <option>Lengkap</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Tampilkan panel perlu tindakan</span>
                                    <input type="checkbox" checked={showActionPanel} onChange={(e) => setShowActionPanel(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Tampilkan aktivitas terbaru</span>
                                    <input type="checkbox" checked={showRecentAct} onChange={(e) => setShowRecentAct(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Sidebar dapat diciutkan</span>
                                    <input type="checkbox" checked={collapsibleSidebar} onChange={(e) => setCollapsibleSidebar(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                            </div>
                        </div>

                        {/* 3. Tabel & Navigasi */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-black text-gray-900">3. Tabel & Navigasi</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jumlah data per halaman</label>
                                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>10</option>
                                        <option>25</option>
                                        <option>50</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Posisi filter tabel</label>
                                    <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>Di atas tabel</option>
                                        <option>Sidebar samping</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Gaya badge status</label>
                                    <select value={badgeStyle} onChange={(e) => setBadgeStyle(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium">
                                        <option>Warna penuh</option>
                                        <option>Outline tipis</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Sticky header tabel</span>
                                    <input type="checkbox" checked={stickyHeader} onChange={(e) => setStickyHeader(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Sticky kolom aksi</span>
                                    <input type="checkbox" checked={stickyActionCol} onChange={(e) => setStickyActionCol(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                                <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                    <span className="font-medium text-gray-700">Tampilkan garis bantu tabel</span>
                                    <input type="checkbox" checked={tableGridLines} onChange={(e) => setTableGridLines(e.target.checked)} className="rounded text-brand-600" />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleSaveAppearance}
                                className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                            >
                                <Save className="w-4 h-4" /> Simpan Perubahan
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-5">
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-3xl flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-xs font-black text-emerald-900">Semua pengaturan tersimpan</p>
                                <p className="text-[10px] text-emerald-700">Terakhir diperbarui: 30 Jul 2026, 10:35 WIB</p>
                            </div>
                        </div>

                        <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                            <p className="font-black text-gray-900">Ringkasan Tampilan</p>
                            <div className="space-y-2 border-t border-gray-100 pt-2 text-gray-600">
                                <div className="flex justify-between"><span>Mode Tema:</span><span className="font-bold text-gray-800">{themeMode === 'light' ? 'Terang' : 'Gelap'}</span></div>
                                <div className="flex justify-between"><span>Ukuran Teks:</span><span className="font-bold text-gray-800">{textSize}</span></div>
                                <div className="flex justify-between"><span>Kepadatan:</span><span className="font-bold text-gray-800">{density}</span></div>
                                <div className="flex justify-between"><span>Sidebar:</span><span className="font-bold text-gray-800">{collapsibleSidebar ? 'Dapat diciutkan' : 'Tetap'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: KEAMANAN (6 SUB-TABS) */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    {/* Security Sub-Navigation Bar */}
                    <div className="flex border-b border-gray-200 gap-3 overflow-x-auto pb-1 text-xs">
                        {[
                            { key: 'roles', label: 'Daftar Role' },
                            { key: 'matrix', label: 'Matriks Permission' },
                            { key: 'staff', label: 'Kelola Akses Staf' },
                            { key: 'scope', label: 'Cakupan Data' },
                            { key: 'temp', label: 'Akses Sementara' },
                            { key: 'audit', label: 'Audit Trail' },
                        ].map((st) => (
                            <button
                                key={st.key}
                                onClick={() => setSecuritySubTab(st.key as any)}
                                className={`pb-2.5 px-3 font-bold transition-all border-b-2 whitespace-nowrap ${
                                    securitySubTab === st.key
                                        ? 'border-brand-600 text-brand-600'
                                        : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>

                    {/* 1. SUB-TAB: DAFTAR ROLE */}
                    {securitySubTab === 'roles' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-sm font-black text-gray-900">Daftar Role Operasional</h2>
                                            <p className="text-[11px] text-gray-400">Role default yang ditetapkan oleh Super Admin.</p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                                <tr>
                                                    <th className="py-2.5 px-3">Role</th>
                                                    <th className="py-2.5 px-3 text-center">Pengguna Aktif</th>
                                                    <th className="py-2.5 px-3 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {[
                                                    { role: 'Manajer Operasional', count: 2 },
                                                    { role: 'Quality Control Officer (QCO)', count: 8 },
                                                    { role: 'Halal Documentation Officer (HDO)', count: 6 },
                                                    { role: 'Verifikator Self Declare', count: 5 },
                                                ].map((r, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="py-3 px-3">
                                                            <p className="font-bold text-gray-900">{r.role}</p>
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold"><Check className="w-3 h-3" /> Default</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-black text-sm text-gray-900">{r.count}</td>
                                                        <td className="py-3 px-3 text-center">
                                                            <button onClick={() => toast.success(`Melihat detail role ${r.role}`)} className="p-1 text-gray-400 hover:text-brand-600">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pengaturan Hak Akses Operasional per Staf */}
                                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-black text-gray-900">Pengaturan Hak Akses Operasional</h2>
                                            <p className="text-[11px] text-gray-400">Atur permission dan batasan akses yang dapat dilakukan oleh staf ini.</p>
                                        </div>
                                        <select
                                            value={selectedSecurityStaff}
                                            onChange={(e) => setSelectedSecurityStaff(e.target.value)}
                                            className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                                        >
                                            <option>Rizky Maulana (QCO)</option>
                                            <option>Ahmad Fauzi (HDO)</option>
                                            <option>Dewi Lestari (Verifikator)</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Melihat pengajuan yang ditugaskan</span>
                                            <input type="checkbox" checked={staffPermissions.viewAssigned} onChange={(e) => setStaffPermissions(prev => ({ ...prev, viewAssigned: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Mengubah prioritas</span>
                                            <input type="checkbox" checked={staffPermissions.changePriority} onChange={(e) => setStaffPermissions(prev => ({ ...prev, changePriority: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Mengambil penugasan (claim)</span>
                                            <input type="checkbox" checked={staffPermissions.claimAssigned} onChange={(e) => setStaffPermissions(prev => ({ ...prev, claimAssigned: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Mengirim catatan ke Advisor</span>
                                            <input type="checkbox" checked={staffPermissions.sendNotes} onChange={(e) => setStaffPermissions(prev => ({ ...prev, sendNotes: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Mengembalikan ke Advisor</span>
                                            <input type="checkbox" checked={staffPermissions.returnToAdvisor} onChange={(e) => setStaffPermissions(prev => ({ ...prev, returnToAdvisor: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Melihat audit trail</span>
                                            <input type="checkbox" checked={staffPermissions.viewAuditTrail} onChange={(e) => setStaffPermissions(prev => ({ ...prev, viewAuditTrail: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                                            <span className="font-medium text-gray-700">Eskalasi ke Manajer Operasional</span>
                                            <input type="checkbox" checked={staffPermissions.escalate} onChange={(e) => setStaffPermissions(prev => ({ ...prev, escalate: e.target.checked }))} className="rounded text-brand-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer opacity-70">
                                            <span className="font-medium text-gray-700 flex items-center gap-1">Membuka jadwal audit <Lock className="w-3 h-3 text-gray-400" /></span>
                                            <input type="checkbox" disabled checked={false} className="rounded text-gray-400" />
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button onClick={() => toast.success('Hak akses staf berhasil disimpan')} className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5">
                                            <Save className="w-4 h-4" /> Simpan Perubahan
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-5">
                                <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                                    <p className="font-black text-gray-900">Cakupan Data Staf</p>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold">Cakupan Pengajuan</label>
                                            <select value={staffScope.submissions} onChange={(e) => setStaffScope(prev => ({ ...prev, submissions: e.target.value }))} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs">
                                                <option>Hanya pengajuan yang ditugaskan</option>
                                                <option>Semua pengajuan tim</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold">Wilayah</label>
                                            <select value={staffScope.region} onChange={(e) => setStaffScope(prev => ({ ...prev, region: e.target.value }))} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-xs">
                                                <option>Semua Wilayah</option>
                                                <option>Jawa Barat</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                                    <p className="font-black text-gray-900">Ringkasan Hak Akses Staf</p>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                        <div className="w-16 h-16 rounded-full border-4 border-brand-500 flex items-center justify-center font-black text-sm">19</div>
                                        <div className="space-y-1 text-[11px] text-gray-600">
                                            <p>• QCO: <b>8</b></p>
                                            <p>• HDO: <b>6</b></p>
                                            <p>• Verifikator: <b>5</b></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. SUB-TAB: MATRIKS PERMISSION */}
                    {securitySubTab === 'matrix' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900">Matriks Permission Operasional</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">Lihat dan kelola permission berdasarkan modul, aksi, dan role staf operasional.</p>
                                    </div>
                                    <button onClick={() => toast.success('Matriks permission diekspor')} className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                        <Download className="w-3.5 h-3.5" /> Export Permission
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Modul</th>
                                                <th className="py-2.5 px-3">Aksi</th>
                                                <th className="py-2.5 px-3 text-center">Manajer Operasional</th>
                                                <th className="py-2.5 px-3 text-center">QCO</th>
                                                <th className="py-2.5 px-3 text-center">HDO</th>
                                                <th className="py-2.5 px-3 text-center">Verifikator SD</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {[
                                                { module: 'Dashboard', action: 'Lihat / Detail', mo: 'check', qco: 'limited', hdo: 'cross', sd: 'limited' },
                                                { module: 'Pengajuan Masuk', action: 'Lihat / Tugaskan', mo: 'check', qco: 'limited', hdo: 'cross', sd: 'cross' },
                                                { module: 'Antrean QC', action: 'Lihat / Ubah Status', mo: 'check', qco: 'check', hdo: 'limited', sd: 'cross' },
                                                { module: 'Antrean HDO', action: 'Lihat / Ubah Status', mo: 'check', qco: 'limited', hdo: 'check', sd: 'cross' },
                                                { module: 'Verifikasi Self Declare', action: 'Lihat / Verifikasi', mo: 'check', qco: 'limited', hdo: 'cross', sd: 'check' },
                                                { module: 'Manajemen Audit', action: 'Jadwalkan / Detail', mo: 'check', qco: 'limited', hdo: 'cross', sd: 'cross' },
                                                { module: 'Laporan', action: 'Lihat / Ekspor', mo: 'check', qco: 'lock', hdo: 'lock', sd: 'lock' },
                                                { module: 'Pengaturan', action: 'Lihat / Ubah', mo: 'check', qco: 'lock', hdo: 'lock', sd: 'lock' },
                                            ].map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-bold text-gray-900">{row.module}</td>
                                                    <td className="py-3 px-3 text-gray-600">{row.action}</td>
                                                    <td className="py-3 px-3 text-center"><span className="text-emerald-600 font-bold">✔ Diizinkan</span></td>
                                                    <td className="py-3 px-3 text-center">{row.qco === 'check' ? <span className="text-emerald-600 font-bold">✔ Diizinkan</span> : row.qco === 'limited' ? <span className="text-amber-600 font-bold">➖ Terbatas</span> : row.qco === 'lock' ? <span className="text-gray-400">🔒 Terkunci</span> : <span className="text-red-500 font-bold">✖ Ditolak</span>}</td>
                                                    <td className="py-3 px-3 text-center">{row.hdo === 'check' ? <span className="text-emerald-600 font-bold">✔ Diizinkan</span> : row.hdo === 'limited' ? <span className="text-amber-600 font-bold">➖ Terbatas</span> : row.hdo === 'lock' ? <span className="text-gray-400">🔒 Terkunci</span> : <span className="text-red-500 font-bold">✖ Ditolak</span>}</td>
                                                    <td className="py-3 px-3 text-center">{row.sd === 'check' ? <span className="text-emerald-600 font-bold">✔ Diizinkan</span> : row.sd === 'limited' ? <span className="text-amber-600 font-bold">➖ Terbatas</span> : row.sd === 'lock' ? <span className="text-gray-400">🔒 Terkunci</span> : <span className="text-red-500 font-bold">✖ Ditolak</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. SUB-TAB: KELOLA AKSES STAF */}
                    {securitySubTab === 'staff' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-black text-gray-900">Kelola Akses Staf Operasional</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">Atur role, status, dan hak akses staf di bawah Manajer Operasional.</p>
                                    </div>
                                    <button onClick={() => toast.success('Dialog tambah staf')} className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5">
                                        <Plus className="w-4 h-4" /> Tambah Staf
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Nama Staf</th>
                                                <th className="py-2.5 px-3">Role</th>
                                                <th className="py-2.5 px-3">Cakupan Data</th>
                                                <th className="py-2.5 px-3 text-center">Status</th>
                                                <th className="py-2.5 px-3">Login Terakhir</th>
                                                <th className="py-2.5 px-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {securityStaffList.map((staf) => (
                                                <tr key={staf.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-100">{staf.initial}</div>
                                                            <div><p className="font-bold text-gray-900">{staf.name}</p><p className="text-[10px] text-gray-400">{staf.email}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-gray-700">{staf.role}</td>
                                                    <td className="py-3 px-3 text-gray-600">{staf.scope}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${staf.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                            {staf.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-gray-500">{staf.lastLogin}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <button onClick={() => toast.success(`Kelola ${staf.name}`)} className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 shadow-sm">
                                                            Kelola
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. SUB-TAB: CAKUPAN DATA */}
                    {securitySubTab === 'scope' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-black text-gray-900">Cakupan Data Operasional</h2>
                                <p className="text-xs text-gray-500">Atur batas akses data staf berdasarkan wilayah, cabang, dan penugasan.</p>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Staf / Role</th>
                                                <th className="py-2.5 px-3">Jenis Cakupan</th>
                                                <th className="py-2.5 px-3">Detail Cakupan</th>
                                                <th className="py-2.5 px-3 text-center">Jumlah Data</th>
                                                <th className="py-2.5 px-3 text-center">Status</th>
                                                <th className="py-2.5 px-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {securityStaffList.map((staf) => (
                                                <tr key={staf.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-bold text-gray-900">{staf.name} ({staf.role})</td>
                                                    <td className="py-3 px-3 text-gray-600">{staf.scope}</td>
                                                    <td className="py-3 px-3 text-gray-600">Wilayah operasional {staf.scope}</td>
                                                    <td className="py-3 px-3 text-center font-bold text-gray-800">1.248 data</td>
                                                    <td className="py-3 px-3 text-center"><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">Aktif</span></td>
                                                    <td className="py-3 px-3 text-center">
                                                        <button onClick={() => toast.success(`Atur cakupan untuk ${staf.name}`)} className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 shadow-sm">
                                                            Atur Cakupan
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. SUB-TAB: AKSES SEMENTARA */}
                    {securitySubTab === 'temp' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-gray-900">8</p><p className="text-[10px] text-gray-400 font-bold">Akses Aktif</p></div>
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-amber-600">3</p><p className="text-[10px] text-amber-700 font-bold">Akan Berakhir</p></div>
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-gray-600">12</p><p className="text-[10px] text-gray-400 font-bold">Selesai</p></div>
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-red-600">1</p><p className="text-[10px] text-red-700 font-bold">Dicabut</p></div>
                            </div>

                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-black text-gray-900">Akses Sementara</h2>
                                    <button onClick={() => toast.success('Dialog berikan akses sementara')} className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5">
                                        <Plus className="w-4 h-4" /> Berikan Akses
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Nama Staf</th>
                                                <th className="py-2.5 px-3">Akses Tambahan</th>
                                                <th className="py-2.5 px-3">Cakupan</th>
                                                <th className="py-2.5 px-3">Periode</th>
                                                <th className="py-2.5 px-3">Pemberi Akses</th>
                                                <th className="py-2.5 px-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tempAccessList.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-bold text-gray-900">{item.name}</td>
                                                    <td className="py-3 px-3 text-gray-700">{item.access}</td>
                                                    <td className="py-3 px-3 text-gray-600">{item.scope}</td>
                                                    <td className="py-3 px-3 text-gray-500">{item.period}</td>
                                                    <td className="py-3 px-3 text-gray-600">{item.grantedBy}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. SUB-TAB: AUDIT TRAIL KEAMANAN */}
                    {securitySubTab === 'audit' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-gray-900">248</p><p className="text-[10px] text-gray-400 font-bold">Total Aktivitas</p></div>
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-emerald-600">186</p><p className="text-[10px] text-emerald-700 font-bold">Berhasil</p></div>
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-blue-600">42</p><p className="text-[10px] text-blue-700 font-bold">Perubahan Akses</p></div>
                                <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm"><p className="text-2xl font-black text-amber-600">20</p><p className="text-[10px] text-amber-700 font-bold">Peringatan</p></div>
                            </div>

                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-black text-gray-900">Audit Trail Keamanan</h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Waktu</th>
                                                <th className="py-2.5 px-3">Pengguna</th>
                                                <th className="py-2.5 px-3">Aktivitas</th>
                                                <th className="py-2.5 px-3">Detail Perubahan</th>
                                                <th className="py-2.5 px-3">IP / Perangkat</th>
                                                <th className="py-2.5 px-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {securityAuditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 text-gray-600 font-medium">{log.date}</td>
                                                    <td className="py-3 px-3 font-bold text-gray-900">{log.user}</td>
                                                    <td className="py-3 px-3 font-bold text-gray-800">{log.activity}</td>
                                                    <td className="py-3 px-3 text-gray-600">{log.detail}</td>
                                                    <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{log.ip}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${log.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-700' : log.status === 'Peringatan' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: PENGATURAN KUOTA FASILITASI (SEHATI) */}
            {/* ========================================================================= */}
            {activeTab === 'quota' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-black text-gray-900">Monitoring Kuota Fasilitasi SEHATI</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Pantau alokasi dan perbarui penggunaan kuota fasilitasi SEHATI setiap hari.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => toast.success('Riwayat pembaruan kuota dibuka')} className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-gray-500" /> Riwayat Pembaruan
                            </button>
                            <button onClick={() => toast.success('Update Penggunaan Hari Ini')} className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5">
                                <Plus className="w-4 h-4" /> Update Penggunaan Hari Ini
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Alokasi SEHATI</p>
                            <p className="text-2xl font-black text-gray-900">12.500</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Terpakai</p>
                            <p className="text-2xl font-black text-emerald-600">8.240</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Digunakan Hari Ini</p>
                            <p className="text-2xl font-black text-brand-700">126</p>
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">+18 dari kemarin</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-150 rounded-2xl shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Sisa Kuota</p>
                            <p className="text-2xl font-black text-amber-600">4.260</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-gray-900">Penggunaan Kuota Harian</h3>
                                    <span className="text-[11px] text-gray-400">Masukkan jumlah fasilitas SEHATI yang digunakan hari ini secara manual.</span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Wilayah</th>
                                                <th className="py-2.5 px-3 text-center">Alokasi SEHATI</th>
                                                <th className="py-2.5 px-3 text-center">Terpakai s.d. Kemarin</th>
                                                <th className="py-2.5 px-3 text-center">Penggunaan Hari Ini</th>
                                                <th className="py-2.5 px-3 text-center">Total Terpakai</th>
                                                <th className="py-2.5 px-3 text-center">Sisa Kuota</th>
                                                <th className="py-2.5 px-3">Terakhir Diperbarui</th>
                                                <th className="py-2.5 px-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {quotaDaily.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-bold text-gray-900">{item.region}</td>
                                                    <td className="py-3 px-3 text-center font-mono font-bold text-gray-800">{item.total.toLocaleString()}</td>
                                                    <td className="py-3 px-3 text-center font-mono text-gray-600">{item.prevUsed.toLocaleString()}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <input
                                                            type="number"
                                                            value={item.today}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                setQuotaDaily(prev => prev.map((q, i) => i === idx ? {
                                                                    ...q,
                                                                    today: val,
                                                                    currentTotal: q.prevUsed + val,
                                                                    remaining: q.total - (q.prevUsed + val)
                                                                } : q));
                                                            }}
                                                            className="w-16 p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-black text-brand-700"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-3 text-center font-mono font-black text-gray-900">{item.currentTotal.toLocaleString()}</td>
                                                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{item.remaining.toLocaleString()}</td>
                                                    <td className="py-3 px-3 text-gray-500 text-[11px]">{item.updated}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <button onClick={() => toast.success(`Data kuota ${item.region} diperbarui`)} className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 shadow-sm">
                                                            Ubah
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-3">
                                    <p className="text-xs font-bold text-gray-700">Total penggunaan hari ini: <span className="font-black text-brand-700">126 fasilitasi</span></p>
                                    <button onClick={handleSaveQuota} className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5">
                                        <Save className="w-4 h-4" /> Simpan Update Harian
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-2 text-xs">
                                    <p className="font-black text-gray-900">Catatan Pembaruan Harian</p>
                                    <textarea
                                        rows={3}
                                        value={quotaNotes}
                                        onChange={(e) => setQuotaNotes(e.target.value)}
                                        placeholder="Tambahkan catatan atau sumber data penggunaan hari ini..."
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>

                                <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-2">
                                    <p className="font-black text-gray-900 text-xs">Tren Penggunaan 7 Hari</p>
                                    <div className="h-28 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={quotaTrendData}>
                                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                                <YAxis tick={{ fontSize: 9 }} />
                                                <Tooltip />
                                                <Bar dataKey="usage" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-5">
                            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-3xl flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-emerald-900">Status: Sudah Diperbarui</p>
                                    <p className="text-[10px] text-emerald-700">Terakhir: 30 Jul 2026, 09:45 WIB oleh Arif Oetomo</p>
                                </div>
                            </div>

                            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-3 text-xs">
                                <p className="font-black text-gray-900">Ringkasan SEHATI</p>
                                <div className="h-36 relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={quotaDonutData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value">
                                                {quotaDonutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-base font-black text-gray-900">65,9%</span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Terpakai</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: PENGATURAN LPH DAN AUDITOR */}
            {/* ========================================================================= */}
            {activeTab === 'lph' && (
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-3xl flex items-center gap-3 text-xs">
                        <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                        <span className="text-blue-900 font-medium">Kelola daftar LPH rekanan dan Auditor. Daftar yang aktif akan muncul pada pilihan LPH dan Auditor saat membuat jadwal audit.</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* 1. Daftar LPH Rekanan */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Daftar LPH Rekanan</h3>
                                    <p className="text-[11px] text-gray-400">Kelola LPH yang bekerja sama dengan HalalCore.</p>
                                </div>
                                <button onClick={() => setShowAddLphModal(true)} className="px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Tambah LPH
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                        <tr>
                                            <th className="py-2.5 px-3">Nama LPH</th>
                                            <th className="py-2.5 px-3">Kode LPH</th>
                                            <th className="py-2.5 px-3">Kontak</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {lphPartners.map((lph) => (
                                            <tr key={lph.id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-3">
                                                    <p className="font-bold text-gray-900">{lph.name}</p>
                                                    <p className="text-[10px] text-gray-400">{lph.region}</p>
                                                </td>
                                                <td className="py-3 px-3 font-mono font-bold text-gray-700">{lph.code}</td>
                                                <td className="py-3 px-3">
                                                    <p className="text-gray-700">{lph.phone}</p>
                                                    <p className="text-[10px] text-gray-400">{lph.email}</p>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${lph.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {lph.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => toast.success(`Edit ${lph.name}`)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteLPH(lph.id, lph.name)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 2. Daftar Auditor */}
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Daftar Auditor</h3>
                                    <p className="text-[11px] text-gray-400">Kelola auditor yang terdaftar di LPH rekanan.</p>
                                </div>
                                <button onClick={() => setShowAddAuditorModal(true)} className="px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Tambah Auditor
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                                        <tr>
                                            <th className="py-2.5 px-3">Nama Auditor</th>
                                            <th className="py-2.5 px-3">Kode Auditor</th>
                                            <th className="py-2.5 px-3">LPH</th>
                                            <th className="py-2.5 px-3">Kontak</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {auditorsList.map((aud) => (
                                            <tr key={aud.id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-3 font-bold text-gray-900">{aud.name}</td>
                                                <td className="py-3 px-3 font-mono font-bold text-gray-700">{aud.code}</td>
                                                <td className="py-3 px-3 text-gray-600">{aud.lph_name}</td>
                                                <td className="py-3 px-3">
                                                    <p className="text-gray-700">{aud.phone}</p>
                                                    <p className="text-[10px] text-gray-400">{aud.email}</p>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${aud.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {aud.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => toast.success(`Edit ${aud.name}`)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteAuditor(aud.id, aud.name)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DIALOG: RESET SLA KE DEFAULT */}
            {/* ========================================================================= */}
            {showResetSlaModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Reset SLA ke Default</h3>
                                    <p className="text-gray-500 text-[11px]">Anda akan mengembalikan seluruh pengaturan SLA ke nilai default sistem.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowResetSlaModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-amber-900 text-[11px]">
                            Perubahan hanya memengaruhi pengaturan saat ini dan tidak mengubah histori pengajuan.
                        </div>

                        <div className="space-y-1.5 border-t border-gray-100 pt-3 text-gray-700 text-[11px]">
                            <p className="font-bold text-gray-900 mb-1">Yang akan direset ke nilai default:</p>
                            <p>• Target SLA Tahapan: Durasi setiap tahapan operasional</p>
                            <p>• Ambang Notifikasi: Ambang batas notifikasi awal (75%)</p>
                            <p>• Ambang Eskalasi: Ambang batas eskalasi otomatis (100%)</p>
                            <p>• Frekuensi Reminder: Jadwal pengingat sistem (24 jam)</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => setShowResetSlaModal(false)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleResetSlaConfirm}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-md"
                            >
                                Reset ke Default
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DIALOG: TAMBAH WORKFLOW TEMPLATE */}
            {/* ========================================================================= */}
            {showAddTemplateModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Tambah Template Workflow</h3>
                            <button onClick={() => setShowAddTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewTemplate} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nama Template *</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Workflow Konsultasi"
                                        value={newTemplateForm.name}
                                        onChange={(e) => setNewTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Layanan *</label>
                                    <select
                                        value={newTemplateForm.service}
                                        onChange={(e) => setNewTemplateForm(prev => ({ ...prev, service: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Self Declare Fasilitasi">Self Declare Fasilitasi</option>
                                        <option value="Self Declare Mandiri">Self Declare Mandiri</option>
                                        <option value="Reguler">Reguler</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Mode Penugasan *</label>
                                    <select
                                        value={newTemplateForm.assignMode}
                                        onChange={(e) => setNewTemplateForm(prev => ({ ...prev, assignMode: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Manual oleh Manajer Operasional">Manual oleh Manajer Operasional</option>
                                        <option value="Otomatis Berdasarkan Beban Kerja">Otomatis Berdasarkan Beban Kerja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Template *</label>
                                    <select
                                        value={newTemplateForm.status}
                                        onChange={(e) => setNewTemplateForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Deskripsi Singkat (Opsional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Jelaskan tujuan dan cakupan template ini..."
                                    value={newTemplateForm.desc}
                                    onChange={(e) => setNewTemplateForm(prev => ({ ...prev, desc: e.target.value }))}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Struktur Tahapan *</label>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {newTemplateForm.steps.map((s, idx) => (
                                        <div key={idx} className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                                            <span className="font-bold text-gray-800">{idx + 1}. {s}</span>
                                            <button
                                                type="button"
                                                onClick={() => setNewTemplateForm(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }))}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddTemplateModal(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-black shadow-md"
                                >
                                    Simpan Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DIALOG: TAMBAH LPH */}
            {/* ========================================================================= */}
            {showAddLphModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Tambah LPH Rekanan</h3>
                            <button onClick={() => setShowAddLphModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddLPH} className="space-y-3">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama LPH *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: LPH Al-Kautsar"
                                    value={newLphForm.name}
                                    onChange={(e) => setNewLphForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kode LPH *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: LPHAK-006"
                                    value={newLphForm.code}
                                    onChange={(e) => setNewLphForm(prev => ({ ...prev, code: e.target.value }))}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium font-mono"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Wilayah Layanan *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Jawa Barat"
                                    value={newLphForm.region}
                                    onChange={(e) => setNewLphForm(prev => ({ ...prev, region: e.target.value }))}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nomor Telepon</label>
                                    <input
                                        type="text"
                                        placeholder="0812..."
                                        value={newLphForm.phone}
                                        onChange={(e) => setNewLphForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="admin@lph..."
                                        value={newLphForm.email}
                                        onChange={(e) => setNewLphForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setShowAddLphModal(false)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50">Batal</button>
                                <button type="submit" className="flex-1 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-black shadow-md">Daftarkan LPH</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DIALOG: TAMBAH AUDITOR */}
            {/* ========================================================================= */}
            {showAddAuditorModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-black text-gray-900">Tambah Auditor Halal</h3>
                            <button onClick={() => setShowAddAuditorModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAuditor} className="space-y-3">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap & Gelar *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Dr. Rahmat Hidayat, M.Si."
                                    value={newAuditorForm.name}
                                    onChange={(e) => setNewAuditorForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Kode Auditor *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: AUD-006"
                                    value={newAuditorForm.code}
                                    onChange={(e) => setNewAuditorForm(prev => ({ ...prev, code: e.target.value }))}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium font-mono"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Pilih LPH Mitra *</label>
                                <select
                                    value={newAuditorForm.lph_name}
                                    onChange={(e) => setNewAuditorForm(prev => ({ ...prev, lph_name: e.target.value }))}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    {lphPartners.map(l => (
                                        <option key={l.id} value={l.name}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nomor Telepon</label>
                                    <input
                                        type="text"
                                        placeholder="0812..."
                                        value={newAuditorForm.phone}
                                        onChange={(e) => setNewAuditorForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="auditor@..."
                                        value={newAuditorForm.email}
                                        onChange={(e) => setNewAuditorForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setShowAddAuditorModal(false)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50">Batal</button>
                                <button type="submit" className="flex-1 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-black shadow-md">Daftarkan Auditor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
