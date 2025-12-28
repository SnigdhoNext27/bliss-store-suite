import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { AboutSection } from '@/components/AboutSection';
import { CollectionSection } from '@/components/CollectionSection';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';

const Index = () => {
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

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <AboutSection />
          <CollectionSection />
        </main>
        <Footer />
        <CartSlide />
      </div>
    </>
  );
};

export default Index;
