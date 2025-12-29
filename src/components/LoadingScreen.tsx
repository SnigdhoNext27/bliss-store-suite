import { useState, useEffect } from 'react';
import { motion, type Easing } from 'framer-motion';
import { WolfLogoIcon } from './WolfLogoIcon';
import { isLowEndDevice } from '@/hooks/usePerformance';
import almansLogo from '@/assets/almans-logo.png';

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
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: `radial-gradient(circle, hsl(var(--almans-gold) / 0.4) 0%, transparent 70%)`,
              }}
              initial={{ 
                x: `${20 + Math.random() * 60}%`,
                y: '110%',
                opacity: 0.6
              }}
              animate={{ 
                y: '-10%',
                opacity: [0.6, 1, 0.6]
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

      {/* Outer decorative rings */}
      <div className="absolute">
        <motion.div
          className="w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-almans-brown/20 dark:border-almans-gold/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      </div>
      
      <div className="absolute">
        <motion.div
          className="w-40 h-40 md:w-48 md:h-48 rounded-full border border-almans-gold/30 dark:border-almans-gold/40"
          initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 360 }}
          transition={{ duration: 0.6, rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        />
      </div>

      {/* Progress ring */}
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
            strokeWidth="3"
          />
          {/* Progress circle with gradient */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(24 40% 40%)" />
              <stop offset="100%" stopColor="hsl(38 60% 55%)" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * progress) / 100}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 10px hsl(24 40% 40% / 0.5))' }}
          />
        </svg>
      </motion.div>

      {/* Logo container with enhanced styling */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glow effect behind logo */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, hsl(var(--almans-gold) / 0.3) 0%, transparent 70%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1.5, 2, 1.5], 
            opacity: [0.4, 0.7, 0.4] 
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Main logo with round border */}
        <motion.div
          className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[3px] border-almans-brown-dark dark:border-almans-gold bg-gradient-to-br from-almans-cream to-almans-cream-dark dark:from-almans-chocolate dark:to-background shadow-xl"
          animate={{ 
            boxShadow: [
              '0 0 20px hsl(24 40% 40% / 0.3)',
              '0 0 40px hsl(38 60% 55% / 0.4)',
              '0 0 20px hsl(24 40% 40% / 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-almans-gold/25 to-transparent dark:from-almans-gold/35" />
          
          {/* Decorative inner ring */}
          <div className="absolute inset-[4px] rounded-full border border-almans-gold/40 dark:border-almans-gold/50" />
          
          <img 
            src={almansLogo} 
            alt="Almans Logo" 
            className="w-full h-full object-contain p-2 relative z-10"
          />
        </motion.div>
      </motion.div>

      {/* Brand Name */}
      <motion.h1
        className="mt-10 font-display text-3xl md:text-4xl font-bold tracking-[0.3em] text-foreground uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        ALMANS
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-2 text-sm text-muted-foreground tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Premium Fashion
      </motion.p>

      {/* Progress bar container */}
      <motion.div
        className="mt-10 w-52 md:w-64 relative"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        {/* Track */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden border border-border/50">
          {/* Fill with gradient */}
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, hsl(24 40% 40%) 0%, hsl(38 60% 55%) 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
          </motion.div>
        </div>

        {/* Progress markers */}
        <div className="absolute inset-x-0 top-0 flex justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((mark) => (
            <motion.div
              key={mark}
              className={`w-0.5 h-2.5 -mt-0.5 rounded-full transition-colors duration-300 ${
                progress >= mark ? 'bg-almans-gold' : 'bg-muted'
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
