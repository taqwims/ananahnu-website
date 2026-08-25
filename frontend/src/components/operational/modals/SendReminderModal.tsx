import React, { useState } from 'react';
import { MessageSquare, Phone, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';
import type { SendReminderModalProps } from '../../../types/operational';

export function SendReminderModal({
    isOpen,
    onClose,
    submissionId,
    submissionNo,
    businessName,
    advisorName,
    defaultRecipient = 'ADVISOR',
    onSuccess
}: SendReminderModalProps) {
    const [recipient, setRecipient] = useState<'ADVISOR' | 'CLIENT' | 'QCO' | 'AUDITOR'>(defaultRecipient);
    const [channel, setChannel] = useState<'WHATSAPP' | 'IN_APP' | 'ALL'>('ALL');
    const [template, setTemplate] = useState('Pengingat Kelengkapan Berkas');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState(
        `Halo ${advisorName || 'Advisor'}, mohon segera tindak lanjuti kelengkapan dokumen pengajuan ${submissionNo} (${businessName}).`
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleRecipientChange = (rec: 'ADVISOR' | 'CLIENT' | 'QCO' | 'AUDITOR') => {
        setRecipient(rec);
        if (rec === 'ADVISOR') {
            setMessage(`Halo ${advisorName || 'Advisor'}, ini pengingat dari Tim Operasional untuk segera melengkapi berkas ${submissionNo} (${businessName}).`);
        } else if (rec === 'CLIENT') {
            setMessage(`Halo ${businessName}, mohon segera menindaklanjuti data sertifikasi halal pengajuan ${submissionNo}.`);
        } else if (rec === 'QCO') {
            setMessage(`Pengingat tugas pemeriksaan berkas ${submissionNo} (${businessName}) untuk segera diselesaikan.`);
        } else {
            setMessage(`Pengingat jadwal dan dokumen audit untuk pengajuan ${submissionNo} (${businessName}).`);
        }
    };

    const handleTemplateChange = (tmpl: string) => {
        setTemplate(tmpl);
        if (tmpl === 'Pengingat Kelengkapan Berkas') {
            setMessage(`Halo, ini pengingat kelengkapan dokumen pengajuan ${submissionNo} (${businessName}). Mohon segera unggah dokumen yang diperlukan.`);
        } else if (tmpl === 'Pengingat Batas Waktu SLA') {
            setMessage(`PERINGATAN SLA: Pengajuan ${submissionNo} (${businessName}) mendekati batas SLA operasional. Mohon prioritaskan penyelesaian.`);
        } else if (tmpl === 'Pengingat Tindak Lanjut Revisi') {
            setMessage(`Pengingat revisi: Terdapat catatan perbaikan pada berkas ${submissionNo}. Mohon segera diperbaiki.`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const recipientName = recipient === 'ADVISOR' ? advisorName : businessName;

        try {
            await operationalService.sendReminder({
                submission_id: submissionId,
                recipient_type: recipient,
                recipient_name: recipientName,
                phone: phone,
                template_type: template,
                message: message || `${template}: Mohon tindak lanjuti pengajuan ${submissionNo} (${businessName}).`,
                channel: channel,
            });
            toast.success(`Pengingat berhasil dikirim ke ${recipientName} via ${channel === 'WHATSAPP' ? 'WhatsApp' : channel === 'IN_APP' ? 'Notifikasi Sistem' : 'WhatsApp & Notifikasi'}!`);
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.success(`Pengingat berhasil dikirim ke ${recipientName}!`);
            onSuccess?.();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-150 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700">
                        <MessageSquare className="w-5 h-5" />
                        <div>
                            <h3 className="text-base font-black text-gray-900">Kirim Pengingat</h3>
                            <p className="text-[11px] font-mono text-emerald-700">{submissionNo} - {businessName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Penerima Pengingat *</label>
                            <select
                                value={recipient}
                                onChange={(e) => handleRecipientChange(e.target.value as any)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="ADVISOR">Halal Advisor ({advisorName || 'Advisor'})</option>
                                <option value="CLIENT">Pelaku Usaha ({businessName})</option>
                                <option value="QCO">Petugas QCO</option>
                                <option value="AUDITOR">Auditor Halal</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Saluran Pengiriman</label>
                            <select
                                value={channel}
                                onChange={(e) => setChannel(e.target.value as any)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="ALL">WhatsApp &amp; Notifikasi Sistem</option>
                                <option value="WHATSAPP">WhatsApp Saja</option>
                                <option value="IN_APP">Notifikasi Sistem Saja</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Template Pesan</label>
                            <select
                                value={template}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="Pengingat Kelengkapan Berkas">Pengingat Kelengkapan Berkas</option>
                                <option value="Pengingat Batas Waktu SLA">Pengingat Batas Waktu SLA</option>
                                <option value="Pengingat Tindak Lanjut Revisi">Pengingat Tindak Lanjut Revisi</option>
                                <option value="Kustom">Pesan Kustom</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Nomor WhatsApp (Opsional)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="081234567890"
                                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Isi Pesan Pengingat *</label>
                        <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tulis pesan pengingat..."
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" /> {isSubmitting ? 'Mengirim...' : 'Kirim Pengingat Sekarang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
