import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Building, Phone, MapPin, Loader2, ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';
import api from '../../services/api';

const registerSchema = z.object({
    full_name: z.string().min(3, "Nama lengkap harus diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.enum(["HALAL_KONSULTAN", "CLIENT"]),
    business_name: z.string().optional(),
    nib: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    facilitator_id: z.string().optional(),
}).refine(data => {
    if (data.role === 'CLIENT' && !data.business_name) return false;
    return true;
}, {
    message: "Nama Bisnis wajib diisi untuk Klien",
    path: ["business_name"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [facilitators, setFacilitators] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'CLIENT'
        }
    });

    useEffect(() => {
        api.get('/auth/facilitators').then(res => setFacilitators(res.data || [])).catch(() => {});
    }, []);

    const selectedRole = watch('role');

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError('');
        try {
            await api.post('/auth/register', data);
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
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-panel p-8 text-center"
                >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrasi Berhasil!</h2>
                    <p className="text-gray-500 mb-6">Akun Anda telah berhasil dibuat. Mengalihkan Anda ke halaman login...</p>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50/50">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-300 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-40 -left-20 w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-20"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full glass-panel p-8 md:p-12 shadow-2xl border border-white/50"
            >
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/login')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Daftar Akun Baru</h1>
                        <p className="text-gray-500 text-sm">Mulai perjalanan sertifikasi halal Anda bersama kami</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold border border-red-100 flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => {}} // Controlled by register
                            className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                selectedRole === 'CLIENT' 
                                ? 'border-brand-600 bg-brand-50/50 ring-4 ring-brand-600/10' 
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <input {...register('role')} type="radio" value="CLIENT" className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Building className={`w-6 h-6 ${selectedRole === 'CLIENT' ? 'text-brand-600' : 'text-gray-400'}`} />
                            <span className={`text-xs font-black uppercase tracking-widest ${selectedRole === 'CLIENT' ? 'text-brand-700' : 'text-gray-500'}`}>Klien / UMKM</span>
                        </button>
                        <button
                            type="button"
                            className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                selectedRole === 'HALAL_KONSULTAN' 
                                ? 'border-brand-600 bg-brand-50/50 ring-4 ring-brand-600/10' 
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <input {...register('role')} type="radio" value="HALAL_KONSULTAN" className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Briefcase className={`w-6 h-6 ${selectedRole === 'HALAL_KONSULTAN' ? 'text-brand-600' : 'text-gray-400'}`} />
                            <span className={`text-xs font-black uppercase tracking-widest ${selectedRole === 'HALAL_KONSULTAN' ? 'text-brand-700' : 'text-gray-500'}`}>Konsultan</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input {...register('full_name')} placeholder="Masukkan nama lengkap" className="glass-input pl-11" />
                                </div>
                                {errors.full_name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.full_name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input {...register('email')} type="email" placeholder="nama@email.com" className="glass-input pl-11" />
                                </div>
                                {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input {...register('password')} type="password" placeholder="••••••••" className="glass-input pl-11" />
                                </div>
                                {errors.password && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                {selectedRole === 'CLIENT' ? (
                                    <motion.div
                                        key="client-fields"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Bisnis / Perusahaan</label>
                                            <div className="relative">
                                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input {...register('business_name')} placeholder="Contoh: PT Berkah Halal" className="glass-input pl-11" />
                                            </div>
                                            {errors.business_name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.business_name.message}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fasilitator / Pendamping</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <select {...register('facilitator_id')} className="glass-input pl-11">
                                                    <option value="">-- Pilih Fasilitator --</option>
                                                    {facilitators.map(f => (
                                                        <option key={f.id} value={f.id}>{f.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nomor NIB (Opsional)</label>
                                            <div className="relative">
                                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input {...register('nib')} placeholder="Masukkan nomor NIB" className="glass-input pl-11" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="consultant-fields"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="p-6 rounded-2xl bg-brand-50/50 border border-brand-100">
                                            <h4 className="text-sm font-black text-brand-700 mb-2">Pendaftaran Konsultan</h4>
                                            <p className="text-xs text-brand-600 leading-relaxed">
                                                Setelah mendaftar, Anda akan diminta untuk melengkapi profil profesional dan dokumen pendukung seperti KTP dan Sertifikat Pelatihan.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nomor WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input {...register('phone')} placeholder="0812xxxx" className="glass-input pl-11" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Domisili</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input {...register('address')} placeholder="Kota, Provinsi" className="glass-input pl-11" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-brand-900 text-white rounded-2xl font-black shadow-xl shadow-brand-100 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Daftar Sekarang
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500 font-medium">
                        Sudah punya akun?{" "}
                        <button onClick={() => navigate('/login')} className="text-brand-600 font-black hover:underline underline-offset-4">Masuk di sini</button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
