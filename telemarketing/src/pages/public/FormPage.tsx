import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { submitPublicForm, getProvinces, type Province } from '../../services/teleService';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, Building2, Scale, Beef, MapPin,
  UtensilsCrossed, Droplets, ArrowLeft,
  Send, CheckCircle2, Headphones, GitBranch, MessageCircle,
  Home, Sparkles, Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import loginImg from '../../assets/login.png';

const MAIN_APP_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5173'
  : 'https://halalcore.id';

const SCALE_OPTIONS = [
  { value: 'mikro_kecil', label: 'Mikro / Kecil' },
  { value: 'menengah', label: 'Menengah' },
  { value: 'besar', label: 'Besar' },
];

const CONSULTATION_OPTIONS = [
  { value: 'ONLINE_MEET', label: 'Online Meet (Video Call)', desc: 'Konsultasi tatap muka via Zoom / Google Meet', icon: Headphones },
  { value: 'CHAT', label: 'Chat (WhatsApp)', desc: 'Konsultasi cepat via pesan WhatsApp', icon: MessageCircle },
];

export default function PublicFormPage() {
  const [searchParams] = useSearchParams();
  const sharedBy = searchParams.get('ref') || '';
  const navigate = useNavigate();

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
    is_food_beverage: true,
    branch_count: 1,
    consultation_method: 'ONLINE_MEET',
    address: '',
    agree_contact: true,
  });

  useEffect(() => {
    getProvinces().then((res) => setProvinces(res.data)).catch(() => { });
  }, []);

  const updateForm = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = () =>
    form.name.trim().length > 1 &&
    form.phone.trim().length >= 8 &&
    form.email.trim().length > 3 &&
    form.business_type.trim().length > 1 &&
    form.business_scale !== '' &&
    form.province_id > 0 &&
    form.address.trim().length > 3 &&
    form.consultation_method !== '' &&
    form.branch_count >= 1 &&
    form.agree_contact;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Harap lengkapi semua kolom formulir');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        business_type: form.business_type.trim(),
        business_scale: form.business_scale,
        uses_meat: form.uses_meat,
        province_id: form.province_id,
        is_catering: form.is_catering,
        is_amdk: form.is_amdk,
        is_food_beverage: form.is_food_beverage,
        branch_count: form.branch_count,
        consultation_method: form.consultation_method,
        agreed_terms: true,
        shared_by_id: sharedBy,
        address: form.address.trim(),
      };
      const res = await submitPublicForm(payload);
      setResult(res.data);
      setSubmitted(true);
      toast.success('Formulir konsultasi berhasil diajukan!');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal mengirim formulir konsultasi';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && result) {
    // Confetti particles
    const confettiCount = 30;
    const confettiColors = ['#004033', '#c0a060', '#34d399', '#fbbf24', '#f43f5e', '#60a5fa'];
    const confettiElements = Array.from({ length: confettiCount }).map((_, i) => {
      const size = Math.random() * 8 + 4;
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const delay = Math.random() * 0.4;
      const duration = Math.random() * 2 + 2;
      const startX = Math.random() * 100 - 50;
      const endX = startX + (Math.random() * 80 - 40);
      
      return (
        <motion.div
          key={i}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            left: `calc(50% + ${startX}%)`,
            zIndex: 10,
          }}
          initial={{ y: -20, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ 
            y: 700, 
            x: endX,
            opacity: [1, 1, 0],
            rotate: Math.random() * 360 + 360,
            scale: [1, 1, 0.4]
          }}
          transition={{
            duration: duration,
            delay: delay,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: Math.random() * 2
          }}
        />
      );
    });

    const selectedMethodLabel = CONSULTATION_OPTIONS.find(c => c.value === form.consultation_method)?.label || 'Online Meet';

    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
        {/* Floating animated background blurs */}
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-200/30 rounded-full blur-[100px] pointer-events-none"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold-200/20 rounded-full blur-[100px] pointer-events-none"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Confetti container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiElements}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="glass-card max-w-xl w-full relative overflow-hidden bg-white/90 backdrop-blur-xl border border-white/60 p-8 md:p-12 text-center rounded-[32px] shadow-2xl flex flex-col items-center z-10"
        >
          {/* Logo */}
          <Logo size="md" className="mb-8" clickable={false} />

          {/* Glowing Animated Success Icon */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-500 mb-6 shadow-xl shadow-brand-600/20"
          >
            <div className="absolute inset-0 rounded-3xl bg-brand-500 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight mb-2"
          >
            Konsultasi Berhasil Diajukan!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-dark-600 font-medium leading-relaxed mb-6 max-w-md text-sm"
          >
            Terima kasih <span className="font-extrabold text-brand-700">{form.name}</span>, formulir permohonan konsultasi untuk usaha <span className="font-extrabold text-brand-700">{form.business_type}</span> telah tersimpan di sistem HalalCore.
          </motion.p>

          {/* Details Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-brand-50/50 backdrop-blur-xs border border-brand-100 rounded-2xl p-5 mb-6 text-left space-y-3 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-brand-100/50 pb-2.5">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">ID Konsultasi</span>
              <span className="text-brand-750 text-xs font-mono font-bold bg-white/80 border border-brand-200/50 px-2.5 py-1 rounded-lg">
                {result.form_id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-brand-100/50 pb-2.5">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">Estimasi Rute</span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                result.route_type === 'TELECONFERENCE' 
                  ? 'bg-brand-100 text-brand-700 border border-brand-200/50' 
                  : 'bg-amber-100 text-amber-850 border border-amber-200/50'
              }`}>
                {result.route_type === 'TELECONFERENCE' ? '📞 Rute Reguler' : '📝 Rute Self Declare'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-brand-100/50 pb-2.5">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">Metode Dipilih</span>
              <span className="text-dark-800 text-xs font-bold">
                {selectedMethodLabel}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">Status Permintaan</span>
              <span className="text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 border border-emerald-250/50">
                {result.status}
              </span>
            </div>
          </motion.div>

          {/* Info Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full p-5 rounded-2xl bg-brand-900 text-white text-left shadow-lg shadow-brand-950/20 relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
              <Headphones className="w-32 h-32" />
            </div>
            
            <div className="flex gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                <Headphones className="w-5 h-5 text-gold-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gold-300">Langkah Selanjutnya</p>
                <p className="text-sm font-bold text-white mt-1 leading-snug">Tim Konsultan Kami Akan Segera Menghubungi Anda</p>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed font-medium">
                  Konsultan HalalCore akan mengirimkan pesan WhatsApp ke nomor <span className="font-bold text-gold-200">{form.phone}</span> untuk mengonfirmasi jadwal bimbingan dan menyiapkan berkas konsultasi Anda.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-2.5 py-4 text-sm font-black uppercase tracking-wider shadow-xl shadow-brand-600/10 cursor-pointer font-sans"
          >
            <Home className="w-4 h-4 text-gold-300" /> Kembali ke Beranda
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4 py-8 lg:py-16 relative">
      <Toaster position="top-right" />

      {/* Floating Back to Home button */}
      <div className="absolute top-6 left-8 z-30">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-dark-150 shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </button>
      </div>

      {/* Decorative Blur Spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-60 h-60 bg-gold-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Illustrative Panel & Guide (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 sticky top-8">
          <div className="glass-card p-6 border border-brand-100 flex flex-col gap-5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
            <Logo size="lg" className="mb-2" clickable={true} />

            <div className="relative rounded-2xl overflow-hidden h-48 bg-brand-900/5 border border-brand-100/50">
              <img
                src={loginImg}
                alt="Konsultasi Halal visual"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2.5 py-1 bg-gold-400 text-[#00261f] text-[10px] font-black uppercase rounded-full tracking-wider">
                  Konsultasi Gratis
                </span>
                <h3 className="text-white text-sm font-bold mt-1.5 leading-snug">
                  Bimbingan 100% Online Bersama Tim HalalCore
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-900 uppercase tracking-widest">Keuntungan Konsultasi:</h4>

              <div className="flex gap-3 items-start">
                <div className="w-6.5 h-6.5 rounded-xl flex items-center justify-center text-xs font-bold bg-brand-600 text-white shadow-md shadow-brand-600/10 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-dark-900">Analisis Kesiapan Produk</p>
                  <p className="text-[10px] text-dark-500 font-semibold mt-0.5">Identifikasi bahan baku dan alur produksi untuk memastikan kelayakan sertifikasi.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6.5 h-6.5 rounded-xl flex items-center justify-center text-xs font-bold bg-brand-600 text-white shadow-md shadow-brand-600/10 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-dark-900">Penentuan Rute yang Tepat</p>
                  <p className="text-[10px] text-dark-500 font-semibold mt-0.5">Mengetahui apakah usaha Anda masuk skema Self Declare atau Reguler.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-6.5 h-6.5 rounded-xl flex items-center justify-center text-xs font-bold bg-brand-600 text-white shadow-md shadow-brand-600/10 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-dark-900">Panduan Langkah Demi Langkah</p>
                  <p className="text-[10px] text-dark-500 font-semibold mt-0.5">Dapatkan arahan lengkap dari konsultan berpengalaman tanpa repot.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-100 bg-brand-50/30 p-3.5 rounded-xl border border-brand-550/5">
              <p className="text-[10px] text-brand-850 font-bold uppercase tracking-wider">Butuh Bantuan Langsung?</p>
              <p className="text-[10px] text-dark-500 font-medium mt-1">
                Tim support kami siap menjawab pertanyaan via WhatsApp di <span className="font-bold text-brand-700">0815-6495-5280</span>.
              </p>
            </div>

            <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-500/10">
              <p className="text-[10px] text-amber-850 font-bold uppercase tracking-wider">Ingin Bergabung Sebagai Advisor?</p>
              <p className="text-[10px] text-dark-500 font-medium mt-1">
                Mari berkontribusi dalam ekosistem Halal. <a href={`${MAIN_APP_URL}/register`} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 hover:underline">Daftar Halal Advisor di sini →</a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="w-full lg:col-span-7 flex flex-col gap-6">
          {/* Mobile Header (Hidden on lg) */}
          <div className="lg:hidden text-center mb-4 flex flex-col items-center">
            <Logo size="md" clickable={true} />
            <h1 className="text-2xl font-extrabold text-brand-900 mt-3">Formulir Konsultasi Halal</h1>
            <p className="text-dark-500 text-xs font-medium mt-1">Isi formulir singkat di bawah untuk menjadwalkan sesi bimbingan gratis</p>
          </div>

          {/* Form Header Card */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-md shadow-brand-600/10">
                <Sparkles className="w-5 h-5 text-gold-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-dark-900 leading-tight">Formulir Pengajuan Konsultasi</h2>
                <p className="text-[11px] text-dark-500 font-medium mt-0.5">Sesi konsultasi gratis & pendampingan online terpercaya</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit}>
            <motion.div
              className="glass-card p-6 sm:p-8 border border-brand-100 space-y-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* ─── Bagian 1: Data Kontak ─── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-dark-100 pb-2.5">
                  <User className="w-4 h-4 text-brand-600" />
                  <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">1. Data Pemesan & Kontak</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div className="md:col-span-2">
                    <label className="form-label flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-dark-500" /> Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      placeholder="Masukkan nama lengkap Anda"
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-dark-500" /> No. WhatsApp / Telepon <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      placeholder="Contoh: 08123456789"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                    />
                    <p className="text-[10px] text-dark-400 mt-1">Konsultan akan menghubungi via nomor ini</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-dark-500" /> Email Aktif <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      placeholder="email@contoh.com"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ─── Bagian 2: Profil Usaha ─── */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-dark-100 pb-2.5">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">2. Data Usaha & Lokasi</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Usaha */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-dark-500" /> Nama Usaha / Merek Dagang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      placeholder="Contoh: Bakso Mantap, Keripik Berkah"
                      value={form.business_type}
                      onChange={(e) => updateForm('business_type', e.target.value)}
                    />
                  </div>

                  {/* Skala Usaha */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-dark-500" /> Skala Usaha <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className="form-select animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      value={form.business_scale}
                      onChange={(e) => updateForm('business_scale', e.target.value)}
                    >
                      <option value="">Pilih skala usaha</option>
                      {SCALE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Provinsi */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-dark-500" /> Provinsi Lokasi Usaha <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className="form-select animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      value={form.province_id}
                      onChange={(e) => updateForm('province_id', Number(e.target.value))}
                    >
                      <option value={0}>Pilih provinsi</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Jumlah Cabang */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-dark-500" /> Jumlah Cabang / Outlet
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      placeholder="1"
                      value={form.branch_count}
                      onChange={(e) => updateForm('branch_count', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>

                  {/* Alamat Lengkap */}
                  <div className="md:col-span-2">
                    <label className="form-label flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-dark-500" /> Alamat Lengkap Tempat Usaha / Produksi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      className="form-input resize-none animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                      placeholder="Masukkan alamat jalan, RT/RW, kelurahan, kecamatan, dan kota/kabupaten"
                      value={form.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ─── Bagian 3: Pilihan Metode Konsultasi ─── */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-dark-100 pb-2.5">
                  <Headphones className="w-4 h-4 text-brand-600" />
                  <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">3. Pilihan Metode Konsultasi</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONSULTATION_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = form.consultation_method === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => updateForm('consultation_method', opt.value)}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                            : 'bg-white border-dark-200 hover:border-brand-200'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-dark-900 block">{opt.label}</span>
                          <span className="text-[11px] text-dark-500 font-medium mt-0.5 block">{opt.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── Bagian 4: Karakteristik Produk ─── */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-dark-100 pb-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-brand-600" />
                  <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">4. Karakteristik & Jenis Produk</h3>
                </div>

                <p className="text-[11px] text-dark-500 font-medium">Pilih opsi yang sesuai dengan produk usaha Anda untuk mempermudah analisis awal:</p>

                <div className="grid grid-cols-1 gap-2.5">
                  <label className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${
                    form.is_food_beverage ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
                  }`}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.is_food_beverage}
                      onChange={(e) => updateForm('is_food_beverage', e.target.checked)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-dark-900 block leading-tight">Produk Makanan / Minuman Olahan</span>
                      <span className="text-[10px] text-dark-500 font-medium block">Makanan atau minuman kemasan sederhana / olahan sehari-hari</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${
                    form.uses_meat ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
                  }`}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.uses_meat}
                      onChange={(e) => updateForm('uses_meat', e.target.checked)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <Beef className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-dark-900 block leading-tight">Menggunakan Bahan Olahan Daging / Sembelihan</span>
                      <span className="text-[10px] text-dark-500 font-medium block">Menggunakan daging sapi, ayam, kambing, atau olahan hewani lainnya</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${
                    form.is_catering ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
                  }`}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.is_catering}
                      onChange={(e) => updateForm('is_catering', e.target.checked)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-dark-900 block leading-tight">Catering / Restoran / Rumah Makan / SPPG</span>
                      <span className="text-[10px] text-dark-500 font-medium block">Penyedia hidangan siap saji, kafe, warung makan, atau katering pesta</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${
                    form.is_amdk ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
                  }`}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={form.is_amdk}
                      onChange={(e) => updateForm('is_amdk', e.target.checked)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Droplets className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-dark-900 block leading-tight">Depot Air Minum Isi Ulang / AMDK</span>
                      <span className="text-[10px] text-dark-500 font-medium block">Depot pengisian air minum galon atau pabrik minuman kemasan</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ─── Persetujuan Sederhana ─── */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-50/40 border border-brand-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="form-checkbox mt-0.5"
                    checked={form.agree_contact}
                    onChange={(e) => updateForm('agree_contact', e.target.checked)}
                  />
                  <span className="text-xs font-medium text-dark-700 leading-relaxed">
                    Saya menyatakan data yang saya isi adalah benar dan bersedia dihubungi oleh tim konsultan HalalCore untuk penjadwalan sesi konsultasi sertifikasi halal.
                  </span>
                </label>
              </div>

              {/* ─── Tombol Aksi ─── */}
              <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Batal
                </button>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="btn-primary flex items-center gap-2.5 px-6 sm:px-8 py-3.5 text-sm font-extrabold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-600/15"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-gold-300" /> Jadwalkan Konsultasi Sekarang
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
}
