import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronRight, Shirt, Package } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { SearchFilter, FilterState } from './SearchFilter';
import { useProducts, Product } from '@/hooks/useProducts';
import { Button } from './ui/button';

const CATEGORY_ORDER = ['T-Shirts', 'Shirts', 'Pants', 'Trousers', 'Caps', 'Accessories'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'T-Shirts': <Shirt className="h-5 w-5" />,
  'Shirts': <Shirt className="h-5 w-5" />,
  'Pants': <Package className="h-5 w-5" />,
  'Trousers': <Package className="h-5 w-5" />,
  'Caps': <Package className="h-5 w-5" />,
  'Accessories': <Package className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'T-Shirts': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'Shirts': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  'Pants': 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  'Trousers': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  'Caps': 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
  'Accessories': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
};

interface CategorySectionProps {
  category: string;
  products: Product[];
  onViewAll: (category: string) => void;
}

function CategorySection({ category, products, onViewAll }: CategorySectionProps) {
  if (products.length === 0) return null;

  const colorClass = CATEGORY_COLORS[category] || 'from-primary/20 to-primary/10 border-primary/30';
  const icon = CATEGORY_ICONS[category] || <Package className="h-5 w-5" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      {/* Category Header - Shopee Style */}
      <div className={`bg-gradient-to-r ${colorClass} border rounded-t-lg p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background/80 rounded-lg shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {category}
            </h3>
            <p className="text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary/80 gap-1"
          onClick={() => onViewAll(category)}
        >
          See All <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Products Grid */}
      <div className="border border-t-0 rounded-b-lg p-4 bg-card/50">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.slice(0, 5).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
        {products.length > 5 && (
          <div className="text-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => onViewAll(category)}
              className="gap-2"
            >
              View all {products.length} items in {category}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Quick Category Navigation
function CategoryNav({ 
  categories, 
  activeCategory, 
  onSelect 
}: { 
  categories: string[]; 
  activeCategory: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mb-8 justify-center"
    >
      <Button
        variant={activeCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect('all')}
        className="rounded-full"
      >
        All Products
      </Button>
      {categories.map(cat => (
        <Button
          key={cat}
          variant={activeCategory === cat ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(cat)}
          className="rounded-full gap-1.5"
        >
          {CATEGORY_ICONS[cat]}
          {cat}
        </Button>
      ))}
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
    const cats = [...new Set(products.map(p => p.category))];
    // Sort by CATEGORY_ORDER, then alphabetically for others
    return cats.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
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
    
    // Use sorted categories
    categories.forEach(cat => {
      grouped[cat] = filteredProducts.filter(p => p.category === cat);
    });
    
    return grouped;
  }, [filteredProducts, categories]);

  const handleViewAll = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
    // Scroll to top of products
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const isFiltering = searchQuery || filters.category !== 'all';
  const showCategorySections = !isFiltering && filteredProducts.length > 0;

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
            SHOP BY CATEGORY
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Browse our collection organized by category. Find exactly what you're looking for.
          </p>
        </motion.div>

        {/* Quick Category Navigation */}
        <CategoryNav 
          categories={categories}
          activeCategory={filters.category}
          onSelect={(cat) => setFilters(prev => ({ ...prev, category: cat }))}
        />

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
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {filters.category !== 'all' && ` in ${filters.category}`}
            </p>
            {filters.category !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
              >
                Clear filter
              </Button>
            )}
          </div>
        )}

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found</p>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        ) : showCategorySections ? (
          // Show products grouped by category (Shopee style)
          <div>
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
              <CategorySection
                key={category}
                category={category}
                products={categoryProducts}
                onViewAll={handleViewAll}
              />
            ))}
          </div>
        ) : (
          // Show filtered products in a single grid
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
