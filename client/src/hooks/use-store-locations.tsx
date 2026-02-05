import { useQuery } from "@tanstack/react-query";
import { StoreLocation } from "@/types/store-location";
import { getQueryFn } from "@/lib/queryClient";
import { formatStoreHours, formatExtendedHours } from "@/utils/formatStoreHours";

/**
 * Helper function to get ordered opening hours
 * Ensures weekdays are displayed in the correct order (Monday-Sunday)
 */
export function getOrderedOpeningHours(openingHours?: Record<string, string>): Array<{day: string, hours: string}> {
  if (!openingHours) return [];
  
  const daysOrder = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];
  
  return daysOrder
    .filter(day => openingHours[day]) // Only include days that have hours
    .map(day => ({
      day,
      hours: openingHours[day]
    }));
}

/**
 * Hook to fetch all store locations
 */
export function useStoreLocations() {
  return useQuery({
    queryKey: ['/api/store-locations'],
    queryFn: getQueryFn<StoreLocation[]>({ on401: 'returnNull' })
  });
}

/**
 * Hook to fetch a store location by ID
 */
export function useStoreLocationById(id: number) {
  const { data: locations, isLoading } = useStoreLocations();
  
  return {
    data: locations?.find(location => location.id === id),
    isLoading
  };
}

/**
 * Hook to fetch a store location by city
 */
export function useStoreLocationByCity(city: string) {
  const { data: locations, isLoading } = useStoreLocations();
  
  return {
    data: locations?.find(location => 
      location.city.toLowerCase() === city.toLowerCase()
    ),
    isLoading
  };
}

/**
 * Helper to get formatted locations for Google Maps
 */
export function useFormattedLocationsForMap() {
  const { data: locations, isLoading } = useStoreLocations();
  
  const formattedLocations = locations?.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.full_address,
    fullAddress: loc.full_address, // For backward compatibility
    position: {
      lat: typeof loc.lat === 'string' ? parseFloat(loc.lat) : loc.lat,
      lng: typeof loc.lng === 'string' ? parseFloat(loc.lng) : loc.lng
    },
    coordinates: { // For backward compatibility
      lat: typeof loc.lat === 'string' ? parseFloat(loc.lat) : loc.lat,
      lng: typeof loc.lng === 'string' ? parseFloat(loc.lng) : loc.lng
    },
    googlePlaceId: loc.google_place_id || undefined,
    appleMapsLink: loc.apple_maps_link || undefined,
    mapEmbed: loc.map_embed,
    city: loc.city,
    email: loc.email,
    phone: loc.phone,
    image: loc.image,
    // Use our formatStoreHours utility for consistent display
    hours: formatStoreHours(loc.opening_hours) || loc.hours,
    closedDays: loc.closed_days || "",
    openingHours: loc.opening_hours || {},
    storeCode: loc.store_code,
    services: loc.services || [],
    acceptedPayments: loc.accepted_payments || [],
    areaServed: loc.area_served || [],
    publicTransit: loc.public_transit,
    parking: loc.parking,
    yearEstablished: loc.year_established,
    priceRange: loc.price_range || "$",
    amenities: loc.amenities || [],
    neighborhoodInfo: loc.neighborhood_info,
    description: loc.description,
    socialProfiles: loc.social_profiles || {
      facebook: undefined,
      instagram: undefined,
      twitter: undefined,
      yelp: undefined
    }
  })) || [];
  
  return {
    data: formattedLocations,
    isLoading
  };
}

/**
 * Hook to get the Frisco location with all the client-side expected fields
 */
export function useFriscoLocation() {
  const { data: location, isLoading } = useStoreLocationById(1);
  
  // Format the location object to include fields expected by the client
  const formattedLocation = location ? {
    ...location,
    fullAddress: location.full_address,
    coordinates: {
      lat: typeof location.lat === 'string' ? parseFloat(location.lat) : location.lat,
      lng: typeof location.lng === 'string' ? parseFloat(location.lng) : location.lng
    },
    googlePlaceId: location.google_place_id,
    appleMapsLink: location.apple_maps_link,
    mapEmbed: location.map_embed,
    storeCode: location.store_code,
    openingHours: location.opening_hours || {},
    // Use our formatStoreHours utility for consistent display
    hours: formatStoreHours(location.opening_hours) || location.hours,
    closedDays: location.closed_days || "",
    yearEstablished: location.year_established,
    priceRange: location.price_range,
    publicTransit: location.public_transit,
    parking: location.parking,
    neighborhoodInfo: location.neighborhood_info,
    amenities: location.amenities || [],
    acceptedPayments: location.accepted_payments || [],
    areaServed: location.area_served || [],
    services: location.services || [],
    socialProfiles: location.social_profiles || {}
  } : undefined;
  
  return {
    data: formattedLocation,
    isLoading
  };
}

