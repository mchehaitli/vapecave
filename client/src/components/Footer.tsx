import { Link } from "wouter";
import { useState } from "react";
import { Helmet } from "react-helmet";
import Logo from "./Logo";
import { 
  useFriscoLocation, 
  getOrderedOpeningHours 
} from "@/hooks/use-store-locations";

const Footer = () => {
  const [email, setEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setSubscriptionError("Email is required");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscriptionError("Invalid email format");
      return;
    }
    
    setIsSubmitting(true);
    setSubscriptionError(null);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }
      
      // Subscription successful
      setSubscriptionSuccess(true);
      setEmail("");
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubscriptionSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      setSubscriptionError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get location data from API
  const { data: frisco, isLoading: isFriscoLoading } = useFriscoLocation();
  
  // Generate LocalBusiness JSON-LD for footer
  const generateLocalBusinessSchema = () => {
    if (!frisco) return {}; // Return empty object if data is not loaded yet
    
    // Transform database field names to the expected format
    const location = {
      image: frisco.image,
      description: frisco.description,
      acceptedPayments: frisco.accepted_payments || [],
      googlePlaceId: frisco.google_place_id,
      appleMapsLink: frisco.apple_maps_link,
      fullAddress: frisco.full_address,
      coordinates: {
        lat: parseFloat(frisco.lat as string),
        lng: parseFloat(frisco.lng as string)
      },
      socialProfiles: {
        facebook: frisco.social_profiles?.facebook,
        instagram: frisco.social_profiles?.instagram,
        twitter: frisco.social_profiles?.twitter,
        yelp: frisco.social_profiles?.yelp
      }
    };
    
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://vapecavetx.com/locations/frisco#business",
      "name": "Vape Cave Frisco",
      "image": location.image,
      "url": "https://vapecavetx.com/locations/frisco",
      "telephone": "+14692940061",
      "email": "vapecavetx@gmail.com",
      "priceRange": "$$",
      "description": location.description,
      "currenciesAccepted": "USD",
      "paymentAccepted": location.acceptedPayments.join(", "),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "6958 Main St #200",
        "addressLocality": "Frisco",
        "addressRegion": "TX",
        "postalCode": "75033",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": location.coordinates.lat,
        "longitude": location.coordinates.lng
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "googlePlaceId",
          "value": location.googlePlaceId || ""
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
        location.socialProfiles?.facebook,
        location.socialProfiles?.instagram,
        location.socialProfiles?.twitter,
        location.socialProfiles?.yelp
      ],
      "keywords": "vape shop frisco, premium vape shop frisco, frisco vape shop, disposable vapes frisco",
      "hasMap": [
        {
          "@type": "Map",
          "url": location.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${location.googlePlaceId}` : `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`
        },
        {
          "@type": "Map",
          "url": location.appleMapsLink || `https://maps.apple.com/?q=${encodeURIComponent(location.fullAddress)}`
        }
      ]
    };
  };

  return (
    <footer className="bg-card text-foreground border-t border-border">
      {/* LocalBusiness JSON-LD Schema for SEO */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(generateLocalBusinessSchema())}
        </script>
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Social Media Links */}
          <div className="lg:col-span-2">
            <h4 className="font-['Poppins'] font-semibold text-xl mb-4">Connect With Us</h4>
            <div className="flex space-x-6 mb-4">
              <a 
                href="https://www.facebook.com/100076473675726" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Visit our Facebook page"
                data-testid="link-facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/vapecavetx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Visit our Instagram page"
                data-testid="link-instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
            <p className="text-muted-foreground">Follow us on social media for the latest updates, promotions, and vaping news.</p>
            
            {/* Quick Links Section */}
            <h4 className="font-['Poppins'] font-semibold text-xl mt-8 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/products">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Products</span>
                </Link>
              </li>
              <li>
                <Link href="/delivery">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Delivery</span>
                </Link>
              </li>
              <li>
                <Link href="/locations/frisco">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Frisco Store</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Blog</span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">FAQs</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 2: Main Contact & Newsletter */}
          <div>
            <h4 className="font-['Poppins'] font-semibold text-xl mb-4">Main Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-muted-foreground">(469) 476-0623</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-muted-foreground">vapecavetx@gmail.com</span>
              </li>
            </ul>
            
            {/* Newsletter Signup */}
            <div className="mt-8">
              <h4 className="font-['Poppins'] font-semibold text-xl mb-4">Newsletter</h4>
              <p className="text-muted-foreground mb-3">Get the latest deals and updates from Vape Cave</p>
              
              {subscriptionSuccess && (
                <div className="bg-primary/20 border border-primary/40 text-white rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <i className="fas fa-check-circle text-primary mr-2"></i>
                    <p>Thanks for subscribing!</p>
                  </div>
                </div>
              )}
              
              {subscriptionError && (
                <div className="bg-red-900/20 border border-red-500/40 text-white rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                    <p>{subscriptionError}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubscribe} className="flex flex-col space-y-3">
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-black font-bold px-4 py-2 rounded-r-md transition-colors flex items-center justify-center disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <i className="fas fa-paper-plane"></i>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Column 3: Frisco Location */}
          <div>
            <h4 className="font-['Poppins'] font-semibold text-xl mb-4">
              <Link href="/locations/frisco" className="hover:text-primary/90">
                Frisco Location
              </Link>
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <a 
                    href="https://maps.app.goo.gl/jzbqUDyvvGHuwyXJ7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-muted-foreground hover:text-primary/80 block">
                      {frisco?.full_address || "Loading address..."}
                    </span>
                    <span className="text-primary/80 hover:text-primary text-xs mt-1 block">Find us on Google Maps</span>
                  </a>
                  <a 
                    href="https://maps.apple.com/?address=6958%20Main%20St,%20Unit%20200,%20Frisco,%20TX%20%2075033,%20United%20States&auid=14231591118256703794&ll=33.150849,-96.824392&lsp=9902&q=Vape%20Cave%20Smoke%20%26%20Stuff&t=m" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary/80 hover:text-primary text-xs mt-1 block"
                  >
                    View on Apple Maps
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-muted-foreground">(469) 294-0061</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-muted-foreground">
                  {frisco?.hours || "Loading hours..."}
                  {frisco?.opening_hours && (
                    <span className="block text-xs mt-1 text-white/60">
                      {getOrderedOpeningHours(frisco.opening_hours).map(({day, hours}, index) => (
                        <span key={day} className="block">
                          {day}: {hours}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </li>
              {frisco?.closed_days && (
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-muted-foreground">{frisco.closed_days}</span>
                </li>
              )}
            </ul>
          </div>

        </div>
        
        <div className="border-t border-white/10 mt-12 pt-6 text-center md:flex md:justify-between md:text-left">
          <p className="text-muted-foreground mb-4 md:mb-0">&copy; {new Date().getFullYear()} Vape Cave. All rights reserved.</p>
          <div className="space-x-4">
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Age Verification</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
