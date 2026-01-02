import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  className?: string;
  index?: number;
}

export function ProductCardSkeleton({ className, index = 0 }: ProductCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn('group', className)}
    >
      {/* Image skeleton with shimmer */}
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 skeleton-shimmer" />
        
        {/* Badge placeholder */}
        <div className="absolute left-3 top-3 h-6 w-14 rounded-full bg-muted-foreground/10 skeleton-shimmer" />
        
        {/* Wishlist button placeholder */}
        <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-muted-foreground/10 skeleton-shimmer" />
        
        {/* Add to cart button placeholder */}
        <div className="absolute bottom-3 left-3 right-3 h-10 rounded-lg bg-muted-foreground/15 skeleton-shimmer" />
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        {/* Category */}
        <div className="h-3 w-20 rounded-full bg-muted skeleton-shimmer" />
        
        {/* Product name */}
        <div className="h-5 w-3/4 rounded-md bg-muted skeleton-shimmer" />
        
        {/* Price row */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-md bg-muted skeleton-shimmer" />
          <div className="h-4 w-12 rounded-md bg-muted/60 skeleton-shimmer" />
        </div>
        
        {/* Rating placeholder */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-3 rounded-sm bg-muted/50 skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
          <div className="h-3 w-8 ml-1 rounded-md bg-muted/50 skeleton-shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 skeleton-shimmer" />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Title placeholder */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-6 w-2/3 rounded-md bg-muted-foreground/20 skeleton-shimmer" />
          <div className="h-4 w-1/3 mt-2 rounded-md bg-muted-foreground/15 skeleton-shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

export function BannerSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative h-48 md:h-64 overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 skeleton-shimmer" />
        
        {/* Content placeholders */}
        <div className="absolute inset-0 flex items-center px-8">
          <div className="space-y-4 w-full max-w-md">
            <div className="h-4 w-24 rounded-full bg-muted-foreground/15 skeleton-shimmer" />
            <div className="h-8 w-3/4 rounded-md bg-muted-foreground/20 skeleton-shimmer" />
            <div className="h-4 w-full rounded-md bg-muted-foreground/10 skeleton-shimmer" />
            <div className="h-10 w-32 rounded-full bg-muted-foreground/15 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] md:h-[85vh] overflow-hidden bg-muted">
      <div className="absolute inset-0 skeleton-shimmer" />
      
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      
      <div className="absolute inset-0 flex items-center">
        <div className="container px-4 md:px-8">
          <div className="max-w-2xl space-y-6">
            <div className="h-3 w-24 rounded-full bg-muted-foreground/20 skeleton-shimmer" />
            <div className="space-y-3">
              <div className="h-12 md:h-16 w-full rounded-md bg-muted-foreground/20 skeleton-shimmer" />
              <div className="h-12 md:h-16 w-3/4 rounded-md bg-muted-foreground/20 skeleton-shimmer" />
            </div>
            <div className="h-5 w-full rounded-md bg-muted-foreground/10 skeleton-shimmer" />
            <div className="h-5 w-2/3 rounded-md bg-muted-foreground/10 skeleton-shimmer" />
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-40 rounded-full bg-muted-foreground/20 skeleton-shimmer" />
              <div className="h-12 w-36 rounded-full bg-muted-foreground/15 skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
