import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function PromotionalBanner() {
  const navigate = useNavigate();
  const { settings, loading } = useSiteSettings();
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  // Get settings from database
  const flashSaleEnabled = settings.flash_sale_enabled === 'true';
  const discount = settings.flash_sale_discount || '50';
  const saleEndDateStr = settings.flash_sale_end_date;

  useEffect(() => {
    if (!saleEndDateStr) return;

    const calculateTimeLeft = () => {
      const saleEndDate = new Date(saleEndDateStr);
      const difference = saleEndDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        setIsExpired(false);
      } else {
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [saleEndDateStr]);

  const handleShopSale = () => {
    navigate('/shop?sale=true');
    // Scroll to products section after navigation
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Don't show if disabled, expired, or loading
  if (loading || !flashSaleEnabled || isExpired) {
    return null;
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div 
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[50px] text-center border border-primary-foreground/20"
      >
        <span className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
          {String(value).padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-[10px] md:text-xs text-primary-foreground/70 mt-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-almans-brown-dark to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute -top-20 -left-20 w-40 h-40 bg-almans-gold/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute -bottom-20 -right-20 w-60 h-60 bg-destructive/20 rounded-full blur-3xl"
        />
        
        {/* Floating sparkles */}
        <Sparkles className="absolute top-4 left-[10%] w-6 h-6 text-almans-gold/50 animate-pulse" />
        <Sparkles className="absolute bottom-4 right-[15%] w-4 h-4 text-primary-foreground/30 animate-pulse delay-500" />
      </div>

      <div className="container relative z-10 px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left - Flash Sale Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-full">
              <Flame className="h-5 w-5 animate-pulse" />
              <span className="font-bold text-sm uppercase tracking-wider">Flash Sale</span>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-2xl md:text-3xl font-display font-bold text-primary-foreground">
                Up to <span className="text-almans-gold">{discount}% OFF</span>
              </p>
              <p className="text-primary-foreground/80 text-sm">
                On selected premium items
              </p>
            </div>
          </motion.div>

          {/* Center - Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-1 text-primary-foreground/80 text-xs mb-2">
              <Clock className="h-3 w-3" />
              <span>Offer ends in</span>
            </div>
            <div className="flex items-center gap-2">
              <TimeBlock value={timeLeft.days} label="Days" />
              <span className="text-primary-foreground/50 text-2xl font-bold">:</span>
              <TimeBlock value={timeLeft.hours} label="Hours" />
              <span className="text-primary-foreground/50 text-2xl font-bold">:</span>
              <TimeBlock value={timeLeft.minutes} label="Mins" />
              <span className="text-primary-foreground/50 text-2xl font-bold">:</span>
              <TimeBlock value={timeLeft.seconds} label="Secs" />
            </div>
          </motion.div>

          {/* Right - CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Button
              size="lg"
              onClick={handleShopSale}
              className="bg-almans-gold hover:bg-almans-gold/90 text-almans-chocolate font-semibold group"
            >
              Shop Sale Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
