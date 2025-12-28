import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/lib/store';

export function RecentlyViewedProducts() {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  const { data: products, isLoading } = useQuery({
    queryKey: ['recently-viewed-products', recentlyViewed],
    queryFn: async () => {
      if (!recentlyViewed.length) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', recentlyViewed)
        .eq('is_active', true);

      if (error) throw error;

      // Sort by the order in recentlyViewed array and transform to Product type
      const productMap = new Map(data.map((p) => [p.id, p]));
      return recentlyViewed
        .map((id) => {
          const p = productMap.get(id);
          if (!p) return null;
          return {
            id: p.id,
            name: p.name,
            price: p.price,
            originalPrice: p.sale_price ? p.price : undefined,
            category: p.category_id || '',
            description: p.description || '',
            images: p.images || ['/placeholder.svg'],
            sizes: p.sizes || [],
            stock: p.stock || 0,
            badge: p.is_new ? 'new' as const : p.sale_price ? 'sale' as const : undefined,
          } as Product;
        })
        .filter(Boolean) as Product[];
    },
    enabled: recentlyViewed.length > 0,
  });

  if (!recentlyViewed.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Recently Viewed
              </h2>
              <p className="text-sm text-muted-foreground">Products you've browsed</p>
            </div>
          </motion.div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentlyViewed}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product, i) => (
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
        ) : null}
      </div>
    </section>
  );
}
