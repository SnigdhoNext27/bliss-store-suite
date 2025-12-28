import { motion, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WolfLogoIconProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  animate?: boolean;
}

export function WolfLogoIcon({ className, variant = 'default', animate = false }: WolfLogoIconProps) {
  // Enhanced color configurations for different variants
  const colors = {
    default: {
      bg: 'hsl(30, 25%, 96%)',
      stroke: 'hsl(24, 42%, 45%)',
      strokeLight: 'hsl(24, 35%, 55%)',
      border: 'hsl(24, 42%, 45%)',
      accent: 'hsl(38, 60%, 55%)',
    },
    light: {
      bg: 'transparent',
      stroke: 'hsl(30, 25%, 96%)',
      strokeLight: 'hsl(30, 20%, 85%)',
      border: 'hsl(30, 25%, 96%)',
      accent: 'hsl(38, 60%, 65%)',
    },
    dark: {
      bg: 'hsl(18, 22%, 27%)',
      stroke: 'hsl(30, 25%, 96%)',
      strokeLight: 'hsl(30, 20%, 85%)',
      border: 'hsl(38, 60%, 55%)',
      accent: 'hsl(38, 60%, 55%)',
    },
  };

  const c = colors[variant];

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as Easing,
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

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.02,
      },
    },
  };

  const svgContent = (
    <>
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.stroke} />
          <stop offset="100%" stopColor={c.accent} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Circular background with subtle gradient border */}
      <circle 
        cx="50" 
        cy="50" 
        r="47" 
        fill={c.bg}
      />
      <circle 
        cx="50" 
        cy="50" 
        r="47" 
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="2"
      />
      
      {/* Enhanced Wolf head - geometric design with more detail */}
      <g 
        fill="none" 
        stroke={c.stroke}
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Left ear - sharper, more defined */}
        <path d="M35 50 L28 30 L22 15 L36 35" />
        <path d="M32 43 L27 32 L24 22" strokeWidth="1.5" stroke={c.strokeLight} />
        <path d="M29 38 L35 36" strokeWidth="1.5" stroke={c.strokeLight} />
        
        {/* Right ear - sharper, more defined */}
        <path d="M65 50 L72 30 L78 15 L64 35" />
        <path d="M68 43 L73 32 L76 22" strokeWidth="1.5" stroke={c.strokeLight} />
        <path d="M71 38 L65 36" strokeWidth="1.5" stroke={c.strokeLight} />
        
        {/* Head crown - more angular */}
        <path d="M36 35 L43 39 L50 36 L57 39 L64 35" />
        
        {/* Left cheek structure */}
        <path d="M35 50 L31 57 L34 67" />
        <path d="M43 39 L38 49 L34 57" strokeWidth="1.5" stroke={c.strokeLight} />
        
        {/* Right cheek structure */}
        <path d="M65 50 L69 57 L66 67" />
        <path d="M57 39 L62 49 L66 57" strokeWidth="1.5" stroke={c.strokeLight} />
        
        {/* Chin - V shape pointing down */}
        <path d="M34 67 L50 83 L66 67" />
        
        {/* Center forehead to nose line */}
        <path d="M50 36 L50 56" strokeWidth="1.5" />
        
        {/* Nose/snout area - diamond shape, more detailed */}
        <path d="M44 58 L50 52 L56 58 L50 70 Z" stroke="url(#logoGradient)" strokeWidth="1.8" />
        
        {/* Inner nose detail */}
        <path d="M47 60 L50 57 L53 60" strokeWidth="1.2" stroke={c.strokeLight} />
        
        {/* Eye hints - subtle dots */}
        <circle cx="40" cy="44" r="2" fill={c.stroke} stroke="none" />
        <circle cx="60" cy="44" r="2" fill={c.stroke} stroke="none" />
      </g>
    </>
  );

  if (animate) {
    return (
      <motion.svg 
        viewBox="0 0 100 100" 
        className={cn('w-10 h-10', className)}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <defs>
          <linearGradient id="logoGradientAnimated" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.stroke} />
            <stop offset="100%" stopColor={c.accent} />
          </linearGradient>
        </defs>
        
        <circle cx="50" cy="50" r="47" fill={c.bg} />
        <motion.circle 
          cx="50" 
          cy="50" 
          r="47" 
          fill="none"
          stroke="url(#logoGradientAnimated)"
          strokeWidth="2"
          variants={circleVariants}
        />
        
        <motion.g 
          fill="none" 
          stroke={c.stroke}
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <motion.path d="M35 50 L28 30 L22 15 L36 35" variants={pathVariants} />
          <motion.path d="M32 43 L27 32 L24 22" strokeWidth="1.5" stroke={c.strokeLight} variants={pathVariants} />
          <motion.path d="M29 38 L35 36" strokeWidth="1.5" stroke={c.strokeLight} variants={pathVariants} />
          <motion.path d="M65 50 L72 30 L78 15 L64 35" variants={pathVariants} />
          <motion.path d="M68 43 L73 32 L76 22" strokeWidth="1.5" stroke={c.strokeLight} variants={pathVariants} />
          <motion.path d="M71 38 L65 36" strokeWidth="1.5" stroke={c.strokeLight} variants={pathVariants} />
          <motion.path d="M36 35 L43 39 L50 36 L57 39 L64 35" variants={pathVariants} />
          <motion.path d="M35 50 L31 57 L34 67" variants={pathVariants} />
          <motion.path d="M43 39 L38 49 L34 57" strokeWidth="1.5" stroke={c.strokeLight} variants={pathVariants} />
          <motion.path d="M65 50 L69 57 L66 67" variants={pathVariants} />
          <motion.path d="M57 39 L62 49 L66 57" strokeWidth="1.5" stroke={c.strokeLight} variants={pathVariants} />
          <motion.path d="M34 67 L50 83 L66 67" variants={pathVariants} />
          <motion.path d="M50 36 L50 56" strokeWidth="1.5" variants={pathVariants} />
          <motion.path d="M44 58 L50 52 L56 58 L50 70 Z" stroke={c.accent} strokeWidth="1.8" variants={pathVariants} />
          <motion.path d="M47 60 L50 57 L53 60" strokeWidth="1.2" stroke={c.strokeLight} variants={pathVariants} />
          <motion.circle cx="40" cy="44" r="2" fill={c.stroke} stroke="none" variants={pathVariants} />
          <motion.circle cx="60" cy="44" r="2" fill={c.stroke} stroke="none" variants={pathVariants} />
        </motion.g>
      </motion.svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={cn('w-10 h-10', className)}>
      {svgContent}
    </svg>
  );
}
