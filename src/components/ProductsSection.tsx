import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { SearchFilter, FilterState } from './SearchFilter';
import { useProducts, Product } from '@/hooks/useProducts';

const CATEGORY_ORDER = ['T-Shirts', 'Shirts', 'Pants', 'Trousers', 'Caps'];

interface CategorySectionProps {
  category: string;
  products: Product[];
}

function CategorySection({ category, products }: CategorySectionProps) {
  if (products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-16"
    >
      <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 pb-3 border-b border-border">
        {category}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

export function ProductsSection() {
  const { products, loading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 50000],
    sortBy: 'newest',
  });

  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(p => p.category === filters.category);
    }

    // Price filter
    result = result.filter(p => 
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => (b.stock > 10 ? 1 : 0) - (a.stock > 10 ? 1 : 0));
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }, [products, searchQuery, filters]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, typeof filteredProducts> = {};
    
    CATEGORY_ORDER.forEach(cat => {
      grouped[cat] = filteredProducts.filter(p => p.category === cat);
    });
    
    // Add any products with categories not in CATEGORY_ORDER
    filteredProducts.forEach(p => {
      if (!CATEGORY_ORDER.includes(p.category)) {
        if (!grouped[p.category]) {
          grouped[p.category] = [];
        }
        grouped[p.category].push(p);
      }
    });
    
    return grouped;
  }, [filteredProducts]);

  const isFiltering = searchQuery || filters.category !== 'all';

  if (loading) {
    return (
      <section id="products" className="py-20 bg-background">
        <div className="container px-4 md:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="products" className="py-20 bg-background">
        <div className="container px-4 md:px-8 flex items-center justify-center min-h-[400px]">
          <p className="text-destructive">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-20 bg-background">
      <div className="container px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            NEW ARRIVALS
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Fresh takes on classics: breathable shirts, tailored trousers, and lightweight
            outerwear in season-neutral colors
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="mb-10">
          <SearchFilter
            onSearch={setSearchQuery}
            onFilterChange={setFilters}
            categories={categories}
          />
        </div>

        {/* Results count when filtering */}
        {isFiltering && (
          <p className="text-muted-foreground mb-6">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        )}

        {/* Products by Category */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found</p>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div>
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <CategorySection
                key={category}
                category={category}
                products={categoryProducts}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
