import { storeLocations } from '../client/src/data/storeInfo';
import { storage } from './storage';

/**
 * Seed script to populate the database with store locations from the frontend data
 * This script takes the store locations defined in client/src/data/storeInfo.ts
 * and inserts them into the database
 */
async function seedStoreLocations() {
  console.log("Starting to seed store locations...");
  
  try {
    // Get all existing store locations from the database
    const existingLocations = await storage.getAllStoreLocations();
    console.log(`Found ${existingLocations.length} existing store locations in the database`);
    
    // Keep track of locations we've processed
    const processedLocations: number[] = [];
    
    // Process each location from the frontend data
    for (const location of storeLocations) {
      console.log(`Processing location: ${location.name}`);
      
      // Prepare social profiles object in correct format for database
      const socialProfiles = location.socialProfiles ? {
        facebook: location.socialProfiles.facebook || undefined,
        instagram: location.socialProfiles.instagram || undefined,
        twitter: location.socialProfiles.twitter || undefined,
        yelp: location.socialProfiles.yelp || undefined
      } : undefined;
      
      // Create the store location data object with proper types
      const locationData = {
        name: location.name,
        city: location.city,
        address: location.address,
        full_address: location.fullAddress,
        phone: location.phone,
        hours: location.hours,
        closed_days: location.closedDays || null,
        image: location.image,
        lat: location.coordinates.lat.toString(),
        lng: location.coordinates.lng.toString(),
        google_place_id: location.googlePlaceId || null,
        apple_maps_link: location.appleMapsLink || null,
        map_embed: location.mapEmbed,
        email: location.email || null,
        store_code: location.storeCode || null,
        description: location.description,
        neighborhood_info: location.neighborhoodInfo || null,
        year_established: location.yearEstablished,
        price_range: location.priceRange,
        // Convert values to proper types expected by the database schema
        opening_hours: location.openingHours as Record<string, string>,
        services: location.services as string[],
        accepted_payments: location.acceptedPayments as string[],
        area_served: location.areaServed as string[],
        amenities: location.amenities as string[],
        social_profiles: socialProfiles
      };
      
      // Check if this location already exists by city name
      const existingLocation = await storage.getStoreLocationByCity(location.city);
      
      if (existingLocation) {
        console.log(`Location for ${location.city} already exists with ID ${existingLocation.id}, updating...`);
        
        // Update existing location
        await storage.updateStoreLocation(existingLocation.id, locationData);
        
        processedLocations.push(existingLocation.id);
      } else {
        console.log(`Creating new location for ${location.city}...`);
        
        // Create new location
        const newLocation = await storage.createStoreLocation(locationData);
        
        console.log(`Created new location with ID ${newLocation.id}`);
        processedLocations.push(newLocation.id);
      }
    }
    
    console.log(`Successfully processed ${processedLocations.length} store locations`);
    console.log("Store location seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding store locations:", error);
  }
}

// We'll call this function directly from the API endpoint
// No need for direct script execution

export { seedStoreLocations };