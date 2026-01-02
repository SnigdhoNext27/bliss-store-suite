import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useLocation } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';

export function FloatingCartButton() {
  const { items, openCart, getTotalItems } = useCartStore();
  const location = useLocation();
  const { format } = useCurrency();
  const totalItems = getTotalItems();
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Don't show on admin pages, checkout, or when cart is empty
  const shouldHide = 
    location.pathname.startsWith('/admin') || 
    location.pathname === '/checkout' ||
    totalItems === 0;

  if (shouldHide) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openCart}
        className="fixed bottom-6 right-6 z-40 md:hidden flex items-center gap-3 bg-primary text-primary-foreground rounded-full px-5 py-3.5 shadow-elevated hover:shadow-glow transition-shadow duration-300"
        style={{ 
          paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))',
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))'
        }}
        aria-label={`Open cart with ${totalItems} items`}
      >
        {/* Shopping bag icon with badge */}
        <div className="relative">
          <ShoppingBag className="h-5 w-5" />
          <motion.span
            key={totalItems}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-almans-gold text-almans-chocolate text-[10px] font-bold shadow-md"
          >
            {totalItems > 9 ? '9+' : totalItems}
          </motion.span>
        </div>
        
        {/* Subtotal */}
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80">My Bag</span>
          <span className="text-sm font-bold">{format(subtotal)}</span>
        </div>

        {/* Pulsing ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-foreground/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.button>
    </AnimatePresence>
  );
}