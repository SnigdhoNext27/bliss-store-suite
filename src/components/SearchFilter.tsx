import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
}

export interface FilterState {
  category: string;
  priceRange: [number, number];
  sortBy: 'newest' | 'price-low' | 'price-high' | 'popular';
}

export function SearchFilter({ onSearch, onFilterChange, categories }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 500],
    sortBy: 'newest',
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      category: 'all',
      priceRange: [0, 500],
      sortBy: 'newest',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="lg"
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 px-4"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange({ category: 'all' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.category === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-accent'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleFilterChange({ category: cat })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.category === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Price Range</Label>
                  <span className="text-sm text-muted-foreground">
                    ৳{filters.priceRange[0]} - ৳{filters.priceRange[1]}
                  </span>
                </div>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => handleFilterChange({ priceRange: value as [number, number] })}
                  min={0}
                  max={500}
                  step={10}
                  className="py-2"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-3">
                <Label>Sort By</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'newest', label: 'Newest' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'popular', label: 'Popular' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange({ sortBy: option.value as FilterState['sortBy'] })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.sortBy === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
