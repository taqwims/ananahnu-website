import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Loader2, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Star, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import Logo from '../../components/ui/Logo';
import loginBg from '../../assets/login.png';

const registerSchema = z.object({
    full_name: z.string().min(3, "Nama lengkap harus diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirm_password: z.string().min(6, "Konfirmasi password harus diisi"),
    role: z.literal("HALAL_ADVISOR"),
    province_id: z.string().min(1, "Provinsi harus dipilih"),
    regency_id: z.string().min(1, "Kota/Kabupaten harus dipilih"),
    address: z.string().min(5, "Alamat lengkap harus diisi"),
    phone: z.string().min(10, "Nomor WhatsApp tidak valid").transform((val) => {
        let cleaned = val.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '62' + cleaned;
        }
        return cleaned;
    }),
    referral_code: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
    message: "Password tidak cocok",
    path: ["confirm_password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [regencies, setRegencies] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(1);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'HALAL_ADVISOR'
        }
    });

    const selectedProvince = watch('province_id');

    useEffect(() => {
        api.get('/geography/provinces').then(res => setProvinces(res.data || []));
    }, []);

    useEffect(() => {
        if (selectedProvince) {
            api.get(`/geography/regencies/${selectedProvince}`).then(res => setRegencies(res.data || []));
            setValue('regency_id', '');
        } else {
            setRegencies([]);
        }
    }, [selectedProvince, setValue]);

    const nextStep = async () => {
        let fieldsToValidate: (keyof RegisterFormValues)[] = [];
        if (currentStep === 1) fieldsToValidate = ['full_name', 'email', 'password', 'confirm_password'];
        if (currentStep === 2) fieldsToValidate = ['phone'];

        const isStepValid = await trigger(fieldsToValidate);
        if (isStepValid) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError('');
        try {
            // Strip confirm_password — backend tidak mengharapkan field ini
            const { confirm_password: _omit, ...payload } = data;
            await api.post('/auth/register', payload);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registrasi gagal. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-brand-50/30">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white p-12 text-center rounded-[32px] shadow-2xl border border-gray-100"
                >
                    <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Registrasi Berhasil!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        Akun Anda telah berhasil dibuat. Kami sedang menyiapkan dashboard untuk Anda. Mohon tunggu sebentar...
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-600/50">Mengalihkan ke Login</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Side: Brand & Hero */}
            <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-brand-700 relative overflow-hidden p-12 flex-col justify-between">
                {/* Background Image with Overlay */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <img
                        src={loginBg}
                        alt="Background"
                        className="w-full h-full object-cover opacity-20 mix-blend-overlay"
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600/90 via-brand-700/80 to-transparent"></div>
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-500 rounded-full blur-[120px] opacity-30"></div>
                </div>

                <div className="relative z-10">
                    <div className="mb-16 flex justify-center">
                        <Logo size="xl" variant="white" />
                    </div>

                    <div className="space-y-6 text-center flex flex-col items-center">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl font-black text-white leading-[1.1] tracking-tight"
                        >
                            Daftar <br />
                            <span className="text-gold-400 font-serif italic font-normal">Pendamping Halal</span> <br />
                            Nasional.
                        </motion.h1>
                        <p className="text-brand-50 text-lg font-medium leading-relaxed max-w-sm">
                            Platform ekosistem halal terintegrasi untuk mendukung pertumbuhan ekonomi umat.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 space-y-8 flex flex-col items-center">
                    <div className="space-y-4 w-full max-w-xs">
                        {[
                            { icon: CheckCircle2, text: "Jaringan 10.000+ Pelaku Usaha" },
                            { icon: ShieldCheck, text: "Sistem Verifikasi Digital Terpadu" },
                            { icon: Star, text: "Insentif & Sertifikasi Profesional" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center gap-3 text-white/90 font-bold text-sm"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg shrink-0">
                                    <item.icon className="w-4 h-4 text-gold-400" />
                                </div>
                                <span>{item.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/10 w-full flex flex-col items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-600 bg-brand-200 overflow-hidden shadow-xl">
                                        <img src={`https://i.pravatar.cc/150?u=halal${i}`} alt="user" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-white font-black text-sm">500+ Advisor</p>
                                <p className="text-brand-200 text-[10px] font-bold uppercase tracking-widest">Telah Bergabung</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-gray-50/30 relative">
                <div className="max-w-md w-full">
                    {/* Mobile Logo */}
                    <div className="md:hidden mb-12 flex justify-center">
                        <Logo size="lg" />
                    </div>

                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors mb-6 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Beranda
                    </Link>

                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-[10px] font-black uppercase tracking-widest mb-4 mx-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse"></span>
                            Portal Pendaftaran
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Buat Akun Baru</h2>
                        <p className="text-gray-500 font-medium">Langkah mudah untuk menjadi bagian dari Halal Core.</p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-3 mb-12">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${currentStep === s
                                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-100 scale-110'
                                    : currentStep > s
                                        ? 'bg-brand-100 text-brand-600'
                                        : 'bg-white border border-gray-200 text-gray-400'
                                    }`}>
                                    {currentStep > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && <div className={`w-8 h-0.5 rounded-full ${currentStep > s ? 'bg-brand-600' : 'bg-gray-200'}`}></div>}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 flex items-center gap-3"
                        >
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="min-h-[400px] flex flex-col">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                            <input {...register('full_name')} placeholder="Masukkan nama sesuai KTP" className="glass-input pl-12 h-14 bg-white/50" />
                                        </div>
                                        {errors.full_name && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.full_name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Email <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                            <input {...register('email')} type="email" placeholder="nama@email.com" className="glass-input pl-12 h-14 bg-white/50" />
                                        </div>
                                        {errors.email && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.email.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Password <span className="text-red-500">*</span></label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                                <input
                                                    {...register('password')}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="glass-input pl-12 pr-12 h-14 bg-white/50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.password.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Konfirmasi <span className="text-red-500">*</span></label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                                <input
                                                    {...register('confirm_password')}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="glass-input pl-12 pr-12 h-14 bg-white/50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {errors.confirm_password && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.confirm_password.message}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nomor WhatsApp <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                            <input {...register('phone')} placeholder="08123456xxxx" className="glass-input pl-12 h-14 bg-white/50" />
                                        </div>
                                        {errors.phone && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.phone.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Kode Referral (Opsional)</label>
                                        <div className="relative group">
                                            <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                            <input {...register('referral_code')} placeholder="Masukkan kode referral jika ada" className="glass-input pl-12 h-14 bg-white/50" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium ml-1">Gunakan kode referral dari rekan Anda untuk benefit khusus.</p>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-gold-50 border border-gold-100 shadow-sm shadow-gold-100">
                                        <div className="flex items-center gap-2 mb-2 text-gold-700">
                                            <ShieldCheck className="w-4 h-4" />
                                            <h4 className="text-xs font-black uppercase tracking-wider">Verifikasi Keamanan</h4>
                                        </div>
                                        <p className="text-[11px] text-gold-700/80 leading-relaxed font-medium">
                                            Pastikan nomor WhatsApp aktif untuk menerima kode verifikasi status pendaftaran Anda secara real-time.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Provinsi <span className="text-red-500">*</span></label>
                                            <select {...register('province_id')} className="glass-input h-14 bg-white/50 text-sm font-bold">
                                                <option value="">Pilih Provinsi</option>
                                                {provinces.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            {errors.province_id && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.province_id.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Kota/Kabupaten <span className="text-red-500">*</span></label>
                                            <select {...register('regency_id')} className="glass-input h-14 bg-white/50 text-sm font-bold disabled:opacity-50" disabled={!selectedProvince}>
                                                <option value="">Pilih Kota/Kab</option>
                                                {regencies.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                            {errors.regency_id && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.regency_id.message}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Lengkap <span className="text-red-500">*</span></label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
                                            <input {...register('address')} placeholder="Jl. Nama Jalan, No. Rumah, RT/RW" className="glass-input pl-12 h-14 bg-white/50" />
                                        </div>
                                        {errors.address && <p className="text-red-500 text-[10px] mt-2 font-bold ml-1">{errors.address.message}</p>}
                                    </div>

                                    <div className="p-6 rounded-2xl bg-brand-50 border border-brand-100 shadow-sm shadow-brand-100">
                                        <div className="flex items-center gap-2 mb-2 text-brand-700">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <h4 className="text-xs font-black uppercase tracking-wider">Hampir Selesai!</h4>
                                        </div>
                                        <p className="text-[11px] text-brand-700/80 leading-relaxed font-medium">
                                            Dengan menekan tombol daftar, Anda menyetujui syarat dan ketentuan sebagai Advisor Pendamping Halal.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 flex items-center gap-4">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    Lanjutkan
                                    <ArrowRight className="w-5 h-5 text-gold-400" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Selesaikan Pendaftaran
                                            <ArrowRight className="w-5 h-5 text-gold-400" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 font-medium">
                            Sudah memiliki akun?{" "}
                            <button onClick={() => navigate('/login')} className="text-brand-600 font-black hover:underline underline-offset-4 decoration-2">Masuk Sekarang</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
