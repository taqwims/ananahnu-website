import { Edit3, Save, X, Building2, User, Info } from 'lucide-react';
import type { Submission } from '../../../types';

interface ClientInfoPanelProps {
    submission: Submission | null;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    clientForm: any;
    setClientForm: (v: any) => void;
    onSave: () => Promise<void>;
    processing: boolean;
}

export const ClientInfoPanel = ({
    submission,
    isEditing,
    setIsEditing,
    clientForm,
    setClientForm,
    onSave,
    processing
}: ClientInfoPanelProps) => {
    if (!submission) return null;

    return (
        <div className="glass-panel flex flex-col border-white/60 shadow-xl overflow-hidden group">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                    <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase">Data Pelaku Usaha</h3>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 hover:bg-brand-50 rounded-lg text-brand-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onSave}
                            disabled={processing}
                            className="p-1.5 bg-brand-600 text-white rounded-lg shadow-lg shadow-brand-100"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nama Usaha</label>
                            <input
                                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                                value={clientForm.business_name}
                                onChange={e => setClientForm({ ...clientForm, business_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nama Pemilik</label>
                            <input
                                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                                value={clientForm.client_name}
                                onChange={e => setClientForm({ ...clientForm, client_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">NIB</label>
                                <input
                                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-mono"
                                    value={clientForm.nib}
                                    onChange={e => setClientForm({ ...clientForm, nib: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">NIK</label>
                                <input
                                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-mono"
                                    value={clientForm.nik}
                                    onChange={e => setClientForm({ ...clientForm, nik: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Produk</label>
                            <input
                                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                                value={clientForm.product_name}
                                onChange={e => setClientForm({ ...clientForm, product_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Alamat</label>
                            <textarea
                                className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-medium"
                                rows={3}
                                value={clientForm.address}
                                onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Badan Usaha / Brand</p>
                                <p className="text-sm font-black text-gray-800">{submission.client?.business_name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Penanggung Jawab</p>
                                <p className="text-sm font-bold text-gray-700">{submission.client?.client_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">NIB</p>
                                <p className="text-xs font-bold font-mono text-gray-700">{submission.client?.nib || '-'}</p>
                            </div>
                            <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">NIK</p>
                                <p className="text-xs font-bold font-mono text-gray-700">{submission.client?.nik || '-'}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Info className="w-2.5 h-2.5" /> Alamat Lengkap
                            </p>
                            <p className="text-xs text-amber-900 font-medium leading-relaxed">
                                {submission.client?.address}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
