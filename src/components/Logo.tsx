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
    sm: { icon: 'h-9 w-9', text: 'text-lg' },
    md: { icon: 'h-11 w-11', text: 'text-xl' },
    lg: { icon: 'h-16 w-16', text: 'text-2xl' },
  };

  const sizes = sizeClasses[size];

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
      {/* Fully Round Logo with Brown Fill */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
          'rounded-full overflow-hidden',
          'border-[4px] border-[#5a3a2a] dark:border-[#4a2a1a]',
          'shadow-[0_6px_25px_rgba(90,58,42,0.4),inset_0_0_10px_rgba(0,0,0,0.15)] group-hover:shadow-[0_8px_30px_rgba(90,58,42,0.5)]',
          sizes.icon
        )}
        initial={animate ? 'hidden' : 'visible'}
        animate="visible"
        variants={containerVariants}
        whileHover={{ 
          boxShadow: '0 0 30px rgba(90, 58, 42, 0.5)',
        }}
      >
        <img 
          src={almansLogo} 
          alt="Almans Logo" 
          className="w-full h-full object-cover"
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
