import { memo, Suspense } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';

// Optimized motion components with reduced bundle size
const MotionProvider = memo(({ children }: { children: React.ReactNode }) => (
  <LazyMotion features={domAnimation} strict>
    <Suspense fallback={<div>{children}</div>}>
      {children}
    </Suspense>
  </LazyMotion>
));

// Lightweight motion wrapper
export const OptimizedMotion = memo(({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode; 
  [key: string]: any; 
}) => (
  <MotionProvider>
    <m.div {...props}>
      {children}
    </m.div>
  </MotionProvider>
));

// Simple optimized page transition without LazyMotion for now
export const OptimizedPageTransition = memo(({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode; 
  [key: string]: any; 
}) => (
  <div
    style={{ 
      opacity: 1,
      transform: 'translateY(0px)',
      transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
    }}
    {...props}
  >
    {children}
  </div>
));

MotionProvider.displayName = 'MotionProvider';
OptimizedMotion.displayName = 'OptimizedMotion';
OptimizedPageTransition.displayName = 'OptimizedPageTransition';

export default OptimizedMotion;