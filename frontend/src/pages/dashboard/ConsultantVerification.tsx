import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Eye, Loader2, Search, User, FileText, ExternalLink, AlertCircle, Mail, Clock, Phone, MapPin } from 'lucide-react';
import api from '../../services/api';
import type { ConsultantProfile } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultantVerification() {
    const [profiles, setProfiles] = useState<ConsultantProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProfile, setSelectedProfile] = useState<ConsultantProfile | null>(null);
    const [coordinators, setCoordinators] = useState<any[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<string>('');
    const [verifying, setVerifying] = useState<string | null>(null);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            api.get('/consultant/profiles'),
            api.get('/admin/users', { params: { limit: 200 } })
        ]).then(([profilesRes, usersRes]) => {
            setProfiles(profilesRes.data || []);
            setCoordinators((usersRes.data.data || []).filter((u: any) => 
                (typeof u.role === 'string' ? u.role : u.role?.name) === 'KOORDINATOR'
            ));
        }).catch(() => {
            setProfiles([]);
            setCoordinators([]);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleVerify = async (userId: string, verified: boolean) => {
        setVerifying(userId);
        try {
            await api.put(`/consultant/profiles/${userId}/verify`, { 
                verified, 
                leader_id: selectedLeader || null 
            });
            loadData();
            if (selectedProfile?.user_id === userId) {
                setSelectedProfile(prev => prev ? { ...prev, is_verified: verified } : null);
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal update verifikasi');
        } finally {
            setVerifying(null);
        }
    };

    const filtered = profiles.filter(p => 
        p.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const DOCUMENTS = [
        { key: 'ktp_url', label: 'KTP' },
        { key: 'photo_3x4_url', label: 'Foto 3x4' },
        { key: 'ijazah_sta_url', label: 'Ijazah STA' },
        { key: 'bank_account_url', label: 'Buku Rekening' },
        { key: 'npwp_url', label: 'NPWP' },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        Verifikasi Konsultan
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Validasi dokumen rekrutmen dan status keanggotaan konsultan</p>
                </div>
                
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl text-sm border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Section */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? (
                        <div className="glass-panel p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                            <p className="mt-4 text-gray-500 text-sm font-medium">Memuat data...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-gray-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold">Tidak ada data ditemukan</p>
                        </div>
                    ) : (
                        filtered.map(p => (
                            <motion.div
                                layoutId={p.id}
                                key={p.id}
                                onClick={() => setSelectedProfile(p)}
                                className={`glass-panel p-5 cursor-pointer transition-all border-2 group ${
                                    selectedProfile?.id === p.id 
                                    ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' 
                                    : 'border-white/40 hover:border-indigo-200'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                                        p.is_verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {p.user?.full_name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-gray-800 truncate">{p.user?.full_name}</h3>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">{p.user?.email}</p>
                                    </div>
                                    {p.is_verified ? (
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                    ) : (
                                        <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                                            PENDING
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Detail Section */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {!selectedProfile ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-panel h-[600px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-gray-200 bg-gray-50/30"
                            >
                                <div className="p-6 bg-white rounded-3xl shadow-sm mb-6">
                                    <Eye className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800">Pilih Konsultan</h3>
                                <p className="text-gray-500 max-w-xs mt-2 text-sm">
                                    Pilih salah satu profil konsultan dari daftar untuk meninjau dokumen dan melakukan verifikasi.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedProfile.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel p-8 space-y-8"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner">
                                            {selectedProfile.user?.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedProfile.user?.full_name}</h2>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-500">{selectedProfile.user?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-500">{selectedProfile.user?.phone || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-500">{selectedProfile.user?.address || '-'}</span>
                                                </div>
                                            </div>
                                            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                selectedProfile.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {selectedProfile.is_verified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {selectedProfile.is_verified ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                                        {!selectedProfile.is_verified && (
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
                                        
                                        {selectedProfile.is_verified ? (
                                            <button 
                                                onClick={() => handleVerify(selectedProfile.user_id, false)}
                                                disabled={verifying === selectedProfile.user_id}
                                                className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" /> Batalkan Verifikasi
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleVerify(selectedProfile.user_id, true)}
                                                disabled={verifying === selectedProfile.user_id}
                                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                            >
                                                {verifying === selectedProfile.user_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                Verifikasi Akun
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Dokumen Rekrutmen</h4>
                                        <div className="space-y-3">
                                            {DOCUMENTS.map(doc => {
                                                const url = selectedProfile[doc.key as keyof typeof selectedProfile];
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
                                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 h-full flex flex-col items-center justify-center text-center opacity-50">
                                            <Clock className="w-8 h-8 text-gray-300 mb-3" />
                                            <p className="text-xs font-medium text-gray-500">Belum ada riwayat aktivitas terbaru untuk konsultan ini.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
