import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, disabled }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: progress > 0.2 ? 1 : progress * 5,
        y: Math.min(pullDistance, 60),
      }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden"
    >
      <motion.div
        animate={{
          rotate: isRefreshing ? 360 : progress * 180,
          scale: isRefreshing ? 1 : 0.8 + progress * 0.2,
        }}
        transition={{
          rotate: isRefreshing 
            ? { duration: 1, repeat: Infinity, ease: 'linear' }
            : { duration: 0 },
        }}
        className={`mt-4 p-3 rounded-full shadow-lg backdrop-blur-sm ${
          progress >= 1 || isRefreshing
            ? 'bg-primary text-primary-foreground'
            : 'bg-background/90 text-foreground'
        }`}
      >
        <RefreshCw className="h-5 w-5" />
      </motion.div>
      
      {/* Pull indicator text */}
      {isPulling && !isRefreshing && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 0.3 ? 1 : 0 }}
          className="absolute top-16 text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1 rounded-full shadow-sm"
        >
          {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </motion.span>
      )}
      
      {isRefreshing && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-16 text-xs font-medium text-primary bg-background/80 px-3 py-1 rounded-full shadow-sm"
        >
          Refreshing...
        </motion.span>
      )}
    </motion.div>
  );
}
