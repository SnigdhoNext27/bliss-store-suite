import { useState, useEffect } from 'react';
import { motion, type Easing } from 'framer-motion';
import { WolfLogoIcon } from './WolfLogoIcon';

interface LoadingScreenProps {
  onSkip?: () => void;
  duration?: number;
}

export function LoadingScreen({ onSkip, duration = 2500 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [duration]);

  const handleSkip = () => {
    localStorage.setItem('skipLoadingScreen', 'true');
    onSkip?.();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' as Easing }}
    >
      {/* Animated Wolf Logo */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glow effect behind logo */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl bg-primary/20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.6, 0.3] }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
        
        <WolfLogoIcon className="w-28 h-28 relative z-10" animate />
      </motion.div>

      {/* Brand Name */}
      <motion.h1
        className="mt-6 font-display text-3xl font-bold tracking-widest text-foreground uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
      >
        ALMANS
      </motion.h1>

      {/* Progress bar */}
      <motion.div
        className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <motion.div
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      {/* Progress percentage */}
      <motion.span
        className="mt-3 text-xs text-muted-foreground font-medium tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        {Math.round(progress)}%
      </motion.span>

      {/* Skip button */}
      <motion.button
        className="mt-8 px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded-full hover:border-border hover:bg-muted/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={handleSkip}
      >
        Skip & don't show again
      </motion.button>
    </motion.div>
  );
}
