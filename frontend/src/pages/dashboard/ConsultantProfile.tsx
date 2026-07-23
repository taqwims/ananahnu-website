import { useState, useEffect } from 'react';
import { UserCheck, Upload, CheckCircle, Loader2, Shield, FileText, Calendar, Link as LinkIcon, Hash } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { ConsultantProfile as ConsultantProfileType, FormFieldConfig } from '../../types';
import FileUpload from '../../components/dashboard/FileUpload';
import toast from 'react-hot-toast';

export default function ConsultantProfilePage() {
    const user = useAuthStore(state => state.user);
    const [profile, setProfile] = useState<ConsultantProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<FormFieldConfig[]>([]);
    
    // Store values mapped by field_key
    const [values, setValues] = useState<Record<string, string>>({});
    const [activeStepNum, setActiveStepNum] = useState<number>(1);

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);

        Promise.all([
            api.get(`/consultant/profile/${user.id}`).catch(() => null),
            // Ambil hanya field aktif dari form config RECRUITMENT
            api.get('/form-config/RECRUITMENT').catch(() => ({ data: [] }))
        ]).then(([profileRes, configRes]) => {
            const cp: ConsultantProfileType | null = profileRes?.data || null;
            if (cp) {
                setProfile(cp);
            }

            const cfgs: FormFieldConfig[] = configRes.data || [];
            setConfigs(cfgs);

            // Parse dynamic_data JSON from backend profile
            let dynData: Record<string, string> = {};
            if (cp?.dynamic_data) {
                try {
                    dynData = JSON.parse(cp.dynamic_data);
                } catch (e) {
                    console.error('Failed to parse dynamic_data:', e);
                }
            }

            // Populate form values: prioritaskan dynamic_data, lalu fallback ke legacy fields
            const valMap: Record<string, string> = {};
            cfgs.forEach(cfg => {
                const k = cfg.field_key;
                if (dynData[k] !== undefined && dynData[k] !== '') {
                    valMap[k] = dynData[k];
                } else {
                    // Fallback ke legacy fields dari ConsultantProfile untuk kompatibilitas data lama
                    switch (k) {
                        case 'ktp':           valMap[k] = cp?.ktp_url || ''; break;
                        case 'foto_3x4':      valMap[k] = cp?.photo_3x4_url || ''; break;
                        case 'ijazah_sta':    valMap[k] = cp?.ijazah_sta_url || ''; break;
                        case 'buku_rekening': valMap[k] = cp?.bank_account_url || ''; break;
                        case 'npwp':          valMap[k] = cp?.npwp_url || ''; break;
                        default:              valMap[k] = '';
                    }
                }
            });
            setValues(valMap);
        }).finally(() => setLoading(false));
    }, [user?.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Semua nilai disimpan secara dinamis ke dynamic_data JSON
            const dynamicObj: Record<string, string> = {};
            configs.forEach(cfg => {
                dynamicObj[cfg.field_key] = values[cfg.field_key] || '';
            });

            // Payload: selain dynamic_data, tetap isi legacy fields
            // untuk kompatibilitas mundur dengan data yang sudah ada
            const payload: any = {
                user_id: user?.id,
                ktp_url: dynamicObj['ktp'] || profile?.ktp_url || '',
                photo_3x4_url: dynamicObj['foto_3x4'] || profile?.photo_3x4_url || '',
                ijazah_sta_url: dynamicObj['ijazah_sta'] || profile?.ijazah_sta_url || '',
                bank_account_url: dynamicObj['buku_rekening'] || profile?.bank_account_url || '',
                npwp_url: dynamicObj['npwp'] || profile?.npwp_url || '',
                dynamic_data: JSON.stringify(dynamicObj)
            };

            await api.put('/consultant/profile', payload);
            const res = await api.get(`/consultant/profile/${user?.id}`);
            setProfile(res.data);
            toast.success('Profil rekrutmen berhasil disimpan');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan profil');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    // Group configs by step
    const stepsMap = configs.reduce((acc, cfg) => {
        const stepNum = cfg.step_number || 1;
        const stepName = cfg.step_name || `Step ${stepNum}`;
        if (!acc[stepNum]) {
            acc[stepNum] = { step_number: stepNum, step_name: stepName, fields: [] };
        }
        if (cfg.step_name && acc[stepNum].step_name === `Step ${stepNum}`) {
            acc[stepNum].step_name = cfg.step_name;
        }
        acc[stepNum].fields.push(cfg);
        return acc;
    }, {} as Record<number, { step_number: number; step_name: string; fields: FormFieldConfig[] }>);

    const steps = Object.values(stepsMap).sort((a, b) => a.step_number - b.step_number);
    steps.forEach(step => {
        step.fields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });

    const activeStepObj = stepsMap[activeStepNum] || steps[0] || { step_number: 1, step_name: 'Step 1', fields: configs };
    const currentFields = activeStepObj.fields || configs;

    const completedFields = configs.filter(c => values[c.field_key]?.trim());
    const requiredFields = configs.filter(c => c.is_required);
    const completedRequired = requiredFields.filter(c => values[c.field_key]?.trim());

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-brand-600" />
                    Profil Advisor Halal
                </h1>
                <p className="text-sm text-gray-500 mt-1">Lengkapi dokumen rekrutmen Anda sesuai formulir rekrutmen</p>
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
                            Menunggu Verifikasi — {completedRequired.length}/{requiredFields.length} dokumen wajib terisi
                        </span>
                    </>
                )}
            </div>

            {/* Progress */}
            <div className="glass-panel p-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Kelengkapan Form Rekrutmen</span>
                    <span>{completedFields.length}/{configs.length}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                        style={{ width: `${configs.length > 0 ? (completedFields.length / configs.length) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Step Tabs Navigation if multiple steps */}
            {steps.length > 1 && (
                <div className="flex gap-2 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
                    {steps.map(step => {
                        const isActive = step.step_number === activeStepNum;
                        const stepCompletedReq = step.fields.filter(f => f.is_required && values[f.field_key]?.trim()).length;
                        const stepTotalReq = step.fields.filter(f => f.is_required).length;
                        return (
                            <button
                                key={step.step_number}
                                onClick={() => setActiveStepNum(step.step_number)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-brand-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                }`}
                            >
                                <span>{step.step_name}</span>
                                {stepTotalReq > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {stepCompletedReq}/{stepTotalReq}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Dynamic Recruitment Form Fields */}
            <div className="glass-panel p-6 space-y-6">
                {currentFields.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Belum ada konfigurasi form rekrutmen di Pengaturan Form.
                    </div>
                ) : (
                    currentFields.map(cfg => {
                        const val = values[cfg.field_key] || '';
                        const isUpload = cfg.input_type === 'FILE_UPLOAD';
                        const isLink = cfg.input_type === 'LINK';
                        const isDate = cfg.input_type === 'DATE';
                        const isNumber = cfg.input_type === 'NUMBER';

                        return (
                            <div key={cfg.id} className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    {isUpload ? <Upload className="w-4 h-4 text-brand-500" /> 
                                     : isLink ? <LinkIcon className="w-4 h-4 text-blue-500" />
                                     : isDate ? <Calendar className="w-4 h-4 text-emerald-500" />
                                     : isNumber ? <Hash className="w-4 h-4 text-amber-500" />
                                     : <FileText className="w-4 h-4 text-indigo-500" />}
                                    {cfg.field_label}
                                    {cfg.is_required ? (
                                        <span className="text-red-500 text-xs">*wajib</span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">(opsional)</span>
                                    )}
                                    {val && (
                                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                    )}
                                </label>
                                {cfg.description && (
                                    <p className="text-xs text-gray-400">{cfg.description}</p>
                                )}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            type={isDate ? "date" : isNumber ? "number" : isLink ? "url" : "text"}
                                            className="glass-input text-sm w-full"
                                            placeholder={isUpload ? "URL dokumen atau upload file" : isLink ? "https://..." : `Masukkan ${cfg.field_label.toLowerCase()}`}
                                            value={val}
                                            onChange={e => setValues(p => ({ ...p, [cfg.field_key]: e.target.value }))}
                                        />
                                    </div>
                                    {isUpload && (
                                        <div className="sm:w-48">
                                            <FileUpload
                                                subfolder="consultant"
                                                label={`Upload ${cfg.field_label}`}
                                                onUploadSuccess={(url) => setValues(p => ({ ...p, [cfg.field_key]: url }))}
                                            />
                                        </div>
                                    )}
                                </div>
                                {val && (val.startsWith('http') || val.startsWith('/uploads') || val.startsWith('/media')) && (
                                    <a 
                                        href={val.startsWith('http') ? val : `${import.meta.env.VITE_API_URL}${val}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                                    >
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        Lihat {cfg.field_label} →
                                    </a>
                                )}
                            </div>
                        );
                    })
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full glass-button py-3 flex items-center justify-center gap-2 font-bold mt-4"
                >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    Simpan Profil Rekrutmen
                </button>
            </div>
        </div>
    );
}



