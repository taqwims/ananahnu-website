import { Edit3, Save, X, ExternalLink, Link as LinkIcon, Upload, FileText, Trash2, Calendar, List } from 'lucide-react';
import type { FormFieldValue } from '../../../types';
import FileUpload from '../FileUpload';
import api from '../../../services/api';
import { compressImage } from '../../../utils/compressor';

interface DocumentEditorProps {
    fieldValues: FormFieldValue[];
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    onUpdateValue: (index: number, key: string, value: any) => void;
    onSave: () => Promise<void>;
    processing: boolean;
}

export const DocumentEditor = ({
    fieldValues,
    isEditing,
    setIsEditing,
    onUpdateValue,
    onSave,
    processing
}: DocumentEditorProps) => {
    return (
        <div className="glass-panel flex-1 flex flex-col border-white/60 shadow-xl overflow-hidden group">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-extrabold text-gray-800 tracking-tight">Data / Dokumen Pengisian</span>
                </div>
                {fieldValues.length > 0 && (
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={processing}
                                    title="Batal"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={onSave}
                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                                    disabled={processing}
                                    title="Simpan"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Data"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                <div className="grid grid-cols-1 gap-3">
                    {fieldValues.map((fv, idx) => (
                        <div key={fv.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 transition-all hover:border-blue-100 hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {fv.form_field.input_type === 'FILE_UPLOAD' && <Upload className="w-3.5 h-3.5 text-brand-500" />}
                                    {fv.form_field.input_type === 'LINK' && <LinkIcon className="w-3.5 h-3.5 text-blue-500" />}
                                    {fv.form_field.input_type === 'TEXT' && <FileText className="w-3.5 h-3.5 text-gray-500" />}
                                    {fv.form_field.input_type === 'DATE' && <Calendar className="w-3.5 h-3.5 text-emerald-500" />}
                                    {fv.form_field.input_type === 'REPEATER' && <List className="w-3.5 h-3.5 text-indigo-500" />}
                                    {fv.form_field.input_type === 'PRODUCT_LIST' && <List className="w-3.5 h-3.5 text-brand-500" />}
                                    {fv.form_field.input_type === 'INGREDIENT_LIST' && <List className="w-3.5 h-3.5 text-amber-500" />}
                                    {fv.form_field.input_type === 'INGREDIENT_MATRIX' && <List className="w-3.5 h-3.5 text-pink-500" />}
                                    {fv.form_field.input_type === 'ACTIVITY_PHOTOS' && <Upload className="w-3.5 h-3.5 text-emerald-500" />}
                                    {fv.form_field.input_type === 'HALAL_TEAM' && <List className="w-3.5 h-3.5 text-indigo-500" />}
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{fv.form_field.field_label}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {fv.file_url && (
                                        <a href={`${import.meta.env.VITE_API_URL}${fv.file_url}`} target="_blank" rel="noreferrer" className="p-1.5 bg-gray-50 text-gray-400 hover:text-brand-600 rounded-lg transition-colors">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {fv.link_value && (
                                        <a href={fv.link_value} target="_blank" rel="noreferrer" className="p-1.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                                            <LinkIcon className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-2">
                                    {fv.form_field.input_type === 'FILE_UPLOAD' ? (
                                        <div className="space-y-2">
                                            <FileUpload
                                                subfolder="submissions"
                                                label="Upload / Ganti File"
                                                onUploadSuccess={(url) => onUpdateValue(idx, 'file_url', url)}
                                            />
                                            {fv.file_url && (
                                                <div className="flex items-center justify-between p-2.5 bg-red-50/50 rounded-xl border border-red-100/50">
                                                    <span className="text-xs font-bold text-red-700 truncate max-w-[75%]">
                                                        {fv.file_url.split('/').pop()}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => onUpdateValue(idx, 'file_url', '')}
                                                        className="flex items-center gap-1 text-[10px] font-black text-red-600 hover:text-red-700 uppercase bg-white border border-red-100 hover:border-red-200 px-2 py-1 rounded-lg shadow-sm transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Hapus
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : fv.form_field.input_type === 'REPEATER' ? (
                                        <div className="space-y-2">
                                            {(() => {
                                                let items: string[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                return (
                                                    <>
                                                        {items.map((item, itemIdx) => (
                                                            <div key={itemIdx} className="flex gap-2 items-center">
                                                                <input
                                                                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                    value={item}
                                                                    onChange={e => {
                                                                        const newItems = [...items];
                                                                        newItems[itemIdx] = e.target.value;
                                                                        onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                    }}
                                                                    placeholder="Bahan/Item..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newItems = items.filter((_, i) => i !== itemIdx);
                                                                        onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                    }}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = [...items, ''];
                                                                onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                            }}
                                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            + Tambah Item
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : fv.form_field.input_type === 'PRODUCT_LIST' ? (
                                        <div className="space-y-4">
                                            {(() => {
                                                interface ProductItem {
                                                    nama: string;
                                                    foto_url: string;
                                                }
                                                let products: ProductItem[] = [];
                                                try {
                                                    products = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(products)) products = [];
                                                } catch { products = []; }

                                                const updateProductRow = (rowIdx: number, fieldKey: keyof ProductItem, fieldValue: any) => {
                                                    const newProducts = [...products];
                                                    newProducts[rowIdx] = {
                                                        ...newProducts[rowIdx],
                                                        [fieldKey]: fieldValue
                                                    };
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
                                                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse min-w-[550px]">
                                                                <thead>
                                                                    <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                        <th className="p-2">Nama</th>
                                                                        <th className="p-2 w-48">Foto</th>
                                                                        <th className="p-2 w-12 text-center">Aksi</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                                                                    {products.map((p, rowIdx) => (
                                                                        <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                            <td className="p-2 font-bold text-gray-400 text-center pt-3.5">{rowIdx + 1}</td>
                                                                            <td className="p-2">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                    placeholder="Jenis produk..."
                                                                                    value={p.nama || ''}
                                                                                    onChange={e => updateProductRow(rowIdx, 'nama', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    {p.foto_url ? (
                                                                                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 p-1 rounded-lg border border-emerald-100 max-w-[200px]">
                                                                                            <img 
                                                                                                src={`${import.meta.env.VITE_API_URL}${p.foto_url}`} 
                                                                                                alt="Product" 
                                                                                                className="w-7 h-7 object-cover rounded border border-emerald-200 shrink-0"
                                                                                            />
                                                                                            <span className="truncate flex-1 text-[9px] font-bold">{p.foto_url.split('/').pop()}</span>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => updateProductRow(rowIdx, 'foto_url', '')}
                                                                                                className="p-0.5 hover:bg-emerald-100 text-red-500 rounded transition-colors shrink-0"
                                                                                            >
                                                                                                &times;
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <label className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/30 hover:bg-brand-50/50 rounded-lg cursor-pointer transition-colors max-w-[130px] justify-center">
                                                                                            <input
                                                                                                type="file"
                                                                                                className="hidden"
                                                                                                onChange={e => e.target.files?.[0] && handleProductPhotoUpload(rowIdx, e.target.files[0])}
                                                                                                accept="image/*"
                                                                                            />
                                                                                            <Upload className="w-3 h-3 text-brand-600" />
                                                                                            <span className="text-[9px] text-brand-700 font-bold uppercase tracking-wider">Pilih Foto</span>
                                                                                        </label>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-2 text-center pt-3.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newProducts = products.filter((_, i) => i !== rowIdx);
                                                                                        onUpdateValue(idx, 'text_value', JSON.stringify(newProducts));
                                                                                    }}
                                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {products.length === 0 && (
                                                                        <tr>
                                                                            <td colSpan={4} className="p-4 text-center text-gray-400 italic">Belum ada produk.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div className="p-2.5 bg-gray-50/50 border-t border-gray-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newProducts = [...products, { nama: '', foto_url: '' }];
                                                                    onUpdateValue(idx, 'text_value', JSON.stringify(newProducts));
                                                                }}
                                                                className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg shadow-sm transition-all"
                                                            >
                                                                 + Tambah Produk
                                                             </button>
                                                         </div>
                                                     </div>
                                                 );
                                             })()}
                                         </div>
                                     ) : fv.form_field.input_type === 'INGREDIENT_LIST' ? (
                                         <div className="space-y-4">
                                             {(() => {
                                                 interface IngredientItem {
                                                     nama: string;
                                                     produsen: string;
                                                     penerbit: string;
                                                     no_id: string;
                                                     tanggal: string;
                                                 }
                                                 let ingredients: IngredientItem[] = [];
                                                 try {
                                                     ingredients = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                     if (!Array.isArray(ingredients)) ingredients = [];
                                                 } catch { ingredients = []; }

                                                 const updateIngredientRow = (rowIdx: number, fieldKey: keyof IngredientItem, fieldValue: any) => {
                                                     const newIngredients = [...ingredients];
                                                     newIngredients[rowIdx] = {
                                                         ...newIngredients[rowIdx],
                                                         [fieldKey]: fieldValue
                                                     };
                                                     onUpdateValue(idx, 'text_value', JSON.stringify(newIngredients));
                                                 };

                                                 return (
                                                     <div className="border border-gray-155 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                         <div className="overflow-x-auto">
                                                             <table className="w-full text-left border-collapse min-w-[650px]">
                                                                 <thead>
                                                                     <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                         <th className="p-2 w-10 text-center">No</th>
                                                                         <th className="p-2">Nama Bahan & Merk</th>
                                                                         <th className="p-2">Produsen</th>
                                                                         <th className="p-2">Penerbit Sertifikat</th>
                                                                         <th className="p-2">No ID SH</th>
                                                                         <th className="p-2">Tanggal Terbit SH</th>
                                                                         <th className="p-2 w-12 text-center">Aksi</th>
                                                                     </tr>
                                                                 </thead>
                                                                 <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                                                                     {ingredients.map((item, rowIdx) => (
                                                                         <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                             <td className="p-2 font-bold text-gray-400 text-center pt-3.5">{rowIdx + 1}</td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="Nama bahan..."
                                                                                     value={item.nama || ''}
                                                                                     onChange={e => updateIngredientRow(rowIdx, 'nama', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="Produsen..."
                                                                                     value={item.produsen || ''}
                                                                                     onChange={e => updateIngredientRow(rowIdx, 'produsen', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="Penerbit..."
                                                                                     value={item.penerbit || ''}
                                                                                     onChange={e => updateIngredientRow(rowIdx, 'penerbit', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="No ID SH..."
                                                                                     value={item.no_id || ''}
                                                                                     onChange={e => updateIngredientRow(rowIdx, 'no_id', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="date"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="Tanggal terbit..."
                                                                                     value={item.tanggal || ''}
                                                                                     onChange={e => updateIngredientRow(rowIdx, 'tanggal', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2 text-center pt-3.5">
                                                                                 <button
                                                                                     type="button"
                                                                                     onClick={() => {
                                                                                         const newIngredients = ingredients.filter((_, i) => i !== rowIdx);
                                                                                         onUpdateValue(idx, 'text_value', JSON.stringify(newIngredients));
                                                                                     }}
                                                                                     className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                 >
                                                                                     <Trash2 className="w-3.5 h-3.5" />
                                                                                 </button>
                                                                             </td>
                                                                         </tr>
                                                                     ))}
                                                                     {ingredients.length === 0 && (
                                                                         <tr>
                                                                             <td colSpan={7} className="p-4 text-center text-gray-400 italic">Belum ada bahan.</td>
                                                                         </tr>
                                                                     )}
                                                                 </tbody>
                                                             </table>
                                                         </div>
                                                         <div className="p-2.5 bg-gray-50/50 border-t border-gray-100">
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     const newIngredients = [...ingredients, { nama: '', produsen: '', penerbit: '', no_id: '', tanggal: '' }];
                                                                     onUpdateValue(idx, 'text_value', JSON.stringify(newIngredients));
                                                                 }}
                                                                 className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg shadow-sm transition-all"
                                                             >
                                                                 + Tambah Bahan
                                                             </button>
                                                         </div>
                                                     </div>
                                                 );
                                             })()}
                                         </div>
                                     ) : fv.form_field.input_type === 'INGREDIENT_MATRIX' ? (
                                         <div className="space-y-4">
                                             {(() => {
                                                 interface MatrixItem {
                                                     nama_produk: string;
                                                     bahan: string[];
                                                 }
                                                 let items: MatrixItem[] = [];
                                                 try {
                                                     items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                     if (!Array.isArray(items)) items = [];
                                                 } catch { items = []; }

                                                 const updateMatrixRow = (rowIdx: number, fieldKey: keyof MatrixItem, fieldValue: any) => {
                                                     const newItems = [...items];
                                                     newItems[rowIdx] = {
                                                         ...newItems[rowIdx],
                                                         [fieldKey]: fieldValue
                                                     };
                                                     onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                 };

                                                 return (
                                                     <div className="border border-gray-155 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                         <div className="overflow-x-auto">
                                                             <table className="w-full text-left border-collapse min-w-[600px]">
                                                                 <thead>
                                                                     <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                         <th className="p-2 w-10 text-center">No</th>
                                                                         <th className="p-2 w-1/3">Jenis Produk</th>
                                                                         <th className="p-2">Bahan Yang Digunakan</th>
                                                                         <th className="p-2 w-12 text-center">Aksi</th>
                                                                     </tr>
                                                                 </thead>
                                                                 <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                                                                     {items.map((row, rowIdx) => (
                                                                         <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                             <td className="p-2 font-bold text-gray-400 text-center pt-3.5">{rowIdx + 1}</td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="Jenis produk..."
                                                                                     value={row.nama_produk || ''}
                                                                                     onChange={e => updateMatrixRow(rowIdx, 'nama_produk', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2">
                                                                                 <div className="flex flex-col gap-1.5">
                                                                                     <div className="flex flex-wrap gap-1">
                                                                                         {(row.bahan || []).map((b, bIdx) => (
                                                                                             <span key={bIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[8px] uppercase tracking-wider">
                                                                                                 {b}
                                                                                                 <button
                                                                                                     type="button"
                                                                                                     onClick={() => {
                                                                                                         const newBahan = row.bahan.filter((_, i) => i !== bIdx);
                                                                                                         updateMatrixRow(rowIdx, 'bahan', newBahan);
                                                                                                     }}
                                                                                                     className="text-red-500 hover:text-red-700"
                                                                                                 >
                                                                                                     &times;
                                                                                                 </button>
                                                                                             </span>
                                                                                         ))}
                                                                                     </div>
                                                                                     <input
                                                                                         type="text"
                                                                                         className="w-full px-2 py-1 bg-gray-50 border-none rounded-lg text-[9px] focus:ring-2 focus:ring-blue-500/10"
                                                                                         placeholder="Bahan + Enter..."
                                                                                         onKeyDown={e => {
                                                                                             if (e.key === 'Enter') {
                                                                                                 e.preventDefault();
                                                                                                 const val = e.currentTarget.value.trim();
                                                                                                 if (val) {
                                                                                                     const newBahan = [...(row.bahan || []), val];
                                                                                                     updateMatrixRow(rowIdx, 'bahan', newBahan);
                                                                                                     e.currentTarget.value = '';
                                                                                                 }
                                                                                             }
                                                                                         }}
                                                                                     />
                                                                                 </div>
                                                                             </td>
                                                                             <td className="p-2 text-center pt-3.5">
                                                                                 <button
                                                                                     type="button"
                                                                                     onClick={() => {
                                                                                         const newItems = items.filter((_, i) => i !== rowIdx);
                                                                                         onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                                     }}
                                                                                     className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                 >
                                                                                     <Trash2 className="w-3.5 h-3.5" />
                                                                                 </button>
                                                                             </td>
                                                                         </tr>
                                                                     ))}
                                                                     {items.length === 0 && (
                                                                         <tr>
                                                                             <td colSpan={4} className="p-4 text-center text-gray-400 italic">Belum ada data.</td>
                                                                         </tr>
                                                                     )}
                                                                 </tbody>
                                                             </table>
                                                         </div>
                                                         <div className="p-2.5 bg-gray-50/50 border-t border-gray-100">
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     const newItems = [...items, { nama_produk: '', bahan: [] }];
                                                                     onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                 }}
                                                                 className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg shadow-sm transition-all"
                                                             >
                                                                 + Tambah Baris
                                                             </button>
                                                         </div>
                                                     </div>
                                                 );
                                             })()}
                                         </div>
                                    ) : fv.form_field.input_type === 'ACTIVITY_PHOTOS' ? (
                                        <div className="space-y-4">
                                            {(() => {
                                                interface ActivityItem {
                                                    nama_kegiatan: string;
                                                    fotos: string[];
                                                }
                                                let items: ActivityItem[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }

                                                const updateActivityRow = (rowIdx: number, fieldKey: keyof ActivityItem, fieldValue: any) => {
                                                    const newItems = [...items];
                                                    newItems[rowIdx] = {
                                                        ...newItems[rowIdx],
                                                        [fieldKey]: fieldValue
                                                    };
                                                    onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                };

                                                const handleActivityPhotoUpload = async (rowIdx: number, files: FileList) => {
                                                    const newPhotos = [...(items[rowIdx]?.fotos || [])];
                                                    for (let i = 0; i < files.length; i++) {
                                                        let file = files[i];
                                                        if (file.type.startsWith('image/')) {
                                                            try { file = await compressImage(file); } catch {}
                                                        }
                                                        if (file.size > 2 * 1024 * 1024) {
                                                            alert("Ukuran file tidak boleh lebih dari 2MB");
                                                            continue;
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
                                                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse min-w-[600px]">
                                                                 <thead>
                                                                     <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                         <th className="p-2 w-10 text-center">No</th>
                                                                         <th className="p-2 w-1/3">Nama Kegiatan</th>
                                                                         <th className="p-2">Foto Kegiatan</th>
                                                                         <th className="p-2 w-12 text-center">Aksi</th>
                                                                     </tr>
                                                                 </thead>
                                                                 <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                                                                     {items.map((row, rowIdx) => (
                                                                         <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                             <td className="p-2 font-bold text-gray-400 text-center pt-3.5">{rowIdx + 1}</td>
                                                                             <td className="p-2">
                                                                                 <input
                                                                                     type="text"
                                                                                     className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                     placeholder="Nama kegiatan..."
                                                                                     value={row.nama_kegiatan || ''}
                                                                                     onChange={e => updateActivityRow(rowIdx, 'nama_kegiatan', e.target.value)}
                                                                                 />
                                                                             </td>
                                                                             <td className="p-2">
                                                                                 <div className="flex flex-col gap-2">
                                                                                     <div className="flex flex-wrap gap-1.5">
                                                                                         {(row.fotos || []).map((fUrl, fIdx) => (
                                                                                             <div key={fIdx} className="relative group/photo w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 shrink-0">
                                                                                                 <img
                                                                                                     src={`${import.meta.env.VITE_API_URL}${fUrl}`}
                                                                                                     alt="Kegiatan"
                                                                                                     className="w-full h-full object-cover"
                                                                                                 />
                                                                                                 <button
                                                                                                     type="button"
                                                                                                     onClick={() => {
                                                                                                         const newPhotos = row.fotos.filter((_, i) => i !== fIdx);
                                                                                                         updateActivityRow(rowIdx, 'fotos', newPhotos);
                                                                                                     }}
                                                                                                     className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-90"
                                                                                                 >
                                                                                                     <Trash2 className="w-2.5 h-2.5 text-white" />
                                                                                                 </button>
                                                                                             </div>
                                                                                         ))}
                                                                                     </div>
                                                                                     <label className="flex items-center gap-1 px-2 py-1 border border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/40 rounded-lg cursor-pointer transition-colors max-w-[180px] justify-center">
                                                                                         <input
                                                                                             type="file"
                                                                                             className="hidden"
                                                                                             multiple
                                                                                             onChange={e => e.target.files && handleActivityPhotoUpload(rowIdx, e.target.files)}
                                                                                             accept="image/*"
                                                                                         />
                                                                                         <Upload className="w-3 h-3 text-brand-600" />
                                                                                         <span className="text-[8px] text-brand-700 font-bold uppercase tracking-wider">Pilih Foto / Ambil Gambar</span>
                                                                                     </label>
                                                                                 </div>
                                                                             </td>
                                                                             <td className="p-2 text-center pt-3.5">
                                                                                 <button
                                                                                     type="button"
                                                                                     onClick={() => {
                                                                                         const newItems = items.filter((_, i) => i !== rowIdx);
                                                                                         onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                                     }}
                                                                                     className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                 >
                                                                                     <Trash2 className="w-3.5 h-3.5" />
                                                                                 </button>
                                                                             </td>
                                                                         </tr>
                                                                     ))}
                                                                     {items.length === 0 && (
                                                                         <tr>
                                                                             <td colSpan={4} className="p-4 text-center text-gray-400 italic">Belum ada data.</td>
                                                                         </tr>
                                                                     )}
                                                                 </tbody>
                                                             </table>
                                                         </div>
                                                         <div className="p-2.5 bg-gray-50/50 border-t border-gray-100">
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     const newItems = [...items, { nama_kegiatan: '', fotos: [] }];
                                                                     onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                 }}
                                                                 className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg shadow-sm transition-all"
                                                             >
                                                                 + Tambah Baris
                                                             </button>
                                                         </div>
                                                     </div>
                                                 );
                                             })()}
                                         </div>
                                    ) : fv.form_field.input_type === 'HALAL_TEAM' ? (
                                        <div className="space-y-4">
                                            {(() => {
                                                interface HalalTeamItem {
                                                    nama: string;
                                                    jabatan: string;
                                                    posisi_tim: string;
                                                    ttd_url: string;
                                                }
                                                let items: HalalTeamItem[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }

                                                const updateTeamRow = (rowIdx: number, fieldKey: keyof HalalTeamItem, fieldValue: any) => {
                                                    const newItems = [...items];
                                                    newItems[rowIdx] = {
                                                        ...newItems[rowIdx],
                                                        [fieldKey]: fieldValue
                                                    };
                                                    onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                };

                                                const handleSignatureUpload = async (rowIdx: number, file: File) => {
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
                                                        const res = await api.post(`/media/upload?subfolder=submissions`, formData);
                                                        updateTeamRow(rowIdx, 'ttd_url', res.data.url);
                                                    } catch {
                                                        alert("Gagal mengunggah tanda tangan");
                                                    }
                                                };

                                                return (
                                                    <div className="border border-gray-155 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse min-w-[650px]">
                                                                <thead>
                                                                    <tr className="bg-gray-50/75 border-b border-gray-100 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                                        <th className="p-2 w-10 text-center">No</th>
                                                                        <th className="p-2">Nama</th>
                                                                        <th className="p-2">Jabatan</th>
                                                                        <th className="p-2">Posisi Di Tim</th>
                                                                        <th className="p-2 w-48">Tanda Tangan</th>
                                                                        <th className="p-2 w-12 text-center">Aksi</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                                                                    {items.map((row, rowIdx) => (
                                                                        <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors align-top">
                                                                            <td className="p-2 font-bold text-gray-400 text-center pt-3.5">{rowIdx + 1}</td>
                                                                            <td className="p-2">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                    placeholder="Nama..."
                                                                                    value={row.nama || ''}
                                                                                    onChange={e => updateTeamRow(rowIdx, 'nama', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                    placeholder="Jabatan..."
                                                                                    value={row.jabatan || ''}
                                                                                    onChange={e => updateTeamRow(rowIdx, 'jabatan', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full px-2.5 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                                                    placeholder="Posisi di tim..."
                                                                                    value={row.posisi_tim || ''}
                                                                                    onChange={e => updateTeamRow(rowIdx, 'posisi_tim', e.target.value)}
                                                                                />
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    {row.ttd_url ? (
                                                                                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 p-1 rounded-lg border border-emerald-100 max-w-[200px]">
                                                                                            <img
                                                                                                src={`${import.meta.env.VITE_API_URL}${row.ttd_url}`}
                                                                                                alt="Ttd"
                                                                                                className="w-8 h-8 object-contain rounded border border-emerald-200 shrink-0 bg-white"
                                                                                            />
                                                                                            <span className="truncate flex-1 text-[9px] font-bold">{row.ttd_url.split('/').pop()}</span>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => updateTeamRow(rowIdx, 'ttd_url', '')}
                                                                                                className="p-0.5 hover:bg-emerald-100 text-red-500 rounded transition-colors shrink-0"
                                                                                            >
                                                                                                &times;
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <label className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/40 rounded-lg cursor-pointer transition-colors max-w-[130px] justify-center">
                                                                                            <input
                                                                                                type="file"
                                                                                                className="hidden"
                                                                                                onChange={e => e.target.files?.[0] && handleSignatureUpload(rowIdx, e.target.files[0])}
                                                                                                accept="image/*"
                                                                                            />
                                                                                            <Upload className="w-3 h-3 text-brand-600" />
                                                                                            <span className="text-[9px] text-brand-700 font-bold uppercase tracking-wider">Ttd / Kamera</span>
                                                                                        </label>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-2 text-center pt-3.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newItems = items.filter((_, i) => i !== rowIdx);
                                                                                        onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                                    }}
                                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {items.length === 0 && (
                                                                        <tr>
                                                                            <td colSpan={6} className="p-4 text-center text-gray-400 italic">Belum ada data.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div className="p-2.5 bg-gray-50/50 border-t border-gray-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newItems = [...items, { nama: '', jabatan: '', posisi_tim: '', ttd_url: '' }];
                                                                    onUpdateValue(idx, 'text_value', JSON.stringify(newItems));
                                                                }}
                                                                className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg shadow-sm transition-all"
                                                            >
                                                                + Tambah Anggota
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                         </div>
                                    ) : fv.form_field.input_type === 'DATE' ? (
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                            value={fv.text_value || ''}
                                            onChange={e => onUpdateValue(idx, 'text_value', e.target.value)}
                                        />
                                    ) : (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 font-medium"
                                                value={fv.link_value || fv.text_value || ''}
                                                onChange={e => onUpdateValue(idx, fv.form_field.input_type === 'LINK' ? 'link_value' : 'text_value', e.target.value)}
                                                placeholder={`Masukkan ${fv.form_field.field_label}...`}
                                            />
                                            {(fv.link_value || fv.text_value) && (
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateValue(idx, fv.form_field.input_type === 'LINK' ? 'link_value' : 'text_value', '')}
                                                    className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-100 hover:border-red-100"
                                                    title="Hapus Nilai"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                                    {fv.file_url || fv.link_value || fv.text_value ? (
                                        fv.form_field.input_type === 'REPEATER' ? (
                                            (() => {
                                                let items: string[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                if (items.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return items.map((item, itemIdx) => (
                                                    <span key={itemIdx} className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                                                        {item}
                                                    </span>
                                                ));
                                            })()
                                        ) : fv.form_field.input_type === 'PRODUCT_LIST' ? (
                                            (() => {
                                                interface ProductItem {
                                                    nama: string;
                                                    foto_url: string;
                                                }
                                                let products: ProductItem[] = [];
                                                try {
                                                    products = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(products)) products = [];
                                                } catch { products = []; }
                                                if (products.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return (
                                                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 mt-1">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <thead>
                                                                <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400 tracking-wider">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2">Nama</th>
                                                                    <th className="p-2 w-28">Foto</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {products.map((p, pIdx) => (
                                                                    <tr key={pIdx} className="align-middle">
                                                                        <td className="p-2 text-center font-bold text-gray-400">{pIdx + 1}</td>
                                                                        <td className="p-2 font-bold text-gray-800">{p.nama}</td>
                                                                        <td className="p-2">
                                                                            {p.foto_url ? (
                                                                                <a href={`${import.meta.env.VITE_API_URL}${p.foto_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-brand-600 font-medium">
                                                                                    <img 
                                                                                        src={`${import.meta.env.VITE_API_URL}${p.foto_url}`} 
                                                                                        alt={p.nama} 
                                                                                        className="w-6 h-6 object-cover rounded border border-gray-100 shrink-0"
                                                                                    />
                                                                                    <span className="truncate text-[8px] max-w-[60px]">{p.foto_url.split('/').pop()}</span>
                                                                                </a>
                                                                            ) : (
                                                                                <span className="text-[8px] text-gray-300 italic">Tidak ada foto</span>
                                                                            )}
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
                                                interface IngredientItem {
                                                    nama: string;
                                                    produsen: string;
                                                    penerbit: string;
                                                    no_id: string;
                                                    tanggal: string;
                                                }
                                                let ingredients: IngredientItem[] = [];
                                                try {
                                                    ingredients = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(ingredients)) ingredients = [];
                                                } catch { ingredients = []; }
                                                if (ingredients.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return (
                                                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 mt-1">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <thead>
                                                                <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400 tracking-wider">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2">Nama Bahan & Merk</th>
                                                                    <th className="p-2">Produsen</th>
                                                                    <th className="p-2">Penerbit Sertifikat</th>
                                                                    <th className="p-2">No ID SH</th>
                                                                    <th className="p-2">Tanggal Terbit SH</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {ingredients.map((item, pIdx) => (
                                                                    <tr key={pIdx} className="align-middle">
                                                                        <td className="p-2 text-center font-bold text-gray-400">{pIdx + 1}</td>
                                                                        <td className="p-2 font-bold text-gray-800">{item.nama}</td>
                                                                        <td className="p-2">{item.produsen || '-'}</td>
                                                                        <td className="p-2">{item.penerbit || '-'}</td>
                                                                        <td className="p-2 font-mono text-[9px]">{item.no_id || '-'}</td>
                                                                        <td className="p-2">{item.tanggal || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })()
                                        ) : fv.form_field.input_type === 'INGREDIENT_MATRIX' ? (
                                            (() => {
                                                interface MatrixItem {
                                                    nama_produk: string;
                                                    bahan: string[];
                                                }
                                                let items: MatrixItem[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                if (items.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return (
                                                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 mt-1">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <thead>
                                                                <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400 tracking-wider">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2 w-1/3">Jenis Produk</th>
                                                                    <th className="p-2">Bahan Yang Digunakan</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {items.map((row, pIdx) => (
                                                                    <tr key={pIdx} className="align-top">
                                                                        <td className="p-2 text-center font-bold text-gray-400 pt-3">{pIdx + 1}</td>
                                                                        <td className="p-2 font-bold text-gray-800 pt-3">{row.nama_produk}</td>
                                                                        <td className="p-2 pt-3">
                                                                            <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                                                                                {(row.bahan || []).map((b, bIdx) => (
                                                                                    <li key={bIdx}>{b}</li>
                                                                                ))}
                                                                                {(row.bahan || []).length === 0 && (
                                                                                    <span className="text-[10px] text-gray-300 italic">-</span>
                                                                                )}
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
                                                interface ActivityItem {
                                                    nama_kegiatan: string;
                                                    fotos: string[];
                                                }
                                                let items: ActivityItem[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                if (items.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return (
                                                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 mt-1">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <thead>
                                                                <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400 tracking-wider">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2 w-1/3">Nama Kegiatan</th>
                                                                    <th className="p-2">Foto Kegiatan</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {items.map((row, pIdx) => (
                                                                    <tr key={pIdx} className="align-top">
                                                                        <td className="p-2 text-center font-bold text-gray-400 pt-3">{pIdx + 1}</td>
                                                                        <td className="p-2 font-bold text-gray-800 pt-3">{row.nama_kegiatan}</td>
                                                                        <td className="p-2 pt-3">
                                                                            <div className="flex flex-wrap gap-1.5 pb-1.5">
                                                                                {(row.fotos || []).map((fUrl, fIdx) => (
                                                                                    <a
                                                                                        key={fIdx}
                                                                                        href={`${import.meta.env.VITE_API_URL}${fUrl}`}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="block w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-brand-400 transition-colors shrink-0 bg-gray-50"
                                                                                    >
                                                                                        <img
                                                                                            src={`${import.meta.env.VITE_API_URL}${fUrl}`}
                                                                                            alt="Kegiatan"
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    </a>
                                                                                ))}
                                                                                {(row.fotos || []).length === 0 && (
                                                                                    <span className="text-[10px] text-gray-300 italic">Tidak ada foto</span>
                                                                                )}
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
                                                interface HalalTeamItem {
                                                    nama: string;
                                                    jabatan: string;
                                                    posisi_tim: string;
                                                    ttd_url: string;
                                                }
                                                let items: HalalTeamItem[] = [];
                                                try {
                                                    items = fv.text_value ? JSON.parse(fv.text_value) : [];
                                                    if (!Array.isArray(items)) items = [];
                                                } catch { items = []; }
                                                if (items.length === 0) return <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>;
                                                return (
                                                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 mt-1">
                                                        <table className="w-full text-left border-collapse text-[10px]">
                                                            <thead>
                                                                <tr className="bg-gray-100 border-b border-gray-100 text-[8px] font-black uppercase text-gray-400 tracking-wider">
                                                                    <th className="p-2 w-10 text-center">No</th>
                                                                    <th className="p-2">Nama</th>
                                                                    <th className="p-2">Jabatan</th>
                                                                    <th className="p-2">Posisi Di Tim</th>
                                                                    <th className="p-2 w-20">Ttd</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50 text-gray-600">
                                                                {items.map((row, pIdx) => (
                                                                    <tr key={pIdx} className="align-middle">
                                                                        <td className="p-2 text-center font-bold text-gray-400">{pIdx + 1}</td>
                                                                        <td className="p-2 font-bold text-gray-800">{row.nama}</td>
                                                                        <td className="p-2">{row.jabatan}</td>
                                                                        <td className="p-2">{row.posisi_tim}</td>
                                                                        <td className="p-2">
                                                                            {row.ttd_url ? (
                                                                                <a href={`${import.meta.env.VITE_API_URL}${row.ttd_url}`} target="_blank" rel="noreferrer" className="block w-10 h-10 border border-gray-100 hover:border-brand-400 rounded bg-white">
                                                                                    <img
                                                                                        src={`${import.meta.env.VITE_API_URL}${row.ttd_url}`}
                                                                                        alt="Ttd"
                                                                                        className="w-full h-full object-contain"
                                                                                    />
                                                                                </a>
                                                                            ) : (
                                                                                <span className="text-[9px] text-gray-300 italic">-</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                {fv.file_url ? 'Dokumen Terupload' : (fv.link_value || fv.text_value)}
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-xs font-medium text-gray-300 italic">Belum diisi</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
