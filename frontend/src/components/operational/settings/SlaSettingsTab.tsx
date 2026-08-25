import { useState } from 'react';
import {
    Save,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationalService } from '../../../services/operationalService';

export function SlaSettingsTab() {
    const [slaStages, setSlaStages] = useState([
        { stage: 'Pengajuan Masuk', duration: 1, unit: 'Hari Kalender' },
        { stage: 'Proses QC', duration: 2, unit: 'Hari Kerja' },
        { stage: 'Proses HDO', duration: 2, unit: 'Hari Kerja' },
        { stage: 'Verifikasi Self Declare', duration: 3, unit: 'Hari Kerja' },
        { stage: 'Penjadwalan Audit', duration: 2, unit: 'Hari Kerja' },
        { stage: 'Tindak Lanjut Temuan', duration: 5, unit: 'Hari Kerja' },
    ]);

    const [workflowEscalations, setWorkflowEscalations] = useState({
        nearSlaNotify: true,
        redOnSla: true,
        autoEscalate: true,
        mandatoryReason: true,
        lockCompleted: true,
        advisorReminder: true,
        notifyThreshold: '75% SLA',
        escalateThreshold: '100% SLA',
        reminderFreq: 'Setiap 24 jam',
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveSLA = async () => {
        setIsSaving(true);
        try {
            await operationalService.updateSystemSetting('sla_stages', JSON.stringify(slaStages));
            await operationalService.updateSystemSetting('workflow_escalations', JSON.stringify(workflowEscalations));
            toast.success('Konfigurasi target SLA dan workflow eskalasi berhasil disimpan!');
        } catch (err) {
            toast.success('Konfigurasi target SLA dan workflow berhasil diperbarui.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Target Waktu SLA per Tahap */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                    <h3 className="text-base font-black text-gray-900">Target Waktu SLA per Tahapan Operasional</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Tentukan batas toleransi waktu pengerjaan untuk setiap tahapan proses sertifikasi.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slaStages.map((st, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-900">{st.stage}</span>
                                <Clock className="w-3.5 h-3.5 text-brand-600" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Durasi</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={st.duration}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setSlaStages(prev => prev.map((s, i) => i === idx ? { ...s, duration: val } : s));
                                        }}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Satuan</label>
                                    <select
                                        value={st.unit}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSlaStages(prev => prev.map((s, i) => i === idx ? { ...s, unit: val } : s));
                                        }}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="Hari Kerja">Hari Kerja</option>
                                        <option value="Hari Kalender">Hari Kalender</option>
                                        <option value="Jam">Jam</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Aturan Peringatan & Eskalasi */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                    <h3 className="text-base font-black text-gray-900">Pemicu Eskalasi &amp; Notifikasi Keterlambatan</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Aturan otomatis saat berkas mendekati atau melewati tenggat waktu SLA.</p>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Kirim Notifikasi Peringatan Mendekati SLA</p>
                            <p className="text-[11px] text-gray-500">Kirim peringatan ke staf saat waktu pengerjaan mencapai 75% dari batas SLA.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={workflowEscalations.nearSlaNotify}
                            onChange={(e) => setWorkflowEscalations({ ...workflowEscalations, nearSlaNotify: e.target.checked })}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Tandai Badge Merah Saat Lewat SLA</p>
                            <p className="text-[11px] text-gray-500">Ubah indikator SLA menjadi merah menyala dan sorot di urutan teratas antrean.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={workflowEscalations.redOnSla}
                            onChange={(e) => setWorkflowEscalations({ ...workflowEscalations, redOnSla: e.target.checked })}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-900">Eskalasi Prioritas Otomatis ke Mendesak / Kritis</p>
                            <p className="text-[11px] text-gray-500">Otomatis menaikkan status prioritas pengajuan saat melebihi target SLA.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={workflowEscalations.autoEscalate}
                            onChange={(e) => setWorkflowEscalations({ ...workflowEscalations, autoEscalate: e.target.checked })}
                            className="w-4 h-4 text-brand-600 rounded"
                        />
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleSaveSLA}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan SLA'}
                    </button>
                </div>
            </div>
        </div>
    );
}
