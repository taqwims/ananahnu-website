import { Building2, User as UserIcon, FileText, X, Edit3, Save, Loader2, Eye, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { Submission, FormFieldValue } from '../../../types';
import { InfoBox, EditField } from './helpers';
import FileUpload from '../FileUpload';
import toast from 'react-hot-toast';

interface QCReferencePanelProps {
    submission: Submission | null;
    isEditingClient: boolean;
    setIsEditingClient: (v: boolean) => void;
    clientForm: any;
    setClientForm: (v: any) => void;
    onUpdateClient: () => Promise<void>;
    
    isEditingDocs: boolean;
    setIsEditingDocs: (v: boolean) => void;
    fieldValues: FormFieldValue[];
    onUpdateValue: (index: number, key: string, value: any) => void;
    onUpdateDocs: () => Promise<void>;
    
    processing: boolean;
}

export const QCReferencePanel = ({
    submission,
    isEditingClient,
    setIsEditingClient,
    clientForm,
    setClientForm,
    onUpdateClient,
    isEditingDocs,
    setIsEditingDocs,
    fieldValues,
    onUpdateValue,
    onUpdateDocs,
    processing
}: QCReferencePanelProps) => {
    if (!submission) return null;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
            {/* Client Basic Info */}
            <div className="glass-panel p-6 border-white/40 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-600 rounded-full" />
                        <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Informasi Dasar Klien</h3>
                    </div>
                    <button 
                        onClick={() => setIsEditingClient(!isEditingClient)}
                        className={`p-2 rounded-lg transition-all ${isEditingClient ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                        {isEditingClient ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isEditingClient ? (
                        <>
                            <EditField label="Nama Bisnis" value={clientForm.business_name} onChange={v => setClientForm({...clientForm, business_name: v})} />
                            <EditField label="Nama Pemilik" value={clientForm.client_name} onChange={v => setClientForm({...clientForm, client_name: v})} />
                            <EditField label="NIB" value={clientForm.nib} onChange={v => setClientForm({...clientForm, nib: v})} />
                            <EditField label="NIK" value={clientForm.nik} onChange={v => setClientForm({...clientForm, nik: v})} />
                            <EditField label="Produk" value={clientForm.product_name} onChange={v => setClientForm({...clientForm, product_name: v})} />
                            <div className="col-span-2">
                                <EditField label="Alamat Lengkap" value={clientForm.address} onChange={v => setClientForm({...clientForm, address: v})} isTextArea />
                            </div>
                            <div className="col-span-2 pt-2">
                                <button 
                                    onClick={onUpdateClient}
                                    disabled={processing}
                                    className="w-full py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                                >
                                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Simpan Perubahan Klien (QC Override)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <InfoBox label="Nama Bisnis" value={submission.client?.business_name} icon={Building2} />
                            <InfoBox label="Nama Pemilik" value={submission.client?.client_name} icon={UserIcon} />
                            <InfoBox label="NIB" value={submission.client?.nib} icon={Building2} mono />
                            <InfoBox label="NIK" value={submission.client?.nik} icon={Building2} mono />
                            <InfoBox label="Produk" value={submission.client?.product_name} icon={FileText} />
                            <div className="col-span-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Alamat Lengkap</span>
                                <p className="text-xs text-gray-700 leading-relaxed font-medium">{submission.client?.address}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Document References */}
            <div className="glass-panel p-6 border-white/40 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-600 rounded-full" />
                        <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Dokumen & Bukti Pendukung</h3>
                    </div>
                    <button 
                        onClick={() => setIsEditingDocs(!isEditingDocs)}
                        className={`p-2 rounded-lg transition-all ${isEditingDocs ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                        {isEditingDocs ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {fieldValues.map((fv, idx) => (
                        <div key={fv.id} className={`p-4 rounded-2xl border transition-all ${isEditingDocs ? 'bg-amber-50/10 border-amber-100' : 'bg-white/60 border-gray-100 hover:border-brand-200 shadow-sm'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${isEditingDocs ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{fv.form_field.field_label}</span>
                            </div>

                            {isEditingDocs ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <EditField 
                                            label="Keterangan / Nilai Text" 
                                            value={fv.text_value || ''} 
                                            onChange={v => onUpdateValue(idx, 'text_value', v)} 
                                        />
                                        <EditField 
                                            label="Tautan / Link" 
                                            value={fv.link_value || ''} 
                                            onChange={v => onUpdateValue(idx, 'link_value', v)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block px-1">File Upload</label>
                                        <FileUpload 
                                            subfolder="docs"
                                            label={fv.file_url ? "Ganti File" : "Upload File"}
                                            onUploadSuccess={(url) => {
                                                onUpdateValue(idx, 'file_url', url);
                                                toast.success("File siap disimpan");
                                            }}
                                        />
                                        {fv.file_url && (
                                            <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span className="text-[9px] font-bold truncate flex-1">{fv.file_url.split('/').pop()}</span>
                                                <a href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-emerald-100 rounded-lg">
                                                    <Eye className="w-3 h-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-xs text-gray-600 font-medium truncate">{fv.text_value || '-'}</p>
                                        {fv.link_value && <p className="text-[9px] text-brand-600 font-mono truncate mt-0.5">{fv.link_value}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        {fv.file_url && (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL}${fv.file_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all shadow-sm border border-gray-100"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        )}
                                        {fv.link_value && (
                                            <a
                                                href={fv.link_value}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all shadow-sm border border-gray-100"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isEditingDocs && (
                        <button 
                            onClick={onUpdateDocs}
                            disabled={processing}
                            className="w-full mt-4 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 flex items-center justify-center gap-3"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Perubahan Dokumen (QC Override)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
