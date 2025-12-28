import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface LoyaltyPoints {
  id: string;
  user_id: string;
  points: number;
  lifetime_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
  updated_at: string;
}

interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'bonus';
  description: string | null;
  order_id: string | null;
  created_at: string;
}

const tierBenefits = {
  bronze: {
    name: 'Bronze',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    pointsMultiplier: 1,
    discount: 0,
    minPoints: 0,
  },
  silver: {
    name: 'Silver',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    pointsMultiplier: 1.25,
    discount: 5,
    minPoints: 500,
  },
  gold: {
    name: 'Gold',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    pointsMultiplier: 1.5,
    discount: 10,
    minPoints: 2000,
  },
  platinum: {
    name: 'Platinum',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    pointsMultiplier: 2,
    discount: 15,
    minPoints: 5000,
  },
};

export function useLoyaltyPoints() {
  const { user } = useAuth();

  const { data: loyaltyData, isLoading: loadingPoints, refetch: refetchPoints } = useQuery({
    queryKey: ['loyalty-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as LoyaltyPoints | null;
    },
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['loyalty-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!user?.id,
  });

  const currentTier = loyaltyData?.tier || 'bronze';
  const tierInfo = tierBenefits[currentTier as keyof typeof tierBenefits];

  const getNextTier = useCallback(() => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'] as const;
    const currentIndex = tiers.indexOf(currentTier as typeof tiers[number]);
    if (currentIndex < tiers.length - 1) {
      const nextTier = tiers[currentIndex + 1];
      return {
        tier: nextTier,
        info: tierBenefits[nextTier],
        pointsNeeded: tierBenefits[nextTier].minPoints - (loyaltyData?.lifetime_points || 0),
      };
    }
    return null;
  }, [currentTier, loyaltyData?.lifetime_points]);

  const calculatePointsValue = useCallback((points: number) => {
    // 100 points = ৳10 discount
    return Math.floor(points / 10);
  }, []);

  return {
    points: loyaltyData?.points || 0,
    lifetimePoints: loyaltyData?.lifetime_points || 0,
    tier: currentTier,
    tierInfo,
    tierBenefits,
    nextTier: getNextTier(),
    transactions: transactions || [],
    loadingPoints,
    loadingTransactions,
    calculatePointsValue,
    refetch: () => {
      refetchPoints();
      refetchTransactions();
    },
  };
}
