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

  // Variant-specific brown fills
  const variantStyles = {
    default: 'bg-[#5a3825] dark:bg-[#6b4429]',
    light: 'bg-[#7a5035]',
    dark: 'bg-[#4a2d1d]',
  };

  if (animate) {
    return (
      <motion.div
        className={cn(
          'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg',
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
          className="w-[75%] h-[75%] object-contain"
        />
      </motion.div>
    );
  }

  return (
    <div 
      className={cn(
        'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-md',
        variantStyles[variant],
        className
      )}
    >
      <img 
        src={almansLogo} 
        alt="Almans Logo" 
        className="w-[75%] h-[75%] object-contain"
      />
    </div>
  );
}
