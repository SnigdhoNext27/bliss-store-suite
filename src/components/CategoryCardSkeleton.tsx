import { motion } from 'framer-motion';

export function CategoryCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card border border-border/50"
    >
      {/* Image skeleton with enhanced shimmer */}
      <div className="absolute inset-0 bg-muted skeleton-shimmer" />
      
      {/* Coming soon badge placeholder */}
      <div className="absolute top-3 right-3 h-6 w-20 rounded-full bg-muted-foreground/10 skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
      
      {/* Content overlay skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 via-background/60 to-transparent">
        {/* Icon placeholder */}
        <div className="h-10 w-10 rounded-xl bg-muted-foreground/15 mb-3 skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
        
        {/* Title */}
        <div className="h-6 w-3/4 rounded-md bg-muted-foreground/20 mb-2 skeleton-shimmer" style={{ animationDelay: '0.15s' }} />
        
        {/* Product count */}
        <div className="h-4 w-1/2 rounded-md bg-muted-foreground/10 skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
      </div>
    </motion.div>
  );
}

export function CategoriesGridSkeleton({ count = 7 }: { count?: number }) {
  return (
    <section className="py-16 bg-gradient-to-b from-secondary/30 via-accent/10 to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="container px-4 md:px-8 relative z-10">
        {/* Section Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <div className="h-4 w-36 mx-auto mb-4 rounded-full bg-muted skeleton-shimmer" />
          <div className="h-10 md:h-12 w-64 md:w-80 mx-auto mb-4 rounded-lg bg-muted skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
          <div className="h-4 w-80 md:w-96 mx-auto rounded-md bg-muted/80 skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
        </motion.div>

        {/* Categories Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <CategoryCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
