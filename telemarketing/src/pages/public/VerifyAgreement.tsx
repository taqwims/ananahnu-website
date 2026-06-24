import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyAgreement, downloadAgreementPDF } from '../../services/teleService';
import { CheckCircle, AlertTriangle, XCircle, Download, Loader2 } from 'lucide-react';

export const VerifyAgreement: React.FC = () => {
  const { id, token } = useParams<{ id: string; token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!id || !token) {
      setError("Link verifikasi tidak valid.");
      setLoading(false);
      return;
    }

    const checkVerification = async () => {
      try {
        const response = await verifyAgreement(id, token);
        setResult(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Gagal memverifikasi dokumen.");
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [id, token]);

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      const response = await downloadAgreementPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Agreement_${result?.agreement_number || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      alert("Gagal mengunduh dokumen PDF.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <XCircle className="text-red-500 w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifikasi Gagal</h1>
        <p className="text-gray-600 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {result?.status === 'VALID' && (
          <>
            <CheckCircle className="text-emerald-500 w-16 h-16 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Dokumen Valid</h1>
            <p className="text-green-600 font-medium mb-6">Integritas dokumen dan tanda tangan terjamin.</p>
          </>
        )}
        
        {result?.status === 'TAMPERED' && (
          <>
            <AlertTriangle className="text-amber-500 w-16 h-16 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Peringatan: Dokumen Berubah</h1>
            <p className="text-yellow-600 font-medium mb-6">Data pada dokumen ini tidak sesuai dengan saat dokumen ditandatangani.</p>
          </>
        )}

        {result?.status === 'INVALID' && (
          <>
            <XCircle className="text-rose-500 w-16 h-16 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Dokumen Tidak Valid</h1>
            <p className="text-red-600 font-medium mb-6">Dokumen tidak ditemukan atau tanda tangan digital tidak sah.</p>
          </>
        )}

        {result?.status !== 'INVALID' && (
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6 text-sm border border-gray-100">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <span className="text-gray-500">Nomor</span>
              <span className="col-span-2 font-medium text-gray-800">{result?.agreement_number}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <span className="text-gray-500">Usaha</span>
              <span className="col-span-2 font-medium text-gray-800">{result?.business_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <span className="text-gray-500">Penanggung Jawab</span>
              <span className="col-span-2 font-medium text-gray-800">{result?.pic_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500">Tanggal</span>
              <span className="col-span-2 font-medium text-gray-800">
                {result?.signed_at ? new Date(result.signed_at).toLocaleString('id-ID') : '-'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleDownloadPDF}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          Unduh Dokumen Asli (PDF)
        </button>
        
        <div className="mt-6 text-xs text-gray-400">
          Dikeluarkan oleh PT Ana Nahnu Indonesia (Halalcore)
        </div>
      </div>
    </div>
  );
};
