import { useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export function GeneralSettingsTab() {
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

    const handleSave = () => {
        toast.success('Pengaturan profil & sistem umum berhasil disimpan.');
    };

    return (
        <div className="space-y-6">
            {/* Profil Operasional Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-black text-gray-900">Profil &amp; Identitas Operasional</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Informasi akun penanggung jawab operasional dan kontak notifikasi internal.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Penanggung Jawab</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Email Resmi Operasional</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Nomor WhatsApp Operasional</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>
            </div>

            {/* Preferensi Regional & Format Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-black text-gray-900">Preferensi Regional &amp; Format Sistem</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Format zona waktu, bahasa, dan format tampilan tanggal standar pada dasbor.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Zona Waktu Default</label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="WIB (UTC+7)">WIB (UTC+7)</option>
                            <option value="WITA (UTC+8)">WITA (UTC+8)</option>
                            <option value="WIT (UTC+9)">WIT (UTC+9)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Bahasa Antarmuka</label>
                        <select
                            value={systemLang}
                            onChange={(e) => setSystemLang(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="Indonesia">Bahasa Indonesia</option>
                            <option value="English">English</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Format Tanggal</label>
                        <select
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="DD MMM YYYY">30 Jul 2026</option>
                            <option value="YYYY-MM-DD">2026-07-30</option>
                            <option value="DD/MM/YYYY">30/07/2026</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Periode Default Laporan</label>
                        <select
                            value={defaultPeriod}
                            onChange={(e) => setDefaultPeriod(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="Harian">Harian</option>
                            <option value="Mingguan">Mingguan</option>
                            <option value="Bulanan">Bulanan</option>
                            <option value="Tahunan">Tahunan</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Opsi Interaktivitas Dasbor Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                    <h2 className="text-base font-black text-gray-900">Perilaku Interaksi &amp; Konfirmasi</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Pengaturan keamanan aksi dan kenyamanan kerja operasional.</p>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Konfirmasi Tindakan Penting</p>
                            <p className="text-[11px] text-gray-500">Minta popup konfirmasi saat menghapus berkas, mengembalikan ke advisor, atau mengubah prioritas.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={confirmActionToggle}
                            onChange={(e) => setConfirmActionToggle(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Tampilkan Panel Aktivitas Terbaru</p>
                            <p className="text-[11px] text-gray-500">Menampilkan feed pembaruan status dan penugasan pada halaman overview operasional.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={showRecentActivityToggle}
                            onChange={(e) => setShowRecentActivityToggle(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Auto-Refresh Antrean Otomatis</p>
                            <p className="text-[11px] text-gray-500">Memperbarui data antrean setiap 60 detik tanpa perlu reload halaman penuh.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoRefreshToggle}
                            onChange={(e) => setAutoRefreshToggle(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> Simpan Pengaturan Umum
                    </button>
                </div>
            </div>
        </div>
    );
}
