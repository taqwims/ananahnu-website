import { useState, useEffect } from 'react';
import { FileText, Upload, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';
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
    const canEdit = (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_ADVISOR' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'MARKETING' || (user?.role === 'AUDIT_MANAGER' && serviceType === 'REGULER') || (user?.role === 'CLIENT' && (submission.status === 'DRAFT' || submission.status === 'REVISION')));

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

    const groupedSteps = fieldValues.reduce((acc, fv) => {
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
                                            const isActive = idx === activeStepIdx;
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
                                            Step {steps[activeStepIdx]?.step_number}: {steps[activeStepIdx]?.step_name}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {steps.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {steps[activeStepIdx]?.fieldValues.map(fv => (
                                        <div key={fv.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100 hover:border-brand-200 transition-all group/item shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 rounded-lg bg-gray-50 group-hover/item:bg-brand-50 transition-colors">
                                                    {fv.form_field.input_type === 'FILE_UPLOAD' && <Upload className="w-4 h-4 text-brand-500" />}
                                                    {fv.form_field.input_type === 'LINK' && <LinkIcon className="w-4 h-4 text-blue-500" />}
                                                    {fv.form_field.input_type === 'TEXT' && <FileText className="w-4 h-4 text-gray-400" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <span className="text-xs font-bold text-gray-700 block truncate">{fv.form_field.field_label}</span>
                                                    {fv.text_value && (
                                                        <p className="text-[10px] text-gray-400 truncate">{fv.text_value}</p>
                                                    )}
                                                </div>
                                            </div>
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
                                        </div>
                                    ))}
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

