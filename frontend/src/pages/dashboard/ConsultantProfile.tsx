import { useState, useEffect } from 'react';
import { UserCheck, Upload, CheckCircle, Loader2, Shield } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { ConsultantProfile as ConsultantProfileType } from '../../types';
import FileUpload from '../../components/dashboard/FileUpload';

const DOCUMENTS = [
    { key: 'ktp_url', label: 'KTP', required: true },
    { key: 'photo_3x4_url', label: 'Foto 3x4 Latar Merah', required: true },
    { key: 'ijazah_sta_url', label: 'Ijazah STA', required: true },
    { key: 'bank_account_url', label: 'Buku Rekening', required: true },
    { key: 'npwp_url', label: 'NPWP', required: false },
] as const;

export default function ConsultantProfilePage() {
    const user = useAuthStore(state => state.user);
    const [profile, setProfile] = useState<ConsultantProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        ktp_url: '', photo_3x4_url: '', ijazah_sta_url: '',
        bank_account_url: '', npwp_url: '',
    });

    useEffect(() => {
        if (!user?.id) return;
        api.get(`/consultant/profile/${user.id}`)
            .then(res => {
                setProfile(res.data);
                setForm({
                    ktp_url: res.data.ktp_url || '',
                    photo_3x4_url: res.data.photo_3x4_url || '',
                    ijazah_sta_url: res.data.ijazah_sta_url || '',
                    bank_account_url: res.data.bank_account_url || '',
                    npwp_url: res.data.npwp_url || '',
                });
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/consultant/profile', { ...form, user_id: user?.id });
            const res = await api.get(`/consultant/profile/${user?.id}`);
            setProfile(res.data);
            alert('Profil berhasil disimpan');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menyimpan profil');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const completedDocs = DOCUMENTS.filter(d => form[d.key as keyof typeof form]);
    const requiredDocs = DOCUMENTS.filter(d => d.required);
    const completedRequired = requiredDocs.filter(d => form[d.key as keyof typeof form]);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-brand-600" />
                    Profil Konsultan Halal
                </h1>
                <p className="text-sm text-gray-500 mt-1">Lengkapi dokumen rekrutmen Anda</p>
            </div>

            {/* Status Banner */}
            <div className={`glass-panel p-4 flex items-center gap-3 ${profile?.is_verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                {profile?.is_verified ? (
                    <>
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Profil Terverifikasi</span>
                    </>
                ) : (
                    <>
                        <Shield className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                            Menunggu Verifikasi — {completedRequired.length}/{requiredDocs.length} dokumen wajib terisi
                        </span>
                    </>
                )}
            </div>

            {/* Progress */}
            <div className="glass-panel p-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Kelengkapan Dokumen</span>
                    <span>{completedDocs.length}/{DOCUMENTS.length}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                        style={{ width: `${(completedDocs.length / DOCUMENTS.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Document Upload Form */}
            <div className="glass-panel p-6 space-y-5">
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
                            {form[doc.key as keyof typeof form] && (
                                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                            )}
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className="glass-input text-sm"
                                    placeholder="URL dokumen atau upload file"
                                    value={form[doc.key as keyof typeof form]}
                                    onChange={e => setForm(p => ({ ...p, [doc.key]: e.target.value }))}
                                />
                            </div>
                            <div className="sm:w-48">
                                <FileUpload 
                                    subfolder="consultant" 
                                    label={`Upload ${doc.label}`}
                                    onUploadSuccess={(url) => setForm(p => ({ ...p, [doc.key]: url }))}
                                />
                            </div>
                        </div>
                        {form[doc.key as keyof typeof form] && (
                            <a href={form[doc.key as keyof typeof form].startsWith('http') ? form[doc.key as keyof typeof form] : `${import.meta.env.VITE_API_URL}${form[doc.key as keyof typeof form]}`} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                Lihat dokumen →
                            </a>
                        )}
                    </div>
                ))}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full glass-button py-3 flex items-center justify-center gap-2 font-bold mt-4"
                >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    Simpan Profil
                </button>
            </div>
        </div>
    );
}
