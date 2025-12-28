import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store';
import { useCartWithLivePrices } from '@/hooks/useCartWithLivePrices';
import { useCurrency } from '@/hooks/useCurrency';

export function CartSlide() {
  const { isOpen, closeCart } = useCartStore();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const {
    items,
    loading,
    hasPriceChanges,
    hasUnavailableProducts,
    liveSubtotal,
    liveTotalItems,
    removeItem,
    updateQuantity,
    removeUnavailableItems,
  } = useCartWithLivePrices();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-almans-chocolate/50 backdrop-blur-sm"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold">
                    My Bag
                  </h2>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {liveTotalItems}
                  </span>
                </div>
                <button
                  onClick={closeCart}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Price Change Warning */}
              {hasPriceChanges && !loading && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">Some prices have been updated since you added them.</p>
                </div>
              )}

              {/* Unavailable Products Warning */}
              {hasUnavailableProducts && !loading && (
                <div className="mx-6 mt-4 flex items-center justify-between gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">Some items are no longer available.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeUnavailableItems}>
                    Remove
                  </Button>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Your bag is empty
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Add some items to get started
                    </p>
                    <Button variant="default" onClick={closeCart}>
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={`${item.product.id}-${item.size}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`flex gap-4 rounded-xl bg-card p-4 ${item.productUnavailable ? 'opacity-50' : ''}`}
                      >
                        {/* Product Image */}
                        <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Size: {item.size}
                              </p>
                              {item.productUnavailable && (
                                <p className="text-sm text-destructive">Unavailable</p>
                              )}
                              {item.priceChanged && !item.productUnavailable && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  Price updated from {format(item.originalStoredPrice)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id, item.size)}
                              className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-auto flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.size,
                                    item.quantity - 1
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
                                aria-label="Decrease quantity"
                                disabled={item.productUnavailable}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.size,
                                    item.quantity + 1
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
                                aria-label="Increase quantity"
                                disabled={item.productUnavailable}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Price */}
                            <p className="font-semibold text-primary">
                              {format(item.livePrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-border px-6 py-4 space-y-4">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-semibold text-foreground">
                      {format(liveSubtotal)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Delivery fee calculated at checkout
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={closeCart}
                    >
                      View Bag
                    </Button>
                    <Button 
                      variant="cta" 
                      className="flex-1"
                      onClick={handleCheckout}
                      disabled={hasUnavailableProducts}
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
