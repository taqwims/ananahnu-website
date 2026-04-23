import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, DollarSign, ChevronRight } from 'lucide-react';
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
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-brand-600" />
                    Wilayah &amp; Tarif
                </h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data wilayah dan tarif per daerah</p>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-gray-500">
                <button onClick={() => { setSelectedProvince(null); setSelectedRegency(null); setRegencies([]); setDistricts([]); }}
                    className="hover:text-brand-600 font-medium">Provinsi</button>
                {selectedProvince && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <button onClick={() => { setSelectedRegency(null); setDistricts([]); }}
                            className="hover:text-brand-600 font-medium">{selectedProvince.name}</button>
                    </>
                )}
                {selectedRegency && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-medium text-gray-800">{selectedRegency.name}</span>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Geography List */}
                <div className="glass-panel p-6 space-y-4">
                    {/* Province Level */}
                    {!selectedProvince && (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="font-semibold text-gray-700">Provinsi</h2>
                                <button onClick={() => { setShowAddProvince(true); setNewName(''); }}
                                    className="glass-button text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {showAddProvince && (
                                <div className="flex gap-2">
                                    <input className="glass-input text-sm flex-1" placeholder="Nama Provinsi" value={newName}
                                        onChange={e => setNewName(e.target.value)} />
                                    <button onClick={addProvince} className="glass-button text-xs">Simpan</button>
                                </div>
                            )}
                            <div className="space-y-1">
                                {provinces.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg cursor-pointer group"
                                        onClick={() => selectProvince(p)}>
                                        <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={e => { e.stopPropagation(); deleteProvince(p.id); }}
                                                className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Regency Level */}
                    {selectedProvince && !selectedRegency && (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="font-semibold text-gray-700">Kabupaten/Kota — {selectedProvince.name}</h2>
                                <button onClick={() => { setShowAddRegency(true); setNewName(''); }}
                                    className="glass-button text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {showAddRegency && (
                                <div className="flex gap-2">
                                    <input className="glass-input text-sm flex-1" placeholder="Nama Kabupaten/Kota" value={newName}
                                        onChange={e => setNewName(e.target.value)} />
                                    <button onClick={addRegency} className="glass-button text-xs">Simpan</button>
                                </div>
                            )}
                            <div className="space-y-1">
                                {regencies.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada data</p>}
                                {regencies.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg cursor-pointer group"
                                        onClick={() => selectRegency(r)}>
                                        <span className="text-sm font-medium text-gray-700">{r.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={e => { e.stopPropagation(); deleteRegency(r.id); }}
                                                className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* District Level */}
                    {selectedRegency && (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="font-semibold text-gray-700">Kecamatan — {selectedRegency.name}</h2>
                                <button onClick={() => { setShowAddDistrict(true); setNewName(''); }}
                                    className="glass-button text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                            </div>
                            {showAddDistrict && (
                                <div className="flex gap-2">
                                    <input className="glass-input text-sm flex-1" placeholder="Nama Kecamatan" value={newName}
                                        onChange={e => setNewName(e.target.value)} />
                                    <button onClick={addDistrict} className="glass-button text-xs">Simpan</button>
                                </div>
                            )}
                            <div className="space-y-1">
                                {districts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada data</p>}
                                {districts.map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg group">
                                        <span className="text-sm text-gray-700">{d.name}</span>
                                        <button onClick={() => deleteDistrict(d.id)}
                                            className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Billing Rates */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-brand-500" /> Tarif Billing
                        </h2>
                        {selectedRegency && (
                            <button onClick={() => setShowAddRate(true)}
                                className="glass-button text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah Tarif</button>
                        )}
                    </div>

                    {showAddRate && selectedRegency && (
                        <div className="p-4 bg-white/60 rounded-xl space-y-3">
                            <select className="glass-input text-sm" value={rateForm.service_type}
                                onChange={e => setRateForm(p => ({ ...p, service_type: e.target.value }))}>
                                <option value="REGULER">Reguler</option>
                                <option value="SELF_DECLARE">Self Declare</option>
                            </select>
                            <input type="number" className="glass-input text-sm" placeholder="Jumlah (Rp)" value={rateForm.amount || ''}
                                onChange={e => setRateForm(p => ({ ...p, amount: Number(e.target.value) }))} />
                            <input className="glass-input text-sm" placeholder="Keterangan" value={rateForm.description}
                                onChange={e => setRateForm(p => ({ ...p, description: e.target.value }))} />
                            <div className="flex gap-2">
                                <button onClick={() => setShowAddRate(false)} className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button onClick={addRate} className="glass-button text-xs">Simpan</button>
                            </div>
                        </div>
                    )}

                    {rates.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                            {selectedRegency ? 'Belum ada tarif untuk kabupaten ini' : 'Pilih kabupaten untuk menambahkan tarif'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {rates.map(rate => (
                                <div key={rate.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg group">
                                    <div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            rate.service_type === 'REGULER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                        }`}>{rate.service_type}</span>
                                        <span className="ml-2 text-sm text-gray-500">{rate.regency?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-gray-800">{formatCurrency(rate.amount)}</span>
                                        <button onClick={() => deleteRate(rate.id)}
                                            className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
