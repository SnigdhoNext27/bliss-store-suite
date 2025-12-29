import { useState, useEffect } from 'react';
import { motion, type Easing } from 'framer-motion';
import { WolfLogoIcon } from './WolfLogoIcon';
import { isLowEndDevice } from '@/hooks/usePerformance';

interface LoadingScreenProps {
  duration?: number;
}

export function LoadingScreen({ duration: propDuration }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  
  // Shorter loading time for low-end devices
  const isLowEnd = isLowEndDevice();
  const duration = propDuration ?? (isLowEnd ? 800 : 2500);

  useEffect(() => {
    const startTime = Date.now();
    // Use lower frequency updates on low-end devices
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, isLowEnd ? 50 : 16);

    return () => clearInterval(interval);
  }, [duration, isLowEnd]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' as Easing }}
    >
      {/* Animated background particles - disabled on low-end devices */}
      {!isLowEnd && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%',
                y: '110%',
                opacity: 0.4
              }}
              animate={{ 
                y: '-10%',
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ 
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      )}

      {/* Outer ring animation */}
      <motion.div
        className="absolute"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <svg className="w-36 h-36 md:w-40 md:h-40" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * progress) / 100}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4))' }}
          />
        </svg>
      </motion.div>

      {/* Logo container */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glow effect behind logo */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl bg-primary/15"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1.2, 1.4, 1.2], 
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <WolfLogoIcon className="w-24 h-24 md:w-28 md:h-28 relative z-10" animate />
      </motion.div>

      {/* Brand Name */}
      <motion.h1
        className="mt-8 font-display text-3xl md:text-4xl font-bold tracking-[0.3em] text-foreground uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        ALMANS
      </motion.h1>

      {/* Progress bar container */}
      <motion.div
        className="mt-10 w-52 md:w-64 relative"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        {/* Track */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          {/* Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-almans-gold rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
          </motion.div>
        </div>

        {/* Progress markers */}
        <div className="absolute inset-x-0 top-0 flex justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((mark) => (
            <motion.div
              key={mark}
              className={`w-0.5 h-2 -mt-0.5 rounded-full transition-colors duration-300 ${
                progress >= mark ? 'bg-primary' : 'bg-muted'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 + mark * 0.002 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Progress percentage */}
      <motion.span
        className="mt-4 text-sm text-muted-foreground font-medium tabular-nums tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {Math.round(progress)}%
      </motion.span>

      {/* Loading text */}
      <motion.p
        className="mt-2 text-xs text-muted-foreground/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{ delay: 1.2, duration: 2, repeat: Infinity }}
      >
        Loading your experience...
      </motion.p>
    </motion.div>
  );
}
