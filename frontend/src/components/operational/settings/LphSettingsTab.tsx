import React, { useState, useEffect } from 'react';
import {
    Plus,
    Building2,
    Users,
    Shuffle,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Trash2,
    Download,
    X,
    Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService, type LPHPartner, type AuditorPartner } from '../../../services/operationalService';

export function LphSettingsTab() {
    const [lphSubTab, setLphSubTab] = useState<'lph' | 'auditors' | 'rules'>('lph');
    const [lphSearchQuery, setLphSearchQuery] = useState('');
    const [lphRegionFilter, setLphRegionFilter] = useState('Semua Wilayah');
    const [lphPage, setLphPage] = useState(1);
    const lphPerPage = 5;

    const [lphPartners, setLphPartners] = useState<LPHPartner[]>([
        { id: '1', name: 'LPH Surveyor Indonesia', code: 'LPH-SI-001', region: 'Nasional', phone: '021-5265526', email: 'halal@ptsi.co.id', status: 'Aktif', active_auditors: 14, monthly_capacity: 120, active_assignments: 86 },
        { id: '2', name: 'LPH Sucofindo', code: 'LPH-SC-002', region: 'Nasional', phone: '021-7983666', email: 'halal@sucofindo.co.id', status: 'Aktif', active_auditors: 12, monthly_capacity: 100, active_assignments: 74 },
        { id: '3', name: 'LPH UIN Syarif Hidayatullah', code: 'LPH-UIN-003', region: 'Jabodetabek', phone: '021-7401925', email: 'lph@uinjkt.ac.id', status: 'Aktif', active_auditors: 8, monthly_capacity: 60, active_assignments: 41 },
        { id: '4', name: 'LPH Salman ITB', code: 'LPH-ITB-004', region: 'Jawa Barat', phone: '022-2504184', email: 'halal@salmanitb.com', status: 'Aktif', active_auditors: 7, monthly_capacity: 50, active_assignments: 38 },
        { id: '5', name: 'LPH Universitas Brawijaya', code: 'LPH-UB-005', region: 'Jawa Timur', phone: '0341-551611', email: 'lph@ub.ac.id', status: 'Aktif', active_auditors: 6, monthly_capacity: 45, active_assignments: 32 },
    ]);

    const [auditorsList, setAuditorsList] = useState<AuditorPartner[]>([
        { id: '1', name: 'Ahmad Fauzi, S.H.I.', code: 'AUD-001', lph_name: 'LPH Surveyor Indonesia', phone: '0812-1111-2222', email: 'ahmad.fauzi@ptsi.co.id', status: 'Aktif', active_audits: 18, monthly_capacity: 20 },
        { id: '2', name: 'Dinda Safitri, M.Si.', code: 'AUD-002', lph_name: 'LPH Sucofindo', phone: '0812-3333-4444', email: 'dinda.safitri@sucofindo.co.id', status: 'Aktif', active_audits: 16, monthly_capacity: 20 },
        { id: '3', name: 'Rizky Maulana, S.T.P.', code: 'AUD-003', lph_name: 'LPH UIN Syarif Hidayatullah', phone: '0813-5555-6666', email: 'rizky.m@uinjkt.ac.id', status: 'Aktif', active_audits: 15, monthly_capacity: 20 },
        { id: '4', name: 'Dewi Sartika, M.Si.', code: 'AUD-004', lph_name: 'LPH Salman ITB', phone: '0812-7777-8888', email: 'dewi.sartika@salmanitb.com', status: 'Aktif', active_audits: 12, monthly_capacity: 15 },
        { id: '5', name: 'Dimas Fajar, S.H.', code: 'AUD-005', lph_name: 'LPH Universitas Brawijaya', phone: '0815-9999-0000', email: 'dimas.f@ub.ac.id', status: 'Aktif', active_audits: 10, monthly_capacity: 15 },
    ]);

    const [lphDistributionRules, setLphDistributionRules] = useState({
        prioritizeRegion: true,
        limitCapacity: true,
        allowCrossLPH: true,
    });

    const [showAddLphModal, setShowAddLphModal] = useState(false);
    const [newLphForm, setNewLphForm] = useState({ name: '', code: '', region: 'Nasional', phone: '', email: '', status: 'Aktif', monthly_capacity: 50 });
    const [showManageLphModal, setShowManageLphModal] = useState(false);
    const [selectedLph, setSelectedLph] = useState<LPHPartner | null>(null);

    const [showAddAuditorModal, setShowAddAuditorModal] = useState(false);
    const [newAuditorForm, setNewAuditorForm] = useState({ name: '', code: '', lph_name: 'LPH Surveyor Indonesia', phone: '', email: '', status: 'Aktif', monthly_capacity: 15 });

    const loadLphData = async () => {
        try {
            const [lphs, auditors, sysSettings] = await Promise.all([
                operationalService.getLPHPartners(),
                operationalService.getAuditorPartners(),
                operationalService.getSystemSettings(),
            ]);
            if (Array.isArray(lphs) && lphs.length > 0) setLphPartners(lphs);
            if (Array.isArray(auditors) && auditors.length > 0) setAuditorsList(auditors);
            if (sysSettings?.lph_distribution_rules) {
                try {
                    const parsed = JSON.parse(sysSettings.lph_distribution_rules);
                    setLphDistributionRules(parsed);
                } catch (e) {}
            }
        } catch (err) {
            console.error('Failed to load LPH data', err);
        }
    };

    useEffect(() => {
        loadLphData();
    }, []);

    const filteredLph = lphPartners.filter(lph => {
        const matchesSearch = lph.name.toLowerCase().includes(lphSearchQuery.toLowerCase()) ||
            lph.code.toLowerCase().includes(lphSearchQuery.toLowerCase());
        const matchesRegion = lphRegionFilter === 'Semua Wilayah' || lph.region === lphRegionFilter;
        return matchesSearch && matchesRegion;
    });

    const totalLphPages = Math.ceil(filteredLph.length / lphPerPage) || 1;
    const paginatedLph = filteredLph.slice((lphPage - 1) * lphPerPage, lphPage * lphPerPage);

    const handleAddLPH = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await operationalService.createLPHPartner(newLphForm);
            setLphPartners(prev => [...prev, res]);
            setShowAddLphModal(false);
            setNewLphForm({ name: '', code: '', region: 'Nasional', phone: '', email: '', status: 'Aktif', monthly_capacity: 50 });
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

    const handleOpenManageLph = (lph: LPHPartner) => {
        setSelectedLph({ ...lph });
        setShowManageLphModal(true);
    };

    const handleSaveManageLph = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLph) return;
        try {
            await operationalService.updateLPHPartner(selectedLph.id, selectedLph);
            setLphPartners(prev => prev.map(l => l.id === selectedLph.id ? { ...l, ...selectedLph } : l));
            setShowManageLphModal(false);
            toast.success(`Data LPH "${selectedLph.name}" berhasil diperbarui!`);
        } catch (err) {
            toast.error('Gagal memperbarui data LPH');
        }
    };

    const handleAddAuditor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await operationalService.createAuditorPartner(newAuditorForm);
            setAuditorsList(prev => [...prev, res]);
            setShowAddAuditorModal(false);
            setNewAuditorForm({ name: '', code: '', lph_name: 'LPH Surveyor Indonesia', phone: '', email: '', status: 'Aktif', monthly_capacity: 15 });
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

    const handleSaveLphRules = async () => {
        try {
            await operationalService.updateSystemSetting('lph_distribution_rules', JSON.stringify(lphDistributionRules));
            toast.success('Aturan distribusi penugasan audit berhasil disimpan!');
        } catch (err) {
            toast.error('Gagal menyimpan aturan distribusi penugasan');
        }
    };

    const handleExportLphData = () => {
        const headers = 'ID,Nama LPH,Kode,Wilayah Layanan,Auditor Aktif,Kapasitas/Bulan,Penugasan Aktif,Status,Kontak Telepon,Email\n';
        const rows = lphPartners.map(l =>
            `"${l.id}","${l.name}","${l.code}","${l.region}",${l.active_auditors || 0},${l.monthly_capacity || 0},${l.active_assignments || 0},"${l.status}","${l.phone || ''}","${l.email || ''}"`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Daftar_LPH_Mitra_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Data LPH Mitra berhasil diekspor ke CSV!');
    };

    return (
        <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex border-b border-gray-200 text-sm font-bold">
                <button
                    onClick={() => setLphSubTab('lph')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        lphSubTab === 'lph' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Building2 className="w-4 h-4" /> Daftar LPH Mitra ({lphPartners.length})
                </button>
                <button
                    onClick={() => setLphSubTab('auditors')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        lphSubTab === 'auditors' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Users className="w-4 h-4" /> Auditor Halal ({auditorsList.length})
                </button>
                <button
                    onClick={() => setLphSubTab('rules')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                        lphSubTab === 'rules' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Shuffle className="w-4 h-4" /> Aturan Distribusi Audit
                </button>
            </div>

            {/* Sub-tab: LPH Mitra */}
            {lphSubTab === 'lph' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-lg">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Cari LPH berdasarkan nama / kode..."
                                    value={lphSearchQuery}
                                    onChange={(e) => { setLphSearchQuery(e.target.value); setLphPage(1); }}
                                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                            <select
                                value={lphRegionFilter}
                                onChange={(e) => { setLphRegionFilter(e.target.value); setLphPage(1); }}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                            >
                                <option value="Semua Wilayah">Semua Wilayah</option>
                                <option value="Nasional">Nasional</option>
                                <option value="Jabodetabek">Jabodetabek</option>
                                <option value="Jawa Barat">Jawa Barat</option>
                                <option value="Jawa Timur">Jawa Timur</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportLphData}
                                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddLphModal(true)}
                                className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Tambah LPH Mitra
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-3">Nama LPH &amp; Kode</th>
                                    <th className="py-3 px-3">Wilayah</th>
                                    <th className="py-3 px-3">Kontak / Email</th>
                                    <th className="py-3 px-3">Auditor</th>
                                    <th className="py-3 px-3">Kapasitas</th>
                                    <th className="py-3 px-3">Beban Aktif</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedLph.map((lph) => (
                                    <tr key={lph.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-3">
                                            <p className="font-bold text-gray-900">{lph.name}</p>
                                            <p className="text-[10px] font-mono text-gray-400">{lph.code}</p>
                                        </td>
                                        <td className="py-3 px-3 font-medium text-gray-700">{lph.region}</td>
                                        <td className="py-3 px-3 text-gray-600">
                                            <p>{lph.phone}</p>
                                            <p className="text-[10px] text-gray-400">{lph.email}</p>
                                        </td>
                                        <td className="py-3 px-3 font-bold text-gray-800">{lph.active_auditors || 0}</td>
                                        <td className="py-3 px-3 font-medium text-gray-700">{lph.monthly_capacity || 0} / bln</td>
                                        <td className="py-3 px-3 font-bold text-brand-700">{lph.active_assignments || 0} audit</td>
                                        <td className="py-3 px-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {lph.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenManageLph(lph)}
                                                    className="p-1 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                    title="Kelola LPH"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLPH(lph.id, lph.name)}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                    title="Hapus LPH"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>Menampilkan {paginatedLph.length} dari {filteredLph.length} LPH</span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={lphPage === 1}
                                onClick={() => setLphPage(prev => Math.max(1, prev - 1))}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 font-bold">{lphPage} / {totalLphPages}</span>
                            <button
                                disabled={lphPage >= totalLphPages}
                                onClick={() => setLphPage(prev => Math.min(totalLphPages, prev + 1))}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-tab: Auditor Halal */}
            {lphSubTab === 'auditors' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Daftar Auditor Halal Teregistrasi</h3>
                            <p className="text-xs text-gray-500 font-medium">Auditor kompeten yang bertugas melakukan audit lapangan dan pemeriksaan dokumen.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddAuditorModal(true)}
                            className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> Tambah Auditor
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-3">Nama Auditor</th>
                                    <th className="py-3 px-3">LPH Mitra</th>
                                    <th className="py-3 px-3">Kontak &amp; Email</th>
                                    <th className="py-3 px-3">Audit Aktif</th>
                                    <th className="py-3 px-3">Kapasitas Maks</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {auditorsList.map((auditor) => (
                                    <tr key={auditor.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-3 font-bold text-gray-900">{auditor.name}</td>
                                        <td className="py-3 px-3 text-gray-700">{auditor.lph_name}</td>
                                        <td className="py-3 px-3 text-gray-600">
                                            <p>{auditor.phone}</p>
                                            <p className="text-[10px] text-gray-400">{auditor.email}</p>
                                        </td>
                                        <td className="py-3 px-3 font-bold text-brand-700">{auditor.active_audits || 0}</td>
                                        <td className="py-3 px-3 font-medium text-gray-700">{auditor.monthly_capacity || 20} / bln</td>
                                        <td className="py-3 px-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {auditor.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <button
                                                onClick={() => handleDeleteAuditor(auditor.id, auditor.name)}
                                                className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                title="Hapus Auditor"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sub-tab: Aturan Distribusi Audit */}
            {lphSubTab === 'rules' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-gray-900">Aturan Distribusi &amp; Penugasan Audit LPH</h3>
                        <p className="text-xs text-gray-500 font-medium">Algoritma otomatis pemilihan LPH mitra dan penugasan tim auditor berdasarkan wilayah dan kapasitas.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Prioritaskan LPH di Wilayah yang Sama</p>
                                <p className="text-[11px] text-gray-500">Sistem memprioritaskan LPH lokal pada provinsi yang sama dengan pelaku usaha untuk efisiensi biaya dan logistik.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={lphDistributionRules.prioritizeRegion}
                                onChange={(e) => setLphDistributionRules({ ...lphDistributionRules, prioritizeRegion: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Batasi Kapasitas Audit Maksimal per Auditor</p>
                                <p className="text-[11px] text-gray-500">Mencegah penugasan ke auditor yang beban tugas aktifnya telah mencapai batas kapasitas bulanan.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={lphDistributionRules.limitCapacity}
                                onChange={(e) => setLphDistributionRules({ ...lphDistributionRules, limitCapacity: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Izinkan Penugasan LPH Nasional / Lintas Wilayah</p>
                                <p className="text-[11px] text-gray-500">Bila LPH lokal penuh, sistem otomatis mengalihkan antrean ke LPH mitra bertaraf nasional.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={lphDistributionRules.allowCrossLPH}
                                onChange={(e) => setLphDistributionRules({ ...lphDistributionRules, allowCrossLPH: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleSaveLphRules}
                            className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> Simpan Aturan Distribusi
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Tambah LPH */}
            {showAddLphModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-gray-900">Tambah LPH Mitra Baru</h3>
                            <button onClick={() => setShowAddLphModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddLPH} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Lembaga Pemeriksa Halal (LPH) *</label>
                                <input
                                    type="text"
                                    value={newLphForm.name}
                                    onChange={(e) => setNewLphForm({ ...newLphForm, name: e.target.value })}
                                    placeholder="Contoh: LPH Surveyor Indonesia"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kode LPH *</label>
                                    <input
                                        type="text"
                                        value={newLphForm.code}
                                        onChange={(e) => setNewLphForm({ ...newLphForm, code: e.target.value })}
                                        placeholder="LPH-SI-001"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Wilayah Layanan</label>
                                    <select
                                        value={newLphForm.region}
                                        onChange={(e) => setNewLphForm({ ...newLphForm, region: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="Nasional">Nasional</option>
                                        <option value="Jabodetabek">Jabodetabek</option>
                                        <option value="Jawa Barat">Jawa Barat</option>
                                        <option value="Jawa Tengah">Jawa Tengah</option>
                                        <option value="Jawa Timur">Jawa Timur</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kontak Telepon</label>
                                    <input
                                        type="text"
                                        value={newLphForm.phone}
                                        onChange={(e) => setNewLphForm({ ...newLphForm, phone: e.target.value })}
                                        placeholder="021-1234567"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kapasitas / Bulan</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={newLphForm.monthly_capacity}
                                        onChange={(e) => setNewLphForm({ ...newLphForm, monthly_capacity: Number(e.target.value) })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Email Resmi LPH</label>
                                <input
                                    type="email"
                                    value={newLphForm.email}
                                    onChange={(e) => setNewLphForm({ ...newLphForm, email: e.target.value })}
                                    placeholder="kontak@lph.id"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddLphModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm cursor-pointer"
                                >
                                    Daftarkan LPH
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Kelola / Edit LPH */}
            {showManageLphModal && selectedLph && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-gray-900">Kelola LPH: {selectedLph.name}</h3>
                            <button onClick={() => setShowManageLphModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveManageLph} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama LPH *</label>
                                <input
                                    type="text"
                                    value={selectedLph.name}
                                    onChange={(e) => setSelectedLph({ ...selectedLph, name: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kapasitas / Bulan</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={selectedLph.monthly_capacity || 50}
                                        onChange={(e) => setSelectedLph({ ...selectedLph, monthly_capacity: Number(e.target.value) })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Kemitraan</label>
                                    <select
                                        value={selectedLph.status}
                                        onChange={(e) => setSelectedLph({ ...selectedLph, status: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowManageLphModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm cursor-pointer"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah Auditor */}
            {showAddAuditorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-150 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-gray-900">Tambah Auditor Halal Baru</h3>
                            <button onClick={() => setShowAddAuditorModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddAuditor} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Auditor (dengan Gelar) *</label>
                                <input
                                    type="text"
                                    value={newAuditorForm.name}
                                    onChange={(e) => setNewAuditorForm({ ...newAuditorForm, name: e.target.value })}
                                    placeholder="Contoh: Dr. Ahmad Fauzi, S.H.I."
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">LPH Mitra Naungan *</label>
                                <select
                                    value={newAuditorForm.lph_name}
                                    onChange={(e) => setNewAuditorForm({ ...newAuditorForm, lph_name: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    required
                                >
                                    {lphPartners.map(l => (
                                        <option key={l.id} value={l.name}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                                    <input
                                        type="text"
                                        value={newAuditorForm.phone}
                                        onChange={(e) => setNewAuditorForm({ ...newAuditorForm, phone: e.target.value })}
                                        placeholder="08123456789"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newAuditorForm.email}
                                        onChange={(e) => setNewAuditorForm({ ...newAuditorForm, email: e.target.value })}
                                        placeholder="auditor@lph.id"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddAuditorModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-black text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm cursor-pointer"
                                >
                                    Daftarkan Auditor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
