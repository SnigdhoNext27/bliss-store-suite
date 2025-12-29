import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

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
 * - Lazy loading for off-screen images
 * - Blur-up placeholder effect
 * - Native loading="lazy" support
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
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Process image source - use original URL directly for reliability
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    
    // Use the original source directly - Supabase render endpoint may not be enabled
    if (!src || src === '/placeholder.svg') {
      setCurrentSrc('/placeholder.svg');
    } else {
      setCurrentSrc(src);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // If the current src failed and it's not already the placeholder, try placeholder
    if (currentSrc !== '/placeholder.svg') {
      console.warn(`Image failed to load: ${currentSrc}`);
      setCurrentSrc('/placeholder.svg');
    } else {
      setHasError(true);
      onError?.();
    }
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2",
          className
        )}
        style={{ width, height }}
      >
        <ImageOff className="h-8 w-8 opacity-50" />
        <span className="text-xs opacity-75">No image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
        />
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          "w-full h-full object-cover"
        )}
      />
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
