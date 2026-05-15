interface SubmissionHistoryProps {
    history: any[];
}

export const SubmissionHistory = ({ history }: SubmissionHistoryProps) => {
    return (
        <div className="glass-panel p-6 overflow-hidden">
            <h3 className="text-lg font-black text-gray-800 tracking-tight mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-brand-600 rounded-full"></div>
                Workflow History
            </h3>
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">No history yet</p>
                    ) : (
                        history.map((log) => (
                            <div key={log.id} className="relative pl-4 border-l-2 border-gray-100 mb-4 last:mb-0">
                                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300"></div>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">{log.action}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">{log.user?.full_name || 'System'}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(log.created_at).toLocaleString('id-ID', {
                                            day: '2-digit', month: '2-digit', year: '2-digit',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                    {log.notes}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
