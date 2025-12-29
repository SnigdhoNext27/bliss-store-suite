import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';

type ImagePreset = 'productCard' | 'productDetail' | 'thumbnail' | 'hero' | 'category';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  preset?: ImagePreset;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with:
 * - Lazy loading with IntersectionObserver for better performance
 * - Native loading="lazy" as fallback
 * - Performance-adaptive placeholder
 * - GPU-accelerated transitions
 * - Fallback handling for failed images
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  preset = 'productCard',
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldReduceAnimations, lazyLoadMargin, imageTransition, imagePlaceholder } = usePerformance();

  // Use performance-based placeholder
  const effectivePlaceholder = shouldReduceAnimations ? 'empty' : placeholder;

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: lazyLoadMargin,
        threshold: 0.01 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, lazyLoadMargin]);

  // Process image source
  useEffect(() => {
    if (!isInView) return;
    
    setIsLoaded(false);
    setHasError(false);
    
    if (!src || src === '/placeholder.svg') {
      setCurrentSrc('/placeholder.svg');
    } else {
      setCurrentSrc(src);
    }
  }, [src, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (currentSrc !== '/placeholder.svg') {
      setCurrentSrc('/placeholder.svg');
    } else {
      setHasError(true);
      onError?.();
    }
  }, [currentSrc, onError]);

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2",
          className
        )}
        style={{ width, height }}
      >
        <ImageOff className="h-6 w-6 opacity-40" />
        <span className="text-xs opacity-60">No image</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ 
        contain: 'layout paint',
        willChange: shouldReduceAnimations ? 'auto' : 'opacity'
      }}
    >
      {/* Placeholder - simplified for performance */}
      {effectivePlaceholder === 'blur' && !isLoaded && isInView && (
        <div className="absolute inset-0 bg-muted/50 skeleton-shimmer" />
      )}
      
      {/* Empty placeholder for space reservation */}
      {!isInView && (
        <div className="absolute inset-0 bg-muted/30" />
      )}
      
      {isInView && currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover",
            shouldReduceAnimations 
              ? (isLoaded ? "opacity-100" : "opacity-0")
              : "transition-opacity",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            transitionDuration: shouldReduceAnimations ? '0ms' : `${imageTransition.duration * 1000}ms`,
          }}
        />
      )}
    </div>
  );
});

/**
 * Background image with lazy loading
 */
export const OptimizedBackgroundImage = memo(function OptimizedBackgroundImage({
  src,
  alt,
  className,
  children,
  overlayClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  overlayClassName?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => setIsLoaded(true);
            img.src = src;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Background image */}
      {isLoaded && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url(${src})` }}
          role="img"
          aria-label={alt}
        />
      )}
      
      {/* Overlay */}
      {overlayClassName && (
        <div className={cn("absolute inset-0", overlayClassName)} />
      )}
      
      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
});
