import React, { useState } from 'react';
import {
  Tag,
  Search,
  Plus,
  Wand2,
  Copy,
  Check,
  Edit2,
  Trash2,
  Power,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Ban,
  Ticket,
} from 'lucide-react';
import type { Voucher } from '../../../types/voucher';
import { voucherService } from '../../../services/voucherService';
import toast from 'react-hot-toast';

interface VoucherListProps {
  vouchers: Voucher[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  scopeFilter: string;
  setScopeFilter: (v: string) => void;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onOpenGenerate: () => void;
  onEdit: (voucher: Voucher) => void;
}

export const VoucherList: React.FC<VoucherListProps> = ({
  vouchers,
  total,
  page,
  limit,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  scopeFilter,
  setScopeFilter,
  onPageChange,
  onRefresh,
  onOpenCreate,
  onOpenGenerate,
  onEdit,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode '${code}' berhasil disalin!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggle = async (v: Voucher) => {
    try {
      await voucherService.toggleStatus(v.id);
      toast.success(`Voucher ${v.code} ${v.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (v: Voucher) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus voucher "${v.code}"?`)) return;
    try {
      await voucherService.delete(v.id);
      toast.success('Voucher berhasil dihapus');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus voucher');
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getVoucherStatus = (v: Voucher) => {
    const now = new Date();
    const until = new Date(v.valid_until);
    const from = new Date(v.valid_from);

    if (!v.is_active) {
      return { label: 'Nonaktif', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Ban };
    }
    if (now > until) {
      return { label: 'Kedaluwarsa', color: 'bg-red-50 text-red-700 border-red-200', icon: Clock };
    }
    if (now < from) {
      return { label: 'Akan Datang', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
    }
    if (v.usage_limit > 0 && v.used_count >= v.usage_limit) {
      return { label: 'Habis Kuota', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Ban };
    }
    return { label: 'Aktif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-600" />
            Manajemen Voucher & Promo
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Buat voucher promosi, tentukan diskon, dan pantau kuota pemakaian
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenGenerate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-500/20 transition active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            Generate Masal
          </button>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-700/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Voucher
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, deskripsi..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="EXPIRED">Kedaluwarsa</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            <option value="ALL">Semua Layanan</option>
            <option value="REGULER">Reguler</option>
            <option value="SELF_DECLARE">Self Declare</option>
            <option value="TRAINING">Pelatihan</option>
            <option value="TELEMARKETING">Telemarketing</option>
          </select>

          <div className="hidden sm:flex items-center border border-gray-200 rounded-xl p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'cards' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Kartu
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-500">Memuat data voucher...</p>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Belum Ada Voucher</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Mulai buat kode voucher promosi pertama Anda atau gunakan fitur generator masal untuk membuat kupon secara instan.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onOpenGenerate}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition"
            >
              Generate Masal
            </button>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition"
            >
              Tambah Voucher Baru
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vouchers.map((v) => {
            const status = getVoucherStatus(v);
            const StatusIcon = status.icon;
            const isPercent = v.discount_type === 'PERCENTAGE';
            const progressPercent = v.usage_limit > 0 ? Math.min(100, Math.round((v.used_count / v.usage_limit) * 100)) : 0;

            return (
              <div
                key={v.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Header Ticket Pattern */}
                <div className="p-5 pb-4 bg-gradient-to-br from-gray-50 to-white border-b border-dashed border-gray-200 relative">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {v.scope === 'ALL' ? 'Semua Layanan' : v.scope}
                    </span>
                  </div>

                  {/* Voucher Code Box */}
                  <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 group-hover:border-emerald-300 transition">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono font-black text-sm tracking-wider text-emerald-950 truncate">
                        {v.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(v.code)}
                      title="Salin Kode"
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-white rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-100 transition active:scale-95 shrink-0"
                    >
                      {copiedCode === v.code ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 mt-3 truncate" title={v.name}>
                    {v.name}
                  </h3>
                  {v.description && (
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {v.description}
                    </p>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Discount Value */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Nilai Potongan</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {isPercent ? `${v.discount_value}%` : formatCurrency(v.discount_value)}
                      </span>
                    </div>

                    {/* Min Spend */}
                    {v.min_spend && v.min_spend > 0 ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Min. Transaksi</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(v.min_spend)}</span>
                      </div>
                    ) : null}

                    {/* Max Discount for Percentage */}
                    {isPercent && v.max_discount && v.max_discount > 0 ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Maks. Potongan</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(v.max_discount)}</span>
                      </div>
                    ) : null}

                    {/* Quota Progress */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-500 font-medium">Kuota Terpakai</span>
                        <span className="font-bold text-gray-700">
                          {v.used_count} / {v.usage_limit > 0 ? v.usage_limit : '∞'} ({v.usage_limit > 0 ? `${progressPercent}%` : 'Unlimited'})
                        </span>
                      </div>
                      {v.usage_limit > 0 && (
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPercent >= 100 ? 'bg-red-500' : progressPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Total Rupiah Given */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <span className="text-gray-400 font-medium">Akumulasi Diskon</span>
                      <span className="font-bold text-gray-700">{formatCurrency(v.total_discount)}</span>
                    </div>

                    {/* Validity Period */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        {new Date(v.valid_from).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                        {new Date(v.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggle(v)}
                      title={v.is_active ? 'Nonaktifkan Voucher' : 'Aktifkan Voucher'}
                      className={`p-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center gap-1 ${
                        v.is_active
                          ? 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{v.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEdit(v)}
                        className="p-2 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 transition"
                        title="Edit Voucher"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        className="p-2 rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition"
                        title="Hapus Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Kode & Nama</th>
                  <th className="py-3.5 px-4">Diskon</th>
                  <th className="py-3.5 px-4">Kategori / Scope</th>
                  <th className="py-3.5 px-4">Terpakai / Kuota</th>
                  <th className="py-3.5 px-4">Total Diskon Diberikan</th>
                  <th className="py-3.5 px-4">Masa Berlaku</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vouchers.map((v) => {
                  const status = getVoucherStatus(v);
                  const isPercent = v.discount_type === 'PERCENTAGE';

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            className="text-gray-400 hover:text-emerald-700 transition"
                            title="Salin Kode"
                          >
                            {copiedCode === v.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="font-medium text-gray-800 mt-1">{v.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700">
                          {isPercent ? `${v.discount_value}%` : formatCurrency(v.discount_value)}
                        </span>
                        {v.min_spend && v.min_spend > 0 ? (
                          <p className="text-[10px] text-gray-400">Min: {formatCurrency(v.min_spend)}</p>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-semibold text-[10px]">
                          {v.scope}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-700">
                          {v.used_count} / {v.usage_limit > 0 ? v.usage_limit : '∞'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {formatCurrency(v.total_discount)}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(v.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggle(v)}
                            title={v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(v)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            title="Hapus"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm text-xs">
          <p className="text-gray-500">
            Menampilkan halaman <span className="font-bold text-gray-800">{page}</span> dari{' '}
            <span className="font-bold text-gray-800">{totalPages}</span> (Total {total} voucher)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
