import { useEffect, useState } from 'react';
import { getMyForms, updateFormStatus, generateClientAccount, type TeleForm } from '../../services/teleService';
import { motion } from 'framer-motion';
import {
  Users, Search, UserPlus, Eye, CheckCircle2,
  XCircle, Phone, Mail, Building2, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-dark-600/50 text-dark-300',
  TELECONFERENCE_QUEUED: 'bg-primary-500/20 text-primary-400',
  MEETING_SCHEDULED: 'bg-blue-500/20 text-blue-400',
  MEETING_COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  ACCOUNT_CREATED: 'bg-purple-500/20 text-purple-400',
  DATA_INPUT: 'bg-amber-500/20 text-amber-400',
  AGREEMENT_SIGNED: 'bg-emerald-500/20 text-emerald-400',
  INVOICE_SENT: 'bg-amber-500/20 text-amber-400',
  PAID: 'bg-emerald-500/20 text-emerald-400',
  EXPIRED: 'bg-rose-500/20 text-rose-400',
  DELETED: 'bg-dark-600/50 text-dark-500',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  TELECONFERENCE_QUEUED: 'Antrian',
  MEETING_SCHEDULED: 'Meeting Dijadwalkan',
  MEETING_COMPLETED: 'Meeting Selesai',
  ACCOUNT_CREATED: 'Akun Dibuat',
  DATA_INPUT: 'Input Data',
  AGREEMENT_SIGNED: 'Kontrak OK',
  INVOICE_SENT: 'Invoice Terkirim',
  PAID: 'Lunas',
  EXPIRED: 'Kadaluarsa',
  DELETED: 'Dihapus',
};

export default function ClientManagement() {
  const [forms, setForms] = useState<TeleForm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<TeleForm | null>(null);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await getMyForms(params);
      setForms(res.data.data || []);
      setTotal(res.data.total);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchForms();
  };

  const handleGenerateAccount = async (formId: string) => {
    try {
      const res = await generateClientAccount(formId);
      toast.success(`Akun dibuat: ${res.data.email}`);
      fetchForms();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Gagal';
      toast.error(message);
    }
  };

  const handleUpdateStatus = async (formId: string, status: string) => {
    try {
      await updateFormStatus(formId, status);
      toast.success('Status diperbarui');
      fetchForms();
    } catch {
      toast.error('Gagal memperbarui status');
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-400" /> Client Management
        </h1>
        <p className="text-dark-400 text-sm mt-1">Kelola data client yang masuk via form</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            className="form-input pl-10 !py-2.5 text-sm"
            placeholder="Cari nama, email, telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <select
            className="form-select pl-10 !py-2.5 text-sm min-w-[180px]"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Client</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Kontak</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Usaha</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Route</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Tanggal</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-dark-400">
                    <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : forms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-dark-500 text-sm">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                forms.map((form, i) => (
                  <motion.tr
                    key={form.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="table-row"
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{form.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-dark-300 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {form.email}
                        </span>
                        <span className="text-xs text-dark-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {form.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-dark-400" />
                        <span className="text-xs text-dark-300">{form.business_type}</span>
                      </div>
                      <span className="text-[10px] text-dark-500">{form.business_scale}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                        form.route_type === 'TELECONFERENCE'
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {form.route_type === 'TELECONFERENCE' ? 'Telekonferensi' : 'Self Declare'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${STATUS_COLORS[form.status] || 'bg-dark-600 text-dark-400'}`}>
                        {STATUS_LABELS[form.status] || form.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-dark-400">
                        {new Date(form.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedForm(form)}
                          className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(form.status === 'MEETING_COMPLETED' || form.status === 'PENDING') && !form.client_user_id && (
                          <button
                            onClick={() => handleGenerateAccount(form.id)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Generate Akun"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        {form.status === 'TELECONFERENCE_QUEUED' && (
                          <button
                            onClick={() => handleUpdateStatus(form.id, 'MEETING_COMPLETED')}
                            className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-500/20 transition-colors"
                            title="Meeting Selesai"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700/50">
            <span className="text-xs text-dark-400">{total} total data</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-400 hover:bg-dark-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedForm(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Detail Client</h3>
            <div className="space-y-3">
              {[
                ['Nama', selectedForm.name],
                ['Email', selectedForm.email],
                ['Telepon', selectedForm.phone],
                ['Jenis Usaha', selectedForm.business_type],
                ['Skala', selectedForm.business_scale],
                ['Provinsi', selectedForm.province?.name || '-'],
                ['Route', selectedForm.route_type],
                ['Status', STATUS_LABELS[selectedForm.status] || selectedForm.status],
                ['Daging', selectedForm.uses_meat ? 'Ya' : 'Tidak'],
                ['Catering/SPPG', selectedForm.is_catering ? 'Ya' : 'Tidak'],
                ['AMDK', selectedForm.is_amdk ? 'Ya' : 'Tidak'],
                ['Tanggal', new Date(selectedForm.created_at).toLocaleString('id-ID')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-dark-700/30">
                  <span className="text-sm text-dark-400">{label}</span>
                  <span className="text-sm text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedForm(null)}
              className="btn-secondary w-full mt-4"
            >
              <XCircle className="w-4 h-4 inline mr-2" /> Tutup
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
