import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, CheckCircle, AlertCircle, Camera, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { compressImage } from '../../utils/compressor';
import type { FormFieldConfig, FormFieldValue } from '../../types';
import { formatServiceType } from '../../utils/format';
import toast from 'react-hot-toast';

interface DynamicSubmissionFormProps {
    formType: string;
    submissionId: string;
    readOnly?: boolean;
    businessTypeId?: number;
    productCategoryId?: number;
    onSaved?: () => void;
}

export default function DynamicSubmissionForm({ formType, submissionId, readOnly = false, businessTypeId, productCategoryId, onSaved }: DynamicSubmissionFormProps) {
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
                const params: Record<string, any> = {};
                if (businessTypeId) params.business_type_id = businessTypeId;
                if (productCategoryId) params.product_category_id = productCategoryId;

                const [configRes, valuesRes] = await Promise.all([
                    api.get(`/form-config/${formType}`, { params }),
                    api.get(`/submission-fields/${submissionId}`).catch(() => ({ data: [] })),
                ]);

                const cfgs: FormFieldConfig[] = configRes.data || [];
                const vals: FormFieldValue[] = valuesRes.data || [];

                // Sertakan field historis jika pengajuan ini sudah memiliki nilai tersimpan (meskipun field di-soft-delete belakangan)
                vals.forEach(v => {
                    if (v.form_field && v.form_field.id && !cfgs.some(c => c.id === v.form_field.id)) {
                        cfgs.push(v.form_field);
                    }
                });

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
    }, [formType, submissionId, businessTypeId, productCategoryId]);

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
                    : cfg.input_type === 'LINK' ? !val?.link_value 
                    : cfg.input_type === 'REPEATER' ? (!val?.text_value || val.text_value === '[]' || val.text_value === '[""]')
                    : (cfg.input_type === 'PRODUCT_LIST' || cfg.input_type === 'INGREDIENT_LIST' || cfg.input_type === 'INGREDIENT_MATRIX' || cfg.input_type === 'ACTIVITY_PHOTOS' || cfg.input_type === 'HALAL_TEAM') ? (!val?.text_value || val.text_value === '[]')
                    : !val?.text_value;
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
                            {cfg.input_type === 'DATE' && <FileText className="w-4 h-4 text-brand-500" />}
                            {cfg.input_type === 'REPEATER' && <FileText className="w-4 h-4 text-indigo-500" />}
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
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <FileText className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{values[cfg.id].file_url.split('/').pop()}</span>
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateValue(cfg.id, 'file_url', '')}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                                                    title="Hapus File"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
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

                        {cfg.input_type === 'DATE' && (
                            <input
                                type="date"
                                className="glass-input text-sm"
                                value={values[cfg.id]?.text_value || ''}
                                onChange={e => updateValue(cfg.id, 'text_value', e.target.value)}
                                disabled={readOnly}
                            />
                        )}

                        {cfg.input_type === 'REPEATER' && (
                            <div className="space-y-2">
                                {(() => {
                                    let items: string[] = [];
                                    try {
                                        items = values[cfg.id]?.text_value ? JSON.parse(values[cfg.id].text_value) : [];
                                        if (!Array.isArray(items)) items = [];
                                    } catch { items = []; }
                                    
                                    return (
                                        <>
                                            {items.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        className="glass-input text-sm flex-1"
                                                        value={item}
                                                        onChange={e => {
                                                            const newItems = [...items];
                                                            newItems[idx] = e.target.value;
                                                            updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                        }}
                                                        disabled={readOnly}
                                                    />
                                                    {!readOnly && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = items.filter((_, i) => i !== idx);
                                                                updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newItems = [...items, ''];
                                                        updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-bold bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100"
                                                >
                                                    + Tambah Item
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {cfg.input_type === 'PRODUCT_LIST' && (
                            <div className="space-y-4">
                                {(() => {
                                     interface ProductItem {
                                         nama: string;
                                         foto_url: string;
                                     }
                                     let products: ProductItem[] = [];
                                     try {
                                         products = values[cfg.id]?.text_value ? JSON.parse(values[cfg.id].text_value) : [];
                                         if (!Array.isArray(products)) products = [];
                                     } catch { products = []; }

                                     const updateProductRow = (rowIdx: number, fieldKey: keyof ProductItem, fieldValue: any) => {
                                         const newProducts = [...products];
                                         newProducts[rowIdx] = {
                                             ...newProducts[rowIdx],
                                             [fieldKey]: fieldValue
                                         };
                                         updateValue(cfg.id, 'text_value', JSON.stringify(newProducts));
                                     };

                                     const handleProductPhotoUpload = async (rowIdx: number, file: File) => {
                                         let finalFile = file;
                                         if (finalFile.type.startsWith('image/')) {
                                             try { finalFile = await compressImage(finalFile); } catch {}
                                         }
                                         if (finalFile.size > 2 * 1024 * 1024) {
                                             alert("Ukuran file tidak boleh lebih dari 2MB");
                                             return;
                                         }
                                         try {
                                             const formData = new FormData();
                                             formData.append('file', finalFile);
                                             const res = await api.post(`/media/upload?subfolder=submission_${submissionId}`, formData);
                                             updateProductRow(rowIdx, 'foto_url', res.data.url);
                                         } catch {
                                             alert("Gagal mengunggah foto produk");
                                         }
                                     };

                                     return (
                                         <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left border-collapse min-w-[600px]">
                                                     <thead>
                                                         <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                             <th className="p-3.5 w-12 text-center">No</th>
                                                             <th className="p-3.5">Jenis Produk</th>
                                                             <th className="p-3.5 w-60">Foto Produk</th>
                                                             {!readOnly && <th className="p-3.5 w-16 text-center">Aksi</th>}
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-gray-50 text-xs">
                                                         {products.map((p, rowIdx) => (
                                                             <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                 <td className="p-3.5 font-bold text-gray-400 text-center pt-5">{rowIdx + 1}</td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Contoh: Kopi Bubuk"
                                                                         value={p.nama || ''}
                                                                         onChange={e => updateProductRow(rowIdx, 'nama', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <div className="flex flex-col gap-2">
                                                                         {p.foto_url ? (
                                                                             <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-1.5 rounded-xl border border-emerald-100 max-w-[220px]">
                                                                                 <img 
                                                                                     src={`${import.meta.env.VITE_API_URL}${p.foto_url}`} 
                                                                                     alt="Product" 
                                                                                     className="w-10 h-10 object-cover rounded-lg border border-emerald-200 shrink-0"
                                                                                 />
                                                                                 <span className="truncate flex-1 text-[10px] font-bold">{p.foto_url.split('/').pop()}</span>
                                                                                 {!readOnly && (
                                                                                     <button
                                                                                         type="button"
                                                                                         onClick={() => updateProductRow(rowIdx, 'foto_url', '')}
                                                                                         className="p-1 hover:bg-emerald-100 text-red-500 rounded-lg transition-colors shrink-0"
                                                                                     >
                                                                                         &times;
                                                                                     </button>
                                                                                 )}
                                                                             </div>
                                                                         ) : (
                                                                             !readOnly && (
                                                                                 <label className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/30 hover:bg-brand-50/50 rounded-xl cursor-pointer transition-colors max-w-[150px] justify-center">
                                                                                     <input
                                                                                         type="file"
                                                                                         className="hidden"
                                                                                         onChange={e => e.target.files?.[0] && handleProductPhotoUpload(rowIdx, e.target.files[0])}
                                                                                         accept="image/*"
                                                                                     />
                                                                                     <Upload className="w-3.5 h-3.5 text-brand-600" />
                                                                                     <span className="text-[10px] text-brand-700 font-bold uppercase tracking-wider">Foto Produk</span>
                                                                                 </label>
                                                                             )
                                                                         )}
                                                                     </div>
                                                                 </td>
                                                                 {!readOnly && (
                                                                     <td className="p-3.5 text-center pt-5">
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const newProducts = products.filter((_, i) => i !== rowIdx);
                                                                                 updateValue(cfg.id, 'text_value', JSON.stringify(newProducts));
                                                                             }}
                                                                             className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                         >
                                                                             <Trash2 className="w-3.5 h-3.5" />
                                                                         </button>
                                                                     </td>
                                                                 )}
                                                             </tr>
                                                         ))}
                                                         {products.length === 0 && (
                                                             <tr>
                                                                 <td colSpan={readOnly ? 3 : 4} className="p-6 text-center text-gray-400 italic font-medium bg-gray-50/25">Belum ada produk ditambahkan.</td>
                                                             </tr>
                                                         )}
                                                     </tbody>
                                                 </table>
                                             </div>
                                             {!readOnly && (
                                                 <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             const newProducts = [...products, { nama: '', foto_url: '' }];
                                                             updateValue(cfg.id, 'text_value', JSON.stringify(newProducts));
                                                         }}
                                                         className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl shadow-sm transition-all"
                                                     >
                                                         + Tambah Produk
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}
                             </div>
                         )}

                         {cfg.input_type === 'INGREDIENT_LIST' && (
                             <div className="space-y-4">
                                 {(() => {
                                     interface IngredientItem {
                                         nama: string;
                                         produsen: string;
                                         penerbit: string;
                                         no_id: string;
                                         tanggal: string;
                                     }
                                     let ingredients: IngredientItem[] = [];
                                     try {
                                         ingredients = values[cfg.id]?.text_value ? JSON.parse(values[cfg.id].text_value) : [];
                                         if (!Array.isArray(ingredients)) ingredients = [];
                                     } catch { ingredients = []; }

                                     const updateIngredientRow = (rowIdx: number, fieldKey: keyof IngredientItem, fieldValue: any) => {
                                         const newIngredients = [...ingredients];
                                         newIngredients[rowIdx] = {
                                             ...newIngredients[rowIdx],
                                             [fieldKey]: fieldValue
                                         };
                                         updateValue(cfg.id, 'text_value', JSON.stringify(newIngredients));
                                     };

                                     return (
                                         <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left border-collapse min-w-[700px]">
                                                     <thead>
                                                         <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                             <th className="p-3.5 w-12 text-center">No</th>
                                                             <th className="p-3.5">Nama Bahan & Merk</th>
                                                             <th className="p-3.5">Produsen</th>
                                                             <th className="p-3.5">Penerbit Sertifikat</th>
                                                             <th className="p-3.5">No ID SH</th>
                                                             <th className="p-3.5">Tanggal Terbit SH</th>
                                                             {!readOnly && <th className="p-3.5 w-16 text-center">Aksi</th>}
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-gray-50 text-xs">
                                                         {ingredients.map((item, rowIdx) => (
                                                             <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                 <td className="p-3.5 font-bold text-gray-400 text-center pt-5">{rowIdx + 1}</td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Nama bahan..."
                                                                         value={item.nama || ''}
                                                                         onChange={e => updateIngredientRow(rowIdx, 'nama', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Produsen..."
                                                                         value={item.produsen || ''}
                                                                         onChange={e => updateIngredientRow(rowIdx, 'produsen', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Penerbit..."
                                                                         value={item.penerbit || ''}
                                                                         onChange={e => updateIngredientRow(rowIdx, 'penerbit', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="No ID SH..."
                                                                         value={item.no_id || ''}
                                                                         onChange={e => updateIngredientRow(rowIdx, 'no_id', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="date"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Tanggal terbit..."
                                                                         value={item.tanggal || ''}
                                                                         onChange={e => updateIngredientRow(rowIdx, 'tanggal', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 {!readOnly && (
                                                                     <td className="p-3.5 text-center pt-5">
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const newIngredients = ingredients.filter((_, i) => i !== rowIdx);
                                                                                 updateValue(cfg.id, 'text_value', JSON.stringify(newIngredients));
                                                                             }}
                                                                             className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                         >
                                                                             <Trash2 className="w-3.5 h-3.5" />
                                                                         </button>
                                                                     </td>
                                                                 )}
                                                             </tr>
                                                         ))}
                                                         {ingredients.length === 0 && (
                                                             <tr>
                                                                 <td colSpan={readOnly ? 6 : 7} className="p-6 text-center text-gray-400 italic font-medium bg-gray-50/25">Belum ada bahan ditambahkan.</td>
                                                             </tr>
                                                         )}
                                                     </tbody>
                                                 </table>
                                             </div>
                                             {!readOnly && (
                                                 <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             const newIngredients = [...ingredients, { nama: '', produsen: '', penerbit: '', no_id: '', tanggal: '' }];
                                                             updateValue(cfg.id, 'text_value', JSON.stringify(newIngredients));
                                                         }}
                                                         className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl shadow-sm transition-all"
                                                     >
                                                         + Tambah Bahan
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}
                             </div>
                         )}

                         {cfg.input_type === 'INGREDIENT_MATRIX' && (
                              <div className="space-y-4">
                                  {(() => {
                                      interface MatrixItem {
                                          nama_produk: string;
                                          bahan: string[];
                                      }
                                      let items: MatrixItem[] = [];
                                      try {
                                          items = values[cfg.id]?.text_value ? JSON.parse(values[cfg.id].text_value) : [];
                                          if (!Array.isArray(items)) items = [];
                                      } catch { items = []; }

                                      // Ambil daftar jenis produk dari field PRODUCT_LIST
                                      const productCfg = configs.find(c => c.input_type === 'PRODUCT_LIST');
                                      let availableProducts: string[] = [];
                                      if (productCfg && values[productCfg.id]?.text_value) {
                                          try {
                                              const parsed = JSON.parse(values[productCfg.id].text_value);
                                              if (Array.isArray(parsed)) {
                                                  availableProducts = parsed.map((p: any) => p.nama?.trim()).filter(Boolean);
                                              }
                                          } catch {}
                                      }

                                      const updateMatrixRow = (rowIdx: number, fieldKey: keyof MatrixItem, fieldValue: any) => {
                                          const newItems = [...items];
                                          newItems[rowIdx] = {
                                              ...newItems[rowIdx],
                                              [fieldKey]: fieldValue
                                          };
                                          updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                      };

                                      const handleSyncFromProducts = () => {
                                          const existingNames = new Set(items.map(i => i.nama_produk));
                                          const merged = [...items];
                                          availableProducts.forEach(p => {
                                              if (!existingNames.has(p)) {
                                                  merged.push({ nama_produk: p, bahan: [] });
                                              }
                                          });
                                          updateValue(cfg.id, 'text_value', JSON.stringify(merged));
                                          toast.success(`Berhasil menyinkronkan ${availableProducts.length} jenis produk ke matriks bahan.`);
                                      };

                                      return (
                                          <div className="space-y-3">
                                              {/* Panel Sinkronisasi Produk Otomatis */}
                                              {availableProducts.length > 0 && (
                                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                                                      <div className="space-y-0.5">
                                                          <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                              Terhubung dengan Daftar Produk ({availableProducts.length} Produk)
                                                          </p>
                                                          <p className="text-[10px] text-emerald-700 font-medium">
                                                              Jenis produk diambil langsung dari Daftar Produk. Anda cukup mengisi bahan yang digunakan.
                                                          </p>
                                                      </div>
                                                      {!readOnly && (
                                                          <button
                                                              type="button"
                                                              onClick={handleSyncFromProducts}
                                                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all shrink-0 active:scale-95"
                                                          >
                                                              + Sinkronkan Jenis Produk
                                                          </button>
                                                      )}
                                                  </div>
                                              )}

                                              <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                  <div className="overflow-x-auto">
                                                      <table className="w-full text-left border-collapse min-w-[600px]">
                                                          <thead>
                                                              <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                                  <th className="p-3.5 w-12 text-center">No</th>
                                                                  <th className="p-3.5 w-1/3">Jenis Produk</th>
                                                                  <th className="p-3.5">Bahan Yang Digunakan</th>
                                                                  {!readOnly && <th className="p-3.5 w-16 text-center">Aksi</th>}
                                                              </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-gray-50 text-xs">
                                                              {items.map((row, rowIdx) => (
                                                                  <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                      <td className="p-3.5 font-bold text-gray-400 text-center pt-5">{rowIdx + 1}</td>
                                                                      <td className="p-3.5">
                                                                          {availableProducts.length > 0 ? (
                                                                              <div className="space-y-1">
                                                                                  <select
                                                                                      className="glass-input text-xs w-full py-1.5 font-bold text-gray-800"
                                                                                      value={row.nama_produk || ''}
                                                                                      onChange={e => updateMatrixRow(rowIdx, 'nama_produk', e.target.value)}
                                                                                      disabled={readOnly}
                                                                                  >
                                                                                      <option value="">Pilih Jenis Produk...</option>
                                                                                      {availableProducts.map((pName, pIdx) => (
                                                                                          <option key={pIdx} value={pName}>{pName}</option>
                                                                                      ))}
                                                                                  </select>
                                                                                  {!availableProducts.includes(row.nama_produk) && row.nama_produk && (
                                                                                      <p className="text-[10px] text-amber-600 font-medium">Custom: {row.nama_produk}</p>
                                                                                  )}
                                                                              </div>
                                                                          ) : (
                                                                              <input
                                                                                  type="text"
                                                                                  className="glass-input text-xs w-full py-1.5"
                                                                                  placeholder="Jenis produk..."
                                                                                  value={row.nama_produk || ''}
                                                                                  onChange={e => updateMatrixRow(rowIdx, 'nama_produk', e.target.value)}
                                                                                  disabled={readOnly}
                                                                              />
                                                                          )}
                                                                      </td>
                                                                      <td className="p-3.5">
                                                                          <div className="flex flex-col gap-2">
                                                                              <div className="flex flex-wrap gap-1.5">
                                                                                  {(row.bahan || []).map((b, bIdx) => (
                                                                                      <span key={bIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[9px] uppercase tracking-wider">
                                                                                          {b}
                                                                                          {!readOnly && (
                                                                                              <button
                                                                                                  type="button"
                                                                                                  onClick={() => {
                                                                                                      const newBahan = row.bahan.filter((_, i) => i !== bIdx);
                                                                                                      updateMatrixRow(rowIdx, 'bahan', newBahan);
                                                                                                  }}
                                                                                                  className="text-red-500 hover:text-red-700 font-bold text-xs"
                                                                                              >
                                                                                                  &times;
                                                                                              </button>
                                                                                          )}
                                                                                      </span>
                                                                                  ))}
                                                                              </div>
                                                                              {!readOnly && (
                                                                                  <input
                                                                                      type="text"
                                                                                      className="glass-input text-[10px] w-full max-w-[250px] py-1"
                                                                                      placeholder="Ketik nama bahan + Enter..."
                                                                                      onKeyDown={e => {
                                                                                          if (e.key === 'Enter') {
                                                                                              e.preventDefault();
                                                                                              const val = e.currentTarget.value.trim();
                                                                                              if (val) {
                                                                                                  const newBahan = [...(row.bahan || []), val];
                                                                                                  updateMatrixRow(rowIdx, 'bahan', newBahan);
                                                                                                  e.currentTarget.value = '';
                                                                                              }
                                                                                          }
                                                                                      }}
                                                                                  />
                                                                              )}
                                                                          </div>
                                                                      </td>
                                                                      {!readOnly && (
                                                                          <td className="p-3.5 text-center pt-5">
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={() => {
                                                                                      const newItems = items.filter((_, i) => i !== rowIdx);
                                                                                      updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                                                  }}
                                                                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                              >
                                                                                  <Trash2 className="w-3.5 h-3.5" />
                                                                              </button>
                                                                          </td>
                                                                      )}
                                                                  </tr>
                                                              ))}
                                                              {items.length === 0 && (
                                                                  <tr>
                                                                      <td colSpan={readOnly ? 3 : 4} className="p-6 text-center text-gray-400 italic font-medium bg-gray-50/25">
                                                                          Belum ada baris bahan. {availableProducts.length > 0 ? 'Klik "Sinkronkan Jenis Produk" di atas untuk mengisi otomatis.' : 'Klik Tambah Baris untuk memulai.'}
                                                                      </td>
                                                                  </tr>
                                                              )}
                                                          </tbody>
                                                      </table>
                                                  </div>
                                                  {!readOnly && (
                                                      <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex items-center gap-2">
                                                          <button
                                                              type="button"
                                                              onClick={() => {
                                                                  const unusedProduct = availableProducts.find(p => !items.some(it => it.nama_produk === p)) || '';
                                                                  const newItems = [...items, { nama_produk: unusedProduct, bahan: [] }];
                                                                  updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                              }}
                                                              className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl shadow-sm transition-all"
                                                          >
                                                              + Tambah Baris Produk
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  })()}
                              </div>
                          )}

                         {cfg.input_type === 'ACTIVITY_PHOTOS' && (
                             <div className="space-y-4">
                                 {(() => {
                                     interface ActivityItem {
                                         nama_kegiatan: string;
                                         fotos: string[];
                                     }
                                     let items: ActivityItem[] = [];
                                     try {
                                         items = values[cfg.id]?.text_value ? JSON.parse(values[cfg.id].text_value) : [];
                                         if (!Array.isArray(items)) items = [];
                                     } catch { items = []; }

                                     const updateActivityRow = (rowIdx: number, fieldKey: keyof ActivityItem, fieldValue: any) => {
                                         const newItems = [...items];
                                         newItems[rowIdx] = {
                                             ...newItems[rowIdx],
                                             [fieldKey]: fieldValue
                                         };
                                         updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                     };

                                     const handleActivityPhotoUpload = async (rowIdx: number, files: FileList) => {
                                         const newPhotos = [...(items[rowIdx]?.fotos || [])];
                                         for (let i = 0; i < files.length; i++) {
                                             let file = files[i];
                                             if (file.type.startsWith('image/')) {
                                                 try { file = await compressImage(file); } catch {}
                                             }
                                             if (file.size > 2 * 1024 * 1024) {
                                                 alert("Ukuran file tidak boleh lebih dari 2MB");
                                                 continue;
                                             }
                                             try {
                                                 const formData = new FormData();
                                                 formData.append('file', file);
                                                 const res = await api.post(`/media/upload?subfolder=submissions`, formData);
                                                 newPhotos.push(res.data.url);
                                             } catch {
                                                 alert("Gagal mengunggah foto");
                                             }
                                         }
                                         updateActivityRow(rowIdx, 'fotos', newPhotos);
                                     };

                                     return (
                                         <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left border-collapse min-w-[600px]">
                                                     <thead>
                                                         <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                             <th className="p-3.5 w-12 text-center">No</th>
                                                             <th className="p-3.5 w-1/3">Nama Kegiatan</th>
                                                             <th className="p-3.5">Foto Kegiatan</th>
                                                             {!readOnly && <th className="p-3.5 w-16 text-center">Aksi</th>}
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-gray-50 text-xs">
                                                         {items.map((row, rowIdx) => (
                                                             <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                 <td className="p-3.5 font-bold text-gray-400 text-center pt-5">{rowIdx + 1}</td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Nama kegiatan..."
                                                                         value={row.nama_kegiatan || ''}
                                                                         onChange={e => updateActivityRow(rowIdx, 'nama_kegiatan', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <div className="flex flex-col gap-3">
                                                                         <div className="flex flex-wrap gap-2.5">
                                                                             {(row.fotos || []).map((fUrl, fIdx) => (
                                                                                 <div key={fIdx} className="relative group/photo w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                                                                                     <img
                                                                                         src={`${import.meta.env.VITE_API_URL}${fUrl}`}
                                                                                         alt="Kegiatan"
                                                                                         className="w-full h-full object-cover"
                                                                                     />
                                                                                     {!readOnly && (
                                                                                         <button
                                                                                             type="button"
                                                                                             onClick={() => {
                                                                                                 const newPhotos = row.fotos.filter((_, i) => i !== fIdx);
                                                                                                 updateActivityRow(rowIdx, 'fotos', newPhotos);
                                                                                             }}
                                                                                             className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-90"
                                                                                         >
                                                                                             <Trash2 className="w-3 h-3" />
                                                                                         </button>
                                                                                     )}
                                                                                 </div>
                                                                             ))}
                                                                         </div>
                                                                         {!readOnly && (
                                                                             <div className="flex items-center gap-2">
                                                                                 <label className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/40 rounded-xl cursor-pointer transition-all">
                                                                                     <input
                                                                                         type="file"
                                                                                         className="hidden"
                                                                                         multiple
                                                                                         onChange={e => e.target.files && handleActivityPhotoUpload(rowIdx, e.target.files)}
                                                                                         accept="image/*"
                                                                                     />
                                                                                     <Upload className="w-3.5 h-3.5 text-brand-600" />
                                                                                     <span className="text-[10px] text-brand-700 font-bold uppercase tracking-wider">Pilih Foto / Ambil Gambar</span>
                                                                                 </label>
                                                                             </div>
                                                                         )}
                                                                     </div>
                                                                 </td>
                                                                 {!readOnly && (
                                                                     <td className="p-3.5 text-center pt-5">
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const newItems = items.filter((_, i) => i !== rowIdx);
                                                                                 updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                                             }}
                                                                             className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                         >
                                                                             <Trash2 className="w-3.5 h-3.5" />
                                                                         </button>
                                                                     </td>
                                                                 )}
                                                             </tr>
                                                         ))}
                                                         {items.length === 0 && (
                                                             <tr>
                                                                 <td colSpan={readOnly ? 3 : 4} className="p-6 text-center text-gray-400 italic font-medium bg-gray-50/25">Belum ada data ditambahkan.</td>
                                                             </tr>
                                                         )}
                                                     </tbody>
                                                 </table>
                                             </div>
                                             {!readOnly && (
                                                 <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             const newItems = [...items, { nama_kegiatan: '', fotos: [] }];
                                                             updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                         }}
                                                         className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl shadow-sm transition-all"
                                                     >
                                                         + Tambah Baris
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}
                             </div>
                         )}

                         {cfg.input_type === 'HALAL_TEAM' && (
                             <div className="space-y-4">
                                 {(() => {
                                     interface HalalTeamItem {
                                         nama: string;
                                         jabatan: string;
                                         posisi_tim: string;
                                         ttd_url: string;
                                     }
                                     let items: HalalTeamItem[] = [];
                                     try {
                                         items = values[cfg.id]?.text_value ? JSON.parse(values[cfg.id].text_value) : [];
                                         if (!Array.isArray(items)) items = [];
                                     } catch { items = []; }

                                     const updateTeamRow = (rowIdx: number, fieldKey: keyof HalalTeamItem, fieldValue: any) => {
                                         const newItems = [...items];
                                         newItems[rowIdx] = {
                                             ...newItems[rowIdx],
                                             [fieldKey]: fieldValue
                                         };
                                         updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                     };

                                     const handleSignatureUpload = async (rowIdx: number, file: File) => {
                                         let finalFile = file;
                                         if (finalFile.type.startsWith('image/')) {
                                             try { finalFile = await compressImage(finalFile); } catch {}
                                         }
                                         if (finalFile.size > 2 * 1024 * 1024) {
                                             alert("Ukuran file tidak boleh lebih dari 2MB");
                                             return;
                                         }
                                         try {
                                             const formData = new FormData();
                                             formData.append('file', finalFile);
                                             const res = await api.post(`/media/upload?subfolder=submissions`, formData);
                                             updateTeamRow(rowIdx, 'ttd_url', res.data.url);
                                         } catch {
                                             alert("Gagal mengunggah tanda tangan");
                                         }
                                     };

                                     return (
                                         <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left border-collapse min-w-[650px]">
                                                     <thead>
                                                         <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                             <th className="p-3.5 w-12 text-center">No</th>
                                                             <th className="p-3.5">Nama</th>
                                                             <th className="p-3.5">Jabatan</th>
                                                             <th className="p-3.5">Posisi Di Tim</th>
                                                             <th className="p-3.5 w-48">Tanda Tangan</th>
                                                             {!readOnly && <th className="p-3.5 w-16 text-center">Aksi</th>}
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-gray-50 text-xs">
                                                         {items.map((row, rowIdx) => (
                                                             <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                 <td className="p-3.5 font-bold text-gray-400 text-center pt-5">{rowIdx + 1}</td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Nama..."
                                                                         value={row.nama || ''}
                                                                         onChange={e => updateTeamRow(rowIdx, 'nama', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Jabatan..."
                                                                         value={row.jabatan || ''}
                                                                         onChange={e => updateTeamRow(rowIdx, 'jabatan', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <input
                                                                         type="text"
                                                                         className="glass-input text-xs w-full py-1.5"
                                                                         placeholder="Posisi di tim..."
                                                                         value={row.posisi_tim || ''}
                                                                         onChange={e => updateTeamRow(rowIdx, 'posisi_tim', e.target.value)}
                                                                         disabled={readOnly}
                                                                     />
                                                                 </td>
                                                                 <td className="p-3.5">
                                                                     <div className="flex flex-col gap-1.5">
                                                                         {row.ttd_url ? (
                                                                             <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 p-1 rounded-lg border border-emerald-100 max-w-[200px]">
                                                                                 <img
                                                                                     src={`${import.meta.env.VITE_API_URL}${row.ttd_url}`}
                                                                                     alt="Ttd"
                                                                                     className="w-10 h-10 object-contain rounded border border-emerald-200 shrink-0 bg-white"
                                                                                 />
                                                                                 <span className="truncate flex-1 text-[9px] font-bold">{row.ttd_url.split('/').pop()}</span>
                                                                                 {!readOnly && (
                                                                                     <button
                                                                                         type="button"
                                                                                         onClick={() => updateTeamRow(rowIdx, 'ttd_url', '')}
                                                                                         className="p-0.5 hover:bg-emerald-100 text-red-500 rounded transition-colors shrink-0 font-bold"
                                                                                     >
                                                                                         &times;
                                                                                     </button>
                                                                                 )}
                                                                             </div>
                                                                         ) : (
                                                                             !readOnly && (
                                                                                 <label className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/40 rounded-xl cursor-pointer transition-colors max-w-[150px] justify-center">
                                                                                     <input
                                                                                         type="file"
                                                                                         className="hidden"
                                                                                         onChange={e => e.target.files?.[0] && handleSignatureUpload(rowIdx, e.target.files[0])}
                                                                                         accept="image/*"
                                                                                     />
                                                                                     <Upload className="w-3.5 h-3.5 text-brand-600" />
                                                                                     <span className="text-[9px] text-brand-700 font-bold uppercase tracking-wider">Ttd / Kamera</span>
                                                                                 </label>
                                                                             )
                                                                         )}
                                                                     </div>
                                                                 </td>
                                                                 {!readOnly && (
                                                                     <td className="p-3.5 text-center pt-5">
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const newItems = items.filter((_, i) => i !== rowIdx);
                                                                                 updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                                             }}
                                                                             className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                         >
                                                                             <Trash2 className="w-3.5 h-3.5" />
                                                                         </button>
                                                                     </td>
                                                                 )}
                                                             </tr>
                                                         ))}
                                                         {items.length === 0 && (
                                                             <tr>
                                                                 <td colSpan={readOnly ? 5 : 6} className="p-6 text-center text-gray-400 italic font-medium bg-gray-50/25">Belum ada data ditambahkan.</td>
                                                             </tr>
                                                         )}
                                                     </tbody>
                                                 </table>
                                             </div>
                                             {!readOnly && (
                                                 <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             const newItems = [...items, { nama: '', jabatan: '', posisi_tim: '', ttd_url: '' }];
                                                             updateValue(cfg.id, 'text_value', JSON.stringify(newItems));
                                                         }}
                                                         className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl shadow-sm transition-all"
                                                     >
                                                         + Tambah Anggota
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}
                             </div>
                         )}

                        {/* Required field warning */}
                        {cfg.is_required && !readOnly && (
                            (() => {
                                const v = values[cfg.id];
                                const isEmpty = cfg.input_type === 'FILE_UPLOAD' ? !v?.file_url
                                    : cfg.input_type === 'LINK' ? !v?.link_value 
                                    : cfg.input_type === 'REPEATER' ? (!v?.text_value || v.text_value === '[]' || v.text_value === '[""]')
                                    : (cfg.input_type === 'PRODUCT_LIST' || cfg.input_type === 'INGREDIENT_LIST' || cfg.input_type === 'INGREDIENT_MATRIX' || cfg.input_type === 'ACTIVITY_PHOTOS' || cfg.input_type === 'HALAL_TEAM') ? (!v?.text_value || v.text_value === '[]')
                                    : !v?.text_value;
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
