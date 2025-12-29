/**
 * Image compression and WebP conversion utilities
 * Optimizes images for faster loading on low-end devices
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  format: 'webp',
};

/**
 * Compresses and optionally converts an image to WebP format
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed Blob and new filename
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to target format
      const mimeType = getMimeType(opts.format!);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Generate new filename with correct extension
          const baseName = file.name.split('.').slice(0, -1).join('.') || 'image';
          const extension = opts.format === 'webp' ? 'webp' : opts.format === 'jpeg' ? 'jpg' : 'png';
          const filename = `${baseName}.${extension}`;

          resolve({ blob, filename });
        },
        mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Checks if the browser supports WebP format
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Get MIME type from format string
 */
function getMimeType(format: 'webp' | 'jpeg' | 'png'): string {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'image/webp';
  }
}

/**
 * Calculate compression savings
 */
export function calculateSavings(originalSize: number, compressedSize: number): {
  savedBytes: number;
  savedPercent: number;
} {
  const savedBytes = originalSize - compressedSize;
  const savedPercent = Math.round((savedBytes / originalSize) * 100);
  return { savedBytes, savedPercent };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generate optimized srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 960, 1280]): string {
  // For Supabase storage, we can append transform parameters
  // This is a placeholder for when Supabase Image Transformations are enabled
  return widths
    .map((w) => `${baseUrl} ${w}w`)
    .join(', ');
}
