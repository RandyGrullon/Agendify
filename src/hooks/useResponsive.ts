import { useState, useEffect } from 'react';

/**
 * Hook for responsive design - detects mobile vs desktop viewport
 * Replaces duplicate code in 5+ table components
 */
export const useResponsive = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return { 
    isMobile, 
    isDesktop: !isMobile,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
  };
};
