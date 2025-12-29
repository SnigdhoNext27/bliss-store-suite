import { useState, useEffect, useMemo } from 'react';

/**
 * Detects device performance capabilities and provides optimized settings.
 * Helps deliver smooth experience on low-end devices (2GB RAM phones).
 */
export function usePerformance() {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Detect low-end device based on available memory and hardware concurrency
    const detectLowEndDevice = () => {
      // Check device memory (in GB) - available in Chrome/Edge
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory && deviceMemory <= 4) {
        return true;
      }

      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency;
      if (cores && cores <= 4) {
        return true;
      }

      // Check connection type for slow networks
      const connection = (navigator as any).connection;
      if (connection) {
        const slowConnections = ['slow-2g', '2g', '3g'];
        if (slowConnections.includes(connection.effectiveType)) {
          return true;
        }
        // Save-data mode enabled
        if (connection.saveData) {
          return true;
        }
      }

      // Mobile device heuristic - smaller screens often have less resources
      if (window.innerWidth < 768 && window.innerHeight < 1024) {
        // Check if it's an older mobile device by testing animation performance
        return true; // Assume mobile devices need optimization
      }

      return false;
    };

    setIsLowEndDevice(detectLowEndDevice());

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Memoized animation settings based on device capabilities
  const animationSettings = useMemo(() => {
    const shouldReduceAnimations = isLowEndDevice || prefersReducedMotion;

    return {
      // Disable complex animations on low-end devices
      enableComplexAnimations: !shouldReduceAnimations,
      
      // Reduce animation duration
      animationDuration: shouldReduceAnimations ? 0.15 : 0.35,
      
      // Simpler easing
      easing: shouldReduceAnimations ? 'linear' : [0.25, 0.46, 0.45, 0.94],
      
      // Skip stagger animations
      staggerDelay: shouldReduceAnimations ? 0 : 0.05,
      
      // Loading screen duration
      loadingDuration: shouldReduceAnimations ? 800 : 2500,
      
      // Disable parallax effects
      enableParallax: !shouldReduceAnimations,
      
      // Disable floating particles and decorative animations
      enableDecorations: !shouldReduceAnimations,
      
      // Disable hover scale effects
      enableHoverEffects: !shouldReduceAnimations,
      
      // Use simpler image transitions
      imageTransition: shouldReduceAnimations ? { duration: 0.1 } : { duration: 0.4 },
    };
  }, [isLowEndDevice, prefersReducedMotion]);

  return {
    isLowEndDevice,
    prefersReducedMotion,
    shouldReduceAnimations: isLowEndDevice || prefersReducedMotion,
    ...animationSettings,
  };
}

// Singleton for non-React contexts
let cachedIsLowEnd: boolean | null = null;

export function isLowEndDevice(): boolean {
  if (cachedIsLowEnd !== null) return cachedIsLowEnd;

  const deviceMemory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const connection = (navigator as any).connection;

  cachedIsLowEnd = 
    (deviceMemory && deviceMemory <= 4) ||
    (cores && cores <= 4) ||
    (connection && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) ||
    (connection?.saveData) ||
    (window.innerWidth < 768);

  return cachedIsLowEnd;
}
