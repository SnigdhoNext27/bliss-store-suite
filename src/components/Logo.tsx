import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-8 w-8', text: 'text-lg' },
    md: { icon: 'h-10 w-10', text: 'text-xl' },
    lg: { icon: 'h-14 w-14', text: 'text-2xl' },
  };

  const sizes = sizeClasses[size];

  return (
    <Link to="/" className={cn('flex items-center gap-2 group', className)}>
      {/* Wolf Logo Icon */}
      <div className={cn(
        'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
        sizes.icon
      )}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="wolfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--almans-gold))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          {/* Wolf head silhouette */}
          <path
            d="M50 10
               L65 35 L80 20 L75 45
               L85 50 L75 55
               L80 80 L65 70
               L50 90
               L35 70 L20 80
               L25 55 L15 50
               L25 45 L20 20
               L35 35 Z"
            fill="url(#wolfGradient)"
            className="transition-all duration-300"
          />
          {/* Inner details - eyes */}
          <circle cx="40" cy="45" r="3" fill="hsl(var(--background))" />
          <circle cx="60" cy="45" r="3" fill="hsl(var(--background))" />
          {/* Inner detail - nose */}
          <path
            d="M50 55 L45 65 L50 70 L55 65 Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>

      {/* Brand Name */}
      {showText && (
        <span className={cn(
          'hidden font-display font-semibold tracking-wide sm:inline-block transition-colors',
          'bg-gradient-to-r from-primary via-almans-gold to-primary bg-clip-text text-transparent',
          'group-hover:from-almans-gold group-hover:via-primary group-hover:to-almans-gold',
          sizes.text
        )}>
          ALMANS
        </span>
      )}
    </Link>
  );
}
