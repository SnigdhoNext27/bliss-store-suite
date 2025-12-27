import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-1.jpg';

const slides = [
  {
    id: 1,
    image: heroImage,
    subtitle: 'Thoughtful Fashion',
    title: 'ALMANS',
    tagline: 'Timeless Style 2025',
    description: 'Almans crafts premium, sustainably-made wardrobe essentials that blend modern cuts with long-lasting materials. Designed for everyday comfort, built to last.',
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full overflow-hidden bg-primary">
      <div className="relative h-[85vh] min-h-[600px] max-h-[900px]">
        {/* Background Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt="Hero"
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-almans-chocolate/80 via-almans-chocolate/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Large Brand Typography - Background */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <motion.span
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 0.15, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="font-display text-[20vw] font-bold text-almans-cream tracking-wider whitespace-nowrap"
            style={{ letterSpacing: '0.1em' }}
          >
            ALMANS
          </motion.span>
        </div>

        {/* Content */}
        <div className="container relative z-10 flex h-full items-center px-4 md:px-8">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 text-sm font-medium tracking-widest text-almans-cream/80 uppercase"
            >
              {slide.subtitle}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-6xl md:text-8xl font-bold text-almans-cream mb-4"
              style={{ textShadow: '2px 4px 20px rgba(0,0,0,0.3)' }}
            >
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-2xl md:text-3xl italic text-almans-tan mb-6"
            >
              {slide.tagline}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8 text-base text-almans-cream/90 leading-relaxed max-w-md"
            >
              {slide.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                variant="outline"
                size="xl"
                className="border-almans-cream/40 text-almans-cream hover:bg-almans-cream hover:text-almans-chocolate"
                onClick={() => {
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Shop New Arrivals
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-almans-cream'
                    : 'w-2 bg-almans-cream/40 hover:bg-almans-cream/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
