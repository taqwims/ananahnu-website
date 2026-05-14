

export function InfoBox({ label, value, icon: Icon, mono = false }: { label: string, value?: string, icon: any, mono?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Icon className="w-2.5 h-2.5" />
                {label}
            </span>
            <p className={`text-xs font-bold text-gray-800 truncate ${mono ? 'font-mono' : ''}`}>
                {value || '-'}
            </p>
        </div>
    );
}

export function EditField({ label, value, onChange, isTextArea = false, type = "text" }: { label: string, value: string, onChange: (v: string) => void, isTextArea?: boolean, type?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block px-1">{label}</label>
            {isTextArea ? (
                <textarea
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium min-h-[80px]"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <input
                    type={type}
                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            )}
        </div>
    );
}
