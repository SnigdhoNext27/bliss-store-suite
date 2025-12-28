import { Link } from 'react-router-dom';
import { motion, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function Logo({ className, showText = true, size = 'md', animate = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-9 w-9', text: 'text-lg' },
    md: { icon: 'h-11 w-11', text: 'text-xl' },
    lg: { icon: 'h-16 w-16', text: 'text-2xl' },
  };

  const sizes = sizeClasses[size];

  // Animation variants for the logo
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
        staggerChildren: 0.03,
      },
    },
  };

  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: 'easeOut' as Easing,
      },
    },
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut' as Easing,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.5,
        ease: 'easeOut' as Easing,
      },
    },
  };

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group', className)}>
      {/* Wolf Logo - Animated on load with hover glow */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
          sizes.icon
        )}
        initial={animate ? 'hidden' : 'visible'}
        animate="visible"
        variants={containerVariants}
        whileHover={{ 
          filter: 'drop-shadow(0 0 14px hsl(24, 42%, 45%, 0.6))',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(24, 42%, 45%)" />
              <stop offset="100%" stopColor="hsl(38, 60%, 55%)" />
            </linearGradient>
          </defs>
          
          {/* Cream circular background */}
          <circle 
            cx="50" 
            cy="50" 
            r="47" 
            fill="hsl(30, 25%, 96%)"
          />
          {/* Gradient border */}
          <motion.circle 
            cx="50" 
            cy="50" 
            r="47" 
            fill="none"
            stroke="url(#logoGrad)"
            strokeWidth="2"
            variants={circleVariants}
            initial={animate ? 'hidden' : 'visible'}
            animate="visible"
          />
          
          {/* Enhanced Wolf head - geometric design */}
          <motion.g 
            fill="none" 
            stroke="hsl(24, 42%, 45%)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Left ear */}
            <motion.path d="M35 50 L28 30 L22 15 L36 35" variants={pathVariants} />
            <motion.path d="M32 43 L27 32 L24 22" strokeWidth="1.5" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            <motion.path d="M29 38 L35 36" strokeWidth="1.5" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            
            {/* Right ear */}
            <motion.path d="M65 50 L72 30 L78 15 L64 35" variants={pathVariants} />
            <motion.path d="M68 43 L73 32 L76 22" strokeWidth="1.5" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            <motion.path d="M71 38 L65 36" strokeWidth="1.5" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            
            {/* Head crown */}
            <motion.path d="M36 35 L43 39 L50 36 L57 39 L64 35" variants={pathVariants} />
            
            {/* Left cheek */}
            <motion.path d="M35 50 L31 57 L34 67" variants={pathVariants} />
            <motion.path d="M43 39 L38 49 L34 57" strokeWidth="1.5" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            
            {/* Right cheek */}
            <motion.path d="M65 50 L69 57 L66 67" variants={pathVariants} />
            <motion.path d="M57 39 L62 49 L66 57" strokeWidth="1.5" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            
            {/* Chin */}
            <motion.path d="M34 67 L50 83 L66 67" variants={pathVariants} />
            
            {/* Center line */}
            <motion.path d="M50 36 L50 56" strokeWidth="1.5" variants={pathVariants} />
            
            {/* Nose diamond with gradient */}
            <motion.path d="M44 58 L50 52 L56 58 L50 70 Z" stroke="url(#logoGrad)" strokeWidth="1.8" variants={pathVariants} />
            
            {/* Inner nose detail */}
            <motion.path d="M47 60 L50 57 L53 60" strokeWidth="1.2" stroke="hsl(24, 35%, 55%)" variants={pathVariants} />
            
            {/* Eyes */}
            <motion.circle cx="40" cy="44" r="2" fill="hsl(24, 42%, 45%)" stroke="none" variants={pathVariants} />
            <motion.circle cx="60" cy="44" r="2" fill="hsl(24, 42%, 45%)" stroke="none" variants={pathVariants} />
          </motion.g>
        </svg>
      </motion.div>

      {/* Brand Name - ALMANS with gradient effect */}
      {showText && (
        <motion.span
          className={cn(
            'hidden font-display font-bold tracking-[0.15em] sm:inline-block transition-colors text-foreground group-hover:text-primary uppercase',
            sizes.text
          )}
          variants={textVariants}
          initial={animate ? 'hidden' : 'visible'}
          animate="visible"
        >
          ALMANS
        </motion.span>
      )}
    </Link>
  );
}
