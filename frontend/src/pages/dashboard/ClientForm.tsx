import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, User, Briefcase, MapPin, Phone, Hash, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const clientSchema = z.object({
    nib: z.string()
        .min(1, "NIB wajib diisi")
        .regex(/^\d{13}$/, "NIB harus tepat 13 digit angka"),
    nik: z.string()
        .min(1, "NIK wajib diisi")
        .regex(/^\d{16}$/, "NIK harus tepat 16 digit angka"),
    business_name: z.string().min(3, "Nama usaha minimal 3 karakter"),
    client_name: z.string().min(3, "Nama lengkap klien minimal 3 karakter"),
    address: z.string().min(5, "Alamat usaha minimal 5 karakter"),
    product_name: z.string().min(3, "Nama produk minimal 3 karakter"),
    service_type: z.enum(["REGULER", "SELF_DECLARE", "SELF_DECLARE_MANDIRI"]),
    contact_person: z.string().optional(),
    phone: z.string()
        .min(1, "Nomor HP wajib diisi")
        .regex(/^(\+62|62|08)[0-9]{8,13}$/, "Format nomor HP tidak valid (contoh: 08123456789 atau +628123456789)"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [verStatus, setVerStatus] = useState<{ profile: boolean; training: boolean } | null>(null);
    const { user } = useAuthStore();
    const [quotaExhausted, setQuotaExhausted] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            service_type: "REGULER",
            nik: "",
            nib: "",
            phone: "",
        }
    });

    const watchedNik = watch("nik") || "";
    const watchedNib = watch("nib") || "";

    useEffect(() => {
        api.get('/system-settings/public')
            .then(res => {
                const limit = parseInt(res.data.facilitation_quota_limit || '0', 10);
                const used = parseInt(res.data.facilitation_quota_used || '0', 10);
                if (limit - used <= 0) {
                    setQuotaExhausted(true);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const checkVerification = async () => {
            if (user?.role === 'HALAL_ADVISOR') {
                try {
                    // 1. Check Profile Verification
                    const profileRes = await api.get(`/consultant/profile/${user.id}`);
                    const profileVerified = profileRes.data?.is_verified ?? false;

                    // 2. Check Training Graduation
                    const trainingRes = await api.get(`/user-trainings/${user.id}`);
                    const trainings = trainingRes.data || [];
                    const isGraduated = trainings.some((t: any) => t.status === 'LULUS');

                    setVerStatus({ profile: profileVerified, training: isGraduated });
                    setIsVerified(profileVerified && isGraduated);
                } catch (err) {
                    setIsVerified(false);
                }
            } else {
                setIsVerified(true);
            }
        };
        checkVerification();

        if (id) {
            api.get(`/clients/${id}`)
                .then(res => {
                    reset(res.data);
                })
                .finally(() => setInitialLoading(false));
        }
    }, [id, reset, user]);

    const onSubmit = async (data: ClientFormValues) => {
        setLoading(true);
        try {
            if (id) {
                await api.put(`/clients/${id}`, data);
            } else {
                await api.post('/clients', data);
            }
            navigate('/dashboard/clients');
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Gagal menyimpan data klien";
            alert(errMsg);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/clients')} className="p-2 hover:bg-white/50 rounded-xl transition-all">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{id ? 'Edit Data Klien' : 'Registrasi Klien Baru'}</h1>
                    <p className="text-gray-500 font-medium mt-0.5">Lengkapi data pelaku usaha untuk sertifikasi halal</p>
                </div>
            </div>

            {/* Privacy & Data Protection Security Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-700" /> Perlindungan Data Sensitif Klien Terjamin
                        </h4>
                        <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed font-medium">
                            Nomor Induk Kependudukan (NIK) dan informasi kontak klien dienkripsi serta diproteksi ketat sesuai standar regulasi Pelindungan Data Pribadi (UU PDP).
                        </p>
                    </div>
                </div>
                <span className="hidden md:inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-white text-emerald-750 px-2.5 py-1 rounded-lg border border-emerald-200">
                    256-Bit SSL Encrypted
                </span>
            </div>

            {isVerified === false && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-900">Akses Dibatasi</h4>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                            Mohon maaf, Anda belum dapat mendaftarkan klien baru. Pastikan status verifikasi akun Anda <b>{verStatus?.profile ? 'Terverifikasi' : 'Belum Terverifikasi'}</b> dan status kelulusan pelatihan Anda <b>{verStatus?.training ? 'Lulus' : 'Belum Lulus'}</b>.
                            Silakan cek status di <span className="font-bold cursor-pointer underline" onClick={() => navigate('/dashboard/consultant-profile')}>Profil Advisor</span>.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Section: Identitas Pemilik */}
                <div className="glass-panel p-8 space-y-6 shadow-xl border border-white/40">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">Identitas Pemilik & Klien</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Data penanggung jawab usaha sesuai KTP resmi</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap Klien <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    {...register('client_name')} 
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.client_name ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-bold`} 
                                    placeholder="Nama Sesuai KTP" 
                                />
                            </div>
                            {errors.client_name && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.client_name.message}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                                </label>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    watchedNik.length === 16 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {watchedNik.length}/16 Digit
                                </span>
                            </div>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    {...register('nik')} 
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={16}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                                        setValue('nik', val, { shouldValidate: true });
                                    }}
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.nik ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-mono tracking-wider`} 
                                    placeholder="Contoh: 3201012345678901" 
                                />
                            </div>
                            {errors.nik && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.nik.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">No. HP / WhatsApp <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    {...register('phone')} 
                                    type="tel"
                                    inputMode="tel"
                                    maxLength={15}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9+]/g, '').slice(0, 15);
                                        setValue('phone', val, { shouldValidate: true });
                                    }}
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.phone ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none`} 
                                    placeholder="Contoh: 08123456789" 
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.phone.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Section: Data Usaha */}
                <div className="glass-panel p-8 space-y-6 shadow-xl border border-white/40">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Informasi Usaha</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    NIB (Nomor Induk Berusaha) <span className="text-red-500">*</span>
                                </label>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    watchedNib.length === 13 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {watchedNib.length}/13 Digit
                                </span>
                            </div>
                            <input 
                                {...register('nib')} 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={13}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                                    setValue('nib', val, { shouldValidate: true });
                                }}
                                className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.nib ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-mono tracking-wider`} 
                                placeholder="Contoh: 1234567890123" 
                            />
                            {errors.nib && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.nib.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Usaha <span className="text-red-500">*</span></label>
                            <input {...register('business_name')} className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.business_name ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-bold`} placeholder="Contoh: Katering Berkah" />
                            {errors.business_name && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.business_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Produk <span className="text-red-500">*</span></label>
                            <input {...register('product_name')} className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.product_name ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none`} placeholder="Contoh: Keripik Singkong" />
                            {errors.product_name && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.product_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipe Sertifikasi <span className="text-red-500">*</span></label>
                            <select 
                                {...register('service_type')} 
                                onChange={e => {
                                    if (quotaExhausted && e.target.value === "SELF_DECLARE") {
                                        setValue("service_type", "SELF_DECLARE_MANDIRI");
                                    } else {
                                        register('service_type').onChange(e);
                                    }
                                }}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none appearance-none font-bold"
                            >
                                <option value="REGULER">Reguler (LPH)</option>
                                <option value="SELF_DECLARE" disabled={quotaExhausted}>
                                    Self Declare Fasilitasi (Gratis) {quotaExhausted ? "(Kuota Habis)" : ""}
                                </option>
                                <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                            </select>
                            {quotaExhausted && (
                                <p className="text-amber-600 text-[10px] font-bold mt-1.5 ml-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    Tidak ada fasilitasi pembiayaan. Silahkan ajukan melalui skema self declare mandiri.
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Usaha <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                                <textarea {...register('address')} rows={3} className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.address ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none`} placeholder="Alamat lengkap lokasi pengerjaan" />
                            </div>
                            {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.address.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Section: Kontak Tambahan */}
                <div className="glass-panel p-8 space-y-6 shadow-xl border border-white/40">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Phone className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Kontak Tambahan</h3>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PIC / Contact Person (Opsional)</label>
                        <input {...register('contact_person')} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none" placeholder="Nama orang yang bisa dihubungi (jika bukan pemilik)" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/dashboard/clients')} className="px-8 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 font-bold transition-all">
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading || isVerified === false} 
                        className={`px-10 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all ${
                            isVerified === false 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 shadow-none' 
                            : 'bg-brand-900 text-white shadow-brand-100 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Simpan Data Klien
                    </button>
                </div>
            </form>
        </div>
    );
}
