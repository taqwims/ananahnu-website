import { useState, useEffect } from 'react';
import { X, History, UserX, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { userService } from '../../../services/userService';

interface UserAuditLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserAuditLogsModal = ({ isOpen, onClose }: UserAuditLogsModalProps) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            userService.getUserAuditLogs()
                .then((data: any) => setLogs(data || []))
                .catch((err: any) => {
                    console.error("Failed to load audit logs", err);
                    setLogs([]);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                Riwayat Log Manajemen & Penghapusan User
                            </h3>
                            <p className="text-xs text-gray-500">
                                Catatan audit jejak aktivitas penghapusan akun dan pelepasan relasi sistem
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                            <p className="text-xs font-semibold">Memuat riwayat log...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 flex flex-col items-center">
                            <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
                            <p className="text-sm font-bold text-gray-600">Belum Ada Riwayat Log</p>
                            <p className="text-xs text-gray-400">Semua aktivitas penghapusan user akan dicatat secara otomatis di sini.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log: any) => {
                                let payload: any = {};
                                try {
                                    if (typeof log.payload === 'string') {
                                        payload = JSON.parse(log.payload);
                                    } else if (log.payload) {
                                        payload = log.payload;
                                    }
                                } catch (e) {
                                    payload = {};
                                }

                                const isDelete = log.action === 'DELETE_USER' || log.action?.includes('DELETE');

                                return (
                                    <div 
                                        key={log.id} 
                                        className="p-4 rounded-2xl border border-gray-150 bg-white shadow-xs hover:border-brand-200 transition"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5 mb-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                                    isDelete 
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                }`}>
                                                    <UserX className="w-3 h-3" />
                                                    {log.action}
                                                </span>
                                                <span className="text-xs font-bold text-gray-700">
                                                    Target: {payload.full_name || log.entity_id}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(log.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-600 font-medium mb-2">
                                            {log.notes || 'User dihapus beserta seluruh relasi terkait.'}
                                        </p>

                                        {/* Actor & Snapshot Info */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <div>
                                                <span className="text-gray-400 font-semibold block">Dihapus oleh:</span>
                                                <span className="font-bold text-gray-800">
                                                    {log.user ? `${log.user.full_name} (${log.user.email})` : 'Sistem / Administrator'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 font-semibold block">Data Akun Terhapus:</span>
                                                <span className="font-semibold text-gray-700">
                                                    {payload.email ? `Email: ${payload.email}` : ''} 
                                                    {payload.role ? ` • Role: ${payload.role}` : ''}
                                                    {payload.phone ? ` • Telp: ${payload.phone}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
