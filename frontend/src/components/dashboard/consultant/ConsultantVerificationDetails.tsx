import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, CheckCircle, Clock, XCircle, Loader2, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import type { ConsultantProfile, FormFieldConfig } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';

interface ConsultantVerificationDetailsProps {
    profile: ConsultantProfile;
    coordinators: any[];
    selectedLeader: string;
    setSelectedLeader: (v: string) => void;
    onVerify: (userId: string, verified: boolean) => void;
    verifying: string | null;
}

const DEFAULT_DOCUMENTS = [
    { key: 'ktp', label: 'KTP', legacyKey: 'ktp_url' },
    { key: 'foto_3x4', label: 'Foto 3x4', legacyKey: 'photo_3x4_url' },
    { key: 'ijazah_sta', label: 'Ijazah STA', legacyKey: 'ijazah_sta_url' },
    { key: 'buku_rekening', label: 'Buku Rekening', legacyKey: 'bank_account_url' },
    { key: 'npwp', label: 'NPWP', legacyKey: 'npwp_url' },
] as const;

export const ConsultantVerificationDetails = ({
    profile,
    coordinators,
    selectedLeader,
    setSelectedLeader,
    onVerify,
    verifying
}: ConsultantVerificationDetailsProps) => {
    const user = useAuthStore(state => state.user);
    const isHalalManager = user?.role === 'HALAL_MANAGER';

    const [configs, setConfigs] = useState<FormFieldConfig[]>([]);

    useEffect(() => {
        api.get('/form-config/RECRUITMENT')
            .then(res => setConfigs(res.data || []))
            .catch(() => setConfigs([]));
    }, []);

    // Parse dynamic_data from profile
    let dynData: Record<string, string> = {};
    if (profile?.dynamic_data) {
        try {
            dynData = JSON.parse(profile.dynamic_data);
        } catch (e) {
            console.error('Failed to parse profile dynamic_data:', e);
        }
    }

    const getItemValue = (key: string, legacyKey?: string) => {
        if (dynData[key] !== undefined && dynData[key] !== '') return dynData[key];
        if (legacyKey && (profile as any)[legacyKey]) return (profile as any)[legacyKey];
        if (key === 'ktp') return profile.ktp_url;
        if (key === 'foto_3x4') return profile.photo_3x4_url;
        if (key === 'ijazah_sta') return profile.ijazah_sta_url;
        if (key === 'buku_rekening') return profile.bank_account_url;
        if (key === 'npwp') return profile.npwp_url;
        return '';
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner">
                        {profile.user?.full_name?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile.user?.full_name}</h2>
                        <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-500">{profile.user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-500">{profile.user?.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-500">{profile.user?.address || '-'}</span>
                            </div>
                        </div>
                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            profile.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {profile.is_verified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {profile.is_verified ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {!profile.is_verified && !isHalalManager && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Halal Manager</label>
                            <select 
                                className="glass-input text-xs py-2 disabled:bg-gray-100 disabled:text-gray-500"
                                value={selectedLeader}
                                onChange={e => setSelectedLeader(e.target.value)}
                                disabled={!!profile.user?.leader_id}
                                title={profile.user?.leader_id ? "Halal Manager sudah terikat dari Referral Code" : ""}
                            >
                                <option value="">-- Tanpa Halal Manager --</option>
                                {coordinators.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
                            {!!profile.user?.leader_id && (
                                <span className="text-[10px] text-brand-600 font-bold mt-1">
                                    *Terikat otomatis dari Referral
                                </span>
                            )}
                        </div>
                    )}
                    
                    {profile.is_verified ? (
                        <button 
                            onClick={() => onVerify(profile.user_id, false)}
                            disabled={verifying === profile.user_id}
                            className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-5 h-5" /> Batalkan Verifikasi
                        </button>
                    ) : (
                        <button 
                            onClick={() => onVerify(profile.user_id, true)}
                            disabled={verifying === profile.user_id}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            {verifying === profile.user_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Verifikasi Akun
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Dokumen & Data Rekrutmen</h4>
                    <div className="space-y-3">
                        {configs.length > 0 ? (
                            configs.map(cfg => {
                                const val = getItemValue(cfg.field_key);
                                const isUrl = Boolean(val && (val.startsWith('http') || val.startsWith('/') || cfg.input_type === 'FILE_UPLOAD' || cfg.input_type === 'LINK'));
                                return (
                                    <div key={cfg.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group/doc hover:bg-white hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover/doc:text-indigo-600 transition-colors shadow-sm flex-shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-gray-700 truncate">{cfg.field_label}</div>
                                                {!isUrl && val && (
                                                    <div className="text-xs text-gray-500 font-medium truncate">{val}</div>
                                                )}
                                            </div>
                                        </div>
                                        {val ? (
                                            isUrl ? (
                                                <a 
                                                    href={val.startsWith('http') ? val : `${import.meta.env.VITE_API_URL}${val}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-white text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Lihat
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 px-2 py-1 bg-green-50 rounded-lg flex-shrink-0">
                                                    <CheckCircle className="w-3 h-3" /> TERISI
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded-lg flex-shrink-0">
                                                <AlertCircle className="w-3 h-3" /> {cfg.is_required ? 'BELUM UNGGAH' : 'KOSONG'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            DEFAULT_DOCUMENTS.map(doc => {
                                const val = getItemValue(doc.key, doc.legacyKey);
                                return (
                                    <div key={doc.key} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group/doc hover:bg-white hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover/doc:text-indigo-600 transition-colors shadow-sm">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{doc.label}</span>
                                        </div>
                                        {val ? (
                                            <a 
                                                href={val.startsWith('http') ? val : `${import.meta.env.VITE_API_URL}${val}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-white text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Lihat
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded-lg">
                                                <AlertCircle className="w-3 h-3" /> BELUM UNGGAH
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Aktivitas</h4>
                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[200px]">
                        <Clock className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-xs font-medium text-gray-500">Belum ada riwayat aktivitas terbaru untuk advisor ini.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
