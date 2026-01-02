import { motion } from 'framer-motion';

function FeaturedCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className="flex-shrink-0 w-[280px] md:w-[300px]"
    >
      {/* Image skeleton with shimmer */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card border border-border/30 mb-4">
        <div className="absolute inset-0 bg-muted skeleton-shimmer" />
        
        {/* Badge skeleton */}
        <div className="absolute left-3 top-3 h-6 w-14 rounded-full bg-muted-foreground/15 skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
        
        {/* Action buttons placeholder */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <div className="h-9 w-9 rounded-full bg-muted-foreground/10 skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
          <div className="h-9 w-9 rounded-full bg-muted-foreground/10 skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
        </div>
        
        {/* Quick add button placeholder */}
        <div className="absolute bottom-3 left-3 right-3 h-10 rounded-lg bg-muted-foreground/20 skeleton-shimmer" style={{ animationDelay: '0.25s' }} />
      </div>

      {/* Product info skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-full bg-muted skeleton-shimmer" />
        <div className="h-5 w-3/4 rounded-md bg-muted skeleton-shimmer" style={{ animationDelay: '0.05s' }} />
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-md bg-muted skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-12 rounded-md bg-muted/60 skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="h-4 w-28 mb-3 rounded-full bg-muted skeleton-shimmer" />
            <div className="h-8 md:h-10 w-48 md:w-56 rounded-lg bg-muted skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
            <div className="h-10 w-10 rounded-full bg-muted skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
          </div>
        </motion.div>

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
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.3 + i * 0.05 }}
              className={`h-2 rounded-full bg-muted skeleton-shimmer ${i === 0 ? 'w-8' : 'w-2'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
