import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
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

  const trendingSearches = ['T-Shirts', 'Caps', 'New Arrivals', 'Sale'];

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
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('almans-recent-searches', JSON.stringify(newRecent));
    
    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
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
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-lg"
          >
            <div className="container px-4 md:px-8 py-6">
              {/* Search Input */}
              <div className="relative max-w-3xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  placeholder="Search for products, brands and more..."
                  className="w-full h-14 pl-12 pr-12 rounded-full border-2 border-primary/20 bg-background text-lg placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Results or Suggestions */}
              <div className="max-w-3xl mx-auto mt-6">
                {query.length > 1 ? (
                  /* Product Results */
                  <div>
                    {results.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          {results.length} results for "{query}"
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {results.map((product) => (
                            <motion.button
                              key={product.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => handleProductClick(product.id)}
                              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
                            >
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground line-clamp-1">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                                <p className="text-sm font-bold text-primary mt-1">
                                  ৳{product.price.toFixed(0)}
                                </p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleSearch(query)}
                          className="flex items-center gap-2 w-full mt-4 py-3 text-primary hover:underline justify-center"
                        >
                          View all results for "{query}"
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No results found for "{query}"
                      </p>
                    )}
                  </div>
                ) : (
                  /* Suggestions */
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Recent Searches
                          </h3>
                          <button
                            onClick={clearRecentSearches}
                            className="text-xs text-primary hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              onClick={() => handleSearch(term)}
                              className="px-4 py-2 rounded-full bg-secondary/50 text-sm hover:bg-secondary transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending Searches */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <TrendingUp className="h-4 w-4" />
                        Trending Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => handleSearch(term)}
                            className="px-4 py-2 rounded-full border border-primary/30 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
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