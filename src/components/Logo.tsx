import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import wolfIcon from '@/assets/almans-wolf-icon.jpg';

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
        'relative flex items-center justify-center rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105 bg-foreground',
        sizes.icon
      )}>
        <img 
          src={wolfIcon} 
          alt="Almans Logo" 
          className="w-full h-full object-cover"
        />
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
