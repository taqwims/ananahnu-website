import { AlertCircle } from 'lucide-react';

interface VerificationAlertProps {
    isVerified: boolean | null;
    verStatus: { profile: boolean; training: boolean } | null;
    onNavigateProfile: () => void;
}

export const VerificationAlert = ({
    isVerified,
    verStatus,
    onNavigateProfile
}: VerificationAlertProps) => {
    if (isVerified !== false) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-red-900">Akses Dibatasi</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Mohon maaf, Anda belum dapat membuat pengajuan baru. Pastikan status verifikasi akun Anda <b>{verStatus?.profile ? 'Terverifikasi' : 'Belum Terverifikasi'}</b> dan status kelulusan pelatihan Anda <b>{verStatus?.training ? 'Lulus' : 'Belum Lulus'}</b>.
                    Silakan cek status di <span className="font-bold cursor-pointer underline" onClick={onNavigateProfile}>Profil Konsultan</span>.
                </p>
            </div>
        </div>
    );
};
