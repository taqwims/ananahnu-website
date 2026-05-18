import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import type { User } from '../../types';

interface PromotionRequest {
    id: number;
    user_id: string;
    user: User;
    target_role: string;
    status: string;
    created_at: string;
    note: string;
    requirements_snapshot: string;
}

export default function AdminPelatihanPromosi() {
    const [requests, setRequests] = useState<PromotionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
    const [modalAction, setModalAction] = useState<'verify' | 'pass' | 'reject' | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/promotions/');
            setRequests(res.data || []);
        } catch (error) {
            console.error("Failed to fetch promotion requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedRequest || !modalAction) return;

        try {
            if (modalAction === 'verify') {
                await api.put(`/promotions/${selectedRequest.id}/verify`);
                toast.success("Pengajuan diverifikasi, status menjadi Menunggu Assesment");
            } else if (modalAction === 'pass') {
                await api.put(`/promotions/${selectedRequest.id}/assess`, { passed: true });
                toast.success("Kandidat dinyatakan LULUS dan jabatan telah diperbarui");
            } else if (modalAction === 'reject') {
                await api.put(`/promotions/${selectedRequest.id}/assess`, { passed: false });
                toast.success("Pengajuan ditolak");
            }
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Aksi gagal");
        } finally {
            setModalAction(null);
            setSelectedRequest(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'PENDING_VERIFICATION':
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>;
            case 'IN_TRAINING':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><FileText className="w-3 h-3"/> Assessment</span>;
            case 'PASSED':
                return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Lulus</span>;
            case 'REJECTED':
                return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> Ditolak</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Kelola Pengajuan Promosi</h1>
                <p className="text-gray-500 text-sm mt-1">Verifikasi persyaratan dan tentukan kelulusan jenjang karir</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Daftar Pengajuan</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Kandidat</th>
                                <th className="px-6 py-4">Pengajuan Promosi</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Belum ada pengajuan.</td>
                                </tr>
                            ) : (
                                requests.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{r.user?.full_name}</span>
                                                <span className="text-xs text-gray-500">{r.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-brand-600">Ke: {r.target_role.replace('_', ' ')}</span>
                                                <span className="text-[10px] text-gray-400 mt-1">Snapshot: {r.requirements_snapshot}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {r.status === 'PENDING_VERIFICATION' && (
                                                <button 
                                                    onClick={() => { setSelectedRequest(r); setModalAction('verify'); }}
                                                    className="bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Verifikasi
                                                </button>
                                            )}
                                            {r.status === 'IN_TRAINING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => { setSelectedRequest(r); setModalAction('reject'); }}
                                                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Tidak Lulus
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedRequest(r); setModalAction('pass'); }}
                                                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Luluskan
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal 
                isOpen={!!modalAction}
                onClose={() => { setModalAction(null); setSelectedRequest(null); }}
                onConfirm={handleAction}
                title={modalAction === 'verify' ? "Verifikasi Syarat?" : modalAction === 'pass' ? "Luluskan Kandidat?" : "Tolak Kandidat?"}
                message={modalAction === 'pass' ? "Kandidat akan otomatis dinaikkan jabatannya ke " + selectedRequest?.target_role : "Apakah Anda yakin melakukan aksi ini?"}
                confirmText={modalAction === 'pass' ? "Ya, Luluskan" : "Konfirmasi"}
                variant={modalAction === 'reject' ? "danger" : "info"}
            />
        </div>
    );
}
