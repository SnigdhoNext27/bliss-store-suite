import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, User, Loader2, MessageSquare } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string | null;
  profiles?: {
    full_name: string | null;
  } | null;
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

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch approved reviews
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each review
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
        reviewsWithProfiles.push({
          ...review,
          profiles: profileData,
        });
      }

      setReviews(reviewsWithProfiles);

      // Check if current user has already reviewed
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
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment || null,
        is_approved: false, // Requires admin approval
      });

      if (error) throw error;

      toast({ title: 'Review submitted! It will appear after approval.' });
      setRating(0);
      setComment('');
      setShowForm(false);
      setHasUserReviewed(true);
    } catch (error) {
      toast({ title: 'Failed to submit review', variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
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
          <Button onClick={() => setShowForm(!showForm)} variant="outline">
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
            className="bg-card rounded-xl p-6 mb-6"
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

              <div className="flex gap-3">
                <Button onClick={handleSubmitReview} disabled={submitting || rating === 0}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
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
        <div className="text-center py-12 bg-card rounded-xl">
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
              className="bg-card rounded-xl p-4 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">
                      {review.profiles?.full_name || 'Anonymous'}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                  {review.comment && (
                    <p className="mt-3 text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
