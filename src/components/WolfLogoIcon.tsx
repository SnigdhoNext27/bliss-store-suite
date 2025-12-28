import { cn } from '@/lib/utils';

interface WolfLogoIconProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
}

export function WolfLogoIcon({ className, variant = 'default' }: WolfLogoIconProps) {
  // Color configurations for different variants
  const colors = {
    default: {
      bg: 'hsl(30, 25%, 96%)',
      stroke: 'hsl(24, 35%, 49%)',
      border: 'hsl(24, 35%, 49%)',
    },
    light: {
      bg: 'transparent',
      stroke: 'hsl(30, 25%, 96%)',
      border: 'hsl(30, 25%, 96%)',
    },
    dark: {
      bg: 'hsl(18, 22%, 27%)',
      stroke: 'hsl(30, 25%, 96%)',
      border: 'hsl(38, 60%, 55%)',
    },
  };

  const c = colors[variant];

  return (
    <svg viewBox="0 0 100 100" className={cn('w-10 h-10', className)}>
      {/* Circular background with border */}
      <circle 
        cx="50" 
        cy="50" 
        r="47" 
        fill={c.bg}
        stroke={c.border}
        strokeWidth="2.5"
      />
      
      {/* Wolf head - geometric design */}
      <g 
        fill="none" 
        stroke={c.stroke}
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
  );
}
