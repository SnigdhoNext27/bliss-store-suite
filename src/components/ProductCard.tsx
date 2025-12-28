import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, Heart, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCartStore } from '@/lib/store';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductComparison } from '@/hooks/useProductComparison';
import { useToast } from '@/hooks/use-toast';
import { SaleCountdown } from '@/components/SaleCountdown';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[1] || product.sizes?.[0] || '');
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addProduct, isInComparison, removeProduct } = useProductComparison();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { format } = useCurrency();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-card shadow-sm">
        <motion.img
          src={product.images?.[0] || '/placeholder.svg'}
          alt={product.name}
          className="h-full w-full object-cover object-center"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Badge */}
        {product.badge && (
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                product.badge === 'new'
                  ? 'bg-primary text-primary-foreground'
                  : product.badge === 'sale'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-almans-gold text-almans-chocolate'
              }`}
            >
              {product.badge === 'limited' ? 'Low Stock' : product.badge}
            </span>
            {product.badge === 'sale' && (
              <SaleCountdown compact className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-1" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered || inWishlist ? 1 : 0, x: isHovered || inWishlist ? 0 : 10 }}
            onClick={handleToggleWishlist}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-medium backdrop-blur-sm transition-colors ${
              inWishlist 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground'
            }`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered || inComparison ? 1 : 0, x: isHovered || inComparison ? 0 : 10 }}
            transition={{ delay: 0.05 }}
            onClick={handleToggleComparison}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-medium backdrop-blur-sm transition-colors ${
              inComparison 
                ? 'bg-almans-gold text-almans-chocolate' 
                : 'bg-background/90 text-foreground hover:bg-almans-gold hover:text-almans-chocolate'
            }`}
            aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompare className="h-5 w-5" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
            transition={{ delay: 0.1 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-medium backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Quick view"
          >
            <Eye className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Size Selector on Hover */}
        {product.sizes && product.sizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-3 left-3 right-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center gap-2 rounded-lg bg-background/90 p-2 backdrop-blur-sm">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    selectedSize === size
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.category}
        </p>
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {format(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {format(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2"
            onClick={handleAddToBag}
          >
            <ShoppingBag className="h-4 w-4" />
            ADD TO BAG
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
