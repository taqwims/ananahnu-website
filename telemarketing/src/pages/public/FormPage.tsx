import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { submitPublicForm, getProvinces, getPendampinganPricing, type Province, type PendampinganPrice } from '../../services/teleService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Mail, Building2, Scale, Beef, MapPin,
  UtensilsCrossed, Droplets, CheckSquare, ArrowRight,
  ArrowLeft, Send, CheckCircle2, Headphones, AlertCircle,
  GitBranch, MessageCircle, Home
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
  { value: 'ONLINE_MEET', label: 'Online Meet (Video Call)', icon: Headphones },
  { value: 'CHAT', label: 'Chat (WhatsApp)', icon: MessageCircle },
];

export default function PublicFormPage() {
  const [searchParams] = useSearchParams();
  const sharedBy = searchParams.get('ref') || '';
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ form_id: string; route_type: string; status: string } | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({});

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
    branch_count: 1,
    consultation_method: 'ONLINE_MEET',
    agreed_terms: false,
    term_data_accuracy: false,
    term_agreement: false,
    term_regulator: false,
    address: '', // Local state for contract address
  });

  const [hasRead, setHasRead] = useState(false);
  const [ipAddress, setIpAddress] = useState('[Merekam IP Address...]');

  // Random and stable details generated once
  const [agreementNum] = useState(() => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HC-${todayStr}-${rand}`;
  });

  const [orderId] = useState(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${rand}`;
  });

  useEffect(() => {
    getProvinces().then((res) => setProvinces(res.data)).catch(() => { });

    // Fetch pendampingan pricing from billing components
    getPendampinganPricing()
      .then((res) => {
        const map: Record<string, number> = {};
        (res.data as PendampinganPrice[]).forEach((p) => {
          map[p.scale_value] = p.amount;
        });
        setPricingMap(map);
      })
      .catch(() => { /* pricing fallback handled in getAgreementDetails */ });

    // Try to fetch public IP for the electronic signature, fail-safe fallback
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress('[Terdeteksi Otomatis oleh Server]'));
  }, []);

  const updateForm = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isStep1Valid = () =>
    form.name &&
    form.phone &&
    form.email &&
    form.business_type &&
    form.business_scale &&
    form.province_id > 0 &&
    form.address.trim().length > 5 &&
    form.consultation_method &&
    form.branch_count >= 1;

  const isStep2Valid = () =>
    hasRead && form.term_data_accuracy && form.term_agreement && form.term_regulator;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // 10px tolerance for pixel rounding
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isBottom) {
      setHasRead(true);
    }
  };

  const getAgreementDetails = () => {
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(today);

    const isSD = !form.uses_meat && !form.is_catering && !form.is_amdk && form.branch_count === 1;

    // Ambil harga jasa pendampingan dari BillingComponent (category: PENDAMPINGAN)
    const priceFromMaster = pricingMap[form.business_scale];

    let nilaiJasa = 'Ditentukan setelah konsultasi';
    let dp = '70%';
    let pelunasan = '30%';

    if (isSD) {
      nilaiJasa = 'Rp 0 (Gratis)';
      dp = '0%';
      pelunasan = '0%';
    } else if (priceFromMaster) {
      nilaiJasa = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(priceFromMaster);
    }

    const provinceName = provinces.find((p) => p.id === form.province_id)?.name || '-';

    const timestamp = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(today) + ' WIB';

    return {
      nilaiJasa,
      dp,
      pelunasan,
      formattedDate,
      provinceName,
      timestamp,
    };
  };

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        const container = document.getElementById('agreement-container');
        if (container && container.scrollHeight <= container.clientHeight) {
          setHasRead(true);
        }
      }, 100);
    }
  }, [step]);

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
        branch_count: form.branch_count,
        consultation_method: form.consultation_method,
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
    // Generate beautiful confetti particles
    const confettiCount = 30;
    const confettiColors = ['#004033', '#c0a060', '#34d399', '#fbbf24', '#f43f5e', '#60a5fa'];
    const confettiElements = Array.from({ length: confettiCount }).map((_, i) => {
      const size = Math.random() * 8 + 4;
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const delay = Math.random() * 0.4;
      const duration = Math.random() * 2 + 2;
      const startX = Math.random() * 100 - 50; // percent offset from center
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
            className="text-3xl font-black text-brand-900 tracking-tight mb-2"
          >
            Pengajuan Berhasil!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-dark-600 font-medium leading-relaxed mb-8 max-w-md text-sm"
          >
            Terima kasih <span className="font-extrabold text-brand-700">{form.name}</span>, data pengajuan sertifikasi halal untuk <span className="font-extrabold text-brand-700">{form.business_type}</span> telah aman tersimpan dalam sistem kami.
          </motion.p>

          {/* Details Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-brand-50/50 backdrop-blur-xs border border-brand-100 rounded-2xl p-5 mb-6 text-left space-y-3.5 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-brand-100/50 pb-2.5">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">ID Pengajuan</span>
              <span className="text-brand-750 text-xs font-mono font-bold bg-white/80 border border-brand-200/50 px-2.5 py-1 rounded-lg">
                {result.form_id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-brand-100/50 pb-2.5">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">Kategori</span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                result.route_type === 'TELECONFERENCE' 
                  ? 'bg-brand-100 text-brand-700 border border-brand-200/50' 
                  : 'bg-amber-100 text-amber-850 border border-amber-200/50'
              }`}>
                {result.route_type === 'TELECONFERENCE' ? '📞 Teleconference' : '📝 Self Declare'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-500 text-xs font-bold uppercase tracking-wider">Status Awal</span>
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
                <p className="text-sm font-bold text-white mt-1 leading-snug">Tim kami akan segera menghubungi Anda</p>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed font-medium">
                  Tim telemarketing kami akan menghubungi nomor <span className="font-bold text-gold-200">{form.phone}</span> via WhatsApp untuk menjadwalkan konsultasi dan melanjutkan verifikasi dokumen.
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

  const details = getAgreementDetails();

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

      {/* Decorative */}
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
                alt="Advisory visual"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-2.5 py-1 bg-gold-400 text-[#00261f] text-[10px] font-black uppercase rounded-full tracking-wider">
                  Panduan Sertifikasi
                </span>
                <h3 className="text-white text-sm font-bold mt-1.5 leading-snug">
                  Proses 100% Online & Terbimbing
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-900 uppercase tracking-widest">Langkah Pengajuan:</h4>

              <div className="flex gap-3">
                <div className={`w-6.5 h-6.5 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10' : 'bg-dark-100 text-dark-500'}`}>
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-dark-900">Data Usaha</p>
                  <p className="text-[10px] text-dark-500 font-semibold mt-0.5">Isi profil dasar, alamat, skala usaha, dan detail produk Anda.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className={`w-6.5 h-6.5 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10' : 'bg-dark-100 text-dark-500'}`}>
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-dark-900">Persetujuan & Tanda Tangan</p>
                  <p className="text-[10px] text-dark-500 font-semibold mt-0.5">Baca kontrak perjanjian layanan secara elektronik dan setujui untuk mengirim pengajuan.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-100 bg-brand-50/30 p-3.5 rounded-xl border border-brand-550/5">
              <p className="text-[10px] text-brand-850 font-bold uppercase tracking-wider">Butuh Bantuan?</p>
              <p className="text-[10px] text-dark-500 font-medium mt-1">
                Tim support kami siap membantu Anda via WhatsApp di <span className="font-bold text-brand-700">0815-6495-5280</span>.
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

        {/* Right Side: Form Wizard Container */}
        <div className="w-full lg:col-span-7 flex flex-col gap-6">
          {/* Mobile Header (Hidden on lg) */}
          <div className="lg:hidden text-center mb-4 flex flex-col items-center">
            <Logo size="md" clickable={true} />
            <h1 className="text-2xl font-extrabold text-brand-900 mt-3">Pengajuan Sertifikasi Halal</h1>
            <p className="text-dark-500 text-xs font-medium mt-1">Isi formulir di bawah untuk memulai proses pendampingan</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm shadow-brand-900/[0.01]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= 1 ? 'bg-gradient-brand text-white shadow-md shadow-brand-600/10' : 'bg-dark-200 text-dark-500'
                }`}>
                1
              </div>
              <div>
                <p className="text-xs font-bold text-dark-900 leading-none">Data Usaha</p>
                <p className="text-[10px] text-dark-400 font-semibold mt-0.5">Profil usaha & alamat</p>
              </div>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-dark-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: step > 1 ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= 2 ? 'bg-gradient-brand text-white shadow-md shadow-brand-600/10' : 'bg-dark-200 text-dark-500'
                }`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold text-dark-900 leading-none">Persetujuan</p>
                <p className="text-[10px] text-dark-400 font-semibold mt-0.5">Kontrak & ttd digital</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            className="glass-card p-8 border border-brand-100"
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
                  <h2 className="text-lg font-bold text-brand-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-500" /> Data Usaha
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nama */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-dark-500" /> Nama Lengkap Pemesan
                      </label>
                      <input
                        type="text"
                        className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                        placeholder="Masukkan nama lengkap Anda"
                        value={form.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-dark-500" /> No. Telepon / WhatsApp
                      </label>
                      <input
                        type="tel"
                        className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                        placeholder="Contoh: 08123456789"
                        value={form.phone}
                        onChange={(e) => updateForm('phone', e.target.value)}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-dark-500" /> Email Aktif
                      </label>
                      <input
                        type="email"
                        className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                        placeholder="email@contoh.com"
                        value={form.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                      />
                    </div>

                    {/* Jenis Usaha */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-dark-500" /> Nama Usaha / Merek Dagang
                      </label>
                      <input
                        type="text"
                        className="form-input animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                        placeholder="Contoh: Bakso Eco, Katering Melati"
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
                    </div>

                    {/* Provinsi */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-dark-500" /> Provinsi Usaha
                      </label>
                      <div className="relative">
                        <select
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
                    </div>

                    {/* Alamat Usaha */}
                    <div className="md:col-span-2">
                      <label className="form-label flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-dark-500" /> Alamat Lengkap Usaha
                      </label>
                      <textarea
                        rows={2}
                        className="form-input resize-none animate-transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5"
                        placeholder="Masukkan alamat lengkap lokasi produksi atau usaha Anda"
                        value={form.address}
                        onChange={(e) => updateForm('address', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Jumlah Cabang & Metode Konsultasi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
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
                      <p className="text-[10px] text-dark-400 font-semibold mt-1">Jumlah cabang mempengaruhi penentuan harga</p>
                    </div>

                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-dark-500" /> Metode Konsultasi
                      </label>
                      <div className="space-y-2">
                        {CONSULTATION_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.consultation_method === opt.value ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
                                }`}
                            >
                              <input
                                type="radio"
                                name="consultation_method"
                                className="form-checkbox"
                                checked={form.consultation_method === opt.value}
                                onChange={() => updateForm('consultation_method', opt.value)}
                              />
                              <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-3.5 h-3.5 text-brand-600" />
                              </div>
                              <span className="text-xs font-bold text-dark-900">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Checkbox Fields */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wider">Informasi Tambahan</p>

                    <label className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.uses_meat ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
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
                        <span className="text-xs font-bold text-dark-900 block leading-tight">Menggunakan Bahan Daging</span>
                        <span className="text-[10px] text-dark-500 font-semibold mt-0.5 block">Centang jika produk Anda menggunakan bahan baku daging sapi/ayam/dsb</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.is_catering ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
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
                        <span className="text-xs font-bold text-dark-900 block leading-tight">Catering / Restoran / SPPG</span>
                        <span className="text-[10px] text-dark-500 font-semibold mt-0.5 block">Penyedia jasa makanan siap saji, warung makan, atau katering</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.is_amdk ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'
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
                        <span className="text-xs font-bold text-dark-900 block leading-tight">Depot Air Minum / AMDK</span>
                        <span className="text-[10px] text-dark-500 font-semibold mt-0.5 block">Depot pengisian ulang air minum atau pabrik air kemasan</span>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => navigate('/')}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </button>
                    <motion.button
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid()}
                      className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                      whileHover={isStep1Valid() ? { scale: 1.02 } : {}}
                      whileTap={isStep1Valid() ? { scale: 0.98 } : {}}
                    >
                      Lanjut <ArrowRight className="w-4 h-4" />
                    </motion.button>
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
                  <h2 className="text-lg font-bold text-brand-900 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand-500" /> Dokumen Perjanjian & Persetujuan
                  </h2>

                  {!hasRead ? (
                    <motion.div
                      initial={{ scale: 0.98 }}
                      animate={{ scale: 1 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold leading-relaxed"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-550 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Perjanjian Belum Selesai Dibaca</p>
                        <p className="text-amber-700 mt-0.5">Silakan baca dokumen perjanjian di bawah dengan men-scroll hingga ke bagian paling bawah untuk membuka kunci opsi persetujuan.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.98 }}
                      animate={{ scale: 1 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-emerald-950 text-xs font-semibold leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-650 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Perjanjian Telah Dibaca</p>
                        <p className="text-emerald-755 mt-0.5">Dokumen telah selesai dibaca. Silakan centang ketiga persetujuan elektronik di bawah untuk melanjutkan pengajuan.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Scrollable Service Agreement Document */}
                  <div
                    id="agreement-container"
                    onScroll={handleScroll}
                    className="h-80 overflow-y-auto border border-dark-200 bg-white rounded-xl p-5 custom-scrollbar text-[11px] text-dark-700 space-y-5 leading-relaxed shadow-inner"
                  >
                    <div className="text-center border-b border-dark-100 pb-4 mb-4">
                      <h3 className="text-xs font-extrabold text-brand-600 uppercase tracking-wide">PERJANJIAN LAYANAN PENDAMPINGAN SERTIFIKASI HALAL</h3>
                      <h4 className="text-[10px] font-bold text-gold-600 tracking-widest mt-1">HALALCORE</h4>
                      <p className="text-[10px] text-dark-500 mt-2">Nomor Perjanjian: <span className="font-mono font-bold text-dark-800">{agreementNum}</span></p>
                      <p className="text-[10px] text-dark-500">Tanggal: <span className="font-bold text-dark-800">{details.formattedDate}</span></p>
                    </div>

                    <div className="space-y-4">
                      {/* Pasal 1 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 1: PARA PIHAK</h4>
                        <p className="mt-1">Perjanjian ini dibuat secara elektronik antara:</p>
                        <div className="mt-2 pl-3 border-l-2 border-brand-500/20 space-y-3">
                          <div>
                            <p className="font-bold text-dark-800 text-[11px]">PIHAK PERTAMA</p>
                            <p className="font-bold text-brand-700 text-[11px]">HALALCORE (PT Ana Nahnu Indonesia)</p>
                            <p className="text-dark-600 mt-0.5">
                              Building Halal Business Excellence. Unit layanan halal advisory yang dikelola oleh PT Ana Nahnu Indonesia.<br />
                              Alamat: Banjarsari – Ciamis – Jawa Barat<br />
                              WhatsApp: 0815-6485-6280 | Instagram: @halalcore.id
                            </p>
                          </div>
                          <div>
                            <p className="font-bold text-dark-800 text-[11px]">PIHAK KEDUA</p>
                            <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-dark-600 mt-1 max-w-md">
                              <span className="font-medium text-dark-500">Nama Usaha:</span>
                              <span className="col-span-2 font-bold text-dark-800">{form.business_type}</span>
                              <span className="font-medium text-dark-500">Penanggung Jawab:</span>
                              <span className="col-span-2 font-bold text-dark-800">{form.name}</span>
                              <span className="font-medium text-dark-500">Alamat:</span>
                              <span className="col-span-2 text-dark-800">{form.address || details.provinceName}</span>
                              <span className="font-medium text-dark-500">Email:</span>
                              <span className="col-span-2 text-dark-800">{form.email}</span>
                              <span className="font-medium text-dark-500">Nomor HP:</span>
                              <span className="col-span-2 text-dark-800">{form.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pasal 2 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 2: MAKSUD DAN TUJUAN</h4>
                        <p className="mt-1">
                          PIHAK KEDUA memesan layanan profesional pendampingan sertifikasi halal kepada PIHAK PERTAMA untuk membantu proses pemenuhan persyaratan sertifikasi halal sesuai regulasi yang berlaku.
                        </p>
                      </div>

                      {/* Pasal 3 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 3: RUANG LINGKUP LAYANAN</h4>
                        <p className="mt-1">Layanan yang diberikan PIHAK PERTAMA meliputi:</p>
                        <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Assessment awal kebutuhan sertifikasi halal.</li>
                          <li>Pendampingan registrasi sertifikasi halal.</li>
                          <li>Pendampingan pengumpulan data teknis.</li>
                          <li>Penyusunan dokumen Sistem Jaminan Produk Halal (SJPH).</li>
                          <li>Sosialisasi kebijakan halal dan implementasi SJPH.</li>
                          <li>Pendampingan audit eksternal oleh LPH.</li>
                          <li>Monitoring proses sidang fatwa halal.</li>
                          <li>Monitoring penerbitan sertifikat halal.</li>
                        </ol>
                      </div>

                      {/* Pasal 4 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 4: NILAI JASA DAN PEMBAYARAN</h4>
                        <div className="mt-1 space-y-1">
                          <p>Nilai Jasa Pendampingan adalah harga yang dibayarkan oleh pihak kedua terhadap pihak pertama untuk semua layanan pendampingan proses sertifikasi halal yang termasuk dalam ruang lingkup Pasal 3. Nilai tersebut tidak termasuk biaya registrasi BPJPH, Ketetapan halal MUI, dan persyaratan lain yang diperlukan yang berdampak pada penambahan biaya.
                          </p>
                          <p>Biaya yang ditagihkan oleh pihak pertama setelah kontrak disetujui adalah biaya pendampingan beserta biaya registrasi BPJPH, ketetapan halal MUI, audit LPH dan biaya lain dari persyaratan yang berdampak pada penambahan biaya.
                          </p>
                          <p>Keseluruhan biaya dapat diketahui setelah konsultasi berlangsung dan akan ditentukan oleh pihak pertama berdasarkan skala usaha, jumlah cabang, dan kompleksitas proses sertifikasi.
                          </p>
                          <p>Nilai jasa pendampingan: <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{details.nilaiJasa}</span></p>
                          <p>Skema pembayaran: <span className="font-bold text-dark-800">{details.dp === '-' ? 'Akan ditentukan setelah konsultasi' : `Tahap I: ${details.dp}% | Tahap II: ${details.pelunasan}%`}</span></p>
                          <p className="text-[10px] text-dark-500 italic">Pembayaran dilakukan melalui rekening resmi atau payment gateway yang ditetapkan HalalCore.</p>
                        </div>
                      </div>

                      {/* Pasal 5 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 5: TAHAPAN PELAKSANAAN</h4>
                        <p className="mt-1">Alur layanan:</p>
                        <div className="mt-2 flex flex-col pl-3 border-l border-dark-200 space-y-1 text-[10px] font-semibold text-brand-800">
                          <span>Kontrak & Registrasi</span>
                          <span className="text-dark-400">↓</span>
                          <span>Pengumpulan Data Teknis</span>
                          <span className="text-dark-400">↓</span>
                          <span>Penyusunan Dokumen SJPH</span>
                          <span className="text-dark-400">↓</span>
                          <span>Implementasi SJPH</span>
                          <span className="text-dark-400">↓</span>
                          <span>Audit Eksternal LPH</span>
                          <span className="text-dark-400">↓</span>
                          <span>Sidang Fatwa Halal</span>
                          <span className="text-dark-400">↓</span>
                          <span>Penerbitan Sertifikat Halal</span>
                        </div>
                      </div>

                      {/* Pasal 6 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 6: KEWAJIBAN PIHAK KEDUA</h4>
                        <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Menyampaikan data usaha yang benar dan lengkap.</li>
                          <li>Menyerahkan dokumen yang diperlukan sesuai permintaan.</li>
                          <li>Menunjuk PIC yang dapat berkoordinasi selama proses pendampingan.</li>
                          <li>Melakukan pembayaran sesuai jadwal yang disepakati.</li>
                          <li>Mendukung implementasi SJPH di lingkungan usaha.</li>
                        </ol>
                      </div>

                      {/* Pasal 7 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 7: KEWAJIBAN PIHAK PERTAMA</h4>
                        <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Memberikan layanan pendampingan secara profesional.</li>
                          <li>Menjaga kerahasiaan data usaha PIHAK KEDUA.</li>
                          <li>Memberikan konsultasi sesuai ruang lingkup layanan.</li>
                          <li>Menginformasikan perkembangan proses sertifikasi halal.</li>
                        </ol>
                      </div>

                      {/* Pasal 8 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 8: KERAHASIAAN DATA</h4>
                        <p className="mt-1">
                          PIHAK PERTAMA wajib menjaga kerahasiaan seluruh data usaha, formula, dokumen, dan informasi bisnis PIHAK KEDUA kecuali diwajibkan oleh regulator atau ketentuan hukum yang berlaku.
                        </p>
                      </div>

                      {/* Pasal 9 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 9: KETENTUAN TIMELINE</h4>
                        <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Timeline proses sertifikasi halal bersifat estimatif.</li>
                          <li>Jadwal audit LPH, sidang fatwa, dan penerbitan sertifikat merupakan kewenangan regulator.</li>
                          <li>Keterlambatan akibat regulator tidak menjadi tanggung jawab PIHAK PERTAMA.</li>
                          <li>Keterlambatan akibat kelalaian atau ketidaksiapan data dari PIHAK KEDUA tidak menjadi tanggung jawab PIHAK PERTAMA.</li>
                        </ol>
                      </div>

                      {/* Pasal 10 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 10: PEMBATALAN DAN PENGEMBALIAN DANA</h4>
                        <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Pembayaran yang telah dilakukan tidak dapat diminta kembali (non-refundable).</li>
                          <li>Pengecualian hanya berlaku apabila terjadi kesalahan material yang disebabkan PIHAK PERTAMA.</li>
                          <li>Apabila PIHAK KEDUA menghentikan proses secara sepihak, seluruh pembayaran yang telah diterima dianggap hangus sebagai biaya jasa yang telah berjalan.</li>
                        </ol>
                      </div>

                      {/* Pasal 11 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 11: BATASAN TANGGUNG JAWAB</h4>
                        <p className="mt-1">PIHAK PERTAMA tidak menjamin:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Sertifikat halal pasti terbit.</li>
                          <li>Jadwal audit tertentu.</li>
                          <li>Jadwal sidang fatwa tertentu.</li>
                          <li>Keputusan regulator tertentu.</li>
                        </ul>
                        <p className="mt-1 text-dark-600">Keputusan sertifikasi halal sepenuhnya menjadi kewenangan regulator yang berwenang.</p>
                      </div>

                      {/* Pasal 12 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 12: FORCE MAJEURE</h4>
                        <p className="mt-1">Keadaan kahar meliputi:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-dark-600">
                          <li>Bencana alam</li>
                          <li>Gangguan sistem nasional</li>
                          <li>Perubahan regulasi</li>
                          <li>Kebijakan pemerintah</li>
                          <li>Keadaan lain di luar kendali para pihak</li>
                        </ul>
                        <p className="mt-1">yang menyebabkan sebagian atau seluruh kewajiban tidak dapat dilaksanakan.</p>
                      </div>

                      {/* Pasal 13 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 13: PERSETUJUAN ELEKTRONIK</h4>
                        <p className="mt-1">Dengan mencentang kotak:</p>
                        <p className="mt-1 font-semibold text-brand-700 bg-brand-50 p-2 rounded border border-brand-100">
                          ☑ Saya telah membaca, memahami, dan menyetujui Perjanjian Layanan HalalCore.
                        </p>
                        <p className="mt-1.5">
                          PIHAK KEDUA dianggap telah memberikan persetujuan yang sah secara elektronik terhadap seluruh isi perjanjian ini. Persetujuan elektronik tersebut memiliki kekuatan hukum yang sama dengan tanda tangan basah sesuai ketentuan peraturan perundang-undangan yang berlaku.
                        </p>
                      </div>

                      {/* Pasal 14 */}
                      <div>
                        <h4 className="font-bold text-brand-900 text-xs uppercase">PASAL 14: PENUTUP</h4>
                        <p className="mt-1">
                          Perjanjian ini mulai berlaku sejak PIHAK KEDUA menyelesaikan proses pemesanan dan pembayaran melalui sistem HalalCore.
                        </p>
                      </div>

                      {/* Data Persetujuan */}
                      <div className="border-t border-dark-200 pt-4 mt-6">
                        <h4 className="font-bold text-brand-900 text-xs uppercase text-center mb-3 tracking-wider">DATA PERSETUJUAN ELEKTRONIK</h4>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[10px] text-dark-600 max-w-md mx-auto">
                          <span className="font-medium text-dark-500">Nama Pemesan:</span>
                          <span className="col-span-2 font-bold text-dark-800">{form.name}</span>
                          <span className="font-medium text-dark-500">Email:</span>
                          <span className="col-span-2 text-dark-800">{form.email}</span>
                          <span className="font-medium text-dark-500">Nomor HP:</span>
                          <span className="col-span-2 text-dark-800">{form.phone}</span>
                          <span className="font-medium text-dark-500">Waktu Persetujuan:</span>
                          <span className="col-span-2 text-dark-800">{details.timestamp}</span>
                          <span className="font-medium text-dark-500">IP Address:</span>
                          <span className="col-span-2 font-mono text-dark-800">{ipAddress}</span>
                          <span className="font-medium text-dark-500">Kode Transaksi:</span>
                          <span className="col-span-2 font-mono text-dark-800">{orderId}</span>
                          <span className="font-medium text-dark-500">Status:</span>
                          <span className="col-span-2 font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 inline-block text-[9px] w-fit">
                            DISETUJUI SECARA ELEKTRONIK
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consents list, gated by hasRead scroll state */}
                  <div className="space-y-3">
                    <label className={
                      hasRead
                        ? `flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.term_data_accuracy ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'}`
                        : "flex items-start gap-3.5 p-4 rounded-xl bg-dark-50 border border-dark-200 cursor-not-allowed opacity-50 transition-all"
                    }>
                      <input
                        type="checkbox"
                        className="form-checkbox mt-0.5"
                        checked={form.term_data_accuracy}
                        disabled={!hasRead}
                        onChange={(e) => updateForm('term_data_accuracy', e.target.checked)}
                      />
                      <span className="text-sm font-bold text-dark-750">
                        Saya menyatakan data yang saya berikan benar.
                      </span>
                    </label>

                    <label className={
                      hasRead
                        ? `flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.term_agreement ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'}`
                        : "flex items-start gap-3.5 p-4 rounded-xl bg-dark-50 border border-dark-200 cursor-not-allowed opacity-50 transition-all"
                    }>
                      <input
                        type="checkbox"
                        className="form-checkbox mt-0.5"
                        checked={form.term_agreement}
                        disabled={!hasRead}
                        onChange={(e) => updateForm('term_agreement', e.target.checked)}
                      />
                      <span className="text-sm font-bold text-dark-750">
                        Saya telah membaca dan menyetujui Perjanjian Layanan HalalCore.
                      </span>
                    </label>

                    <label className={
                      hasRead
                        ? `flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all duration-200 ${form.term_regulator ? 'bg-brand-50/40 border-brand-350 shadow-sm' : 'bg-white border-dark-200'}`
                        : "flex items-start gap-3.5 p-4 rounded-xl bg-dark-50 border border-dark-200 cursor-not-allowed opacity-50 transition-all"
                    }>
                      <input
                        type="checkbox"
                        className="form-checkbox mt-0.5"
                        checked={form.term_regulator}
                        disabled={!hasRead}
                        onChange={(e) => updateForm('term_regulator', e.target.checked)}
                      />
                      <span className="text-sm font-bold text-dark-750">
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
    </div>
  );
}
