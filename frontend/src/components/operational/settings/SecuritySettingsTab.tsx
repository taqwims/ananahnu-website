import { useState } from 'react';
import {
    Key,
    Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export function SecuritySettingsTab() {
    const [securitySubTab, setSecuritySubTab] = useState<'roles' | 'matrix' | 'staff' | 'scope' | 'temp' | 'audit'>('roles');

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

    const [securityStaffList] = useState([
        { id: '1', name: 'Siti Rahma', email: 'siti.rahma@halalcore.id', initial: 'SR', role: 'QCO', scope: 'Semua Cabang', status: 'Aktif', lastLogin: '30 Jul 2026, 09:32 WIB' },
        { id: '2', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@halalcore.id', initial: 'AF', role: 'HDO', scope: 'Jawa Barat', status: 'Aktif', lastLogin: '30 Jul 2026, 08:15 WIB' },
        { id: '3', name: 'Dewi Lestari', email: 'dewi.lestari@halalcore.id', initial: 'DL', role: 'Verifikator Self Declare', scope: 'Cabang Bandung', status: 'Aktif', lastLogin: '30 Jul 2026, 07:48 WIB' },
        { id: '4', name: 'Rizky Pratama', email: 'rizky.pratama@halalcore.id', initial: 'RP', role: 'Staf Operasional', scope: 'Data Sendiri', status: 'Nonaktif', lastLogin: '28 Jul 2026, 16:22 WIB' },
        { id: '5', name: 'Nabila Putri', email: 'nabila.putri@halalcore.id', initial: 'NP', role: 'Auditor Halal', scope: 'Jabodetabek', status: 'Aktif', lastLogin: '30 Jul 2026, 10:05 WIB' },
    ]);

    const [tempAccessList, setTempAccessList] = useState([
        { id: '1', name: 'Rizky Maulana (QCO)', initial: 'RM', access: 'Akses pengajuan tim lain', scope: 'Tim HDO', period: '01 Jul–07 Jul 2026', grantedBy: 'Manajer Operasional', status: 'Aktif' },
        { id: '2', name: 'Dinda Safitri (HDO)', initial: 'DS', access: 'Melihat dokumen sensitif', scope: 'Semua Cabang', period: '29 Jun–05 Jul 2026', grantedBy: 'Manajer Operasional', status: 'Aktif' },
        { id: '3', name: 'Ahmad Fauzi (HDO)', initial: 'AF', access: 'Jadwalkan audit', scope: 'Jawa Barat', period: '02 Jul–10 Jul 2026', grantedBy: 'Manajer Operasional', status: 'Aktif' },
        { id: '4', name: 'Nabila Putri (Auditor)', initial: 'NP', access: 'Akses laporan', scope: 'Jabodetabek', period: '25 Jun–30 Jun 2026', grantedBy: 'Manajer Operasional', status: 'Selesai' },
    ]);

    const [securityAuditLogs] = useState([
        { id: '1', date: '30 Jul 2026, 10:15 WIB', user: 'Arif Oetomo', role: 'Manajer Operasional', activity: 'Ubah Cakupan Data', detail: 'Siti Rahma: Jawa Barat (Sebelum: Jawa Barat, Banten; Sesudah: Jawa Barat)', ip: '10.10.5.23 (Windows 11 / Chrome)', status: 'Berhasil' },
        { id: '2', date: '30 Jul 2026, 09:42 WIB', user: 'Arif Oetomo', role: 'Manajer Operasional', activity: 'Beri Akses Sementara', detail: 'Rizky Maulana (Role: Auditor, Periode: 30 Jul 2026 - 31 Jul 2026)', ip: '10.10.5.23 (Windows 11 / Chrome)', status: 'Berhasil' },
        { id: '3', date: '30 Jul 2026, 08:55 WIB', user: 'Siti Rahma', role: 'Manajer Operasional', activity: 'Ubah Permission Staf', detail: 'Ahmad Fauzi (Permission: Lihat Data Usaha; Sebelum: Terbatas; Sesudah: Penuh)', ip: '10.10.6.14 (Windows 10 / Edge)', status: 'Berhasil' },
        { id: '4', date: '30 Jul 2026, 00:01 WIB', user: 'System', role: 'Otomatis', activity: 'Akses Sementara Berakhir', detail: 'Rizky Maulana (Role: Auditor, Akses sementara telah berakhir otomatis)', ip: '- (System)', status: 'Otomatis' },
        { id: '5', date: '29 Jul 2026, 15:28 WIB', user: 'Ahmad Fauzi', role: 'Auditor', activity: 'Percobaan Akses Terbatas', detail: 'Percobaan akses ke data di luar cakupan (Modul: Pengajuan Masuk)', ip: '203.0.113.45 (Windows 10 / Chrome)', status: 'Peringatan' },
    ]);

    const handleSavePermissions = () => {
        toast.success('Pengaturan hak akses dan matriks permission berhasil disimpan!');
    };

    const handleRevokeTempAccess = (id: string, name: string) => {
        setTempAccessList(prev => prev.filter(t => t.id !== id));
        toast.success(`Akses sementara untuk ${name} telah dicabut.`);
    };

    return (
        <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex border-b border-gray-200 text-sm font-bold overflow-x-auto">
                <button
                    onClick={() => setSecuritySubTab('roles')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        securitySubTab === 'roles' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Key className="w-4 h-4" /> Peran &amp; Hak Akses
                </button>
                <button
                    onClick={() => setSecuritySubTab('staff')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        securitySubTab === 'staff' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Daftar Akun Staf ({securityStaffList.length})
                </button>
                <button
                    onClick={() => setSecuritySubTab('temp')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        securitySubTab === 'temp' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Akses Sementara ({tempAccessList.length})
                </button>
                <button
                    onClick={() => setSecuritySubTab('audit')}
                    className={`pb-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                        securitySubTab === 'audit' ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Audit Trail Keamanan
                </button>
            </div>

            {/* Sub-tab: Roles & Permissions */}
            {securitySubTab === 'roles' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-base font-black text-gray-900">Hak Akses &amp; Batasan Staf Operasional</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Konfigurasi izin aksi per peran staf untuk menjaga keamanan dan integritas berkas.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Lihat Pengajuan yang Ditugaskan Saja</p>
                                <p className="text-[11px] text-gray-500">Staf hanya dapat melihat berkas yang ditugaskan ke dirinya.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={staffPermissions.viewAssigned}
                                onChange={(e) => setStaffPermissions({ ...staffPermissions, viewAssigned: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Izinkan Pengembalian Berkas ke Advisor</p>
                                <p className="text-[11px] text-gray-500">Staf QCO/HDO dapat mengembalikan pengajuan dengan catatan perbaikan.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={staffPermissions.returnToAdvisor}
                                onChange={(e) => setStaffPermissions({ ...staffPermissions, returnToAdvisor: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Izinkan Eskalasi SLA Otomatis</p>
                                <p className="text-[11px] text-gray-500">Otomatis menaikkan prioritas berkas yang melewati 80% batas SLA.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={staffPermissions.escalate}
                                onChange={(e) => setStaffPermissions({ ...staffPermissions, escalate: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Izinkan Ekspor Data Antrean ke CSV</p>
                                <p className="text-[11px] text-gray-500">Staf dapat mengunduh rekapan data antrean pengajuan.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={staffPermissions.exportData}
                                onChange={(e) => setStaffPermissions({ ...staffPermissions, exportData: e.target.checked })}
                                className="w-4 h-4 text-brand-600 rounded"
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleSavePermissions}
                            className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> Simpan Konfigurasi Keamanan
                        </button>
                    </div>
                </div>
            )}

            {/* Sub-tab: Staff Accounts */}
            {securitySubTab === 'staff' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-gray-900">Daftar Akun Tim Operasional</h3>
                            <p className="text-xs text-gray-500 font-medium">Pengelolaan akses dan cakupan wilayah kerja tim QCO, HDO, dan Auditor.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-3">Nama Staf &amp; Email</th>
                                    <th className="py-3 px-3">Peran Operasional</th>
                                    <th className="py-3 px-3">Cakupan Wilayah</th>
                                    <th className="py-3 px-3">Login Terakhir</th>
                                    <th className="py-3 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {securityStaffList.map((staf) => (
                                    <tr key={staf.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-3">
                                            <p className="font-bold text-gray-900">{staf.name}</p>
                                            <p className="text-[10px] text-gray-400">{staf.email}</p>
                                        </td>
                                        <td className="py-3 px-3 font-medium text-gray-700">{staf.role}</td>
                                        <td className="py-3 px-3 text-gray-600">{staf.scope}</td>
                                        <td className="py-3 px-3 text-gray-500">{staf.lastLogin}</td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                staf.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {staf.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sub-tab: Akses Sementara */}
            {securitySubTab === 'temp' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-gray-900">Akses Sementara (Delegasi Tugas)</h3>
                            <p className="text-xs text-gray-500 font-medium">Daftar staf yang diberikan izin lintas tim atau akses sementara.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-3">Nama Staf</th>
                                    <th className="py-3 px-3">Izin Akses Khusus</th>
                                    <th className="py-3 px-3">Cakupan</th>
                                    <th className="py-3 px-3">Periode Berlaku</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tempAccessList.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-3 font-bold text-gray-900">{item.name}</td>
                                        <td className="py-3 px-3 font-medium text-gray-700">{item.access}</td>
                                        <td className="py-3 px-3 text-gray-600">{item.scope}</td>
                                        <td className="py-3 px-3 text-gray-500 font-mono text-[10px]">{item.period}</td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            {item.status === 'Aktif' && (
                                                <button
                                                    onClick={() => handleRevokeTempAccess(item.id, item.name)}
                                                    className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200 cursor-pointer"
                                                >
                                                    Cabut Akses
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sub-tab: Audit Trail Keamanan */}
            {securitySubTab === 'audit' && (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-gray-900">Audit Trail Keamanan &amp; Aktivitas Sistem</h3>
                            <p className="text-xs text-gray-500 font-medium">Log aktivitas otentikasi, perubahan izin, dan aksi operasional.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] border-b border-gray-100">
                                <tr>
                                    <th className="py-3 px-3">Waktu</th>
                                    <th className="py-3 px-3">Pengguna</th>
                                    <th className="py-3 px-3">Aktivitas</th>
                                    <th className="py-3 px-3">Detail Perubahan</th>
                                    <th className="py-3 px-3">IP / Perangkat</th>
                                    <th className="py-3 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {securityAuditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-3 text-gray-500 font-mono text-[10px]">{log.date}</td>
                                        <td className="py-3 px-3">
                                            <p className="font-bold text-gray-900">{log.user}</p>
                                            <p className="text-[10px] text-gray-400">{log.role}</p>
                                        </td>
                                        <td className="py-3 px-3 font-bold text-gray-800">{log.activity}</td>
                                        <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{log.detail}</td>
                                        <td className="py-3 px-3 text-gray-400 font-mono text-[10px]">{log.ip}</td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                log.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-700' : log.status === 'Peringatan' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
