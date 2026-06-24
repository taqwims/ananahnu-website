import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
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
    const [currentStepIdx, setCurrentStepIdx] = useState(0);

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

    // Reset current step when configs change (e.g. changing service type)
    useEffect(() => {
        setCurrentStepIdx(0);
    }, [configs]);

    const currentStep = steps[currentStepIdx];
    const isLastStep = currentStepIdx === steps.length - 1;

    const validateStep = (stepConfigs: FormFieldConfig[]) => {
        for (const cfg of stepConfigs) {
            if (cfg.is_required) {
                const val = fieldValues[cfg.id];
                const isEmpty = cfg.input_type === 'FILE_UPLOAD' ? !val?.file_url
                    : cfg.input_type === 'LINK' ? !val?.link_value : !val?.text_value;
                if (isEmpty) {
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        if (!currentStep) return;
        if (!validateStep(currentStep.configs)) {
            alert('Mohon isi semua field wajib sebelum melanjutkan.');
            return;
        }
        if (!isLastStep) {
            setCurrentStepIdx(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(prev => prev - 1);
        }
    };

    if (configs.length === 0) {
        return (
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Dokumen Persyaratan</h3>
                <p className="text-sm text-gray-400 text-center py-4">Pilih jenis layanan untuk melihat persyaratan.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-extrabold text-gray-800 tracking-tight">Dokumen Persyaratan</h3>
                <p className="text-xs text-gray-400 font-medium">Lengkapi file dan informasi persyaratan pengajuan.</p>
            </div>

            {/* Step Wizard Progress Bar */}
            {steps.length > 1 && (
                <div className="mb-6 px-1">
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

                        {/* Required field warning */}
                        {cfg.is_required && (
                            (() => {
                                const val = fieldValues[cfg.id];
                                const isEmpty = cfg.input_type === 'FILE_UPLOAD' ? !val?.file_url
                                    : cfg.input_type === 'LINK' ? !val?.link_value : !val?.text_value;
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
            {steps.length > 1 && (
                <div className="flex items-center gap-3 pt-2">
                    {currentStepIdx > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all text-xs flex items-center justify-center gap-2"
                        >
                            Kembali
                        </button>
                    )}
                    {!isLastStep ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center"
                        >
                            Lanjut
                        </button>
                    ) : (
                        <div className="flex-[2] py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Semua Dokumen Siap
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
