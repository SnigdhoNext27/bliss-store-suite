import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/store';

export function ContinueShoppingSection() {
  const { recentlyViewed } = useRecentlyViewed();

  // First, get the categories of recently viewed products
  const { data: viewedProducts } = useQuery({
    queryKey: ['viewed-products-categories', recentlyViewed],
    queryFn: async () => {
      if (!recentlyViewed.length) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, category_id')
        .in('id', recentlyViewed)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: recentlyViewed.length > 0,
  });

  // Get unique category IDs from viewed products
  const categoryIds = [...new Set(viewedProducts?.map(p => p.category_id).filter(Boolean) || [])];

  // Fetch recommended products from the same categories (excluding already viewed)
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['product-recommendations', categoryIds, recentlyViewed],
    queryFn: async () => {
      if (!categoryIds.length) {
        // Fallback: show featured or new products if no browsing history
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .or('is_featured.eq.true,is_new.eq.true')
          .limit(8);

        if (error) throw error;
        return transformProducts(data || []);
      }

      // Get products from same categories, excluding already viewed
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .not('id', 'in', `(${recentlyViewed.join(',')})`)
        .limit(8);

      if (error) throw error;

      // If not enough products, supplement with other featured products
      if ((data?.length || 0) < 4) {
        const { data: moreProducts } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .or('is_featured.eq.true,is_new.eq.true')
          .not('id', 'in', `(${[...recentlyViewed, ...(data?.map(p => p.id) || [])].join(',')})`)
          .limit(8 - (data?.length || 0));

        return transformProducts([...(data || []), ...(moreProducts || [])]);
      }

      return transformProducts(data || []);
    },
    enabled: categoryIds.length > 0 || recentlyViewed.length === 0,
  });

  function transformProducts(products: any[]): Product[] {
    return products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.sale_price || p.price,
      originalPrice: p.sale_price ? p.price : undefined,
      category: p.category_id || '',
      description: p.description || '',
      images: p.images || ['/placeholder.svg'],
      sizes: p.sizes || [],
      stock: p.stock || 0,
      badge: p.is_new ? 'new' as const : p.sale_price ? 'sale' as const : undefined,
    }));
  }

  // Don't show if no recommendations
  if (!isLoading && (!recommendations || recommendations.length === 0)) {
    return null;
  }

  const sectionTitle = recentlyViewed.length > 0 
    ? "Continue Shopping" 
    : "Recommended For You";

  const sectionSubtitle = recentlyViewed.length > 0
    ? "Based on your browsing history"
    : "Discover our featured collection";

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {sectionTitle}
              </h2>
              <p className="text-sm text-muted-foreground">{sectionSubtitle}</p>
            </div>
          </motion.div>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-muted-foreground hover:text-primary"
          >
            <Link to="/shop">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recommendations?.slice(0, 8).map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <ProductCard product={product} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
