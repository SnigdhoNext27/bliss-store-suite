import { useState, useRef } from 'react';
import { Upload, X, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage, supportsWebP, formatBytes, calculateSavings } from '@/lib/imageCompression';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  aspectRatio?: string;
  enableCompression?: boolean;
  maxWidth?: number;
  quality?: number;
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  folder = 'products', 
  aspectRatio = 'aspect-square',
  enableCompression = true,
  maxWidth = 1920,
  quality = 0.82,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [compressionStats, setCompressionStats] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({ title: `Maximum ${maxImages} images allowed`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    setCompressionStats(null);
    const newImages: string[] = [];

    // Allowed file extensions whitelist
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    
    try {
      for (const file of Array.from(files)) {
        // Validate file type - check MIME type
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Please upload only images', variant: 'destructive' });
          continue;
        }

        // Validate file size (max 10MB before compression, will be reduced after)
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'Image must be less than 10MB', variant: 'destructive' });
          continue;
        }

        // Validate file extension against whitelist
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !allowedExtensions.includes(fileExt)) {
          toast({ title: 'Only JPG, PNG, WebP, and GIF images are allowed', variant: 'destructive' });
          continue;
        }

        totalOriginalSize += file.size;

        let uploadData: Blob | File = file;
        let finalExt = fileExt;

        // Compress and convert to WebP if enabled and supported
        if (enableCompression && file.type !== 'image/gif') {
          try {
            const webpSupported = supportsWebP();
            const { blob, filename } = await compressImage(file, {
              maxWidth,
              maxHeight: maxWidth,
              quality,
              format: webpSupported ? 'webp' : 'jpeg',
            });
            
            uploadData = blob;
            finalExt = webpSupported ? 'webp' : 'jpg';
            totalCompressedSize += blob.size;
          } catch (err) {
            console.warn('Compression failed, using original:', err);
            uploadData = file;
            totalCompressedSize += file.size;
          }
        } else {
          totalCompressedSize += file.size;
        }

        // Generate cryptographically secure random filename
        const randomName = crypto.randomUUID();
        const fileName = `${randomName}.${finalExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, uploadData, {
            contentType: finalExt === 'webp' ? 'image/webp' : 
                         finalExt === 'jpg' ? 'image/jpeg' : 
                         `image/${finalExt}`,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(urlData.publicUrl);
      }

      // Calculate and show compression savings
      if (enableCompression && totalOriginalSize > 0) {
        const { savedPercent } = calculateSavings(totalOriginalSize, totalCompressedSize);
        if (savedPercent > 5) {
          setCompressionStats(`Saved ${savedPercent}% (${formatBytes(totalOriginalSize - totalCompressedSize)})`);
        }
      }

      onImagesChange([...images, ...newImages]);
      toast({ 
        title: `${newImages.length} image(s) uploaded`,
        description: compressionStats || undefined,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/product-images/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      try {
        await supabase.storage.from('product-images').remove([filePath]);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className={`grid ${maxImages === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
        {images.map((url, index) => (
          <div key={index} className={`relative ${aspectRatio} rounded-lg overflow-hidden bg-secondary`}>
            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`${aspectRatio} rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors`}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload Banner</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {/* Compression stats */}
      {compressionStats && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <Zap className="h-3 w-3" />
          <span>{compressionStats}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Max {maxImages} images, 10MB each. Auto-compressed to WebP for faster loading.
      </p>
    </div>
  );
}
