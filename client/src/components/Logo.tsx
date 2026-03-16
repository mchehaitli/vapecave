import React from "react";
import whiteLogoImage from "../assets/vapecave-logo-white-transparent.webp";
import darkLogoImage from "../assets/vapecave-logo-dark.webp";

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

  const isHeader = location !== "footer";

  const imgClass = location === "footer"
    ? "h-[5rem] md:h-[6rem] lg:h-[7rem] w-auto scale-x-[1.1]"
    : "h-[3.8rem] md:h-[4.5rem] lg:h-[5.2rem] w-auto scale-x-[1.1] ml-[16px] mr-[16px] -my-3 pt-[1px] pb-[1px]";
    
  return (
    <div className="flex items-center">
      <img 
        src={logoSrc} 
        alt="Vape Cave Frisco - Logo" 
        width={isHeader ? 200 : 280}
        height={isHeader ? 60 : 100}
        loading={isHeader ? "eager" : "lazy"}
        decoding="async"
        className={imgClass}
      />
    </div>
  );
};

export default Logo;
