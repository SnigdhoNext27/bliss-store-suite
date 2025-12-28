import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface SwipeNavigationWrapperProps {
  children: ReactNode;
}

export function SwipeNavigationWrapper({ children }: SwipeNavigationWrapperProps) {
  const location = useLocation();
  const { onTouchStart, onTouchMove, onTouchEnd, currentIndex } = useSwipeNavigation({
    threshold: 80,
    enabled: !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/product'),
  });

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="min-h-screen"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: currentIndex >= 0 ? 20 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: currentIndex >= 0 ? -20 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
