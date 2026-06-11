import { useState, useEffect } from 'react';
import type { Client } from '../../types';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, Download, FileText, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ClientList() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [creatingSub, setCreatingSub] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clients', {
                params: {
                    page,
                    limit: 10,
                    search,
                    status: statusFilter
                }
            });
            setClients(res.data.data);
            setTotalPages(Math.ceil(res.data.meta.total / 10));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type: 'xlsx' | 'pdf') => {
        try {
            const response = await api.get('/reports/export', {
                params: {
                    type,
                    search,
                    status: statusFilter
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `clients_report.${type}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert("Export failed");
        }
    };

    const handleCreateSubmission = async (client: Client) => {
        setCreatingSub(client.id);
        try {
            const res = await api.post('/submissions/draft', {
                client_id: client.id,
                service_type: client.service_type
            });
            navigate(`/dashboard/submissions/${res.data.id}`);
        } catch (err) {
            console.error(err);
            alert("Gagal membuat pengajuan");
        } finally {
            setCreatingSub(null);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 300); // 300ms debounce

        const checkVerification = async () => {
            if (user?.role === 'HALAL_ADVISOR') {
                try {
                    // 1. Check Profile Verification
                    const profileRes = await api.get(`/consultant/profile/${user.id}`);
                    const profileVerified = profileRes.data?.is_verified ?? false;

                    // 2. Check Training Graduation
                    const trainingRes = await api.get(`/user-trainings/${user.id}`);
                    const trainings = trainingRes.data || [];
                    const isGraduated = trainings.some((t: any) => t.status === 'LULUS');

                    setIsVerified(profileVerified && isGraduated);
                } catch (err) {
                    setIsVerified(false);
                }
            } else {
                setIsVerified(true);
            }
        };
        checkVerification();

        return () => clearTimeout(timer);
    }, [page, search, statusFilter, user]);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
                    <p className="text-gray-500 text-sm">Manage business actors and submissions</p>
                </div>
                <div className="flex gap-2">
                    {user?.role !== 'VIEWER' && (
                        <div className="relative group">
                            <button 
                                onClick={() => isVerified !== false && navigate('/dashboard/clients/new')} 
                                disabled={isVerified === false}
                                className={`glass-button flex items-center gap-2 transition-all ${
                                    isVerified === false 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 shadow-none' 
                                    : ''
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                                Add Client
                            </button>
                            {isVerified === false && (
                                <div className="absolute top-full mt-2 right-0 w-72 bg-red-600 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none font-bold text-center">
                                    Akses Dibatasi: Akun harus terverifikasi DAN lulus pelatihan sebelum dapat menambah klien.
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search NIB or Business Name..."
                        className="glass-input pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        className="glass-input pl-9 appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SH_TERBIT">SH Terbit</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('xlsx')} className="glass-button bg-white text-green-700 hover:bg-green-50 border border-green-200 shadow-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Excel
                    </button>
                    <button onClick={() => handleExport('pdf')} className="glass-button bg-white text-red-700 hover:bg-red-50 border border-red-200 shadow-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">NIB</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Nama Bisnis</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Nama Klien</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Produk</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading clients...</td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No clients found.</td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-gray-600">{client.nib}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{client.business_name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{client.client_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{client.product_name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                ACTIVE
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link to={`/dashboard/clients/${client.id}`} className="text-brand-600 hover:text-brand-800 font-medium">View</Link>
                                                {user?.role !== 'VIEWER' && (
                                                    <button 
                                                       onClick={() => isVerified !== false && handleCreateSubmission(client)}
                                                       disabled={creatingSub === client.id || isVerified === false}
                                                       className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition disabled:opacity-50 ${
                                                            isVerified === false 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                            : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                                                       }`}
                                                    >
                                                       {creatingSub === client.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                                       Buat Pengajuan
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-glass-border flex items-center justify-between">
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
