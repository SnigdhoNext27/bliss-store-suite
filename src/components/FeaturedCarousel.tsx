import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCartStore } from '@/lib/store';
import { useProducts } from '@/hooks/useProducts';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductQuickView } from './ProductQuickView';

export function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { products } = useProducts();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  // Filter featured products
  const featuredProducts = products.filter(p => p.badge === 'new' || p.badge === 'limited').slice(0, 8);
  
  // Show 4 products at a time on desktop, 2 on tablet, 1 on mobile
  const itemsPerView = typeof window !== 'undefined' ? 
    (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 2 : 1) : 4;
  
  const maxIndex = Math.max(0, featuredProducts.length - itemsPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-scroll
  useEffect(() => {
    if (isPaused || featuredProducts.length <= itemsPerView) return;
    
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, featuredProducts.length, itemsPerView]);

  if (featuredProducts.length === 0) return null;

  return (
    <section 
      className="py-16 bg-gradient-to-b from-background via-secondary/20 to-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <span className="text-primary font-medium text-sm tracking-widest uppercase mb-2 block">
              Trending Now
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Featured Products
            </h2>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{ x: -currentIndex * (100 / itemsPerView + 6) + '%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: `${(featuredProducts.length / itemsPerView) * 100}%` }}
          >
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                className="group cursor-pointer"
                style={{ width: `calc(${100 / featuredProducts.length}% - 1.5rem)` }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative overflow-hidden rounded-2xl bg-card mb-4 aspect-[4/5]">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onClick={() => navigate(`/product/${product.id}`)}
                  />

                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute left-3 top-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        product.badge === 'new' ? 'bg-primary text-primary-foreground' :
                        product.badge === 'sale' ? 'bg-destructive text-destructive-foreground' :
                        'bg-almans-gold text-almans-chocolate'
                      }`}>
                        {product.badge === 'limited' ? 'Hot' : product.badge}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                        isInWishlist(product.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background/80 hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                      className="p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick Add Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addItem(product, product.sizes[1] || product.sizes[0]); 
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Quick Add
                    </Button>
                  </motion.div>
                </div>

                {/* Product Info */}
                <div onClick={() => navigate(`/product/${product.id}`)}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {product.category}
                  </p>
                  <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">৳{product.price.toFixed(0)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ৳{product.originalPrice.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(maxIndex + 1)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}