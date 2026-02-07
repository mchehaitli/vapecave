import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Button } from "@/components/ui/button";
import type { HeroSlide, SiteSettings, CategoryBanner } from "@shared/schema";

export default function DeliveryHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: heroSlides = [] } = useQuery<HeroSlide[]>({
    queryKey: ['/api/hero-slides'],
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
  });

  const { data: categoryBanners = [], isLoading: bannersLoading } = useQuery<CategoryBanner[]>({
    queryKey: ['/api/category-banners'],
  });

  const activeBanners = categoryBanners
    .filter(b => b.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const currentSlideData = heroSlides[currentSlide];
  const isVideoSlide = currentSlideData?.mediaType === 'video';

  useEffect(() => {
    const addedLinks: HTMLLinkElement[] = [];
    heroSlides.forEach((slide) => {
      const url = slide.mediaUrl || slide.image || '';
      if (!url) return;
      if (slide.mediaType === 'video') {
        if (!document.querySelector(`link[rel="preload"][href="${url}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'video';
          link.href = url;
          document.head.appendChild(link);
          addedLinks.push(link);
        }
      } else {
        const img = new Image();
        img.src = url;
      }
    });
    return () => {
      addedLinks.forEach(link => link.remove());
    };
  }, [heroSlides]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, isVideoSlide ? 8000 : 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length, isVideoSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const getMediaUrl = (slide: HeroSlide) => {
    return slide.mediaUrl || slide.image || '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeliveryHeader />

      <DeliveryCategoryNav />

      {siteSettings?.infoBarEnabled && siteSettings?.infoBarMessage && (
        <motion.div 
          className="bg-primary text-primary-foreground py-2 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider">
            {siteSettings.infoBarMessage}
          </p>
        </motion.div>
      )}

      <main className="flex-1">
        {heroSlides.length > 0 ? (
          <section className={`relative w-full overflow-hidden bg-background ${isVideoSlide ? 'h-[70vh]' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`relative w-full ${isVideoSlide ? 'h-full' : 'flex items-center justify-center'}`}
              >
                <div className="absolute inset-0 rounded-lg shadow-[0_0_30px_rgba(255,113,0,0.15)] pointer-events-none z-10" />
                {isVideoSlide ? (
                  <video
                    ref={videoRef}
                    src={getMediaUrl(currentSlideData)}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                    onLoadedData={(e) => (e.target as HTMLVideoElement).play()}
                    onCanPlayThrough={(e) => (e.target as HTMLVideoElement).play()}
                    style={{ willChange: 'transform' }}
                  />
                ) : (
                  <img
                    src={getMediaUrl(currentSlideData)}
                    alt={currentSlideData?.title || 'Vape Cave Smoke Shop Frisco Hero'}
                    className="w-full h-auto max-h-[80vh] object-cover"
                    loading="lazy"
                  />
                )}

                <div className="absolute inset-0 flex items-end justify-center pb-3">
                  <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  >
                    <Link href={currentSlideData?.buttonLink || "/delivery/shop"}>
                      <Button 
                        size="lg" 
                        className="bg-primary/30 hover:bg-primary/50 text-primary-foreground/70 text-lg px-10 py-7 h-auto font-bold uppercase tracking-wide border border-primary/50 shadow-[0_0_15px_rgba(255,113,0,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,113,0,0.5)]"
                      >
                        {currentSlideData?.buttonText || "Shop Now"}
                        <ArrowRight className="ml-3 h-6 w-6" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-md hover:bg-card border border-border/50 p-4 rounded-full transition-all z-20 hover:scale-110"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-md hover:bg-card border border-border/50 p-4 rounded-full transition-all z-20 hover:scale-110"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentSlide(index);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'w-12 bg-primary shadow-lg shadow-primary/50'
                          : 'w-2 bg-foreground/30 hover:bg-foreground/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : null}

        {bannersLoading ? (
          <section className="py-12 md:py-20 bg-background">
            <div className="container mx-auto px-4 md:px-6 space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative w-full h-[300px] md:h-[400px] bg-card animate-pulse rounded-2xl" />
              ))}
            </div>
          </section>
        ) : activeBanners.length > 0 ? (
          <section className="py-12 md:py-20 bg-background">
            <div className="container mx-auto px-4 md:px-6 space-y-8 md:space-y-12">
              {activeBanners.map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.7, 
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <Link href={banner.buttonLink || `/delivery/shop?category=${banner.categoryId}`}>
                    <motion.div
                      className="relative w-full h-[280px] sm:h-[350px] md:h-[420px] lg:h-[500px] rounded-2xl overflow-hidden cursor-pointer group shadow-[0_0_20px_rgba(255,113,0,0.1)] hover:shadow-[0_0_30px_rgba(255,113,0,0.25)] transition-shadow duration-500"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <motion.img
                        src={banner.image}
                        alt={`${banner.title || 'Category'} - Vape Cave Frisco`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-14">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                        >
                          {banner.subtitle && (
                            <span className="text-[#FF7100] text-sm md:text-base font-bold uppercase tracking-widest mb-2 block">
                              {banner.subtitle}
                            </span>
                          )}
                          {banner.title && (
                            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight mb-4 md:mb-6 max-w-2xl">
                              {banner.title}
                            </h2>
                          )}
                          <Button 
                            size="lg"
                            className="bg-[#FF7100] hover:bg-[#FF7100]/90 text-white font-bold uppercase tracking-wide px-8 py-6 h-auto text-base md:text-lg group-hover:scale-105 transition-transform duration-300 border-2 border-[#FF7100] hover:border-[#FF7100]/80"
                          >
                            {banner.buttonText || "Shop Now"}
                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </motion.div>
                      </div>

                      <div className="absolute inset-0 border-2 border-[#FF7100]/0 group-hover:border-[#FF7100]/50 rounded-2xl transition-all duration-500" />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ) : null}

      </main>

      <DeliveryFooter />
    </div>
  );
}
