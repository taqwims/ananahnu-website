import React from 'react';
import { Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SprintRoadmapNoticeProps {
    sprintNumber: 2 | 3;
    title: string;
    description: string;
    features: string[];
}

export const SprintRoadmapNotice: React.FC<SprintRoadmapNoticeProps> = ({
    sprintNumber,
    title,
    description,
    features,
}) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>HALALCORE WORKSPACE</span>
                <span>/</span>
                <span className="text-brand-600">AGENT MANAGER</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
                    <Clock className="w-7 h-7" />
                </div>

                <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200">
                        Sprint {sprintNumber} • Tahap Berikutnya
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-3">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100 text-xs space-y-2">
                    <p className="font-bold text-gray-800">Cakupan Fitur Sprint {sprintNumber}:</p>
                    <ul className="space-y-1.5 text-gray-600">
                        {features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                <span>{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => navigate('/dashboard/agent-submissions')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all"
                    >
                        <span>Buka Antrean Pengajuan (Sprint 1)</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
