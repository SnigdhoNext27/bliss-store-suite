import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { SearchFilter, FilterState } from './SearchFilter';
import { products } from '@/lib/products';

export function ProductsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 500],
    sortBy: 'newest',
  });

  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, []);

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
        // Keep original order for newest
        break;
    }

    return result;
  }, [searchQuery, filters]);

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

        {/* Results count */}
        {(searchQuery || filters.category !== 'all') && (
          <p className="text-muted-foreground mb-6">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found</p>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
