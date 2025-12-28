import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MicroInteractionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'bounce' | 'pulse' | 'shake' | 'glow' | 'ripple';
}

export function MicroInteractionButton({
  children,
  variant = 'bounce',
  className,
  ...props
}: MicroInteractionButtonProps) {
  const variants = {
    bounce: {
      whileHover: { scale: 1.05, y: -2 },
      whileTap: { scale: 0.95, y: 0 },
    },
    pulse: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    },
    shake: {
      whileHover: { x: [0, -2, 2, -2, 2, 0] },
      whileTap: { scale: 0.95 },
    },
    glow: {
      whileHover: { boxShadow: '0 0 20px rgba(var(--primary), 0.5)' },
      whileTap: { scale: 0.98 },
    },
    ripple: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    },
  };

  const config = variants[variant];

  return (
    <motion.button
      whileHover={config.whileHover}
      whileTap={config.whileTap}
      className={cn(
        "relative overflow-hidden transition-all",
        className
      )}
      type="button"
    >
      {children}
    </motion.button>
  );
}

// Animated Card Component with hover effects
export function AnimatedCard({
  children,
  className,
  hoverEffect = 'lift',
}: {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'tilt' | 'glow' | 'border';
}) {
  const effects = {
    lift: {
      whileHover: { y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    },
    tilt: {
      whileHover: { rotateY: 5, rotateX: 5, scale: 1.02 },
    },
    glow: {
      whileHover: { boxShadow: '0 0 30px rgba(var(--primary), 0.3)' },
    },
    border: {
      whileHover: { borderColor: 'hsl(var(--primary))' },
    },
  };

  return (
    <motion.div
      {...effects[hoverEffect]}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn("transition-all", className)}
      style={{ perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animation wrapper
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating animation
export function FloatingElement({
  children,
  className,
  amplitude = 10,
  duration = 3,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -amplitude, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Shimmer loading effect
export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted rounded", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ translateX: ['−100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Magnetic button effect
export function MagneticWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
}

// Text reveal animation
export function TextReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={className}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + index * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Counter animation
export function AnimatedCounter({
  value,
  duration = 1,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}
