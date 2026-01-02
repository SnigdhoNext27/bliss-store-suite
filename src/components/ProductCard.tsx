import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, Heart, GitCompare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCartStore } from '@/lib/store';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductComparison } from '@/hooks/useProductComparison';
import { useToast } from '@/hooks/use-toast';
import { SaleCountdown } from '@/components/SaleCountdown';
import { useCurrency } from '@/hooks/useCurrency';
import { usePerformance } from '@/hooks/usePerformance';
import { OptimizedImage } from '@/components/OptimizedImage';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[1] || product.sizes?.[0] || '');
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addProduct, isInComparison, removeProduct } = useProductComparison();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { format } = useCurrency();
  const { shouldReduceAnimations, animationDuration, enableHoverEffects } = usePerformance();

  const inWishlist = isInWishlist(product.id);
  const inComparison = isInComparison(product.id);

  const handleAddToBag = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, selectedSize);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleToggleComparison = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inComparison) {
      removeProduct(product.id);
      toast({
        title: 'Removed from comparison',
        description: `${product.name} has been removed.`,
      });
    } else {
      const comparisonProduct = {
        ...product,
        description: product.description || '',
      };
      const added = addProduct(comparisonProduct as any);
      if (added) {
        toast({
          title: 'Added to comparison',
          description: `${product.name} has been added. Select up to 4 products.`,
        });
      } else {
        toast({
          title: 'Comparison limit reached',
          description: 'You can compare up to 4 products at a time.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  // Optimized animation variants for low-end devices
  const cardAnimation = shouldReduceAnimations
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0 };
  
  const cardInitial = shouldReduceAnimations
    ? { opacity: 0.8, y: 0 }
    : { opacity: 0, y: 30 };

  return (
    <motion.div
      initial={cardInitial}
      animate={cardAnimation}
      transition={{ 
        duration: shouldReduceAnimations ? 0.1 : 0.4, 
        delay: shouldReduceAnimations ? 0 : Math.min(index * 0.03, 0.2) 
      }}
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container - Enhanced with better shadows and transitions */}
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b from-card to-muted/30 shadow-sm hover:shadow-elevated transition-shadow duration-500">
        {/* Optimized image with lazy loading and responsive sizing */}
        {shouldReduceAnimations ? (
          <OptimizedImage
            src={product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full"
            preset="productCard"
            priority={index < 4}
          />
        ) : (
          <motion.div
            className="h-full w-full"
            animate={{ scale: isHovered && enableHoverEffects ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <OptimizedImage
              src={product.images?.[0] || '/placeholder.svg'}
              alt={product.name}
              className="h-full w-full"
              preset="productCard"
              priority={index < 4}
            />
          </motion.div>
        )}

        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Badge - Enhanced styling */}
        {product.badge && (
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-sm ${
                product.badge === 'new'
                  ? 'bg-primary/95 text-primary-foreground'
                  : product.badge === 'sale'
                  ? 'bg-destructive/95 text-destructive-foreground'
                  : 'bg-almans-gold/95 text-almans-chocolate'
              }`}
            >
              {product.badge === 'new' && <Sparkles className="w-3 h-3" />}
              {product.badge === 'limited' ? 'Low Stock' : product.badge}
            </motion.span>
            {product.badge === 'sale' && !shouldReduceAnimations && (
              <SaleCountdown compact className="bg-background/95 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-md" />
            )}
          </div>
        )}

        {/* Action Buttons - Enhanced with better visibility */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <motion.button
            onClick={handleToggleWishlist}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
              inWishlist 
                ? 'bg-primary text-primary-foreground scale-110' 
                : 'bg-background/95 text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110'
            }`}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: inWishlist || isHovered || shouldReduceAnimations ? 1 : 0, x: 0 }}
            transition={{ duration: 0.2 }}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-5 w-5 transition-transform ${inWishlist ? 'fill-current scale-110' : ''}`} />
          </motion.button>

          <motion.button
            onClick={handleToggleComparison}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
              inComparison 
                ? 'bg-almans-gold text-almans-chocolate scale-110' 
                : 'bg-background/95 text-foreground hover:bg-almans-gold hover:text-almans-chocolate hover:scale-110'
            }`}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: inComparison || isHovered || shouldReduceAnimations ? 1 : 0, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompare className="h-5 w-5" />
          </motion.button>

          <motion.button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110"
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered || shouldReduceAnimations ? 1 : 0, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            aria-label="Quick view"
          >
            <Eye className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Size Selector on Hover - Enhanced mobile touch */}
        {product.sizes && product.sizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered || shouldReduceAnimations ? 1 : 0, y: isHovered || shouldReduceAnimations ? 0 : 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 left-3 right-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center gap-2 rounded-xl bg-background/95 p-3 backdrop-blur-md shadow-lg">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedSize === size
                      ? 'bg-primary text-primary-foreground shadow-md scale-110'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:scale-105'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Product Info - Enhanced typography */}
      <div className="space-y-2.5 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
          {product.category}
        </p>
        <h3 className="font-display text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-primary">
            {format(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {format(product.originalPrice)}
            </span>
          )}
          {product.originalPrice && (
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Action Button - Enhanced with gradient */}
        <div className="pt-3">
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300"
            onClick={handleAddToBag}
          >
            <ShoppingBag className="h-4 w-4" />
            ADD TO BAG
          </Button>
        </div>
      </div>
    </motion.div>
  );
});
