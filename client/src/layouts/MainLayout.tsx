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
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = "Vape Cave Smoke & Stuff - Premium Vaping Products & Accessories",
  description = "Your One Stop Vape Shop for Disposables | E-Liquids | Salts | Delta | THC - A | Glass | Tobacco | Hookah / Shisha | Vaporizers | Mods | and much more",
  canonical = "",
  ogImage = "/images/vape-cave-share-image.jpg",
}) => {
  // Determine canonical URL
  const baseUrl = "https://vapecavetx.com";
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl;
  
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
            "dateModified": "2026-02-17"
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
      <div 
        className="overflow-hidden py-1.5 z-[60] relative bg-[#FF2B00]"
        style={{
          boxShadow: '0 0 10px rgba(255, 113, 0, 0.5), 0 0 20px rgba(255, 113, 0, 0.3), 0 0 30px rgba(255, 113, 0, 0.15)'
        }}
      >
        <div className="animate-marquee whitespace-nowrap text-white text-xs md:text-sm font-bold tracking-wide">
          <span className="mx-8">⚠️ WARNING: SOME OF THESE PRODUCTS CONTAIN NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.</span>
          <span className="mx-8">⚠️ WARNING: SOME OF THESE PRODUCTS CONTAIN NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.</span>
          <span className="mx-8">⚠️ WARNING: SOME OF THESE PRODUCTS CONTAIN NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.</span>
          <span className="mx-8">⚠️ WARNING: SOME OF THESE PRODUCTS CONTAIN NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.</span>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: inline-block;
            animation: marquee 20s linear infinite;
          }
        `}</style>
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
