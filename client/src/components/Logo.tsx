import React from "react";
import orangeLogoImage from "../assets/vapecave-logo.png";
import blackLogoImage from "../assets/vapecave-logo-black-optimized.png";
import blackLogoWebP from "../assets/vapecave-logo-black.webp";

interface LogoProps {
  variant?: "orange" | "black";
  location?: "header" | "footer";
}

const Logo: React.FC<LogoProps> = ({ 
  variant = "orange", 
  location = "header" 
}) => {
  // Different sizing based on location
  const sizeClasses = location === "header" 
    ? "h-10 md:h-12 lg:h-14 w-auto" 
    : "h-12 md:h-16 lg:h-20 w-auto";
    
  return (
    <div className="flex items-center">
      {variant === "orange" ? (
        <img 
          src={orangeLogoImage} 
          alt="Vape Cave - Smoke & Stuff" 
          className={sizeClasses}
        />
      ) : (
        <picture>
          <source srcSet={blackLogoWebP} type="image/webp" />
          <img 
            src={blackLogoImage} 
            alt="Vape Cave - Smoke & Stuff" 
            className={sizeClasses}
            width="840"
            height="140"
          />
        </picture>
      )}
    </div>
  );
};

export default Logo;
