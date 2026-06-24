import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import api from '../../services/api';
import { compressImage } from '../../utils/compressor';
import type { FormFieldConfig, FormFieldValue } from '../../types';
import { formatServiceType } from '../../utils/format';

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

    const [currentStepIdx, setCurrentStepIdx] = useState(0);

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
        setUploading(prev => ({ ...prev, [fieldId]: true }));
        let finalFile = file;

        // Kompres jika file adalah gambar
        if (finalFile.type.startsWith('image/')) {
            try {
                finalFile = await compressImage(finalFile);
            } catch (err) {
                console.error('Image compression failed:', err);
            }
        }

        if (finalFile.size > 2 * 1024 * 1024) {
            alert("Ukuran file tidak boleh lebih dari 2MB");
            setUploading(prev => ({ ...prev, [fieldId]: false }));
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', finalFile);
            
            const res = await api.post(`/media/upload?subfolder=submission_${submissionId}`, formData);
            
            updateValue(fieldId, 'file_url', res.data.url);
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal mengunggah file");
        } finally {
            setUploading(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    // Group configs by step_number
    const groupedSteps = configs.reduce((acc, cfg) => {
        const stepNum = cfg.step_number || 1;
        const stepName = cfg.step_name || `Step ${stepNum}`;
        if (!acc[stepNum]) {
            acc[stepNum] = {
                step_number: stepNum,
                step_name: stepName,
                configs: []
            };
        }
        if (cfg.step_name && acc[stepNum].step_name === `Step ${stepNum}`) {
            acc[stepNum].step_name = cfg.step_name;
        }
        acc[stepNum].configs.push(cfg);
        return acc;
    }, {} as Record<number, { step_number: number; step_name: string; configs: FormFieldConfig[] }>);

    const steps = Object.values(groupedSteps).sort((a, b) => a.step_number - b.step_number);
    // Sort configs inside each step
    steps.forEach(step => {
        step.configs.sort((a, b) => a.sort_order - b.sort_order);
    });

    const currentStep = steps[currentStepIdx];
    const isLastStep = currentStepIdx === steps.length - 1;

    const validateStep = (stepConfigs: FormFieldConfig[]) => {
        for (const cfg of stepConfigs) {
            if (cfg.is_required) {
                const val = values[cfg.id];
                const isEmpty = cfg.input_type === 'FILE_UPLOAD' ? !val?.file_url
                    : cfg.input_type === 'LINK' ? !val?.link_value : !val?.text_value;
                if (isEmpty) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleSave = async (silent = false) => {
        if (!silent) setSaving(true);
        try {
            const payload = configs.map(cfg => ({
                form_field_id: cfg.id,
                text_value: values[cfg.id]?.text_value || '',
                file_url: values[cfg.id]?.file_url || '',
                link_value: values[cfg.id]?.link_value || '',
            }));

            await api.post(`/submission-fields/${submissionId}`, payload);
            setSaved(true);
            if (!silent && isLastStep) {
                onSaved?.();
            }
        } catch (err: any) {
            if (!silent) {
                alert(err.response?.data?.error || 'Gagal menyimpan data');
            }
        } finally {
            if (!silent) setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!currentStep) return;
        
        // Validate current step before proceeding
        if (!validateStep(currentStep.configs)) {
            alert('Mohon isi semua field wajib sebelum melanjutkan.');
            return;
        }

        // Save current step data
        await handleSave();
        
        if (!isLastStep) {
            setCurrentStepIdx(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(prev => prev - 1);
        }
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
                Belum ada konfigurasi form untuk {formatServiceType(formType)}.
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg font-extrabold text-gray-800 tracking-tight">
                        Formulir {formatServiceType(formType)}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                        Lengkapi dokumen dan data Anda langkah demi langkah.
                    </p>
                </div>
                {saved && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
                    </span>
                )}
            </div>

            {/* Step Wizard Progress Bar */}
            {steps.length > 1 && (
                <div className="mb-8 px-2">
                    <div className="flex items-center justify-between relative">
                        {/* Background line */}
                        <div className="absolute left-0 right-0 top-4 h-1 bg-gray-100 rounded-full -z-10" />
                        {/* Active progress line */}
                        <div 
                            className="absolute left-0 top-4 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 -z-10" 
                            style={{ width: `${(currentStepIdx / Math.max(1, steps.length - 1)) * 100}%` }}
                        />
                        
                        {steps.map((step, idx) => {
                            const isActive = idx === currentStepIdx;
                            const isCompleted = idx < currentStepIdx;
                            return (
                                <button
                                    key={step.step_number}
                                    onClick={() => {
                                        if (idx < currentStepIdx || validateStep(steps[currentStepIdx].configs)) {
                                            setCurrentStepIdx(idx);
                                        } else {
                                            alert('Mohon isi semua field wajib di step saat ini sebelum pindah.');
                                        }
                                    }}
                                    type="button"
                                    className="flex flex-col items-center focus:outline-none"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100 scale-110 shadow-md'
                                            : isCompleted
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'bg-white text-gray-400 border-2 border-gray-200 hover:border-gray-300'
                                    }`}>
                                        {isCompleted ? '✓' : step.step_number}
                                    </div>
                                    <span className={`mt-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 hidden sm:block ${
                                        isActive ? 'text-blue-600 font-extrabold' : 'text-gray-400 font-medium'
                                    }`}>
                                        {step.step_name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {/* Mobile step name label */}
                    <div className="text-center mt-4 sm:hidden">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            Step {currentStep?.step_number}: {currentStep?.step_name}
                        </span>
                    </div>
                </div>
            )}

            {/* Current Step Fields */}
            <div className="space-y-5 bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm">
                {currentStep?.configs.map(cfg => (
                    <div key={cfg.id} className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            {cfg.input_type === 'FILE_UPLOAD' && <Upload className="w-4 h-4 text-brand-500" />}
                            {cfg.input_type === 'LINK' && <LinkIcon className="w-4 h-4 text-blue-500" />}
                            {cfg.input_type === 'TEXT' && <FileText className="w-4 h-4 text-gray-500" />}
                            {cfg.field_label}
                            {cfg.is_required && <span className="text-red-500 text-xs font-bold">*wajib</span>}
                        </label>

                        {cfg.description && (
                            <p className="text-xs text-gray-400">{cfg.description}</p>
                        )}

                        {cfg.input_type === 'FILE_UPLOAD' && (
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Option 1: Standard File Picker */}
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                        uploading[cfg.id] ? 'bg-gray-50 border-gray-200' : 'bg-white border-brand-200 hover:border-brand-400 hover:bg-brand-50/30'
                                    }`}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && handleFileUpload(cfg.id, e.target.files[0])}
                                            disabled={readOnly || uploading[cfg.id]}
                                            accept="image/*,application/pdf"
                                        />
                                        <Upload className="w-4 h-4 text-brand-600" />
                                        <span className="text-sm text-brand-700 font-medium">Pilih File</span>
                                    </label>

                                    {/* Option 2: Camera Capture (Mobile Optimized) */}
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                        uploading[cfg.id] ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50/30'
                                    }`}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={e => e.target.files?.[0] && handleFileUpload(cfg.id, e.target.files[0])}
                                            disabled={readOnly || uploading[cfg.id]}
                                            accept="image/*"
                                            capture="environment"
                                        />
                                        <Camera className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-blue-700 font-medium">Ambil Foto</span>
                                    </label>
                                </div>

                                {uploading[cfg.id] && (
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                                        <span className="text-xs text-gray-500 font-medium">Sedang mengunggah...</span>
                                    </div>
                                )}
                                
                                {values[cfg.id]?.file_url && (
                                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold border border-emerald-100 flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span className="truncate flex-1">{values[cfg.id].file_url.split('/').pop()}</span>
                                        </div>
                                        {values[cfg.id].file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                            <div className="mt-1 w-full max-w-[200px] rounded-lg overflow-hidden border border-emerald-200">
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL}${values[cfg.id].file_url}`} 
                                                    alt="Preview" 
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <a 
                                                href={`${import.meta.env.VITE_API_URL}${values[cfg.id].file_url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-emerald-600 hover:underline inline-block mt-1"
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
                                    <p className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> Field ini wajib diisi
                                    </p>
                                ) : null;
                            })()
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 pt-2">
                {currentStepIdx > 0 && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        Kembali
                    </button>
                )}
                {!readOnly ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={saving}
                        className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                        ) : isLastStep ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : null}
                        {isLastStep ? 'Simpan Data' : 'Lanjut'}
                    </button>
                ) : (
                    !isLastStep && (
                        <button
                            type="button"
                            onClick={() => setCurrentStepIdx(prev => prev + 1)}
                            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center"
                        >
                            Lanjut
                        </button>
                    )
                )}
            </div>

            {/* Read-only: show info if all empty */}
            {readOnly && existingValues.length === 0 && (
                <p className="text-sm text-gray-400 text-center">Belum ada data yang diisi.</p>
            )}
        </div>
    );
}
