import { useState, useEffect } from 'react';
import { Save, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';

export function AppearanceSettingsTab() {
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
    const [accentColor, setAccentColor] = useState('#10b981');
    const [textSize, setTextSize] = useState('Sedang');
    const [density, setDensity] = useState('Standar');
    const [showMenuIcons, setShowMenuIcons] = useState(true);
    const [roundedCorners, setRoundedCorners] = useState(true);
    const [smoothAnim, setSmoothAnim] = useState(true);
    const [defaultLanding, setDefaultLanding] = useState('Dashboard');
    const [stickyHeader, setStickyHeader] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const local = localStorage.getItem('halalcore_appearance_settings');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (parsed.themeMode) setThemeMode(parsed.themeMode);
                if (parsed.accentColor) setAccentColor(parsed.accentColor);
                if (parsed.textSize) setTextSize(parsed.textSize);
                if (parsed.density) setDensity(parsed.density);
            } catch (e) {}
        }
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const payload = {
            themeMode,
            accentColor,
            textSize,
            density,
            showMenuIcons,
            roundedCorners,
            smoothAnim,
            defaultLanding,
            stickyHeader
        };
        localStorage.setItem('halalcore_appearance_settings', JSON.stringify(payload));
        try {
            await operationalService.updateSystemSetting('appearance_settings', JSON.stringify(payload));
            toast.success('Preferensi tampilan dan tema berhasil disimpan!');
        } catch (err) {
            toast.success('Preferensi tampilan berhasil disimpan di browser!');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tema & Warna Aksen */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-black text-gray-900">Tema Antarmuka &amp; Warna Aksen</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Personalisasi palet warna dan mode pencahayaan untuk pengalaman kerja terbaik.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mode Gelap / Terang */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                        <label className="block text-xs font-bold text-gray-700">Mode Tema</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setThemeMode('light')}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                    themeMode === 'light'
                                        ? 'bg-white border-brand-500 text-brand-700 shadow-xs ring-1 ring-brand-500'
                                        : 'bg-gray-100 border-gray-200 text-gray-600'
                                }`}
                            >
                                <Sun className="w-4 h-4 text-amber-500" /> Mode Terang
                            </button>
                            <button
                                type="button"
                                onClick={() => setThemeMode('dark')}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                    themeMode === 'dark'
                                        ? 'bg-gray-900 border-gray-800 text-white shadow-xs'
                                        : 'bg-gray-100 border-gray-200 text-gray-600'
                                }`}
                            >
                                <Moon className="w-4 h-4 text-indigo-400" /> Mode Gelap
                            </button>
                        </div>
                    </div>

                    {/* Pilihan Warna Aksen */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                        <label className="block text-xs font-bold text-gray-700">Warna Aksen Utama</label>
                        <div className="flex items-center gap-3">
                            {[
                                { name: 'Emerald', color: '#10b981' },
                                { name: 'Teal', color: '#0f766e' },
                                { name: 'Blue', color: '#3b82f6' },
                                { name: 'Indigo', color: '#6366f1' },
                                { name: 'Violet', color: '#8b5cf6' },
                                { name: 'Rose', color: '#f43f5e' },
                            ].map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setAccentColor(c.color)}
                                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                                        accentColor === c.color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c.color }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tipografi & Kepadatan Tabel */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-black text-gray-900">Tipografi &amp; Kepadatan Tata Letak</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Sesuaikan ukuran font, kepadatan baris tabel, dan efek sudut pembungkus.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Ukuran Font Antarmuka</label>
                        <select
                            value={textSize}
                            onChange={(e) => setTextSize(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="Kompak">Kompak (Compact)</option>
                            <option value="Sedang">Sedang (Standar)</option>
                            <option value="Besar">Besar (Comfortable)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Kepadatan Tabel Antrean</label>
                        <select
                            value={density}
                            onChange={(e) => setDensity(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="Padat">Padat (Banyak Data per Layar)</option>
                            <option value="Standar">Standar</option>
                            <option value="Longgar">Longgar (Renggang)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Halaman Awal Default (Landing)</label>
                        <select
                            value={defaultLanding}
                            onChange={(e) => setDefaultLanding(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="Dashboard">Dasbor Ikhtisar</option>
                            <option value="Pengajuan Masuk">Pengajuan Masuk</option>
                            <option value="Antrean QC">Antrean QC</option>
                            <option value="Antrean HDO">Antrean HDO</option>
                            <option value="Verifikasi Self Declare">Verifikasi Self Declare</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Tampilkan Ikon Menu Navigasi</p>
                            <p className="text-[11px] text-gray-500">Menampilkan ikon visual di samping teks menu navigasi.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={showMenuIcons}
                            onChange={(e) => setShowMenuIcons(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Header Tabel Menempel (Sticky Header)</p>
                            <p className="text-[11px] text-gray-500">Judul kolom tabel tetap terlihat saat menggulir daftar antrean yang panjang.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={stickyHeader}
                            onChange={(e) => setStickyHeader(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Sudut Melengkung Modern (Rounded-3xl)</p>
                            <p className="text-[11px] text-gray-500">Gaya kartu dan wadah dengan sudut melengkung estetik ala antarmuka premium.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={roundedCorners}
                            onChange={(e) => setRoundedCorners(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Animasi Transisi Halus (Smooth Transitions)</p>
                            <p className="text-[11px] text-gray-500">Efek animasi saat membuka drawer, modal, dan pergantian tab antrean.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={smoothAnim}
                            onChange={(e) => setSmoothAnim(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Preferensi Tampilan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
