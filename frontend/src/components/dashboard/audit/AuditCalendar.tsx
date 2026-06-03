import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, ShieldAlert, Clock, User } from 'lucide-react';
import type { Submission } from '../../../types';

interface AuditCalendarProps {
    submissions: Submission[];
    onSelectSubmission: (id: string) => void;
}

export const AuditCalendar = ({ submissions, onSelectSubmission }: AuditCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const daysInMonth = useMemo(() => {
        return new Date(year, month + 1, 0).getDate();
    }, [year, month]);

    const firstDayIndex = useMemo(() => {
        return new Date(year, month, 1).getDay();
    }, [year, month]);

    const prevMonthDays = useMemo(() => {
        return new Date(year, month, 0).getDate();
    }, [year, month]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Filter submissions that have audit date in the current month/year to show in summary side-panel
    const monthSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            if (!sub.audit_date) return false;
            const subDate = new Date(sub.audit_date);
            return subDate.getFullYear() === year && subDate.getMonth() === month;
        }).sort((a, b) => new Date(a.audit_date!).getTime() - new Date(b.audit_date!).getTime());
    }, [submissions, year, month]);

    // Calendar grid cells
    const calendarCells = useMemo(() => {
        const cells = [];
        
        // Prev Month Padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const prevDay = prevMonthDays - i;
            cells.push({
                day: prevDay,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevDay)
            });
        }

        // Current Month Days
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        // Next Month Padding (to complete grid row)
        const remainingCells = 42 - cells.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingCells; i++) {
            cells.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return cells;
    }, [year, month, daysInMonth, firstDayIndex, prevMonthDays]);

    const todayString = new Date().toDateString();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'QC_OFFICER':
                return 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100/60';
            case 'QC_REVIEW':
                return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/60';
            case 'SIDANG_FATWA':
                return 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/60';
            default:
                return 'bg-gray-50 text-gray-750 border-gray-200 hover:bg-gray-105';
        }
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden h-full">
            {/* Grid Kalender */}
            <div className="flex-1 glass-panel p-6 border-white/40 shadow-2xl flex flex-col min-w-0">
                {/* Header Kalender */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-gray-100/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none">
                                {monthNames[month]} {year}
                            </h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">Jadwal Audit Bulanan</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToday}
                            className="px-3.5 py-2 bg-white/60 hover:bg-white text-gray-700 rounded-xl border border-white/80 shadow-sm transition-all text-xs font-black uppercase tracking-wider"
                        >
                            Hari Ini
                        </button>
                        <div className="flex bg-white/60 border border-white/80 p-0.5 rounded-xl shadow-sm">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Pembatas Hari */}
                <div className="grid grid-cols-7 text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-2 py-2 bg-gray-55/40 rounded-xl">
                    {daysOfWeek.map((day, idx) => (
                        <div key={day} className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-brand-600' : ''}>
                            {day.substring(0, 3)}
                        </div>
                    ))}
                </div>

                {/* Grid Tanggal */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 min-h-0 overflow-y-auto pr-1">
                    {calendarCells.map((cell, index) => {
                        const cellDateStr = cell.date.toISOString().split('T')[0];
                        
                        // Find submissions scheduled for this date
                        const cellSubs = submissions.filter(sub => {
                            if (!sub.audit_date) return false;
                            const subDate = new Date(sub.audit_date).toISOString().split('T')[0];
                            return subDate === cellDateStr;
                        });

                        const isToday = cell.date.toDateString() === todayString;

                        return (
                            <div
                                key={`${cellDateStr}-${index}`}
                                className={`min-h-[75px] p-1.5 flex flex-col rounded-xl border transition-all ${
                                    cell.isCurrentMonth 
                                        ? 'bg-white/40 border-gray-100/50' 
                                        : 'bg-gray-50/20 border-gray-100/20 text-gray-300'
                                } ${
                                    isToday 
                                        ? 'ring-2 ring-brand-500/80 bg-brand-50/10 border-brand-200 shadow-md shadow-brand-50/20' 
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                                        isToday 
                                            ? 'bg-brand-600 text-white' 
                                            : cell.isCurrentMonth 
                                                ? 'text-gray-700' 
                                                : 'text-gray-400'
                                    }`}>
                                        {cell.day}
                                    </span>
                                    {cellSubs.length > 0 && cell.isCurrentMonth && (
                                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                    )}
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar-thin">
                                    {cell.isCurrentMonth && cellSubs.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => onSelectSubmission(sub.id)}
                                            className={`w-full text-left p-1 rounded-lg border text-[9px] font-bold truncate block transition-all shadow-sm ${getStatusColor(sub.status)}`}
                                            title={`${sub.client?.business_name} (${sub.status})`}
                                        >
                                            {sub.client?.business_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Panel Ringkasan Agenda Bulan Ini */}
            <div className="w-full lg:w-80 glass-panel p-6 border-white/40 shadow-2xl flex flex-col shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-150 pb-3">
                    <Clock className="w-5 h-5 text-brand-600" />
                    Jadwal Bulan Ini
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {monthSubmissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 p-4">
                            <ShieldAlert className="w-10 h-10 opacity-20 mb-2" />
                            <p className="text-sm italic font-semibold">Tidak ada jadwal audit bulan ini</p>
                        </div>
                    ) : (
                        monthSubmissions.map(sub => {
                            const auditDateObj = new Date(sub.audit_date!);
                            const isToday = auditDateObj.toDateString() === todayString;

                            return (
                                <div
                                    key={sub.id}
                                    onClick={() => onSelectSubmission(sub.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex gap-3 ${
                                        isToday 
                                            ? 'bg-brand-50/50 border-brand-200 ring-1 ring-brand-200 shadow-sm' 
                                            : 'bg-white/40 border-gray-100 hover:bg-white/80 hover:border-gray-200 shadow-sm'
                                    }`}
                                >
                                    {/* Kolom Tanggal */}
                                    <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl shrink-0 font-black ${
                                        isToday 
                                            ? 'bg-brand-600 text-white shadow-md' 
                                            : 'bg-brand-50 text-brand-600'
                                    }`}>
                                        <span className="text-sm leading-none">{auditDateObj.getDate()}</span>
                                        <span className="text-[9px] uppercase mt-0.5 tracking-wider">
                                            {auditDateObj.toLocaleDateString('id-ID', { month: 'short' }).substring(0, 3)}
                                        </span>
                                    </div>

                                    {/* Kolom Detail */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs text-gray-800 truncate leading-tight">
                                            {sub.client?.business_name}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">
                                            {sub.client?.client_name}
                                        </p>
                                        
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                sub.status === 'QC_OFFICER' 
                                                    ? 'bg-purple-100 text-purple-750' 
                                                    : sub.status === 'QC_REVIEW' 
                                                        ? 'bg-blue-100 text-blue-750' 
                                                        : 'bg-amber-100 text-amber-750'
                                            }`}>
                                                {sub.status === 'QC_OFFICER' ? 'Distribusi' : sub.status === 'QC_REVIEW' ? 'Review' : 'Fatwa'}
                                            </span>
                                            {sub.assigned_drafter && (
                                                <span className="text-[8px] text-gray-400 font-bold flex items-center gap-0.5">
                                                    <User className="w-2.5 h-2.5" />
                                                    {sub.assigned_drafter.full_name.split(' ')[0]}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-300">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
