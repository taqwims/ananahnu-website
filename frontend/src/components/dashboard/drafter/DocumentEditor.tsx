import { Edit3, Save, X, ExternalLink, Link as LinkIcon, Upload, FileText } from 'lucide-react';
import type { FormFieldValue } from '../../../types';
import FileUpload from '../FileUpload';

interface DocumentEditorProps {
    fieldValues: FormFieldValue[];
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    onUpdateValue: (index: number, key: string, value: any) => void;
    onSave: () => Promise<void>;
    processing: boolean;
}

export const DocumentEditor = ({
    fieldValues,
    isEditing,
    setIsEditing,
    onUpdateValue,
    onSave,
    processing
}: DocumentEditorProps) => {
    return (
        <div className="glass-panel flex-1 flex flex-col border-white/60 shadow-xl overflow-hidden group">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase">Dokumen Persyaratan</h3>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 hover:bg-brand-50 rounded-lg text-brand-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
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
                            className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                <div className="grid grid-cols-1 gap-3">
                    {fieldValues.map((fv, idx) => (
                        <div key={fv.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 transition-all hover:border-blue-100 hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {fv.form_field.input_type === 'FILE_UPLOAD' ? <Upload className="w-3.5 h-3.5 text-brand-500" /> : <LinkIcon className="w-3.5 h-3.5 text-blue-500" />}
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{fv.form_field.field_label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {fv.file_url && (
                                        <a href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} target="_blank" rel="noreferrer" className="p-1.5 bg-gray-50 text-gray-400 hover:text-brand-600 rounded-lg transition-colors">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {fv.link_value && (
                                        <a href={fv.link_value} target="_blank" rel="noreferrer" className="p-1.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                                            <LinkIcon className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-2">
                                    {fv.form_field.input_type === 'FILE_UPLOAD' ? (
                                        <FileUpload
                                            subfolder="submissions"
                                            label="Ganti File"
                                            onUploadSuccess={(url) => onUpdateValue(idx, 'file_url', url)}
                                        />
                                    ) : (
                                        <input
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                            value={fv.link_value || fv.text_value || ''}
                                            onChange={e => onUpdateValue(idx, fv.form_field.input_type === 'LINK' ? 'link_value' : 'text_value', e.target.value)}
                                            placeholder={`Masukkan ${fv.form_field.field_label}...`}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 min-h-[32px]">
                                    {fv.file_url || fv.link_value || fv.text_value ? (
                                        <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                                            {fv.file_url ? 'Dokumen Terupload' : (fv.link_value || fv.text_value)}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
