import { useState } from 'react';
import type { Submission, User, Client } from '../../../types';
import { formatDate } from '../../../utils/format';

interface ClientInfoSectionProps {
    submission: Submission;
    user: User | null;
    onUpdateClient: (clientId: string, data: Partial<Client>) => Promise<void>;
    processing: boolean;
}

const InfoItem = ({ label, value, mono = false, highlight = false }: { label: string; value?: string; mono?: boolean; highlight?: boolean }) => (
    <div className={`p-3 rounded-xl border transition-all ${highlight ? 'bg-brand-50/50 border-brand-100 ring-1 ring-brand-500/10' : 'bg-white/50 border-gray-100'}`}>
        <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</dt>
        <dd className={`text-sm font-bold truncate ${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-700' : 'text-gray-700'}`}>
            {value || '-'}
        </dd>
    </div>
);

export const ClientInfoSection = ({ submission, user, onUpdateClient, processing }: ClientInfoSectionProps) => {
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [clientForm, setClientForm] = useState({
        business_name: submission.client?.business_name || '',
        client_name: submission.client?.client_name || '',
        nib: submission.client?.nib || '',
        nik: submission.client?.nik || '',
        product_name: submission.client?.product_name || '',
        address: submission.client?.address || '',
        contact_person: submission.client?.contact_person || '',
        phone: submission.client?.phone || ''
    });

    const handleUpdate = async () => {
        if (!submission.client?.id) return;
        await onUpdateClient(submission.client.id, clientForm);
        setIsEditingClient(false);
    };

    const canEdit = (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'KOORDINATOR' || user?.role === 'HALAL_KONSULTAN' || (user?.role === 'VERIFIKATOR' && submission.service_type === 'REGULER'));

    return (
        <div className="glass-panel p-6 shadow-xl border border-white/40">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                    Informasi Client
                </h3>
                {canEdit && !isEditingClient && (
                    <button 
                        onClick={() => setIsEditingClient(true)}
                        className="px-3 py-1.5 bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-brand-100 hover:bg-brand-100 transition-all"
                    >
                        Edit Data Klien
                    </button>
                )}
            </div>
            
            {isEditingClient ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Usaha <span className="text-red-500">*</span></label>
                            <input className="glass-input w-full" value={clientForm.business_name} onChange={e => setClientForm({...clientForm, business_name: e.target.value})} placeholder="Contoh: UD Jaya Abadi" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Klien (Pemilik) <span className="text-red-500">*</span></label>
                            <input className="glass-input w-full" value={clientForm.client_name} onChange={e => setClientForm({...clientForm, client_name: e.target.value})} placeholder="Nama Lengkap Pemilik" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">NIB</label>
                            <input className="glass-input w-full font-mono" value={clientForm.nib} onChange={e => setClientForm({...clientForm, nib: e.target.value})} placeholder="Nomor Induk Berusaha" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">NIK <span className="text-red-500">*</span></label>
                            <input className="glass-input w-full font-mono" value={clientForm.nik} onChange={e => setClientForm({...clientForm, nik: e.target.value})} placeholder="Nomor Induk Kependudukan" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Produk</label>
                            <input className="glass-input w-full" value={clientForm.product_name} onChange={e => setClientForm({...clientForm, product_name: e.target.value})} placeholder="Contoh: Keripik Singkong" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CP / Telepon</label>
                            <input className="glass-input w-full" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="08..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                            <textarea className="glass-input w-full" rows={2} value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} placeholder="Alamat lengkap usaha" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setIsEditingClient(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Batal</button>
                        <button 
                            onClick={handleUpdate} 
                            disabled={processing}
                            className="px-6 py-2 bg-brand-600 text-white rounded-xl font-black text-xs shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    <InfoItem label="Nama Usaha" value={submission.client?.business_name} highlight />
                    <InfoItem label="Nama Pemilik" value={submission.client?.client_name} />
                    <InfoItem label="NIB" value={submission.client?.nib} mono />
                    <InfoItem label="NIK" value={submission.client?.nik} mono />
                    <InfoItem label="Produk Utama" value={submission.client?.product_name} />
                    <InfoItem label="Telepon" value={submission.client?.phone} />
                    {submission.consultant_id && (
                        <InfoItem label="Konsultan Penanggung Jawab" value={submission.consultant?.full_name} highlight />
                    )}
                    <div className="sm:col-span-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <dt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat Lengkap</dt>
                        <dd className="text-sm text-gray-700 font-medium leading-relaxed">{submission.client?.address || '-'}</dd>
                    </div>
                </dl>
            )}

            {(submission.audit_date || submission.audit_result_1_url) && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {submission.audit_date && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">📅 Tanggal Audit</p>
                            <p className="text-sm font-bold text-amber-900">{formatDate(submission.audit_date)}</p>
                        </div>
                    )}
                    {submission.audit_result_1_url && (
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">📄 Hasil Audit</p>
                            <div className="flex gap-2 mt-1">
                                <a href={`${import.meta.env.VITE_API_URL}${submission.audit_result_1_url}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-700 underline">File 1</a>
                                {submission.audit_result_2_url && (
                                    <a href={`${import.meta.env.VITE_API_URL}${submission.audit_result_2_url}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-700 underline">File 2</a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {submission.service_type === 'REGULER' && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100 gap-4">
                    <span className="text-xs text-blue-800 font-bold text-center sm:text-left">Layanan Reguler membutuhkan kontrak pendampingan.</span>
                    <a 
                        href={`${import.meta.env.VITE_API_URL}/templates/kontrak_reguler.docx`} 
                        download 
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-100"
                    >
                        Unduh Template Kontrak
                    </a>
                </div>
            )}
        </div>
    );
};
