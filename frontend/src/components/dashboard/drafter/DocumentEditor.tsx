import { Edit3, Save, X, ExternalLink, Link as LinkIcon, Upload, FileText, Trash2, Calendar, List } from 'lucide-react';
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
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-extrabold text-gray-800 tracking-tight">Data / Dokumen Pengisian</span>
                </div>
                {fieldValues.length > 0 && (
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={processing}
                                    title="Batal"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={onSave}
                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                                    disabled={processing}
                                    title="Simpan"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Data"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                <div className="grid grid-cols-1 gap-3">
                    {fieldValues.map((fv, idx) => (
                        <div key={fv.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 transition-all hover:border-blue-100 hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {fv.form_field.input_type === 'FILE_UPLOAD' && <Upload className="w-3.5 h-3.5 text-brand-500" />}
                                    {fv.form_field.input_type === 'LINK' && <LinkIcon className="w-3.5 h-3.5 text-blue-500" />}
                                    {fv.form_field.input_type === 'TEXT' && <FileText className="w-3.5 h-3.5 text-gray-500" />}
                                    {fv.form_field.input_type === 'DATE' && <Calendar className="w-3.5 h-3.5 text-emerald-500" />}
                                    {fv.form_field.input_type === 'REPEATER' && <List className="w-3.5 h-3.5 text-indigo-500" />}
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
                                        <div className="space-y-2">
                                            <FileUpload
                                                subfolder="submissions"
                                                label="Upload / Ganti File"
                                                onUploadSuccess={(url) => onUpdateValue(idx, 'file_url', url)}
                                            />
                                            {fv.file_url && (
                                                <div className="flex items-center justify-between p-2.5 bg-red-50/50 rounded-xl border border-red-100/50">
                                                    <span className="text-xs font-bold text-red-700 truncate max-w-[75%]">
                                                        {fv.file_url.split('/').pop()}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => onUpdateValue(idx, 'file_url', '')}
                                                        className="flex items-center gap-1 text-[10px] font-black text-red-600 hover:text-red-700 uppercase bg-white border border-red-100 hover:border-red-200 px-2 py-1 rounded-lg shadow-sm transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : fv.form_field.input_type === 'REPEATER' ? (
                                        <div className="space-y-2">
                                            {(() => {
                                                let items: string[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                return (
                                                    <>
                                                        {items.map((item, itemIdx) => (
                                                            <div key={itemIdx} className="flex gap-2 items-center">
                                                                <input
                                                                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                    value={item}
                                                                    onChange={e => {
                                                                        const newItems = [...items];
                                                                        newItems[itemIdx] = e.target.value;
                                                                        onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                    }}
                                                                    placeholder="Bahan/Item..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newItems = items.filter((_, i) => i !== itemIdx);
                                                                        onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                    }}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = [...items, ''];
                                                                onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                            }}
                                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            + Tambah Item
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : fv.form_field.input_type === 'DATE' ? (
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                            value={fv.text_value || ''}
                                            onChange={e => onUpdateValue(idx, 'text_value', e.target.value)}
                                        />
                                    ) : (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                value={fv.link_value || fv.text_value || ''}
                                                onChange={e => onUpdateValue(idx, fv.form_field.input_type === 'LINK' ? 'link_value' : 'text_value', e.target.value)}
                                                placeholder={`Masukkan ${fv.form_field.field_label}...`}
                                            />
                                            {(fv.link_value || fv.text_value) && (
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateValue(idx, fv.form_field.input_type === 'LINK' ? 'link_value' : 'text_value', '')}
                                                    className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-100 hover:border-red-100"
                                                    title="Hapus Nilai"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                                    {fv.file_url || fv.link_value || fv.text_value ? (
                                        fv.form_field.input_type === 'REPEATER' ? (
                                            (() => {
                                                let items: string[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                if (items.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return items.map((item, itemIdx) => (
                                                    <span key={itemIdx} className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                                                        {item}
                                                    </span>
                                                ));
                                            })()
                                        ) : (
                                            <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                {fv.file_url ? 'Dokumen Terupload' : (fv.link_value || fv.text_value)}
                                            </span>
                                        )
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
