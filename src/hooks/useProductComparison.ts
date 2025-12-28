import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/hooks/useProducts';

interface ProductComparisonStore {
  products: Product[];
  isOpen: boolean;
  maxProducts: number;
  addProduct: (product: Product) => boolean;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  isInComparison: (productId: string) => boolean;
  openComparison: () => void;
  closeComparison: () => void;
  toggleComparison: () => void;
}

export const useProductComparison = create<ProductComparisonStore>()(
  persist(
    (set, get) => ({
      products: [],
      isOpen: false,
      maxProducts: 4,

      addProduct: (product: Product) => {
        const state = get();
        if (state.products.length >= state.maxProducts) {
          return false;
        }
        if (state.products.some(p => p.id === product.id)) {
          return false;
        }
        set({ products: [...state.products, product] });
        return true;
      },

      removeProduct: (productId: string) => {
        set(state => ({
          products: state.products.filter(p => p.id !== productId),
        }));
      },

      clearAll: () => set({ products: [], isOpen: false }),

      isInComparison: (productId: string) => {
        return get().products.some(p => p.id === productId);
      },

      openComparison: () => set({ isOpen: true }),
      closeComparison: () => set({ isOpen: false }),
      toggleComparison: () => set(state => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'almans-product-comparison',
      partialize: (state) => ({ products: state.products }),
    }
  )
);
