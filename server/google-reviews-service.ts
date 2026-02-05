import * as dotenv from "dotenv";

dotenv.config();

export interface GoogleReview {
  authorName: string;
  authorUrl?: string;
  profilePhotoUrl?: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
}

export interface GoogleReviewsData {
  placeId: string;
  businessName: string;
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  lastFetched: number;
  error?: string;
}

interface CachedReviews {
  data: GoogleReviewsData;
  expiresAt: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let reviewsCache: CachedReviews | null = null;

const FRISCO_PLACE_ID = "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg";
const BUSINESS_NAME = "Vape Cave Frisco";

export async function fetchGoogleReviews(placeId: string = FRISCO_PLACE_ID): Promise<GoogleReviewsData> {
  if (reviewsCache && Date.now() < reviewsCache.expiresAt) {
    console.log("[GoogleReviews] Returning cached reviews");
    return reviewsCache.data;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
  
  if (!apiKey) {
    console.error("[GoogleReviews] No API key configured");
    return {
      placeId,
      businessName: BUSINESS_NAME,
      rating: 0,
      totalReviews: 0,
      reviews: [],
      lastFetched: Date.now(),
      error: "Google Places API key not configured"
    };
  }

  try {
    console.log("[GoogleReviews] Fetching fresh reviews from Google Places API");
    
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("[GoogleReviews] Google API error:", data.status, data.error_message);
      return {
        placeId,
        businessName: BUSINESS_NAME,
        rating: 0,
        totalReviews: 0,
        reviews: [],
        lastFetched: Date.now(),
        error: data.error_message || `Google API error: ${data.status}`
      };
    }

    const result = data.result;
    const reviews: GoogleReview[] = (result.reviews || []).map((review: any) => ({
      authorName: review.author_name || "Anonymous",
      authorUrl: review.author_url,
      profilePhotoUrl: review.profile_photo_url,
      rating: review.rating,
      relativeTimeDescription: review.relative_time_description,
      text: review.text || "",
      time: review.time
    }));

    const reviewsData: GoogleReviewsData = {
      placeId,
      businessName: result.name || BUSINESS_NAME,
      rating: result.rating || 0,
      totalReviews: result.user_ratings_total || 0,
      reviews,
      lastFetched: Date.now()
    };

    reviewsCache = {
      data: reviewsData,
      expiresAt: Date.now() + CACHE_TTL_MS
    };

    console.log(`[GoogleReviews] Fetched ${reviews.length} reviews, rating: ${reviewsData.rating}`);
    return reviewsData;

  } catch (error) {
    console.error("[GoogleReviews] Error fetching reviews:", error);
    return {
      placeId,
      businessName: BUSINESS_NAME,
      rating: 0,
      totalReviews: 0,
      reviews: [],
      lastFetched: Date.now(),
      error: error instanceof Error ? error.message : "Failed to fetch reviews"
    };
  }
}

export function clearReviewsCache(): void {
  reviewsCache = null;
  console.log("[GoogleReviews] Cache cleared");
}

export function getCacheStatus(): { cached: boolean; expiresAt?: number; age?: number } {
  if (!reviewsCache) {
    return { cached: false };
  }
  
  return {
    cached: true,
    expiresAt: reviewsCache.expiresAt,
    age: Date.now() - reviewsCache.data.lastFetched
  };
}
