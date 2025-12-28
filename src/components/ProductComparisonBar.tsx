import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, Trash2 } from 'lucide-react';
import { useProductComparison } from '@/hooks/useProductComparison';
import { Button } from './ui/button';

export function ProductComparisonBar() {
  const { products, removeProduct, clearAll, openComparison } = useProductComparison();

  if (products.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl"
      >
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Product thumbnails */}
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="flex items-center gap-2 shrink-0">
                <GitCompare className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                  Compare ({products.length}/4)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative group"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 border-border bg-secondary">
                      <img
                        src={product.images[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 4 - products.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 border-dashed border-border/50 bg-muted/30 hidden sm:flex items-center justify-center"
                  >
                    <span className="text-muted-foreground/50 text-xs">+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button
                size="sm"
                onClick={openComparison}
                disabled={products.length < 2}
                className="gap-1.5"
              >
                <GitCompare className="h-4 w-4" />
                Compare Now
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
