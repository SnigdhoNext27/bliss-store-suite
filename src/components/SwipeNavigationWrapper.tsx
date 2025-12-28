import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface SwipeNavigationWrapperProps {
  children: ReactNode;
}

const routes = ['/', '/shop', '/wishlist', '/account'];

export function SwipeNavigationWrapper({ children }: SwipeNavigationWrapperProps) {
  const location = useLocation();
  const { onTouchStart, onTouchMove, onTouchEnd, currentIndex, totalRoutes } = useSwipeNavigation({
    threshold: 80,
    enabled: !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/product'),
  });

  const showIndicators = routes.includes(location.pathname);

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

      {/* Page Indicator Dots - Mobile only */}
      {showIndicators && (
        <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-40 flex gap-1.5 md:hidden">
          {Array.from({ length: totalRoutes }).map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-4 bg-primary' 
                  : 'w-1.5 bg-muted-foreground/30'
              }`}
              initial={false}
              animate={{ 
                scale: index === currentIndex ? 1 : 0.8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
