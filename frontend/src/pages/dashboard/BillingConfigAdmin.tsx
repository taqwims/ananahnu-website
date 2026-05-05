import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import api from '../../services/api';

type ProductCategory = { id: number; name: string; description: string };
type BusinessScale = { id: number; name: string; description: string };
type HalalAgency = { id: number; name: string; address: string };
type BillingComponent = { id: number; name: string; type: string; base_amount: number };

export default function BillingConfigAdmin() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'scales' | 'agencies' | 'components'>('products');

    const [products, setProducts] = useState<ProductCategory[]>([]);
    const [scales, setScales] = useState<BusinessScale[]>([]);
    const [agencies, setAgencies] = useState<HalalAgency[]>([]);
    const [components, setComponents] = useState<BillingComponent[]>([]);

    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemType, setNewItemType] = useState('FIXED');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, sRes, aRes, cRes] = await Promise.all([
                api.get('/billing-config/product-categories'),
                api.get('/billing-config/business-scales'),
                api.get('/billing-config/halal-agencies'),
                api.get('/billing-config/components')
            ]);
            setProducts(pRes.data || []);
            setScales(sRes.data || []);
            setAgencies(aRes.data || []);
            setComponents(cRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (!newItemName) return;
        try {
            if (activeTab === 'products') {
                await api.post('/billing-config/product-categories', { name: newItemName, description: newItemDesc });
            } else if (activeTab === 'scales') {
                await api.post('/billing-config/business-scales', { name: newItemName, description: newItemDesc });
            } else if (activeTab === 'agencies') {
                await api.post('/billing-config/halal-agencies', { name: newItemName, address: newItemDesc });
            } else if (activeTab === 'components') {
                await api.post('/billing-config/components', { 
                    name: newItemName, 
                    type: newItemType, 
                    base_amount: parseFloat(newItemAmount) || 0 
                });
            }
            setNewItemName('');
            setNewItemDesc('');
            setNewItemAmount('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Gagal menambahkan data");
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Master Biaya & Klasifikasi</h1>
                <p className="text-gray-500 text-sm">Atur jenis produk, skala usaha, LPH, dan komponen biaya secara dinamis</p>
            </div>

            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => setActiveTab('products')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'products' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>Jenis Produk</button>
                <button onClick={() => setActiveTab('scales')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'scales' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>Skala Usaha</button>
                <button onClick={() => setActiveTab('agencies')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'agencies' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>LPH</button>
                <button onClick={() => setActiveTab('components')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'components' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>Komponen Biaya</button>
            </div>

            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Tambah {activeTab === 'products' ? 'Jenis Produk' : activeTab === 'scales' ? 'Skala Usaha' : activeTab === 'agencies' ? 'LPH' : 'Komponen Biaya'} Baru
                </h3>
                <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-3">
                        <input
                            type="text"
                            placeholder="Nama..."
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="glass-input w-full"
                        />
                        {activeTab !== 'components' && (
                            <input
                                type="text"
                                placeholder={activeTab === 'agencies' ? "Alamat..." : "Deskripsi..."}
                                value={newItemDesc}
                                onChange={(e) => setNewItemDesc(e.target.value)}
                                className="glass-input w-full"
                            />
                        )}
                        {activeTab === 'components' && (
                            <div className="flex gap-3">
                                <select className="glass-input w-1/3" value={newItemType} onChange={(e) => setNewItemType(e.target.value)}>
                                    <option value="FIXED">Tetap (Fixed)</option>
                                    <option value="PER_MANDAY">Per Manday</option>
                                    <option value="PER_CABANG">Per Cabang/Pabrik</option>
                                    <option value="PER_PRODUK">Per Produk</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Nominal (Rp)"
                                    value={newItemAmount}
                                    onChange={(e) => setNewItemAmount(e.target.value)}
                                    className="glass-input w-2/3"
                                />
                            </div>
                        )}
                    </div>
                    <button onClick={handleCreate} disabled={!newItemName} className="glass-button bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Tambah
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-gray-700 font-semibold">Nama</th>
                            <th className="px-6 py-3 text-gray-700 font-semibold">
                                {activeTab === 'components' ? 'Tipe & Nominal' : 'Detail'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {activeTab === 'products' && products.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 font-medium">{p.name}</td>
                                <td className="px-6 py-4 text-gray-500">{p.description || '-'}</td>
                            </tr>
                        ))}
                        {activeTab === 'scales' && scales.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 font-medium">{s.name}</td>
                                <td className="px-6 py-4 text-gray-500">{s.description || '-'}</td>
                            </tr>
                        ))}
                        {activeTab === 'agencies' && agencies.map(a => (
                            <tr key={a.id}>
                                <td className="px-6 py-4 font-medium">{a.name}</td>
                                <td className="px-6 py-4 text-gray-500">{a.address || '-'}</td>
                            </tr>
                        ))}
                        {activeTab === 'components' && components.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 font-medium">{c.name}</td>
                                <td className="px-6 py-4 text-gray-500 flex gap-2 items-center">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{c.type}</span>
                                    <span>Rp {c.base_amount.toLocaleString('id-ID')}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
