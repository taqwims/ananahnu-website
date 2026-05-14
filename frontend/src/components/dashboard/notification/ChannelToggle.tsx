import React from 'react';

interface ChannelToggleProps {
    label: string;
    icon: React.ReactNode;
    checked: boolean;
    onChange: (val: boolean) => void;
}

export const ChannelToggle = ({ label, icon, checked, onChange }: ChannelToggleProps) => (
    <button 
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all ${
            checked 
            ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm' 
            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
        }`}
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
        <div className={`w-2 h-2 rounded-full ${checked ? 'bg-brand-600 animate-pulse' : 'bg-gray-200'}`} />
    </button>
);
