import React, { useState } from "react";
import ageLogo from "../assets/age_verification_logo_new-optimized.png";
import ageLogoWebP from "../assets/age_verification_logo_new.webp";
import { Helmet } from "react-helmet";

interface AgeVerificationModalProps {
  onVerify: (isVerified: boolean) => void;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ onVerify }) => {
  const [showWarning, setShowWarning] = useState(false);

  const handleVerify = (verified: boolean) => {
    if (verified) {
      onVerify(true);
    } else {
      setShowWarning(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md" style={{ willChange: 'opacity' }}>
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Age Verification - Vape Cave Frisco",
              "description": "Verify your age to access Vape Cave Frisco's premium selection of vaping products. Must be 21+ to enter. Disposables, e-liquids & more.",
              "url": "https://vapecavetx.com",
              "isAccessibleForFree": true,
              "keywords": "age verification, vape shop frisco, premium vaping products frisco, frisco vape shop",
              "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h3", ".text-gray-300"]
              },
              "mainContentOfPage": {
                "@type": "WebPageElement",
                "cssSelector": ".bg-black.rounded-xl"
              },
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://vapecavetx.com"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Age Verification",
                    "item": "https://vapecavetx.com/age-verification"
                  }
                ]
              },
              "publisher": {
                "@type": "Store",
                "name": "Vape Cave Frisco",
                "alternateName": ["Vape Cave Smoke & Stuff", "Premium Vape Shop Frisco"],
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
                "telephone": "+14692940061",
                "email": "info@vapecavetx.com",
                "priceRange": "$$",
                "paymentAccepted": "Cash, Credit Card, Debit Card",
                "hasMap": [
                  {
                    "@type": "Map",
                    "name": "Google Maps",
                    "url": "https://www.google.com/maps/place/?q=place_id:ChIJZ2EXpXw9TIYRjUEpqkkI6Lg",
                    "description": "Find our Frisco vape shop using Google Maps"
                  },
                  {
                    "@type": "Map",
                    "name": "Google Maps Search",
                    "url": "https://www.google.com/maps/search/?api=1&query=Vape+Cave+Frisco+TX",
                    "description": "Direct link to our location using Google Maps search"
                  }
                ],
                "identifier": [
                  {
                    "@type": "PropertyValue",
                    "name": "Google Place ID",
                    "value": "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
                  }
                ]
              }
            }
          `}
        </script>
      </Helmet>
      <div className="bg-black rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 md:p-8 border-2 border-primary relative">
        <div className="mb-6 flex justify-center">
          <picture>
            <source srcSet={ageLogoWebP} type="image/webp" />
            <img 
              src={ageLogo} 
              alt="Vape Cave - Smoke & Stuff" 
              className="w-[300px] md:w-[350px] lg:w-[400px] h-auto"
              width="800"
              height="373"
            />
          </picture>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="font-['Poppins'] font-bold text-2xl mb-3 text-white">Age Verification</h3>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-4"></div>
          <p className="mb-3 text-gray-300">You must be at least 21 years old to enter this website. Please verify your age to continue.</p>
        </div>
        
        {showWarning && (
          <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-800 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            <span>Sorry, you must be 21 or older to access this website.</span>
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <button 
            onClick={() => handleVerify(true)}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            data-location="Frisco, TX"
            data-place-id="ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
            data-store-id="vape-cave-frisco"
            data-action="age-verify-accept"
            itemProp="potentialAction"
            itemScope
            itemType="https://schema.org/AgreeAction"
          >
            <span className="flex items-center justify-center" itemProp="name">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              I am 21 or older
            </span>
            <meta itemProp="location" content="6958 Main St #200, Frisco, TX 75033" />
            <meta itemProp="description" content="Age verification for access to Vape Cave Frisco" />
          </button>
          <button 
            onClick={() => handleVerify(false)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow"
            data-action="age-verify-decline"
            itemProp="potentialAction"
            itemScope
            itemType="https://schema.org/DisagreeAction"
          >
            <span className="flex items-center justify-center" itemProp="name">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              I am under 21
            </span>
          </button>
        </div>
        
        <p className="text-xs text-gray-400 text-center">
          By entering this site, you are confirming that you are of legal age to purchase vaping products in your location. Vape Cave Frisco only serves customers 21 and older.
        </p>
        <div className="mt-2 text-xs text-gray-500 text-center" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
          <span itemProp="streetAddress">6958 Main St #200</span>, 
          <span itemProp="addressLocality">Frisco</span>, 
          <span itemProp="addressRegion">TX</span> 
          <span itemProp="postalCode">75033</span>
        </div>
      </div>
    </div>
  );
};

export default AgeVerificationModal;
