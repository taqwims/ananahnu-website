import { Building2, User as UserIcon, FileText, X, Edit3, Save, Loader2, Eye, ExternalLink, CheckCircle2, Trash2, Upload, List } from 'lucide-react';
import type { Submission, FormFieldValue } from '../../../types';
import { InfoBox, EditField } from './helpers';
import FileUpload from '../FileUpload';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { compressImage } from '../../../utils/compressor';

interface QCReferencePanelProps {
    submission: Submission | null;
    isEditingClient: boolean;
    setIsEditingClient: (v: boolean) => void;
    clientForm: any;
    setClientForm: (v: any) => void;
    onUpdateClient: () => Promise<void>;
    
    isEditingDocs: boolean;
    setIsEditingDocs: (v: boolean) => void;
    fieldValues: FormFieldValue[];
    onUpdateValue: (index: number, key: string, value: any) => void;
    onUpdateDocs: () => Promise<void>;
    
    processing: boolean;
}

export const QCReferencePanel = ({
    submission,
    isEditingClient,
    setIsEditingClient,
    clientForm,
    setClientForm,
    onUpdateClient,
    isEditingDocs,
    setIsEditingDocs,
    fieldValues,
    onUpdateValue,
    onUpdateDocs,
    processing
}: QCReferencePanelProps) => {
    if (!submission) return null;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
            {/* Client Basic Info */}
            <div className="glass-panel p-6 border-white/40 shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-600 rounded-full" />
                        <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Informasi Dasar Klien</h3>
                    </div>
                    <button 
                        onClick={() => setIsEditingClient(!isEditingClient)}
                        className={`p-2 rounded-lg transition-all ${isEditingClient ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                        {isEditingClient ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {isEditingClient ? (
                        <>
                            <EditField label="Nama Bisnis" value={clientForm.business_name} onChange={v => setClientForm({...clientForm, business_name: v})} />
                            <EditField label="Nama Pemilik" value={clientForm.client_name} onChange={v => setClientForm({...clientForm, client_name: v})} />
                            <EditField label="NIB" value={clientForm.nib} onChange={v => setClientForm({...clientForm, nib: v})} />
                            <EditField label="NIK" value={clientForm.nik} onChange={v => setClientForm({...clientForm, nik: v})} />
                            <EditField label="Produk" value={clientForm.product_name} onChange={v => setClientForm({...clientForm, product_name: v})} />
                            <EditField label="Kontak Person" value={clientForm.contact_person} onChange={v => setClientForm({...clientForm, contact_person: v})} />
                            <EditField label="No. Telepon" value={clientForm.phone} onChange={v => setClientForm({...clientForm, phone: v})} />
                            <div className="col-span-2">
                                <EditField label="Alamat Lengkap" value={clientForm.address} onChange={v => setClientForm({...clientForm, address: v})} isTextArea />
                            </div>
                            <div className="col-span-2 pt-2">
                                <button 
                                    onClick={onUpdateClient}
                                    disabled={processing}
                                    className="w-full py-2 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
                                >
                                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Simpan Perubahan Klien (QC Override)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <InfoBox label="Nama Bisnis" value={submission.client?.business_name} icon={Building2} />
                            <InfoBox label="Nama Pemilik" value={submission.client?.client_name} icon={UserIcon} />
                            <InfoBox label="NIB" value={submission.client?.nib} icon={Building2} mono />
                            <InfoBox label="NIK" value={submission.client?.nik} icon={Building2} mono />
                            <InfoBox label="Produk" value={submission.client?.product_name} icon={FileText} />
                            <InfoBox label="Kontak Person" value={submission.client?.contact_person} icon={UserIcon} />
                            <InfoBox label="No. Telepon" value={submission.client?.phone} icon={FileText} />
                            <div className="col-span-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Alamat Lengkap</span>
                                <p className="text-xs text-gray-700 leading-relaxed font-medium">{submission.client?.address}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Document References */}
            <div className="glass-panel p-6 border-white/40 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-600 rounded-full" />
                        <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Dokumen & Bukti Pendukung</h3>
                    </div>
                    <button 
                        onClick={() => setIsEditingDocs(!isEditingDocs)}
                        className={`p-2 rounded-lg transition-all ${isEditingDocs ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                        {isEditingDocs ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {fieldValues.map((fv, idx) => (
                        <div key={fv.id} className={`p-4 rounded-2xl border transition-all ${isEditingDocs ? 'bg-amber-50/10 border-amber-100' : 'bg-white/60 border-gray-100 hover:border-brand-200 shadow-sm'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${isEditingDocs ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                                    {fv.form_field.input_type === 'PRODUCT_LIST' ? <List className="w-4 h-4 text-brand-550" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{fv.form_field.field_label}</span>
                            </div>

                            {isEditingDocs ? (
                                <div className="space-y-3">
                                    {fv.form_field.input_type === 'PRODUCT_LIST' ? (
                                        (() => {
                                            interface ProductItem { nama: string; foto_url: string; }
                                            let products: ProductItem[] = [];
                                            try {
                                                products = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                if (!Array.isArray(products)) products = [];
                                            } catch { products = []; }

                                            const updateProductRow = (rowIdx: number, fieldKey: keyof ProductItem, fieldValue: any) => {
                                                const newProducts = [...products];
                                                newProducts[rowIdx] = { ...newProducts[rowIdx], [fieldKey]: fieldValue };
                                                onUpdateValue(idx, 'text_value', JSON.stringify(newProducts));
                                            };

                                            const handleProductPhotoUpload = async (rowIdx: number, file: File) => {
                                                let finalFile = file;
                                                if (finalFile.type.startsWith('image/')) {
                                                    try { finalFile = await compressImage(finalFile); } catch {}
                                                }
                                                if (finalFile.size > 2 * 1024 * 1024) {
                                                    alert("Ukuran file tidak boleh lebih dari 2MB");
                                                    return;
                                                }
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', finalFile);
                                                    const res = await api.post(`/media/upload?subfolder=submission_edited`, formData);
                                                    updateProductRow(rowIdx, 'foto_url', res.data.url);
                                                } catch {
                                                    alert("Gagal mengunggah foto produk");
                                                }
                                            };

                                            return (
                                                <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-50/75 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-2 w-10 text-center">No</th>
                                                                <th className="p-2">Nama</th>
                                                                <th className="p-2 w-36">Foto</th>
                                                                <th className="p-2 w-10 text-center">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 text-gray-600">
                                                            {products.map((p, rowIdx) => (
                                                                <tr key={rowIdx} className="align-middle">
                                                                    <td className="p-2 text-center font-bold text-gray-400">{rowIdx + 1}</td>
                                                                    <td className="p-2">
                                                                        <input
                                                                            type="text"
                                                                            className="w-full px-2 py-1 bg-gray-50 border-none rounded text-xs"
                                                                            value={p.nama || ''}
                                                                            onChange={e => updateProductRow(rowIdx, 'nama', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="p-2">
                                                                        {p.foto_url ? (
                                                                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 p-0.5 rounded border border-emerald-100 text-[9px]">
                                                                                <img src={`${import.meta.env.VITE_API_URL}${p.foto_url}`} className="w-6 h-6 object-cover rounded" />
                                                                                <span className="truncate flex-1 font-bold">{p.foto_url.split('/').pop()}</span>
                                                                                <button type="button" onClick={() => updateProductRow(rowIdx, 'foto_url', '')} className="text-red-500 font-bold">&times;</button>
                                                                            </div>
                                                                        ) : (
                                                                            <label className="flex items-center gap-1 px-2 py-1 border border-dashed border-gray-200 rounded cursor-pointer justify-center text-[9px] text-gray-600 hover:bg-gray-50">
                                                                                <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleProductPhotoUpload(rowIdx, e.target.files[0])} />
                                                                                <Upload className="w-2.5 h-2.5" /> <span>Upload</span>
                                                                            </label>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-2 text-center">
                                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify(products.filter((_, i) => i !== rowIdx)))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify([...products, { nama: '', foto_url: '' }]))} className="px-2 py-0.5 text-[8px] font-black uppercase bg-white border border-gray-200 text-gray-600 rounded shadow-sm">+ Tambah</button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'INGREDIENT_LIST' ? (
                                        (() => {
                                            interface IngredientItem { nama: string; produsen: string; penerbit: string; no_id: string; tanggal: string; }
                                            let ingredients: IngredientItem[] = [];
                                            try {
                                                ingredients = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                if (!Array.isArray(ingredients)) ingredients = [];
                                            } catch { ingredients = []; }

                                            const updateIngredientRow = (rowIdx: number, fieldKey: keyof IngredientItem, fieldValue: any) => {
                                                const newIngredients = [...ingredients];
                                                newIngredients[rowIdx] = { ...newIngredients[rowIdx], [fieldKey]: fieldValue };
                                                onUpdateValue(idx, 'text_value', JSON.stringify(newIngredients));
                                            };

                                            return (
                                                <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                                                            <thead>
                                                                <tr className="bg-gray-50/75 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2">Bahan</th>
                                                                    <th className="p-2">Produsen</th>
                                                                    <th className="p-2">Penerbit</th>
                                                                    <th className="p-2">No SH</th>
                                                                    <th className="p-2 w-10 text-center">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {ingredients.map((item, rowIdx) => (
                                                                    <tr key={rowIdx} className="align-middle">
                                                                        <td className="p-2 text-center font-bold text-gray-400">{rowIdx + 1}</td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={item.nama || ''} onChange={e => updateIngredientRow(rowIdx, 'nama', e.target.value)} /></td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={item.produsen || ''} onChange={e => updateIngredientRow(rowIdx, 'produsen', e.target.value)} /></td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={item.penerbit || ''} onChange={e => updateIngredientRow(rowIdx, 'penerbit', e.target.value)} /></td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={item.no_id || ''} onChange={e => updateIngredientRow(rowIdx, 'no_id', e.target.value)} /></td>
                                                                        <td className="p-2 text-center">
                                                                            <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify(ingredients.filter((_, i) => i !== rowIdx)))} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify([...ingredients, { nama: '', produsen: '', penerbit: '', no_id: '', tanggal: '' }]))} className="px-2 py-0.5 text-[8px] font-black uppercase bg-white border border-gray-200 text-gray-600 rounded shadow-sm">+ Tambah</button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'INGREDIENT_MATRIX' ? (
                                        (() => {
                                            interface MatrixItem { nama_produk: string; bahan: string[]; }
                                            let items: MatrixItem[] = [];
                                            try {
                                                items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                if (!Array.isArray(items)) items = [];
                                            } catch { items = []; }

                                            const updateMatrixRow = (rowIdx: number, fieldKey: keyof MatrixItem, fieldValue: any) => {
                                                const newItems = [...items];
                                                newItems[rowIdx] = { ...newItems[rowIdx], [fieldKey]: fieldValue };
                                                onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                            };

                                            return (
                                                <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-50/75 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-2 w-10 text-center">No</th>
                                                                <th className="p-2 w-1/3">Produk</th>
                                                                <th className="p-2">Bahan Yang Digunakan (Enter)</th>
                                                                <th className="p-2 w-10 text-center">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 text-gray-600">
                                                            {items.map((row, rowIdx) => (
                                                                <tr key={rowIdx} className="align-top">
                                                                    <td className="p-2 text-center font-bold text-gray-400 pt-2">{rowIdx + 1}</td>
                                                                    <td className="p-2">
                                                                        <input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs font-semibold" value={row.nama_produk || ''} onChange={e => updateMatrixRow(rowIdx, 'nama_produk', e.target.value)} />
                                                                    </td>
                                                                    <td className="p-2">
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {(row.bahan || []).map((b, bIdx) => (
                                                                                    <span key={bIdx} className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold">
                                                                                        {b} <button type="button" onClick={() => updateMatrixRow(rowIdx, 'bahan', row.bahan.filter((_, i) => i !== bIdx))} className="text-red-500 font-bold">&times;</button>
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                            <input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-[10px]" placeholder="Tekan Enter untuk menambah..." onKeyDown={e => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    const val = e.currentTarget.value.trim();
                                                                                    if (val) {
                                                                                        updateMatrixRow(rowIdx, 'bahan', [...(row.bahan || []), val]);
                                                                                        e.currentTarget.value = '';
                                                                                    }
                                                                                }
                                                                            }} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-center pt-2">
                                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify(items.filter((_, i) => i !== rowIdx)))} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify([...items, { nama_produk: '', bahan: [] }]))} className="px-2 py-0.5 text-[8px] font-black uppercase bg-white border border-gray-200 text-gray-600 rounded shadow-sm">+ Tambah</button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'ACTIVITY_PHOTOS' ? (
                                        (() => {
                                            interface ActivityItem { nama_kegiatan: string; fotos: string[]; }
                                            let items: ActivityItem[] = [];
                                            try {
                                                items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                if (!Array.isArray(items)) items = [];
                                            } catch { items = []; }

                                            const updateActivityRow = (rowIdx: number, fieldKey: keyof ActivityItem, fieldValue: any) => {
                                                const newItems = [...items];
                                                newItems[rowIdx] = { ...newItems[rowIdx], [fieldKey]: fieldValue };
                                                onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                            };

                                            const handleActivityPhotoUpload = async (rowIdx: number, files: FileList) => {
                                                const newPhotos = [...(items[rowIdx]?.fotos || [])];
                                                for (let i = 0; i < files.length; i++) {
                                                    let file = files[i];
                                                    if (file.type.startsWith('image/')) {
                                                        try { file = await compressImage(file); } catch {}
                                                    }
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        const res = await api.post(`/media/upload?subfolder=submissions`, formData);
                                                        newPhotos.push(res.data.url);
                                                    } catch {
                                                        alert("Gagal mengunggah foto");
                                                    }
                                                }
                                                updateActivityRow(rowIdx, 'fotos', newPhotos);
                                            };

                                            return (
                                                <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-50/75 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-2 w-10 text-center">No</th>
                                                                <th className="p-2 w-1/3">Kegiatan</th>
                                                                <th className="p-2">Foto</th>
                                                                <th className="p-2 w-10 text-center">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 text-gray-600">
                                                            {items.map((row, rowIdx) => (
                                                                <tr key={rowIdx} className="align-top">
                                                                    <td className="p-2 text-center font-bold text-gray-400 pt-2">{rowIdx + 1}</td>
                                                                    <td className="p-2">
                                                                        <input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={row.nama_kegiatan || ''} onChange={e => updateActivityRow(rowIdx, 'nama_kegiatan', e.target.value)} />
                                                                    </td>
                                                                    <td className="p-2">
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {(row.fotos || []).map((fUrl, fIdx) => (
                                                                                    <div key={fIdx} className="relative w-8 h-8 rounded border bg-gray-50 shrink-0">
                                                                                        <img src={`${import.meta.env.VITE_API_URL}${fUrl}`} className="w-full h-full object-cover" />
                                                                                        <button type="button" onClick={() => updateActivityRow(rowIdx, 'fotos', row.fotos.filter((_, i) => i !== fIdx))} className="absolute top-0 right-0 px-0.5 bg-red-500 text-white rounded-full text-[8px]">&times;</button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <label className="flex items-center gap-1 px-1.5 py-0.5 border border-dashed border-gray-200 rounded cursor-pointer justify-center text-[8px] max-w-[120px]">
                                                                                <input type="file" className="hidden" multiple accept="image/*" onChange={e => e.target.files && handleActivityPhotoUpload(rowIdx, e.target.files)} />
                                                                                <Upload className="w-2 h-2" /> <span>Pilih File</span>
                                                                            </label>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-center pt-2">
                                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify(items.filter((_, i) => i !== rowIdx)))} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify([...items, { nama_kegiatan: '', fotos: [] }]))} className="px-2 py-0.5 text-[8px] font-black uppercase bg-white border border-gray-200 text-gray-600 rounded shadow-sm">+ Tambah</button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'HALAL_TEAM' ? (
                                        (() => {
                                            interface HalalTeamItem { nama: string; jabatan: string; posisi_tim: string; ttd_url: string; }
                                            let items: HalalTeamItem[] = [];
                                            try {
                                                items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                if (!Array.isArray(items)) items = [];
                                            } catch { items = []; }

                                            const updateTeamRow = (rowIdx: number, fieldKey: keyof HalalTeamItem, fieldValue: any) => {
                                                const newItems = [...items];
                                                newItems[rowIdx] = { ...newItems[rowIdx], [fieldKey]: fieldValue };
                                                onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                            };

                                            const handleSignatureUpload = async (rowIdx: number, file: File) => {
                                                let finalFile = file;
                                                if (finalFile.type.startsWith('image/')) {
                                                    try { finalFile = await compressImage(finalFile); } catch {}
                                                }
                                                try {
                                                    const formData = new FormData();
                                                    formData.append('file', finalFile);
                                                    const res = await api.post(`/media/upload?subfolder=submissions`, formData);
                                                    updateTeamRow(rowIdx, 'ttd_url', res.data.url);
                                                } catch {
                                                    alert("Gagal mengunggah tanda tangan");
                                                }
                                            };

                                            return (
                                                <div className="border border-gray-155 rounded-xl overflow-hidden bg-white shadow-sm">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                                                            <thead>
                                                                <tr className="bg-gray-50/75 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2">Nama</th>
                                                                    <th className="p-2">Jabatan</th>
                                                                    <th className="p-2">Posisi Tim</th>
                                                                    <th className="p-2 w-28">Ttd</th>
                                                                    <th className="p-2 w-10 text-center">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {items.map((row, rowIdx) => (
                                                                    <tr key={rowIdx} className="align-middle">
                                                                        <td className="p-2 text-center font-bold text-gray-400">{rowIdx + 1}</td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={row.nama || ''} onChange={e => updateTeamRow(rowIdx, 'nama', e.target.value)} /></td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={row.jabatan || ''} onChange={e => updateTeamRow(rowIdx, 'jabatan', e.target.value)} /></td>
                                                                        <td className="p-2"><input type="text" className="w-full px-1.5 py-0.5 bg-gray-50 border-none rounded text-xs" value={row.posisi_tim || ''} onChange={e => updateTeamRow(rowIdx, 'posisi_tim', e.target.value)} /></td>
                                                                        <td className="p-2">
                                                                            {row.ttd_url ? (
                                                                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 p-0.5 rounded border border-emerald-100 text-[8px]">
                                                                                    <img src={`${import.meta.env.VITE_API_URL}${row.ttd_url}`} className="w-6 h-6 object-contain bg-white rounded" />
                                                                                    <span className="truncate flex-1 font-bold">{row.ttd_url.split('/').pop()}</span>
                                                                                    <button type="button" onClick={() => updateTeamRow(rowIdx, 'ttd_url', '')} className="text-red-500 font-bold">&times;</button>
                                                                                </div>
                                                                            ) : (
                                                                                <label className="flex items-center gap-1 px-2 py-1 border border-dashed border-gray-200 rounded cursor-pointer justify-center text-[8px] text-gray-600 hover:bg-gray-50">
                                                                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleSignatureUpload(rowIdx, e.target.files[0])} />
                                                                                    <Upload className="w-2.5 h-2.5" /> <span>Upload</span>
                                                                                </label>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-2 text-center">
                                                                            <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify(items.filter((_, i) => i !== rowIdx)))} className="text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                                                        <button type="button" onClick={() => onUpdateValue(idx, 'text_value', JSON.stringify([...items, { nama: '', jabatan: '', posisi_tim: '', ttd_url: '' }]))} className="px-2 py-0.5 text-[8px] font-black uppercase bg-white border border-gray-200 text-gray-600 rounded shadow-sm">+ Tim Baru</button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <EditField 
                                                    label="Keterangan / Nilai Text" 
                                                    value={fv.text_value || ''} 
                                                    onChange={v => onUpdateValue(idx, 'text_value', v)} 
                                                />
                                                <EditField 
                                                    label="Tautan / Link" 
                                                    value={fv.link_value || ''} 
                                                    onChange={v => onUpdateValue(idx, 'link_value', v)} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block px-1">File Upload</label>
                                                <FileUpload 
                                                    subfolder="docs"
                                                    label={fv.file_url ? "Ganti File" : "Upload File"}
                                                    onUploadSuccess={(url) => {
                                                        onUpdateValue(idx, 'file_url', url);
                                                        toast.success("File siap disimpan");
                                                    }}
                                                />
                                                {fv.file_url && (
                                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="text-[9px] font-bold truncate flex-1">{fv.file_url.split('/').pop()}</span>
                                                        <a href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-emerald-100 rounded-lg">
                                                            <Eye className="w-3 h-3" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onUpdateValue(idx, 'file_url', '');
                                                                toast.success("File dihapus");
                                                            }}
                                                            className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                            title="Hapus file"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {fv.form_field.input_type === 'PRODUCT_LIST' ? (
                                        (() => {
                                            interface ProductItem { nama: string; foto_url: string; }
                                            let products: ProductItem[] = [];
                                            try {
                                                products = JSON.parse(fv.text_value);
                                                if (!Array.isArray(products)) products = [];
                                            } catch { products = []; }
                                            if (products.length === 0) return <p className="text-[10px] text-gray-400 italic">Belum diisi</p>;
                                            return (
                                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-[10px]">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-1.5 w-10 text-center">No</th>
                                                                <th className="p-1.5">Nama</th>
                                                                <th className="p-1.5 w-24">Foto</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {products.map((p, pIdx) => (
                                                                <tr key={pIdx}>
                                                                    <td className="p-1.5 text-center text-gray-400">{pIdx + 1}</td>
                                                                    <td className="p-1.5 font-bold text-gray-700">{p.nama}</td>
                                                                    <td className="p-1.5">
                                                                        {p.foto_url ? (
                                                                            <a href={`${import.meta.env.VITE_API_URL}${p.foto_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-brand-600">
                                                                                <img src={`${import.meta.env.VITE_API_URL}${p.foto_url}`} className="w-5 h-5 object-cover rounded border" />
                                                                                <span className="truncate max-w-[60px] text-[8px]">{p.foto_url.split('/').pop()}</span>
                                                                            </a>
                                                                        ) : <span className="text-gray-300 italic">Tidak ada</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'INGREDIENT_LIST' ? (
                                        (() => {
                                            interface IngredientItem { nama: string; produsen: string; penerbit: string; no_id: string; tanggal: string; }
                                            let ingredients: IngredientItem[] = [];
                                            try {
                                                ingredients = JSON.parse(fv.text_value);
                                                if (!Array.isArray(ingredients)) ingredients = [];
                                            } catch { ingredients = []; }
                                            if (ingredients.length === 0) return <p className="text-[10px] text-gray-400 italic">Belum diisi</p>;
                                            return (
                                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-[10px] overflow-x-auto">
                                                    <table className="w-full text-left border-collapse min-w-[400px]">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-1.5 w-10 text-center">No</th>
                                                                <th className="p-1.5">Bahan</th>
                                                                <th className="p-1.5">Produsen</th>
                                                                <th className="p-1.5">Penerbit</th>
                                                                <th className="p-1.5">No SH</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {ingredients.map((item, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                                                                    <td className="p-1.5 font-bold text-gray-700">{item.nama}</td>
                                                                    <td className="p-1.5">{item.produsen || '-'}</td>
                                                                    <td className="p-1.5">{item.penerbit || '-'}</td>
                                                                    <td className="p-1.5 font-mono">{item.no_id || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'INGREDIENT_MATRIX' ? (
                                        (() => {
                                            interface MatrixItem { nama_produk: string; bahan: string[]; }
                                            let items: MatrixItem[] = [];
                                            try {
                                                items = JSON.parse(fv.text_value);
                                                if (!Array.isArray(items)) items = [];
                                            } catch { items = []; }
                                            if (items.length === 0) return <p className="text-[10px] text-gray-400 italic">Belum diisi</p>;
                                            return (
                                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-[10px]">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-1.5 w-10 text-center">No</th>
                                                                <th className="p-1.5 w-1/3">Produk</th>
                                                                <th className="p-1.5">Bahan</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {items.map((row, idx) => (
                                                                <tr key={idx} className="align-top">
                                                                    <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                                                                    <td className="p-1.5 font-bold text-gray-700">{row.nama_produk}</td>
                                                                    <td className="p-1.5">
                                                                        <ul className="list-disc pl-3.5 space-y-0.5">
                                                                            {(row.bahan || []).map((b, bIdx) => <li key={bIdx}>{b}</li>)}
                                                                        </ul>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'ACTIVITY_PHOTOS' ? (
                                        (() => {
                                            interface ActivityItem { nama_kegiatan: string; fotos: string[]; }
                                            let items: ActivityItem[] = [];
                                            try {
                                                items = JSON.parse(fv.text_value);
                                                if (!Array.isArray(items)) items = [];
                                            } catch { items = []; }
                                            if (items.length === 0) return <p className="text-[10px] text-gray-400 italic">Belum diisi</p>;
                                            return (
                                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-[10px]">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-1.5 w-10 text-center">No</th>
                                                                <th className="p-1.5 w-1/3">Kegiatan</th>
                                                                <th className="p-1.5">Foto</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {items.map((row, idx) => (
                                                                <tr key={idx} className="align-top">
                                                                    <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                                                                    <td className="p-1.5 font-bold text-gray-700">{row.nama_kegiatan}</td>
                                                                    <td className="p-1.5">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {(row.fotos || []).map((fUrl, fIdx) => (
                                                                                <a key={fIdx} href={`${import.meta.env.VITE_API_URL}${fUrl}`} target="_blank" rel="noreferrer" className="block w-6 h-6 rounded border bg-white shrink-0">
                                                                                    <img src={`${import.meta.env.VITE_API_URL}${fUrl}`} className="w-full h-full object-cover" />
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()
                                    ) : fv.form_field.input_type === 'HALAL_TEAM' ? (
                                        (() => {
                                            interface HalalTeamItem { nama: string; jabatan: string; posisi_tim: string; ttd_url: string; }
                                            let items: HalalTeamItem[] = [];
                                            try {
                                                items = JSON.parse(fv.text_value);
                                                if (!Array.isArray(items)) items = [];
                                            } catch { items = []; }
                                            if (items.length === 0) return <p className="text-[10px] text-gray-400 italic">Belum diisi</p>;
                                            return (
                                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 text-[10px] overflow-x-auto">
                                                    <table className="w-full text-left border-collapse min-w-[400px]">
                                                        <thead>
                                                            <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400">
                                                                <th className="p-1.5 w-10 text-center">No</th>
                                                                <th className="p-1.5">Nama</th>
                                                                <th className="p-1.5">Jabatan</th>
                                                                <th className="p-1.5">Posisi Tim</th>
                                                                <th className="p-1.5 w-12">Ttd</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {items.map((row, idx) => (
                                                                <tr key={idx} className="align-middle">
                                                                    <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                                                                    <td className="p-1.5 font-bold text-gray-700">{row.nama}</td>
                                                                    <td className="p-1.5">{row.jabatan}</td>
                                                                    <td className="p-1.5">{row.posisi_tim}</td>
                                                                    <td className="p-1.5 font-mono">
                                                                        {row.ttd_url ? (
                                                                            <a href={`${import.meta.env.VITE_API_URL}${row.ttd_url}`} target="_blank" rel="noreferrer" className="block w-6 h-6 border rounded bg-white">
                                                                                <img src={`${import.meta.env.VITE_API_URL}${row.ttd_url}`} className="w-full h-full object-contain" />
                                                                            </a>
                                                                        ) : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-xs text-gray-600 font-medium truncate">{fv.text_value || '-'}</p>
                                                {fv.link_value && <p className="text-[9px] text-brand-600 font-mono truncate mt-0.5">{fv.link_value}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                {fv.file_url && (
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL}${fv.file_url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all shadow-sm border border-gray-100"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {fv.link_value && (
                                                    <a
                                                        href={fv.link_value}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 hover:bg-brand-600 hover:text-white rounded-lg text-brand-600 transition-all shadow-sm border border-gray-100"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isEditingDocs && (
                        <button 
                            onClick={onUpdateDocs}
                            disabled={processing}
                            className="w-full mt-4 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-100 flex items-center justify-center gap-3"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Perubahan Dokumen (QC Override)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
