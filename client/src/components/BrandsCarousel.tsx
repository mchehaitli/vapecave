import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Brand {
  name: string;
  logo: string | null;
}

interface BrandsCarouselProps {
  category: string;
  brands: Brand[];
  intervalMs?: number;
  bgClass?: string;
  debug?: boolean;
}

const BrandsCarousel = ({ 
  category, 
  brands, 
  intervalMs = 5000, 
  bgClass = "bg-gray-800",
  debug = false
}: BrandsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isHovered && brands.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % brands.length);
      }, intervalMs);
      
      return () => clearInterval(interval);
    }
    return () => {};
  }, [brands.length, intervalMs, isHovered]);

  if (brands.length === 0) {
    return null;
  }

  const currentBrand = brands[currentIndex];
  const altText = `${currentBrand.name} – ${category} brand at Vape Cave Frisco`;
  const hasImage = !!currentBrand.logo && currentBrand.logo !== '/brand-logos/placeholder.svg' && !failedImages.has(currentIndex);

  return (
    <motion.div 
      className="rounded-xl overflow-hidden h-full flex flex-col relative bg-card border-2 border-primary/50"
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
        }
      }}
      whileHover={{ scale: 1.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-2 flex items-center justify-center bg-primary border-b border-primary/50">
        <h3 className="text-base font-bold text-black">{category}</h3>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <div className="relative min-h-[120px] flex-grow overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center w-full h-full px-2 py-2"
            >
              {hasImage ? (
                <img
                  src={currentBrand.logo!}
                  alt={altText}
                  className="max-h-[100px] max-w-full object-contain mx-auto"
                  loading="lazy"
                  onError={() => handleImageError(currentIndex)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <img
                    src="/brand-logos/placeholder.svg"
                    alt={altText}
                    className="max-h-[60px] max-w-full object-contain mx-auto opacity-50"
                    loading="lazy"
                  />
                  <span className="text-sm text-muted-foreground">{currentBrand.name}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {brands.length > 1 && (
        <div className="flex justify-center p-1 space-x-1.5 bg-muted/30">
          {brands.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary scale-125' : 'bg-gray-600'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BrandsCarousel;