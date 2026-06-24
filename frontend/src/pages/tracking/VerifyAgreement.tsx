import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, AlertTriangle, XCircle, FileText, Calendar, Building, User, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';

export default function VerifyAgreement() {
    const { id, token } = useParams<{ id: string; token: string }>();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id || !token) return;
        setLoading(true);
        setError('');
        
        api.get(`/public/telemarketing/verify/${id}/${token}`)
            .then(res => {
                setResult(res.data);
            })
            .catch(err => {
                setError(err.response?.data?.error || "Dokumen akad tidak ditemukan atau tanda tangan tidak valid.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-600 mx-auto" />
                    <p className="text-slate-500 font-bold text-sm tracking-wider uppercase">Memverifikasi Tanda Tangan Akad...</p>
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
                    <p className="text-slate-500 font-medium leading-relaxed mb-8">{error}</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-brand-600 font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    const isValid = result.status === 'VALID';
    const isTampered = result.status === 'TAMPERED';

    return (
        <div className="min-h-screen bg-slate-50/50 py-16 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header Verification Status */}
                {isValid ? (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                <ShieldCheck className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">Akad Asli & Valid</h1>
                                <p className="text-emerald-100/90 text-sm mt-1 font-medium">Halal Core E-Signature System</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                <XCircle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">
                                    {isTampered ? "Dokumen Terindikasi Modifikasi" : "Dokumen Tidak Valid"}
                                </h1>
                                <p className="text-red-100/90 text-sm mt-1 font-medium">
                                    {isTampered ? "Integrasi Tanda Tangan Telah Rusak" : "Dokumen ini tidak terdaftar"}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Document Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100 space-y-6"
                >
                    <h2 className="text-lg font-black text-slate-800 pb-4 border-b border-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-600" />
                        Informasi Akad Kerjasama
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <Building className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nama Usaha</p>
                                <p className="text-base font-bold text-slate-800 mt-0.5">{result.business_name}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <User className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Penanggung Jawab (PIC)</p>
                                <p className="text-base font-bold text-slate-800 mt-0.5">{result.pic_name}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 col-span-1 md:col-span-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <Calendar className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tanggal Tanda Tangan Digital</p>
                                <p className="text-base font-bold text-slate-800 mt-0.5">
                                    {new Date(result.signed_at).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZoneName: 'short'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-sm font-semibold border border-slate-100">
                        <span className="text-slate-500">Nomor Akad</span>
                        <span className="text-slate-800 font-bold tracking-wider">{result.agreement_number}</span>
                    </div>
                </motion.div>

                {/* Footer and Disclaimer */}
                <div className="text-center space-y-6">
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto">
                        Disclaimer: Halaman ini memvalidasi keaslian Surat Perjanjian Akad Kerjasama secara resmi langsung dari database Halal Core. Pastikan URL domain yang Anda kunjungi adalah <strong className="text-slate-500">{window.location.host}</strong>.
                    </p>
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all text-sm shadow-sm">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
