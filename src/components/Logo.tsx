import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-8 w-8', text: 'text-lg', circle: 'h-6 w-6', letterSize: 'text-sm' },
    md: { icon: 'h-10 w-10', text: 'text-xl', circle: 'h-10 w-10', letterSize: 'text-lg' },
    lg: { icon: 'h-14 w-14', text: 'text-2xl', circle: 'h-14 w-14', letterSize: 'text-2xl' },
  };

  const sizes = sizeClasses[size];

  return (
    <Link to="/" className={cn('flex items-center gap-2 group', className)}>
      {/* Logo Icon - A in circle with gradient */}
      <div className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-300 group-hover:scale-105',
        sizes.circle
      )}>
        {/* Gradient Circle Border */}
        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--almans-gold))" />
            </linearGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        </svg>
        
        {/* Letter A with gradient */}
        <span 
          className={cn(
            'font-display font-semibold bg-gradient-to-br from-primary to-almans-gold bg-clip-text text-transparent',
            sizes.letterSize
          )}
        >
          A
        </span>
      </div>

      {/* Brand Name */}
      {showText && (
        <span className={cn(
          'hidden font-display font-semibold text-foreground tracking-wide sm:inline-block transition-colors group-hover:text-primary',
          sizes.text
        )}>
          ALMANS
        </span>
      )}
    </Link>
  );
}