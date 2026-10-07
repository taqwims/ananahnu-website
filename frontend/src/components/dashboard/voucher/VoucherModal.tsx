import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles, Percent, DollarSign, ShieldCheck } from 'lucide-react';
import type { Voucher, DiscountType, VoucherScope } from '../../../types/voucher';
import { voucherService } from '../../../services/voucherService';
import toast from 'react-hot-toast';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  voucher?: Voucher | null;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  voucher,
}) => {
  const isEdit = !!voucher;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('FIXED_AMOUNT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [minSpend, setMinSpend] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [usagePerUser, setUsagePerUser] = useState<number>(1);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [scope, setScope] = useState<VoucherScope>('ALL');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (voucher) {
      setCode(voucher.code);
      setName(voucher.name);
      setDescription(voucher.description || '');
      setDiscountType(voucher.discount_type);
      setDiscountValue(voucher.discount_value);
      setMaxDiscount(voucher.max_discount || 0);
      setMinSpend(voucher.min_spend || 0);
      setUsageLimit(voucher.usage_limit || 0);
      setUsagePerUser(voucher.usage_per_user || 1);
      setValidFrom(voucher.valid_from ? voucher.valid_from.substring(0, 10) : '');
      setValidUntil(voucher.valid_until ? voucher.valid_until.substring(0, 10) : '');
      setScope(voucher.scope || 'ALL');
      setIsActive(voucher.is_active);
    } else {
      // Default new voucher
      const today = new Date().toISOString().substring(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      setCode('');
      setName('');
      setDescription('');
      setDiscountType('FIXED_AMOUNT');
      setDiscountValue(50000);
      setMaxDiscount(0);
      setMinSpend(0);
      setUsageLimit(100);
      setUsagePerUser(1);
      setValidFrom(today);
      setValidUntil(nextMonth);
      setScope('ALL');
      setIsActive(true);
    }
  }, [voucher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Kode voucher wajib diisi');
      return;
    }
    if (!name.trim()) {
      toast.error('Nama voucher wajib diisi');
      return;
    }
    if (discountValue <= 0) {
      toast.error('Nilai diskon harus lebih dari 0');
      return;
    }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      toast.error('Persentase diskon tidak boleh lebih dari 100%');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<Voucher> = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_discount: discountType === 'PERCENTAGE' ? Number(maxDiscount) : 0,
        min_spend: Number(minSpend),
        usage_limit: Number(usageLimit),
        usage_per_user: Number(usagePerUser),
        valid_from: validFrom,
        valid_until: validUntil,
        scope,
        is_active: isActive,
      };

      if (isEdit && voucher) {
        await voucherService.update(voucher.id, payload);
        toast.success('Voucher berhasil diperbarui');
      } else {
        await voucherService.create(payload);
        toast.success('Voucher berhasil dibuat');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Gagal menyimpan voucher';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const generateQuickCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(`HALAL-${rand}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Tag className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? 'Edit Data Voucher' : 'Tambah Voucher Baru'}
              </h2>
              <p className="text-xs text-emerald-200/90 font-medium">
                Kelola diskon promosi, kuota penggunaan, dan masa berlaku
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Code & Auto Generator */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Kode Voucher <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: HALALRAMADHAN, DISKON100K"
                  className="w-full uppercase font-mono font-bold text-sm tracking-wider px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>
              <button
                type="button"
                onClick={generateQuickCode}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Acak Kode
              </button>
            </div>
          </div>

          {/* Name & Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Nama Voucher / Kampanye <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Promo Ramadhan Berkah"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Target / Kategori Layanan
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as VoucherScope)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
              >
                <option value="ALL">Semua Layanan (Reguler, Self Declare, dll.)</option>
                <option value="REGULER">Khusus Sertifikasi Reguler</option>
                <option value="SELF_DECLARE">Khusus Self Declare Mandiri</option>
                <option value="TRAINING">Khusus Pelatihan & Workshop</option>
                <option value="TELEMARKETING">Khusus Telemarketing Deal</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Deskripsi & Syarat Ketentuan
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Jelaskan detail voucher atau syarat penggunaan..."
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Skema Potongan Diskon
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipe Diskon</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED_AMOUNT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      discountType === 'FIXED_AMOUNT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Nominal (Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Persentase (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {discountType === 'PERCENTAGE' ? 'Besaran Diskon (%)' : 'Besaran Diskon (Rp)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder={discountType === 'PERCENTAGE' ? '10' : '50000'}
                  className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discountType === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Maksimal Potongan (Rp) <span className="text-gray-400 font-normal">(0 = tanpa batas)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    placeholder="Contoh: 300000"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Minimal Transaksi (Rp) <span className="text-gray-400 font-normal">(0 = tanpa batas)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={minSpend || ''}
                  onChange={(e) => setMinSpend(Number(e.target.value))}
                  placeholder="Contoh: 1000000"
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Limits & Quota */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Total Kuota Penggunaan <span className="text-gray-400 font-normal">(0 = Unlimited)</span>
              </label>
              <input
                type="number"
                min="0"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                placeholder="0"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Batas Pemakaian Per Akun
              </label>
              <input
                type="number"
                min="1"
                value={usagePerUser}
                onChange={(e) => setUsagePerUser(Number(e.target.value))}
                placeholder="1"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Berlaku Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Berlaku Sampai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div>
              <p className="text-xs font-bold text-gray-800">Status Voucher Aktif</p>
              <p className="text-[11px] text-gray-500">Nonaktifkan jika voucher ingin disembunyikan sementara</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition active:scale-95 flex items-center gap-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isEdit ? 'Simpan Perubahan' : 'Buat Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
