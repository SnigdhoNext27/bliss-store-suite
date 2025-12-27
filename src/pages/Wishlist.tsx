import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartStore } from '@/lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  images: string[];
  sizes: string[];
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, sale_price, images, sizes')
          .in('id', wishlistIds);

        if (error) throw error;
        setProducts((data || []) as Product[]);
      } catch (error) {
        console.error('Fetch wishlist products error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [wishlistIds]);

  const handleAddToCart = (product: Product) => {
    const size = product.sizes?.[0] || 'M';
    addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      originalPrice: product.sale_price ? product.price : undefined,
      images: product.images || [],
      sizes: product.sizes || ['S', 'M', 'L'],
      category: 'Wishlist',
      description: '',
      stock: 10,
    }, size);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Wishlist | Almans</title>
      </Helmet>

      <div className="min-h-screen bg-background py-12">
        <div className="container px-4">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl font-bold">My Wishlist</h1>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="font-display text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Browse our collection and save your favorites!</p>
              <Button onClick={() => navigate('/')}>Continue Shopping</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl overflow-hidden border border-border"
                >
                  <div 
                    className="aspect-[4/5] bg-secondary cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 
                      className="font-medium mb-2 cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-bold text-primary">
                        ৳{(product.sale_price || product.price).toLocaleString()}
                      </span>
                      {product.sale_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ৳{product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Add to Bag
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromWishlist(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
