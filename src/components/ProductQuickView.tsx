import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Product, useCartStore } from '@/lib/store';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/use-toast';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize || product.sizes[0] || '');
    }
    
    toast({ title: `${product.name} added to bag!` });
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{product.name} - Quick View</DialogTitle>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="relative bg-secondary/30 aspect-square md:aspect-auto">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={product.images[currentImageIndex]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Image navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Image dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-primary w-6' : 'bg-primary/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badge */}
            {product.badge && (
              <div className="absolute left-4 top-4">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  product.badge === 'new' ? 'bg-primary text-primary-foreground' :
                  product.badge === 'sale' ? 'bg-destructive text-destructive-foreground' :
                  'bg-almans-gold text-almans-chocolate'
                }`}>
                  {product.badge === 'limited' ? 'Low Stock' : product.badge}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Category & Title */}
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              {product.category}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < 4 ? 'fill-almans-gold text-almans-gold' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(128 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-bold text-primary">৳{product.price.toFixed(0)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ৳{product.originalPrice.toFixed(0)}
                  </span>
                  <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded">
                    Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
              {product.description || 'Premium quality product crafted with attention to detail. Made with high-quality materials for lasting comfort and style.'}
            </p>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection - if product has colors in database */}

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Bag
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => toggleWishlist(product.id)}
                className={inWishlist ? 'bg-primary/10 text-primary' : ''}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* View Full Details Link */}
            <button
              onClick={() => { onClose(); navigate(`/product/${product.id}`); }}
              className="text-sm text-primary hover:underline mb-6"
            >
              View Full Product Details →
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex flex-col items-center text-center">
                <Truck className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}