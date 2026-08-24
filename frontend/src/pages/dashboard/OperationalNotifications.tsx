import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    FileText,
    Search,
    Calendar,
    RotateCcw,
    Eye,
    Briefcase,
    ShieldCheck,
    CheckCheck,
    Clock,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../services/notificationService';

interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    isRead: boolean;
    type: 'submission' | 'qc' | 'hdo' | 'self_declare' | 'audit' | 'returned' | 'done' | 'sla';
    no: string;
    businessName: string;
    serviceType: string;
    date: string;
    advisor: string;
    systemNote: string;
}

const INITIAL_NOTIFS: NotificationItem[] = [
    {
        id: '1',
        title: 'Pengajuan baru diterima',
        description: 'Pengajuan HC-2607-00248 a.n Dapoer Zuhra telah diterima dan masuk ke proses QC.',
        time: '10:23 WIB',
        isRead: false,
        type: 'submission',
        no: 'HC-2607-00248',
        businessName: 'Dapoer Zuhra',
        serviceType: 'Self Declare Fasilitasi',
        date: '30 Jul 2026 10:23 WIB',
        advisor: 'Siti Aisyah (HA-0123)',
        systemNote: 'Silakan lakukan pemeriksaan kelengkapan data dan dokumen sesuai checklist QC.',
    },
    {
        id: '2',
        title: 'Tugas QC baru',
        description: 'Pengajuan HC-2607-00247 a.n Kenangan Bakery telah ditugaskan ke Anda untuk pemeriksaan QC.',
        time: '09:58 WIB',
        isRead: false,
        type: 'qc',
        no: 'HC-2607-00247',
        businessName: 'Kenangan Bakery',
        serviceType: 'Reguler',
        date: '30 Jul 2026 09:58 WIB',
        advisor: 'Ahmad Fauzi (HA-0098)',
        systemNote: 'Pengajuan reguler memerlukan verifikasi kelayakan dokumen dan SOP produksi halal.',
    },
    {
        id: '3',
        title: 'Tugas HDO baru',
        description: 'Pengajuan HC-2607-00246 a.n Alam Segar Juice telah ditugaskan ke Anda untuk penyusunan dokumen.',
        time: '09:41 WIB',
        isRead: false,
        type: 'hdo',
        no: 'HC-2607-00246',
        businessName: 'Alam Segar Juice',
        serviceType: 'Self Declare Mandiri',
        date: '30 Jul 2026 09:41 WIB',
        advisor: 'Dewi Sartika (HA-0156)',
        systemNote: 'Lakukan penyusunan manual SJPH dan kelengkapan bahan sebelum sinkronisasi SIHALAL.',
    },
    {
        id: '4',
        title: 'Verifikasi Self Declare',
        description: 'Pengajuan HC-2607-00244 a.n Sari Kue Tradisi telah siap diverifikasi oleh Verifikator Self Declare.',
        time: '09:21 WIB',
        isRead: false,
        type: 'self_declare',
        no: 'HC-2607-00244',
        businessName: 'Sari Kue Tradisi',
        serviceType: 'Self Declare Fasilitasi',
        date: '30 Jul 2026 09:21 WIB',
        advisor: 'Siti Aisyah (HA-0123)',
        systemNote: 'Verifikasi lapangan telah dijadwalkan bersama pelaku usaha.',
    },
];

