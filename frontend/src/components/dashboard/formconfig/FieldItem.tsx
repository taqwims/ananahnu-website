import { GripVertical, Trash2 } from 'lucide-react';
import type { FormFieldConfig } from '../../../types';

const INPUT_TYPES = ['FILE_UPLOAD', 'LINK', 'TEXT'] as const;

interface FieldItemProps {
    field: FormFieldConfig;
    businessTypes: {id: number; name: string}[];
    onUpdateState: (id: number, key: string, value: any) => void;
    onHandleUpdate: (field: FormFieldConfig) => void;
    onDelete: (id: number) => void;
}

export const FieldItem = ({
    field,
    businessTypes,
    onUpdateState,
    onHandleUpdate,
    onDelete
}: FieldItemProps) => {
    return (
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 group hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50/50 transition-all">
            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Label Field</label>
                    <input
                        className="glass-input text-sm w-full"
                        value={field.field_label}
                        onChange={e => onUpdateState(field.id, 'field_label', e.target.value)}
                        onBlur={() => onHandleUpdate(field)}
                        placeholder="Label"
                    />
                </div>

                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Key</label>
                    <input
                        className="glass-input text-sm font-mono w-full"
                        value={field.field_key}
                        onChange={e => onUpdateState(field.id, 'field_key', e.target.value)}
                        onBlur={() => onHandleUpdate(field)}
                        placeholder="key"
                    />
                </div>

                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Input Type</label>
                    <select
                        className="glass-input text-sm w-full"
                        value={field.input_type}
                        onChange={e => {
                            onUpdateState(field.id, 'input_type', e.target.value);
                            onHandleUpdate({ ...field, input_type: e.target.value as any });
                        }}
                    >
                        {INPUT_TYPES.map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-1 flex items-center h-full pt-4">
                    <label className="flex items-center gap-3 cursor-pointer group/check">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={field.is_required}
                                onChange={e => {
                                    onUpdateState(field.id, 'is_required', e.target.checked);
                                    onHandleUpdate({ ...field, is_required: e.target.checked });
                                }}
                                className="w-5 h-5 rounded-lg border-gray-200 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                            />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${field.is_required ? 'text-red-600' : 'text-gray-400'}`}>
                            {field.is_required ? 'Wajib' : 'Opsional'}
                        </span>
                    </label>
                </div>

                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Scope Bidang</label>
                    <select
                        className="glass-input text-[10px] font-bold uppercase tracking-wider w-full"
                        value={field.business_type_id || ''}
                        onChange={e => {
                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                            onUpdateState(field.id, 'business_type_id', val);
                            onHandleUpdate({ ...field, business_type_id: val });
                        }}
                    >
                        <option value="">Semua Bidang</option>
                        {businessTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                    </select>
                </div>

                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Step</label>
                    <input
                        type="number"
                        min={1}
                        className="glass-input text-sm w-full font-bold"
                        value={field.step_number || 1}
                        onChange={e => onUpdateState(field.id, 'step_number', parseInt(e.target.value) || 1)}
                        onBlur={() => onHandleUpdate(field)}
                    />
                </div>

                <div className="md:col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Step</label>
                    <input
                        className="glass-input text-sm w-full"
                        value={field.step_name || ''}
                        onChange={e => onUpdateState(field.id, 'step_name', e.target.value)}
                        onBlur={() => onHandleUpdate(field)}
                        placeholder="Nama Step"
                    />
                </div>

                <div className="md:col-span-1 flex justify-end">
                    <button
                        onClick={() => onDelete(field.id)}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus Field"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
