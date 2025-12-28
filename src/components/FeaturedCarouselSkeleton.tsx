import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

function FeaturedCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex-shrink-0 w-[280px] md:w-[300px]"
    >
      {/* Image skeleton */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card mb-4">
        <Skeleton className="absolute inset-0 skeleton-shimmer" />
        
        {/* Badge skeleton */}
        <Skeleton className="absolute left-3 top-3 h-6 w-16 rounded-full skeleton-shimmer" />
      </div>

      {/* Product info skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-16 skeleton-shimmer" />
        <Skeleton className="h-5 w-3/4 skeleton-shimmer" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 skeleton-shimmer" />
          <Skeleton className="h-4 w-12 skeleton-shimmer" />
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="py-16 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container px-4 md:px-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Skeleton className="h-4 w-24 mb-2 skeleton-shimmer" />
            <Skeleton className="h-8 w-48 skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full skeleton-shimmer" />
            <Skeleton className="h-10 w-10 rounded-full skeleton-shimmer" />
          </div>
        </div>

        {/* Carousel skeleton */}
        <div className="overflow-hidden">
          <div className="flex gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <FeaturedCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>

        {/* Progress dots skeleton */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`h-2 rounded-full skeleton-shimmer ${i === 0 ? 'w-8' : 'w-2'}`} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
