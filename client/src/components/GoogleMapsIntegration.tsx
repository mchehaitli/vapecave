import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';

interface Location {
  id: number;
  name: string;
  address: string;
  fullAddress?: string; // Full address with city, state, zip
  position: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string; // Google Place ID for direct linking
  appleMapsLink?: string; // Direct Apple Maps link
  city?: string; // Add optional city for better location context
  email?: string; // Email for the location
  phone?: string; // Phone number for the location
  image?: string; // Image URL for the location
}

// Define MapTypeId enum since we can't access google.maps before it's loaded
enum MapTypeId {
  ROADMAP = 'roadmap',
  SATELLITE = 'satellite',
  HYBRID = 'hybrid',
  TERRAIN = 'terrain'
}

interface GoogleMapsIntegrationProps {
  locations: Location[];
  height?: string;
  width?: string;
  zoom?: number;
  activeLocationId?: number | null;
  showDirectionsLink?: boolean;
  mapType?: string; // Changed to string type to avoid direct dependency on google.maps
  apiKey?: string; // Allow direct passing of API key
}

// Extend Window interface to include Google Maps initialization
declare global {
  interface Window {
    initGoogleMaps?: () => void;
    google?: any;
  }
}

// Using Google Maps API for enhanced maps functionality
const GoogleMapsIntegration: React.FC<GoogleMapsIntegrationProps> = ({
  locations,
  height = '500px',
  width = '100%',
  zoom = 14,
  activeLocationId = null,
  showDirectionsLink = true,
  mapType = MapTypeId.ROADMAP,
  apiKey: propApiKey // Get API key from props
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  // Get the active location from the activeLocationId or default to the first location
  const activeLocationObject = locations.find(loc => loc.id === activeLocationId) || locations[0];
  
  // Extract location information safely
  const locationCity = activeLocationObject?.city || "";
  const locationName = activeLocationObject ? `Vape Cave Smoke & Stuff ${locationCity}` : "Vape Cave Smoke & Stuff";
  const locationId = activeLocationObject?.id || 1;
  
  // Use API key from props if provided, otherwise from environment variables
  // Using import.meta.env for client-side environment variables in Vite
  const apiKey = propApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  // Add structured data for maps integration using react-helmet
  useEffect(() => {
    // Use the first provided location or the active location if specified
    const currentLocation = locations[0];
    
    if (!currentLocation) return; // Safety check
    
    // Extract city name from address (assuming format like "address, City, State ZIP")
    const cityMatch = currentLocation.address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
    const cityName = currentLocation.city || (cityMatch ? cityMatch[1].trim() : "");
    
    // Create a more precise hasMap URL with Google Place ID or Address for better discoverability
    const hasMapUrl = currentLocation.googlePlaceId 
      ? `https://www.google.com/maps/place/?q=place_id:${currentLocation.googlePlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentLocation.address)}`;
      
    // Split address into components for more structured markup
    const addressParts = currentLocation.address.split(',').map(part => part.trim());
    const streetAddress = addressParts[0];
    
    // Create dynamic postal code based on address
    const postalCodeMatch = currentLocation.address.match(/\d{5}(?![\d-])/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : "";
    
    // Create more comprehensive structured data for SEO - dynamically based on the location
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": `Vape Cave Smoke & Stuff ${cityName}`,
      "description": `Premium vape shop in ${cityName}, TX offering a wide selection of vapes, e-liquids, and smoking accessories.`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": streetAddress,
        "addressLocality": cityName,
        "addressRegion": "TX",
        "postalCode": postalCode,
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": currentLocation.position.lat,
        "longitude": currentLocation.position.lng
      },
      "hasMap": hasMapUrl,
      "url": `https://vapecavetx.com/locations/${cityName.toLowerCase()}`,
      "sameAs": [
        "https://www.facebook.com/vapecavetx",
        "https://www.instagram.com/vapecavetx/"
      ]
    };
    
    // Using Helmet for structured data instead of direct DOM manipulation
    // This is better for React and avoids potential memory leaks
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
      if (el.textContent?.includes('"@type":"Store"')) {
        document.head.removeChild(el);
      }
    });
  }, [locations]);
  
  // Log the URL for debugging domain restriction issues
  useEffect(() => {
    console.log("Current page URL:", window.location.href);
    console.log("Current hostname:", window.location.hostname);
  }, []);
  
  // Initialize Google Maps when the component mounts with improved error handling and API key validation
  useEffect(() => {
    // Validate API key exists - important for SEO optimization
    if (!apiKey || apiKey.trim() === '') {
      console.warn("Google Maps API key is missing or invalid. Maps functionality may be limited.");
    }
    
    // Check if the Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded, initializing map");
      initializeMap();
      return;
    }
    
    // Check if the script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // If script is already loading, we just need to wait for it
      window.initGoogleMaps = () => {
        console.log("Google Maps loaded via existing script");
        setMapLoaded(true);
      };
      return;
    }
    
    // Create a unique callback name to avoid conflicts with other instances
    const callbackName = `initGoogleMaps_${Date.now().toString(36)}`;
    
    // Load the Google Maps API script with enhanced options
    const script = document.createElement('script');
    
    // Add optional libraries and configuration
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=places&v=quarterly`;
    script.async = true;
    script.defer = true;
    
    // Define the callback function to initialize the map
    (window as any)[callbackName] = () => {
      console.log("Google Maps API loaded successfully");
      setMapLoaded(true);
      
      // Cleanup the callback after it's called
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
      }, 1000);
    };
    
    // Enhanced error handling with troubleshooting information
    script.onerror = (error) => {
      console.error("Error loading Google Maps API:", error);
      console.log("Attempted to load with URL:", script.src.replace(apiKey, "API_KEY_REDACTED"));
      console.log("API key provided:", apiKey ? `Yes (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 3)}...)` : "No");
      console.log("Current hostname:", window.location.hostname);
      console.log("Current protocol:", window.location.protocol);
      
      // Attempt to load a fallback static map in case of API failure
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <p>Interactive map failed to load.</p>
            <img src="https://maps.googleapis.com/maps/api/staticmap?center=${
              activeLocationObject ? `${activeLocationObject.position.lat},${activeLocationObject.position.lng}` : "33.150730,-96.822550"
            }&zoom=13&size=600x400&markers=color:orange%7C${
              activeLocationObject ? `${activeLocationObject.position.lat},${activeLocationObject.position.lng}` : "33.150730,-96.822550"
            }&key=${apiKey}" alt="Static Map of Location" style="max-width: 100%; border-radius: 8px; margin-top: 10px;" />
          </div>
        `;
      }
    };
    
    document.head.appendChild(script);
    
    // Enhanced cleanup function
    return () => {
      // Only remove the script and callback if this component added it
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      
      // TypeScript-friendly way to remove callback
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };
  }, [apiKey, activeLocationObject]);
  
  // Initialize the map when the API is loaded
  useEffect(() => {
    if (mapLoaded && window.google && window.google.maps) {
      initializeMap();
    }
  }, [mapLoaded]);
  
  // Update the map when the active location changes
  useEffect(() => {
    if (map && activeLocationObject && window.google && window.google.maps) {
      map.setCenter(activeLocationObject.position);
      
      // Highlight the active marker
      markers.forEach(marker => {
        const markerLocationId = Number(marker.get('locationId'));
        if (markerLocationId === activeLocationObject.id) {
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            marker.setAnimation(null);
          }, 1500);
        }
      });
    }
  }, [activeLocationObject, map, markers]);
  
  // Initialize the map
  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;
    
    const google = window.google;
    
    // Create the map
    const newMap = new google.maps.Map(mapRef.current, {
      center: activeLocationObject ? activeLocationObject.position : { lat: 39.8, lng: -98.5 },
      zoom,
      mapTypeId: mapType,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          "elementType": "geometry",
          "stylers": [{"color": "#212121"}]
        },
        {
          "elementType": "labels.icon",
          "stylers": [{"visibility": "on"}]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#757575"}]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [{"color": "#212121"}]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [{"color": "#757575"}, {"visibility": "on"}]
        },
        {
          "featureType": "administrative.country",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#9e9e9e"}]
        },
        {
          "featureType": "administrative.locality",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#bdbdbd"}]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#f97316"}]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [{"color": "#181818"}]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#616161"}]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.stroke",
          "stylers": [{"color": "#1b1b1b"}]
        },
        {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#2c2c2c"}]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#8a8a8a"}]
        },
        {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [{"color": "#373737"}]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{"color": "#3c3c3c"}]
        },
        {
          "featureType": "road.highway.controlled_access",
          "elementType": "geometry",
          "stylers": [{"color": "#4e4e4e"}]
        },
        {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#616161"}]
        },
        {
          "featureType": "transit",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#757575"}]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{"color": "#000000"}]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#3d3d3d"}]
        }
      ]
    });
    
    setMap(newMap);
    
    // Add markers for each location
    const newMarkers = locations.map(location => {
      // Create a custom marker icon with Vape Cave Smoke & Stuff branding
      const marker = new google.maps.Marker({
        position: location.position,
        map: newMap,
        title: location.name,
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png', // Use orange for branding
          scaledSize: new google.maps.Size(36, 36)
        }
      });
      
      // Store the location ID with the marker
      marker.set('locationId', location.id);
      
      // Create an info window for the marker
      // Generate directions URL using Google Place ID if available for better geocoding accuracy
      const getDirectionsUrl = () => {
        if (location.googlePlaceId) {
          // Use Google Place ID for more precise location - better for SEO and user experience
          return `https://www.google.com/maps/place/?q=place_id:${location.googlePlaceId}`;
        }
        // Fallback to standard coordinates
        return `https://www.google.com/maps/dir/?api=1&destination=${location.position.lat},${location.position.lng}`;
      };
      
      // Generate additional maps URLs based on device/platform
      const getAppleMapsUrl = () => {
        // Use pre-configured Apple Maps link if available
        if (location.appleMapsLink) {
          return location.appleMapsLink;
        }
        // Otherwise build from components
        return `https://maps.apple.com/?address=${encodeURIComponent(location.address)}&ll=${location.position.lat},${location.position.lng}&q=${encodeURIComponent(location.name)}`;
      };
      
      // Create an enhanced info window with Google Maps and Apple Maps integration
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px; font-family: Arial, sans-serif;">
            <h3 style="margin: 8px 0; color: #f97316; font-weight: bold;">${location.name}</h3>
            <p style="margin: 6px 0; font-size: 0.9em;">${location.address}</p>
            ${showDirectionsLink ? `
              <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                <a href="${getDirectionsUrl()}" 
                   target="_blank" style="color: #f97316; text-decoration: none; font-weight: bold; display: flex; align-items: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4"></path>
                  </svg>
                  Google Maps
                </a>
                <a href="${getAppleMapsUrl()}" 
                   target="_blank" style="color: #4b5563; text-decoration: none; font-size: 0.85em; display: flex; align-items: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Apple Maps
                </a>
              </div>
            ` : ''}
          </div>
        `
      });
      // Add a click listener to open the info window
      marker.addListener('click', () => {
        infoWindow.open(newMap, marker);
      });
      
      return marker;
    });
    
    setMarkers(newMarkers);
    
    // Fit the map to show all markers if there are multiple locations
    if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend(location.position);
      });
      newMap.fitBounds(bounds);
      
      // Adjust zoom if it's too zoomed in (for locations that are very close)
      google.maps.event.addListenerOnce(newMap, 'idle', () => {
        if (newMap.getZoom() && newMap.getZoom() > 16) {
          newMap.setZoom(16);
        }
      });
    }
  };
  
  // Fallback to iframe embed if Google Maps API isn't available
  const renderFallbackMap = () => {
    const embedUrl = activeLocationObject?.position 
      ? `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3056.2408651289297!2d${activeLocationObject.position.lng}!3d${activeLocationObject.position.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDA5JzAyLjYiTiA5NsKwNDknMjYuMiJX!5e0!3m2!1sen!2sus!4v1693311756407!5m2!1sen!2sus`
      : 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3056.2408651289297!2d-96.8236!3d33.1562!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDA5JzAyLjYiTiA5NsKwNDknMjYuMiJX!5e0!3m2!1sen!2sus!4v1693311756407!5m2!1sen!2sus';
    
    return (
      <div className="relative">
        <iframe
          title="Location Map"
          width="100%"
          height="100%"
          style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
          loading="lazy"
          allowFullScreen
          src={embedUrl}
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    );
  };
  
  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Store",
              "@id": "https://vapecavetx.com/locations/${locationCity.toLowerCase()}/#store",
              "name": "${locationName}",
              "alternateName": ["Vape Cave Smoke & Stuff", "Vape Shop ${locationCity}", "${locationCity} Vape Store"],
              "description": "Premium vape shop in ${locationCity}, TX offering a wide selection of vapes, e-liquids, disposables, and smoking accessories.",
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://vapecavetx.com/locations/${locationCity.toLowerCase()}/"
              },
              "url": "https://vapecavetx.com/locations/${locationCity.toLowerCase()}",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "${activeLocationObject?.address || ""}",
                "addressLocality": "${locationCity}",
                "addressRegion": "TX", 
                "postalCode": "${activeLocationObject?.address?.match(/\\d{5}(?![\\d-])/) || ""}",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": ${activeLocationObject?.position?.lat || 0},
                "longitude": ${activeLocationObject?.position?.lng || 0},
                "name": "Vape Cave Smoke & Stuff ${locationCity} Coordinates"
              },
              "telephone": "${activeLocationObject?.phone?.replace(/[^0-9]/g, '') ? '+1' + activeLocationObject.phone.replace(/[^0-9]/g, '') : ''}",
              "email": "info@vapecavetx.com",
              "image": "https://vapecavetx.com/vapecave-logo.png",
              "logo": "https://vapecavetx.com/vapecave-logo.png",
              "photo": {
                "@type": "ImageObject",
                "contentUrl": "${activeLocationObject?.image || ''}",
                "description": "Interior of Vape Cave Smoke & Stuff ${locationCity} store"
              },
              "currenciesAccepted": "USD",
              "paymentAccepted": "Cash, Credit Card, Debit Card, Apple Pay, Google Pay",
              "isAccessibleForFree": true,
              "hasMap": [
                {
                  "@type": "Map",
                  "name": "Google Maps Navigation",
                  "url": "https://www.google.com/maps/place/?q=place_id:${activeLocationObject?.googlePlaceId || ""}",
                  "description": "Find our ${locationCity} vape shop using Google Maps"
                },
                {
                  "@type": "Map",
                  "name": "Apple Maps Navigation",
                  "url": "${activeLocationObject?.appleMapsLink || `https://maps.apple.com/?address=${encodeURIComponent(activeLocationObject?.address || '')}&ll=${activeLocationObject?.position?.lat || 0},${activeLocationObject?.position?.lng || 0}`}",
                  "description": "Navigate to Vape Cave Smoke & Stuff ${locationCity} using Apple Maps"
                }
              ],
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
              "sameAs": [
                "https://www.facebook.com/vapecavetx",
                "https://www.instagram.com/vapecavetx/"
              ],
              "areaServed": ["${locationCity}", "Dallas-Fort Worth", "North Texas"],
              "priceRange": "$$",
              "additionalProperty": [
                {
                  "@type": "PropertyValue",
                  "name": "Google Place ID",
                  "value": "${activeLocationObject?.googlePlaceId || ""}"
                }
              ],
              "specialOpeningHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "validFrom": "2025-01-01",
                "validThrough": "2025-12-31",
                "dayOfWeek": "http://schema.org/PublicHolidays",
                "opens": "10:00",
                "closes": "20:00"
              },
              "publicAccess": true,
              "smokingAllowed": false,
              "amenityFeature": [
                {
                  "@type": "LocationFeatureSpecification",
                  "name": "Free Parking",
                  "value": true
                },
                {
                  "@type": "LocationFeatureSpecification", 
                  "name": "Wheelchair Accessible",
                  "value": true
                }
              ]
            }
          `}
        </script>
        {/* Enhanced geo meta tags - recommended by Google for local SEO */}
        <meta name="geo.position" content={`${activeLocationObject?.position?.lat || 0};${activeLocationObject?.position?.lng || 0}`} />
        <meta name="geo.placename" content={`Vape Cave Smoke & Stuff ${locationCity}`} />
        <meta name="geo.region" content="US-TX" />
        <meta name="ICBM" content={`${activeLocationObject?.position?.lat || 0}, ${activeLocationObject?.position?.lng || 0}`} />
        
        {/* Location-specific metadata with enhanced Google Maps information */}
        <meta name="location-city" content={locationCity} />
        <meta name="location-state" content="Texas" />
        <meta name="location-zipcode" content={`${activeLocationObject?.address?.match(/\d{5}(?![\d-])/) || ""}`} />
        <meta name="google-place-id" content={activeLocationObject?.googlePlaceId || ""} />
        <meta name="place:location:latitude" content={`${activeLocationObject?.position?.lat || 0}`} />
        <meta name="place:location:longitude" content={`${activeLocationObject?.position?.lng || 0}`} />
        
        {/* Business contact information - enhanced for improved local search */}
        <meta name="business-name" content={`Vape Cave Smoke & Stuff ${locationCity}`} />
        <meta name="business-type" content="Vape Shop" />
        <meta name="business-phone" content={activeLocationObject?.phone ? `+1${activeLocationObject.phone.replace(/[^0-9]/g, '')}` : ""} />
        <meta name="business-email" content={activeLocationObject?.email || "info@vapecavetx.com"} />
        <meta name="business:contact_data:street_address" content={activeLocationObject?.address || ""} />
        <meta name="business:contact_data:locality" content={locationCity} />
        <meta name="business:contact_data:region" content="TX" />
        <meta name="business:contact_data:postal_code" content={`${activeLocationObject?.address?.match(/\d{5}(?![\d-])/) || ""}`} />
        <meta name="business:contact_data:country_name" content="United States" />
        
        {/* Enhanced product categories for better product discovery */}
        <meta name="product-category" content="Vapes, E-Liquids, Disposables, Smoking Accessories" />
        <meta name="product-brand" content="Vape Cave Smoke & Stuff, Premium Vape Products" />
        <meta name="product-availability" content="In Store" />
        
        {/* Dublin Core metadata - for improved structural data recognition */}
        <meta name="DC.title" content={`Vape Cave Smoke & Stuff ${locationCity} - Premium Vape Shop`} />
        <meta name="DC.description" content={`Visit Vape Cave Smoke & Stuff in ${locationCity}, TX for premium vaping products, disposables, and smoking accessories.`} />
        <meta name="DC.publisher" content="Vape Cave Smoke & Stuff" />
        <meta name="DC.contributor" content={`${locationCity} Chamber of Commerce`} />
        <meta name="DC.coverage" content={`${locationCity}, Texas, United States`} />
        <meta name="DC.rights" content="© 2024 Vape Cave Smoke & Stuff, All Rights Reserved" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.language" content="en-US" />
        <meta name="DC.identifier" content={`https://vapecavetx.com/locations/${locationCity.toLowerCase()}`} />
      </Helmet>
      
      <div style={{ height, width }} className="rounded-lg overflow-hidden shadow-lg relative">
        {apiKey ? (
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        ) : (
          renderFallbackMap()
        )}
        
        {showDirectionsLink && activeLocationObject && (
          <div className="absolute bottom-4 right-4 z-10">
            <a 
              href={activeLocationObject.googlePlaceId 
                ? `https://www.google.com/maps/place/?q=place_id:${activeLocationObject.googlePlaceId}`
                : `https://www.google.com/maps/dir/?api=1&destination=${activeLocationObject.position.lat},${activeLocationObject.position.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-100 text-orange-500 font-bold py-2 px-4 rounded-full shadow-lg flex items-center transition-all duration-300 ease-in-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Get Directions
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleMapsIntegration;