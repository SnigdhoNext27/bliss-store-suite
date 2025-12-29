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
              className="absolute w-2 h-2 bg-[#5a3825]/30 rounded-full"
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

      {/* Progress ring */}
      <motion.div
        className="absolute"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <svg className="w-40 h-40 md:w-48 md:h-48" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="#5a3825"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={452}
            strokeDashoffset={452 - (452 * progress) / 100}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(90, 56, 37, 0.4))' }}
          />
        </svg>
      </motion.div>

      {/* Fully round brown logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glow behind */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl bg-[#5a3825]/40"
          animate={{ 
            scale: [1.3, 1.5, 1.3], 
            opacity: [0.4, 0.6, 0.4] 
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Main round brown logo */}
        <motion.div
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#5a3825] dark:bg-[#6b4429] shadow-2xl flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 30px rgba(90, 56, 37, 0.4)',
              '0 0 50px rgba(90, 56, 37, 0.6)',
              '0 0 30px rgba(90, 56, 37, 0.4)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img 
            src={almansLogo} 
            alt="Almans Logo" 
            className="w-[70%] h-[70%] object-contain"
          />
        </motion.div>
      </motion.div>

      {/* Brand Name */}
      <motion.h1
        className="mt-10 font-display text-3xl md:text-4xl font-bold tracking-[0.3em] text-foreground uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        ALMANS
      </motion.h1>

      {/* Progress bar */}
      <motion.div
        className="mt-8 w-48 md:w-56 relative"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#5a3825]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
