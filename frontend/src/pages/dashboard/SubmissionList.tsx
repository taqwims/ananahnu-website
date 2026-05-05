import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import type { Submission } from '../../types';
import { useAuthStore } from '../../store/authStore';

// Map status to colors
const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    VERVAL_PENDAMPING: 'bg-yellow-100 text-yellow-800',
    QC_OFFICER: 'bg-blue-100 text-blue-800',
    DRAFTER: 'bg-purple-100 text-purple-800',
    SIDANG_FATWA: 'bg-indigo-100 text-indigo-800',
    SH_TERBIT: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    REVISION: 'bg-orange-100 text-orange-800',
};

export default function SubmissionList() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSub, setNewSub] = useState({ clientId: '', businessName: '', serviceType: 'SELF_DECLARE' });
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/submissions', {
                params: { status: statusFilter }
            });
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        navigate(`/dashboard/submissions/new?type=${newSub.serviceType}&name=${newSub.businessName}`);
    };

    useEffect(() => {
        fetchSubmissions();
    }, [statusFilter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Submissions</h1>
                    <p className="text-gray-500 text-sm">Track and manage halal certification requests</p>
                </div>
                <div className="flex gap-2">
                    {user?.role !== 'DRAFTER' && user?.role !== 'QC_OFFICER' && (
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="glass-button text-sm"
                        >
                            Buat Pengajuan Baru
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                    className="glass-input appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="VERVAL_PENDAMPING">Verval Pendamping</option>
                    <option value="QC_OFFICER">QC Officer</option>
                    <option value="DRAFTER">Drafter</option>
                    <option value="SIDANG_FATWA">Sidang Fatwa</option>
                    <option value="SH_TERBIT">SH Terbit</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REVISION">Revision</option>
                </select>
            </div>

            {/* List */}
            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No submissions found.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {submissions.map((sub) => (
                            <div key={sub.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[sub.status] || 'bg-gray-100'}`}>
                                        {sub.status === 'SH_TERBIT' ? <CheckCircle className="w-5 h-5" /> :
                                            sub.status === 'REJECTED' ? <AlertCircle className="w-5 h-5" /> :
                                                <Clock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{sub.client?.business_name || 'Unknown Client'}</h4>
                                        <div className="text-xs text-gray-500 font-mono mt-1">ID: {sub.client?.nib}</div>
                                        <div className="text-xs text-gray-500 mt-1">Service: <span className="font-semibold">{sub.service_type || 'Unknown'}</span></div>
                                        <div className="text-xs text-gray-400 mt-1">Submitted: {new Date(sub.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[sub.status] || 'bg-gray-100'}`}>
                                        {sub.status.replace(/_/g, ' ')}
                                    </span>
                                    <Link to={`/dashboard/submissions/${sub.id}`} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Buat Pengajuan Baru</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama Usaha / Produk</label>
                                <input 
                                    type="text"
                                    className="glass-input w-full"
                                    placeholder="Masukkan nama usaha atau produk..."
                                    value={newSub.businessName}
                                    onChange={e => setNewSub({...newSub, businessName: e.target.value})}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Data NIB & NIK akan dilengkapi oleh Drafter kemudian.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Jenis Layanan</label>
                                <select 
                                    className="glass-input w-full"
                                    value={newSub.serviceType}
                                    onChange={e => setNewSub({...newSub, serviceType: e.target.value})}
                                >
                                    <option value="SELF_DECLARE">Self Declare</option>
                                    <option value="SELF_DECLARE_MANDIRI">Self Declare Mandiri</option>
                                    <option value="REGULER">Reguler</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowCreateModal(false)}>Batal</button>
                                <button
                                    onClick={handleCreate}
                                    className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors"
                                >
                                    Lanjut Isi Data
                                </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
