import Modal from '../../ui/Modal';
import { Shield, Key } from 'lucide-react';

interface PasswordResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    password: string;
    isReset: boolean;
}

export const PasswordResultModal = ({
    isOpen,
    onClose,
    password,
    isReset
}: PasswordResultModalProps) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title="Informasi Password"
            maxWidth="lg"
        >
            <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <p className="text-sm text-emerald-800 font-bold mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" /> 
                        {isReset ? 'Password Berhasil Direset' : 'User Berhasil Dibuat'}
                    </p>
                    <p className="text-xs text-emerald-600 mb-1">Password sementara:</p>
                    <div className="font-mono text-2xl font-black text-emerald-900 bg-white border-2 border-emerald-100 px-4 py-3 rounded-xl select-all flex items-center justify-between">
                        {password}
                        <Key className="w-5 h-5 opacity-20" />
                    </div>
                    <p className="text-[10px] text-emerald-500 mt-4 leading-relaxed font-bold uppercase tracking-widest">
                        SALIN PASSWORD INI. PASSWORD TIDAK AKAN DITAMPILKAN LAGI DEMI KEAMANAN.
                    </p>
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                        Saya Sudah Menyalin
                    </button>
                </div>
            </div>
        </Modal>
    );
};
