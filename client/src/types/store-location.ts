export interface StoreLocation {
  id: number;
  name: string;
  city: string;
  address: string;
  full_address: string;
  phone: string;
  hours: string;
  closed_days?: string | null;
  image: string;
  lat: number | string;
  lng: number | string;
  map_embed?: string;
  email?: string | null;
  store_code?: string | null;
  opening_hours?: Record<string, string>;
  description?: string;
  year_established?: number;
  price_range?: string;
  services?: string[];
  accepted_payments?: string[];
  area_served?: string[];
  google_place_id?: string | null;
  apple_maps_link?: string | null;
  neighborhood_info?: string | null;
  parking?: string | null;
  public_transit?: string | null;
  amenities?: string[];
  social_profiles?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    yelp?: string;
  };
}