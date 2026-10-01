import { useState, useEffect, useMemo } from 'react';
import { Phone, Mail, Shield, Loader2, MapPin, Search, ChevronLeft, ChevronRight, MessageSquare, RefreshCw, UserCheck } from 'lucide-react';
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

type PageLimit = 10 | 40 | 80 | 100 | 'ALL';

export default function AdvisorsGeo() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedRegency, setSelectedRegency] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageLimit, setPageLimit] = useState<PageLimit>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
    setCurrentPage(1);
  }, [selectedProvince]);

  // Load advisors based on geographic filters
  const fetchAdvisors = () => {
    setLoading(true);
    let url = '/admin/users/consultants';
    const params: string[] = [];
    if (selectedProvince) params.push(`province_id=${selectedProvince}`);
    if (selectedRegency) params.push(`regency_id=${selectedRegency}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    api.get(url)
      .then(res => {
        setAdvisors(res.data || []);
        setCurrentPage(1);
      })
      .catch(() => toast.error('Gagal memuat data Halal Advisor'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdvisors();
  }, [selectedProvince, selectedRegency]);

  // Filter advisors based on search query
  const filteredAdvisors = useMemo(() => {
    if (!searchQuery.trim()) return advisors;
    const query = searchQuery.toLowerCase().trim();
    return advisors.filter(adv => {
      const nameMatch = adv.full_name?.toLowerCase().includes(query);
      const emailMatch = adv.email?.toLowerCase().includes(query);
      const phoneMatch = adv.phone?.toLowerCase().includes(query);
      const provMatch = adv.province?.name?.toLowerCase().includes(query);
      const regMatch = adv.regency?.name?.toLowerCase().includes(query);
      const roleMatch = adv.role?.name?.toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch || provMatch || regMatch || roleMatch;
    });
  }, [advisors, searchQuery]);

  // Pagination calculation
  const totalItems = filteredAdvisors.length;
  const totalPages = pageLimit === 'ALL' ? 1 : Math.ceil(totalItems / pageLimit) || 1;

  const paginatedAdvisors = useMemo(() => {
    if (pageLimit === 'ALL') return filteredAdvisors;
    const startIndex = (currentPage - 1) * pageLimit;
    return filteredAdvisors.slice(startIndex, startIndex + pageLimit);
  }, [filteredAdvisors, currentPage, pageLimit]);

  // Format WhatsApp Link
  const getWhatsAppUrl = (phone?: string, name?: string) => {
    if (!phone) return '#';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    const message = encodeURIComponent(`Halo ${name || 'Halal Advisor'}, saya ingin berkoordinasi mengenai pendampingan sertifikasi halal melalui HalalCore.`);
    return `https://wa.me/${clean}?text=${message}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HA';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-3 sm:space-y-5 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl text-white shadow-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="p-1 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-400/30">
              <UserCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-indigo-300 uppercase tracking-wider">Direktori Tenaga Ahli</span>
          </div>
          <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-white truncate">
            Daftar Halal Advisor & Pendamping Wilayah
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-2xl font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">
            Temukan dan hubungi Halal Advisor aktif berdasarkan sebaran wilayah atau nama.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAdvisors}
            disabled={loading}
            className="w-full sm:w-auto px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Panel */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-2">
            <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pencarian Advisor</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, email, no. telepon, kota..."
                className="w-full pl-8.5 pr-3 py-1.5 sm:py-2 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Filter Provinsi */}
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Provinsi</label>
            <select
              className="w-full px-2.5 py-1.5 sm:py-2 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs font-medium text-gray-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
            >
              <option value="">Semua Provinsi</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Kabupaten / Kota */}
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Kabupaten / Kota</label>
            <select
              className="w-full px-2.5 py-1.5 sm:py-2 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs font-medium text-gray-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all disabled:opacity-50 cursor-pointer"
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

        {/* Page Limit Selector & Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 mr-1">Limit:</span>
            {([10, 40, 80, 100, 'ALL'] as PageLimit[]).map((limit) => (
              <button
                key={String(limit)}
                onClick={() => {
                  setPageLimit(limit);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-bold text-[11px] sm:text-xs transition-all cursor-pointer ${
                  pageLimit === limit
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {limit === 'ALL' ? 'Semua' : limit}
              </button>
            ))}
          </div>

          <div className="text-gray-500 font-medium text-[10px] sm:text-[11px]">
            Data <strong className="text-gray-900">{totalItems === 0 ? 0 : (pageLimit === 'ALL' ? 1 : (currentPage - 1) * pageLimit + 1)}</strong> - <strong className="text-gray-900">{pageLimit === 'ALL' ? totalItems : Math.min(currentPage * pageLimit, totalItems)}</strong> dari <strong className="text-gray-900">{totalItems}</strong>
          </div>
        </div>
      </div>

      {/* Advisors List */}
      {loading ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 text-center space-y-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Memuat data Halal Advisor...</p>
        </div>
      ) : paginatedAdvisors.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-1.5">
          <Shield className="w-8 h-8 text-gray-300 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-gray-700">Tidak ada Halal Advisor ditemukan</h3>
          <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
            {searchQuery || selectedProvince || selectedRegency
              ? 'Tidak ada data yang cocok dengan pencarian atau filter wilayah.'
              : 'Belum ada data penasihat halal yang terdaftar di sistem.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedAdvisors.map((c, idx) => {
            const waLink = getWhatsAppUrl(c.phone, c.full_name);
            const locationParts: string[] = [];
            if (c.regency?.name) locationParts.push(c.regency.name.replace('KABUPATEN ', 'Kab. ').replace('KOTA ', 'Kota '));
            if (c.province?.name) locationParts.push(c.province.name);
            const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Nasional / Seluruh Wilayah';
            const itemNumber = pageLimit === 'ALL' ? idx + 1 : (currentPage - 1) * pageLimit + idx + 1;

            return (
              <div
                key={c.id}
                className="bg-white hover:bg-slate-50/70 p-2.5 sm:p-3.5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5"
              >
                {/* Advisor Details */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span className="text-[11px] font-mono font-bold text-gray-400 w-5 shrink-0 text-center hidden sm:block">
                    #{itemNumber}
                  </span>
                  
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {getInitials(c.full_name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {c.full_name}
                      </h3>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Shield className="w-2.5 h-2.5" />
                        {c.role?.name || 'Halal Advisor'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-0.5 gap-x-3 text-[11px] sm:text-xs text-gray-500 mt-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-[280px] font-medium text-gray-600">{locationStr}</span>
                      </div>

                      {c.phone && (
                        <span className="font-mono text-gray-600 font-medium">
                          {c.phone}
                        </span>
                      )}

                      {c.email && (
                        <span className="text-gray-500 font-medium truncate max-w-[160px] sm:max-w-[200px] hidden md:inline">
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons (WhatsApp & Email) */}
                <div className="flex items-center gap-1.5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {/* WhatsApp Button */}
                  {c.phone ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl shadow-2xs transition-all"
                      title={`Hubungi ${c.full_name} via WhatsApp (${c.phone})`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-400 font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl cursor-not-allowed opacity-60"
                      title="Nomor telepon tidak tersedia"
                    >
                      <Phone className="w-3 h-3" />
                      <span>No WA</span>
                    </button>
                  )}

                  {/* Email Button */}
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}?subject=${encodeURIComponent('Koordinasi Halal Advisor - HalalCore')}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl transition-all"
                      title={`Kirim Email ke ${c.email}`}
                    >
                      <Mail className="w-3 h-3 text-indigo-600" />
                      <span>Email</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-400 font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl cursor-not-allowed opacity-60"
                      title="Email tidak tersedia"
                    >
                      <Mail className="w-3 h-3" />
                      <span>No Email</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && pageLimit !== 'ALL' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500">
            Halaman <strong className="text-gray-900">{currentPage}</strong> dari <strong className="text-gray-900">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page number indicators */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;

                  return (
                    <span key={page} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-gray-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
