import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitPublicForm, getProvinces, type Province } from '../../services/teleService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Mail, Building2, Scale, Beef, MapPin,
  UtensilsCrossed, Droplets, CheckSquare, ArrowRight,
  ArrowLeft, Send, CheckCircle2, Headphones, AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SCALE_OPTIONS = [
  { value: 'mikro_kecil', label: 'Mikro / Kecil' },
  { value: 'menengah', label: 'Menengah' },
  { value: 'besar', label: 'Besar' },
];

export default function PublicFormPage() {
  const [searchParams] = useSearchParams();
  const sharedBy = searchParams.get('ref') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ form_id: string; route_type: string; status: string } | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);

  // Form data
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    business_type: '',
    business_scale: '',
    uses_meat: false,
    province_id: 0,
    is_catering: false,
    is_amdk: false,
    agreed_terms: false,
    term_data_accuracy: false,
    term_agreement: false,
    term_regulator: false,
  });

  useEffect(() => {
    getProvinces().then((res) => setProvinces(res.data)).catch(() => {});
  }, []);

  const updateForm = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isStep1Valid = () =>
    form.name && form.phone && form.email && form.business_type && form.business_scale && form.province_id > 0;

  const isStep2Valid = () =>
    form.term_data_accuracy && form.term_agreement && form.term_regulator;

  const handleSubmit = async () => {
    if (!isStep2Valid()) {
      toast.error('Harap centang semua persetujuan');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        business_type: form.business_type,
        business_scale: form.business_scale,
        uses_meat: form.uses_meat,
        province_id: form.province_id,
        is_catering: form.is_catering,
        is_amdk: form.is_amdk,
        agreed_terms: true,
        shared_by_id: sharedBy,
      };
      const res = await submitPublicForm(payload);
      setResult(res.data);
      setSubmitted(true);
      toast.success('Form berhasil dikirim!');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal mengirim form';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 max-w-lg w-full text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">Pengajuan Berhasil!</h2>
          <p className="text-dark-600 mb-6">
            Terima kasih, {form.name}. Data Anda telah kami terima.
          </p>

          <div className="glass p-4 mb-6 text-left space-y-3 rounded-xl border border-primary-500/10">
            <div className="flex justify-between">
              <span className="text-dark-500 text-sm">ID Pengajuan</span>
              <span className="text-primary-700 text-sm font-mono">{result.form_id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-500 text-sm">Kategori</span>
              <span className={`text-sm font-semibold ${result.route_type === 'TELECONFERENCE' ? 'text-primary-600' : 'text-amber-600'}`}>
                {result.route_type === 'TELECONFERENCE' ? '📞 Teleconference' : '📝 Self Declare'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-500 text-sm">Status</span>
              <span className="text-emerald-600 text-sm font-semibold">{result.status}</span>
            </div>
          </div>

          {result.route_type === 'TELECONFERENCE' ? (
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 text-left">
              <div className="flex gap-3">
                <Headphones className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-primary-900 font-bold">Tim telemarketing kami akan menghubungi Anda</p>
                  <p className="text-xs text-dark-600 mt-1">
                    Jadwal konsultasi via video call (Zoom/WA/GMeet) akan dikirimkan ke nomor WhatsApp Anda.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-left">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-bold">Pengajuan Anda masuk kategori Self Declare</p>
                  <p className="text-xs text-dark-600 mt-1">
                    Anda akan menerima akun untuk melengkapi data secara mandiri via email & WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-60 h-60 bg-gold-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-xl shadow-primary-600/10"
          >
            <Headphones className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-primary-900">Pengajuan Sertifikasi Halal</h1>
          <p className="text-dark-500 text-sm mt-1">Isi formulir di bawah untuk memulai proses pendampingan</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= s ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-dark-200 text-dark-500'
              }`}>
                {s}
              </div>
              {s < 2 && (
                <div className="flex-1 h-1 rounded-full bg-dark-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: step > s ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          className="glass-card p-8"
          layout
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-500" /> Data Usaha
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nama */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-dark-500" /> Nama Lengkap
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masukkan nama"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-dark-500" /> No. Telepon
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-dark-500" /> Email
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="email@contoh.com"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                    />
                  </div>

                  {/* Jenis Usaha */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-dark-500" /> Jenis Usaha
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Restoran, Bakery, dll"
                      value={form.business_type}
                      onChange={(e) => updateForm('business_type', e.target.value)}
                    />
                  </div>

                  {/* Skala Usaha */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-dark-500" /> Skala Usaha
                    </label>
                    <div className="relative">
                      <select
                        className="form-select"
                        value={form.business_scale}
                        onChange={(e) => updateForm('business_scale', e.target.value)}
                      >
                        <option value="">Pilih skala usaha</option>
                        {SCALE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Provinsi */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-dark-500" /> Provinsi
                    </label>
                    <div className="relative">
                      <select
                        className="form-select"
                        value={form.province_id}
                        onChange={(e) => updateForm('province_id', Number(e.target.value))}
                      >
                        <option value={0}>Pilih provinsi</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Checkbox Fields */}
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-dark-600">Informasi Tambahan</p>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-dark-200 cursor-pointer hover:border-primary-500/30 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.uses_meat}
                      onChange={(e) => updateForm('uses_meat', e.target.checked)}
                    />
                    <Beef className="w-4 h-4 text-rose-500" />
                    <span className="text-sm text-dark-700">Menggunakan bahan daging</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-dark-200 cursor-pointer hover:border-primary-500/30 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.is_catering}
                      onChange={(e) => updateForm('is_catering', e.target.checked)}
                    />
                    <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-dark-700">Catering / Restoran / SPPG</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-dark-200 cursor-pointer hover:border-primary-500/30 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.is_amdk}
                      onChange={(e) => updateForm('is_amdk', e.target.checked)}
                    />
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-dark-700">Depot Air Minum / AMDK</span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Lanjut <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary-500" /> Persetujuan
                </h2>

                <div className="p-4 rounded-xl bg-white border border-dark-200 shadow-sm">
                  <p className="text-sm text-dark-600 leading-relaxed">
                    Dengan mengajukan formulir ini, Anda menyetujui untuk menggunakan layanan pendampingan sertifikasi halal dari HalalCore 
                    (unit layanan PT Ana Nahnu Indonesia). Keputusan sertifikasi halal sepenuhnya merupakan kewenangan regulator yang berwenang.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white border border-dark-200 cursor-pointer hover:border-primary-500/30 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={form.term_data_accuracy}
                      onChange={(e) => updateForm('term_data_accuracy', e.target.checked)}
                    />
                    <span className="text-sm text-dark-700">
                      Saya menyatakan data yang saya berikan benar dan dapat dipertanggungjawabkan.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white border border-dark-200 cursor-pointer hover:border-primary-500/30 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={form.term_agreement}
                      onChange={(e) => updateForm('term_agreement', e.target.checked)}
                    />
                    <span className="text-sm text-dark-700">
                      Saya telah membaca dan menyetujui Perjanjian Layanan HalalCore.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white border border-dark-200 cursor-pointer hover:border-primary-500/30 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-0.5"
                      checked={form.term_regulator}
                      onChange={(e) => updateForm('term_regulator', e.target.checked)}
                    />
                    <span className="text-sm text-dark-700">
                      Saya memahami bahwa keputusan sertifikasi halal merupakan kewenangan regulator dan bukan kewenangan HalalCore.
                    </span>
                  </label>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !isStep2Valid()}
                    className="btn-success flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Kirim Pengajuan
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
