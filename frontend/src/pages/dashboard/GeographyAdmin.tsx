import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, DollarSign, ChevronRight, ArrowLeft, Building2, Map, Navigation } from 'lucide-react';
import api from '../../services/api';
import type { Province, Regency, District, BillingRate } from '../../types';

export default function GeographyAdmin() {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [regencies, setRegencies] = useState<Regency[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [rates, setRates] = useState<BillingRate[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
    const [showAddProvince, setShowAddProvince] = useState(false);
    const [showAddRegency, setShowAddRegency] = useState(false);
    const [showAddDistrict, setShowAddDistrict] = useState(false);
    const [showAddRate, setShowAddRate] = useState(false);
    const [newName, setNewName] = useState('');
    const [rateForm, setRateForm] = useState({ service_type: 'REGULER', amount: 0, description: '' });

    const loadProvinces = () => {
        api.get('/geography/provinces').then(r => setProvinces(r.data || [])).catch(() => {});
    };

    useEffect(() => { loadProvinces(); }, []);

    const loadRegencies = (provId: number) => {
        api.get(`/geography/regencies/${provId}`).then(r => setRegencies(r.data || [])).catch(() => {});
    };

    const loadDistricts = (regId: number) => {
        api.get(`/geography/districts/${regId}`).then(r => setDistricts(r.data || [])).catch(() => {});
    };

    const loadRates = (serviceType?: string) => {
        const params = serviceType ? `?service_type=${serviceType}` : '';
        api.get(`/billing-rates/${params}`).then(r => setRates(r.data || [])).catch(() => {});
    };

    const selectProvince = (p: Province) => {
        setSelectedProvince(p);
        setSelectedRegency(null);
        setDistricts([]);
        loadRegencies(p.id);
    };

    const selectRegency = (r: Regency) => {
        setSelectedRegency(r);
        loadDistricts(r.id);
    };

    const addProvince = async () => {
        if (!newName) return;
        await api.post('/geography/provinces', { name: newName });
        setNewName(''); setShowAddProvince(false);
        loadProvinces();
    };

    const addRegency = async () => {
        if (!newName || !selectedProvince) return;
        await api.post('/geography/regencies', { province_id: selectedProvince.id, name: newName });
        setNewName(''); setShowAddRegency(false);
        loadRegencies(selectedProvince.id);
    };

    const addDistrict = async () => {
        if (!newName || !selectedRegency) return;
        await api.post('/geography/districts', { regency_id: selectedRegency.id, name: newName });
        setNewName(''); setShowAddDistrict(false);
        loadDistricts(selectedRegency.id);
    };

    const deleteProvince = async (id: number) => {
        if (!confirm('Hapus provinsi?')) return;
        await api.delete(`/geography/provinces/${id}`);
        if (selectedProvince?.id === id) { setSelectedProvince(null); setRegencies([]); }
        loadProvinces();
    };

    const deleteRegency = async (id: number) => {
        if (!confirm('Hapus kabupaten?')) return;
        await api.delete(`/geography/regencies/${id}`);
        if (selectedRegency?.id === id) { setSelectedRegency(null); setDistricts([]); }
        if (selectedProvince) loadRegencies(selectedProvince.id);
    };

    const deleteDistrict = async (id: number) => {
        if (!confirm('Hapus kecamatan?')) return;
        await api.delete(`/geography/districts/${id}`);
        if (selectedRegency) loadDistricts(selectedRegency.id);
    };

    const addRate = async () => {
        if (!selectedRegency) return;
        await api.post('/billing-rates/', {
            ...rateForm,
            regency_id: selectedRegency.id,
        });
        setShowAddRate(false);
        loadRates();
    };

    const deleteRate = async (id: number) => {
        if (!confirm('Hapus tarif?')) return;
        await api.delete(`/billing-rates/${id}`);
        loadRates();
    };

    useEffect(() => { loadRates(); }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl">
                            <MapPin className="w-6 h-6 text-brand-600" />
                        </div>
                        Master Wilayah &amp; Tarif
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Kelola data wilayah hierarkis dan tarif khusus per daerah</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Geography Navigation */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                        {/* Interactive Breadcrumb Header */}
                        <div className="bg-gray-50/50 border-b border-gray-100 p-4">
                            <div className="flex items-center gap-2 text-sm">
                                <button 
                                    onClick={() => { setSelectedProvince(null); setSelectedRegency(null); setRegencies([]); setDistricts([]); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${!selectedProvince ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    <Map className="w-4 h-4" />
                                    Provinsi
                                </button>
                                
                                {selectedProvince && (
                                    <>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                        <button 
                                            onClick={() => { setSelectedRegency(null); setDistricts([]); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${!selectedRegency ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <Building2 className="w-4 h-4" />
                                            {selectedProvince.name}
                                        </button>
                                    </>
                                )}
                                
                                {selectedRegency && (
                                    <>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold">
                                            <Navigation className="w-4 h-4" />
                                            {selectedRegency.name}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                            {/* Province Level */}
                            {!selectedProvince && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Daftar Provinsi</h2>
                                        <button onClick={() => { setShowAddProvince(true); setNewName(''); }}
                                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
                                            <Plus className="w-3.5 h-3.5" /> Tambah Provinsi
                                        </button>
                                    </div>
                                    
                                    {showAddProvince && (
                                        <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-brand-100 shadow-sm animate-in zoom-in-95">
                                            <input className="flex-1 bg-transparent text-sm outline-none px-2" autoFocus placeholder="Masukkan nama provinsi baru..." value={newName}
                                                onChange={e => setNewName(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && addProvince()} />
                                            <button onClick={() => setShowAddProvince(false)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                            <button onClick={addProvince} className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition-colors">Simpan</button>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 gap-2">
                                        {provinces.length === 0 && !showAddProvince && (
                                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                                <Map className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Belum ada data provinsi.</p>
                                            </div>
                                        )}
                                        {provinces.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-white hover:bg-brand-50/50 border border-gray-100 hover:border-brand-200 rounded-xl cursor-pointer group transition-all shadow-sm hover:shadow"
                                                onClick={() => selectProvince(p)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                                                        <Map className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                                                    </div>
                                                    <span className="font-semibold text-gray-700 group-hover:text-brand-700 transition-colors">{p.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={e => { e.stopPropagation(); deleteProvince(p.id); }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Regency Level */}
                            {selectedProvince && !selectedRegency && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Kabupaten/Kota</h2>
                                        <button onClick={() => { setShowAddRegency(true); setNewName(''); }}
                                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
                                            <Plus className="w-3.5 h-3.5" /> Tambah Kabupaten
                                        </button>
                                    </div>

                                    {showAddRegency && (
                                        <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-brand-100 shadow-sm animate-in zoom-in-95">
                                            <input className="flex-1 bg-transparent text-sm outline-none px-2" autoFocus placeholder="Masukkan nama kabupaten/kota baru..." value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addRegency()} />
                                            <button onClick={() => setShowAddRegency(false)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                            <button onClick={addRegency} className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition-colors">Simpan</button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-2">
                                        {regencies.length === 0 && !showAddRegency && (
                                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Belum ada data kabupaten di provinsi ini.</p>
                                            </div>
                                        )}
                                        {regencies.map(r => (
                                            <div key={r.id} className="flex items-center justify-between p-4 bg-white hover:bg-brand-50/50 border border-gray-100 hover:border-brand-200 rounded-xl cursor-pointer group transition-all shadow-sm hover:shadow"
                                                onClick={() => selectRegency(r)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                                                        <Building2 className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                                                    </div>
                                                    <span className="font-semibold text-gray-700 group-hover:text-brand-700 transition-colors">{r.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={e => { e.stopPropagation(); deleteRegency(r.id); }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* District Level */}
                            {selectedRegency && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Kecamatan</h2>
                                        <button onClick={() => { setShowAddDistrict(true); setNewName(''); }}
                                            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
                                            <Plus className="w-3.5 h-3.5" /> Tambah Kecamatan
                                        </button>
                                    </div>

                                    {showAddDistrict && (
                                        <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-brand-100 shadow-sm animate-in zoom-in-95">
                                            <input className="flex-1 bg-transparent text-sm outline-none px-2" autoFocus placeholder="Masukkan nama kecamatan baru..." value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addDistrict()} />
                                            <button onClick={() => setShowAddDistrict(false)} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                            <button onClick={addDistrict} className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition-colors">Simpan</button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-2">
                                        {districts.length === 0 && !showAddDistrict && (
                                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                                <Navigation className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Belum ada data kecamatan.</p>
                                            </div>
                                        )}
                                        {districts.map(d => (
                                            <div key={d.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl group hover:border-gray-200 transition-colors shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                        <Navigation className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <span className="font-medium text-gray-700">{d.name}</span>
                                                </div>
                                                <button onClick={() => deleteDistrict(d.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Billing Rates */}
                <div className="lg:col-span-5">
                    <div className="bg-gradient-to-b from-brand-50 to-white p-6 rounded-2xl shadow-sm border border-brand-100 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <div className="bg-white p-1.5 rounded-lg shadow-sm text-brand-600">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    Tarif Khusus Daerah
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Tarif penyesuaian untuk kabupaten/kota tertentu</p>
                            </div>
                            {selectedRegency && (
                                <button onClick={() => setShowAddRate(true)}
                                    className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200" title="Tambah Tarif">
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {showAddRate && selectedRegency && (
                            <div className="mb-6 p-5 bg-white rounded-2xl border border-brand-200 shadow-lg shadow-brand-100/50 space-y-4 animate-in slide-in-from-top-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Tipe Layanan</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={rateForm.service_type}
                                        onChange={e => setRateForm(p => ({ ...p, service_type: e.target.value }))}>
                                        <option value="REGULER">Reguler</option>
                                        <option value="SELF_DECLARE">Self Declare Fasilitasi (Gratis)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Jumlah Tarif (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                                        <input type="number" className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-semibold" placeholder="0" value={rateForm.amount || ''}
                                            onChange={e => setRateForm(p => ({ ...p, amount: Number(e.target.value) }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Keterangan (Opsional)</label>
                                    <input className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" placeholder="Misal: Penyesuaian ongkos transport" value={rateForm.description}
                                        onChange={e => setRateForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowAddRate(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                                    <button onClick={addRate} className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-200 transition-colors">Simpan Tarif</button>
                                </div>
                            </div>
                        )}

                        {!selectedRegency && rates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white/60 rounded-2xl border border-dashed border-gray-200">
                                <DollarSign className="w-12 h-12 text-brand-200 mb-3" />
                                <h3 className="font-semibold text-gray-700">Pilih Kabupaten</h3>
                                <p className="text-sm text-gray-500 mt-1">Pilih kabupaten/kota di daftar sebelah kiri untuk melihat atau menambahkan tarif khusus daerah.</p>
                            </div>
                        ) : rates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white/60 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500">Belum ada tarif khusus untuk {selectedRegency?.name}.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rates.map(rate => (
                                    <div key={rate.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        rate.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>{rate.service_type}</span>
                                                </div>
                                                <div className="font-semibold text-gray-800 text-sm mb-0.5">{rate.regency?.name}</div>
                                                {rate.description && <div className="text-xs text-gray-500">{rate.description}</div>}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="font-black text-brand-700 bg-brand-50 px-3 py-1 rounded-lg text-sm">{formatCurrency(rate.amount)}</span>
                                                <button onClick={() => deleteRate(rate.id)}
                                                    className="text-xs font-semibold text-gray-400 hover:text-red-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
