import React, { useState } from 'react';
import { X, Sparkles, Wand2, Copy, Check, DollarSign, Percent } from 'lucide-react';
import type { VoucherGenerateRequest, DiscountType, VoucherScope } from '../../../types/voucher';
import { voucherService } from '../../../services/voucherService';
import toast from 'react-hot-toast';

interface VoucherGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VoucherGeneratorModal: React.FC<VoucherGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [prefix, setPrefix] = useState('PROMO');
  const [suffix, setSuffix] = useState('');
  const [length, setLength] = useState(6);
  const [count, setCount] = useState(10);
  const [name, setName] = useState('Kampanye Diskon Otomatis');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('FIXED_AMOUNT');
  const [discountValue, setDiscountValue] = useState<number>(50000);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [minSpend, setMinSpend] = useState<number>(100000);
  const [usageLimit, setUsageLimit] = useState<number>(1);
  const [usagePerUser, setUsagePerUser] = useState<number>(1);
  const [scope, setScope] = useState<VoucherScope>('ALL');
  
  const today = new Date().toISOString().substring(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const [validFrom, setValidFrom] = useState(today);
  const [validUntil, setValidUntil] = useState(nextMonth);
  
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Sample code preview
  const sampleCode = `${prefix ? prefix.toUpperCase() : ''}${'X'.repeat(length)}${suffix ? suffix.toUpperCase() : ''}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama kampanye wajib diisi');
      return;
    }
    if (count <= 0 || count > 500) {
      toast.error('Jumlah voucher antara 1 sampai 500');
      return;
    }
    if (length < 4 || length > 12) {
      toast.error('Panjang kode acak antara 4 sampai 12 karakter');
      return;
    }

    try {
      setLoading(true);
      const req: VoucherGenerateRequest = {
        prefix: prefix.trim().toUpperCase(),
        suffix: suffix.trim().toUpperCase(),
        length: Number(length),
        count: Number(count),
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
      };

      const res = await voucherService.generate(req);
      const codes = res.data.map((v) => v.code);
      setGeneratedCodes(codes);
      toast.success(`Berhasil membuat ${res.count} kode voucher!`);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Gagal generate kode voucher';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (generatedCodes.length === 0) return;
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopied(true);
    toast.success('Daftar kode berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Wand2 className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Generate Kode Voucher Otomatis</h2>
              <p className="text-xs text-amber-100/90 font-medium">
                Buat puluhan hingga ratusan kode kupon unik secara masal
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

        {/* Modal Content */}
        {generatedCodes.length > 0 ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-black text-lg">
                ✓
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                {generatedCodes.length} Voucher Berhasil Dibuat!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Kode voucher telah tersimpan di database dan siap digunakan oleh klien.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Daftar Kode yang Dihasilkan
                </label>
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Salin Semua Kode'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto p-3 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs space-y-1.5 custom-scrollbar">
                {generatedCodes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-2xs">
                    <span className="font-bold text-gray-800">{c}</span>
                    <span className="text-[10px] text-gray-400">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setGeneratedCodes([])}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Generate Lagi
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Pattern & Preview */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Format Pola Kode
                </span>
                <span className="text-[11px] font-medium text-amber-700">
                  Preview: <code className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">{sampleCode}</code>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Prefix (Awalan)</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="PROMO"
                    className="w-full uppercase font-mono text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Panjang Karakter Acak</label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Suffix (Akhiran)</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value.toUpperCase())}
                    placeholder="2026"
                    className="w-full uppercase font-mono text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Jumlah Kode yang Dihasilkan (Batch Size)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full text-sm font-bold px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Sistem akan membuat {count} kode kupon unik sekaligus dan otomatis menghindari duplikasi.
                </p>
              </div>
            </div>

            {/* Campaign Name & Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nama Kampanye <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Voucher Roadshow Halal 2026"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Target Layanan
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as VoucherScope)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="ALL">Semua Layanan</option>
                  <option value="REGULER">Khusus Reguler</option>
                  <option value="SELF_DECLARE">Khusus Self Declare</option>
                  <option value="TRAINING">Khusus Pelatihan</option>
                  <option value="TELEMARKETING">Khusus Telemarketing</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Catatan kampanye voucher..."
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Discount Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Tipe Diskon</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED_AMOUNT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      discountType === 'FIXED_AMOUNT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Nominal (Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Persentase (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {discountType === 'PERCENTAGE' ? 'Diskon (%)' : 'Diskon (Rp)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="50000"
                  className="w-full text-sm font-bold px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Min spend & max discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discountType === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Min. Transaksi (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={minSpend || ''}
                  onChange={(e) => setMinSpend(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Quota & User Limit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Kuota Per Voucher</label>
                <input
                  type="number"
                  min="0"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Batas Per User</label>
                <input
                  type="number"
                  min="1"
                  value={usagePerUser}
                  onChange={(e) => setUsagePerUser(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Mulai Berlaku
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Berlaku Hingga
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Actions */}
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
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition active:scale-95 flex items-center gap-2"
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <Sparkles className="w-3.5 h-3.5" />
                Generate Sekarang ({count} Kode)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
