import { motion } from 'framer-motion';
import { Loader2, User, CheckCircle } from 'lucide-react';
import type { ConsultantProfile } from '../../../types';

interface ConsultantListProps {
    profiles: ConsultantProfile[];
    loading: boolean;
    selectedId?: string;
    onSelect: (p: ConsultantProfile) => void;
}

export const ConsultantList = ({
    profiles,
    loading,
    selectedId,
    onSelect
}: ConsultantListProps) => {
    if (loading) {
        return (
            <div className="glass-panel p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="mt-4 text-gray-500 text-sm font-medium">Memuat data...</p>
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <div className="glass-panel p-12 text-center text-gray-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">Tidak ada data ditemukan</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {profiles.map(p => (
                <motion.div
                    layoutId={p.id}
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className={`glass-panel p-5 cursor-pointer transition-all border-2 group ${
                        selectedId === p.id 
                        ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' 
                        : 'border-white/40 hover:border-indigo-200'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                            p.is_verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                            {p.user?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-800 truncate">{p.user?.full_name}</h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">{p.user?.email}</p>
                        </div>
                        {p.is_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                            <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                                PENDING
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
