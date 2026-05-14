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
    enableApp: boolean;
    enableWA: boolean;
    onToggleApp: (val: boolean) => void;
    onToggleWA: (val: boolean) => void;
    disabled: boolean;
    hint: string;
    variables?: string[];
}

export const TemplateField = ({ 
    label, icon, value, placeholder, onChange, onSave, 
    enableApp, enableWA, onToggleApp, onToggleWA,
    disabled, hint, variables = [] 
}: TemplateFieldProps) => (
    <div className="space-y-4 group/field">
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
            
            <div className="flex items-center gap-3">
                <ChannelToggle 
                    label="App" 
                    icon={<Smartphone className="w-3 h-3" />} 
                    checked={enableApp} 
                    onChange={(val) => onToggleApp(val)} 
                />
                <ChannelToggle 
                    label="WA" 
                    icon={<MessageSquare className="w-3 h-3" />} 
                    checked={enableWA} 
                    onChange={(val) => onToggleWA(val)} 
                />
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
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white outline-none transition-all text-sm resize-none shadow-inner"
            />
            {variables.length > 0 && (
                <div className="absolute bottom-3 right-4 flex gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                    {variables.map(v => (
                        <span key={v} className="text-[9px] font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                            {`{{${v}}}`}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </div>
);
