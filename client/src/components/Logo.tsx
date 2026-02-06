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
  const useDark = variant === "dark" || variant === "black";
  const logoSrc = useDark ? darkLogoImage : whiteLogoImage;

  const imgClass = location === "footer"
    ? "h-[4rem] md:h-[5rem] lg:h-[6rem] w-auto scale-x-[1.1]"
    : "h-[3.3rem] md:h-[3.85rem] lg:h-[4.62rem] w-auto scale-x-[1.1] ml-[16px] mr-[16px] -my-2 pt-[1px] pb-[1px]";
    
  return (
    <div className="flex items-center">
      <img 
        src={logoSrc} 
        alt="Vape Cave Smoke & Stuff" 
        className={imgClass}
      />
    </div>
  );
};

export default Logo;
