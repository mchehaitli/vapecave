import React from "react";
import whiteLogoImage from "../assets/vapecave-logo-white-transparent.png";
import darkLogoImage from "../assets/vapecave-logo-dark.jpeg";

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

  const useDark = variant === "dark";
  const logoSrc = useDark ? darkLogoImage : whiteLogoImage;
    
  return (
    <div className="flex items-center">
      <img 
        src={logoSrc} 
        alt="Vape Cave Smoke & Stuff" 
        className="h-12 md:h-14 lg:h-[4.2rem] w-auto pl-[0px] pr-[0px] pt-[0px] pb-[0px] ml-[-4px] mr-[-4px]"
      />
    </div>
  );
};

export default Logo;
