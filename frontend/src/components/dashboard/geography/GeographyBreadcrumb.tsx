import { Map, Building2, Navigation, ChevronRight } from 'lucide-react';
import type { Province, Regency } from '../../../types';

interface GeographyBreadcrumbProps {
    selectedProvince: Province | null;
    selectedRegency: Regency | null;
    onReset: () => void;
    onBackToProvince: () => void;
}

export const GeographyBreadcrumb = ({
    selectedProvince,
    selectedRegency,
    onReset,
    onBackToProvince
}: GeographyBreadcrumbProps) => {
    return (
        <div className="bg-gray-50/50 border-b border-gray-100 p-4">
            <div className="flex items-center gap-2 text-sm">
                <button 
                    onClick={onReset}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${!selectedProvince ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <Map className="w-4 h-4" />
                    Provinsi
                </button>
                
                {selectedProvince && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <button 
                            onClick={onBackToProvince}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${!selectedRegency ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Building2 className="w-4 h-4" />
                            {selectedProvince.name}
                        </button>
                    </>
                )}
                
                {selectedRegency && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold">
                            <Navigation className="w-4 h-4" />
                            {selectedRegency.name}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
