import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 1.1,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.5 },
  }),
};

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
      className="relative w-full overflow-hidden bg-primary touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[85vh] min-h-[600px] max-h-[900px]">
        {/* Background Image */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-almans-chocolate/80 via-almans-chocolate/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Large Brand Typography - Background */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <motion.span
            key={`brand-${currentSlide}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 0.1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="font-display text-[18vw] font-bold text-almans-cream tracking-wider whitespace-nowrap"
          >
            ALMANS
          </motion.span>
        </div>

        {/* Content */}
        <div className="container relative z-10 flex h-full items-center px-4 md:px-8">
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div key={`content-${currentSlide}`}>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mb-4 text-sm font-medium tracking-widest text-almans-cream/80 uppercase"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="font-display text-6xl md:text-8xl font-bold text-almans-cream mb-4"
                  style={{ textShadow: '2px 4px 20px rgba(0,0,0,0.3)' }}
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="font-display text-2xl md:text-3xl italic text-almans-tan mb-6"
                >
                  {slide.tagline}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-8 text-base text-almans-cream/90 leading-relaxed max-w-md"
                >
                  {slide.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => navigate('/shop')}
                  >
                    SHOP NOW
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-almans-cream/40 text-almans-cream hover:bg-almans-cream hover:text-almans-chocolate"
                    onClick={() => navigate('/shop')}
                  >
                    EXPLORE NEW ARRIVALS
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-almans-cream/10 backdrop-blur-sm text-almans-cream hover:bg-almans-cream/20 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-almans-cream/10 backdrop-blur-sm text-almans-cream hover:bg-almans-cream/20 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-almans-cream'
                  : 'w-2 bg-almans-cream/40 hover:bg-almans-cream/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute bottom-8 right-8 z-20 text-almans-cream/60 font-display text-sm">
          <span className="text-almans-cream font-bold">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className="mx-2">/</span>
          <span>{String(slides.length).padStart(2, '0')}</span>
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
              <motion.div
                animate={{ x: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                className="flex items-center gap-2 bg-almans-cream/90 text-almans-chocolate px-4 py-2 rounded-full shadow-lg"
              >
                <MoveHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium">Swipe to browse</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
