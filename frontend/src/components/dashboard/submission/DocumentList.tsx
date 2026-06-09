import { FileText, Upload, Link as LinkIcon } from 'lucide-react';
import type { Submission, User, FormFieldValue } from '../../../types';
import DynamicSubmissionForm from '../DynamicSubmissionForm';

interface DocumentListProps {
    submission: Submission;
    user: User | null;
    fieldValues: FormFieldValue[];
    editingData: boolean;
    setEditingData: (val: boolean) => void;
    onRefresh: () => Promise<void>;
}

export const DocumentList = ({ 
    submission, 
    user, 
    fieldValues, 
    editingData, 
    setEditingData, 
    onRefresh 
}: DocumentListProps) => {
    const serviceType = submission.service_type || submission.client?.service_type || '';
    const canEdit = (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'HALAL_ADVISOR' || user?.role === 'DRAFTER' || user?.role === 'QC_OFFICER' || user?.role === 'HALAL_MANAGER' || user?.role === 'HALAL_DIRECTOR' || user?.role === 'MARKETING' || (user?.role === 'AUDIT_MANAGER' && serviceType === 'REGULER') || (user?.role === 'CLIENT' && (submission.status === 'DRAFT' || submission.status === 'REVISION')));

    return (
        <div className="glass-panel p-6 shadow-xl border border-white/40">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    Dokumen & Data
                </h3>
                {canEdit && (
                    <button 
                        onClick={() => setEditingData(!editingData)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
                    >
                        {editingData ? 'Batal Edit' : 'Edit Data'}
                    </button>
                )}
            </div>
            
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fieldValues.map(fv => (
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
            )}
        </div>
    );
};
