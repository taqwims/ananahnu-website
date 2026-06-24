import React, { useState, useEffect } from 'react';
import { calculateReguler } from '../../services/teleService';
import { Calculator, Loader2, Info } from 'lucide-react';

export default function EstimasiReguler() {
  const [formData, setFormData] = useState({
    business_type_id: '',
    business_scale_id: '',
    province_id: '',
    regency_id: '',
    product_count: 0,
    branch_count: 0,
    sales_scheme_id: '',
    data_source: 'ORGANIK',
  });

  const [estimation, setEstimation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example data (you would fetch this from your APIs)
  const businessTypes = [{ id: 1, name: 'Makanan & Minuman' }, { id: 2, name: 'Obat & Kosmetik' }];
  const businessScales = [{ id: 1, name: 'Mikro' }, { id: 2, name: 'Kecil' }, { id: 3, name: 'Menengah' }, { id: 4, name: 'Besar' }];
  const provinces = [{ id: 11, name: 'Aceh' }, { id: 32, name: 'Jawa Barat' }];
  const salesSchemes = [{ id: 1, name: 'Direct Sale' }, { id: 2, name: 'Partnership' }];

  useEffect(() => {
    const handler = setTimeout(() => {
      // Basic validation
      if (formData.business_type_id && formData.business_scale_id && formData.province_id && formData.sales_scheme_id) {
        fetchEstimation();
      } else {
        setEstimation(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [formData]);

  const fetchEstimation = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        business_type_id: Number(formData.business_type_id),
        business_scale_id: Number(formData.business_scale_id),
        province_id: Number(formData.province_id),
        regency_id: formData.regency_id ? Number(formData.regency_id) : undefined,
        product_count: Number(formData.product_count),
        branch_count: Number(formData.branch_count),
        sales_scheme_id: Number(formData.sales_scheme_id),
        data_source: formData.data_source,
      };
      const res = await calculateReguler(payload);
      setEstimation(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menghitung estimasi");
      setEstimation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="text-brand-600 w-6 h-6" />
          Kalkulator Estimasi Reguler
        </h1>
        <p className="text-gray-500 mt-1">Gunakan form di bawah untuk menghitung estimasi biaya sertifikasi halal secara otomatis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Client</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skema Penjualan *</label>
              <select name="sales_scheme_id" value={formData.sales_scheme_id} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border">
                <option value="">Pilih Skema</option>
                {salesSchemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Usaha *</label>
                <select name="business_type_id" value={formData.business_type_id} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border">
                  <option value="">Pilih Jenis</option>
                  {businessTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skala Usaha *</label>
                <select name="business_scale_id" value={formData.business_scale_id} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border">
                  <option value="">Pilih Skala</option>
                  {businessScales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi *</label>
              <select name="province_id" value={formData.province_id} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border">
                <option value="">Pilih Provinsi</option>
                {provinces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Cabang</label>
                <input type="number" min="0" name="branch_count" value={formData.branch_count} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Produk</label>
                <input type="number" min="0" name="product_count" value={formData.product_count} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Data</label>
              <select name="data_source" value={formData.data_source} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 border">
                <option value="ORGANIK">Organik</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Detail Perhitungan</h2>
          
          <div className="flex-1">
            {loading && !estimation && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                <Loader2 className="animate-spin text-brand-600 w-8 h-8 mb-2" />
                <p>Menghitung estimasi...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 text-red-700 border border-red-100">
                <Info className="mt-0.5 flex-shrink-0 w-5 h-5 text-red-500" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && !estimation && !error && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                <Calculator className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm text-center max-w-[250px]">Lengkapi formulir di sebelah kiri untuk melihat estimasi otomatis.</p>
              </div>
            )}

            {estimation && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Komponen Biaya</h3>
                  <div className="space-y-2">
                    {estimation.breakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                        <span className="text-gray-700">{item.name} <span className="text-xs text-gray-400">({item.category})</span></span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">Total Estimasi</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(estimation.total_amount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 my-3"></div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Skema Pembayaran</span>
                      <span className="font-medium text-gray-800">{estimation.dp_percent}% / {estimation.final_percent}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">DP ({estimation.dp_percent}%)</span>
                      <span className="font-medium text-green-600">{formatCurrency(estimation.dp_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pelunasan ({estimation.final_percent}%)</span>
                      <span className="font-medium text-blue-600">{formatCurrency(estimation.final_amount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <Info className="mt-0.5 flex-shrink-0 w-4 h-4" />
                  <p>Estimasi ini dapat disimpan ke informasi client. Jika client melanjutkan, tagihan DP sebesar {formatCurrency(estimation.dp_amount)} akan digenerate otomatis.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
