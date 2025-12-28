import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X, ShoppingBag, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store';
import { useCartWithLivePrices } from '@/hooks/useCartWithLivePrices';
import { useCurrency } from '@/hooks/useCurrency';

export function CartQuickView() {
  const { items: cartItems } = useCartStore();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const { items, liveSubtotal, liveTotalItems } = useCartWithLivePrices();
  const [isExpanded, setIsExpanded] = useState(false);
  const dragControls = useDragControls();

  const handleDragEnd = useCallback((_: never, info: PanInfo) => {
    if (info.offset.y < -50) {
      setIsExpanded(true);
    } else if (info.offset.y > 50) {
      setIsExpanded(false);
    }
  }, []);

  const handleCheckout = () => {
    setIsExpanded(false);
    navigate('/checkout');
  };

  if (cartItems.length === 0) return null;

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Quick View Drawer */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ 
          height: isExpanded ? '70vh' : 'auto',
          y: 0 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-16 left-0 right-0 z-40 bg-card rounded-t-2xl shadow-2xl border-t border-border md:hidden safe-area-pb"
        style={{ touchAction: 'none' }}
      >
        {/* Drag Handle */}
        <div 
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Collapsed View */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {liveTotalItems}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{liveTotalItems} item{liveTotalItems > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Subtotal: {format(liveSubtotal)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="cta" onClick={handleCheckout}>
                    Checkout
                  </Button>
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full pb-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">Quick View</h3>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {liveTotalItems}
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="h-14 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Size: {item.size} • Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      {format(item.livePrice * item.quantity)}
                    </p>
                  </div>
                ))}
                {items.length > 5 && (
                  <p className="text-center text-xs text-muted-foreground">
                    +{items.length - 5} more items
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pt-3 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-semibold">{format(liveSubtotal)}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsExpanded(false);
                      useCartStore.getState().openCart();
                    }}
                  >
                    View Full Bag
                  </Button>
                  <Button variant="cta" className="flex-1" onClick={handleCheckout}>
                    Checkout
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
