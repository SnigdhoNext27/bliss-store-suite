import { motion, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';
import almansLogo from '@/assets/almans-logo.png';

interface WolfLogoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'light' | 'dark';
  animate?: boolean;
}

export function WolfLogoIcon({ 
  className, 
  size = 'md',
  variant = 'default', 
  animate = false 
}: WolfLogoIconProps) {
  
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-14 h-14 border-[2.5px]',
    xl: 'w-20 h-20 border-[3px]',
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
      },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut' as Easing,
      },
    },
  };

  // Clean variant styles using semantic colors
  const variantStyles = {
    default: 'border-primary/70 dark:border-primary/60',
    light: 'border-primary/50',
    dark: 'border-primary/80',
  };

  const baseClasses = cn(
    'rounded-full overflow-hidden flex items-center justify-center',
    'shadow-md',
    sizeClasses[size],
    variantStyles[variant],
    className
  );

  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        initial="hidden"
        animate={['visible', 'pulse']}
        variants={{ ...containerVariants, ...pulseVariants }}
      >
        <img 
          src={almansLogo} 
          alt="Almans Logo" 
          className="w-full h-full object-cover"
          loading="eager"
        />
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      <img 
        src={almansLogo} 
        alt="Almans Logo" 
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}
