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
    sm: { 
      icon: 'h-8 w-8', 
      text: 'text-base',
      border: 'border-2',
      gap: 'gap-2'
    },
    md: { 
      icon: 'h-10 w-10', 
      text: 'text-lg',
      border: 'border-[2.5px]',
      gap: 'gap-2.5'
    },
    lg: { 
      icon: 'h-14 w-14', 
      text: 'text-xl',
      border: 'border-[3px]',
      gap: 'gap-3'
    },
  };

  const sizes = sizeClasses[size];

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

  const textVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        delay: 0.2,
        ease: 'easeOut' as Easing,
      },
    },
  };

  return (
    <Link to="/" className={cn('flex items-center group', sizes.gap, className)}>
      {/* Professional Round Logo */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center',
          'rounded-full overflow-hidden',
          sizes.border,
          'border-primary/80 dark:border-primary/70',
          'shadow-sm group-hover:shadow-md',
          'transition-shadow duration-200',
          sizes.icon
        )}
        initial={animate ? 'hidden' : 'visible'}
        animate="visible"
        variants={containerVariants}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <img 
          src={almansLogo} 
          alt="Almans Logo" 
          className="w-full h-full object-cover"
          loading="eager"
        />
      </motion.div>

      {/* Brand Name - Clean Typography */}
      {showText && (
        <motion.span
          className={cn(
            'hidden font-display font-bold tracking-[0.12em] sm:inline-block',
            'text-foreground group-hover:text-primary',
            'transition-colors duration-200',
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
