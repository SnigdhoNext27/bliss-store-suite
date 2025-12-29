import { useState, useEffect } from 'react';
import { motion, type Easing } from 'framer-motion';
import { isLowEndDevice } from '@/hooks/usePerformance';
import almansLogo from '@/assets/almans-logo.png';

interface LoadingScreenProps {
  duration?: number;
}

export function LoadingScreen({ duration: propDuration }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  
  const isLowEnd = isLowEndDevice();
  const duration = propDuration ?? (isLowEnd ? 800 : 2500);

  useEffect(() => {
    const startTime = Date.now();
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
      {/* Animated background particles */}
      {!isLowEnd && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-[#8B5A3C]/30 rounded-full"
              initial={{ 
                x: `${20 + Math.random() * 60}%`,
                y: '110%',
                opacity: 0.5
              }}
              animate={{ 
                y: '-10%',
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      )}

      {/* Clean progress ring */}
      <motion.div
        className="absolute"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <svg className="w-36 h-36 md:w-44 md:h-44" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={452}
            strokeDashoffset={452 - (452 * progress) / 100}
            transform="rotate(-90 80 80)"
            className="drop-shadow-sm"
          />
        </svg>
      </motion.div>

      {/* Professional round logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Subtle glow behind */}
        {!isLowEnd && (
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl bg-primary/30"
            animate={{ 
              scale: [1.2, 1.4, 1.2], 
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        
        {/* Main professional logo */}
        <motion.div
          className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[3px] border-primary/70 shadow-lg flex items-center justify-center bg-background"
          animate={!isLowEnd ? { 
            boxShadow: [
              '0 4px 20px rgba(var(--primary), 0.2)',
              '0 8px 30px rgba(var(--primary), 0.3)',
              '0 4px 20px rgba(var(--primary), 0.2)',
            ]
          } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img 
            src={almansLogo} 
            alt="Almans Logo" 
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>
      </motion.div>

      {/* Brand Name - Clean typography */}
      <motion.h1
        className="mt-8 font-display text-2xl md:text-3xl font-bold tracking-[0.2em] text-foreground"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        ALMANS
      </motion.h1>

      {/* Clean progress bar */}
      <motion.div
        className="mt-6 w-40 md:w-48 relative"
        initial={{ opacity: 0, scaleX: 0.9 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.25 }}
      >
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </motion.div>

      {/* Progress percentage */}
      <motion.span
        className="mt-3 text-sm text-muted-foreground font-medium tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {Math.round(progress)}%
      </motion.span>
    </motion.div>
  );
}
