import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Tag, Clock, ArrowRight, Percent } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Link } from 'react-router-dom';

export default function Sales() {
  const { products, loading } = useProducts();
  const { settings } = useSiteSettings();

  // Filter only sale products
  const saleProducts = useMemo(() => {
    return products.filter(p => p.badge === 'sale' || p.originalPrice);
  }, [products]);

  // Group by discount percentage
  const groupedByDiscount = useMemo(() => {
    const groups: Record<string, typeof saleProducts> = {
      '70+': [],
      '50-69': [],
      '30-49': [],
      'under30': [],
    };

    saleProducts.forEach(product => {
      if (product.originalPrice) {
        const discount = Math.round((1 - product.price / product.originalPrice) * 100);
        if (discount >= 70) groups['70+'].push(product);
        else if (discount >= 50) groups['50-69'].push(product);
        else if (discount >= 30) groups['30-49'].push(product);
        else groups['under30'].push(product);
      }
    });

    return groups;
  }, [saleProducts]);

  const discountBadges = [
    { key: '70+', label: '70%+ Off', color: 'bg-red-500', icon: Flame },
    { key: '50-69', label: '50-69% Off', color: 'bg-orange-500', icon: Sparkles },
    { key: '30-49', label: '30-49% Off', color: 'bg-yellow-500', icon: Tag },
    { key: 'under30', label: 'Up to 30% Off', color: 'bg-green-500', icon: Percent },
  ];

  return (
    <>
      <Helmet>
        <title>Sales & Deals - Almans | Up to 70% Off Premium Fashion</title>
        <meta
          name="description"
          content="Shop our biggest sale of the season! Get up to 70% off on premium fashion items. Limited time offers on shirts, pants, accessories and more."
        />
        <meta name="keywords" content="sale, deals, discount, fashion sale, almans sale, cheap clothes, bargain" />
        <meta property="og:title" content="Sales & Deals - Almans Fashion" />
        <meta property="og:description" content="Up to 70% off on premium fashion. Shop now!" />
        <link rel="canonical" href="https://almans.com/sales" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <CartSlide />

        <main>
          {/* Hero Section */}
          <section className="relative py-16 md:py-24 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-background to-orange-500/10">
              <motion.div
                className="absolute top-10 left-[10%] w-72 h-72 bg-red-500/10 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-10 right-[10%] w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
            </div>

            <div className="container px-4 md:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-4xl mx-auto"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-full mb-6"
                >
                  <Flame className="h-5 w-5 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider">Mega Sale Event</span>
                  <Flame className="h-5 w-5 animate-pulse" />
                </motion.div>

                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6">
                  Up to{' '}
                  <span className="bg-gradient-to-r from-destructive via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                    70% OFF
                  </span>
                </h1>

                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
                  Don't miss out on our biggest sale of the season. Premium fashion at unbeatable prices.
                  Limited stock available!
                </p>

                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {discountBadges.map((badge, i) => (
                    <motion.div
                      key={badge.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <Badge
                        className={`${badge.color} text-white px-4 py-2 text-sm flex items-center gap-2`}
                      >
                        <badge.icon className="h-4 w-4" />
                        {badge.label}
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                          {groupedByDiscount[badge.key].length}
                        </span>
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 text-muted-foreground"
                >
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Sale ends soon - Shop now before it's too late!</span>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Flash Sale Banner */}
          <PromotionalBanner />

          {/* Sale Products */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-8">
              {loading ? (
                <ProductGridSkeleton count={8} />
              ) : saleProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <Tag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    No Active Sales
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Check back soon for amazing deals on our premium collection!
                  </p>
                  <Button asChild>
                    <Link to="/shop">
                      Browse All Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* 70%+ Off Section */}
                  {groupedByDiscount['70+'].length > 0 && (
                    <SaleSection
                      title="Massive Savings - 70%+ Off"
                      subtitle="Our biggest discounts ever"
                      products={groupedByDiscount['70+']}
                      color="from-red-500/20 to-red-600/10"
                      badge="🔥 Hot Deal"
                    />
                  )}

                  {/* 50-69% Off Section */}
                  {groupedByDiscount['50-69'].length > 0 && (
                    <SaleSection
                      title="Half Price & More - 50%+ Off"
                      subtitle="Premium quality at half the price"
                      products={groupedByDiscount['50-69']}
                      color="from-orange-500/20 to-orange-600/10"
                      badge="⚡ Best Value"
                    />
                  )}

                  {/* 30-49% Off Section */}
                  {groupedByDiscount['30-49'].length > 0 && (
                    <SaleSection
                      title="Great Deals - 30%+ Off"
                      subtitle="Quality savings on popular items"
                      products={groupedByDiscount['30-49']}
                      color="from-yellow-500/20 to-yellow-600/10"
                      badge="💫 Popular"
                    />
                  )}

                  {/* Under 30% Off Section */}
                  {groupedByDiscount['under30'].length > 0 && (
                    <SaleSection
                      title="Special Offers"
                      subtitle="Every little saving counts"
                      products={groupedByDiscount['under30']}
                      color="from-green-500/20 to-green-600/10"
                      badge="✨ Sale"
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-r from-destructive/10 via-background to-orange-500/10">
            <div className="container px-4 md:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Can't Find What You're Looking For?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Browse our complete collection for more amazing products at regular prices.
                </p>
                <Button size="lg" asChild>
                  <Link to="/shop">
                    View All Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

// Sale Section Component
function SaleSection({
  title,
  subtitle,
  products,
  color,
  badge,
}: {
  title: string;
  subtitle: string;
  products: ReturnType<typeof useProducts>['products'];
  color: string;
  badge: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-16"
    >
      <div className={`bg-gradient-to-r ${color} rounded-2xl p-6 md:p-8 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{badge}</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {title}
              </h2>
            </div>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </motion.div>
  );
}
