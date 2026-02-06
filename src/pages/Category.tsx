import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, SlidersHorizontal, Grid3X3, LayoutGrid } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { products, loading } = useProducts();
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return;

      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      setCategory((data as CategoryInfo) ?? null);
    };

    fetchCategory();
  }, [slug]);

  const categoryProducts = useMemo(() => {
    if (!category) return [];
    
    let filtered = products.filter(p => 
      p.category.toLowerCase() === category.name.toLowerCase()
    );

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        break;
    }

    return filtered;
  }, [products, category, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} - Almans | Premium Fashion</title>
        <meta name="description" content={category.description || `Shop our ${category.name} collection at Almans.`} />
        {slug && (
          <link rel="canonical" href={`${window.location.origin}/category/${slug}`} />
        )}
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} />

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        
        <main>
          {/* Compact Hero Section */}
          <div className="bg-gradient-to-b from-secondary/30 to-background py-6 md:py-8">
            <div className="container px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {category.description}
                  </p>
                )}
                <p className="mt-2 text-primary text-sm font-medium">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Breadcrumb & Controls */}
          <div className="container px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/shop')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Shop
                </Button>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium">{category.name}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Grid Toggle */}
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  <Button
                    variant={gridCols === 3 ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridCols(3)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridCols === 4 ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridCols(4)}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="container px-4 pb-20">
            {categoryProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No products in this category yet.</p>
                <Button onClick={() => navigate('/shop')} className="mt-4">
                  Browse All Products
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`grid gap-6 ${
                  gridCols === 3 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                }`}
              >
                {categoryProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </motion.div>
            )}
          </div>
        </main>

        <Footer />
        <CartSlide />
      </div>
    </>
  );
}
