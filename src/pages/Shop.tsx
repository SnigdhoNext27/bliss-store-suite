import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { ShopCategoriesGrid } from '@/components/ShopCategoriesGrid';
import { ProductsSection } from '@/components/ProductsSection';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';

const Shop = () => {
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

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Shop By Category Section with Warm Design */}
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
