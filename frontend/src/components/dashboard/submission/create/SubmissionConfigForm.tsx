import { Upload, Link as LinkIcon, FileText, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import type { FormFieldConfig } from '../../../../types';

interface SubmissionConfigFormProps {
    configs: FormFieldConfig[];
    fieldValues: any;
    setFieldValues: (v: any) => void;
    uploading: Record<number, boolean>;
    onFileUpload: (fieldId: number, file: File) => void;
}

export const SubmissionConfigForm = ({
    configs,
    fieldValues,
    setFieldValues,
    uploading,
    onFileUpload
}: SubmissionConfigFormProps) => {
    return (
        <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Dokumen Persyaratan</h3>
            {configs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Pilih jenis layanan untuk melihat persyaratan.</p>
            ) : (
                <div className="space-y-4">
                    {configs.map(cfg => (
                        <div key={cfg.id} className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                {cfg.input_type === 'FILE_UPLOAD' && <Upload className="w-4 h-4 text-brand-500" />}
                                {cfg.input_type === 'LINK' && <LinkIcon className="w-4 h-4 text-blue-500" />}
                                {cfg.input_type === 'TEXT' && <FileText className="w-4 h-4 text-gray-500" />}
                                {cfg.field_label}
                                {cfg.is_required && <span className="text-red-500 text-xs">*wajib</span>}
                            </label>
                            
                            {cfg.input_type === 'FILE_UPLOAD' && (
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                            uploading[cfg.id] ? 'bg-gray-50 border-gray-200' : 'bg-white border-brand-200 hover:border-brand-400 hover:bg-brand-50/30 shadow-sm'
                                        }`}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={e => e.target.files?.[0] && onFileUpload(cfg.id, e.target.files[0])}
                                                disabled={uploading[cfg.id]}
                                                accept="image/*,application/pdf"
                                            />
                                            {uploading[cfg.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-brand-600" />}
                                            <span className="text-sm text-brand-600 font-bold">
                                                {fieldValues[cfg.id]?.file_url ? 'Ganti File' : 'Pilih File'}
                                            </span>
                                        </label>

                                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                            uploading[cfg.id] ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30 shadow-sm'
                                        }`}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={e => e.target.files?.[0] && onFileUpload(cfg.id, e.target.files[0])}
                                                disabled={uploading[cfg.id]}
                                                accept="image/*"
                                                capture="environment"
                                            />
                                            {uploading[cfg.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-indigo-600" />}
                                            <span className="text-sm text-indigo-600 font-bold">
                                                Ambil Foto
                                            </span>
                                        </label>
                                    </div>

                                    {fieldValues[cfg.id]?.file_url && (
                                        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold border border-emerald-100 animate-in fade-in slide-in-from-top-1 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Dokumen berhasil diunggah
                                            </div>
                                            {fieldValues[cfg.id]?.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                <div className="mt-1 w-full max-w-[200px] rounded-lg overflow-hidden border border-emerald-200">
                                                    <img 
                                                        src={`${import.meta.env.VITE_API_URL}${fieldValues[cfg.id].file_url}`} 
                                                        alt="Preview" 
                                                        className="w-full h-auto object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <a 
                                                    href={`${import.meta.env.VITE_API_URL}${fieldValues[cfg.id].file_url}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-emerald-600 underline text-[10px] mt-1"
                                                >
                                                    Lihat Dokumen
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {cfg.input_type === 'LINK' && (
                                <input 
                                    className="glass-input w-full text-sm" 
                                    placeholder="https://..." 
                                    value={fieldValues[cfg.id]?.link_value || ''}
                                    onChange={e => setFieldValues({
                                        ...fieldValues,
                                        [cfg.id]: { ...fieldValues[cfg.id], link_value: e.target.value }
                                    })}
                                />
                            )}

                            {cfg.input_type === 'TEXT' && (
                                <textarea 
                                    className="glass-input w-full text-sm" 
                                    rows={2} 
                                    value={fieldValues[cfg.id]?.text_value || ''}
                                    onChange={e => setFieldValues({
                                        ...fieldValues,
                                        [cfg.id]: { ...fieldValues[cfg.id], text_value: e.target.value }
                                    })}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
