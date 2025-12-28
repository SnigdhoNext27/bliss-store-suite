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
      {/* Wolf Logo - Exact design from reference with color swap */}
      <div className={cn(
        'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
        sizes.icon
      )}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* White circular background with brown border */}
          <circle 
            cx="60" 
            cy="60" 
            r="56" 
            fill="hsl(30, 25%, 96%)"
            stroke="hsl(24, 35%, 49%)"
            strokeWidth="3"
          />
          
          {/* Wolf head - exact trace of original design in brown */}
          <g 
            fill="none" 
            stroke="hsl(24, 35%, 49%)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            transform="translate(60, 62) scale(0.38)"
          >
            {/* Left ear outer */}
            <path d="M-45 10 L-70 -75 L-30 -25" />
            {/* Left ear inner */}
            <path d="M-42 -5 L-55 -50 L-35 -15" strokeWidth="1.5" />
            
            {/* Right ear outer */}
            <path d="M45 10 L70 -75 L30 -25" />
            {/* Right ear inner */}
            <path d="M42 -5 L55 -50 L35 -15" strokeWidth="1.5" />
            
            {/* Head top - crown connecting ears */}
            <path d="M-30 -25 L-15 -35 L0 -40 L15 -35 L30 -25" />
            
            {/* Left cheek/jaw */}
            <path d="M-45 10 L-55 30 L-45 55 L-25 75" />
            
            {/* Right cheek/jaw */}
            <path d="M45 10 L55 30 L45 55 L25 75" />
            
            {/* Chin - V shape */}
            <path d="M-25 75 L0 105 L25 75" />
            
            {/* Center line - forehead to nose */}
            <path d="M0 -40 L0 25" strokeWidth="1.5" />
            
            {/* Nose diamond shape */}
            <path d="M-12 30 L0 20 L12 30 L0 50 Z" />
            
            {/* Inner face lines - below ears */}
            <path d="M-30 -25 L-25 5" strokeWidth="1.5" />
            <path d="M30 -25 L25 5" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      {/* Brand Name - ALMANS text */}
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
