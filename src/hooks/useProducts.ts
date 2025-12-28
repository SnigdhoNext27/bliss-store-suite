import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/store';

export type { Product };

interface DBProduct {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  description: string | null;
  short_description: string | null;
  images: string[] | null;
  sizes: string[] | null;
  stock: number;
  is_new: boolean | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  category_id: string | null;
  slug: string;
  video_url: string | null;
  category?: { name: string } | null;
}

function mapDBProductToProduct(dbProduct: DBProduct): Product {
  const categoryName = dbProduct.category?.name || 'General';
  
  let badge: 'new' | 'sale' | 'limited' | undefined;
  if (dbProduct.sale_price && dbProduct.sale_price < dbProduct.price) {
    badge = 'sale';
  } else if (dbProduct.is_new) {
    badge = 'new';
  } else if (dbProduct.stock <= 5 && dbProduct.stock > 0) {
    badge = 'limited';
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.sale_price || dbProduct.price,
    originalPrice: dbProduct.sale_price ? dbProduct.price : undefined,
    category: categoryName,
    description: dbProduct.description || dbProduct.short_description || '',
    images: dbProduct.images || [],
    sizes: dbProduct.sizes || ['S', 'M', 'L', 'XL'],
    stock: dbProduct.stock,
    badge,
    video_url: dbProduct.video_url || undefined,
  };
}

async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      sale_price,
      description,
      short_description,
      images,
      sizes,
      stock,
      is_new,
      is_featured,
      is_active,
      category_id,
      slug,
      video_url,
      category:categories(name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => 
    mapDBProductToProduct(item as unknown as DBProduct)
  );
}

async function fetchSingleProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      sale_price,
      description,
      short_description,
      images,
      sizes,
      stock,
      is_new,
      is_featured,
      is_active,
      category_id,
      slug,
      video_url,
      category:categories(name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return mapDBProductToProduct(data as unknown as DBProduct);
  }
  
  return null;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products, isLoading: loading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchAllProducts,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    initialData: [],
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          // Invalidate and refetch when any product changes
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    products: products || [], 
    loading, 
    error: error ? 'Failed to load products' : null 
  };
}

export function useProduct(id: string | undefined) {
  const queryClient = useQueryClient();

  const { data: product, isLoading: loading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchSingleProduct(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30000,
  });

  // Subscribe to real-time updates for this specific product
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`product-${id}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['product', id] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return { 
    product: product || null, 
    loading, 
    error: error ? 'Failed to load product' : null 
  };
}