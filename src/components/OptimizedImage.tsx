import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  transformSupabaseImage, 
  generateSrcSet, 
  getImageSizes,
  IMAGE_PRESETS 
} from '@/lib/imageTransform';

type ImagePreset = keyof typeof IMAGE_PRESETS;

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
 * - Fade-in animation on load
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
  const imgRef = useRef<HTMLImageElement>(null);

  // Get optimized image URL and srcSet
  const presetConfig = IMAGE_PRESETS[preset];
  const optimizedSrc = transformSupabaseImage(src, presetConfig);
  const srcSet = generateSrcSet(src);
  const defaultSizes = sizes || getImageSizes({
    mobile: preset === 'productCard' ? '50vw' : '100vw',
    tablet: preset === 'productCard' ? '33vw' : '50vw',
    desktop: preset === 'productCard' ? '25vw' : '33vw',
  });

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ 
            backdropFilter: 'blur(20px)',
          }}
        />
      )}
      
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={srcSet || undefined}
        sizes={srcSet ? defaultSizes : undefined}
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
