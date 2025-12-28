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
      {/* Wolf Logo Icon - Original design with brown on white */}
      <div className={cn(
        'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
        sizes.icon
      )}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(24, 35%, 49%)" />
              <stop offset="100%" stopColor="hsl(38, 60%, 55%)" />
            </linearGradient>
          </defs>
          
          {/* White/cream circular background with brown border */}
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            fill="hsl(30, 25%, 96%)"
            stroke="url(#borderGradient)"
            strokeWidth="3"
          />
          
          {/* Wolf head outline - matching original geometric style */}
          <g fill="none" stroke="hsl(24, 35%, 49%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Left ear - outer */}
            <path d="M32 50 L22 25 L35 40" />
            {/* Left ear - inner detail */}
            <path d="M30 45 L26 32 L33 42" strokeWidth="1.5" />
            
            {/* Right ear - outer */}
            <path d="M68 50 L78 25 L65 40" />
            {/* Right ear - inner detail */}
            <path d="M70 45 L74 32 L67 42" strokeWidth="1.5" />
            
            {/* Head top connecting ears */}
            <path d="M35 40 L42 38 L50 35 L58 38 L65 40" />
            
            {/* Left side of face */}
            <path d="M32 50 L28 55 L30 62 L38 70" />
            
            {/* Right side of face */}
            <path d="M68 50 L72 55 L70 62 L62 70" />
            
            {/* Snout/chin - V shape */}
            <path d="M38 70 L50 82 L62 70" />
            
            {/* Inner face details - nose bridge */}
            <path d="M50 35 L50 55" strokeWidth="1.5" />
            
            {/* Nose area */}
            <path d="M44 58 L50 55 L56 58 L50 68 Z" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Brand Name */}
      {showText && (
        <span className={cn(
          'hidden font-display font-semibold tracking-wide sm:inline-block transition-colors text-foreground group-hover:text-primary',
          sizes.text
        )}>
          ALMANS
        </span>
      )}
    </Link>
  );
}
