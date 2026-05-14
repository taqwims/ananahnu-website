import { CheckCircle, Upload, FileText } from 'lucide-react';

interface SubmissionCertificateProps {
    shUrl: string;
}

export const SubmissionCertificate = ({ shUrl }: SubmissionCertificateProps) => {
    const fullUrl = `${import.meta.env.VITE_API_URL}${shUrl}`;
    const isImage = shUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

    return (
        <div className="glass-panel p-6 bg-emerald-50/40 border-emerald-200 shadow-xl shadow-emerald-100/50">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-black text-emerald-800 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    Sertifikat Halal Terbit
                </h3>
                <a 
                    href={fullUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                    <Upload className="w-4 h-4 rotate-180" />
                    Unduh Sertifikat
                </a>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-emerald-100 bg-white shadow-inner">
                {isImage ? (
                    <img 
                        src={fullUrl} 
                        alt="Sertifikat Halal" 
                        className="w-full h-auto max-h-[600px] object-contain mx-auto p-4"
                    />
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-emerald-600 gap-4">
                        <div className="p-6 bg-emerald-50 rounded-full">
                            <FileText className="w-12 h-12 opacity-40" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black uppercase tracking-widest">Dokumen Sertifikat (PDF)</p>
                            <a 
                                href={fullUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-brand-600 font-bold hover:underline text-xs mt-1 block"
                            >
                                Buka Dokumen PDF di Tab Baru
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
