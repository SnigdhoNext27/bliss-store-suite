import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/store';

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
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
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
            category:categories(name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedProducts = (data || []).map(item => 
          mapDBProductToProduct(item as unknown as DBProduct)
        );
        setProducts(mappedProducts);
      } catch (err) {
        console.error('Fetch products error:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
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
            category:categories(name)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProduct(mapDBProductToProduct(data as unknown as DBProduct));
        }
      } catch (err) {
        console.error('Fetch product error:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}
