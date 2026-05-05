import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import api from '../../services/api';
import type { FormFieldConfig } from '../../types';

export default function SubmissionCreate() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Generate a temporary/final ID for the submission
    const [submissionId] = useState(crypto.randomUUID());
    
    const initialType = searchParams.get('type') || 'SELF_DECLARE';
    const initialName = searchParams.get('name') || '';

    const [clientData, setClientData] = useState({
        nib: '',
        nik: '',
        business_name: initialName,
        address: '',
        product_name: '',
        service_type: initialType,
        contact_person: '',
        phone: ''
    });

    const [configs, setConfigs] = useState<FormFieldConfig[]>([]);
    const [fieldValues, setFieldValues] = useState<Record<number, { text_value: string; file_url: string; link_value: string }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const loadConfigs = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/form-config/${clientData.service_type}`);
                setConfigs(res.data || []);
                
                const valueMap: typeof fieldValues = {};
                (res.data || []).forEach((cfg: FormFieldConfig) => {
                    valueMap[cfg.id] = { text_value: '', file_url: '', link_value: '' };
                });
                setFieldValues(valueMap);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadConfigs();
    }, [clientData.service_type]);

    const handleFileUpload = async (fieldId: number, file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran file tidak boleh lebih dari 2MB");
            return;
        }

        setUploading(prev => ({ ...prev, [fieldId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Use the pre-generated submissionId for the subfolder
            const res = await api.post(`/media/upload?subfolder=submission_${submissionId}`, formData);
            
            setFieldValues(prev => ({
                ...prev,
                [fieldId]: { ...prev[fieldId], file_url: res.data.url }
            }));
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal mengunggah file");
        } finally {
            setUploading(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    const handleSave = async () => {
        if (!clientData.business_name) {
            alert("Nama Usaha wajib diisi");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id: submissionId,
                client_data: clientData,
                field_values: configs.map(cfg => ({
                    form_field_id: cfg.id,
                    ...fieldValues[cfg.id]
                }))
            };

            await api.post('/submissions/create-full', payload);
            navigate('/dashboard/submissions');
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/submissions')} className="p-2 hover:bg-white/50 rounded-lg">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Buat Pengajuan Baru</h1>
                    <p className="text-sm text-gray-500">Lengkapi data klien dan dokumen persyaratan</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Client Info Form */}
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold mb-4">Informasi Klien</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nama Usaha</label>
                                <input 
                                    className="glass-input w-full" 
                                    value={clientData.business_name} 
                                    onChange={e => setClientData({...clientData, business_name: e.target.value})} 
                                    placeholder="Contoh: UD Jaya Abadi"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">NIB</label>
                                <input 
                                    className="glass-input w-full font-mono" 
                                    value={clientData.nib} 
                                    onChange={e => setClientData({...clientData, nib: e.target.value})} 
                                    placeholder="Nomor Induk Berusaha"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">NIK (Opsional)</label>
                                <input 
                                    className="glass-input w-full font-mono" 
                                    value={clientData.nik} 
                                    onChange={e => setClientData({...clientData, nik: e.target.value})} 
                                    placeholder="Nomor Induk Kependudukan"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nama Produk</label>
                                <input 
                                    className="glass-input w-full" 
                                    value={clientData.product_name} 
                                    onChange={e => setClientData({...clientData, product_name: e.target.value})} 
                                    placeholder="Contoh: Keripik Singkong"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Alamat Lengkap</label>
                                <textarea 
                                    className="glass-input w-full" 
                                    rows={2} 
                                    value={clientData.address} 
                                    onChange={e => setClientData({...clientData, address: e.target.value})} 
                                    placeholder="Alamat tempat usaha..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Kontak Person</label>
                                <input 
                                    className="glass-input w-full" 
                                    value={clientData.contact_person} 
                                    onChange={e => setClientData({...clientData, contact_person: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">No. Telepon/WA</label>
                                <input 
                                    className="glass-input w-full" 
                                    value={clientData.phone} 
                                    onChange={e => setClientData({...clientData, phone: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Document Form */}
                    <div className="glass-panel p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Dokumen Persyaratan</h3>
                        {configs.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Pilih jenis layanan untuk melihat persyaratan.</p>
                        ) : (
                            <div className="space-y-4">
                                {configs.map(cfg => (
                                    <div key={cfg.id} className="space-y-1">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            {cfg.input_type === 'FILE_UPLOAD' && <Upload className="w-4 h-4 text-brand-500" />}
                                            {cfg.input_type === 'LINK' && <LinkIcon className="w-4 h-4 text-blue-500" />}
                                            {cfg.input_type === 'TEXT' && <FileText className="w-4 h-4 text-gray-500" />}
                                            {cfg.field_label}
                                            {cfg.is_required && <span className="text-red-500 text-xs">*wajib</span>}
                                        </label>
                                        
                                        {cfg.input_type === 'FILE_UPLOAD' && (
                                            <div className="space-y-2">
                                                <label className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                                    uploading[cfg.id] ? 'bg-gray-50 border-gray-200' : 'bg-white border-brand-200 hover:border-brand-400'
                                                }`}>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={e => e.target.files?.[0] && handleFileUpload(cfg.id, e.target.files[0])}
                                                        disabled={uploading[cfg.id]}
                                                    />
                                                    {uploading[cfg.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-brand-600" />}
                                                    <span className="text-sm text-brand-600 font-medium">
                                                        {fieldValues[cfg.id]?.file_url ? 'Ganti File' : 'Pilih File'}
                                                    </span>
                                                </label>
                                                {fieldValues[cfg.id]?.file_url && (
                                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> File terpilih
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {cfg.input_type === 'LINK' && (
                                            <input 
                                                className="glass-input w-full text-sm" 
                                                placeholder="https://..." 
                                                value={fieldValues[cfg.id]?.link_value || ''}
                                                onChange={e => setFieldValues({
                                                    ...fieldValues,
                                                    [cfg.id]: { ...fieldValues[cfg.id], link_value: e.target.value }
                                                })}
                                            />
                                        )}

                                        {cfg.input_type === 'TEXT' && (
                                            <textarea 
                                                className="glass-input w-full text-sm" 
                                                rows={2} 
                                                value={fieldValues[cfg.id]?.text_value || ''}
                                                onChange={e => setFieldValues({
                                                    ...fieldValues,
                                                    [cfg.id]: { ...fieldValues[cfg.id], text_value: e.target.value }
                                                })}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 sticky top-6">
                        <h3 className="text-lg font-semibold mb-4">Aksi</h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full glass-button bg-brand-600 text-white hover:bg-brand-700 flex justify-center items-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Simpan Data
                            </button>
                            <p className="text-[10px] text-gray-400 text-center">
                                Data belum akan tersimpan ke server sebelum Anda menekan tombol Simpan di atas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
