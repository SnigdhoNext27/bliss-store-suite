import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card border border-border/50"
    >
      {/* Image skeleton with shimmer */}
      <Skeleton className="absolute inset-0 skeleton-shimmer" />
      
      {/* Content overlay skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
        <Skeleton className="h-6 w-3/4 mb-2 skeleton-shimmer" />
        <Skeleton className="h-4 w-1/2 skeleton-shimmer" />
      </div>
    </motion.div>
  );
}

export function CategoriesGridSkeleton({ count = 7 }: { count?: number }) {
  return (
    <section className="py-16 bg-gradient-to-b from-secondary/30 via-accent/10 to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 md:px-8 relative z-10">
        {/* Section Header Skeleton */}
        <div className="text-center mb-12">
          <Skeleton className="h-4 w-32 mx-auto mb-4 skeleton-shimmer" />
          <Skeleton className="h-10 w-64 mx-auto mb-4 skeleton-shimmer" />
          <Skeleton className="h-4 w-80 mx-auto skeleton-shimmer" />
        </div>

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
