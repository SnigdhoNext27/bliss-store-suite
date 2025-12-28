import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ShopCategoriesGrid } from '@/components/ShopCategoriesGrid';
import { ProductsSection } from '@/components/ProductsSection';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { PullToRefresh } from '@/components/PullToRefresh';
import { motion } from 'framer-motion';

const Shop = () => {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  return (
    <>
      <Helmet>
        <title>Shop - Almans | Premium Fashion Collection</title>
        <meta
          name="description"
          content="Browse Almans' complete collection of premium fashion essentials. Find your perfect style from our curated selection."
        />
        <meta name="keywords" content="shop, fashion, clothing, premium clothes, almans collection" />
        <meta property="og:title" content="Shop - Almans Fashion" />
        <meta property="og:description" content="Discover our complete collection of premium fashion essentials." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://almans.com/shop" />
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Shop Hero */}
          <section className="relative py-16 md:py-24 bg-gradient-to-b from-secondary/50 via-accent/20 to-background overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
            </div>
            <div className="container px-4 md:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto"
              >
                <span className="text-primary font-medium text-sm tracking-widest uppercase mb-4 block">
                  Premium Collection
                </span>
                <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
                  Explore Our Shop
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Discover premium fashion essentials crafted for comfort and style. 
                  Browse by category or explore our entire collection.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Flash Sale Banner */}
          <PromotionalBanner />
          
          {/* Featured Products Carousel */}
          <FeaturedCarousel />
          
          {/* Shop By Category Section */}
          <ShopCategoriesGrid />
          
          {/* All Products Section */}
          <ProductsSection />
        </main>
        <Footer />
        <CartSlide />
      </div>
    </>
  );
};

export default Shop;
