import { useEffect, useState } from 'react';
import { getMyForms, updateFormStatus, generateClientAccount, type TeleForm } from '../../services/teleService';
import { motion } from 'framer-motion';
import {
  Users, Search, UserPlus, Eye, CheckCircle2,
  XCircle, Phone, Mail, Building2, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-dark-100 text-dark-600 border border-dark-200',
  TELECONFERENCE_QUEUED: 'bg-brand-50 text-brand-700 border border-brand-100',
  MEETING_SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-100',
  MEETING_COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  ACCOUNT_CREATED: 'bg-purple-50 text-purple-700 border border-purple-100',
  DATA_INPUT: 'bg-amber-50 text-amber-700 border border-amber-100',
  AGREEMENT_SIGNED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  INVOICE_SENT: 'bg-amber-50 text-amber-700 border border-amber-100',
  PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  EXPIRED: 'bg-rose-50 text-rose-700 border border-rose-100',
  DELETED: 'bg-dark-50 text-dark-400 border border-dark-100',
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
  const [generatedAccount, setGeneratedAccount] = useState<{ email: string; password?: string } | null>(null);

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
      toast.success('Akun berhasil dibuat!');
      setGeneratedAccount({
        email: res.data.email,
        password: res.data.password,
      });
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
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-600" /> Client Management
        </h1>
        <p className="text-dark-500 text-sm mt-1">Kelola data client yang masuk via form</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
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
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
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
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-200 bg-brand-50/50">
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase">Client</th>
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase">Kontak</th>
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase">Usaha</th>
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase">Route</th>
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase">Status</th>
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase">Tanggal</th>
                <th className="py-3.5 px-4 text-xs font-bold text-brand-900 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-dark-500">
                    <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
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
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-bold text-dark-900">{form.name}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-dark-700 flex items-center gap-1 font-medium">
                          <Mail className="w-3 h-3 text-dark-400" /> {form.email}
                        </span>
                        <span className="text-xs text-dark-500 flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-dark-400" /> {form.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-dark-400" />
                        <span className="text-xs text-dark-800 font-medium">{form.business_type}</span>
                      </div>
                      <span className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">{form.business_scale.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${
                        form.route_type === 'TELECONFERENCE'
                          ? 'bg-brand-50 text-brand-700 border-brand-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {form.route_type === 'TELECONFERENCE' ? 'Telekonferensi' : 'Self Declare'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${STATUS_COLORS[form.status] || 'bg-dark-50 text-dark-500 border-dark-100'}`}>
                        {STATUS_LABELS[form.status] || form.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-dark-500 font-medium">
                        {new Date(form.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedForm(form)}
                          className="px-2.5 py-1.5 rounded-lg text-dark-700 bg-dark-50 hover:bg-dark-100 border border-dark-250/60 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Detail Client"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                        {(form.status === 'MEETING_COMPLETED' || form.status === 'PENDING') && !form.client_user_id && (
                          <button
                            onClick={() => handleGenerateAccount(form.id)}
                            className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250/60 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate Akun"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Buat Akun
                          </button>
                        )}
                        {form.status === 'TELECONFERENCE_QUEUED' && (
                          <button
                            onClick={() => handleUpdateStatus(form.id, 'MEETING_COMPLETED')}
                            className="px-2.5 py-1.5 rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-250/60 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Meeting Selesai"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-100 bg-brand-50/20">
            <span className="text-xs text-dark-500 font-medium">{total} total data</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    page === i + 1
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                      : 'text-dark-500 hover:bg-brand-50 hover:text-brand-600'
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedForm(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-brand-100 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-brand-900 mb-4">Detail Client</h3>
            <div className="space-y-3">
              {[
                ['Nama', selectedForm.name],
                ['Email', selectedForm.email],
                ['Telepon', selectedForm.phone],
                ['Jenis Usaha', selectedForm.business_type],
                ['Skala', selectedForm.business_scale.replace('_', ' ').toUpperCase()],
                ['Provinsi', selectedForm.province?.name || '-'],
                ['Route', selectedForm.route_type === 'TELECONFERENCE' ? '📞 Teleconference' : '📝 Self Declare'],
                ['Status', STATUS_LABELS[selectedForm.status] || selectedForm.status],
                ['Daging', selectedForm.uses_meat ? 'Ya' : 'Tidak'],
                ['Catering/SPPG', selectedForm.is_catering ? 'Ya' : 'Tidak'],
                ['AMDK', selectedForm.is_amdk ? 'Ya' : 'Tidak'],
                ['Tanggal', new Date(selectedForm.created_at).toLocaleString('id-ID')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-dark-100">
                  <span className="text-sm text-dark-700 font-semibold">{label}</span>
                  <span className="text-sm text-dark-900 font-bold">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedForm(null)}
              className="btn-secondary w-full mt-5 flex items-center justify-center gap-1.5 font-bold text-dark-900"
            >
              <XCircle className="w-4 h-4 text-dark-600" /> Tutup
            </button>
          </motion.div>
        </div>
      )}

      {/* Generated Account Modal */}
      {generatedAccount && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 max-w-md w-full rounded-2xl shadow-2xl border border-brand-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-900">Akun Client Berhasil Dibuat!</h3>
            </div>
            
            <p className="text-xs text-dark-700 font-semibold mb-4 leading-relaxed">
              Silakan salin informasi akun di bawah ini dan berikan kepada client untuk masuk ke sistem HalalCore.
            </p>

            <div className="bg-dark-50 p-4 rounded-xl border border-dark-200 space-y-3 font-mono text-xs text-dark-900">
              <div className="flex justify-between items-center py-1">
                <span>Email: <strong className="select-all font-bold text-brand-900">{generatedAccount.email}</strong></span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedAccount.email);
                    toast.success('Email disalin!');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-dark-100 border border-dark-300 rounded-lg text-[10px] font-bold text-dark-800 transition-colors cursor-pointer"
                >
                  Salin
                </button>
              </div>
              {generatedAccount.password && generatedAccount.password !== "(existing account)" && (
                <div className="flex justify-between items-center py-1 border-t border-dark-200/50 pt-2">
                  <span>Password: <strong className="select-all font-bold text-brand-900">{generatedAccount.password}</strong></span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAccount.password || '');
                      toast.success('Password disalin!');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-dark-100 border border-dark-300 rounded-lg text-[10px] font-bold text-dark-800 transition-colors cursor-pointer"
                  >
                    Salin
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const text = `Halo, akun HalalCore Anda sudah dibuat.\nEmail: ${generatedAccount.email}\nPassword: ${generatedAccount.password}\n\nSilakan login di ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  toast.success('Kredensial disalin!');
                }}
                className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer text-dark-900 font-bold"
              >
                Salin Semua
              </button>
              <button
                onClick={() => setGeneratedAccount(null)}
                className="btn-primary flex-1 text-xs py-2 cursor-pointer font-bold"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
