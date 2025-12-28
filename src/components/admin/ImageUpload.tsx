import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  aspectRatio?: string;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, folder = 'products', aspectRatio = 'aspect-square' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
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
    const newImages: string[] = [];

    // Allowed file extensions whitelist
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    try {
      for (const file of Array.from(files)) {
        // Validate file type - check MIME type
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Please upload only images', variant: 'destructive' });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
          continue;
        }

        // Validate file extension against whitelist
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !allowedExtensions.includes(fileExt)) {
          toast({ title: 'Only JPG, PNG, WebP, and GIF images are allowed', variant: 'destructive' });
          continue;
        }

        // Generate cryptographically secure random filename
        const randomName = crypto.randomUUID();
        const fileName = `${randomName}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(urlData.publicUrl);
      }

      onImagesChange([...images, ...newImages]);
      toast({ title: `${newImages.length} image(s) uploaded` });
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

      <p className="text-xs text-muted-foreground">
        Max {maxImages} images, 5MB each. JPG, PNG, WebP supported.
      </p>
    </div>
  );
}
