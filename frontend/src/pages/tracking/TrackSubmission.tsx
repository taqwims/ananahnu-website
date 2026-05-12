import { useState } from 'react';
import { Search, Loader2, CheckCircle2, Clock, FileText, LayoutGrid, Eye, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STEPS = [
    { key: 'DRAFT', label: 'Draft', icon: FileText },
    { key: 'VERVAL_PENDAMPING', label: 'Verval Pendamping', icon: Clock },
    { key: 'QC_OFFICER', label: 'QC Officer', icon: CheckCircle2 },
    { key: 'DRAFTER', label: 'Penyusunan Draft', icon: FileText },
    { key: 'QC_REVIEW', label: 'QC Review', icon: Eye },
    { key: 'SIDANG_FATWA', label: 'Sidang Fatwa', icon: LayoutGrid },
    { key: 'SH_TERBIT', label: 'Sertifikat Terbit', icon: CheckCircle }
];

export default function TrackSubmission() {
    const [trackingNo, setTrackingNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNo) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await api.get(`/public/track/${trackingNo}`);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Nomor resi tidak ditemukan");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIndex = (status: string) => {
        if (status === 'REVISION') return 0; // Show as back to start
        if (status === 'REJECTED') return -1;
        return STATUS_STEPS.findIndex(s => s.key === status);
    };

    const currentIdx = result ? getStatusIndex(result.status) : -1;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                        Lacak Progres Sertifikat Halal
                    </h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Masukkan nomor resi pengajuan Anda untuk melihat status pengerjaan secara real-time.
                    </p>
                </div>

                {/* Search Box */}
                <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 mb-8">
                    <form onSubmit={handleTrack} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-lg font-medium text-slate-800 placeholder:text-slate-300"
                                placeholder="Masukkan No. Resi (Contoh: AN-2601-ABCD)"
                                value={trackingNo}
                                onChange={e => setTrackingNo(e.target.value.toUpperCase())}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-8 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cek Status"}
                        </button>
                    </form>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 mb-8"
                        >
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-medium">{error}</p>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            {/* Summary Card */}
                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 mb-1">{result.business_name}</h2>
                                        <p className="text-slate-500 text-sm font-medium">Klien: {result.client_name}</p>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-100 rounded-xl">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Nomor Resi</span>
                                        <span className="text-sm font-black text-slate-700 font-mono uppercase tracking-tight">{result.tracking_no}</span>
                                    </div>
                                </div>

                                {result.status === 'REJECTED' ? (
                                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                        <h3 className="text-xl font-bold text-red-700 mb-1">Pengajuan Ditolak</h3>
                                        <p className="text-red-600 text-sm">Silakan hubungi konsultan pendamping Anda untuk informasi lebih lanjut.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Horizontal Progress */}
                                        <div className="relative pt-12 pb-4">
                                            <div className="absolute top-[60px] left-0 right-0 h-1 bg-slate-100 rounded-full"></div>
                                            <div 
                                                className="absolute top-[60px] left-0 h-1 bg-brand-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(Math.max(0, currentIdx) / (STATUS_STEPS.length - 1)) * 100}%` }}
                                            ></div>

                                            <div className="relative flex justify-between">
                                                {STATUS_STEPS.map((step, idx) => {
                                                    const isCompleted = idx < currentIdx;
                                                    const isCurrent = idx === currentIdx;
                                                    const Icon = step.icon;

                                                    return (
                                                        <div key={step.key} className="flex flex-col items-center gap-4 group">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-4 ${
                                                                isCompleted ? 'bg-brand-500 border-brand-100 text-white' : 
                                                                isCurrent ? 'bg-white border-brand-500 text-brand-500 shadow-lg shadow-brand-200 scale-125' : 
                                                                'bg-white border-slate-100 text-slate-300'
                                                            }`}>
                                                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                                            </div>
                                                            <span className={`text-[10px] font-bold text-center max-w-[80px] uppercase tracking-tighter ${
                                                                isCurrent ? 'text-brand-600' : 'text-slate-400'
                                                            }`}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Status Detail */}
                                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                                                    {(() => {
                                                        const Icon = STATUS_STEPS[currentIdx]?.icon;
                                                        return Icon ? <Icon className="w-6 h-6" /> : null;
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                                                    <p className="text-lg font-bold text-slate-800">{STATUS_STEPS[currentIdx]?.label || result.status.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Terakhir</p>
                                                <p className="text-sm font-bold text-slate-700">{new Date(result.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions / Info */}
                            {result.status === 'SH_TERBIT' && result.sh_url && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200/50 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Sertifikat Halal Terbit!</h3>
                                            <p className="text-emerald-100 text-sm">Selamat, sertifikat Anda telah terbit dan siap diunduh.</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={`${import.meta.env.VITE_API_URL}${result.sh_url}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
                                    >
                                        Unduh Sekarang
                                    </a>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
