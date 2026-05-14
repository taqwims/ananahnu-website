import { FileText, CheckCircle, Briefcase, GraduationCap, Loader2, ExternalLink } from 'lucide-react';
import type { TrainingParticipant, ConsultantProfile, Client } from '../../../types';
import { formatServiceType } from '../../../utils/format';

interface MemberDetailsProps {
    profile?: ConsultantProfile;
    trainings: TrainingParticipant[];
    clients: Client[];
    loadingDetail: boolean;
}

export const MemberDetails = ({
    profile,
    trainings,
    clients,
    loadingDetail
}: MemberDetailsProps) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Profile & Documents */}
            <div className="glass-panel p-8 shadow-xl shadow-gray-100/20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Dokumen Rekrutmen</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Verifikasi Kelengkapan Administrasi</p>
                    </div>
                </div>

                {!profile ? (
                    <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-sm font-bold text-gray-400 italic">Konsultan belum melengkapi data profil</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: 'KTP', url: profile.ktp_url },
                            { label: 'Foto 3x4', url: profile.photo_3x4_url },
                            { label: 'Ijazah STA', url: profile.ijazah_sta_url },
                            { label: 'Buku Rekening', url: profile.bank_account_url },
                            { label: 'NPWP', url: profile.npwp_url },
                        ].map(doc => (
                            <div key={doc.label} className="p-4 bg-gray-50/50 hover:bg-white hover:border-brand-100 border border-transparent rounded-2xl transition-all group/doc">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{doc.label}</p>
                                {doc.url ? (
                                    <a 
                                        href={typeof doc.url === 'string' && doc.url.startsWith('http') ? doc.url : `${import.meta.env.VITE_API_URL}${doc.url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between text-xs font-black text-brand-600 uppercase tracking-widest group-hover/doc:translate-x-1 transition-transform"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Buka Dokumen
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/doc:opacity-100 transition-opacity" />
                                    </a>
                                ) : (
                                    <span className="text-xs font-bold text-gray-300 italic uppercase tracking-tighter">BELUM TERSEDIA</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Member Clients */}
                <div className="glass-panel p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-800 tracking-tight">Klien Binaaan</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{clients.length} Klien Aktif</p>
                            </div>
                        </div>
                    </div>

                    {loadingDetail ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : clients.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 opacity-50">
                            <Briefcase className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-sm font-bold italic">Belum ada klien binaan</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clients.map((cl: Client) => (
                                <div key={cl.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all group/client">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-gray-900 group-hover/client:text-brand-600 transition-colors">{cl.business_name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">NIB: {cl.nib}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] ${
                                            cl.service_type === 'REGULER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                        }`}>
                                            {formatServiceType(cl.service_type)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Training History */}
                <div className="glass-panel p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-800 tracking-tight">Riwayat Pelatihan</h3>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">{trainings.length} Sertifikat</p>
                            </div>
                        </div>
                    </div>

                    {loadingDetail ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-600" /></div>
                    ) : trainings.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 opacity-50">
                            <GraduationCap className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-sm font-bold italic">Belum mengikuti pelatihan</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {trainings.map(tp => (
                                <div key={tp.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-gray-800">
                                                ID Pelatihan: <span className="font-mono text-xs">{tp.training_id}</span>
                                            </p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] ${
                                            tp.status === 'LULUS'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                            {tp.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
