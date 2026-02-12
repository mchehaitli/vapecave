import React from 'react';

interface DirectionsButtonProps {
  address: string;
  lat: number;
  lng: number;
  buttonText?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  fullWidth?: boolean;
  googlePlaceId?: string;
  appleMapsLink?: string;
}

const DirectionsButton: React.FC<DirectionsButtonProps> = ({
  address,
  lat,
  lng,
  buttonText = 'Get Directions',
  className = '',
  variant = 'primary',
  size = 'md',
  showIcon = true,
  fullWidth = false,
  googlePlaceId,
  appleMapsLink
}) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const getDirectionsUrl = () => {
    const encodedAddress = encodeURIComponent(address);
    const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
    const city = cityMatch ? cityMatch[1].trim() : "Frisco";
    const defaultFriscoPlaceId = "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg";
    const isFriscoLocation = city === "Frisco" || address.includes("Frisco") || address.includes("75033");
    const placeId = googlePlaceId || (isFriscoLocation ? defaultFriscoPlaceId : undefined);

    if (isIOS && isMobile) {
      if (appleMapsLink) {
        return appleMapsLink;
      }
      return `https://maps.apple.com/?address=${encodedAddress}&ll=${lat},${lng}&t=m`;
    } else if (placeId) {
      return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary/90';
      case 'secondary':
        return 'bg-secondary text-white hover:bg-secondary/90';
      case 'outline':
        return 'bg-transparent border border-primary text-primary hover:bg-primary/10';
      case 'text':
        return 'bg-transparent text-primary hover:underline';
      default:
        return 'bg-primary text-white hover:bg-primary/90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-3';
      case 'md':
        return 'text-sm py-2 px-4';
      case 'lg':
        return 'text-base py-3 px-6';
      default:
        return 'text-sm py-2 px-4';
    }
  };

  return (
    <a
      href={getDirectionsUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center rounded-md font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
        ${className}
      `}
      aria-label={`Get directions to ${address}`}
      data-google-place-id={googlePlaceId || "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"}
    >
      {showIcon && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      )}
      {buttonText}
    </a>
  );
};

export default DirectionsButton;
