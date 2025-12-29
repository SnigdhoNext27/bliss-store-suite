import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';
import { OptimizedImage } from './OptimizedImage';
import aboutImage from '@/assets/about-lifestyle.jpg';

export const AboutSection = memo(function AboutSection() {
  const { shouldReduceAnimations } = usePerformance();
  
  const Wrapper = shouldReduceAnimations ? 'div' : motion.div;
  const imageProps = shouldReduceAnimations ? {} : {
    initial: { opacity: 0, x: -30 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };
  const contentProps = shouldReduceAnimations ? {} : {
    initial: { opacity: 0, x: 30 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay: 0.2 },
  };

  return (
    <section id="about-section" className="py-20 bg-card">
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Image Gallery */}
          <Wrapper {...imageProps} className="relative">
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <OptimizedImage
                src={aboutImage}
                alt="About Almans"
                className="h-full w-full"
                preset="hero"
              />
              {/* Decorative dots - hidden on low-end */}
              {!shouldReduceAnimations && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i === 0 ? 'bg-primary' : 'bg-primary/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail previews - hidden on low-end */}
            {!shouldReduceAnimations && (
              <div className="absolute -right-4 bottom-8 flex flex-col gap-2 md:flex-row md:bottom-4 md:right-4">
                {[aboutImage, aboutImage].map((img, i) => (
                  <div
                    key={i}
                    className="h-16 w-16 overflow-hidden rounded-lg border-2 border-background shadow-medium"
                  >
                    <OptimizedImage
                      src={img}
                      alt=""
                      className="h-full w-full"
                      preset="thumbnail"
                    />
                  </div>
                ))}
              </div>
            )}
          </Wrapper>

          {/* Content */}
          <Wrapper {...contentProps} className="lg:pl-8">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Almans
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Almans is a contemporary clothing brand dedicated to timeless style, and
              sustainable practice. We believe in creating pieces that transcend seasons
              and trends.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Every garment is crafted with attention to detail, using premium fabrics
              that feel as good as they look. Our commitment to quality means your
              wardrobe essentials will last for years to come.
            </p>

            <a
              href="#"
              className="inline-flex items-center gap-2 text-primary font-medium hover:gap-4 transition-all duration-300"
            >
              Explore
              <ArrowRight className="h-5 w-5" />
            </a>
          </Wrapper>
        </div>
      </div>
    </section>
  );
});
