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
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 focus-within:text-brand-600 transition-colors" />
          <input
            type="text"
            className="form-input pl-11 !py-3 text-sm shadow-sm border-dark-150"
            placeholder="Cari nama, email, telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <select
            className="form-select pl-11 !py-3 text-sm min-w-[200px] shadow-sm border-dark-150"
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
      <div className="glass-card overflow-hidden border border-dark-150/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-200 bg-brand-50/30">
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider">Client</th>
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider">Kontak</th>
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider">Usaha</th>
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider">Route</th>
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider">Status</th>
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider">Tanggal</th>
                <th className="py-4 px-5 text-[10px] font-bold text-brand-950 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100/60 bg-white/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-dark-500">
                    <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : forms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-dark-500 text-sm font-semibold">
                    Tidak ada data client
                  </td>
                </tr>
              ) : (
                forms.map((form, i) => (
                  <motion.tr
                    key={form.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="table-row group"
                  >
                    <td className="py-4 px-5">
                      <p className="text-sm font-bold text-dark-900 group-hover:text-brand-900 transition-colors">{form.name}</p>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-dark-700 flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-dark-400" /> {form.email}
                        </span>
                        <span className="text-xs text-dark-500 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-dark-400" /> {form.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-dark-400" />
                        <span className="text-xs text-dark-800 font-bold">{form.business_type}</span>
                      </div>
                      <span className="text-[9px] text-dark-400 font-extrabold uppercase tracking-widest mt-1 block">{form.business_scale.replace('_', ' ')}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold border ${
                        form.route_type === 'TELECONFERENCE'
                          ? 'bg-brand-50 text-brand-700 border-brand-100/80'
                          : 'bg-amber-50 text-amber-705 border-amber-100/80'
                      }`}>
                        {form.route_type === 'TELECONFERENCE' ? 'Telekonferensi' : 'Self Declare'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold border ${STATUS_COLORS[form.status] || 'bg-dark-50 text-dark-500 border-dark-100'}`}>
                        {STATUS_LABELS[form.status] || form.status}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-xs text-dark-500 font-semibold">
                        {new Date(form.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedForm(form)}
                          className="px-2.5 py-1.5 rounded-lg text-dark-750 bg-white border border-dark-200 hover:bg-dark-50 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Detail Client"
                        >
                          <Eye className="w-3.5 h-3.5 text-dark-550" /> Detail
                        </button>
                        {(form.status === 'MEETING_COMPLETED' || form.status === 'PENDING') && !form.client_user_id && (
                          <button
                            onClick={() => handleGenerateAccount(form.id)}
                            className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate Akun"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Buat Akun
                          </button>
                        )}
                        {form.status === 'TELECONFERENCE_QUEUED' && (
                          <button
                            onClick={() => handleUpdateStatus(form.id, 'MEETING_COMPLETED')}
                            className="px-2.5 py-1.5 rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-dark-100/60 bg-brand-50/10">
            <span className="text-xs text-dark-500 font-semibold">{total} total data</span>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === i + 1
                      ? 'bg-brand-650 text-white shadow-md shadow-brand-600/10'
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
            className="bg-white border border-dark-150 p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dark-100 pb-3">
              <h3 className="text-base font-bold text-brand-950 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" /> Detail Informasi Client
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {[
                ['Nama Lengkap', selectedForm.name],
                ['Email', selectedForm.email],
                ['WhatsApp/HP', selectedForm.phone],
                ['Merek/Usaha', selectedForm.business_type],
                ['Skala Usaha', selectedForm.business_scale.replace('_', ' ').toUpperCase()],
                ['Provinsi', selectedForm.province?.name || '-'],
                ['Rute Sertifikat', selectedForm.route_type === 'TELECONFERENCE' ? '📞 Teleconference (Reguler)' : '📝 Self Declare (Mandiri)'],
                ['Status Terkini', STATUS_LABELS[selectedForm.status] || selectedForm.status],
                ['Menggunakan Daging', selectedForm.uses_meat ? 'Ya (Daging Sapi/Ayam/dsb)' : 'Tidak'],
                ['Jasa Katering/Resto', selectedForm.is_catering ? 'Ya (Catering/Makan Minum)' : 'Tidak'],
                ['Air Minum/AMDK', selectedForm.is_amdk ? 'Ya (Depot Air/Kemasan)' : 'Tidak'],
                ['Tanggal Input', new Date(selectedForm.created_at).toLocaleString('id-ID')],
              ].map(([label, value], idx) => (
                <div key={label} className={`flex justify-between py-2.5 px-3 rounded-xl ${idx % 2 === 0 ? 'bg-dark-50/40' : 'bg-white'} border-b border-dark-100/30`}>
                  <span className="text-xs text-dark-500 font-bold uppercase tracking-wider">{label}</span>
                  <span className="text-xs text-dark-900 font-bold text-right">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedForm(null)}
              className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 font-bold text-dark-900 border border-dark-200"
            >
              <XCircle className="w-4 h-4 text-dark-550" /> Tutup Detail
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
            className="bg-white p-7 max-w-md w-full rounded-3xl shadow-2xl border border-dark-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-650 border border-emerald-100/50">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-brand-950 uppercase tracking-wider">Akun Client Dibuat!</h3>
            </div>
            
            <p className="text-xs text-dark-600 font-semibold leading-relaxed">
              Kredensial eksklusif login HalalCore telah berhasil dibuat. Silakan salin pass-code di bawah ini dan bagikan kepada client.
            </p>

            <div className="bg-dark-50 p-4.5 rounded-2xl border border-dark-200/80 space-y-3 font-mono text-xs text-dark-900 shadow-inner">
              <div className="flex justify-between items-center py-0.5">
                <span>Email: <strong className="select-all font-bold text-brand-950">{generatedAccount.email}</strong></span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedAccount.email);
                    toast.success('Email disalin!');
                  }}
                  className="px-2 py-1 bg-white hover:bg-dark-100 border border-dark-250 rounded-lg text-[10px] font-bold text-dark-800 transition-colors cursor-pointer"
                >
                  Salin
                </button>
              </div>
              {generatedAccount.password && generatedAccount.password !== "(existing account)" && (
                <div className="flex justify-between items-center py-1 border-t border-dark-200/50 pt-2.5">
                  <span>Pass: <strong className="select-all font-bold text-brand-950">{generatedAccount.password}</strong></span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAccount.password || '');
                      toast.success('Password disalin!');
                    }}
                    className="px-2 py-1 bg-white hover:bg-dark-100 border border-dark-250 rounded-lg text-[10px] font-bold text-dark-800 transition-colors cursor-pointer"
                  >
                    Salin
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  const text = `Halo, akun HalalCore Anda sudah dibuat.\nEmail: ${generatedAccount.email}\nPassword: ${generatedAccount.password}\n\nSilakan login di ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  toast.success('Kredensial disalin!');
                }}
                className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer text-dark-900 font-bold border border-dark-200"
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
