import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'shimmer' | 'pulse';
}

export function EnhancedSkeleton({ className, variant = 'shimmer' }: SkeletonProps) {
  if (variant === 'shimmer') {
    return (
      <div className={cn("relative overflow-hidden bg-muted rounded-lg", className)}>
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background/40 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn("bg-muted rounded-lg", className)}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    );
  }

  return <div className={cn("bg-muted rounded-lg animate-pulse", className)} />;
}

// Product Card Skeleton
export function ProductCardSkeletonEnhanced() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <EnhancedSkeleton className="aspect-[3/4] w-full" variant="shimmer" />
      <div className="p-4 space-y-3">
        <EnhancedSkeleton className="h-3 w-1/3" variant="shimmer" />
        <EnhancedSkeleton className="h-5 w-3/4" variant="shimmer" />
        <div className="flex items-center gap-2">
          <EnhancedSkeleton className="h-5 w-20" variant="shimmer" />
          <EnhancedSkeleton className="h-4 w-16" variant="shimmer" />
        </div>
        <EnhancedSkeleton className="h-10 w-full" variant="shimmer" />
      </div>
    </div>
  );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <EnhancedSkeleton className="h-5 w-32" variant="shimmer" />
        <EnhancedSkeleton className="h-6 w-20 rounded-full" variant="shimmer" />
      </div>
      <div className="flex items-center gap-3">
        <EnhancedSkeleton className="h-16 w-16 rounded-lg" variant="shimmer" />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton className="h-4 w-3/4" variant="shimmer" />
          <EnhancedSkeleton className="h-3 w-1/2" variant="shimmer" />
        </div>
      </div>
      <div className="flex justify-between pt-2 border-t border-border">
        <EnhancedSkeleton className="h-4 w-24" variant="shimmer" />
        <EnhancedSkeleton className="h-5 w-20" variant="shimmer" />
      </div>
    </div>
  );
}

// Profile Section Skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <EnhancedSkeleton className="h-20 w-20 rounded-full" variant="shimmer" />
        <div className="space-y-2">
          <EnhancedSkeleton className="h-6 w-40" variant="shimmer" />
          <EnhancedSkeleton className="h-4 w-32" variant="shimmer" />
        </div>
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <EnhancedSkeleton className="h-4 w-24" variant="shimmer" />
            <EnhancedSkeleton className="h-10 flex-1" variant="shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Category Grid Skeleton
export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="relative aspect-square rounded-xl overflow-hidden"
        >
          <EnhancedSkeleton className="absolute inset-0" variant="shimmer" />
        </motion.div>
      ))}
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
        {[1, 2, 3, 4].map((i) => (
          <EnhancedSkeleton key={i} className="h-4 flex-1" variant="shimmer" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-4 p-3"
        >
          {[1, 2, 3, 4].map((j) => (
            <EnhancedSkeleton key={j} className="h-4 flex-1" variant="shimmer" />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// Hero Skeleton
export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] w-full">
      <EnhancedSkeleton className="absolute inset-0" variant="shimmer" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <EnhancedSkeleton className="h-12 w-64" variant="pulse" />
        <EnhancedSkeleton className="h-6 w-96" variant="pulse" />
        <EnhancedSkeleton className="h-12 w-32 rounded-full" variant="pulse" />
      </div>
    </div>
  );
}
