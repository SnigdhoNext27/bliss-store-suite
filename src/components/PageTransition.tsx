import { motion, type Easing, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown' | 'blur';
}

const easeOut: Easing = [0.25, 0.46, 0.45, 0.94];
const easeIn: Easing = [0.4, 0, 1, 1];

const variants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.4, ease: easeOut }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3, ease: easeIn }
    },
  },
  slide: {
    initial: { opacity: 0, x: 60 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5, ease: easeOut }
    },
    exit: { 
      opacity: 0, 
      x: -30,
      transition: { duration: 0.3, ease: easeIn }
    },
  },
  scale: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: easeOut }
    },
    exit: { 
      opacity: 0, 
      scale: 0.96,
      transition: { duration: 0.3, ease: easeIn }
    },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: easeOut }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3, ease: easeIn }
    },
  },
  slideDown: {
    initial: { opacity: 0, y: -40 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: easeOut }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      transition: { duration: 0.3, ease: easeIn }
    },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { 
      opacity: 1, 
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: easeOut }
    },
    exit: { 
      opacity: 0, 
      filter: 'blur(5px)',
      transition: { duration: 0.3, ease: easeIn }
    },
  },
};

export function PageTransition({ children, variant = 'slideUp' }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for list animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Stagger item for list items
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easeOut }
  },
};

// Fade in from different directions
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: easeOut }
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: easeOut }
  },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: easeOut }
  },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: easeOut }
  },
};

// Scale animations
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: easeOut }
  },
};

// Hover animations
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.2 },
};

export const tapScale = {
  scale: 0.98,
};
