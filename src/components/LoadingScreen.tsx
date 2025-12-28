import { motion, type Easing } from 'framer-motion';
import { WolfLogoIcon } from './WolfLogoIcon';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' as Easing }}
      onAnimationComplete={onComplete}
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

      {/* Loading indicator */}
      <motion.div
        className="mt-8 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </motion.div>
    </motion.div>
  );
}
