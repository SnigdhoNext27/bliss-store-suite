import { Link } from 'react-router-dom';
import { motion, type Easing } from 'framer-motion';
import { cn } from '@/lib/utils';
import almansLogo from '@/assets/almans-logo.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function Logo({ className, showText = true, size = 'md', animate = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-9 w-9', text: 'text-lg', border: 'border-[2px]' },
    md: { icon: 'h-11 w-11', text: 'text-xl', border: 'border-[2.5px]' },
    lg: { icon: 'h-16 w-16', text: 'text-2xl', border: 'border-[3px]' },
  };

  const sizes = sizeClasses[size];

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

  const textVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.3,
        ease: 'easeOut' as Easing,
      },
    },
  };

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group', className)}>
      {/* Logo Image with Round Border */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
          'rounded-full overflow-hidden',
          sizes.border,
          'border-almans-brown-dark dark:border-almans-gold',
          'bg-gradient-to-br from-almans-cream to-almans-cream-dark dark:from-almans-chocolate dark:to-background',
          'shadow-md group-hover:shadow-lg',
          sizes.icon
        )}
        initial={animate ? 'hidden' : 'visible'}
        animate="visible"
        variants={containerVariants}
        whileHover={{ 
          boxShadow: '0 0 20px hsl(24 40% 40% / 0.4)',
        }}
      >
        {/* Inner glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-almans-gold/20 to-transparent dark:from-almans-gold/30" />
        
        <img 
          src={almansLogo} 
          alt="Almans Logo" 
          className="w-[85%] h-[85%] object-contain relative z-10"
        />
      </motion.div>

      {/* Brand Name - ALMANS */}
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
