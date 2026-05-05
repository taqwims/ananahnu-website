import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import type { FormFieldConfig, FormFieldValue } from '../../types';

interface DynamicSubmissionFormProps {
    formType: string;
    submissionId: string;
    readOnly?: boolean;
    onSaved?: () => void;
}

export default function DynamicSubmissionForm({ formType, submissionId, readOnly = false, onSaved }: DynamicSubmissionFormProps) {
    const [configs, setConfigs] = useState<FormFieldConfig[]>([]);
    const [values, setValues] = useState<Record<number, { text_value: string; file_url: string; link_value: string }>>({});
    const [existingValues, setExistingValues] = useState<FormFieldValue[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [configRes, valuesRes] = await Promise.all([
                    api.get(`/form-config/${formType}`),
                    api.get(`/submission-fields/${submissionId}`).catch(() => ({ data: [] })),
                ]);

                const cfgs: FormFieldConfig[] = configRes.data || [];
                const vals: FormFieldValue[] = valuesRes.data || [];

                setConfigs(cfgs);
                setExistingValues(vals);

                // Pre-fill values from existing data
                const valueMap: typeof values = {};
                cfgs.forEach(cfg => {
                    const existing = vals.find(v => v.form_field_id === cfg.id);
                    valueMap[cfg.id] = {
                        text_value: existing?.text_value || '',
                        file_url: existing?.file_url || '',
                        link_value: existing?.link_value || '',
                    };
                });
                setValues(valueMap);
            } catch (err) {
                console.error('Failed to load form config:', err);
            } finally { setLoading(false); }
        };
        load();
    }, [formType, submissionId]);

    const updateValue = (fieldId: number, key: string, value: string) => {
        setValues(prev => ({
            ...prev,
            [fieldId]: { ...prev[fieldId], [key]: value }
        }));
        setSaved(false);
    };

    const handleFileUpload = async (fieldId: number, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran file tidak boleh lebih dari 2MB");
            return;
        }

        setUploading(prev => ({ ...prev, [fieldId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await api.post(`/media/upload?subfolder=submission_${submissionId}`, formData);
            
            updateValue(fieldId, 'file_url', res.data.url);
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal mengunggah file");
        } finally {
            setUploading(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = configs.map(cfg => ({
                form_field_id: cfg.id,
                text_value: values[cfg.id]?.text_value || '',
                file_url: values[cfg.id]?.file_url || '',
                link_value: values[cfg.id]?.link_value || '',
            }));

            await api.post(`/submission-fields/${submissionId}`, payload);
            setSaved(true);
            onSaved?.();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menyimpan data');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="glass-panel p-6 flex justify-center">
                <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
            </div>
        );
    }

    if (configs.length === 0) {
        return (
            <div className="glass-panel p-6 text-center text-gray-400">
                Belum ada konfigurasi form untuk {formType.replace(/_/g, ' ')}.
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    Formulir {formType.replace(/_/g, ' ')}
                </h3>
                {saved && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" /> Tersimpan
                    </span>
                )}
            </div>

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

                        {cfg.description && (
                            <p className="text-xs text-gray-400">{cfg.description}</p>
                        )}

                        {cfg.input_type === 'FILE_UPLOAD' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                        uploading[cfg.id] ? 'bg-gray-50 border-gray-200' : 'bg-white border-brand-200 hover:border-brand-400'
                                    }`}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && handleFileUpload(cfg.id, e.target.files[0])}
                                            disabled={readOnly || uploading[cfg.id]}
                                        />
                                        {uploading[cfg.id] ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                <span className="text-sm text-gray-400">Mengunggah...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 text-brand-600" />
                                                <span className="text-sm text-brand-600 font-medium">
                                                    {values[cfg.id]?.file_url ? 'Ganti File' : 'Pilih File (Max 2MB)'}
                                                </span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                
                                {values[cfg.id]?.file_url && (
                                    <div className="flex items-center gap-2 p-2 bg-brand-50 rounded-md border border-brand-100">
                                        <FileText className="w-4 h-4 text-brand-500" />
                                        <span className="text-xs text-brand-700 truncate flex-1">
                                            {values[cfg.id].file_url.split('/').pop()}
                                        </span>
                                        <a 
                                            href={`${import.meta.env.VITE_API_URL}${values[cfg.id].file_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-brand-600 hover:underline"
                                        >
                                            Lihat
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {cfg.input_type === 'LINK' && (
                            <input
                                type="url"
                                className="glass-input text-sm"
                                placeholder="https://..."
                                value={values[cfg.id]?.link_value || ''}
                                onChange={e => updateValue(cfg.id, 'link_value', e.target.value)}
                                disabled={readOnly}
                            />
                        )}

                        {cfg.input_type === 'TEXT' && (
                            <textarea
                                className="glass-input text-sm"
                                rows={2}
                                placeholder={`Masukkan ${cfg.field_label.toLowerCase()}...`}
                                value={values[cfg.id]?.text_value || ''}
                                onChange={e => updateValue(cfg.id, 'text_value', e.target.value)}
                                disabled={readOnly}
                            />
                        )}

                        {/* Required field warning */}
                        {cfg.is_required && !readOnly && (
                            (() => {
                                const v = values[cfg.id];
                                const isEmpty = cfg.input_type === 'FILE_UPLOAD' ? !v?.file_url
                                    : cfg.input_type === 'LINK' ? !v?.link_value : !v?.text_value;
                                return isEmpty ? (
                                    <p className="flex items-center gap-1 text-xs text-amber-600">
                                        <AlertCircle className="w-3 h-3" /> Field ini wajib diisi
                                    </p>
                                ) : null;
                            })()
                        )}
                    </div>
                ))}
            </div>

            {!readOnly && (
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full glass-button py-3 flex items-center justify-center gap-2 font-bold"
                >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    Simpan Data
                </button>
            )}

            {/* Read-only: show existing values */}
            {readOnly && existingValues.length === 0 && (
                <p className="text-sm text-gray-400 text-center">Belum ada data yang diisi.</p>
            )}
        </div>
    );
}
