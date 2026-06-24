import { Calculator } from 'lucide-react';
import KalkulatorStandalone from '../../components/dashboard/KalkulatorStandalone';

export default function EstimasiBiaya() {
    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-xl">
                            <Calculator className="w-6 h-6 text-brand-600" />
                        </div>
                        Perhitungan Biaya
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Hitung dan simulasikan rincian biaya sertifikasi halal secara instan</p>
                </div>
            </div>

            <KalkulatorStandalone />
        </div>
    );
}
