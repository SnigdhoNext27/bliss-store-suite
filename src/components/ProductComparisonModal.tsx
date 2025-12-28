import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, ShoppingBag, Heart, Star } from 'lucide-react';
import { useProductComparison } from '@/hooks/useProductComparison';
import { useCartStore } from '@/lib/store';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function ProductComparisonModal() {
  const { products, isOpen, closeComparison, removeProduct, clearAll } = useProductComparison();
  const { addItem, openCart } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const size = product.sizes[0] || 'One Size';
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      description: product.description || '',
      images: product.images,
      sizes: product.sizes,
      stock: product.stock,
    }, size);
    openCart();
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = async (productId: string) => {
    const inWishlist = isInWishlist(productId);
    if (inWishlist) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const handleViewProduct = (productId: string) => {
    closeComparison();
    navigate(`/product/${productId}`);
  };

  const comparisonRows = [
    { label: 'Price', key: 'price', render: (p: any) => (
      <div>
        <span className="font-bold text-lg text-foreground">৳{p.price.toFixed(0)}</span>
        {p.originalPrice && (
          <span className="text-sm text-muted-foreground line-through ml-2">৳{p.originalPrice.toFixed(0)}</span>
        )}
      </div>
    )},
    { label: 'Category', key: 'category', render: (p: any) => p.category || '-' },
    { label: 'Sizes', key: 'sizes', render: (p: any) => p.sizes?.join(', ') || 'One Size' },
    { label: 'Stock', key: 'stock', render: (p: any) => (
      <span className={p.stock > 0 ? 'text-green-600' : 'text-destructive'}>
        {p.stock > 0 ? `${p.stock} available` : 'Out of stock'}
      </span>
    )},
    { label: 'New Arrival', key: 'badge', render: (p: any) => p.badge === 'new' ? <Check className="h-5 w-5 text-green-600" /> : <Minus className="h-5 w-5 text-muted-foreground" /> },
    { label: 'On Sale', key: 'originalPrice', render: (p: any) => p.originalPrice ? <Check className="h-5 w-5 text-green-600" /> : <Minus className="h-5 w-5 text-muted-foreground" /> },
    { label: 'Limited', key: 'limited', render: (p: any) => p.badge === 'limited' ? <Check className="h-5 w-5 text-green-600" /> : <Minus className="h-5 w-5 text-muted-foreground" /> },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={closeComparison}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 md:inset-8 z-50 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border shrink-0">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              Compare Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Comparing {products.length} products
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
            <button
              onClick={closeComparison}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 w-36 text-muted-foreground font-medium text-sm">
                    Product
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="p-3 text-center min-w-[200px]">
                      <div className="relative group">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleViewProduct(product.id)}
                        >
                          <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden bg-secondary mb-3">
                            <img
                              src={product.images[0] || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                          <h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.key} className="border-t border-border/50">
                    <td className="p-3 text-muted-foreground font-medium text-sm">
                      {row.label}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-3 text-center">
                        {row.render(product)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Actions Row */}
                <tr className="border-t border-border">
                  <td className="p-3 text-muted-foreground font-medium text-sm">
                    Actions
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="p-3">
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleWishlistToggle(product.id)}
                        >
                          <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          {isInWishlist(product.id) ? 'Wishlisted' : 'Wishlist'}
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
