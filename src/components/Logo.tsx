import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-9 w-9', text: 'text-lg' },
    md: { icon: 'h-11 w-11', text: 'text-xl' },
    lg: { icon: 'h-16 w-16', text: 'text-2xl' },
  };

  const sizes = sizeClasses[size];

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group', className)}>
      {/* Wolf Logo - Exact design with brown on white */}
      <div className={cn(
        'relative flex items-center justify-center transition-all duration-300 group-hover:scale-105',
        sizes.icon
      )}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* White circular background with brown border */}
          <circle 
            cx="50" 
            cy="50" 
            r="47" 
            fill="hsl(30, 25%, 96%)"
            stroke="hsl(24, 35%, 49%)"
            strokeWidth="2.5"
          />
          
          {/* Wolf head - exact geometric design in brown */}
          <g 
            fill="none" 
            stroke="hsl(24, 35%, 49%)" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Left ear - outer pointed shape */}
            <path d="M35 52 L28 32 L22 18 L36 36" />
            {/* Left ear - inner detail */}
            <path d="M32 45 L28 35 L25 26" strokeWidth="1.8" />
            <path d="M30 40 L34 38" strokeWidth="1.8" />
            
            {/* Right ear - outer pointed shape */}
            <path d="M65 52 L72 32 L78 18 L64 36" />
            {/* Right ear - inner detail */}
            <path d="M68 45 L72 35 L75 26" strokeWidth="1.8" />
            <path d="M70 40 L66 38" strokeWidth="1.8" />
            
            {/* Head top - connecting ears with angular crown */}
            <path d="M36 36 L42 40 L50 38 L58 40 L64 36" />
            
            {/* Left side face/cheek angular lines */}
            <path d="M35 52 L32 58 L35 68" />
            <path d="M42 40 L38 50 L35 58" strokeWidth="1.8" />
            
            {/* Right side face/cheek angular lines */}
            <path d="M65 52 L68 58 L65 68" />
            <path d="M58 40 L62 50 L65 58" strokeWidth="1.8" />
            
            {/* Chin - V shape pointing down */}
            <path d="M35 68 L50 82 L65 68" />
            
            {/* Center vertical line - forehead to nose */}
            <path d="M50 38 L50 58" strokeWidth="1.8" />
            
            {/* Nose/snout area - diamond shape */}
            <path d="M44 60 L50 54 L56 60 L50 72 Z" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Brand Name - ALMANS */}
      {showText && (
        <span className={cn(
          'hidden font-display font-bold tracking-wider sm:inline-block transition-colors text-foreground group-hover:text-primary uppercase',
          sizes.text
        )}>
          ALMANS
        </span>
      )}
    </Link>
  );
}
