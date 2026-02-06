import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FloatingNewsletter from "@/components/FloatingNewsletter";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = "Vape Cave Smoke & Stuff - Premium Vaping Products & Accessories",
  description = "Your One Stop Vape Shop for Disposables | E-Liquids | Salts | Delta | THC - A | Glass | Tobacco | Hookah / Shisha | Vaporizers | Mods | and much more",
  canonical = "",
  ogImage = "/images/vape-cave-share-image.jpg",
  structuredData
}) => {
  // Determine canonical URL
  const baseUrl = "https://vapecavetx.com";
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl;
  
  // Enhanced structured data with emphasis on Frisco location
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://vapecavetx.com/#organization",
    "name": "Vape Cave Smoke & Stuff",
    "alternateName": ["Vape Cave Smoke & Stuff Frisco", "Vape Cave Smoke & Stuff", "Premium Vape Shop Frisco"],
    "url": "https://vapecavetx.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://vapecavetx.com/logo.png",
      "width": 180,
      "height": 60
    },
    "description": "Your One Stop Vape Shop for Disposables | E-Liquids | Salts | Glass | Tobacco | Hookah / Shisha | Vaporizers | Mods | and much more",
    "slogan": "Your One Stop Vape Shop for Premium Vaping Products in Frisco, TX",
    "keywords": "vape shop frisco, disposable vapes, e-liquids, salts, glass, tobacco, hookah, shisha, vaporizers, mods, vape products frisco tx, vape cave frisco",
    "founder": {
      "@type": "Person",
      "name": "Vape Cave Smoke & Stuff Founder",
      "jobTitle": "CEO"
    },
    "foundingDate": "2019",
    "sameAs": [
      "https://facebook.com/vapecavetx",
      "https://instagram.com/vapecavetx",
      "https://twitter.com/vapecavetx",
      "https://yelp.com/biz/vape-cave-frisco"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+14692940061",
        "contactType": "customer service",
        "areaServed": ["Frisco", "Allen", "Plano", "McKinney", "Dallas", "North Texas"],
        "availableLanguage": "English",
        "contactOption": "TollFree",
        "hoursAvailable": [
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
        ]
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "6958 Main St #200",
      "addressLocality": "Frisco",
      "addressRegion": "TX",
      "postalCode": "75033",
      "addressCountry": "US"
    },
    "location": [
      {
        "@type": "Store",
        "name": "Vape Cave Smoke & Stuff Frisco",
        "url": "https://vapecavetx.com/locations/frisco",
        "image": "https://vapecavetx.com/storefront-frisco.jpg",
        "priceRange": "$$",
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
          "latitude": 33.150730,
          "longitude": -96.822550
        },
        "telephone": "+14692940061",
        "email": "vapecavetex@gmail.com",
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
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "googlePlaceId",
            "value": "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
          },
          {
            "@type": "PropertyValue",
            "name": "yearEstablished",
            "value": "2019"
          }
        ],
        "hasMap": [
          {
            "@type": "Map",
            "url": "https://www.google.com/maps/place/?q=place_id:ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
          },
          {
            "@type": "Map",
            "url": "https://www.google.com/maps/search/?api=1&query=Vape+Cave+Frisco+TX"
          }
        ],
        "areaServed": ["Frisco", "Allen", "Plano", "McKinney", "North Texas"],
        "amenityFeature": [
          {
            "@type": "LocationFeatureSpecification",
            "name": "Expert Staff",
            "value": true
          },
          {
            "@type": "LocationFeatureSpecification",
            "name": "Free Parking",
            "value": true
          },
          {
            "@type": "LocationFeatureSpecification",
            "name": "ADA Accessible",
            "value": true
          }
        ],
        "specialOpeningHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "validFrom": "2023-12-24",
          "validThrough": "2023-12-24",
          "opens": "10:00",
          "closes": "18:00"
        }
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", ".speakable"]
      }
    },
    "potentialAction": [
      {
        "@type": "FindAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://vapecavetx.com/locations",
          "inLanguage": "en-US",
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/IOSPlatform",
            "http://schema.org/AndroidPlatform"
          ]
        },
        "query-input": "required name=search_term_string"
      },
      {
        "@type": "ViewAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://vapecavetx.com/locations/frisco"
        },
        "name": "View Frisco Store Details"
      },
      {
        "@type": "MapAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.google.com/maps/place/?q=place_id:ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
        },
        "name": "Get Directions to Frisco Store"
      }
    ],
    "brand": {
      "@type": "Brand",
      "name": "Vape Cave Smoke & Stuff",
      "logo": "https://vapecavetx.com/logo.png",
      "slogan": "Your One Stop Vape Shop for Disposables, E-Liquids and more"
    }
  };

  const schemaData = structuredData || defaultStructuredData;

  return (
    <div className="flex flex-col min-h-screen font-sans text-dark bg-light">
      <Helmet>
        {/* Resource Hints for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Preload Critical Fonts */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Google Analytics - Deferred for Performance */}
        <script async defer src="https://www.googletagmanager.com/gtag/js?id=G-9S39LGLQYG"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9S39LGLQYG');
          `}
        </script>
        
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="keywords" content="vape shop frisco, disposable vapes, e-liquids, salts, glass, tobacco, hookah, shisha, vaporizers, mods, vape products frisco tx, vape cave frisco" />
        <meta name="author" content="Vape Cave Smoke & Stuff" />
        <meta name="robots" content="index, follow" />
        <meta name="geo.position" content="33.150730;-96.822550" />
        <meta name="geo.placename" content="Vape Cave Smoke & Stuff Frisco" />
        <meta name="geo.region" content="US-TX" />
        <meta name="ICBM" content="33.150730, -96.822550" />
        
        {/* Canonical Tag */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Enhanced Website Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://vapecavetx.com/#website",
            "url": "https://vapecavetx.com",
            "name": "Vape Cave Smoke & Stuff - Premium Vaping Products & Accessories",
            "description": "Vape Cave Smoke & Stuff offers premium vaping products at our Frisco, TX location. Shop our selection of disposable vapes, e-liquids, and more.",
            "publisher": {
              "@type": "Organization",
              "@id": "https://vapecavetx.com/#organization",
              "name": "Vape Cave Smoke & Stuff",
              "logo": {
                "@type": "ImageObject",
                "url": "https://vapecavetx.com/vapecave-logo.png"
              }
            },
            "potentialAction": [
              {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://vapecavetx.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            ],
            "inLanguage": "en-US",
            "copyrightYear": "2023",
            "dateModified": "2025-05-09"
          })}
        </script>
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${baseUrl}${ogImage}`} />
        <meta property="og:site_name" content="Vape Cave Smoke & Stuff" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        
        {/* Favicon and PWA manifest */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff6b35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Performance hints */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Helmet>
      
      <div className="bg-[#c0392b] text-white text-center py-1.5 text-xs md:text-sm font-bold tracking-wide z-[60] relative">
        WARNING: SOME OF THESE PRODUCTS CONTAIN NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.
      </div>
      <Navigation />
      <main className="flex-grow">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </main>
      <FloatingNewsletter />
      <Footer />
    </div>
  );
};

export default MainLayout;
