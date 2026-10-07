import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Wand2,
  Users,
  BarChart3,
  Plus,
} from 'lucide-react';
import type { Voucher } from '../../types/voucher';
import { voucherService } from '../../services/voucherService';
import { VoucherList } from '../../components/dashboard/voucher/VoucherList';
import { VoucherModal } from '../../components/dashboard/voucher/VoucherModal';
import { VoucherGeneratorModal } from '../../components/dashboard/voucher/VoucherGeneratorModal';
import { VoucherUsagesList } from '../../components/dashboard/voucher/VoucherUsagesList';
import { VoucherAnalytics } from '../../components/dashboard/voucher/VoucherAnalytics';
import toast from 'react-hot-toast';

type TabType = 'list' | 'usages' | 'analytics';

export const VoucherManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherService.getAll({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        scope: scopeFilter || undefined,
      });
      setVouchers(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error('Gagal memuat data voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchVouchers();
    }
  }, [page, statusFilter, scopeFilter, activeTab]);

  const handleEdit = (v: Voucher) => {
    setSelectedVoucher(v);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedVoucher(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Navigation Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 bottom-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold mb-3 backdrop-blur-md">
              <Ticket className="w-3.5 h-3.5 text-emerald-300" />
              Sistem Promosi & Kupon HalalCore
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Manajemen Voucher & Diskon
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Pusat kendali kode voucher, pemantauan siapa yang menggunakan voucher, generator kupon masal, dan analisis performa penjualan.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold border border-white/20 backdrop-blur-md transition active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              Generate Kode
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl text-xs font-black transition active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Buat Voucher
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 border-t border-emerald-700/50 pt-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'list'
                ? 'bg-white text-emerald-900 shadow-md scale-102'
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Daftar Voucher
          </button>

          <button
            onClick={() => setActiveTab('usages')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'usages'
                ? 'bg-white text-emerald-900 shadow-md scale-102'
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Siapa yang Menggunakan Voucher
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-white text-emerald-900 shadow-md scale-102'
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analitik & Laporan
          </button>

          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="px-4 py-2 rounded-2xl text-xs font-bold text-amber-200 hover:bg-emerald-800/60 transition flex items-center gap-2 shrink-0"
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            Generator Kode Masal
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'list' && (
        <VoucherList
          vouchers={vouchers}
          total={total}
          page={page}
          limit={limit}
          loading={loading}
          search={search}
          setSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
          statusFilter={statusFilter}
          setStatusFilter={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          scopeFilter={scopeFilter}
          setScopeFilter={(val) => {
            setScopeFilter(val);
            setPage(1);
          }}
          onPageChange={setPage}
          onRefresh={fetchVouchers}
          onOpenCreate={handleOpenCreate}
          onOpenGenerate={() => setIsGeneratorOpen(true)}
          onEdit={handleEdit}
        />
      )}

      {activeTab === 'usages' && <VoucherUsagesList />}

      {activeTab === 'analytics' && <VoucherAnalytics />}

      {/* Modals */}
      <VoucherModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVoucher(null);
        }}
        onSuccess={fetchVouchers}
        voucher={selectedVoucher}
      />

      <VoucherGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSuccess={fetchVouchers}
      />
    </div>
  );
};

export default VoucherManagement;
