import { useState, useEffect } from 'react';
import { FileText, Upload, Link as LinkIcon, ChevronDown, ChevronUp, Calendar, List } from 'lucide-react';
import type { Submission, User, FormFieldValue } from '../../../types';
import DynamicSubmissionForm from '../DynamicSubmissionForm';

interface DocumentListProps {
    submission: Submission;
    user: User | null;
    fieldValues: FormFieldValue[];
    editingData: boolean;
    setEditingData: (val: boolean) => void;
    onRefresh: () => Promise<void>;
    defaultCollapsed?: boolean;
}

export const DocumentList = ({ 
    submission, 
    user, 
    fieldValues, 
    editingData, 
    setEditingData, 
    onRefresh,
    defaultCollapsed = false
}: DocumentListProps) => {
    const serviceType = submission.service_type || submission.client?.service_type || '';
    const canEdit = (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_ADVISOR' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'MARKETING' || (user?.role === 'BUSINESS_DEVELOPMENT' && serviceType === 'REGULER') || (user?.role === 'CLIENT' && (submission.status === 'DRAFT' || submission.status === 'REVISION')));

    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [activeStepIdx, setActiveStepIdx] = useState(0);

    useEffect(() => {
        setIsCollapsed(defaultCollapsed);
    }, [defaultCollapsed]);

    useEffect(() => {
        if (editingData) {
            setIsCollapsed(false);
        }
    }, [editingData]);

    // Scope IDs from the submission for filtering
    const subBtId = submission.business_type_id || submission.business_type?.id || (submission.cost_detail as any)?.business_type_id;
    const subPcId = submission.product_category_id || submission.product_category?.id || (submission.cost_detail as any)?.product_category_id || (submission.cost_detail as any)?.product_category?.id;

    // Filter field values by scope (business_type_id and product_category_id)
    // Rule: if a field config has a scope set, only show it when the submission matches that scope.
    // If the field config has NO scope (null), it's global and always shown.
    const scopedFieldValues = fieldValues.filter(fv => {
        const cfg = fv.form_field;
        if (!cfg) return true;
        
        // Convert to numbers or strings to safely compare
        if (cfg.business_type_id != null) {
            if (!subBtId || Number(cfg.business_type_id) !== Number(subBtId)) return false;
        }
        if (cfg.product_category_id != null) {
            if (!subPcId || Number(cfg.product_category_id) !== Number(subPcId)) return false;
        }
        return true;
    });

    const groupedSteps = scopedFieldValues.reduce((acc, fv) => {
        const stepNum = fv.form_field?.step_number || 1;
        const stepName = fv.form_field?.step_name || `Step ${stepNum}`;
        if (!acc[stepNum]) {
            acc[stepNum] = {
                step_number: stepNum,
                step_name: stepName,
                fieldValues: []
            };
        }
        if (fv.form_field?.step_name && acc[stepNum].step_name === `Step ${stepNum}`) {
            acc[stepNum].step_name = fv.form_field.step_name;
        }
        acc[stepNum].fieldValues.push(fv);
        return acc;
    }, {} as Record<number, { step_number: number; step_name: string; fieldValues: FormFieldValue[] }>);

    const steps = Object.values(groupedSteps).sort((a, b) => a.step_number - b.step_number);
    steps.forEach(step => {
        step.fieldValues.sort((a, b) => (a.form_field?.sort_order || 0) - (b.form_field?.sort_order || 0));
    });

    // Ensure activeStepIdx is valid if step count changed due to scope filtering
    const safeStepIdx = Math.min(activeStepIdx, Math.max(0, steps.length - 1));

    return (
        <div className="glass-panel p-6 shadow-xl border border-white/40">
            <div 
                className="flex justify-between items-center mb-6 cursor-pointer select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    Dokumen & Data
                    {isCollapsed ? <ChevronDown className="w-5 h-5 text-gray-400 ml-1" /> : <ChevronUp className="w-5 h-5 text-gray-400 ml-1" />}
                </h3>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {canEdit && (
                        <button 
                            onClick={() => setEditingData(!editingData)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
                        >
                            {editingData ? 'Batal Edit' : 'Edit Data'}
                        </button>
                    )}
                </div>
            </div>
            
            {!isCollapsed && (
                <>
                    {editingData ? (
                        <DynamicSubmissionForm
                            formType={serviceType}
                            submissionId={submission.id}
                            businessTypeId={subBtId}
                            productCategoryId={subPcId}
                            onSaved={() => {
                                setEditingData(false);
                                onRefresh();
                            }}
                        />
                    ) : (
                        <>
                            {/* Step Wizard Progress Bar */}
                            {steps.length > 1 && (
                                <div className="mb-8 px-2">
                                    <div className="flex items-center justify-between relative">
                                        {/* Background line */}
                                        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-100 rounded-full -z-10" />
                                        {/* Active progress line */}
                                        <div 
                                            className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-blue-50 to-indigo-600 rounded-full transition-all duration-300 -z-10" 
                                            style={{ width: `${(activeStepIdx / Math.max(1, steps.length - 1)) * 100}%` }}
                                        />
                                        
                                        {steps.map((step, idx) => {
                                            const isActive = idx === safeStepIdx;
                                            return (
                                                <button
                                                    key={step.step_number}
                                                    onClick={() => setActiveStepIdx(idx)}
                                                    type="button"
                                                    className="flex flex-col items-center focus:outline-none cursor-pointer"
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                                        isActive 
                                                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100 scale-110 shadow-md'
                                                             : 'bg-white text-gray-400 border-2 border-gray-200 hover:border-gray-300'
                                                    }`}>
                                                        {step.step_number}
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
                                            Step {steps[safeStepIdx]?.step_number}: {steps[safeStepIdx]?.step_name}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {steps.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {steps[safeStepIdx]?.fieldValues.map(fv => {
                                        const isProductList = fv.form_field.input_type === 'PRODUCT_LIST' || fv.form_field.input_type === 'INGREDIENT_LIST' || fv.form_field.input_type === 'INGREDIENT_MATRIX' || fv.form_field.input_type === 'ACTIVITY_PHOTOS' || fv.form_field.input_type === 'HALAL_TEAM';
                                        return (
                                            <div key={fv.id} className={`p-3 bg-white/50 rounded-xl border border-gray-100 hover:border-brand-200 transition-all group/item shadow-sm ${isProductList ? 'col-span-1 sm:col-span-2 flex flex-col items-stretch' : 'flex items-center justify-between'}`}>
                                                <div className="flex items-start gap-3 overflow-hidden flex-1">
                                                    <div className="p-2 rounded-lg bg-gray-50 group-hover/item:bg-brand-50 transition-colors shrink-0">
                                                        {fv.form_field.input_type === 'FILE_UPLOAD' && <Upload className="w-4 h-4 text-brand-500" />}
                                                        {fv.form_field.input_type === 'LINK' && <LinkIcon className="w-4 h-4 text-blue-500" />}
                                                        {fv.form_field.input_type === 'TEXT' && <FileText className="w-4 h-4 text-gray-400" />}
                                                        {fv.form_field.input_type === 'DATE' && <Calendar className="w-4 h-4 text-emerald-500" />}
                                                        {fv.form_field.input_type === 'REPEATER' && <List className="w-4 h-4 text-indigo-500" />}
                                                        {fv.form_field.input_type === 'PRODUCT_LIST' && <List className="w-4 h-4 text-brand-500" />}
                                                        {fv.form_field.input_type === 'INGREDIENT_LIST' && <List className="w-4 h-4 text-amber-500" />}
                                                        {fv.form_field.input_type === 'INGREDIENT_MATRIX' && <List className="w-4 h-4 text-pink-500" />}
                                                        {fv.form_field.input_type === 'ACTIVITY_PHOTOS' && <Upload className="w-4 h-4 text-emerald-500" />}
                                                        {fv.form_field.input_type === 'HALAL_TEAM' && <List className="w-4 h-4 text-indigo-500" />}
                                                    </div>
                                                    <div className="overflow-hidden flex-1">
                                                        <span className="text-xs font-bold text-gray-700 block truncate">{fv.form_field.field_label}</span>
                                                        {fv.text_value && (
                                                            fv.form_field.input_type === 'REPEATER' ? (
                                                                (() => {
                                                                    let items: string[] = [];
                                                                    try {
                                                                        items = JSON.parse(fv.text_value);
                                                                        if (!Array.isArray(items)) items = [];
                                                                    } catch { items = []; }
                                                                    if (items.length === 0) return <p className="text-[10px] text-gray-400 italic">Kosong</p>;
                                                                    return (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {items.map((item, idx) => (
                                                                                <span key={idx} className="inline-block px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                                                                                    {item}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : fv.form_field.input_type === 'PRODUCT_LIST' ? (
                                                                (() => {
                                                                    interface ProductItem {
                                                                        nama: string;
                                                                        foto_url: string;
                                                                    }
                                                                    let products: ProductItem[] = [];
                                                                    try {
                                                                        products = JSON.parse(fv.text_value);
                                                                        if (!Array.isArray(products)) products = [];
                                                                    } catch { products = []; }
                                                                    if (products.length === 0) return <p className="text-[10px] text-gray-400 italic mt-1">Belum ada produk ditambahkan</p>;
                                                                    return (
                                                                        <div className="mt-3 border border-gray-150 rounded-xl overflow-hidden bg-white/85">
                                                                            <table className="w-full text-left border-collapse text-[11px]">
                                                                                <thead>
                                                                                    <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                                        <th className="p-2">Jenis Produk</th>
                                                                                        <th className="p-2 w-40">Foto</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                                    {products.map((p, pIdx) => (
                                                                                        <tr key={pIdx} className="hover:bg-gray-50/50 transition-colors align-middle">
                                                                                            <td className="p-2 text-center font-bold text-gray-400">{pIdx + 1}</td>
                                                                                            <td className="p-2 font-bold text-gray-800">{p.nama}</td>
                                                                                            <td className="p-2">
                                                                                                {p.foto_url ? (
                                                                                                    <a href={`${import.meta.env.VITE_API_URL}${p.foto_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-brand-600">
                                                                                                        <img 
                                                                                                            src={`${import.meta.env.VITE_API_URL}${p.foto_url}`} 
                                                                                                            alt={p.nama} 
                                                                                                            className="w-8 h-8 object-cover rounded border border-gray-100 shrink-0"
                                                                                                        />
                                                                                                        <span className="truncate text-[9px] font-medium max-w-[100px]">{p.foto_url.split('/').pop()}</span>
                                                                                                    </a>
                                                                                                ) : (
                                                                                                    <span className="text-[9px] text-gray-300 italic">Tidak ada foto</span>
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : fv.form_field.input_type === 'INGREDIENT_LIST' ? (
                                                                (() => {
                                                                    interface IngredientItem {
                                                                        nama: string;
                                                                        produsen: string;
                                                                        penerbit: string;
                                                                        no_id: string;
                                                                        tanggal: string;
                                                                    }
                                                                    let ingredients: IngredientItem[] = [];
                                                                    try {
                                                                        ingredients = JSON.parse(fv.text_value);
                                                                        if (!Array.isArray(ingredients)) ingredients = [];
                                                                    } catch { ingredients = []; }
                                                                    if (ingredients.length === 0) return <p className="text-[10px] text-gray-400 italic mt-1">Belum ada bahan ditambahkan</p>;
                                                                    return (
                                                                        <div className="mt-3 border border-gray-150 rounded-xl overflow-hidden bg-white/85">
                                                                            <table className="w-full text-left border-collapse text-[11px]">
                                                                                <thead>
                                                                                    <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                                        <th className="p-2">Nama Bahan & Merk</th>
                                                                                        <th className="p-2">Produsen</th>
                                                                                        <th className="p-2">Penerbit Sertifikat</th>
                                                                                        <th className="p-2">No ID SH</th>
                                                                                        <th className="p-2">Tanggal Terbit SH</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                                    {ingredients.map((item, idx) => (
                                                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors align-middle">
                                                                                            <td className="p-2 text-center font-bold text-gray-400">{idx + 1}</td>
                                                                                            <td className="p-2 font-bold text-gray-800">{item.nama}</td>
                                                                                            <td className="p-2">{item.produsen || '-'}</td>
                                                                                            <td className="p-2">{item.penerbit || '-'}</td>
                                                                                            <td className="p-2 font-mono text-[10px]">{item.no_id || '-'}</td>
                                                                                            <td className="p-2">{item.tanggal || '-'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : fv.form_field.input_type === 'INGREDIENT_MATRIX' ? (
                                                                 (() => {
                                                                     interface MatrixItem {
                                                                         nama_produk: string;
                                                                         bahan: string[];
                                                                     }
                                                                     let items: MatrixItem[] = [];
                                                                     try {
                                                                         items = JSON.parse(fv.text_value);
                                                                         if (!Array.isArray(items)) items = [];
                                                                     } catch { items = []; }
                                                                     if (items.length === 0) return <p className="text-[10px] text-gray-400 italic mt-1">Belum ada data ditambahkan</p>;
                                                                     return (
                                                                         <div className="mt-3 border border-gray-150 rounded-xl overflow-hidden bg-white/85">
                                                                             <table className="w-full text-left border-collapse text-[11px]">
                                                                                 <thead>
                                                                                     <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                                         <th className="p-2 w-10 text-center">No</th>
                                                                                         <th className="p-2 w-1/3">Jenis Produk</th>
                                                                                         <th className="p-2">Bahan Yang Digunakan</th>
                                                                                     </tr>
                                                                                 </thead>
                                                                                 <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                                     {items.map((row, idx) => (
                                                                                         <tr key={idx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                                             <td className="p-2 text-center font-bold text-gray-400 pt-3">{idx + 1}</td>
                                                                                             <td className="p-2 font-bold text-gray-800 pt-3">{row.nama_produk}</td>
                                                                                             <td className="p-2 pt-3">
                                                                                                 <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                                                                                                     {(row.bahan || []).map((b, bIdx) => (
                                                                                                         <li key={bIdx}>{b}</li>
                                                                                                     ))}
                                                                                                     {(row.bahan || []).length === 0 && (
                                                                                                         <span className="text-[10px] text-gray-300 italic">-</span>
                                                                                                     )}
                                                                                                 </ul>
                                                                                             </td>
                                                                                         </tr>
                                                                                     ))}
                                                                                 </tbody>
                                                                             </table>
                                                                         </div>
                                                                     );
                                                                 })()
                                                            ) : fv.form_field.input_type === 'ACTIVITY_PHOTOS' ? (
                                                                (() => {
                                                                    interface ActivityItem {
                                                                        nama_kegiatan: string;
                                                                        fotos: string[];
                                                                    }
                                                                    let items: ActivityItem[] = [];
                                                                    try {
                                                                        items = JSON.parse(fv.text_value);
                                                                        if (!Array.isArray(items)) items = [];
                                                                    } catch { items = []; }
                                                                    if (items.length === 0) return <p className="text-[10px] text-gray-400 italic mt-1">Belum ada data ditambahkan</p>;
                                                                    return (
                                                                        <div className="mt-3 border border-gray-150 rounded-xl overflow-hidden bg-white/85">
                                                                            <table className="w-full text-left border-collapse text-[11px]">
                                                                                <thead>
                                                                                    <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                                        <th className="p-2 w-1/3">Nama Kegiatan</th>
                                                                                        <th className="p-2">Foto Kegiatan</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                                    {items.map((row, idx) => (
                                                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                                            <td className="p-2 text-center font-bold text-gray-400 pt-3">{idx + 1}</td>
                                                                                            <td className="p-2 font-bold text-gray-800 pt-3">{row.nama_kegiatan}</td>
                                                                                            <td className="p-2 pt-3">
                                                                                                <div className="flex flex-wrap gap-2 pb-2">
                                                                                                    {(row.fotos || []).map((fUrl, fIdx) => (
                                                                                                        <a
                                                                                                            key={fIdx}
                                                                                                            href={`${import.meta.env.VITE_API_URL}${fUrl}`}
                                                                                                            target="_blank"
                                                                                                            rel="noreferrer"
                                                                                                            className="block w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-brand-400 transition-colors shrink-0 bg-gray-50"
                                                                                                        >
                                                                                                            <img
                                                                                                                src={`${import.meta.env.VITE_API_URL}${fUrl}`}
                                                                                                                alt="Kegiatan"
                                                                                                                className="w-full h-full object-cover"
                                                                                                            />
                                                                                                        </a>
                                                                                                    ))}
                                                                                                    {(row.fotos || []).length === 0 && (
                                                                                                        <span className="text-[10px] text-gray-300 italic">Tidak ada foto</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : fv.form_field.input_type === 'HALAL_TEAM' ? (
                                                                (() => {
                                                                    interface HalalTeamItem {
                                                                        nama: string;
                                                                        jabatan: string;
                                                                        posisi_tim: string;
                                                                        ttd_url: string;
                                                                    }
                                                                    let items: HalalTeamItem[] = [];
                                                                    try {
                                                                        items = JSON.parse(fv.text_value);
                                                                        if (!Array.isArray(items)) items = [];
                                                                    } catch { items = []; }
                                                                    if (items.length === 0) return <p className="text-[10px] text-gray-400 italic mt-1">Belum ada data ditambahkan</p>;
                                                                    return (
                                                                        <div className="mt-3 border border-gray-155 rounded-xl overflow-hidden bg-white/85">
                                                                            <table className="w-full text-left border-collapse text-[11px]">
                                                                                <thead>
                                                                                    <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                                        <th className="p-2">Nama</th>
                                                                                        <th className="p-2">Jabatan</th>
                                                                                        <th className="p-2">Posisi Di Tim</th>
                                                                                        <th className="p-2 w-24">Tanda Tangan</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                                    {items.map((row, idx) => (
                                                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors align-middle">
                                                                                            <td className="p-2 text-center font-bold text-gray-400">{idx + 1}</td>
                                                                                            <td className="p-2 font-bold text-gray-800">{row.nama}</td>
                                                                                            <td className="p-2">{row.jabatan}</td>
                                                                                            <td className="p-2">{row.posisi_tim}</td>
                                                                                            <td className="p-2">
                                                                                                {row.ttd_url ? (
                                                                                                    <a
                                                                                                        href={`${import.meta.env.VITE_API_URL}${row.ttd_url}`}
                                                                                                        target="_blank"
                                                                                                        rel="noreferrer"
                                                                                                        className="block w-10 h-10 rounded border border-gray-200 hover:border-brand-400 transition-colors shrink-0 bg-white"
                                                                                                    >
                                                                                                        <img
                                                                                                            src={`${import.meta.env.VITE_API_URL}${row.ttd_url}`}
                                                                                                            alt="Ttd"
                                                                                                            className="w-full h-full object-contain"
                                                                                                        />
                                                                                                    </a>
                                                                                                ) : (
                                                                                                    <span className="text-[10px] text-gray-300 italic">-</span>
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <p className="text-[10px] text-gray-400 truncate">{fv.text_value}</p>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                {!isProductList && (
                                                    <div className="flex items-center gap-1 ml-2 shrink-0">
                                                        {fv.file_url && (
                                                            <a 
                                                                href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        {fv.link_value && (
                                                            <a 
                                                                href={fv.link_value} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="p-2 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 transition-all"
                                                            >
                                                                <LinkIcon className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-gray-400 py-4">Tidak ada data dokumen.</p>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

