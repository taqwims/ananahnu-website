import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Loader2, Save, Lock, UserCircle, Eye, EyeOff, UserCheck, Upload, CheckCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { geographyService } from '../../services/geographyService';
import FileUpload from '../../components/dashboard/FileUpload';
import type { Province, Regency } from '../../types';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DOCUMENTS = [
    { key: 'ktp_url', label: 'KTP', required: true },
    { key: 'photo_3x4_url', label: 'Foto 3x4 Latar Merah', required: true },
    { key: 'ijazah_sta_url', label: 'Ijazah STA', required: true },
    { key: 'bank_account_url', label: 'Buku Rekening', required: true },
    { key: 'npwp_url', label: 'NPWP', required: false },
] as const;

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [regencies, setRegencies] = useState<Regency[]>([]);
    
    const [consultantProfile, setConsultantProfile] = useState<any | null>(null);
    const [consultantForm, setConsultantForm] = useState({
        ktp_url: '', photo_3x4_url: '', ijazah_sta_url: '',
        bank_account_url: '', npwp_url: '',
    });

    const docKey = (key: string) => key as 'ktp_url' | 'photo_3x4_url' | 'ijazah_sta_url' | 'bank_account_url' | 'npwp_url';

    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        address: '',
        province_id: 0,
        regency_id: 0,
        avatar_url: '',
        password: '',
        confirm_password: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [profile, provinceList] = await Promise.all([
                    userService.getProfile(),
                    geographyService.getProvinces()
                ]);
                
                setProvinces(provinceList);
                setForm({
                    full_name: profile.full_name || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    province_id: profile.province_id || 0,
                    regency_id: profile.regency_id || 0,
                    avatar_url: profile.avatar_url || '',
                    password: '',
                    confirm_password: ''
                });

                if (profile.province_id) {
                    const regencyList = await geographyService.getRegencies(profile.province_id);
                    setRegencies(regencyList);
                }

                if (user?.id && (user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER')) {
                    try {
                        const cpRes = await api.get(`/consultant/profile/${user.id}`);
                        setConsultantProfile(cpRes.data);
                        setConsultantForm({
                            ktp_url: cpRes.data.ktp_url || '',
                            photo_3x4_url: cpRes.data.photo_3x4_url || '',
                            ijazah_sta_url: cpRes.data.ijazah_sta_url || '',
                            bank_account_url: cpRes.data.bank_account_url || '',
                            npwp_url: cpRes.data.npwp_url || '',
                        });
                    } catch (e) {
                        console.error("No consultant profile found", e);
                    }
                }
            } catch (err) {
                toast.error('Gagal mengambil data profil');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleProvinceChange = async (provinceId: number) => {
        setForm(prev => ({ ...prev, province_id: provinceId, regency_id: 0 }));
        if (provinceId) {
            try {
                const regencyList = await geographyService.getRegencies(provinceId);
                setRegencies(regencyList);
            } catch (err) {
                toast.error('Gagal mengambil data kabupaten/kota');
            }
        } else {
            setRegencies([]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (form.password && form.password !== form.confirm_password) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }

        setSaving(true);
        try {
            const updateData: any = {
                full_name: form.full_name,
                phone: form.phone,
                address: form.address,
                province_id: Number(form.province_id),
                regency_id: Number(form.regency_id),
                avatar_url: form.avatar_url,
            };

            if (form.password) {
                updateData.password = form.password;
            }

            await userService.updateProfile(updateData);
            
            // Update local auth store
            updateUser({
                full_name: form.full_name,
                phone: form.phone,
                address: form.address,
                province_id: Number(form.province_id),
                regency_id: Number(form.regency_id),
                avatar_url: form.avatar_url,
            });

            // Save consultant profile details if advisor/manager
            if (user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER') {
                await api.put('/consultant/profile', { ...consultantForm, user_id: user.id });
                const cpRes = await api.get(`/consultant/profile/${user.id}`);
                setConsultantProfile(cpRes.data);
            }

            toast.success('Profil berhasil diperbarui');
            setForm(prev => ({ ...prev, password: '', confirm_password: '' }));
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal memperbarui profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profil Saya</h1>
                    <p className="text-gray-500 font-medium">Kelola informasi pribadi dan pengaturan akun Anda</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - General Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-panel p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <UserCircle className="w-6 h-6 text-brand-600" />
                            <h2 className="text-lg font-bold text-gray-800">Informasi Pribadi</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="glass-input pl-11"
                                        placeholder="Contoh: Budi Santoso"
                                        value={form.full_name}
                                        onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Nomor Telepon / WhatsApp</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                                    <input
                                        type="tel"
                                        required
                                        className="glass-input pl-11"
                                        placeholder="Contoh: 08123456789"
                                        value={form.phone}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-bold text-gray-700">Alamat Lengkap</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                                    <textarea
                                        rows={3}
                                        className="glass-input pl-11 py-3"
                                        placeholder="Jl. Merdeka No. 123..."
                                        value={form.address}
                                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Provinsi Domisili</label>
                                <select
                                    required
                                    className="glass-input"
                                    value={form.province_id}
                                    onChange={e => handleProvinceChange(Number(e.target.value))}
                                >
                                    <option value={0}>Pilih Provinsi</option>
                                    {provinces.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Kabupaten/Kota Domisili</label>
                                <select
                                    required
                                    disabled={!form.province_id}
                                    className="glass-input disabled:opacity-50"
                                    value={form.regency_id}
                                    onChange={e => setForm(p => ({ ...p, regency_id: Number(e.target.value) }))}
                                >
                                    <option value={0}>Pilih Kabupaten/Kota</option>
                                    {regencies.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <Lock className="w-6 h-6 text-brand-600" />
                            <h2 className="text-lg font-bold text-gray-800">Keamanan</h2>
                        </div>
                        
                        <p className="text-sm text-gray-500 bg-brand-50 p-4 rounded-xl border border-brand-100">
                            Kosongkan kolom password jika tidak ingin mengubah password saat ini.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Password Baru</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="glass-input pr-12"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Konfirmasi Password Baru</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="glass-input pr-12"
                                        placeholder="••••••••"
                                        value={form.confirm_password}
                                        onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {(user?.role === 'HALAL_ADVISOR' || user?.role === 'HALAL_MANAGER') && (
                        <div className="glass-panel p-8 space-y-6">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <UserCheck className="w-6 h-6 text-brand-600" />
                                <h2 className="text-lg font-bold text-gray-800">Profil Advisor Halal</h2>
                            </div>

                            {/* Status Banner */}
                            <div className={`p-4 flex items-center gap-3 rounded-2xl ${consultantProfile?.is_verified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                                {consultantProfile?.is_verified ? (
                                    <>
                                        <Shield className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">Profil Terverifikasi</span>
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5 text-yellow-600" />
                                        <span className="text-sm font-medium text-yellow-800">
                                            Menunggu Verifikasi — {DOCUMENTS.filter(d => consultantForm[docKey(d.key)]).length}/{DOCUMENTS.length} dokumen terisi
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Document Upload Form */}
                            <div className="space-y-5">
                                {DOCUMENTS.map(doc => (
                                    <div key={doc.key} className="space-y-1">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Upload className="w-4 h-4 text-brand-500" />
                                            {doc.label}
                                            {doc.required ? (
                                                <span className="text-red-500 text-xs">*wajib</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">(opsional)</span>
                                            )}
                                            {consultantForm[docKey(doc.key)] && (
                                                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                            )}
                                        </label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    className="glass-input text-sm"
                                                    placeholder="URL dokumen atau upload file"
                                                    value={consultantForm[docKey(doc.key)]}
                                                    onChange={e => setConsultantForm(p => ({ ...p, [doc.key]: e.target.value }))}
                                                />
                                            </div>
                                            <div className="sm:w-48">
                                                <FileUpload 
                                                    subfolder="consultant" 
                                                    label={`Upload ${doc.label}`}
                                                    onUploadSuccess={(url) => setConsultantForm(p => ({ ...p, [doc.key]: url }))}
                                                />
                                            </div>
                                        </div>
                                        {consultantForm[docKey(doc.key)] && (
                                            <a href={consultantForm[docKey(doc.key)].startsWith('http') ? consultantForm[docKey(doc.key)] : `${import.meta.env.VITE_API_URL}${consultantForm[docKey(doc.key)]}`} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                Lihat dokumen →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Status & Action */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 space-y-6">
                        <div className="text-center space-y-4">
                            <div className="relative group/avatar mx-auto w-24 h-24">
                                <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center border-2 border-brand-100 shadow-inner overflow-hidden">
                                    {form.avatar_url ? (
                                        <img src={form.avatar_url.startsWith('http') ? form.avatar_url : `${import.meta.env.VITE_API_URL}${form.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-16 h-16 text-brand-600" />
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2">
                                    <FileUpload 
                                        subfolder="avatars" 
                                        label="" 
                                        onUploadSuccess={(url) => setForm(p => ({ ...p, avatar_url: url }))}
                                        className="!p-1 !h-10 !w-10 !rounded-full shadow-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-gray-800">{user?.full_name}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{user?.role?.replace(/_/g, ' ')}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full glass-button py-4 flex items-center justify-center gap-3 text-base font-black shadow-xl shadow-brand-200"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h4 className="text-sm font-black text-gray-800 mb-4 uppercase tracking-wider">Email Akun</h4>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="text-sm font-bold text-gray-600 truncate">{user?.email}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 italic">*Email tidak dapat diubah secara mandiri.</p>
                    </div>
                </div>
            </form>
        </div>
    );
}
