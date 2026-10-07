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
          <div className="bg-[#00261f] text-white p-5 sm:p-6 border-b border-brand-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold-400/20 text-gold-400 border border-gold-400/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">Kebijakan Privasi & Persetujuan Data</h3>
                  <p className="text-xs text-brand-100/70">Kepatuhan UU No. 27 Tahun 2022 (UU PDP)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-brand-100/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex gap-1.5 mt-4 p-1 bg-black/25 rounded-lg border border-white/10 text-xs overflow-x-auto">
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
                      ? 'bg-white text-[#00261f] font-semibold shadow-xs'
                      : 'text-brand-100/80 hover:text-white'
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
                  PT Ana Nahnu Indonesia (HalalCore) memproses data Anda khusus untuk konsultasi, verifikasi kelayakan bahan halal, dan penyusunan berkas sertifikasi halal resmi.
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">1. Data yang Diproses:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li><strong>Identitas:</strong> Nama lengkap, NIK (16 digit), dan nomor kontak WhatsApp.</li>
                    <li><strong>Usaha:</strong> Nama bisnis, NIB (13 digit), alamat outlet/fasilitas, serta komposisi bahan produk.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-bold text-slate-900 text-xs">Enkripsi SSL/TLS 256-bit</p>
                  <p className="text-xs text-slate-600 mt-0.5">Semua transmisi formulir konsultasi terlindungi enkripsi tingkat perbankan.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-bold text-slate-900 text-xs">Akses Terbatas & Non-Komersial</p>
                  <p className="text-xs text-slate-600 mt-0.5">Data hanya dibuka untuk konsultan yang ditugaskan dan tidak pernah diperjualbelikan.</p>
                </div>
              </div>
            )}

            {activeTab === 'sharing' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Data diteruskan secara sah hanya kepada otoritas resmi sertifikasi halal:</p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-xs">BPJPH Kemenag RI & LPH Terakreditasi</p>
                    <p className="text-xs text-slate-500">Untuk pendaftaran permohonan sertifikasi halal dan audit resmi.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rights' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">Hak Anda berdasarkan UU PDP:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Hak memperoleh transparansi penggunaan data Anda.</li>
                  <li>Hak kerahasiaan resep & formula produk (Non-Disclosure).</li>
                  <li>Hak memperbarui atau memperbaiki informasi usaha yang keliru.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/privacy-policy"
              target="_blank"
              className="text-xs text-[#004033] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Baca Kebijakan Lengkap</span>
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
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-[#00261f] bg-gradient-gold hover:brightness-105 rounded-lg transition-all shadow-xs"
                >
                  Saya Setuju
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
