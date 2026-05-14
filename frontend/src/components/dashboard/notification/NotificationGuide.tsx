import { Settings } from 'lucide-react';

export const NotificationGuide = () => {
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                    <Settings className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-bold">Panduan Singkat</h3>
            </div>
            <ul className="space-y-4">
                <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">1</div>
                    <div>
                        <p className="text-xs text-white font-bold mb-1">Kontrol Saluran (App & WA)</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">Gunakan tombol <b>App</b> untuk notifikasi di dashboard sistem, dan <b>WA</b> untuk pengiriman pesan WhatsApp langsung ke user.</p>
                    </div>
                </li>
                <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">2</div>
                    <div>
                        <p className="text-xs text-white font-bold mb-1">Variabel Dinamis</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">Masukkan kode <code>{"{{variabel}}"}</code> untuk data otomatis. Klik/hover label variabel di bawah kotak teks untuk melihat opsi yang tersedia.</p>
                    </div>
                </li>
                <li className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px] font-bold border border-brand-500/30">3</div>
                    <div>
                        <p className="text-xs text-white font-bold mb-1">Status Gateway</p>
                        <p className="text-[10px] text-gray-300 leading-relaxed">Pastikan <b>Status Global</b> aktif agar pengiriman WA berfungsi. Jika OFF, semua notifikasi WA akan tertahan meskipun tombol WA di template aktif.</p>
                    </div>
                </li>
            </ul>
        </div>
    );
};
