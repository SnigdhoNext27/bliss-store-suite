import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Percent, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BundleItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    sale_price: number | null;
    images: string[];
    sizes: string[];
  };
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  items: BundleItem[];
}

export function ProductBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data: bundlesData } = await supabase
        .from('product_bundles')
        .select('*')
        .eq('is_active', true);

      if (!bundlesData) return;

      const bundlesWithItems: Bundle[] = [];

      for (const bundle of bundlesData) {
        const { data: items } = await supabase
          .from('bundle_items')
          .select(`
            id,
            quantity,
            product_id
          `)
          .eq('bundle_id', bundle.id);

        if (!items) continue;

        const itemsWithProducts: BundleItem[] = [];
        for (const item of items) {
          const { data: product } = await supabase
            .from('products')
            .select('id, name, price, sale_price, images, sizes')
            .eq('id', item.product_id)
            .single();

          if (product) {
            itemsWithProducts.push({
              id: item.id,
              quantity: item.quantity,
              product: {
                ...product,
                images: product.images || [],
                sizes: product.sizes || [],
              },
            });
          }
        }

        bundlesWithItems.push({
          ...bundle,
          items: itemsWithProducts,
        });
      }

      setBundles(bundlesWithItems);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBundlePrice = (bundle: Bundle) => {
    const originalTotal = bundle.items.reduce((sum, item) => {
      const price = item.product.sale_price || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    const discountedTotal = originalTotal * (1 - bundle.discount_percentage / 100);
    return { originalTotal, discountedTotal, savings: originalTotal - discountedTotal };
  };

  const handleAddBundle = (bundle: Bundle) => {
    bundle.items.forEach((item) => {
      const price = item.product.sale_price || item.product.price;
      const productForCart = {
        id: item.product.id,
        name: item.product.name,
        price,
        category: 'Bundle',
        description: '',
        images: item.product.images || [],
        sizes: item.product.sizes || [],
        stock: 99,
      };
      addItem(productForCart, item.product.sizes[0] || 'One Size', item.quantity);
    });

    toast({
      title: 'Bundle added to cart!',
      description: `${bundle.name} has been added to your bag.`,
    });
    openCart();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container px-4">
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold">Bundle & Save</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle, index) => {
            const { originalTotal, discountedTotal, savings } = calculateBundlePrice(bundle);

            return (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden h-full flex flex-col">
                  <div className="bg-gradient-to-br from-primary/20 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{bundle.name}</h3>
                      <Badge className="bg-destructive text-destructive-foreground gap-1">
                        <Percent className="h-3 w-3" />
                        {bundle.discount_percentage}% OFF
                      </Badge>
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                    )}
                  </div>

                  <CardContent className="flex-1 flex flex-col p-4">
                    {/* Bundle Items */}
                    <div className="space-y-3 flex-1">
                      {bundle.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <img
                              src={item.product.images[0] || '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">
                            ৳{(item.product.sale_price || item.product.price) * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="border-t border-border pt-4 mt-4 space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Original Price</span>
                        <span className="line-through">৳{originalTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-500">
                        <span>You Save</span>
                        <span>-৳{savings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Bundle Price</span>
                        <span className="text-primary">৳{discountedTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4 gap-2"
                      onClick={() => handleAddBundle(bundle)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add Bundle to Cart
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
