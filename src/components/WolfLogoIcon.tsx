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

  const pulseVariants = {
    pulse: {
      scale: [1, 1.03, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as Easing,
      },
    },
  };

  // Variant-specific with lighter border
  const variantStyles = {
    default: 'border-[4px] border-[#5a3a2a] dark:border-[#4a2a1a]',
    light: 'border-[4px] border-[#6a4a3a]',
    dark: 'border-[4px] border-[#4a2a1a]',
  };

  if (animate) {
    return (
      <motion.div
        className={cn(
          'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center',
          'shadow-[0_6px_25px_rgba(90,58,42,0.4),inset_0_0_10px_rgba(0,0,0,0.15)]',
          variantStyles[variant],
          className
        )}
        initial="hidden"
        animate={['visible', 'pulse']}
        variants={{ ...containerVariants, ...pulseVariants }}
      >
        <img 
          src={almansLogo} 
          alt="Almans Logo" 
          className="w-full h-full object-cover"
        />
      </motion.div>
    );
  }

  return (
    <div 
      className={cn(
        'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center',
        'shadow-[0_6px_25px_rgba(90,58,42,0.4),inset_0_0_10px_rgba(0,0,0,0.15)]',
        variantStyles[variant],
        className
      )}
    >
      <img 
        src={almansLogo} 
        alt="Almans Logo" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
