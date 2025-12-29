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

  // Variant-specific brown fills with deep border
  const variantStyles = {
    default: 'bg-[#8B5A3C] dark:bg-[#9B6A4C] border-[3px] border-[#4a2a1a] dark:border-[#3d2215]',
    light: 'bg-[#9B6A4C] border-[3px] border-[#5a3a2a]',
    dark: 'bg-[#7B4A2C] border-[3px] border-[#3a1a0a]',
  };

  if (animate) {
    return (
      <motion.div
        className={cn(
          'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center',
          'shadow-[0_4px_20px_rgba(74,42,26,0.4)]',
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
        'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center',
        'shadow-[0_4px_20px_rgba(74,42,26,0.4)]',
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
