import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, Star, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { ShopCategoriesGrid } from '@/components/ShopCategoriesGrid';
import { ProductsSection } from '@/components/ProductsSection';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { CollectionSection } from '@/components/CollectionSection';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Shop = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  const seasonBadges = [
    { icon: Sparkles, label: 'All Seasons', color: 'bg-primary/10 text-primary' },
    { icon: Zap, label: 'Trending', color: 'bg-almans-gold/20 text-almans-gold' },
    { icon: Star, label: 'Best Sellers', color: 'bg-accent text-foreground' },
  ];

  return (
    <>
      <Helmet>
        <title>Shop - Almans | Premium Fashion Collection 2026</title>
        <meta
          name="description"
          content="Browse Almans' complete collection of premium fashion essentials. Find your perfect style from our curated selection for all seasons."
        />
        <meta name="keywords" content="shop, fashion, clothing, premium clothes, almans collection, 2026 fashion" />
        <meta property="og:title" content="Shop - Almans Fashion" />
        <meta property="og:description" content="Discover our complete collection of premium fashion essentials." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://almans.com/shop" />
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Futuristic Shop Hero */}
          <section className="relative py-20 md:py-32 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent/20">
              {/* Floating orbs */}
              <motion.div
                className="absolute top-20 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
                animate={{
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute bottom-20 right-[15%] w-96 h-96 bg-almans-gold/10 rounded-full blur-3xl"
                animate={{
                  y: [0, -40, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }} />
            </div>

            <div className="container px-4 md:px-8 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                {/* Season badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-wrap justify-center gap-3 mb-8"
                >
                  {seasonBadges.map((badge, i) => (
                    <motion.div
                      key={badge.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${badge.color} backdrop-blur-sm border border-border/50`}
                    >
                      <badge.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{badge.label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Main heading */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6">
                    <span className="block">Discover</span>
                    <span className="bg-gradient-to-r from-primary via-almans-gold to-primary bg-clip-text text-transparent">
                      Your Style
                    </span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                  Premium fashion essentials crafted for comfort and elegance. 
                  Designed for all seasons, built for the future.
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <Button
                    size="lg"
                    className="gap-2 px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all"
                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Explore Collection
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 px-8 py-6 text-base rounded-full border-2 hover:bg-muted/50"
                    onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Browse Categories
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-border/50"
                >
                  {[
                    { value: '500+', label: 'Products' },
                    { value: '50K+', label: 'Happy Customers' },
                    { value: '4.9', label: 'Rating' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="font-display text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
              >
                <motion.div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
              </motion.div>
            </motion.div>
          </section>

          {/* Flash Sale Banner */}
          <PromotionalBanner />
          
          {/* Featured Products Carousel */}
          <FeaturedCarousel />
          
          {/* Shop By Category Section */}
          <div id="categories">
            <ShopCategoriesGrid />
          </div>
          
          {/* All Products Section */}
          <div id="products">
            <ProductsSection />
          </div>
          
          {/* Collection Section */}
          <CollectionSection />
        </main>
        <Footer />
        <CartSlide />
      </div>
    </>
  );
};

export default Shop;
