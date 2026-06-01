import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { financeService } from '../../services/financeService';
import { FileText, CheckCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

interface CostItem {
    name: string;
    category: string;
    type: string;
    amount: number;
}

interface SPHData {
    id: number;
    submission_id: string;
    sph_number: string;
    sequence_number: number;
    month: number;
    year: number;
    total_amount: number;
    cost_breakdown: string;
    status: string;
    issued_at?: string;
    created_at: string;
    submission?: {
        client?: {
            business_name: string;
            client_name: string;
            address: string;
            nib: string;
            phone: string;
        };
        service_type: string;
        status: string;
    };
}

const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const CATEGORY_LABELS: Record<string, string> = {
    REGISTRASI: 'Biaya Registrasi',
    PENETAPAN: 'Biaya Penetapan',
    PENDAMPINGAN: 'Biaya Pendampingan',
    BPJPH: 'Biaya BPJPH',
    MUI: 'Biaya MUI',
    OPSIONAL: 'Biaya Opsional',
    SKEMA: 'Biaya Skema',
};

export default function SPHForm() {
    const { id } = useParams<{ id: string }>();
    const [sph, setSPH] = useState<SPHData | null>(null);
    const [costItems, setCostItems] = useState<CostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (id) loadSPH();
    }, [id]);

    const loadSPH = async () => {
        setLoading(true);
        try {
            // id could be a submission_id (UUID) — try both
            let data: SPHData;
            if (id!.length > 10) {
                // UUID — try to get by submission
                try {
                    data = await financeService.getSPHBySubmission(id!);
                } catch {
                    // Generate if not exists
                    data = await financeService.generateSPH(id!);
                }
            } else {
                data = await financeService.getSPH(Number(id));
            }
            setSPH(data);
            if (data.cost_breakdown) {
                try {
                    setCostItems(JSON.parse(data.cost_breakdown));
                } catch { /* */ }
            }
        } catch (err: any) {
            toast.error(err.message || 'Gagal memuat SPH');
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!id) return;
        setGenerating(true);
        try {
            const data = await financeService.generateSPH(id);
            setSPH(data);
            if (data.cost_breakdown) {
                try { setCostItems(JSON.parse(data.cost_breakdown)); } catch { /* */ }
            }
            toast.success('SPH berhasil di-generate');
        } catch (err: any) {
            toast.error(err.message || 'Gagal generate SPH');
        }
        setGenerating(false);
    };

    const handleApprove = async () => {
        if (!sph) return;
        try {
            await financeService.approveSPH(sph.id);
            toast.success('SPH disetujui');
            loadSPH();
        } catch (err: any) {
            toast.error(err.message || 'Gagal menyetujui SPH');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!sph) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-black text-gray-800">Surat Pengajuan Halal</h1>
                <div className="glass-panel rounded-xl p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">SPH belum tersedia untuk pengajuan ini.</p>
                    <button onClick={handleGenerate} disabled={generating}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50">
                        {generating ? 'Generating...' : 'Generate SPH'}
                    </button>
                </div>
            </div>
        );
    }

    const client = sph.submission?.client;

    // Group cost items by category
    const groupedCosts: Record<string, CostItem[]> = {};
    costItems.forEach(item => {
        const cat = item.category || 'LAINNYA';
        if (!groupedCosts[cat]) groupedCosts[cat] = [];
        groupedCosts[cat].push(item);
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header Actions */}
            <div className="flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <FileText className="w-7 h-7 text-brand-500" />
                        Surat Pengajuan Halal
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Nomor: {sph.sph_number}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                        <Printer className="w-4 h-4" />
                        Cetak
                    </button>
                    {sph.status === 'DRAFT' && (
                        <button onClick={handleApprove}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all">
                            <CheckCircle className="w-4 h-4" />
                            Setujui SPH
                        </button>
                    )}
                </div>
            </div>

            {/* Status Badge */}
            <div className="no-print">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    sph.status === 'ISSUED' ? 'bg-emerald-50 text-emerald-600' :
                    sph.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' :
                    'bg-amber-50 text-amber-600'
                }`}>
                    {sph.status}
                </span>
            </div>

            {/* SPH Document */}
            <div className="glass-panel rounded-xl p-8 print:shadow-none print:border-none" id="sph-document">
                {/* Document Header */}
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h2 className="text-xl font-black text-gray-800 tracking-wide">SURAT PENAWARAN HALAL</h2>
                    <p className="text-sm font-bold text-gray-600 mt-1">Nomor: {sph.sph_number}</p>
                </div>

                {/* Client Info */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Data Pemohon</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-gray-500">Nama Usaha:</span>
                            <span className="ml-2 font-bold text-gray-800">{client?.business_name || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Pemilik:</span>
                            <span className="ml-2 font-bold text-gray-800">{client?.client_name || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Alamat:</span>
                            <span className="ml-2 text-gray-800">{client?.address || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">NIB:</span>
                            <span className="ml-2 text-gray-800">{client?.nib || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Rincian Biaya</h3>

                    {Object.entries(groupedCosts).map(([category, items]) => (
                        <div key={category} className="mb-4">
                            <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">
                                {CATEGORY_LABELS[category] || category}
                            </p>
                            <table className="w-full text-sm mb-2">
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-2 text-gray-700">{item.name}</td>
                                            <td className="py-2 text-right font-medium text-gray-800">{formatIDR(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {costItems.length === 0 && (
                        <p className="text-sm text-gray-400 italic">Tidak ada data biaya dari master biaya.</p>
                    )}

                    {/* Total */}
                    <div className="border-t-2 border-gray-800 pt-3 mt-4 flex justify-between items-center">
                        <span className="text-base font-black text-gray-800">TOTAL</span>
                        <span className="text-lg font-black text-brand-600">{formatIDR(sph.total_amount)}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 text-sm text-gray-500">
                    <p>Tanggal dibuat: {new Date(sph.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {sph.issued_at && (
                        <p>Tanggal diterbitkan: {new Date(sph.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    )}
                </div>

                {/* Signature */}
                <div className="mt-10 flex justify-end">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Hormat kami,</p>
                        <div className="h-16" />
                        <p className="text-sm font-bold text-gray-800 border-t border-gray-300 pt-1">PT Ana Nahnu Indonesia</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
