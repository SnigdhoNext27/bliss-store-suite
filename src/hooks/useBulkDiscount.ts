import { useMemo } from 'react';

interface BulkDiscountTier {
  minQuantity: number;
  discountPercent: number;
  label: string;
}

const BULK_DISCOUNT_TIERS: BulkDiscountTier[] = [
  { minQuantity: 10, discountPercent: 5, label: '5% off' },
  { minQuantity: 20, discountPercent: 10, label: '10% off' },
  { minQuantity: 50, discountPercent: 15, label: '15% off' },
  { minQuantity: 100, discountPercent: 20, label: '20% off' },
];

interface BulkDiscountResult {
  totalQuantity: number;
  applicableTier: BulkDiscountTier | null;
  nextTier: BulkDiscountTier | null;
  discountPercent: number;
  discountAmount: number;
  itemsToNextTier: number;
  allTiers: BulkDiscountTier[];
}

export function useBulkDiscount(items: { quantity: number }[], subtotal: number): BulkDiscountResult {
  return useMemo(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Find the applicable tier (highest tier that meets quantity requirement)
    let applicableTier: BulkDiscountTier | null = null;
    let nextTier: BulkDiscountTier | null = null;
    
    for (let i = BULK_DISCOUNT_TIERS.length - 1; i >= 0; i--) {
      if (totalQuantity >= BULK_DISCOUNT_TIERS[i].minQuantity) {
        applicableTier = BULK_DISCOUNT_TIERS[i];
        nextTier = BULK_DISCOUNT_TIERS[i + 1] || null;
        break;
      }
    }
    
    // If no tier is applicable, find the first tier as next tier
    if (!applicableTier) {
      nextTier = BULK_DISCOUNT_TIERS[0];
    }
    
    const discountPercent = applicableTier?.discountPercent || 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const itemsToNextTier = nextTier ? nextTier.minQuantity - totalQuantity : 0;
    
    return {
      totalQuantity,
      applicableTier,
      nextTier,
      discountPercent,
      discountAmount,
      itemsToNextTier,
      allTiers: BULK_DISCOUNT_TIERS,
    };
  }, [items, subtotal]);
}
