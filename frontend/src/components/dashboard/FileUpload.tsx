import React, { useState } from 'react';
import { Upload, Loader2, XCircle } from 'lucide-react';
import api from '../../services/api';
import { compressImage } from '../../utils/compressor';

interface FileUploadProps {
    onUploadSuccess: (url: string) => void;
    subfolder?: string;
    accept?: string;
    label?: string;
    className?: string;
}

export default function FileUpload({ 
    onUploadSuccess, 
    subfolder = 'general', 
    accept = 'image/*,.pdf', 
    label = 'Pilih File',
    className = ''
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        // Kompres jika file adalah gambar
        if (file.type.startsWith('image/')) {
            try {
                file = await compressImage(file);
            } catch (err) {
                console.error('Image compression failed:', err);
            }
        }

        // Max 2MB setelah kompresi
        if (file.size > 2 * 1024 * 1024) {
            setError('Ukuran file maksimal 2MB');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/media/upload?subfolder=${subfolder}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUploadSuccess(res.data.url);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.error || 'Gagal mengunggah file');
        } finally {
            setUploading(false);
        }
    };


    const uploadId = React.useId();

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    id={uploadId}
                    className="hidden"
                    accept={accept}
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                <label
                    htmlFor={uploadId}
                    className={`flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        uploading ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 
                        'bg-brand-50/30 border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-400'
                    } ${className}`}
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {label && <span className="text-xs font-semibold">{uploading ? 'Mengunggah...' : label}</span>}
                </label>
            </div>
            {error && (
                <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium mt-1">
                    <XCircle className="w-3 h-3" />
                    {error}
                </div>
            )}
        </div>
    );
}
