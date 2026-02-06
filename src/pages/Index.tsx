import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { SaleCountdownWidget } from '@/components/SaleCountdownWidget';
import { ContinueShoppingSection } from '@/components/ContinueShoppingSection';
import { AboutSection } from '@/components/AboutSection';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PageTransition, staggerContainer, staggerItem } from '@/components/PageTransition';

const Index = () => {
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    // Invalidate all queries to refresh data
    await queryClient.invalidateQueries();
    // Small delay to show the refreshing animation
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  return (
    <>
      <Helmet>
        <title>Almans - Premium Fashion Essentials | Timeless Style</title>
        <meta
          name="description"
          content="Discover Almans' premium, sustainably-made wardrobe essentials. Modern cuts, long-lasting materials. Designed for everyday comfort, built to last."
        />
        <meta name="keywords" content="fashion, clothing, sustainable fashion, premium clothes, wardrobe essentials" />
        <meta property="og:title" content="Almans - Premium Fashion Essentials" />
        <meta property="og:description" content="Where your vibes meet our vision. Premium fashion essentials for the modern individual." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://almans.com" />
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} />

      <PageTransition variant="fade">
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          <Header />
          <main>
            <Hero />
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem}>
                <SaleCountdownWidget />
              </motion.div>
              <motion.div variants={staggerItem}>
                <ContinueShoppingSection />
              </motion.div>
              <motion.div variants={staggerItem}>
                <AboutSection />
              </motion.div>
            </motion.div>
          </main>
          <Footer />
          <CartSlide />
        </div>
      </PageTransition>
    </>
  );
};

export default Index;
