import { AlertTriangle, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface LowStockWarningProps {
  stock: number;
  threshold?: number;
  className?: string;
}

export function LowStockWarning({ stock, threshold = 5, className = '' }: LowStockWarningProps) {
  if (stock > threshold || stock <= 0) return null;

  const isVeryLow = stock <= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          isVeryLow
            ? 'bg-destructive/10 text-destructive border border-destructive/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
        }`}
      >
        {isVeryLow ? (
          <AlertTriangle className="h-4 w-4 animate-pulse" />
        ) : (
          <Package className="h-4 w-4" />
        )}
        <span>
          {isVeryLow
            ? `Only ${stock} left! Order now`
            : `Low stock: ${stock} remaining`}
        </span>
      </div>
    </motion.div>
  );
}
