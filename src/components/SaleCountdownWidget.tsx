import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const SaleCountdownWidget = () => {
  const { settings } = useSiteSettings();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  const isSaleEnabled = settings.flash_sale_enabled === 'true';

  // Memoize the sale end date string to avoid infinite loops
  const saleEndDateString = settings.flash_sale_end_date || '';

  useEffect(() => {
    const getSaleEndDate = () => {
      return saleEndDateString 
        ? new Date(saleEndDateString) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    };

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = getSaleEndDate().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [saleEndDateString]);

  if (isExpired || !isSaleEnabled) return null;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 min-w-[60px] shadow-lg"
      >
        <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12"
    >
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/90 via-destructive to-destructive/80 p-6 md:p-8 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <Flame className="h-5 w-5 text-white animate-pulse" />
                <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                  Limited Time Offer
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                Flash Sale Ends In
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-md">
                Don't miss out on exclusive discounts up to 50% off on premium fashion items!
              </p>
            </div>

            {/* Center - Countdown timer */}
            <div className="flex items-center gap-2 md:gap-4">
              <TimeBlock value={timeLeft.days} label="Days" />
              <span className="text-2xl font-bold text-white/60 mt-[-20px]">:</span>
              <TimeBlock value={timeLeft.hours} label="Hours" />
              <span className="text-2xl font-bold text-white/60 mt-[-20px]">:</span>
              <TimeBlock value={timeLeft.minutes} label="Mins" />
              <span className="text-2xl font-bold text-white/60 mt-[-20px]">:</span>
              <TimeBlock value={timeLeft.seconds} label="Secs" />
            </div>

            {/* Right side - CTA button */}
            <div className="flex flex-col items-center lg:items-end gap-2">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="group bg-white text-destructive hover:bg-white/90 font-semibold px-6 shadow-lg"
              >
                <Link to="/sales" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Shop Sale Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <span className="text-white/60 text-xs">
                Free shipping on orders over ৳2,000
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
