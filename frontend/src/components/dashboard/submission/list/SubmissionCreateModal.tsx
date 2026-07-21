import { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import api from '../../../../services/api';

interface SubmissionCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: { businessName: string, serviceType: string };
    setFormData: (v: any) => void;
    onCreate: () => void;
}

export const SubmissionCreateModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onCreate
}: SubmissionCreateModalProps) => {
    const [quotaExhausted, setQuotaExhausted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/system-settings/public')
                .then(res => {
                    const limit = parseInt(res.data.facilitation_quota_limit || '0', 10);
                    const used = parseInt(res.data.facilitation_quota_used || '0', 10);
                    if (limit - used <= 0) {
                        setQuotaExhausted(true);
                        // If current selection is SELF_DECLARE, auto-switch to SELF_DECLARE_MANDIRI
                        if (formData.serviceType === 'SELF_DECLARE') {
                            setFormData((p: any) => ({ ...p, serviceType: 'SELF_DECLARE_MANDIRI' }));
                        }
                    }
                })
                .catch(console.error);
        }
    }, [isOpen]);
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Mulai Pengajuan"
            maxWidth="md"
        >
            <div className="space-y-6">
                <p className="text-sm text-gray-500">Lengkapi data dasar untuk memulai proses sertifikasi</p>
                
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Usaha / Produk</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                        placeholder="Contoh: Katering Berkah"
                        value={formData.businessName}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Layanan</label>
                    <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                        value={formData.serviceType}
                        onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                    >
                        <option value="SELF_DECLARE" disabled={quotaExhausted}>
                            Self Declare Fasilitasi (Gratis) {quotaExhausted ? '(Kuota Habis)' : ''}
                        </option>
                        <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                        <option value="REGULER">Reguler</option>
                    </select>
                    {quotaExhausted && (
                        <p className="text-red-500 text-xs mt-2 font-bold bg-red-50 border border-red-100 rounded-xl p-3">
                            Tidak ada fasilitasi pembiayaan. Silahkan ajukan melalui skema self declare mandiri.
                        </p>
                    )}
                </div>

                <div className="flex gap-3 pt-4">
                    <button className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors" onClick={onClose}>Batal</button>
                    <button onClick={onCreate} disabled={!formData.businessName} className="flex-[2] py-3 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-100 hover:bg-brand-700 disabled:opacity-30 transition-all">Lanjut ke Form</button>
                </div>
            </div>
        </Modal>
    );
};
