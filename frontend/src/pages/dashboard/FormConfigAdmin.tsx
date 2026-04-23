import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react';
import api from '../../services/api';
import type { FormFieldConfig } from '../../types';

const FORM_TYPES = ['SELF_DECLARE', 'REGULER', 'RECRUITMENT'] as const;
const INPUT_TYPES = ['FILE_UPLOAD', 'LINK', 'TEXT'] as const;

export default function FormConfigAdmin() {
    const [activeTab, setActiveTab] = useState<string>('SELF_DECLARE');
    const [fields, setFields] = useState<FormFieldConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newField, setNewField] = useState({
        field_key: '', field_label: '', input_type: 'TEXT' as string,
        is_required: false, sort_order: 0, description: ''
    });

    const loadFields = async (formType: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/form-config/${formType}`);
            setFields(res.data || []);
        } catch { setFields([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadFields(activeTab); }, [activeTab]);

    const handleAdd = async () => {
        setSaving(true);
        try {
            await api.post('/form-config/', {
                ...newField,
                form_type: activeTab,
                sort_order: fields.length + 1,
            });
            setShowAdd(false);
            setNewField({ field_key: '', field_label: '', input_type: 'TEXT', is_required: false, sort_order: 0, description: '' });
            loadFields(activeTab);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menambahkan field');
        } finally { setSaving(false); }
    };

    const handleUpdate = async (field: FormFieldConfig) => {
        try {
            await api.put(`/form-config/${field.id}`, field);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal memperbarui field');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus field ini?')) return;
        try {
            await api.delete(`/form-config/${id}`);
            loadFields(activeTab);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Gagal menghapus field');
        }
    };

    const updateField = (id: number, key: string, value: any) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-brand-600" />
                        Pengaturan Form
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Konfigurasi field untuk setiap jenis formulir</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {FORM_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === type
                                ? 'bg-brand-600 text-white shadow-md'
                                : 'bg-white/50 text-gray-600 hover:bg-white/80'
                        }`}
                    >
                        {type.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Fields List */}
            <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-700">
                        Fields — {activeTab.replace(/_/g, ' ')}
                    </h2>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="glass-button flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Tambah Field
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
                    </div>
                ) : fields.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Belum ada field. Klik "Tambah Field" untuk memulai.</p>
                ) : (
                    <div className="space-y-3">
                        {fields.map(field => (
                            <div key={field.id} className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-gray-100 group">
                                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                                    <input
                                        className="glass-input text-sm"
                                        value={field.field_label}
                                        onChange={e => updateField(field.id, 'field_label', e.target.value)}
                                        onBlur={() => handleUpdate(field)}
                                        placeholder="Label"
                                    />
                                    <input
                                        className="glass-input text-sm font-mono"
                                        value={field.field_key}
                                        onChange={e => updateField(field.id, 'field_key', e.target.value)}
                                        onBlur={() => handleUpdate(field)}
                                        placeholder="key"
                                    />
                                    <select
                                        className="glass-input text-sm"
                                        value={field.input_type}
                                        onChange={e => {
                                            updateField(field.id, 'input_type', e.target.value);
                                            handleUpdate({ ...field, input_type: e.target.value as any });
                                        }}
                                    >
                                        {INPUT_TYPES.map(t => (
                                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.is_required}
                                            onChange={e => {
                                                updateField(field.id, 'is_required', e.target.checked);
                                                handleUpdate({ ...field, is_required: e.target.checked });
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className={field.is_required ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                            {field.is_required ? 'Wajib' : 'Opsional'}
                                        </span>
                                    </label>
                                    <button
                                        onClick={() => handleDelete(field.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Field Modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900">Tambah Field Baru</h3>
                        <div className="space-y-3">
                            <input className="glass-input" placeholder="Label (e.g. KTP)" value={newField.field_label}
                                onChange={e => setNewField(p => ({ ...p, field_label: e.target.value }))} />
                            <input className="glass-input font-mono" placeholder="Key (e.g. ktp)" value={newField.field_key}
                                onChange={e => setNewField(p => ({ ...p, field_key: e.target.value }))} />
                            <select className="glass-input" value={newField.input_type}
                                onChange={e => setNewField(p => ({ ...p, input_type: e.target.value }))}>
                                {INPUT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                            </select>
                            <input className="glass-input" placeholder="Deskripsi (opsional)" value={newField.description}
                                onChange={e => setNewField(p => ({ ...p, description: e.target.value }))} />
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={newField.is_required}
                                    onChange={e => setNewField(p => ({ ...p, is_required: e.target.checked }))}
                                    className="w-4 h-4 rounded" />
                                Wajib diisi
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button onClick={handleAdd} disabled={saving || !newField.field_key || !newField.field_label}
                                className="glass-button flex items-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
