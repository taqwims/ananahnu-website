import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import iconImg from '../../assets/icon.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
  iconOnly?: boolean;
  clickable?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md',
  variant = 'default',
  iconOnly = false,
  clickable = true
}) => {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-32'
  };

  const currentHeight = sizeMap[size];
  const isWhite = variant === 'white';

  const logoElement = (
    <img 
      src={iconOnly ? iconImg : logoImg} 
      alt="Halal Core Logo" 
      className={`${currentHeight} w-auto object-contain ${isWhite ? 'brightness-0 invert' : ''}`}
    />
  );

  return (
    <div className={`flex items-center ${className}`}>
      {clickable ? (
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
          {logoElement}
        </Link>
      ) : (
        logoElement
      )}
    </div>
  );
};

export default Logo;


