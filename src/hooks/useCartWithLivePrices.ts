import { useMemo, useEffect, useRef } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCartStore, CartItem } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export interface LiveCartItem extends CartItem {
  livePrice: number;
  originalStoredPrice: number;
  priceChanged: boolean;
  productUnavailable: boolean;
}

export function useCartWithLivePrices() {
  const { items, removeItem, updateQuantity, clearCart, getTotalItems } = useCartStore();
  const { products, loading } = useProducts();
  const { toast } = useToast();
  const hasShownPriceChangeToast = useRef(false);

  // Create a map of products by ID for quick lookup
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  // Merge cart items with live product data
  const liveItems = useMemo((): LiveCartItem[] => {
    return items.map(item => {
      const liveProduct = productsMap.get(item.product.id);
      
      if (!liveProduct) {
        // Product no longer exists or is inactive
        return {
          ...item,
          livePrice: item.product.price,
          originalStoredPrice: item.product.price,
          priceChanged: false,
          productUnavailable: true,
        };
      }

      const livePrice = liveProduct.price;
      const storedPrice = item.product.price;
      const priceChanged = livePrice !== storedPrice;

      return {
        ...item,
        product: liveProduct, // Update with live product data
        livePrice,
        originalStoredPrice: storedPrice,
        priceChanged,
        productUnavailable: false,
      };
    });
  }, [items, productsMap]);

  // Check for any price changes
  const hasPriceChanges = useMemo(() => {
    return liveItems.some(item => item.priceChanged);
  }, [liveItems]);

  // Check for unavailable products
  const hasUnavailableProducts = useMemo(() => {
    return liveItems.some(item => item.productUnavailable);
  }, [liveItems]);

  // Show toast when price changes are detected (only once per session)
  useEffect(() => {
    if (hasPriceChanges && !loading && !hasShownPriceChangeToast.current) {
      hasShownPriceChangeToast.current = true;
      toast({
        title: 'Prices Updated',
        description: 'Some items in your cart have new prices.',
      });
    }
  }, [hasPriceChanges, loading, toast]);

  // Calculate totals using live prices
  const liveSubtotal = useMemo(() => {
    return liveItems.reduce((total, item) => {
      if (item.productUnavailable) return total;
      return total + item.livePrice * item.quantity;
    }, 0);
  }, [liveItems]);

  const liveTotalItems = useMemo(() => {
    return liveItems.reduce((total, item) => {
      if (item.productUnavailable) return total;
      return total + item.quantity;
    }, 0);
  }, [liveItems]);

  // Remove unavailable items from cart
  const removeUnavailableItems = () => {
    liveItems.forEach(item => {
      if (item.productUnavailable) {
        removeItem(item.product.id, item.size);
      }
    });
  };

  return {
    items: liveItems,
    loading,
    hasPriceChanges,
    hasUnavailableProducts,
    liveSubtotal,
    liveTotalItems,
    removeItem,
    updateQuantity,
    clearCart,
    removeUnavailableItems,
    getTotalItems,
  };
}
