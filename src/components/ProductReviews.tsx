import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, User, Loader2, MessageSquare, Camera, X, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReviewPhoto {
  id: string;
  image_url: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string | null;
  profiles?: {
    full_name: string | null;
  } | null;
  photos?: ReviewPhoto[];
}

interface ProductReviewsProps {
  productId: string;
  productRating: number;
  reviewCount: number;
}

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().max(1000).optional(),
});

export function ProductReviews({ productId, productRating, reviewCount }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsWithProfiles: Review[] = [];
      for (const review of data || []) {
        let profileData = null;
        if (review.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();
          profileData = profile;
        }

        // Fetch photos for this review
        const { data: photos } = await supabase
          .from('review_photos')
          .select('id, image_url')
          .eq('review_id', review.id);

        reviewsWithProfiles.push({
          ...review,
          profiles: profileData,
          photos: photos || [],
        });
      }

      setReviews(reviewsWithProfiles);

      if (user) {
        const userReview = data?.find(r => r.user_id === user.id);
        setHasUserReviewed(!!userReview);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedPhotos.length > 5) {
      toast({ title: 'Maximum 5 photos allowed', variant: 'destructive' });
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Only images allowed', variant: 'destructive' });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
        return false;
      }
      return true;
    });

    setSelectedPhotos(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrls(prev => [...prev, url]);
    });
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (reviewId: string) => {
    const uploadedUrls: string[] = [];

    for (const photo of selectedPhotos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user?.id}/${reviewId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`reviews/${fileName}`, photo);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`reviews/${fileName}`);

      uploadedUrls.push(publicUrl);
    }

    // Insert photo records
    for (const url of uploadedUrls) {
      await supabase.from('review_photos').insert({
        review_id: reviewId,
        image_url: url,
      });
    }

    return uploadedUrls;
  };

  const handleSubmitReview = async () => {
    const result = reviewSchema.safeParse({ rating, comment });
    if (!result.success) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Please login to submit a review', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: reviewData, error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment || null,
        is_approved: false,
      }).select().single();

      if (error) throw error;

      // Upload photos if any
      if (selectedPhotos.length > 0 && reviewData) {
        setUploadingPhotos(true);
        await uploadPhotos(reviewData.id);
        setUploadingPhotos(false);
      }

      toast({ title: 'Review submitted! It will appear after approval.' });
      setRating(0);
      setComment('');
      setSelectedPhotos([]);
      setPhotoPreviewUrls([]);
      setShowForm(false);
      setHasUserReviewed(true);
    } catch (error) {
      toast({ title: 'Failed to submit review', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (interactive ? (hoverRating || rating) : count)
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="border-t border-border pt-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            {renderStars(Math.round(productRating))}
            <span className="text-muted-foreground">
              {productRating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>
        </div>

        {user && !hasUserReviewed && (
          <Button onClick={() => setShowForm(!showForm)} variant="outline" className="gap-2">
            <Camera className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl p-6 mb-6 border border-border"
          >
            <h3 className="font-medium mb-4">Write Your Review</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Your Rating</Label>
                <div className="mt-2">{renderStars(rating, true)}</div>
              </div>

              <div>
                <Label htmlFor="comment">Your Review (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <Label>Add Photos (Optional - Max 5)</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {photoPreviewUrls.map((url, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                  
                  {selectedPhotos.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors"
                    >
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add</span>
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmitReview} disabled={submitting || rating === 0}>
                  {submitting ? (uploadingPhotos ? 'Uploading photos...' : 'Submitting...') : 'Submit Review'}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Prompt */}
      {!user && (
        <div className="bg-muted/50 rounded-xl p-4 mb-6 text-center">
          <p className="text-muted-foreground">
            <a href="/auth" className="text-primary hover:underline">Login</a> to write a review
          </p>
        </div>
      )}

      {/* Already Reviewed */}
      {user && hasUserReviewed && !showForm && (
        <div className="bg-primary/10 rounded-xl p-4 mb-6 text-center">
          <p className="text-primary">Thank you! You've already reviewed this product.</p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 sm:p-6 border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">
                      {review.profiles?.full_name || 'Anonymous'}
                    </p>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                  {review.comment && (
                    <p className="mt-3 text-muted-foreground">{review.comment}</p>
                  )}
                  
                  {/* Review Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {review.photos.map((photo) => (
                        <motion.button
                          key={photo.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedImage(photo.image_url)}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border"
                        >
                          <img
                            src={photo.image_url}
                            alt="Review photo"
                            className="w-full h-full object-cover"
                          />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Review photo"
              className="max-w-full max-h-[90vh] rounded-xl object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-card rounded-full flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
