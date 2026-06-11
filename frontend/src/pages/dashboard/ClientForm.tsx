import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, User, Briefcase, MapPin, Phone, Hash, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';


const clientSchema = z.object({
    nib: z.string().min(13, "NIB must be 13 digits").max(13, "NIB must be 13 digits"),
    nik: z.string().min(16, "NIK must be 16 digits").max(16, "NIK must be 16 digits"),
    business_name: z.string().min(3, "Business Name is required"),
    client_name: z.string().min(3, "Nama Klien is required"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    product_name: z.string().min(3, "Product Name is required"),
    service_type: z.enum(["REGULER", "SELF_DECLARE", "SELF_DECLARE_MANDIRI"]),
    contact_person: z.string().optional(),
    phone: z.string().min(10, "Phone number is required"),
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


    const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            service_type: "REGULER"
        }
    });

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
        } catch (err) {
            console.error(err);
            alert("Failed to save client");
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
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Identitas Pemilik & Klien</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap Klien <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input {...register('client_name')} className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.client_name ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-bold`} placeholder="Nama Sesuai KTP" />
                            </div>
                            {errors.client_name && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.client_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NIK <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input {...register('nik')} className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.nik ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-mono`} placeholder="16 Digit NIK" />
                            </div>
                            {errors.nik && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-2">{errors.nik.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">No. HP / WhatsApp <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input {...register('phone')} className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border ${errors.phone ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none`} placeholder="0812xxxx" />
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NIB <span className="text-red-500">*</span></label>
                            <input {...register('nib')} className={`w-full px-4 py-3 bg-gray-50/50 border ${errors.nib ? 'border-red-300' : 'border-gray-100'} rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none font-mono`} placeholder="13 Digit NIB" />
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
                            <select {...register('service_type')} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none appearance-none font-bold">
                                <option value="REGULER">Reguler (LPH)</option>
                                <option value="SELF_DECLARE">Self Declare Fasilitasi (Gratis)</option>
                                <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                            </select>
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
