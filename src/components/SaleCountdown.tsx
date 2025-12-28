import { useState, useEffect, useMemo } from 'react';
import { Clock, Flame } from 'lucide-react';

interface SaleCountdownProps {
  endDate?: Date;
  className?: string;
  compact?: boolean;
}

export function SaleCountdown({ endDate, className = '', compact = false }: SaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  // Memoize the target date to prevent infinite loops
  const targetTimestamp = useMemo(() => {
    if (endDate) {
      return new Date(endDate).getTime();
    }
    // Default to end of current day
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.getTime();
  }, [endDate?.getTime?.()]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetTimestamp - now;

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  if (isExpired) return null;

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${className}`}>
        <Flame className="h-3 w-3 text-destructive animate-pulse" />
        <span className="text-destructive">
          {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-md">
        <Clock className="h-3 w-3" />
        <span className="text-xs font-semibold">
          {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m {formatNumber(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  );
}
