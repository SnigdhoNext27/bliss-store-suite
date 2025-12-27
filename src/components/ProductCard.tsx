import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, useCartStore } from '@/lib/store';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[1] || product.sizes[0]);
  const { addItem } = useCartStore();

  const handleAddToBag = () => {
    addItem(product, selectedSize);
  };

  const handleBuyNow = () => {
    addItem(product, selectedSize);
    // Could navigate to checkout
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-2xl bg-card">
        <motion.img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover object-center"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Badge */}
        {product.badge && (
          <div className="absolute left-3 top-3">
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
          </div>
        )}

        {/* Quick View Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-medium backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Quick view"
        >
          <Eye className="h-5 w-5" />
        </motion.button>

        {/* Size Selector on Hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <div className="flex justify-center gap-2 rounded-lg bg-background/90 p-2 backdrop-blur-sm">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
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
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.category}
        </p>
        <h3 className="font-display text-lg font-semibold text-foreground">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="cta"
            size="sm"
            className="flex-1 gap-2"
            onClick={handleAddToBag}
          >
            <ShoppingBag className="h-4 w-4" />
            ADD TO BAG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleBuyNow}
          >
            BUY NOW
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
