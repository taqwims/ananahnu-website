import { useState, useEffect } from 'react';
import {
    Search,
    RotateCcw,
    Download,
    ChevronLeft,
    ChevronRight,
    Send,
    AlertCircle,
    CheckCircle2,
    Clock,
    UserCheck,
    Award,
    Gavel,
    RefreshCw,
    X,
    UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../services/operationalService';
import type { User } from '../../types';

interface SDItem {
    id: string;
    no: string;
    sihalalNo: string;
    businessName: string;
    ownerName: string;
    verifikator: string;
    advisor: string;
    fundingType: 'Fasilitasi BPJPH' | 'Mandiri';
    status: 'Menunggu Verifikasi' | 'Sedang Diverifikasi' | 'Perlu Perbaikan' | 'Menunggu Perbaikan Pelaku Usaha' | 'Lolos Verifikasi' | 'Menunggu Penetapan Halal';
    processPosition: string;
    processAge: string;
    slaDays: string;
    slaPercentage: string;
    actionType: string;
}

const INITIAL_SD_DATA: SDItem[] = [
    {
        id: '1',
        no: 'HC-2607-00421',
        sihalalNo: 'SH-2607-1123',
        businessName: 'Dapur Berkah Sejahtera',
        ownerName: 'Siti Aisyah',
        verifikator: 'Ayu Lestari',
        advisor: 'Dewi Sartika',
        fundingType: 'Fasilitasi BPJPH',
        status: 'Menunggu Verifikasi',
        processPosition: 'Review Dokumen',
        processAge: '1 hari',
        slaDays: '2 hari',
        slaPercentage: '(50%)',
        actionType: 'Kirim Pengingat',
    },
    {
        id: '2',
        no: 'HC-2607-00418',
        sihalalNo: 'SH-2607-1118',
        businessName: 'PT Pangan Nusantara',
        ownerName: 'Rizky Fadlan',
        verifikator: 'Hendra Pratama',
        advisor: 'Ahmad Fauzi',
        fundingType: 'Mandiri',
        status: 'Sedang Diverifikasi',
        processPosition: 'Follow Up Pelaku Usaha',
        processAge: '2 hari',
        slaDays: '3 hari',
        slaPercentage: '(75%)',
        actionType: 'Review Ulang',
    },
    {
        id: '3',
        no: 'HC-2607-00412',
        sihalalNo: 'SH-2607-1112',
        businessName: 'Teh Hijau Lestari',
        ownerName: 'Dewi Sartika',
        verifikator: 'Ayu Lestari',
        advisor: 'Dimas Fajar',
        fundingType: 'Fasilitasi BPJPH',
        status: 'Menunggu Perbaikan Pelaku Usaha',
        processPosition: 'Perbaikan Komposisi Bahan',
        processAge: '3 hari',
        slaDays: '2 hari',
        slaPercentage: '(120%)',
        actionType: 'Hubungi Pelaku Usaha',
    },
    {
        id: '4',
        no: 'HC-2607-00405',
        sihalalNo: 'SH-2607-1105',
        businessName: 'Bakpia Khas Jogja',
        ownerName: 'Budi Santoso',
        verifikator: 'Hendra Pratama',
        advisor: 'Siti Aisyah',
        fundingType: 'Mandiri',
        status: 'Lolos Verifikasi',
        processPosition: 'Sidang Komite Fatwa',
        processAge: '4 hari',
        slaDays: '2 hari',
        slaPercentage: '(60%)',
        actionType: 'Kawal Sidang',
    },
];

export default function OperationalSelfDeclare() {
    const [sdData, setSdData] = useState<SDItem[]>(INITIAL_SD_DATA);
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'fasilitasi' | 'mandiri'>('fasilitasi');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [verifikatorFilter, setVerifikatorFilter] = useState('Semua');
    const [advisorFilter, setAdvisorFilter] = useState('Semua');

    // Reassign Verifikator Modal
    const [reassignModalItem, setReassignModalItem] = useState<SDItem | null>(null);
    const [targetVerifikator, setTargetVerifikator] = useState('');

    const loadSDData = async () => {
        try {
            setLoading(true);
            const [subsRes, staffRes] = await Promise.all([
                operationalService.getSubmissions({ service_type: 'SELF_DECLARE' }),
                operationalService.getStaffList()
            ]);

            if (staffRes && staffRes.length > 0) {
                setStaffList(staffRes);
                setTargetVerifikator(staffRes[0].full_name || staffRes[0].username || '');
            }

            if (subsRes?.data && subsRes.data.length > 0) {
                const mapped: SDItem[] = subsRes.data.map((s, idx) => {
                    const fType = s.self_declare_type === 'MANDIRI' ? 'Mandiri' : 'Fasilitasi BPJPH';
                    
                    let stat: SDItem['status'] = 'Menunggu Verifikasi';
                    if (s.status === 'VERVAL_PENDAMPING') stat = 'Sedang Diverifikasi';
                    else if (s.status === 'REVISION') stat = 'Perlu Perbaikan';
                    else if (s.status === 'REVISION_ADVISOR') stat = 'Menunggu Perbaikan Pelaku Usaha';
                    else if (s.status === 'SIDANG_FATWA') stat = 'Menunggu Penetapan Halal';
                    else if (s.status === 'SH_TERBIT') stat = 'Lolos Verifikasi';

                    return {
                        id: s.id || String(idx + 1),
                        no: s.tracking_number || `HC-${s.id?.substring(0, 8) || String(idx + 1)}`,
                        sihalalNo: s.sihal_number || `SH-2607-${1100 + idx}`,
                        businessName: s.client?.business_name || 'Pelaku Usaha',
                        ownerName: s.client?.client_name || 'Owner',
                        verifikator: s.assigned_drafter?.full_name || 'Ayu Lestari',
                        advisor: s.consultant?.full_name || 'Halal Advisor',
                        fundingType: fType,
                        status: stat,
                        processPosition: 'Review Lapangan & Verifikasi',
                        processAge: '2 hari',
                        slaDays: '3 hari',
                        slaPercentage: '(67%)',
                        actionType: 'Kirim Pengingat',
                    };
                });
                setSdData(mapped);
            }
        } catch (err) {
            console.error('Failed to load Self Declare data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSDData();
    }, []);

    const filteredData = sdData.filter(item => {
        const matchTab = activeTab === 'fasilitasi' ? item.fundingType === 'Fasilitasi BPJPH' : item.fundingType === 'Mandiri';
        const matchSearch = item.no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sihalalNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;
        const matchVerifikator = verifikatorFilter === 'Semua' || item.verifikator === verifikatorFilter;
        const matchAdvisor = advisorFilter === 'Semua' || item.advisor === advisorFilter;
        return matchTab && matchSearch && matchStatus && matchVerifikator && matchAdvisor;
    });

    const getStatusSDBadge = (status: string) => {
        switch (status) {
            case 'Menunggu Verifikasi':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Menunggu Verifikasi</span>;
            case 'Sedang Diverifikasi':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Sedang Diverifikasi</span>;
            case 'Perlu Perbaikan':
            case 'Menunggu Perbaikan Pelaku Usaha':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">{status}</span>;
            case 'Lolos Verifikasi':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Lolos Verifikasi</span>;
            case 'Menunggu Penetapan Halal':
                return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Menunggu Penetapan</span>;
            default:
                return null;
        }
    };

    const handleActionClick = (item: SDItem) => {
        toast.success(`Pengingat berhasil dikirimkan ke ${item.verifikator} dan pelaku usaha (${item.businessName}).`);
    };

    const handleReassignSubmit = async () => {
        if (!reassignModalItem) return;
        const staffObj = staffList.find(s => s.full_name === targetVerifikator || s.username === targetVerifikator) || staffList[0];
        try {
            if (staffObj) {
                await operationalService.assignSubmission(reassignModalItem.id, {
                    assignee_id: staffObj.id,
                    target_role: 'VERIFIKATOR',
                    notes: `Dialihkan ke ${targetVerifikator}`,
                });
            }
            setSdData(prev => prev.map(item => item.id === reassignModalItem.id ? { ...item, verifikator: targetVerifikator } : item));
            toast.success(`Verifikator berhasil dialihkan ke ${targetVerifikator}`);
            setReassignModalItem(null);
        } catch (err) {
            toast.error('Gagal mengalihkan verifikator');
        }
    };

    const handleExportCSV = () => {
        const headers = 'No,No Registrasi,No SIHALAL,Nama Usaha,Owner,Verifikator,Advisor,Skema,Status\n';
        const rows = filteredData.map((item, idx) => 
            `${idx + 1},${item.no},${item.sihalalNo},"${item.businessName}","${item.ownerName}","${item.verifikator}","${item.advisor}",${item.fundingType},${item.status}`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Self_Declare_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('File CSV berhasil diunduh.');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                        <span>Home</span>
                        <span>/</span>
                        <span className="text-gray-800 font-bold">Self Declare</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Manajemen Antrean Self Declare</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Pantau proses pengajuan halal skema Self Declare, verifikasi lapangan, dan kuota fasilitasi.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadSDData}
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

            {/* Sub-Tab Switching (Fasilitasi BPJPH vs Mandiri) */}
            <div className="flex border-b border-gray-200 text-sm font-bold">
                <button
                    onClick={() => setActiveTab('fasilitasi')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'fasilitasi'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Award className="w-4 h-4" />
                    <span>Fasilitasi BPJPH (SEHATI)</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-black">
                        {sdData.filter(i => i.fundingType === 'Fasilitasi BPJPH').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('mandiri')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'mandiri'
                            ? 'border-brand-700 text-brand-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <UserCheck className="w-4 h-4" />
                    <span>Self Declare Mandiri</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-black">
                        {sdData.filter(i => i.fundingType === 'Mandiri').length}
                    </span>
                </button>
            </div>

            {/* 6 KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                        <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Menunggu Verval</p>
                    <p className="text-xl font-black text-gray-900">{filteredData.filter(i => i.status === 'Menunggu Verifikasi').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                        <UserCheck className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Sedang Diverifikasi</p>
                    <p className="text-xl font-black text-gray-900">{filteredData.filter(i => i.status === 'Sedang Diverifikasi').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Perlu Perbaikan</p>
                    <p className="text-xl font-black text-gray-900">{filteredData.filter(i => i.status.includes('Perbaikan')).length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Lolos Verval</p>
                    <p className="text-xl font-black text-gray-900">{filteredData.filter(i => i.status === 'Lolos Verifikasi').length}</p>
                </div>

                <div className="p-3.5 bg-white border border-gray-150 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                        <Gavel className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500">Sidang Fatwa</p>
                    <p className="text-xl font-black text-gray-900">{filteredData.filter(i => i.status === 'Menunggu Penetapan Halal').length}</p>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                        <Award className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-800">Sertifikat Terbit</p>
                    <p className="text-xl font-black text-emerald-700">9</p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari no registrasi, nama usaha, pemilik..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('Semua');
                            setVerifikatorFilter('Semua');
                            setAdvisorFilter('Semua');
                        }}
                        className="px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-gray-500" /> Reset Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                            <option value="Sedang Diverifikasi">Sedang Diverifikasi</option>
                            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                            <option value="Lolos Verifikasi">Lolos Verifikasi</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Verifikator</label>
                        <select
                            value={verifikatorFilter}
                            onChange={(e) => setVerifikatorFilter(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                        >
                            <option value="Semua">Semua</option>
                            <option value="Ayu Lestari">Ayu Lestari</option>
                            <option value="Hendra Pratama">Hendra Pratama</option>
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
                            <option value="Dewi Sartika">Dewi Sartika</option>
                            <option value="Ahmad Fauzi">Ahmad Fauzi</option>
                            <option value="Siti Aisyah">Siti Aisyah</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-900">Daftar Pengajuan Self Declare</h2>
                    <span className="text-xs font-bold text-gray-400">{filteredData.length} data</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[9px] tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-3">No. Registrasi</th>
                                <th className="py-3 px-3">No. SIHALAL</th>
                                <th className="py-3 px-3">Nama Usaha / Pemilik</th>
                                <th className="py-3 px-3">Verifikator</th>
                                <th className="py-3 px-3">Halal Advisor</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3">Posisi Proses</th>
                                <th className="py-3 px-3">SLA</th>
                                <th className="py-3 px-3 text-center">Aksi / Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-3 font-mono font-bold text-gray-800">{item.no}</td>
                                    <td className="py-3 px-3 font-mono text-gray-600">{item.sihalalNo}</td>
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-gray-900">{item.businessName}</p>
                                        <p className="text-[10px] text-gray-400">{item.ownerName}</p>
                                    </td>
                                    <td className="py-3 px-3 font-bold text-gray-800">
                                        <button
                                            onClick={() => setReassignModalItem(item)}
                                            className="hover:text-brand-600 flex items-center gap-1"
                                            title="Klik untuk alihkan verifikator"
                                        >
                                            <span>{item.verifikator}</span>
                                            <UserPlus className="w-3 h-3 text-gray-400" />
                                        </button>
                                    </td>
                                    <td className="py-3 px-3 text-gray-600">{item.advisor}</td>
                                    <td className="py-3 px-3">{getStatusSDBadge(item.status)}</td>
                                    <td className="py-3 px-3 font-medium text-gray-700">{item.processPosition}</td>
                                    <td className="py-3 px-3">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                            {item.slaDays} {item.slaPercentage}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <button
                                            onClick={() => handleActionClick(item)}
                                            className="px-3 py-1 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 mx-auto"
                                        >
                                            <Send className="w-3 h-3" />
                                            <span>{item.actionType}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-3 text-xs text-gray-500">
                    <span>Menampilkan {filteredData.length} dari {sdData.length} data</span>
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

            {/* Modal: Alihkan Verifikator */}
            {reassignModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-gray-900">Alihkan Verifikator</h3>
                            <button onClick={() => setReassignModalItem(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-600">
                            Pilih verifikator baru untuk menangani <strong>{reassignModalItem.no}</strong> ({reassignModalItem.businessName}):
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Pilih Verifikator</label>
                            <select
                                value={targetVerifikator}
                                onChange={(e) => setTargetVerifikator(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                            >
                                {staffList.map(s => (
                                    <option key={s.id} value={s.full_name || s.username}>{s.full_name || s.username}</option>
                                ))}
                                {staffList.length === 0 && (
                                    <>
                                        <option value="Ayu Lestari">Ayu Lestari</option>
                                        <option value="Hendra Pratama">Hendra Pratama</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setReassignModalItem(null)}
                                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleReassignSubmit}
                                className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm"
                            >
                                Simpan Pengalihan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
