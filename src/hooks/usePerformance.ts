import { useState, useEffect, useMemo } from 'react';

type PerformanceTier = 'low' | 'medium' | 'high';

/**
 * Detects device performance capabilities and provides optimized settings.
 * Helps deliver smooth experience on low-end devices (1-2GB RAM phones).
 */
export function usePerformance() {
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('medium');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Detect device performance tier
    const detectPerformanceTier = (): PerformanceTier => {
      let score = 0;

      // Check device memory (in GB) - available in Chrome/Edge
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory) {
        if (deviceMemory <= 2) score += 3; // Very low memory (1-2GB)
        else if (deviceMemory <= 4) score += 2; // Low memory (3-4GB)
        else if (deviceMemory <= 6) score += 1; // Medium memory
        // 8GB+ gets no penalty
      }

      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency;
      if (cores) {
        if (cores <= 2) score += 3; // Very low cores
        else if (cores <= 4) score += 2; // Low cores
        else if (cores <= 6) score += 1; // Medium cores
      }

      // Check connection type for slow networks
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') score += 3;
        else if (effectiveType === '3g') score += 2;
        else if (effectiveType === '4g') score += 0;
        
        // Save-data mode enabled - user explicitly wants reduced data
        if (connection.saveData) score += 2;
        
        // Slow downlink
        if (connection.downlink && connection.downlink < 1) score += 2;
      }

      // Mobile device heuristic
      const isMobile = window.innerWidth < 768;
      const isSmallScreen = window.innerWidth < 480;
      if (isSmallScreen) score += 1;
      if (isMobile) score += 1;

      // Check for touch device (often mobile)
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        score += 1;
      }

      // Determine tier based on score
      if (score >= 5) return 'low';
      if (score >= 2) return 'medium';
      return 'high';
    };

    setPerformanceTier(detectPerformanceTier());

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Memoized settings based on device tier
  const settings = useMemo(() => {
    const isLow = performanceTier === 'low' || prefersReducedMotion;
    const isMedium = performanceTier === 'medium';
    const isHigh = performanceTier === 'high' && !prefersReducedMotion;

    return {
      // Core performance flags
      isLowEndDevice: isLow,
      performanceTier,
      shouldReduceAnimations: isLow,

      // Animation settings
      enableComplexAnimations: isHigh,
      animationDuration: isLow ? 0.1 : isMedium ? 0.2 : 0.35,
      easing: isLow ? 'linear' : [0.25, 0.46, 0.45, 0.94],
      staggerDelay: isLow ? 0 : isMedium ? 0.03 : 0.05,

      // Loading screen
      loadingDuration: isLow ? 500 : isMedium ? 1200 : 2500,

      // Visual effects
      enableParallax: isHigh,
      enableDecorations: !isLow,
      enableHoverEffects: !isLow,
      enableBlurEffects: isHigh,
      enableBackdropBlur: !isLow,

      // Image settings
      imageTransition: { duration: isLow ? 0.05 : isMedium ? 0.15 : 0.3 },
      lazyLoadMargin: isLow ? '50px' : '200px',

      // Grid and list rendering
      maxVisibleItems: isLow ? 8 : isMedium ? 12 : 20,
      enableVirtualization: isLow,

      // Carousel settings
      autoScrollInterval: isLow ? 6000 : 4000,
      carouselTransition: isLow 
        ? { duration: 0.2 } 
        : { type: 'spring' as const, stiffness: 300, damping: 30 },

      // Scroll optimization
      smoothScroll: !isLow,
      useWillChange: !isLow,
      enableMomentumScroll: true,

      // Touch optimization
      touchResponseTime: isLow ? 50 : 16,
      debounceScroll: isLow ? 100 : 16,
    };
  }, [performanceTier, prefersReducedMotion]);

  return {
    ...settings,
    prefersReducedMotion,
  };
}

// Singleton for non-React contexts
let cachedTier: PerformanceTier | null = null;

export function getPerformanceTier(): PerformanceTier {
  if (cachedTier !== null) return cachedTier;

  const deviceMemory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const connection = (navigator as any).connection;

  let score = 0;
  if (deviceMemory && deviceMemory <= 2) score += 3;
  else if (deviceMemory && deviceMemory <= 4) score += 2;
  if (cores && cores <= 2) score += 3;
  else if (cores && cores <= 4) score += 2;
  if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') score += 3;
  else if (connection?.effectiveType === '3g') score += 2;
  if (connection?.saveData) score += 2;
  if (window.innerWidth < 768) score += 1;

  if (score >= 5) cachedTier = 'low';
  else if (score >= 2) cachedTier = 'medium';
  else cachedTier = 'high';

  return cachedTier;
}

export function isLowEndDevice(): boolean {
  return getPerformanceTier() === 'low';
}
