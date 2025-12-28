import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/lib/store';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { products } = useProducts();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const trendingSearches = ['T-Shirts', 'Shirts', 'Pants', 'Jackets', 'New Arrivals', 'Sale'];
  const categories = ['T-Shirts', 'Shirts', 'Pants', 'Jackets', 'Accessories'];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const stored = localStorage.getItem('almans-recent-searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, products]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Save to recent searches
    const newRecent = [searchTerm, ...recentSearches.filter(s => s.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('almans-recent-searches', JSON.stringify(newRecent));
    
    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
    onClose();
    setQuery('');
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
    onClose();
    setQuery('');
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    onClose();
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('almans-recent-searches');
  };

  const removeRecentSearch = (term: string) => {
    const newRecent = recentSearches.filter(s => s !== term);
    setRecentSearches(newRecent);
    localStorage.setItem('almans-recent-searches', JSON.stringify(newRecent));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 bg-card shadow-2xl"
          >
            <div className="container px-4 md:px-8 py-6 md:py-8">
              {/* Search Input - Fashionable Design */}
              <div className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-almans-gold/20 to-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                    placeholder="Search for products, brands..."
                    className="w-full h-14 md:h-16 pl-14 pr-14 rounded-full border-2 border-border bg-background text-base md:text-lg placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  />
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search Results or Suggestions */}
              <div className="max-w-2xl mx-auto mt-8">
                {query.length > 1 ? (
                  /* Product Results */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {results.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {results.length} results for "{query}"
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {results.map((product, i) => (
                            <motion.button
                              key={product.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => handleProductClick(product.id)}
                              className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all text-left group"
                            >
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                                <img
                                  src={product.images[0] || '/placeholder.svg'}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-bold text-primary">
                                    ৳{product.price.toFixed(0)}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ৳{product.originalPrice.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </motion.button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleSearch(query)}
                          className="flex items-center gap-2 w-full mt-5 py-3 text-primary hover:text-primary/80 justify-center font-medium text-sm border-t border-border/50 pt-5"
                        >
                          View all results for "{query}"
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          No results found for "{query}"
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Try searching for something else
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Suggestions - Fashionable Layout */
                  <div className="space-y-8">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                            <Clock className="h-4 w-4" />
                            Recent Searches
                          </h3>
                          <button
                            onClick={clearRecentSearches}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term, i) => (
                            <motion.div
                              key={term}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="group relative"
                            >
                              <button
                                onClick={() => handleSearch(term)}
                                className="px-5 py-2.5 rounded-full bg-secondary/70 text-sm font-medium hover:bg-secondary transition-colors pr-8"
                              >
                                {term}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecentSearch(term);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Trending Searches */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4 uppercase tracking-wide">
                        <TrendingUp className="h-4 w-4" />
                        Trending Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((term, i) => (
                          <motion.button
                            key={term}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            onClick={() => handleSearch(term)}
                            className="px-5 py-2.5 rounded-full border-2 border-primary/30 text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                          >
                            {term}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Quick Categories */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4 uppercase tracking-wide">
                        <Tag className="h-4 w-4" />
                        Shop by Category
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category, i) => (
                          <motion.button
                            key={category}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            onClick={() => handleCategoryClick(category)}
                            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-almans-gold/10 border border-primary/20 text-sm font-medium text-foreground hover:from-primary hover:to-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                          >
                            {category}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
