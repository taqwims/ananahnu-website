import React from 'react';
import { Smartphone, MessageSquare, Save } from 'lucide-react';
import { ChannelToggle } from './ChannelToggle';

interface TemplateFieldProps {
    label: string;
    icon?: React.ReactNode;
    value: string;
    placeholder: string;
    onChange: (val: string) => void;
    onSave: () => void;
    enableApp?: boolean;
    enableWA?: boolean;
    onToggleApp?: (val: boolean) => void;
    onToggleWA?: (val: boolean) => void;
    disabled: boolean;
    hint: string;
    variables?: string[];
}

export const TemplateField = ({ 
    label, icon, value, placeholder, onChange, onSave, 
    enableApp, enableWA, onToggleApp, onToggleWA,
    disabled, hint, variables = [] 
}: TemplateFieldProps) => (
    <div className="space-y-3 group/field">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover/field:bg-brand-50 group-hover/field:text-brand-600 transition-colors">
                    {icon}
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-800 block leading-tight">{label}</label>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{hint}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2.5">
                {onToggleApp && (
                    <ChannelToggle 
                        label="App" 
                        icon={<Smartphone className="w-3 h-3" />} 
                        checked={!!enableApp} 
                        onChange={(val) => onToggleApp(val)} 
                    />
                )}
                {onToggleWA && (
                    <ChannelToggle 
                        label="WA" 
                        icon={<MessageSquare className="w-3 h-3" />} 
                        checked={!!enableWA} 
                        onChange={(val) => onToggleWA(val)} 
                    />
                )}
                <button
                    onClick={onSave}
                    disabled={disabled}
                    className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-100 transition-all disabled:opacity-50"
                    title="Simpan Template"
                >
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>

        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white outline-none transition-all text-xs resize-none shadow-inner leading-relaxed"
            />
        </div>

        {variables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-gray-400 font-semibold mr-0.5">Variabel:</span>
                {variables.map(v => (
                    <button
                        type="button"
                        key={v}
                        onClick={() => onChange(value ? `${value} {{${v}}}` : `{{${v}}}`)}
                        title={`Klik untuk menambahkan {{${v}}}`}
                        className="text-[9px] font-mono bg-gray-100 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 transition-all"
                    >
                        {`{{${v}}}`}
                    </button>
                ))}
            </div>
        )}
    </div>
);
