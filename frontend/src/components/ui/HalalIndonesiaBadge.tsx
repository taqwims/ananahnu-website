import React from 'react';
import halalIndonesiaLogoImg from '../../assets/halal-indonesia-logo.png';

export const HalalIndonesiaGunungan: React.FC<{ className?: string }> = ({ className = "h-10 sm:h-12 lg:h-14 w-auto" }) => {
    return (
        <img 
            src={halalIndonesiaLogoImg} 
            alt="Logo Halal Indonesia BPJPH" 
            className={`${className} object-contain`} 
        />
    );
};

export const HalalIndonesiaBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div className={`bg-white/95 backdrop-blur-md border border-gray-100/90 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col items-center text-center ${className}`}>
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-1.5">Terintegrasi dengan</span>
            <div className="flex items-center justify-center mb-1.5 px-1">
                <img 
                    src={halalIndonesiaLogoImg} 
                    alt="Logo Resmi Halal Indonesia" 
                    className="h-10 sm:h-12 lg:h-13 w-auto object-contain hover:scale-105 transition-transform"
                />
            </div>
            <div className="text-[9px] sm:text-[10px] text-gray-600 font-semibold bg-gray-50 px-2 sm:px-2.5 py-1 rounded-full border border-gray-100 whitespace-nowrap">
                Sesuai ketentuan <span className="font-bold text-gray-800">BPJPH & SIHALAL</span>
            </div>
        </div>
    );
};

export default HalalIndonesiaBadge;
