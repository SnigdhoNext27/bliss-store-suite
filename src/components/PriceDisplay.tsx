import { motion } from 'framer-motion';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSavings?: boolean;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

export function PriceDisplay({
  price,
  originalPrice,
  size = 'md',
  className,
  showSavings = false,
}: PriceDisplayProps) {
  const { format } = useCurrency();

  const hasDiscount = originalPrice && originalPrice > price;
  const savings = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <motion.span
        key={price}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "font-bold",
          sizeClasses[size],
          hasDiscount && "text-destructive"
        )}
      >
        {format(price)}
      </motion.span>

      {hasDiscount && (
        <>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-muted-foreground line-through",
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}
          >
            {format(originalPrice)}
          </motion.span>

          {showSavings && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded"
            >
              -{savings}%
            </motion.span>
          )}
        </>
      )}
    </div>
  );
}
