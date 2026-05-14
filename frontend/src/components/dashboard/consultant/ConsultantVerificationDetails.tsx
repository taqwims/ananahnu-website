import { Mail, Phone, MapPin, CheckCircle, Clock, XCircle, Loader2, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import type { ConsultantProfile } from '../../../types';

interface ConsultantVerificationDetailsProps {
    profile: ConsultantProfile;
    coordinators: any[];
    selectedLeader: string;
    setSelectedLeader: (v: string) => void;
    onVerify: (userId: string, verified: boolean) => void;
    verifying: string | null;
}

const DOCUMENTS = [
    { key: 'ktp_url', label: 'KTP' },
    { key: 'photo_3x4_url', label: 'Foto 3x4' },
    { key: 'ijazah_sta_url', label: 'Ijazah STA' },
    { key: 'bank_account_url', label: 'Buku Rekening' },
    { key: 'npwp_url', label: 'NPWP' },
] as const;

export const ConsultantVerificationDetails = ({
    profile,
    coordinators,
    selectedLeader,
    setSelectedLeader,
    onVerify,
    verifying
}: ConsultantVerificationDetailsProps) => {
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
                    {!profile.is_verified && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Koordinator</label>
                            <select 
                                className="glass-input text-xs py-2"
                                value={selectedLeader}
                                onChange={e => setSelectedLeader(e.target.value)}
                            >
                                <option value="">-- Tanpa Koordinator --</option>
                                {coordinators.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
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
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Dokumen Rekrutmen</h4>
                    <div className="space-y-3">
                        {DOCUMENTS.map(doc => {
                            const url = profile[doc.key as keyof ConsultantProfile];
                            return (
                                <div key={doc.key} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group/doc hover:bg-white hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover/doc:text-indigo-600 transition-colors shadow-sm">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{doc.label}</span>
                                    </div>
                                    {url ? (
                                        <a 
                                            href={typeof url === 'string' && url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-white text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded-lg">
                                            <AlertCircle className="w-3 h-3" /> BELUM UNGGAH
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Aktivitas</h4>
                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[200px]">
                        <Clock className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-xs font-medium text-gray-500">Belum ada riwayat aktivitas terbaru untuk konsultan ini.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
