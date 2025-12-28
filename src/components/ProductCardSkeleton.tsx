import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Image skeleton */}
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent skeleton-shimmer" />
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        {/* Category */}
        <div className="h-3 w-20 rounded bg-muted" />
        
        {/* Product name */}
        <div className="h-5 w-3/4 rounded bg-muted" />
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted/60" />
        </div>
        
        {/* Button */}
        <div className="pt-2">
          <div className="h-9 w-full rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent skeleton-shimmer" />
      </div>
      <div className="mt-3 h-4 w-24 rounded bg-muted mx-auto" />
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative h-48 md:h-64 overflow-hidden rounded-2xl bg-muted">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent skeleton-shimmer" />
      </div>
    </div>
  );
}
