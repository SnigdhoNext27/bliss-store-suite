import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { haptics } from '@/lib/haptics';
import { usePerformance } from '@/hooks/usePerformance';
import heroImage1 from '@/assets/hero-1.jpg';
import heroImage2 from '@/assets/hero-2.jpg';
import heroImage3 from '@/assets/hero-3.jpg';
import heroImage4 from '@/assets/hero-4.jpg';

const defaultSlides = [
  {
    id: 1,
    image: heroImage1,
    subtitle: 'Thoughtful Fashion',
    title: 'ALMANS',
    description: 'Almans crafts premium, sustainably-made wardrobe essentials that blend modern cuts with long-lasting materials.',
  },
  {
    id: 2,
    image: heroImage2,
    subtitle: 'New Collection',
    title: 'ALMANS',
    description: 'Discover our latest collection of premium casual wear designed for the modern gentleman.',
  },
  {
    id: 3,
    image: heroImage3,
    subtitle: 'Premium Quality',
    title: 'ALMANS',
    description: 'Every piece is made with the finest materials, ensuring comfort and durability that lasts.',
  },
  {
    id: 4,
    image: heroImage4,
    subtitle: 'Urban Style',
    title: 'ALMANS',
    description: 'Contemporary streetwear meets timeless elegance for the fashion-forward individual.',
  },
];

