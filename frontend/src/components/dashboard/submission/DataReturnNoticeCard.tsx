import React from 'react';
import { AlertTriangle, CheckSquare, MessageSquare, RefreshCw } from 'lucide-react';
import type { Submission } from '../../../types';

interface DataReturnNoticeCardProps {
    submission: Submission;
    className?: string;
}

export const DataReturnNoticeCard: React.FC<DataReturnNoticeCardProps> = ({ submission, className = '' }) => {
    if (!submission.has_been_returned && !submission.reject_note) {
        return null;
    }

    const note = submission.reject_note || '';

    // Extract invalid sections if present in formatted header "[Bagian Bermasalah: ...]"
    let invalidSections: string[] = [];
    let cleanNote = note;

    const match = note.match(/\[Bagian Bermasalah:\s*([^\]]+)\]/);
    if (match) {
        invalidSections = match[1].split(',').map(s => s.trim());
        cleanNote = note.replace(/\[Bagian Bermasalah:\s*([^\]]+)\]/, '').trim();
    }

    return (
        <div className={`p-6 rounded-2xl bg-amber-50/90 border-2 border-amber-300/80 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-amber-950 text-base tracking-tight">
                                Dokumentasi Pengembalian Data & Revisi
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                                ⚡ Perlu Perbaikan
                            </span>
                        </div>
                        <p className="text-xs text-amber-800 font-semibold mt-0.5">
                            Pengajuan ini dikembalikan untuk perbaikan berkas/data sebelum dapat dilanjutkan ke tahap berikutnya.
                        </p>
                    </div>
                </div>
            </div>

            {/* List of Problematic Sections */}
            {invalidSections.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-amber-700" />
                        Daftar Bagian yang Bermasalah:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {invalidSections.map((sec, idx) => (
                            <span 
                                key={idx}
                                className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-amber-950 text-xs font-bold shadow-xs flex items-center gap-1.5"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                {sec}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Instructions / Reject Note */}
            {cleanNote && (
                <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-700" />
                        Catatan & Instruksi Perbaikan Khusus:
                    </label>
                    <div className="p-4 bg-white/90 border border-amber-200 rounded-xl text-amber-950 text-xs font-medium leading-relaxed whitespace-pre-wrap shadow-inner">
                        {cleanNote}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-800 font-bold">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                <span>Setelah memperbarui data/dokumen di atas, klik tombol <strong>"Kirim Perbaikan"</strong> di panel aksi workflow.</span>
            </div>
        </div>
    );
};
