import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, ExternalLink, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storeLocations } from "@/data/storeInfo";

interface GoogleReview {
  authorName: string;
  authorUrl?: string;
  profilePhotoUrl?: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
}

interface GoogleReviewsData {
  placeId: string;
  businessName: string;
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  lastFetched: number;
  error?: string;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <Card className="bg-card/40 border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {review.profilePhotoUrl ? (
            <img
              src={review.profilePhotoUrl}
              alt={review.authorName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
              <span className="text-primary font-semibold text-lg">
                {review.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                {review.authorUrl ? (
                  <a
                    href={review.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                    data-testid={`link-reviewer-${review.authorName.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {review.authorName}
                  </a>
                ) : (
                  <span className="font-semibold text-foreground">
                    {review.authorName}
                  </span>
                )}
                <p className="text-sm text-foreground/60">
                  {review.relativeTimeDescription}
                </p>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
            
            {review.text && (
              <div className="relative">
                <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/30" />
                <p className="text-foreground/80 pl-4 leading-relaxed">
                  {review.text}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="bg-card/40 border border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OverallRating({ data }: { data: GoogleReviewsData }) {
  const friscoLocation = storeLocations[0];
  const googleReviewsUrl = `https://search.google.com/local/reviews?placeid=${data.placeId}`;
  
  return (
    <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-8 mb-12 shadow-[0_0_30px_rgba(255,113,0,0.1)]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {data.businessName}
          </h2>
          <div className="flex items-center gap-2 text-foreground/70 mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{friscoLocation.fullAddress}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-primary">{data.rating.toFixed(1)}</span>
              <div>
                <StarRating rating={data.rating} size="lg" />
                <p className="text-sm text-foreground/60 mt-1">
                  Based on {data.totalReviews.toLocaleString()} reviews
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-black font-semibold"
            data-testid="button-write-review"
          >
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Star className="w-4 h-4 mr-2" />
              Write a Review
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            data-testid="button-view-all-reviews"
          >
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View All on Google
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { data, isLoading, error } = useQuery<GoogleReviewsData>({
    queryKey: ["/api/reviews/google"],
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": "https://vapecavetx.com/reviews",
    "name": "Vape Cave Frisco",
    "description": "Read customer reviews for Vape Cave Frisco. See what our customers are saying about our premium vaping products and exceptional service.",
    "url": "https://vapecavetx.com/reviews",
    "aggregateRating": data ? {
      "@type": "AggregateRating",
      "ratingValue": data.rating,
      "reviewCount": data.totalReviews,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "review": data?.reviews?.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.authorName
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "reviewBody": review.text,
      "datePublished": new Date(review.time * 1000).toISOString()
    }))
  };

  return (
    <MainLayout
      title="Customer Reviews | Vape Cave Frisco - Premium Vape Shop"
      description="Read customer reviews for Vape Cave Frisco. See what our customers are saying about our premium vaping products, exceptional service, and competitive prices."
      canonical="https://vapecavetx.com/reviews"
      structuredData={structuredData}
    >
      <Helmet>
        <meta name="keywords" content="vape cave reviews, vape shop frisco reviews, vape cave frisco customer reviews, vape store reviews texas" />
        <meta property="og:title" content="Customer Reviews | Vape Cave Frisco" />
        <meta property="og:description" content="See what our customers are saying about Vape Cave Frisco. Read genuine reviews from real customers." />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="py-16 bg-background text-foreground relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Poppins']">
              Customer <span className="text-primary">Reviews</span>
            </h1>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Don't just take our word for it. See what our customers have to say about their experience at Vape Cave Frisco.
            </p>
          </div>

          {isLoading && (
            <>
              <div className="bg-card/40 border border-primary/20 rounded-2xl p-8 mb-12 animate-pulse">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <Skeleton className="h-8 w-48 mb-4 bg-muted" />
                    <Skeleton className="h-5 w-64 mb-4 bg-muted" />
                    <Skeleton className="h-12 w-32 bg-muted" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-10 w-40 bg-muted" />
                    <Skeleton className="h-10 w-40 bg-muted" />
                  </div>
                </div>
              </div>
              <ReviewsSkeleton />
            </>
          )}

          {error && (
            <Card className="bg-red-900/20 border border-red-500/30">
              <CardContent className="p-8 text-center">
                <p className="text-red-400 mb-4">
                  Unable to load reviews at this time. Please try again later.
                </p>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-black font-semibold"
                  data-testid="button-view-google"
                >
                  <a
                    href="https://search.google.com/local/reviews?placeid=ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Reviews on Google
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {data && !data.error && (
            <>
              <OverallRating data={data} />

              {data.reviews.length > 0 ? (
                <div className="space-y-6">
                  {data.reviews.map((review, index) => (
                    <ReviewCard key={`${review.authorName}-${review.time}`} review={review} />
                  ))}
                </div>
              ) : (
                <Card className="bg-card/40 border border-primary/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-foreground/70 mb-4">
                      No reviews available at this time.
                    </p>
                    <Button
                      asChild
                      className="bg-primary hover:bg-primary/90 text-black font-semibold"
                      data-testid="button-be-first-review"
                    >
                      <a
                        href="https://search.google.com/local/reviews?placeid=ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Be the First to Review
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-full">
                  <img
                    src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
                    alt="Google"
                    className="h-5"
                  />
                  <span className="text-sm text-foreground/60">
                    Powered by Google Reviews
                  </span>
                </div>
              </div>
            </>
          )}

          {data?.error && (
            <Card className="bg-yellow-900/20 border border-yellow-500/30">
              <CardContent className="p-8 text-center">
                <p className="text-yellow-400 mb-4">
                  Reviews are temporarily unavailable. Please check out our Google listing directly.
                </p>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-black font-semibold"
                  data-testid="button-view-google-fallback"
                >
                  <a
                    href="https://search.google.com/local/reviews?placeid=ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Reviews on Google
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
