import { motion, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';
import almansLogo from '@/assets/almans-logo.png';

interface WolfLogoIconProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  animate?: boolean;
  showBorder?: boolean;
}

export function WolfLogoIcon({ className, variant = 'default', animate = false, showBorder = true }: WolfLogoIconProps) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
      },
    },
  };

  const pulseVariants = {
    initial: { scale: 1 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as Easing,
      },
    },
  };

  // Variant-specific styles for the container
  const variantStyles = {
    default: {
      border: 'border-almans-brown-dark dark:border-almans-gold',
      bg: 'bg-gradient-to-br from-almans-cream to-almans-cream-dark dark:from-almans-chocolate dark:to-background',
      glow: 'from-almans-gold/20 to-transparent dark:from-almans-gold/30',
      filter: '',
    },
    light: {
      border: 'border-almans-cream/80',
      bg: 'bg-gradient-to-br from-white/10 to-white/5',
      glow: 'from-white/20 to-transparent',
      filter: 'brightness-[1.2] contrast-[0.95]',
    },
    dark: {
      border: 'border-almans-gold',
      bg: 'bg-gradient-to-br from-almans-chocolate to-almans-brown-dark',
      glow: 'from-almans-gold/30 to-transparent',
      filter: '',
    },
  };

  const styles = variantStyles[variant];

  const content = (
    <>
      {/* Inner glow ring */}
      <div className={cn('absolute inset-0 rounded-full bg-gradient-to-br', styles.glow)} />
      
      {/* Decorative inner ring */}
      {showBorder && (
        <div className="absolute inset-[3px] rounded-full border border-almans-gold/30 dark:border-almans-gold/40" />
      )}
      
      <img 
        src={almansLogo} 
        alt="Almans Logo" 
        className={cn('w-[80%] h-[80%] object-contain relative z-10', styles.filter)}
      />
    </>
  );

  if (animate) {
    return (
      <motion.div
        className={cn(
          'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center',
          showBorder && 'border-[2.5px]',
          showBorder && styles.border,
          styles.bg,
          'shadow-lg relative',
          className
        )}
        initial="hidden"
        animate={['visible', 'pulse']}
        variants={{ ...containerVariants, ...pulseVariants }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div 
      className={cn(
        'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center',
        showBorder && 'border-[2.5px]',
        showBorder && styles.border,
        styles.bg,
        'shadow-md relative',
        className
      )}
    >
      {content}
    </div>
  );
}
