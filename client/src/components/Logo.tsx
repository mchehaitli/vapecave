import React from "react";
import whiteLogoImage from "../assets/vapecave-logo-white-transparent.png";
import darkLogoImage from "../assets/vapecave-logo-dark.png";

interface LogoProps {
  variant?: "orange" | "black" | "white" | "dark";
  location?: "header" | "footer";
}

const Logo: React.FC<LogoProps> = ({ 
  variant = "orange", 
  location = "header" 
}) => {
  const sizeClasses = location === "header" 
    ? "h-10 md:h-12 lg:h-14 w-auto" 
    : "h-12 md:h-16 lg:h-20 w-auto";

  const useDark = variant === "dark" || variant === "black";
  const logoSrc = useDark ? darkLogoImage : whiteLogoImage;
    
  return (
    <div className="flex items-center">
      <img 
        src={logoSrc} 
        alt="Vape Cave Smoke & Stuff" 
        className="h-[3.3rem] md:h-[3.85rem] lg:h-[4.62rem] w-auto scale-x-[1.1] pl-[0px] pr-[0px] pt-[0px] pb-[0px] ml-[16px] mr-[16px] -my-2"
      />
    </div>
  );
};

export default Logo;
