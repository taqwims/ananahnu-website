import React from 'react';
import logoImg from '../../assets/logo.png';

interface LogoProps {
    className?: string;
    showTagline?: boolean; // Tagline might be in the image already
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ 
    className = "", 
    size = 'md',
    variant = 'default'
}) => {
    const sizeMap = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-20',
        xl: 'h-32'
    };

    const currentHeight = sizeMap[size];
    const isWhite = variant === 'white';

    return (
        <div className={`flex items-center ${className}`}>
            <img 
                src={logoImg} 
                alt="Halal Core Logo" 
                className={`${currentHeight} w-auto object-contain ${isWhite ? 'brightness-0 invert' : ''}`}
            />
        </div>
    );
};

export default Logo;
