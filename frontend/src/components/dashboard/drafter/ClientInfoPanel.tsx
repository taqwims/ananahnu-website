import { Edit3, Save, X, Building2, User, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Submission } from '../../../types';

interface ClientInfoPanelProps {
    submission: Submission | null;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    clientForm: any;
    setClientForm: (v: any) => void;
    onSave: () => Promise<void>;
    processing: boolean;
    nibFile: File | null;
    setNibFile: (f: File | null) => void;
}

export const ClientInfoPanel = ({
    submission,
    isEditing,
    setIsEditing,
    clientForm,
    setClientForm,
    onSave,
    processing,
    nibFile,
    setNibFile
}: ClientInfoPanelProps) => {
    if (!submission) return null;

    return (
        <div className="glass-panel flex flex-col border-white/60 shadow-xl overflow-hidden group">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                    <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase">Data Pelaku Usaha</h3>
                </div>
                {!isEditing ? (
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/dashboard/submissions/${submission.id}`}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                            title="Buka Halaman Detail untuk Tampilan Edit Luas"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Detail
                        </Link>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg border border-brand-200 transition-all flex items-center gap-1 shadow-xs"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onSave}
                            disabled={processing}
                            className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs shadow-md shadow-brand-100 flex items-center gap-1"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Simpan
                        </button>
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Badan Usaha / Brand</p>
                            <p className="text-sm font-black text-gray-800">{submission.client?.business_name}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Penanggung Jawab</p>
                            <p className="text-sm font-bold text-gray-700">{submission.client?.client_name}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Kontak Person</p>
                            <p className="text-xs font-bold text-gray-700">{submission.client?.contact_person || '-'}</p>
                        </div>
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">No. Telepon / WA</p>
                            <p className="text-xs font-bold text-gray-700">{submission.client?.phone || '-'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">NIB</p>
                            <p className="text-xs font-bold font-mono text-gray-700 flex items-center justify-between gap-2">
                                <span>{submission.client?.nib || '-'}</span>
                                {submission.client?.nib_file_url && (
                                    <a 
                                        href={submission.client.nib_file_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded text-[9px] uppercase font-black tracking-wider hover:bg-brand-100 transition-colors inline-flex items-center gap-0.5"
                                    >
                                        Buka
                                    </a>
                                )}
                            </p>
                        </div>
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">NIK</p>
                            <p className="text-xs font-bold font-mono text-gray-700">{submission.client?.nik || '-'}</p>
                        </div>
                    </div>

                    {submission.client?.nib_file_url && (
                        <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Lampiran Dokumen NIB</p>
                            {(() => {
                                const url = submission.client.nib_file_url;
                                const isImg = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
                                if (isImg) {
                                    return (
                                        <div className="mt-1 border border-gray-100 rounded-xl overflow-hidden max-w-full shadow-sm bg-white">
                                            <img src={url} alt="NIB File" className="w-full h-auto object-contain max-h-48" />
                                            <div className="p-1.5 text-center bg-gray-50 border-t border-gray-100">
                                                <a href={url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-wider">
                                                    Buka Gambar Penuh
                                                </a>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="mt-1 flex items-center gap-2.5 p-2 bg-red-50/50 rounded-xl border border-red-100/50 max-w-full">
                                        <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-none mb-0.5">Dokumen PDF</p>
                                            <a href={url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-gray-700 hover:text-brand-600 truncate block underline leading-tight">
                                                Lihat File NIB (PDF)
                                            </a>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Info className="w-2.5 h-2.5" /> Alamat Lengkap
                        </p>
                        <p className="text-xs text-amber-900 font-medium leading-relaxed">
                            {submission.client?.address}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal Edit Data Pelaku Usaha (Tampilan Luas & Nyaman) */}
            {isEditing && (
                <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Edit Data Pelaku Usaha</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Perbarui informasi legalitas dan identitas pelaku usaha</p>
                            </div>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 hover:bg-gray-200/60 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Inputs (Grid 2 Kolom) */}
                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nama Badan Usaha / Brand</label>
                                    <input
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={clientForm.business_name}
                                        onChange={e => setClientForm({ ...clientForm, business_name: e.target.value })}
                                        placeholder="Masukkan nama usaha"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nama Pemilik / Penanggung Jawab</label>
                                    <input
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={clientForm.client_name}
                                        onChange={e => setClientForm({ ...clientForm, client_name: e.target.value })}
                                        placeholder="Masukkan nama pemilik"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nomor NIB</label>
                                    <input
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={clientForm.nib}
                                        onChange={e => setClientForm({ ...clientForm, nib: e.target.value })}
                                        placeholder="Contoh: 1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">NIK Pemilik</label>
                                    <input
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={clientForm.nik}
                                        onChange={e => setClientForm({ ...clientForm, nik: e.target.value })}
                                        placeholder="16 digit NIK"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-brand-50/40 border border-brand-100 rounded-2xl">
                                <label className="text-xs font-bold text-brand-900 mb-1.5 block">Unggah Lampiran NIB (PDF / Foto)</label>
                                <input 
                                    type="file" 
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setNibFile(e.target.files[0]);
                                        }
                                    }}
                                    className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 w-full cursor-pointer"
                                />
                                {clientForm.nib_file_url && !nibFile && (
                                    <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                                        ✓ File NIB sudah terunggah di sistem
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nama Produk Utama</label>
                                    <input
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={clientForm.product_name}
                                        onChange={e => setClientForm({ ...clientForm, product_name: e.target.value })}
                                        placeholder="Contoh: Makanan Ringan / Minuman"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Kontak Person / Penanggung Jawab Lapangan</label>
                                    <input
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={clientForm.contact_person}
                                        onChange={e => setClientForm({ ...clientForm, contact_person: e.target.value })}
                                        placeholder="Nama kontak person"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">No. Telepon / WhatsApp</label>
                                <input
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                    value={clientForm.phone}
                                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                                    placeholder="Contoh: 08123456789"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Alamat Lengkap Usaha</label>
                                <textarea
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                    rows={3}
                                    value={clientForm.address}
                                    onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                                    placeholder="Alamat lengkap pabrik / tempat usaha"
                                />
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 border-t border-gray-100 flex justify-end items-center gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onSave}
                                disabled={processing}
                                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
