import { motion, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';
import almansLogo from '@/assets/almans-logo.png';

interface WolfLogoIconProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  animate?: boolean;
}

export function WolfLogoIcon({ className, variant = 'default', animate = false }: WolfLogoIconProps) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
      },
    },
  };

  // Apply different filters based on variant for visual distinction
  const variantStyles = {
    default: '',
    light: 'brightness-[1.3] contrast-[0.9]',
    dark: 'brightness-[0.85] contrast-[1.1]',
  };

  if (animate) {
    return (
      <motion.div
        className={cn('w-10 h-10', className)}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <img 
          src={almansLogo} 
          alt="Almans Logo" 
          className={cn('w-full h-full object-contain', variantStyles[variant])}
        />
      </motion.div>
    );
  }

  return (
    <div className={cn('w-10 h-10', className)}>
      <img 
        src={almansLogo} 
        alt="Almans Logo" 
        className={cn('w-full h-full object-contain', variantStyles[variant])}
      />
    </div>
  );
}
