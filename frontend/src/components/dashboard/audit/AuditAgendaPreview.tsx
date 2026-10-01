import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Building2, User, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import type { Submission } from '../../../types';

interface AuditAgendaPreviewProps {
    submissions?: Submission[];
}

export const AuditAgendaPreview = ({ submissions: initialSubmissions }: AuditAgendaPreviewProps) => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions || []);
    const [loading, setLoading] = useState(!initialSubmissions);

    useEffect(() => {
        if (initialSubmissions) {
            setSubmissions(initialSubmissions);
            return;
        }

        api.get('/submissions', { params: { service_type: 'REGULER' } })
            .then(res => {
                const data: Submission[] = res.data || [];
                setSubmissions(data);
            })
            .catch(err => console.warn('Failed to load audit submissions:', err))
            .finally(() => setLoading(false));
    }, [initialSubmissions]);

    // Filter and sort upcoming audits
    const auditItems = submissions
        .filter(s => s.service_type === 'REGULER' && s.audit_date)
        .sort((a, b) => new Date(a.audit_date!).getTime() - new Date(b.audit_date!).getTime());

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = auditItems.filter(s => s.audit_date?.startsWith(todayStr)).length;
    const pendingResultCount = auditItems.filter(s => !s.audit_result_1_url).length;

    return (
        <div className="glass-panel p-6 shadow-xl border border-white/60 bg-white/70 space-y-5 rounded-3xl">
            {/* Header with Shortcut */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs border border-amber-100">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                            Agenda &amp; Kalender Audit
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
                                {auditItems.length} Jadwal
                            </span>
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">Jadwal audit lapangan mitra LPH &amp; penugasan auditor</p>
                    </div>
                </div>

                {/* Quick Shortcut Button */}
                <button
                    onClick={() => navigate('/dashboard/operasional/manajemen-audit')}
                    className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-200/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                    <CalendarDays className="w-4 h-4" />
                    <span>Buka Kalender Penuh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Audit Hari Ini</p>
                    <p className="text-xl font-black text-amber-900 mt-0.5">{todayCount}</p>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Total Terjadwal</p>
                    <p className="text-xl font-black text-blue-900 mt-0.5">{auditItems.length}</p>
                </div>
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Tunggu Laporan</p>
                    <p className="text-xl font-black text-rose-900 mt-0.5">{pendingResultCount}</p>
                </div>
            </div>

            {/* List of Audits */}
            <div className="space-y-2.5">
                {loading ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-medium">
                        Memuat jadwal audit...
                    </div>
                ) : auditItems.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-medium space-y-1">
                        <p className="font-bold">Belum ada pengajuan dengan jadwal audit aktif.</p>
                        <p className="text-[10px]">Jadwalkan melalui menu Manajemen Audit.</p>
                    </div>
                ) : (
                    auditItems.slice(0, 5).map(sub => {
                        const auditDateObj = new Date(sub.audit_date!);
                        const isToday = sub.audit_date?.startsWith(todayStr);
                        const hasResult = Boolean(sub.audit_result_1_url);

                        return (
                            <div
                                key={sub.id}
                                onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                                    isToday
                                        ? 'bg-amber-50/90 border-amber-300 shadow-sm hover:bg-amber-100/80'
                                        : 'bg-white/80 border-gray-150 hover:border-brand-300 hover:bg-white shadow-2xs'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Date Block */}
                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                                        isToday 
                                            ? 'bg-amber-500 text-white border-amber-600 font-black shadow-xs' 
                                            : 'bg-gray-50 text-gray-800 border-gray-200'
                                    }`}>
                                        <span className="text-[9px] font-bold uppercase leading-none">
                                            {auditDateObj.toLocaleDateString('id-ID', { month: 'short' })}
                                        </span>
                                        <span className="text-base font-black leading-none mt-0.5">
                                            {auditDateObj.getDate()}
                                        </span>
                                    </div>

                                    {/* Business & Meta */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                                {sub.client?.business_name || 'Pelaku Usaha'}
                                            </h4>
                                            {isToday && (
                                                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[8px] font-black rounded-md uppercase animate-pulse">
                                                    Hari Ini
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                                            {sub.lph_name && (
                                                <span className="flex items-center gap-1 font-medium truncate">
                                                    <Building2 className="w-3 h-3 text-gray-400" /> {sub.lph_name}
                                                </span>
                                            )}
                                            {sub.auditor_name && (
                                                <span className="flex items-center gap-1 font-medium truncate">
                                                    <User className="w-3 h-3 text-gray-400" /> {sub.auditor_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Status Badge & Arrow */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {hasResult ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Hasil Siap
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[9px] font-bold rounded-lg border border-amber-200 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Tunggu File
                                        </span>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
