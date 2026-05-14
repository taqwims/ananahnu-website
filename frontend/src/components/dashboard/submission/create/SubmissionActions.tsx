import { Save, Loader2 } from 'lucide-react';

interface SubmissionActionsProps {
    onSave: () => void;
    saving: boolean;
    isVerified: boolean | null;
}

export const SubmissionActions = ({
    onSave,
    saving,
    isVerified
}: SubmissionActionsProps) => {
    return (
        <div className="glass-panel p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Aksi</h3>
            <div className="space-y-3">
                <button
                    onClick={onSave}
                    disabled={saving || isVerified === false}
                    className={`w-full glass-button flex justify-center items-center gap-2 ${
                        isVerified === false 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                    }`}
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Simpan Data
                </button>
                {isVerified === false && (
                    <p className="text-[10px] text-red-500 font-medium text-center">
                        Tombol dinonaktifkan karena akun belum terverifikasi atau belum lulus pelatihan.
                    </p>
                )}

                <p className="text-[10px] text-gray-400 text-center">
                    Data belum akan tersimpan ke server sebelum Anda menekan tombol Simpan di atas.
                </p>
            </div>
        </div>
    );
};
