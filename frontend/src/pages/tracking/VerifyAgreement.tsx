import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, AlertTriangle, XCircle, FileText, Calendar, Building, User, ArrowLeft, CheckCircle2, Award, Hash, Clock } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';

export default function VerifyAgreement() {
    const { id, token } = useParams<{ id: string; token?: string }>();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError('');

        const fetchVerification = async () => {
            try {
                // 1. If token is present, try telemarketing agreement verification first
                if (token) {
                    try {
                        const res = await api.get(`/tele/verify/${id}/${token}`);
                        if (res.data) {
                            setResult(res.data);
                            return;
                        }
                    } catch {
                        // Fallback to public contract endpoint
                    }
                }

                // 2. Try submission contract verification
                const res = await api.get(`/public/verify-agreement/${id}`);
                setResult(res.data);
            } catch (err: any) {
                // 3. Try fallback to tele verify without token or alternative
                try {
                    const fallbackRes = await api.get(`/public/verify-contract/${id}`);
                    setResult(fallbackRes.data);
                } catch {
                    setError(err.response?.data?.error || "Dokumen kontrak atau akad tidak ditemukan di sistem HalalCore.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [id, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-600 mx-auto" />
                    <p className="text-slate-600 font-bold text-sm tracking-wider uppercase">Memverifikasi Tanda Tangan & Dokumen...</p>
                </div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Verifikasi Gagal</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8">{error || "Dokumen tidak ditemukan."}</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-brand-600 font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    const isValid = result.status === 'VALID';
    const isTampered = result.status === 'TAMPERED';
    const isContract = result.document_type === 'KONTRAK_PENDAMPINGAN';

    return (
        <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Verification Status Banner */}
                {isValid ? (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                                <ShieldCheck className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <span className="inline-block bg-white/20 backdrop-blur-md text-white font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-white/20">
                                    {isContract ? "Kontrak Layanan Pendampingan Sah" : "Akad Kerjasama Sah & Valid"}
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Dokumen Asli & Terverifikasi</h1>
                                <p className="text-emerald-100 text-xs sm:text-sm mt-1 font-medium">
                                    Tervalidasi secara resmi melalui HalalCore E-Signature & Audit Trail
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden"
                    >
                        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                <XCircle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">
                                    {isTampered ? "Dokumen Terindikasi Modifikasi" : "Dokumen Tidak Valid"}
                                </h1>
                                <p className="text-red-100 text-xs sm:text-sm mt-1 font-medium">
                                    {isTampered ? "Integritas tanda tangan elektronik telah rusak" : "Dokumen ini tidak terdaftar di sistem"}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Document Information Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            {isContract ? "Rincian Kontrak Pendampingan" : "Informasi Akad Kerjasama"}
                        </h2>
                        {result.is_paid_or_active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-auto">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                AKTIF / SIGNED (EFEKTIF)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 self-start sm:self-auto">
                                <Clock className="w-3.5 h-3.5" />
                                {result.submission_status === 'WAITING_PAYMENT' ? 'MENUNGGU PEMBAYARAN' : 'DRAFT'}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                                <Building className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nama Usaha / Pelaku Usaha</p>
                                <p className="text-sm font-bold text-slate-800 mt-0.5 break-words">{result.business_name || '-'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pemohon / PIC</p>
                                <p className="text-sm font-bold text-slate-800 mt-0.5 break-words">{result.pic_name || result.client_name || '-'}</p>
                            </div>
                        </div>

                        {result.tracking_number && result.tracking_number !== '-' && (
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nomor Pengajuan</p>
                                    <p className="text-sm font-bold font-mono text-indigo-700 mt-0.5">{result.tracking_number}</p>
                                </div>
                            </div>
                        )}

                        {result.service_type && (
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Skema Layanan</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{result.service_type}</p>
                                </div>
                            </div>
                        )}

                        {result.advisor_name && (
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Halal Advisor</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{result.advisor_name}</p>
                                    {result.advisor_id && result.advisor_id !== '-' && (
                                        <p className="text-[11px] text-slate-400 font-mono">ID: {result.advisor_id}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-500">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tanggal Dokumen / Pengesahan</p>
                                <p className="text-sm font-bold text-slate-800 mt-0.5">
                                    {result.signed_at || result.created_at ? new Date(result.signed_at || result.created_at).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-medium border border-slate-100 gap-1.5">
                        <span className="text-slate-500 font-bold uppercase tracking-wider">Nomor Kontrak / Dokumen:</span>
                        <span className="text-slate-900 font-bold font-mono text-sm tracking-wide bg-white px-3 py-1 rounded-lg border border-slate-200">
                            {result.contract_number || result.agreement_number || 'DRAFT'}
                        </span>
                    </div>
                </motion.div>

                {/* Footer and Disclaimer */}
                <div className="text-center space-y-4 pt-2">
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto">
                        Disclaimer: Halaman ini memvalidasi keaslian Surat Perjanjian Kontrak Layanan Pendampingan secara resmi langsung dari database HalalCore.
                    </p>
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold transition-all text-xs shadow-sm">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda HalalCore
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

