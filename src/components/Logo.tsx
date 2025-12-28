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
        staggerChildren: 0.05,
      },
    },
  };

  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
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
        delay: 0.6,
        ease: 'easeOut' as Easing,
      },
    },
  };

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group', className)}>
      {/* Wolf Logo - Animated on load */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105',
          sizes.icon
        )}
        initial={animate ? 'hidden' : 'visible'}
        animate="visible"
        variants={containerVariants}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* White circular background with animated brown border */}
          <circle 
            cx="50" 
            cy="50" 
            r="47" 
            fill="hsl(30, 25%, 96%)"
          />
          <motion.circle 
            cx="50" 
            cy="50" 
            r="47" 
            fill="none"
            stroke="hsl(24, 35%, 49%)"
            strokeWidth="2.5"
            variants={circleVariants}
            initial={animate ? 'hidden' : 'visible'}
            animate="visible"
          />
          
          {/* Wolf head - animated geometric design in brown */}
          <motion.g 
            fill="none" 
            stroke="hsl(24, 35%, 49%)" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Left ear - outer pointed shape */}
            <motion.path d="M35 52 L28 32 L22 18 L36 36" variants={pathVariants} />
            {/* Left ear - inner detail */}
            <motion.path d="M32 45 L28 35 L25 26" strokeWidth="1.8" variants={pathVariants} />
            <motion.path d="M30 40 L34 38" strokeWidth="1.8" variants={pathVariants} />
            
            {/* Right ear - outer pointed shape */}
            <motion.path d="M65 52 L72 32 L78 18 L64 36" variants={pathVariants} />
            {/* Right ear - inner detail */}
            <motion.path d="M68 45 L72 35 L75 26" strokeWidth="1.8" variants={pathVariants} />
            <motion.path d="M70 40 L66 38" strokeWidth="1.8" variants={pathVariants} />
            
            {/* Head top - connecting ears with angular crown */}
            <motion.path d="M36 36 L42 40 L50 38 L58 40 L64 36" variants={pathVariants} />
            
            {/* Left side face/cheek angular lines */}
            <motion.path d="M35 52 L32 58 L35 68" variants={pathVariants} />
            <motion.path d="M42 40 L38 50 L35 58" strokeWidth="1.8" variants={pathVariants} />
            
            {/* Right side face/cheek angular lines */}
            <motion.path d="M65 52 L68 58 L65 68" variants={pathVariants} />
            <motion.path d="M58 40 L62 50 L65 58" strokeWidth="1.8" variants={pathVariants} />
            
            {/* Chin - V shape pointing down */}
            <motion.path d="M35 68 L50 82 L65 68" variants={pathVariants} />
            
            {/* Center vertical line - forehead to nose */}
            <motion.path d="M50 38 L50 58" strokeWidth="1.8" variants={pathVariants} />
            
            {/* Nose/snout area - diamond shape */}
            <motion.path d="M44 60 L50 54 L56 60 L50 72 Z" strokeWidth="2" variants={pathVariants} />
          </motion.g>
        </svg>
      </motion.div>

      {/* Brand Name - ALMANS with fade in */}
      {showText && (
        <motion.span
          className={cn(
            'hidden font-display font-bold tracking-wider sm:inline-block transition-colors text-foreground group-hover:text-primary uppercase',
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