// Slide variants - will be simplified for low-end devices
const getSlideVariants = (isLowEnd: boolean) => ({
  enter: (direction: number) => ({
    x: isLowEnd ? 0 : (direction > 0 ? 300 : -300),
    opacity: 0,
    scale: isLowEnd ? 1 : 1.1,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: isLowEnd ? 0.2 : 0.8, ease: "easeOut" as const },
  },
  exit: (direction: number) => ({
    x: isLowEnd ? 0 : (direction < 0 ? 300 : -300),
    opacity: 0,
    scale: isLowEnd ? 1 : 0.95,
    transition: { duration: isLowEnd ? 0.15 : 0.5 },
  }),
});

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [hasSwiped, setHasSwiped] = useState(false);
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const { shouldReduceAnimations, enableParallax, enableDecorations } = usePerformance();
  
  // Get optimized slide variants based on device capability
  const slideVariants = getSlideVariants(shouldReduceAnimations);
  
  // Parallax scroll setup - disabled on low-end devices
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  // Parallax transforms - use static values on low-end devices
  const backgroundY = useTransform(scrollYProgress, [0, 1], enableParallax ? ['0%', '30%'] : ['0%', '0%']);
  const contentY = useTransform(scrollYProgress, [0, 1], enableParallax ? ['0%', '15%'] : ['0%', '0%']);
  const brandTextY = useTransform(scrollYProgress, [0, 1], enableParallax ? ['0%', '40%'] : ['0%', '0%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [1, enableParallax ? 0.3 : 1]);
  const scale = useTransform(scrollYProgress, [0, 1], enableParallax ? [1, 1.1] : [1, 1]);

  // Create slides with dynamic tagline
  const slides = defaultSlides.map((slide, index) => ({
    ...slide,
    tagline: index === 0 ? settings.tagline : 
             index === 1 ? 'Autumn Essentials' :
             index === 2 ? 'Crafted with Care' : 'Street Ready',
  }));

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Touch/swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe) {
      haptics.light();
      setHasSwiped(true);
      setShowSwipeHint(false);
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Hide swipe hint after 4 seconds or after first swipe
  useEffect(() => {
    if (hasSwiped) return;
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, [hasSwiped]);

  const slide = slides[currentSlide];

  return (
    <section 
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-primary touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[85vh] min-h-[600px] max-h-[900px]">
        {/* Background Image with Parallax */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
            style={{ y: backgroundY, scale }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover object-center"
            />
            {/* Futuristic gradient overlay with parallax opacity */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-almans-chocolate/90 via-almans-chocolate/50 to-transparent"
              style={{ opacity: overlayOpacity }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-almans-chocolate/60 via-transparent to-almans-chocolate/20" />
          </motion.div>
        </AnimatePresence>

        {/* Animated geometric elements - Disabled on low-end devices */}
        {enableDecorations && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Floating particles - reduced count */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-almans-gold/40 rounded-full"
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${20 + (i % 2) * 30}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
            
            {/* Scan line effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-almans-cream/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Geometric accent lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
              <motion.line
                x1="0%" y1="30%" x2="40%" y2="30%"
                stroke="hsl(38 60% 55%)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: 0.5 }}
              />
              <motion.line
                x1="0%" y1="70%" x2="35%" y2="70%"
                stroke="hsl(38 60% 55%)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: 0.8 }}
              />
            </svg>
          </div>
        )}

        {/* Large Brand Typography - Background with Parallax */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{ y: brandTextY }}
        >
          <motion.span
            key={`brand-${currentSlide}`}
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 0.08, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="font-display text-[18vw] font-bold text-almans-cream tracking-wider whitespace-nowrap select-none"
          >
            ALMANS
          </motion.span>
        </motion.div>

        {/* Content with Parallax */}
        <motion.div 
          className="container relative z-10 flex h-full items-center px-4 md:px-8"
          style={{ y: contentY }}
        >
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div key={`content-${currentSlide}`}>
                {/* Futuristic badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-almans-cream/10 backdrop-blur-md border border-almans-cream/20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-almans-gold" />
                  </motion.div>
                  <span className="text-sm font-medium tracking-widest text-almans-cream/90 uppercase">
                    {slide.subtitle}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-display text-6xl md:text-8xl font-bold text-almans-cream mb-4"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4), 0 0 60px rgba(191, 149, 90, 0.2)' }}
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="font-display text-2xl md:text-3xl italic text-almans-gold mb-6"
                  style={{ textShadow: '0 2px 20px rgba(191, 149, 90, 0.3)' }}
                >
                  {slide.tagline}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-10 text-base text-almans-cream/85 leading-relaxed max-w-md"
                >
                  {slide.description}
                </motion.p>

                {/* Buttons with glowing Shop Now */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-wrap gap-4 items-center"
                >
                  {/* GLOWING SHOP NOW BUTTON */}
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Outer glow layers */}
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-primary via-almans-gold to-primary rounded-lg opacity-75 blur-lg"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="absolute -inset-0.5 bg-gradient-to-r from-almans-gold via-primary to-almans-gold rounded-lg opacity-60 blur-md"
                      animate={{
                        opacity: [0.4, 0.7, 0.4],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.5,
                      }}
                    />
                    
                    <Button
                      size="lg"
                      className="relative bg-gradient-to-r from-primary via-almans-brown to-primary hover:from-almans-brown hover:via-primary hover:to-almans-brown text-primary-foreground font-semibold text-base px-8 py-6 rounded-lg shadow-2xl transition-all duration-300 group overflow-hidden"
                      onClick={() => navigate('/shop')}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      />
                      
                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        SHOP NOW
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      </span>
                    </Button>
                  </motion.div>

                  <Button
                    variant="outline"
                    size="lg"
                    className="border-almans-cream/30 text-almans-cream hover:bg-almans-cream/10 hover:border-almans-cream/50 backdrop-blur-sm transition-all duration-300"
                    onClick={() => navigate('/shop')}
                  >
                    EXPLORE COLLECTION
                  </Button>
                </motion.div>

                {/* Scroll indicator - clickable */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="hidden md:flex items-center gap-3 mt-16 text-almans-cream/50 hover:text-almans-cream/80 transition-colors cursor-pointer group"
                  onClick={() => {
                    const nextSection = document.getElementById('about-section');
                    if (nextSection) {
                      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  aria-label="Scroll to next section"
                >
                  <motion.div
                    className="w-6 h-10 rounded-full border border-almans-cream/30 group-hover:border-almans-cream/50 flex justify-center p-2 transition-colors"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      className="w-1 h-2 bg-almans-cream/60 group-hover:bg-almans-cream rounded-full transition-colors"
                      animate={{ y: [0, 12, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                  <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Navigation Arrows - Enhanced */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-almans-cream/5 backdrop-blur-md border border-almans-cream/20 text-almans-cream hover:bg-almans-cream/15 hover:border-almans-cream/40 transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-almans-cream/5 backdrop-blur-md border border-almans-cream/20 text-almans-cream hover:bg-almans-cream/15 hover:border-almans-cream/40 transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators - Enhanced */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="relative group"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? 'w-10 bg-almans-gold'
                  : 'w-3 bg-almans-cream/30 group-hover:bg-almans-cream/50'
              }`} />
              {index === currentSlide && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 h-1 rounded-full bg-almans-gold shadow-[0_0_10px_hsl(38_60%_55%)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Slide Counter - Enhanced */}
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2 text-almans-cream/60 font-display text-sm">
          <span className="text-2xl font-bold text-almans-cream">{String(currentSlide + 1).padStart(2, '0')}</span>
          <div className="w-8 h-px bg-almans-cream/40" />
          <span className="text-sm">{String(slides.length).padStart(2, '0')}</span>
        </div>

        {/* Mobile Swipe Hint */}
        <AnimatePresence>
          {showSwipeHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center pointer-events-none md:hidden"
            >
              <div className="flex items-center gap-2 bg-almans-cream/90 text-almans-chocolate px-4 py-2 rounded-full shadow-lg">
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Swipe to browse</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
