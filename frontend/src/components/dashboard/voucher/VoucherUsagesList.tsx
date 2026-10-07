import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck,
  CreditCard,
} from 'lucide-react';
import type { VoucherUsage } from '../../../types/voucher';
import { voucherService, type VoucherUsageFilterParams } from '../../../services/voucherService';
import toast from 'react-hot-toast';

export const VoucherUsagesList: React.FC = () => {
  const [usages, setUsages] = useState<VoucherUsage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUsage, setSelectedUsage] = useState<VoucherUsage | null>(null);

  const fetchUsages = async () => {
    try {
      setLoading(true);
      const params: VoucherUsageFilterParams = {
        page,
        limit,
        search: search.trim() || undefined,
        voucher_code: voucherCode.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const res = await voucherService.getUsages(params);
      setUsages(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error('Gagal memuat riwayat penggunaan voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsages();
  }, [page, voucherCode, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsages();
  };

  const handleResetFilter = () => {
    setSearch('');
    setVoucherCode('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Siapa yang Menggunakan Voucher
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Daftar lengkap pengguna, invoice terkait, nominal diskon yang diklaim, dan rincian transaksi
          </p>
        </div>

        <button
          onClick={fetchUsages}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition active:scale-95 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* User / General Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, phone, no ref..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Voucher Code filter */}
          <div className="relative">
            <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Kode Voucher (misal: HALALBERKAH)"
              className="w-full uppercase font-mono pl-9 pr-3 py-2 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Date from */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Mulai Tanggal"
              className="w-full px-3 py-2 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Date to & Actions */}
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Sampai Tanggal"
              className="w-full px-3 py-2 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shrink-0"
            >
              Cari
            </button>
            {(search || voucherCode || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition shrink-0"
                title="Reset Filter"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Usages Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-gray-500">Memuat data penggunaan voucher...</p>
          </div>
        ) : usages.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">Belum Ada Riwayat Penggunaan</p>
            <p className="text-xs text-gray-400">Belum ada user atau transaksi yang menggunakan voucher sesuai filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Pengguna / Klien</th>
                  <th className="py-3.5 px-4">Voucher Diklaim</th>
                  <th className="py-3.5 px-4">Nominal Diskon</th>
                  <th className="py-3.5 px-4">Total Tagihan</th>
                  <th className="py-3.5 px-4">Referensi Transaksi</th>
                  <th className="py-3.5 px-4">Waktu Klaim</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usages.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-100">
                          {u.user_name ? u.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{u.user_name || u.user?.full_name || 'Pelanggan'}</p>
                          <p className="text-[11px] text-gray-400 truncate">{u.user_email || u.user?.email || u.user_phone || '-'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Voucher Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block">
                        {u.voucher_code}
                      </span>
                    </td>

                    {/* Discount Amount */}
                    <td className="py-3.5 px-4">
                      <span className="font-black text-emerald-700">
                        - {formatCurrency(u.discount_amount)}
                      </span>
                    </td>

                    {/* Bill comparison */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-800">{formatCurrency(u.final_amount)}</p>
                      <p className="text-[10px] text-gray-400 line-through">
                        {formatCurrency(u.original_amount)}
                      </p>
                    </td>

                    {/* Reference No */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {u.reference_no || `REF-${u.id}`}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{u.reference_type || 'INVOICE'}</p>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(u.used_at || u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.status || 'APPLIED'}
                      </span>
                    </td>

                    {/* Detail Modal button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedUsage(u)}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm text-xs">
          <p className="text-gray-500">
            Menampilkan <span className="font-bold text-gray-800">{usages.length}</span> dari{' '}
            <span className="font-bold text-gray-800">{total}</span> total klaim voucher
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-700 px-2">Halaman {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Rincian Pemakaian Voucher
              </h3>
              <button
                onClick={() => setSelectedUsage(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Kode Voucher</span>
                  <p className="font-mono font-black text-sm text-emerald-950">{selectedUsage.voucher_code}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Potongan Diskon</span>
                  <p className="font-black text-sm text-emerald-700">- {formatCurrency(selectedUsage.discount_amount)}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                <p className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  Identitas Pengguna
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-gray-600">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Nama Lengkap</span>
                    <span className="font-bold text-gray-800">{selectedUsage.user_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Email</span>
                    <span className="font-medium text-gray-800">{selectedUsage.user_email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Nomor Telepon</span>
                    <span className="font-medium text-gray-800">{selectedUsage.user_phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">User ID</span>
                    <span className="font-mono text-[10px] text-gray-600 truncate block">{selectedUsage.user_id || 'Guest / Unregistered'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                <p className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                  Rincian Keuangan & Transaksi
                </p>
                <div className="space-y-1.5 pt-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Nominal Awal:</span>
                    <span className="font-bold">{formatCurrency(selectedUsage.original_amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon Voucher:</span>
                    <span className="font-bold">- {formatCurrency(selectedUsage.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total Pembayaran Akhir:</span>
                    <span className="text-emerald-700">{formatCurrency(selectedUsage.final_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[11px] text-gray-400">
                    <span>Nomor Referensi:</span>
                    <span className="font-mono text-gray-700">{selectedUsage.reference_no || '-'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Waktu Digunakan:</span>
                    <span className="text-gray-700">{new Date(selectedUsage.used_at || selectedUsage.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUsage(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
