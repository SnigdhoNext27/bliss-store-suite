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
      {/* Wolf Logo Icon - SVG with gradient colors matching site theme */}
      <div className={cn(
        'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
        sizes.icon
      )}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <defs>
            {/* Main gradient for wolf - gold to brown */}
            <linearGradient id="wolfBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(38, 60%, 55%)" /> {/* almans-gold */}
              <stop offset="50%" stopColor="hsl(24, 35%, 49%)" /> {/* primary/brown */}
              <stop offset="100%" stopColor="hsl(24, 40%, 40%)" /> {/* darker brown */}
            </linearGradient>
            {/* Accent gradient for ears */}
            <linearGradient id="wolfAccentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(24, 35%, 49%)" />
              <stop offset="100%" stopColor="hsl(38, 60%, 60%)" />
            </linearGradient>
            {/* Subtle shadow filter */}
            <filter id="wolfShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15"/>
            </filter>
          </defs>
          
          {/* Wolf head - geometric/angular style matching the reference */}
          <g filter="url(#wolfShadow)">
            {/* Left ear */}
            <path
              d="M30 45 L20 15 L38 35 Z"
              fill="url(#wolfAccentGradient)"
            />
            {/* Right ear */}
            <path
              d="M70 45 L80 15 L62 35 Z"
              fill="url(#wolfAccentGradient)"
            />
            {/* Left ear inner detail */}
            <path
              d="M32 40 L25 22 L36 34 Z"
              fill="hsl(30, 25%, 96%)"
              opacity="0.3"
            />
            {/* Right ear inner detail */}
            <path
              d="M68 40 L75 22 L64 34 Z"
              fill="hsl(30, 25%, 96%)"
              opacity="0.3"
            />
            
            {/* Main head shape */}
            <path
              d="M50 85 
                 L30 70 L22 55 L25 45 L35 40 
                 L40 35 L50 30 L60 35 L65 40 
                 L75 45 L78 55 L70 70 Z"
              fill="url(#wolfBodyGradient)"
            />
            
            {/* Forehead/crown */}
            <path
              d="M35 40 L50 30 L65 40 L60 38 L50 33 L40 38 Z"
              fill="hsl(38, 60%, 58%)"
              opacity="0.6"
            />
            
            {/* Left eye */}
            <ellipse cx="40" cy="50" rx="5" ry="4" fill="hsl(18, 22%, 27%)" />
            <ellipse cx="41" cy="49" rx="2" ry="1.5" fill="hsl(30, 25%, 96%)" opacity="0.4" />
            
            {/* Right eye */}
            <ellipse cx="60" cy="50" rx="5" ry="4" fill="hsl(18, 22%, 27%)" />
            <ellipse cx="61" cy="49" rx="2" ry="1.5" fill="hsl(30, 25%, 96%)" opacity="0.4" />
            
            {/* Nose bridge */}
            <path
              d="M50 55 L45 58 L50 75 L55 58 Z"
              fill="hsl(24, 40%, 42%)"
            />
            
            {/* Nose */}
            <ellipse cx="50" cy="68" rx="6" ry="4" fill="hsl(18, 22%, 27%)" />
            <ellipse cx="51" cy="67" rx="2" ry="1" fill="hsl(30, 25%, 96%)" opacity="0.3" />
            
            {/* Mouth/muzzle line */}
            <path
              d="M50 72 L50 78 M46 76 Q50 80 54 76"
              stroke="hsl(18, 22%, 27%)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
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
