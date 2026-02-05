import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ApiBrand {
  id: number;
  categoryId: number;
  name: string;
  image: string;
  description: string;
  displayOrder?: number;
  createdAt?: string;
}

interface Brand {
  name: string;
  image: string;
  description: string;
}

interface BrandsCarouselProps {
  category: string;
  brands: Brand[] | ApiBrand[];
  intervalMs?: number;
  bgClass?: string;
  debug?: boolean; // Show auto-sizing parameters for testing
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

  useEffect(() => {
    // Only autoplay when not hovered
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
  
  // Dynamically calculate text size and layout based on description length and word count
  // For debug mode - capture metrics about the description text
  const descriptionMetrics = useMemo(() => {
    if (!currentBrand.description) {
      return { 
        length: 0, 
        wordCount: 0, 
        sizeCategory: "none"
      };
    }
    const description = currentBrand.description.trim();
    const length = description.length;
    const wordCount = description.split(/\s+/).length;
    
    let sizeCategory = "very short";
    if (length === 0) sizeCategory = "empty";
    else if (length < 40 || wordCount < 6) sizeCategory = "very short";
    else if (length < 80 || wordCount < 12) sizeCategory = "short";
    else if (length < 160 || wordCount < 25) sizeCategory = "medium";
    else if (length < 250 || wordCount < 40) sizeCategory = "long";
    else sizeCategory = "very long";
    
    return { length, wordCount, sizeCategory };
  }, [currentBrand.description]);
    
  const textStyles = useMemo(() => {
    if (!currentBrand.description) {
      return {
        containerHeight: "min-h-[30px]",
        fontSize: "text-sm",
        lineClamp: "line-clamp-1",
        padding: "py-2"
      };
    }
    
    const description = currentBrand.description.trim();
    const descLength = description.length;
    const wordCount = description.split(/\s+/).length;
    
    // No description text
    if (descLength === 0) {
      return {
        containerHeight: "min-h-[30px]",
        fontSize: "text-sm",
        lineClamp: "line-clamp-1",
        padding: "py-2"
      };
    }
    
    // Very short description (< 40 chars or < 6 words)
    if (descLength < 40 || wordCount < 6) {
      return {
        containerHeight: "min-h-[50px]",
        fontSize: "text-base",
        lineClamp: "line-clamp-1",
        padding: "py-2"
      };
    }
    // Short description (< 80 chars or < 12 words)
    else if (descLength < 80 || wordCount < 12) {
      return {
        containerHeight: "min-h-[70px]",
        fontSize: "text-sm",
        lineClamp: "line-clamp-2",
        padding: "py-2"
      };
    }
    // Medium description (< 160 chars or < 25 words)
    else if (descLength < 160 || wordCount < 25) {
      return {
        containerHeight: "min-h-[90px]",
        fontSize: "text-sm",
        lineClamp: "line-clamp-3",
        padding: "py-2"
      };
    }
    // Long description (< 250 chars or < 40 words)
    else if (descLength < 250 || wordCount < 40) {
      return {
        containerHeight: "min-h-[110px]",
        fontSize: "text-xs",
        lineClamp: "line-clamp-4",
        padding: "py-2"
      };
    }
    // Very long description
    else {
      return {
        containerHeight: "min-h-[130px]",
        fontSize: "text-xs",
        lineClamp: "line-clamp-5",
        padding: "py-2"
      };
    }
  }, [currentBrand.description]);

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
              className="flex flex-col items-center justify-center text-center px-2 py-2"
            >
              <div className={`${textStyles.containerHeight} w-full flex flex-col justify-center transition-all duration-300`}>
                <div className="bg-muted/70 px-3 py-3 rounded-t w-full">
                  <h4 className="text-lg md:text-xl font-bold text-primary line-clamp-1">{currentBrand.name}</h4>
                </div>
                {currentBrand.description && (
                  <div className={`bg-muted/50 px-3 ${textStyles.padding} rounded-b w-full transition-all duration-300`}>
                    <p className={`${textStyles.fontSize} text-foreground ${textStyles.lineClamp} transition-all duration-300`}>
                      {currentBrand.description}
                    </p>
                  </div>
                )}
              </div>
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
      
      {/* Debug panel showing auto-sizing metrics */}
      {debug && (
        <div className="bg-muted/80 text-foreground text-xs p-2 absolute top-0 right-0 z-50 rounded-bl overflow-auto max-w-[250px] text-left">
          <div className="font-bold mb-1">Auto-sizing Debug:</div>
          
          <div className="mt-1 font-semibold">Description:</div>
          <div>Length: {descriptionMetrics.length} chars</div>
          <div>Words: {descriptionMetrics.wordCount}</div>
          <div>Size: {descriptionMetrics.sizeCategory}</div>
          
          <div className="mt-1 font-semibold">Styles applied:</div>
          <div>Container: {textStyles.containerHeight}</div>
          <div>Font: {textStyles.fontSize}</div>
          <div>Lines: {textStyles.lineClamp}</div>
        </div>
      )}
    </motion.div>
  );
};

export default BrandsCarousel;