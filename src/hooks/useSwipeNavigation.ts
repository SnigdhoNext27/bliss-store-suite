import { useState, useRef, useCallback, TouchEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptics } from '@/lib/haptics';

const routes = ['/', '/shop', '/wishlist', '/account'];

interface SwipeConfig {
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeNavigation({ threshold = 80, enabled = true }: SwipeConfig = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeDirection = useRef<'left' | 'right' | null>(null);

  const currentIndex = routes.indexOf(location.pathname);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  }, [enabled]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    const distance = touchStart - currentTouch;
    if (distance > 20) {
      swipeDirection.current = 'left';
    } else if (distance < -20) {
      swipeDirection.current = 'right';
    }
  }, [enabled, touchStart]);

  const onTouchEnd = useCallback(() => {
    if (!enabled || !touchStart || !touchEnd) {
      setIsSwiping(false);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && currentIndex < routes.length - 1 && currentIndex !== -1) {
      haptics.medium(); // Haptic feedback on successful swipe
      navigate(routes[currentIndex + 1]);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      haptics.medium(); // Haptic feedback on successful swipe
      navigate(routes[currentIndex - 1]);
    }

    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
    swipeDirection.current = null;
  }, [enabled, touchStart, touchEnd, threshold, currentIndex, navigate]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwiping,
    swipeDirection: swipeDirection.current,
    currentIndex,
    totalRoutes: routes.length,
  };
}
