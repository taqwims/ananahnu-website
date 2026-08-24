import React from 'react';
import logoImg from '../../assets/logo.png';
import ananahnuLogoImg from '../../assets/ananahnu-logo.png';

interface LogoProps {
    className?: string;
    showTagline?: boolean;
    showPoweredBy?: boolean;
    poweredByText?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ 
    className = "", 
    size = 'md',
    variant = 'default',
    showPoweredBy = false,
    poweredByText = "powered by"
}) => {
    const sizeMap = {
        xs: { main: 'h-6', sub: 'h-3.5', text: 'text-[9px]' },
        sm: { main: 'h-8', sub: 'h-4', text: 'text-[10px]' },
        md: { main: 'h-10', sub: 'h-5', text: 'text-[11px]' },
        lg: { main: 'h-16', sub: 'h-7', text: 'text-xs' },
        xl: { main: 'h-24', sub: 'h-9', text: 'text-sm' }
    };

    const currentSize = sizeMap[size] || sizeMap.md;
    const isWhite = variant === 'white';

    return (
        <div className={`inline-flex flex-col items-start ${className}`}>
            <img 
                src={logoImg} 
                alt="HalalCore" 
                className={`${currentSize.main} w-auto object-contain ${isWhite ? 'brightness-0 invert' : ''}`}
            />
            {showPoweredBy && (
                <div className={`flex items-center gap-1.5 mt-0.5 ${isWhite ? 'text-emerald-200/80' : 'text-gray-500'}`}>
                    <span className={`${currentSize.text} font-medium tracking-tight lowercase`}>
                        {poweredByText}
                    </span>
                    <img 
                        src={ananahnuLogoImg} 
                        alt="Ana Nahnu Indonesia" 
                        className={`${currentSize.sub} w-auto object-contain ${isWhite ? 'brightness-0 invert opacity-90' : ''}`}
                    />
                </div>
            )}
        </div>
    );
};

export default Logo;
