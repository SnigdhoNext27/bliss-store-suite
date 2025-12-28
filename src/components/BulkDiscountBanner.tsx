import { motion } from 'framer-motion';
import { Package, Percent, TrendingUp } from 'lucide-react';
import { useBulkDiscount } from '@/hooks/useBulkDiscount';
import { Progress } from '@/components/ui/progress';

interface BulkDiscountBannerProps {
  items: { quantity: number }[];
  subtotal: number;
  compact?: boolean;
}

export function BulkDiscountBanner({ items, subtotal, compact = false }: BulkDiscountBannerProps) {
  const { 
    totalQuantity, 
    applicableTier, 
    nextTier, 
    discountAmount, 
    itemsToNextTier,
    allTiers 
  } = useBulkDiscount(items, subtotal);

  if (totalQuantity < 5 && !compact) {
    return null; // Don't show until they're close to a tier
  }

  if (compact) {
    if (!applicableTier && !nextTier) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-lg p-3 border border-purple-500/20"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-purple-500" />
          {applicableTier ? (
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Bulk discount: {applicableTier.discountPercent}% off (৳{discountAmount.toLocaleString()} saved)
            </span>
          ) : nextTier && (
            <span className="text-sm text-muted-foreground">
              Add {itemsToNextTier} more items for {nextTier.discountPercent}% bulk discount!
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-xl p-5 border border-purple-500/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Package className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Wholesale Bulk Discount</h3>
          <p className="text-sm text-muted-foreground">Save more when you buy more!</p>
        </div>
      </div>

      {/* Current status */}
      <div className="mb-4 p-3 bg-background/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Items in cart:</span>
          <span className="font-bold text-lg">{totalQuantity}</span>
        </div>
        
        {applicableTier && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400"
          >
            <Percent className="h-4 w-4" />
            <span className="font-medium">
              {applicableTier.discountPercent}% discount applied — You save ৳{discountAmount.toLocaleString()}!
            </span>
          </motion.div>
        )}
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Add {itemsToNextTier} more for {nextTier.discountPercent}% off
            </span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <Progress 
            value={(totalQuantity / nextTier.minQuantity) * 100} 
            className="h-2"
          />
        </div>
      )}

      {/* Tier breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {allTiers.map((tier) => (
          <div
            key={tier.minQuantity}
            className={`text-center p-2 rounded-lg transition-all ${
              applicableTier?.minQuantity === tier.minQuantity
                ? 'bg-primary text-primary-foreground'
                : totalQuantity >= tier.minQuantity
                ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <div className="text-xs font-medium">{tier.minQuantity}+</div>
            <div className="text-sm font-bold">{tier.discountPercent}%</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
