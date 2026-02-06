import React from 'react';
import { Helmet } from 'react-helmet';

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

/**
 * A button component that provides directions to a location
 * Intelligently handles different device types and platforms
 */
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
  // Detect if the user is on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Detect iOS devices to use Apple Maps
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Create URL for different platforms with enhanced SEO
  const getDirectionsUrl = () => {
    // Get encoded version of address
    const encodedAddress = encodeURIComponent(address);
    
    // Extract city from address for better SEO context
    // Assume city is typically between a comma and the state abbreviation
    const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
    const city = cityMatch ? cityMatch[1].trim() : "Frisco"; // Default to Frisco for SEO focus
    
    // Create a more precise query with the location name appended for SEO
    const enhancedQuery = `Vape Cave Smoke & Stuff ${address} - Premium Vape Shop in ${city}`;
    const encodedEnhancedQuery = encodeURIComponent(enhancedQuery);
    
    // Use provided Google Place ID or default for Frisco location
    const defaultFriscoPlaceId = "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg";
    const isFriscoLocation = city === "Frisco" || address.includes("Frisco") || address.includes("75033");
    const placeId = googlePlaceId || (isFriscoLocation ? defaultFriscoPlaceId : undefined);
    const placeIdParam = placeId ? `&place_id=${placeId}` : "";
    
    // Handle specific platform requirements for map URLs
    if (isIOS && isMobile) {
      // For iOS devices, use Apple Maps with direct link if provided
      if (appleMapsLink) {
        return appleMapsLink;
      }
      // Otherwise, use standard Apple Maps URL
      return `https://maps.apple.com/?address=${encodedAddress}&ll=${lat},${lng}&t=m`;
    } else if (isMobile) {
      // For other mobile devices, use Google Maps with place ID if available
      if (placeId) {
        return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      } else {
        // Fallback to standard directions
        return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      }
    } else {
      // For desktop browsers, use Google Maps with place ID if available
      if (placeId) {
        return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
      } else {
        // Fallback to standard directions
        return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      }
    }
  };
  
  // Determine button variant styles
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
  
  // Determine button size styles
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
  
  // Extract city from address for structured data 
  const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
  const locationCity = cityMatch ? cityMatch[1].trim() : "Frisco"; // Default to Frisco for SEO focus
  
  const isFrisco = locationCity === "Frisco" || address.includes("Frisco") || address.includes("75033");
  
  return (
    <>
      {isFrisco && googlePlaceId && (
        <Helmet>
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "Store",
                "name": "Vape Cave Smoke & Stuff Frisco",
                "alternateName": ["Vape Cave Smoke & Stuff", "Vape Shop Frisco"],
                "description": "Premium vape shop in Frisco, TX offering a wide selection of vapes, e-liquids, and smoking accessories.",
                "url": "https://vapecavetx.com/locations/frisco",
                "telephone": "+14692940061",
                "email": "info@vapecavetx.com",
                "openingHoursSpecification": [
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
                    "opens": "10:00",
                    "closes": "24:00"
                  },
                  {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Friday", "Saturday"],
                    "opens": "10:00",
                    "closes": "01:00"
                  }
                ],
                "priceRange": "$$",
                "paymentAccepted": "Cash, Credit Card, Debit Card",
                "areaServed": ["Frisco", "Allen", "Plano", "McKinney", "North Texas"],
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "${address.split(',')[0]}",
                  "addressLocality": "Frisco",
                  "addressRegion": "TX",
                  "postalCode": "75033",
                  "addressCountry": "US"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": ${lat},
                  "longitude": ${lng}
                },
                "hasMap": [
                  {
                    "@type": "Map",
                    "name": "Google Business Page",
                    "url": "https://www.google.com/maps/place/?q=place_id:${googlePlaceId || "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"}",
                    "description": "Find our Frisco vape shop on our official Google Business page"
                  },
                  {
                    "@type": "Map",
                    "name": "Apple Maps",
                    "url": "${appleMapsLink || `https://maps.apple.com/?address=${encodeURIComponent(address)}&ll=${lat},${lng}&t=m`}",
                    "description": "Find our Frisco vape shop on Apple Maps"
                  }
                ],
                "identifier": [
                  {
                    "@type": "PropertyValue",
                    "name": "Google Place ID",
                    "value": "${googlePlaceId || "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"}"
                  }
                ]
              }
            `}
          </script>
        </Helmet>
      )}
      
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
        data-location={locationCity}
        data-google-place-id={googlePlaceId || "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"}
        itemScope
        itemType="https://schema.org/Store"
        itemProp="hasMap"
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
    </>
  );
};

export default DirectionsButton;