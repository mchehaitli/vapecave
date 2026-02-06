export interface StoreLocation {
  id: number;
  name: string;
  city: string;
  address: string;
  fullAddress: string;
  phone: string;
  hours: string;
  closedDays: string;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
  appleMapsLink?: string;
  mapEmbed: string;
  email?: string;
  storeCode?: string;
  openingHours: {
    [key: string]: string;
  };
  // Enhanced fields for SEO
  services: string[];
  acceptedPayments: string[];
  areaServed: string[];
  publicTransit?: string;
  parking?: string;
  yearEstablished: number;
  priceRange: string;
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    yelp?: string;
  };
  description: string;
  neighborhoodInfo?: string;
  amenities: string[];
}

export const storeLocations: StoreLocation[] = [
  {
    id: 1,
    name: "Vape Cave Smoke & Stuff Frisco",
    city: "Frisco",
    address: "6958 Main St #200",
    fullAddress: "6958 Main St #200, Frisco, TX 75033, United States",
    phone: "(469) 294-0061",
    hours: "10:00 AM - 12:00 AM (Every Day)",
    closedDays: "",
    image: "/vapecave-logo.png",
    coordinates: {
      lat: 33.150730,
      lng: -96.822550
    },
    googlePlaceId: "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg",
    appleMapsLink: "https://maps.apple.com/?address=6958%20Main%20St%20%23200,%20Frisco,%20TX%20%2075033,%20United%20States&ll=33.150730,-96.822550&q=Vape%20Cave%20Smoke%20%26%20Stuff&t=m",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3349.8753075683534!2d-96.8250386843087!3d33.15073000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864c3c9e26f9a2d7%3A0x8b26bf31c77df48b!2s6958%20Main%20St%20%23200%2C%20Frisco%2C%20TX%2075033!5e0!3m2!1sen!2sus!4v1693311756407!5m2!1sen!2sus",
    email: "vapecavetex@gmail.com",
    storeCode: "VC-FRISCO",
    openingHours: {
      "Monday": "10:00 AM - 12:00 AM",
      "Tuesday": "10:00 AM - 12:00 AM",
      "Wednesday": "10:00 AM - 12:00 AM",
      "Thursday": "10:00 AM - 12:00 AM",
      "Friday": "10:00 AM - 12:00 AM",
      "Saturday": "10:00 AM - 12:00 AM",
      "Sunday": "10:00 AM - 12:00 AM"
    },
    // Enhanced fields
    services: [
      "Disposable Vapes",
      "E-Liquids",
      "Salt Nic",
      "Vape Pens",
      "Vaporizers",
      "Accessories",
      "Glass Products",
      "Tobacco Products",
      "Hookah & Shisha"
    ],
    acceptedPayments: [
      "Cash",
      "Credit Card",
      "Debit Card",
      "Apple Pay",
      "Google Pay"
    ],
    areaServed: [
      "Frisco",
      "Allen",
      "Plano",
      "McKinney",
      "The Colony",
      "Little Elm",
      "Prosper",
      "Dallas",
      "North Texas"
    ],
    publicTransit: "DART Bus Stop within 0.2 miles",
    parking: "Free parking available in the shopping center",
    yearEstablished: 2019,
    priceRange: "$$",
    socialProfiles: {
      facebook: "https://facebook.com/vapecavefrisco",
      instagram: "https://instagram.com/vapecavefrisco",
      twitter: "https://twitter.com/vapecavefrisco",
      yelp: "https://yelp.com/biz/vape-cave-frisco"
    },
    description: "Our Frisco location offers a premium selection of vaping products, disposables, e-liquids, and more. Our expert staff provides personalized recommendations in a welcoming environment with competitive prices and weekly specials.",
    neighborhoodInfo: "Located on Main Street in downtown Frisco, our store is just minutes from Frisco Square and the Rail District. Plenty of restaurants and shopping nearby.",
    amenities: [
      "Expert Staff",
      "Product Testing",
      "Weekly Specials",
      "Rewards Program",
      "Military Discount",
      "Student Discount",
      "Free Parking",
      "ADA Accessible"
    ]
  }
];

// Helper function to get a location by ID
export const getLocationById = (id: number): StoreLocation | undefined => {
  return storeLocations.find(location => location.id === id);
};

// Helper function to get a location by city name
export const getLocationByCity = (city: string): StoreLocation | undefined => {
  return storeLocations.find(location => 
    location.city.toLowerCase() === city.toLowerCase()
  );
};

// Helper function to get formatted locations for Google Maps
export const getFormattedLocationsForMap = () => {
  return storeLocations.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.fullAddress,
    position: loc.coordinates,
    googlePlaceId: loc.googlePlaceId, // Include Google Place ID for direct linking
    appleMapsLink: loc.appleMapsLink, // Include Apple Maps link for iOS devices
    city: loc.city // Include city for better location context
  }));
};

// Get the Frisco location (for convenience in SEO-focused components)
export const getFriscoLocation = (): StoreLocation => {
  return storeLocations.find(location => location.id === 1) || storeLocations[0];
};


// Generate a structured data representation for a location
export const generateStructuredDataForLocation = (location: StoreLocation) => {
  // Format phone for structured data (remove non-digits and add country code)
  const formattedPhone = "+1" + location.phone.replace(/[^0-9]/g, '');
  
  // Check if this is the Frisco location
  const isFrisco = location.id === 1 || location.city === "Frisco";
  
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": location.name,
    "alternateName": isFrisco ? "Vape Cave Smoke & Stuff Frisco - Premium Vape Shop" : undefined,
    "url": `https://vapecavetx.com/locations/${location.id}`,
    "description": location.description,
    "telephone": formattedPhone,
    "email": location.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": location.address,
      "addressLocality": location.city,
      "addressRegion": "TX",
      "postalCode": location.fullAddress.match(/\d{5}(?![\d-])/) ? location.fullAddress.match(/\d{5}(?![\d-])/)?.[0] : "",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": location.coordinates.lat,
      "longitude": location.coordinates.lng
    },
    "hasMap": location.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${location.googlePlaceId}` : undefined,
    "openingHoursSpecification": Object.entries(location.openingHours).map(([day, hours]) => {
      const parts = hours.split(' - ');
      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": day,
        "opens": parts[0],
        "closes": parts[1] === "Closed" ? "00:00" : parts[1]
      };
    }),
    "additionalProperty": [{
      "@type": "PropertyValue",
      "name": "Google Place ID",
      "value": location.googlePlaceId || ""
    }]
  };
};