export default function OperationalNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFS);
    const [filterCategory, setFilterCategory] = useState<string>('Semua');
    const [filterStatus, setFilterStatus] = useState<string>('Semua');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationService.getNotifications({ limit: 50 });
            if (res?.data && res.data.length > 0) {
                const mapped: NotificationItem[] = res.data.map((n: Notification, idx: number) => {
                    let nType: NotificationItem['type'] = 'submission';
                    if (n.type?.includes('QC') || n.title.includes('QC')) nType = 'qc';
                    else if (n.type?.includes('DRAFTER') || n.title.includes('HDO')) nType = 'hdo';
                    else if (n.title.includes('Audit')) nType = 'audit';
                    else if (n.title.includes('Kembali')) nType = 'returned';

                    return {
                        id: n.id || String(idx + 1),
                        title: n.title,
                        description: n.message,
                        time: new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
                        isRead: n.is_read,
                        type: nType,
                        no: `HC-${n.id?.substring(0, 8) || '2607-001'}`,
                        businessName: 'Pelaku Usaha',
                        serviceType: 'Sertifikasi Halal',
                        date: new Date(n.created_at).toLocaleDateString('id-ID'),
                        advisor: 'Halal Advisor',
                        systemNote: n.message,
                    };
                });
                setNotifications(mapped);
            }
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
        } catch (_) {}
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        toast.success('Notifikasi ditandai sudah dibaca.');
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
        } catch (_) {}
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('Semua notifikasi berhasil ditandai sudah dibaca.');
    };

    const handleActionNavigate = (item: NotificationItem) => {
        markAsRead(item.id);
        switch (item.type) {
            case 'qc':
                navigate('/dashboard/operasional/antrean-qc');
                break;
            case 'hdo':
                navigate('/dashboard/operasional/antrean-hdo');
                break;
            case 'self_declare':
                navigate('/dashboard/operasional/self-declare');
                break;
            case 'audit':
                navigate('/dashboard/operasional/audit-management');
                break;
            default:
                navigate('/dashboard/operasional/pengajuan-masuk');
                break;
        }
    };

    const filteredNotifications = notifications.filter(item => {
        const matchesCategory =
            filterCategory === 'Semua' ||
            (filterCategory === 'Pengajuan Baru' && item.type === 'submission') ||
            (filterCategory === 'QC & Review' && (item.type === 'qc' || item.type === 'returned')) ||
            (filterCategory === 'HDO & Dokumen' && item.type === 'hdo') ||
            (filterCategory === 'Self Declare' && item.type === 'self_declare') ||
            (filterCategory === 'Audit' && item.type === 'audit');

        const matchesStatus =
            filterStatus === 'Semua' ||
            (filterStatus === 'Belum Dibaca' && !item.isRead) ||
            (filterStatus === 'Sudah Dibaca' && item.isRead);

        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.no.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesStatus && matchesSearch;
    });

    const getIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'submission':
                return <FileText className="w-4 h-4 text-emerald-600" />;
            case 'qc':
                return <ShieldCheck className="w-4 h-4 text-blue-600" />;
            case 'hdo':
                return <Briefcase className="w-4 h-4 text-indigo-600" />;
            case 'self_declare':
                return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
            case 'audit':
                return <Calendar className="w-4 h-4 text-amber-600" />;
            case 'returned':
                return <RotateCcw className="w-4 h-4 text-rose-600" />;
            case 'done':
                return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            case 'sla':
                return <Clock className="w-4 h-4 text-red-600" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notifikasi & Aktivitas</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Pemberitahuan berkas masuk, penugasan, batas waktu SLA, dan riwayat tindakan operasional.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadNotifications}
                        className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} /> Refresh
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-brand-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca ({unreadCount})
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari notifikasi, nomor registrasi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                        >
                            <option value="Semua">Semua Kategori</option>
                            <option value="Pengajuan Baru">Pengajuan Baru</option>
                            <option value="QC & Review">QC & Review</option>
                            <option value="HDO & Dokumen">HDO & Dokumen</option>
                            <option value="Self Declare">Self Declare</option>
                            <option value="Audit">Audit</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                        >
                            <option value="Semua">Semua Status</option>
                            <option value="Belum Dibaca">Belum Dibaca</option>
                            <option value="Sudah Dibaca">Sudah Dibaca</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notification List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-gray-150 rounded-3xl shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-700">Tidak ada notifikasi</p>
                        <p className="text-xs text-gray-400 mt-0.5">Semua tugas dan pemberitahuan operasional sudah terselesaikan.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                notif.isRead
                                    ? 'bg-white border-gray-150 hover:border-gray-200 shadow-sm'
                                    : 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    notif.isRead ? 'bg-gray-100' : 'bg-white border border-emerald-200 shadow-sm'
                                }`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-gray-900">{notif.title}</h3>
                                        {!notif.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        )}
                                        <span className="text-[10px] text-gray-400 font-medium">• {notif.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium">{notif.description}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{notif.systemNote}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {!notif.isRead && (
                                    <button
                                        onClick={() => markAsRead(notif.id)}
                                        className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-sm"
                                    >
                                        Tandai Dibaca
                                    </button>
                                )}
                                <button
                                    onClick={() => handleActionNavigate(notif)}
                                    className="px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1"
                                >
                                    <Eye className="w-3.5 h-3.5" /> Buka Berkas
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
