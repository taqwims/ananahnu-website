import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  X, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function PrivacyConsentModal({ isOpen, onClose, onAccept }: PrivacyConsentModalProps) {
  const [activeTab, setActiveTab] = useState<'usage' | 'security' | 'sharing' | 'rights'>('usage');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">Kebijakan Privasi & Persetujuan Data</h3>
                  <p className="text-xs text-slate-400">Standar Pelindungan Data UU No. 27 Tahun 2022 (UU PDP)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex gap-1.5 mt-4 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs overflow-x-auto">
              {[
                { id: 'usage', label: 'Tujuan Pemrosesan' },
                { id: 'security', label: 'Keamanan & Enkripsi' },
                { id: 'sharing', label: 'Pihak Berwenang' },
                { id: 'rights', label: 'Hak Subjek Data' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed">
            {activeTab === 'usage' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  PT Ana Nahnu Indonesia (HalalCore) memproses data Anda khusus untuk pemenuhan verifikasi kelayakan halal, pendaftaran SIHALAL BPJPH, dan bimbingan dokumen SJPH.
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">1. Data yang Diproses:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li><strong>Identitas:</strong> Nama lengkap, NIK (16 digit), e-KTP penanggung jawab usaha.</li>
                    <li><strong>Usaha:</strong> NIB (13 digit), NPWP, izin edar, alamat fasilitas produksi, daftar bahan baku.</li>
                    <li><strong>Kontak:</strong> Nomor telepon WhatsApp dan email aktif untuk notifikasi sistem.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">2. Dasar Pemrosesan:</h4>
                  <p className="text-xs text-slate-600">
                    Pemrosesan didasarkan pada persetujuan eksplisit Anda dan pemenuhan regulasi Jaminan Produk Halal Republik Indonesia.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900 text-xs">Enkripsi End-to-End SSL/TLS</p>
                    <p className="text-xs text-slate-600 mt-0.5">Seluruh transmisi data identitas dan dokumen dilindungi protokol enkripsi 256-bit.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900 text-xs">Kontrol Akses Berbasis Peran (RBAC)</p>
                    <p className="text-xs text-slate-600 mt-0.5">Dokumen hanya dapat diakses oleh konsultan, auditor, dan tim teknis yang ditugaskan resmi.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900 text-xs">Jaminan Non-Komersial</p>
                    <p className="text-xs text-slate-600 mt-0.5">HalalCore tidak pernah menjual atau menyewakan data pengguna ke pihak periklanan manapun.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sharing' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Data permohonan sertifikasi halal hanya diteruskan kepada lembaga regulator resmi:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">BPJPH Kementerian Agama RI</p>
                      <p className="text-xs text-slate-500">Penerbitan Surat Tanda Terima Dokumen (STTD) dan Sertifikat Halal resmi.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Lembaga Pemeriksa Halal (LPH)</p>
                      <p className="text-xs text-slate-500">Pelaksanaan pemeriksaan kecukupan dokumen bahan dan audit lapangan.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rights' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Hak Anda berdasarkan UU No. 27 Tahun 2022 (UU PDP):</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li><strong>Hak Akses & Perbaikan:</strong> Memperbarui profil dan kelengkapan data usaha kapan saja melalui portal.</li>
                  <li><strong>Hak Kerahasiaan Resep:</strong> Formula dan komposisi produk dijaga ketat dengan standar kerahasiaan dagang (NDA).</li>
                  <li><strong>Hak Penarikan Persetujuan:</strong> Menarik persetujuan layanan sepanjang tidak bertentangan dengan tahapan hukum audit yang sedang berjalan.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/privacy-policy"
              target="_blank"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Baca Kebijakan Privasi Lengkap</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              {onAccept && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                >
                  Saya Mengerti & Setuju
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
