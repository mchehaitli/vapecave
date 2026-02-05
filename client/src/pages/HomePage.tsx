import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import MainLayout from "@/layouts/MainLayout";
import LazyBrandsCarousel from "@/components/LazyBrandsCarousel";
import { useFeaturedBrands } from "@/hooks/use-brands";
import { 
  useFriscoLocation, 
  getOrderedOpeningHours
} from "@/hooks/use-store-locations";

const HomePage = () => {
  // State for scroll-to-top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Fetch featured brands from API
  const { data: apiBrands, isLoading, error } = useFeaturedBrands();
  
  // Fetch location data from API
  const { data: friscoLocation, isLoading: friscoLoading } = useFriscoLocation();
  
  // Effect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down 300px
      setShowScrollTop(window.scrollY > 300);
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Enhanced home page structured data with focus on Frisco location & Google Maps integration using latest schema.org standards
  const homePageSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://vapecavetx.com/#organization",
    "name": "Vape Cave",
    "url": "https://vapecavetx.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://vapecavetx.com/logo.png",
      "width": 180,
      "height": 60
    },
    "image": [
      "https://vapecavetx.com/vapecave-logo.png",
      "https://vapecavetx.com/vapecave-logo.svg"
    ],
    "description": "Vape Cave offers premium vaping products, e-liquids, disposables, and accessories at our convenient Frisco, TX location. We provide expert advice and a wide selection for all your vaping needs.",
    "keywords": "vape shop, vape products, vape frisco tx, vape accessories, vape store near me",
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
        "contactOption": "TollFree"
      }
    ],
    "location": [
      {
        "@type": "Store",
        "@id": "https://vapecavetx.com/locations/frisco",
        "name": "Vape Cave Frisco",
        "url": "https://vapecavetx.com/locations/frisco",
        "telephone": "+14692940061",
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
        "hasMap": [
          {
            "@type": "Map",
            "name": "Google Maps",
            "url": "https://maps.app.goo.gl/jzbqUDyvvGHuwyXJ7",
            "description": "Find our Frisco vape shop using Google Maps"
          },
          {
            "@type": "Map",
            "name": "Apple Maps",
            "url": "https://maps.apple.com/?address=6958%20Main%20St,%20Unit%20200,%20Frisco,%20TX%20%2075033,%20United%20States&auid=14231591118256703794&ll=33.150849,-96.824392&lsp=9902&q=Vape%20Cave%20Smoke%20%26%20Stuff&t=m",
            "description": "Find our Frisco vape shop on Apple Maps"
          }
        ],
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "googlePlaceId",
            "value": "ChIJZ2EXpXw9TIYRjUEpqkkI6Lg"
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
        ]
      }
    ],
    "potentialAction": [
      {
        "@type": "FindAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://maps.app.goo.gl/jzbqUDyvvGHuwyXJ7"
        },
        "description": "Find directions to our Frisco store using Google Maps",
        "query-input": "required name=location"
      },
      {
        "@type": "FindAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://maps.apple.com/?address=6958%20Main%20St,%20Unit%20200,%20Frisco,%20TX%20%2075033,%20United%20States&auid=14231591118256703794&ll=33.150849,-96.824392&lsp=9902&q=Vape%20Cave%20Smoke%20%26%20Stuff&t=m"
        },
        "description": "Find our Frisco location using Apple Maps",
        "query-input": "required name=location"
      },
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://vapecavetx.com/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://vapecavetx.com/"
    }
  };

  return (
    <MainLayout
      title="Vape Cave | Premium Vaping Products & Accessories | Frisco TX"
      description="Welcome to Vape Cave - your one-stop shop for premium vaping products, e-liquids, and accessories. Visit our conveniently located store in Frisco, TX."
      canonical="/"
    >
      <Helmet>
        <title>Vape Cave | Premium Vape Shop in Frisco TX | Disposables & Accessories</title>
        <meta name="description" content="Visit Vape Cave in Frisco TX for premium vaping products, disposables, and accessories. Located at 6958 Main St #200. Open daily with expert staff and competitive prices." />
        <meta name="keywords" content="vape shop frisco, frisco vape shop, disposable vape frisco, vape products frisco tx, vaping frisco, frisco vaporizer shop, vape cave frisco" />
        <link rel="canonical" href="https://vapecavetx.com/" />
        <meta name="geo.position" content="33.150730;-96.822550" />
        <meta name="geo.placename" content="Vape Cave Frisco" />
        <meta name="geo.region" content="US-TX" />
        <meta name="ICBM" content="33.150730, -96.822550" />
        <meta name="google-place-id" content="ChIJZ2EXpXw9TIYRjUEpqkkI6Lg" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://vapecavetx.com/" />
        <meta property="og:title" content="Vape Cave Frisco | Premium Vape Shop on Main Street" />
        <meta property="og:description" content="Visit Vape Cave in Frisco at 6958 Main St #200 for premium vaping products, expert advice, and a wide selection for all your vaping needs." />
        <meta property="og:image" content="https://vapecavetx.com/vapecave-logo.png" />
        
        {/* Structured data for search engines */}
        <script type="application/ld+json">
          {JSON.stringify(homePageSchema)}
        </script>
      </Helmet>
      
      {/* Hero Section */}
      <section id="home" className="bg-background py-20 md:py-32 text-foreground relative overflow-hidden">
        {/* Animated background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            {/* 3D Container with Neon Border */}
            <motion.div 
              className="w-full max-w-5xl mx-auto text-center relative"
              style={{
                transformStyle: 'preserve-3d',
              }}
              initial={{ opacity: 0, rotateX: 10 }}
              animate={{ opacity: 1, rotateX: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Neon border container */}
              <motion.div
                className="relative p-8 md:p-12 rounded-2xl bg-card border-2 border-primary/50"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255, 113, 0, 0.3), 0 0 40px rgba(255, 113, 0, 0.2), 0 0 60px rgba(255, 113, 0, 0.1), inset 0 0 20px rgba(255, 113, 0, 0.05)',
                    '0 0 30px rgba(255, 113, 0, 0.5), 0 0 60px rgba(255, 113, 0, 0.3), 0 0 90px rgba(255, 113, 0, 0.2), inset 0 0 30px rgba(255, 113, 0, 0.1)',
                    '0 0 20px rgba(255, 113, 0, 0.3), 0 0 40px rgba(255, 113, 0, 0.2), 0 0 60px rgba(255, 113, 0, 0.1), inset 0 0 20px rgba(255, 113, 0, 0.05)',
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold font-['Poppins'] mb-4 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Frisco's Premier <span className="text-primary">Vape</span> & <span className="text-primary">Smoke Shop</span>
              </motion.h1>
              <motion.p 
                className="text-base md:text-lg mb-2 text-foreground/90 font-medium max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              >
                Located on Main Street in Frisco's newly developed Rail District
              </motion.p>
              <motion.p 
                className="text-base md:text-lg mb-4 text-primary font-semibold max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                Open Daily 10AM - Midnight
              </motion.p>
              <motion.div 
                className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <span className="text-primary font-semibold">DELIVERY COMING SOON</span> - Sign up to be notified!
              </motion.div>
              <motion.h2 
                className="text-xl md:text-2xl lg:text-3xl mb-8 text-foreground/90 font-medium max-w-[1100px] mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                Your One Stop Vape Shop for <span className="text-primary font-semibold">Disposables</span> | <span className="text-primary font-semibold">E-Liquids</span> | <span className="text-primary font-semibold">Salts</span> | <span className="text-primary font-semibold">Glass</span> | <span className="text-primary font-semibold">Tobacco</span> | <span className="text-primary font-semibold">Hookah / Shisha</span> | <span className="text-primary font-semibold">Vaporizers</span> | <span className="text-primary font-semibold">Mods</span> |  <span className="text-primary font-semibold">THC-A</span> |   and much more
              </motion.h2>
              <motion.p 
                className="text-base md:text-lg mb-10 text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
              >
                We are a locally owned business specializing in Vaporizers, E-Liquid, Salt Nic, and many different types of disposable devices. We also carry a wide range of glass pipes and accessories as well as Novelties and Hookahs/Shisha. Basically we carry all your smoking needs!
              </motion.p>
              <motion.div 
                className="flex flex-wrap justify-center gap-5 mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.75 }}
                >
                  <Link href="/signup">
                    <div className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-lg transition-all duration-300 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1" data-testid="button-shop-now">
                      Sign Up
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Frisco Location Section - Enhance SEO importance */}
      <section 
        className="py-14 bg-background text-foreground relative overflow-hidden" 
        id="frisco-location" 
        itemScope 
        itemType="https://schema.org/Store"
        itemProp="departments"
      >
        {/* Animated background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <meta itemProp="name" content="Vape Cave Frisco" />
        <meta itemProp="identifier" content="ChIJZ2EXpXw9TIYRjUEpqkkI6Lg" />
        <meta itemProp="alternateName" content="Vape Cave Frisco Main Street" />
        <meta itemProp="description" content="Premier vape shop in Frisco, TX with a wide selection of vaping products and disposables. Conveniently located at 6958 Main St #200." />
        <meta itemProp="image" content="https://vapecavetx.com/vapecave-logo.png" />
        <meta itemProp="url" content="https://vapecavetx.com/locations/frisco" />
        <meta itemProp="priceRange" content="$$" />
        <meta itemProp="telephone" content="+14692940061" />
        <meta itemProp="email" content="vapecavetx@gmail.com" />
        <div 
          itemProp="address" 
          itemScope 
          itemType="https://schema.org/PostalAddress"
        >
          <meta itemProp="streetAddress" content="6958 Main St #200" />
          <meta itemProp="addressLocality" content="Frisco" />
          <meta itemProp="addressRegion" content="TX" />
          <meta itemProp="postalCode" content="75033" />
          <meta itemProp="addressCountry" content="US" />
        </div>
        <div 
          itemProp="geo" 
          itemScope 
          itemType="https://schema.org/GeoCoordinates"
        >
          <meta itemProp="latitude" content="33.150730" />
          <meta itemProp="longitude" content="-96.822550" />
        </div>
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div 
              className="md:w-1/2 order-2 md:order-1"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <motion.h2 
                className="text-3xl font-bold font-['Poppins'] mb-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Visit Us in Downtown Frisco
              </motion.h2>
              <motion.div 
                className="h-1 w-24 bg-primary rounded-full mb-6"
                initial={{ width: 0 }}
                whileInView={{ width: 96 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              ></motion.div>
              <motion.p 
                className="text-muted-foreground mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Our Frisco location is conveniently located at <span className="text-primary font-semibold">6958 Main St #200, Frisco, TX 75033</span>. 
                Use our direct Google Maps or Apple Maps links below to navigate to our store with ease.
              </motion.p>
              
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-3">Why Visit Our Frisco Location?</h3>
                <motion.ul 
                  className="space-y-2 text-muted-foreground"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.12
                      }
                    }
                  }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <motion.li 
                    className="flex items-start"
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Located in the heart of downtown Frisco
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Knowledgeable staff to guide your selections
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Latest products always in stock
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {friscoLocation?.openingHours
                      ? `Extended hours on Friday and Saturday (${getOrderedOpeningHours(friscoLocation.openingHours)
                          .filter(({day}) => day === 'Friday' || day === 'Saturday')
                          .map(({day, hours}) => hours)
                          .join(' & ')})` 
                      : 'Extended hours on Friday and Saturday'}
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ample parking available
                  </motion.li>
                </motion.ul>
              </motion.div>
              
              <motion.div 
                className="flex flex-wrap gap-3"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <motion.a 
                  href="https://maps.app.goo.gl/jzbqUDyvvGHuwyXJ7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded transition-colors"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Google Maps
                </motion.a>
                <motion.a 
                  href="https://maps.apple.com/?address=6958%20Main%20St,%20Unit%20200,%20Frisco,%20TX%20%2075033,%20United%20States&auid=14231591118256703794&ll=33.150849,-96.824392&lsp=9902&q=Vape%20Cave%20Smoke%20%26%20Stuff&t=m" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-muted/30 hover:bg-muted/50 border border-border text-foreground px-4 py-2 rounded transition-colors"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Apple Maps
                </motion.a>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/locations/frisco"
                    className="inline-flex items-center bg-primary/30 hover:bg-primary/40 border border-primary/50 text-foreground px-4 py-2 rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    More Store Info
                  </Link>
                </motion.div>
                <motion.a
                  href="tel:+14692940061"
                  className="inline-flex items-center bg-muted/30 hover:bg-muted/50 border border-border text-foreground px-4 py-2 rounded transition-colors"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </motion.a>
              </motion.div>
            </motion.div>
            <motion.div 
              className="md:w-1/2 order-1 md:order-2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <motion.div 
                className="p-6 rounded-xl relative bg-card border-2 border-primary/50 shadow-[0_0_20px_rgba(255,113,0,0.3),0_0_40px_rgba(255,113,0,0.15)]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.h3 
                  className="text-xl font-semibold mb-4 text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  Quick Information
                </motion.h3>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="bg-card/40 p-4 rounded-lg border border-border"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h4 className="text-primary font-semibold mb-2">Location</h4>
                    <p className="text-muted-foreground text-sm">6958 Main St #200, Frisco, TX 75033</p>
                    <p className="text-primary/80 text-xs mt-1">Downtown Frisco</p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-card/40 p-4 rounded-lg border border-border"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h4 className="text-primary font-semibold mb-2">Hours</h4>
                    {friscoLoading ? (
                      <>
                        <div className="h-4 bg-zinc-700 animate-pulse rounded w-24 mb-2"></div>
                        <div className="h-4 bg-zinc-700 animate-pulse rounded w-28"></div>
                      </>
                    ) : (
                      <>
                        {friscoLocation?.openingHours && getOrderedOpeningHours(friscoLocation.openingHours)
                          .map(({day, hours}, index) => (
                            <p key={day} className="text-muted-foreground text-sm">
                              <span className="font-medium">{day.substring(0, 3)}:</span> {hours}
                            </p>
                          ))}
                        {!friscoLocation?.openingHours && (
                          <>
                            <p className="text-muted-foreground text-sm">Sun-Thu: 10AM - 12AM</p>
                            <p className="text-muted-foreground text-sm">Fri-Sat: 10AM - 1AM</p>
                          </>
                        )}
                        <p className="text-primary/80 text-xs mt-1">Open 7 days a week</p>
                      </>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className="bg-card/40 p-4 rounded-lg border border-border"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h4 className="text-primary font-semibold mb-2">Contact</h4>
                    <p className="text-muted-foreground text-sm">(469) 294-0061</p>
                    <p className="text-primary/80 text-xs mt-1">vapecavetx@gmail.com</p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-card/40 p-4 rounded-lg border border-border"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h4 className="text-primary font-semibold mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Disposables</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">E-Liquids</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Salts</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Glass</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Tobacco</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Hookah / Shisha</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Vaporizers</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">Mods</span>
                      <span className="inline-block text-xs bg-primary/20 rounded-full px-2 py-1 text-primary">THC-A</span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Featured Brands Section with rotating categories */}
      <section className="py-16 bg-background relative overflow-hidden" id="featured-brands">
        {/* Animated background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Featured <span className="text-primary">Brands</span>
            </motion.h2>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, staggerChildren: 0.1 }}
          >
            {isLoading ? (
              // Loading state
              Array(6).fill(0).map((_, index) => (
                <motion.div
                  key={index}
                  className="rounded-xl shadow-lg bg-muted h-64 animate-pulse"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="p-5 h-16 bg-gradient-to-r from-card to-muted border-b border-border"></div>
                  <div className="p-4 flex-grow flex flex-col items-center justify-center">
                    <div className="h-16 w-full bg-muted-foreground/20 rounded mb-2"></div>
                    <div className="h-6 w-32 bg-muted-foreground/20 rounded mb-1"></div>
                    <div className="h-4 w-48 bg-muted-foreground/20 rounded"></div>
                  </div>
                </motion.div>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Unable to load featured brands. Please try again later.</p>
              </div>
            ) : (
              // Loaded successfully - show API data
              apiBrands?.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <LazyBrandsCarousel 
                    category={category.category} 
                    brands={category.brands.map(brand => ({
                      ...brand,
                      // Use placeholder image if brand has no image
                      image: brand.image || `/brand-logos/placeholder.svg`
                    }))}
                    intervalMs={category.intervalMs || 5000}
                    bgClass={category.bgClass || "bg-zinc-800"}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
          
          <div className="text-center mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/products">
                <div className="inline-block bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  View All Products
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Age Verification Notice */}
      <section className="py-14 bg-background relative overflow-hidden" id="age-verification">
        {/* Animated background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/2 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.2, 0.3],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto p-8 rounded-xl bg-card border-2 border-primary/50"
            animate={{
              boxShadow: [
                '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
                '0 0 25px rgba(255, 113, 0, 0.4), 0 0 50px rgba(255, 113, 0, 0.2)',
                '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
              ]
            }}
            transition={{
              boxShadow: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              opacity: { duration: 0.7 },
              y: { duration: 0.7 }
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-primary mx-auto mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </motion.svg>
            <motion.h2 
              className="text-2xl font-bold font-['Poppins'] mb-3 text-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Age Verification Required
            </motion.h2>
            <motion.p 
              className="text-muted-foreground mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Our products are intended for adult smokers aged 21 and over. Proof of age will be required upon purchase both online and in our physical stores.
            </motion.p>
            <motion.p 
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              We strictly adhere to all local, state, and federal regulations regarding the sale of vaping products.
            </motion.p>
          </motion.div>
        </div>
      </section>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <motion.button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center"
          aria-label="Scroll to top"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </MainLayout>
  );
};

export default HomePage;