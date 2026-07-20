import { useState, useEffect } from 'react';
import { Phone, Mail, Shield, Loader2, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Province {
  id: number;
  name: string;
}

interface Regency {
  id: number;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  province_id?: number;
  province?: { id: number; name: string };
  regency_id?: number;
  regency?: { id: number; name: string };
  address?: string;
  role?: { id: number; name: string };
}

export default function AdvisorsGeo() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedRegency, setSelectedRegency] = useState<string>('');
  
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Load provinces
  useEffect(() => {
    api.get('/geography/provinces')
      .then(res => setProvinces(res.data || []))
      .catch(() => toast.error('Gagal memuat data provinsi'));
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    if (selectedProvince) {
      api.get(`/geography/regencies/${selectedProvince}`)
        .then(res => setRegencies(res.data || []))
        .catch(() => toast.error('Gagal memuat data kabupaten/kota'));
    } else {
      setRegencies([]);
    }
    setSelectedRegency('');
  }, [selectedProvince]);

  // Load advisors based on geographic filters
  useEffect(() => {
    setLoading(true);
    let url = '/admin/users/consultants';
    const params: string[] = [];
    if (selectedProvince) params.push(`province_id=${selectedProvince}`);
    if (selectedRegency) params.push(`regency_id=${selectedRegency}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    api.get(url)
      .then(res => setAdvisors(res.data || []))
      .catch(() => toast.error('Gagal memuat data Halal Advisor'))
      .finally(() => setLoading(false));
  }, [selectedProvince, selectedRegency]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-brand-850 to-brand-950 bg-clip-text text-transparent">
            Daftar Halal Advisor & Pendamping Wilayah
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Lihat dan saring data penasihat halal aktif berdasarkan wilayah geografis / provinsi dan kota.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Provinsi Wilayah</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
            value={selectedProvince}
            onChange={e => setSelectedProvince(e.target.value)}
          >
            <option value="">Semua Provinsi</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Kabupaten / Kota</label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/10 transition-all disabled:opacity-50"
            value={selectedRegency}
            onChange={e => setSelectedRegency(e.target.value)}
            disabled={!selectedProvince}
          >
            <option value="">Semua Kabupaten / Kota</option>
            {regencies.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Memuat data advisor...</span>
        </div>
      ) : advisors.length === 0 ? (
        <div className="bg-gray-50/50 border border-gray-200 border-dashed rounded-3xl p-12 text-center text-gray-400 italic font-semibold">
          Tidak ada Halal Advisor terdaftar di wilayah yang dipilih.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Wilayah</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kontak</th>
                </tr>
              </thead>
              <tbody>
                {advisors.map(c => {
                  const waLink = c.phone ? `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}` : '';
                  const locationParts: string[] = [];
                  if (c.regency?.name) locationParts.push(c.regency.name.replace('KABUPATEN ', 'KAB. '));
                  if (c.province?.name) locationParts.push(c.province.name);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm text-gray-900">{c.full_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-100">
                          <Shield className="w-3 h-3" /> {c.role?.name || 'Advisor'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {locationParts.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-500" />
                            <span className="truncate max-w-[200px]">{locationParts.join(', ')}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Nasional</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${c.email}`} className="text-xs text-gray-600 hover:text-brand-600 transition-colors font-medium truncate">
                          {c.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.phone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all border border-emerald-100"
                            >
                              <Phone className="w-3 h-3" /> WA
                            </a>
                          )}
                          <a
                            href={`mailto:${c.email}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all border border-gray-200"
                          >
                            <Mail className="w-3 h-3" /> Email
                          </a>
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
    </div>
  );
}
