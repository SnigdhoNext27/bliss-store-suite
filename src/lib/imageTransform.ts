/**
 * Image transformation utility for responsive image sizing
 * Provides optimized image URLs based on device viewport and capabilities
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

// Check WebP support
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
})();

// Device pixel ratio for high-DPI displays
const getDevicePixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
};

// Breakpoints for responsive images
export const IMAGE_BREAKPOINTS = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 900,
  xlarge: 1200,
} as const;

/**
 * Get optimal image size based on container width
 */
export function getOptimalImageSize(containerWidth: number): number {
  const dpr = getDevicePixelRatio();
  const targetWidth = containerWidth * dpr;
  
  if (targetWidth <= IMAGE_BREAKPOINTS.thumbnail) return IMAGE_BREAKPOINTS.thumbnail;
  if (targetWidth <= IMAGE_BREAKPOINTS.small) return IMAGE_BREAKPOINTS.small;
  if (targetWidth <= IMAGE_BREAKPOINTS.medium) return IMAGE_BREAKPOINTS.medium;
  if (targetWidth <= IMAGE_BREAKPOINTS.large) return IMAGE_BREAKPOINTS.large;
  return IMAGE_BREAKPOINTS.xlarge;
}

/**
 * Transform Supabase storage URL with resize parameters
 * Supabase supports image transformation on-the-fly
 */
export function transformSupabaseImage(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return '/placeholder.svg';
  
  // Skip transformation for local assets, data URLs, or placeholder
  if (
    url.startsWith('/') ||
    url.startsWith('data:') ||
    url.includes('placeholder') ||
    !url.includes('supabase')
  ) {
    return url;
  }

  try {
    const imageUrl = new URL(url);
    
    // Check if it's a Supabase storage URL
    if (!imageUrl.pathname.includes('/storage/v1/object/')) {
      return url;
    }
    
    // Build transformation parameters
    const params = new URLSearchParams();
    
    if (options.width) {
      params.set('width', String(options.width));
    }
    if (options.height) {
      params.set('height', String(options.height));
    }
    if (options.quality) {
      params.set('quality', String(options.quality));
    }
    if (options.format === 'auto') {
      params.set('format', supportsWebP ? 'webp' : 'jpeg');
    } else if (options.format) {
      params.set('format', options.format);
    }
    if (options.fit) {
      params.set('resize', options.fit);
    }
    
    // Transform to render endpoint
    const renderPath = imageUrl.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    
    return `${imageUrl.origin}${renderPath}?${params.toString()}`;
  } catch {
    return url;
  }
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  url: string,
  sizes: number[] = [300, 600, 900, 1200]
): string {
  if (!url || url.startsWith('/') || url.startsWith('data:')) {
    return '';
  }

  return sizes
    .map((width) => {
      const transformedUrl = transformSupabaseImage(url, {
        width,
        quality: 80,
        format: 'auto',
        fit: 'cover',
      });
      return `${transformedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Get responsive image sizes attribute
 */
export function getImageSizes(
  options: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  } = {}
): string {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '25vw',
  } = options;

  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, ${desktop}`;
}

/**
 * Presets for common image use cases
 */
export const IMAGE_PRESETS = {
  productCard: {
    width: 400,
    quality: 80,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  productDetail: {
    width: 800,
    quality: 85,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  thumbnail: {
    width: 150,
    quality: 70,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  hero: {
    width: 1200,
    quality: 85,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
  category: {
    width: 600,
    quality: 80,
    format: 'auto' as const,
    fit: 'cover' as const,
  },
} as const;

/**
 * Hook-friendly function to get optimized image URL
 */
export function getOptimizedImageUrl(
  url: string,
  preset: keyof typeof IMAGE_PRESETS = 'productCard'
): string {
  return transformSupabaseImage(url, IMAGE_PRESETS[preset]);
}
