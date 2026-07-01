import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ChevronLeft, Building2, User, Phone, MapPin, Hash, Plus, FileText } from 'lucide-react';
import api from '../../services/api';
import type { Client, Submission } from '../../types';
import { formatServiceType } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const load = async () => {
            try {
                const [clientRes, submissionsRes] = await Promise.all([
                    api.get(`/clients/${id}`),
                    api.get('/submissions', { params: { client_id: id } })
                ]);
                setClient(clientRes.data);
                setSubmissions(submissionsRes.data.data || []);
            } catch (err) {
                console.error("Failed to load client detail", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    if (!client) return <div className="p-8 text-center text-gray-500">Client not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard/clients')} className="p-2 hover:bg-white/50 rounded-xl transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-brand-50 text-brand-600 rounded-2xl shadow-lg shadow-brand-100/50">
                                <Building2 className="w-6 h-6" />
                            </div>
                            Detail Klien
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium italic">Informasi profil dan histori pengajuan klien</p>
                    </div>
                </div>
                {user?.role !== 'VIEWER' && (
                    <button 
                        onClick={() => navigate(`/dashboard/submissions/create?client_id=${client.id}`)}
                        className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Buat Pengajuan Baru
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-panel p-6 shadow-xl border border-white/40 space-y-6">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-800">{client.business_name}</h3>
                                <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mt-1">{client.product_name}</p>
                            </div>
                            <button onClick={() => navigate(`/dashboard/clients/${client.id}/edit`)} className="text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors">Edit</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Pemilik</p>
                                    <p className="text-sm font-bold text-gray-700">{client.client_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NIB / NIK</p>
                                    <p className="text-sm font-bold font-mono text-gray-700">{client.nib} / {client.nik}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kontak</p>
                                    <p className="text-sm font-medium text-gray-700">{client.phone} {client.contact_person && `(${client.contact_person})`}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat</p>
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{client.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="glass-panel shadow-xl border border-white/40 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-white/50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" /> Histori Pengajuan ({submissions.length})
                            </h3>
                        </div>
                        <div className="p-0">
                            {submissions.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">Belum ada histori pengajuan untuk klien ini.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {submissions.map(sub => (
                                        <div key={sub.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                        sub.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {formatServiceType(sub.service_type)}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                                        {sub.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">Diperbarui: {new Date(sub.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                {sub.reject_note && sub.status === 'REJECTED' && (
                                                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Catatan Penolakan / Revisi:</p>
                                                        <p className="text-xs font-medium text-red-800">{sub.reject_note}</p>
                                                    </div>
                                                )}
                                                {sub.reject_note && sub.status === 'REVISION' && (
                                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Catatan Revisi (Dari QC):</p>
                                                        <p className="text-xs font-medium text-amber-800">{sub.reject_note}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Link 
                                                to={`/dashboard/submissions/${sub.id}`}
                                                className="px-4 py-2 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-gray-700 hover:text-brand-700 text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
                                            >
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
