import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

function Logo({ size = 24, className = "", showText = true, textClassName = "" }: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img 
        src="/Logo.png" 
        alt="HealthBill Pro Logo" 
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export default Logo;
