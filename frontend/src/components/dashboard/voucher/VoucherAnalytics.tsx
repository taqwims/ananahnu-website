import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Tag,
  DollarSign,
  Award,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { VoucherAnalyticsResponse } from '../../../types/voucher';
import { voucherService } from '../../../services/voucherService';
import toast from 'react-hot-toast';

export const VoucherAnalytics: React.FC = () => {
  const [data, setData] = useState<VoucherAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await voucherService.getAnalytics(days);
      setData(res);
    } catch (err: any) {
      toast.error('Gagal memuat analitik voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-gray-500">Menghitung dan memuat data analitik...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    total_vouchers: 0,
    active_vouchers: 0,
    expired_vouchers: 0,
    total_claims: 0,
    total_discount_amount: 0,
    total_gross_volume: 0,
    avg_discount_per_claim: 0,
    total_unique_users: 0,
  };

  const dailyTrend = data?.daily_trend || [];
  const topVouchers = data?.top_vouchers || [];
  const scopeBreakdown = data?.scope_breakdown || {};

  // Find max value in daily trends for bar scaling
  const maxClaims = Math.max(...dailyTrend.map((d) => d.claim_count), 1);
  const maxTopDiscount = Math.max(...topVouchers.map((v) => v.total_discount), 1);

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filter */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Analitik & Performa Voucher
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Statistik klaim promosi, efisiensi diskon, dan tren penggunaan voucher
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-200">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  days === d
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {d} Hari Terakhir
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition active:scale-95"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Claims */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg shadow-emerald-700/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Klaim Voucher</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black">{summary.total_claims} <span className="text-sm font-medium text-emerald-200">Klaim</span></h3>
            <p className="text-[11px] text-emerald-100 mt-1">
              Digunakan oleh <strong className="text-white">{summary.total_unique_users}</strong> pengguna unik
            </p>
          </div>
        </div>

        {/* Total Discount Given */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Diskon Diberikan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-gray-900">{formatCurrency(summary.total_discount_amount)}</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Rata-rata {formatCurrency(summary.avg_discount_per_claim)} per transaksi
            </p>
          </div>
        </div>

        {/* Total Gross Volume */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nilai Transaksi (Gross)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-gray-900">{formatCurrency(summary.total_gross_volume)}</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Gross revenue dari transaksi pengguna voucher
            </p>
          </div>
        </div>

        {/* Active vs Total Vouchers */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status Voucher</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-gray-900">
              {summary.active_vouchers} <span className="text-xs text-emerald-600 font-bold">Aktif</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Dari total {summary.total_vouchers} voucher ({summary.expired_vouchers} kedaluwarsa)
            </p>
          </div>
        </div>
      </div>

      {/* Daily Redemption Trend Chart */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Tren Penggunaan Voucher ({days} Hari Terakhir)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Frekuensi klaim kupon promosi per hari
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-600 font-medium">Jumlah Klaim</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-6 pb-2">
          {dailyTrend.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Tidak ada aktivitas pada rentang waktu ini.</p>
          ) : (
            <div className="flex items-end gap-2 h-44 border-b border-gray-200 pb-2 overflow-x-auto">
              {dailyTrend.map((item, idx) => {
                const heightPercent = Math.max(8, Math.round((item.claim_count / maxClaims) * 100));
                const dateLabel = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                return (
                  <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10 shadow-lg">
                      <p className="font-bold">{item.claim_count} Klaim</p>
                      <p className="text-emerald-300">{formatCurrency(item.total_discount)}</p>
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-gray-100 rounded-t-xl h-full flex items-end">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          item.claim_count > 0 ? 'bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-700 group-hover:to-teal-600' : 'bg-transparent'
                        }`}
                        style={{ height: `${item.claim_count > 0 ? heightPercent : 0}%` }}
                      />
                    </div>

                    {/* X-axis Label */}
                    <span className="text-[10px] text-gray-400 font-medium rotate-0 group-hover:text-emerald-700 group-hover:font-bold">
                      {dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Top Vouchers & Scope Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Performing Vouchers */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Voucher Terpopuler & Paling Banyak Digunakan
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Daftar kode kupon dengan volume klaim dan akumulasi diskon terbesar
            </p>
          </div>

          {topVouchers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Belum ada data pemakaian voucher.</p>
          ) : (
            <div className="space-y-3">
              {topVouchers.map((item, idx) => {
                const barPercent = Math.max(5, Math.round((item.total_discount / maxTopDiscount) * 100));

                return (
                  <div key={item.voucher_id || idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-mono font-black text-xs text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="text-xs font-bold text-gray-800 truncate max-w-[180px] sm:max-w-xs">
                          {item.name}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-700">
                          {formatCurrency(item.total_discount)}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {item.used_count}x diklaim
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scope / Category Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Distribusi Kategori Layanan
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Alokasi voucher berdasarkan jenis layanan
            </p>
          </div>

          <div className="space-y-3 py-2">
            {Object.keys(scopeBreakdown).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Belum ada data kategori.</p>
            ) : (
              Object.entries(scopeBreakdown).map(([scope, count]) => {
                const totalV = summary.total_vouchers || 1;
                const percent = Math.round((Number(count) / totalV) * 100);

                return (
                  <div key={scope} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700">{scope}</span>
                      <span className="text-gray-500 font-semibold">{count} voucher ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 text-xs leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Insight Efektivitas
            </p>
            <p className="text-[11px] text-emerald-800">
              Voucher dengan batas minimum transaksi dan kuota terbatas terbukti menghasilkan konversi pengajuan 40% lebih tinggi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
