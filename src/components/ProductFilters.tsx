import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface ProductFilters {
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  maxPrice: number;
  availableSizes: string[];
  availableColors: string[];
  activeFiltersCount: number;
  onClearAll: () => void;
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

const COLOR_MAP: Record<string, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Red': '#EF4444',
  'Blue': '#3B82F6',
  'Green': '#22C55E',
  'Yellow': '#EAB308',
  'Orange': '#F97316',
  'Purple': '#A855F7',
  'Pink': '#EC4899',
  'Gray': '#6B7280',
  'Grey': '#6B7280',
  'Navy': '#1E3A5F',
  'Brown': '#92400E',
  'Beige': '#D4B896',
  'Cream': '#FFFDD0',
  'Maroon': '#800000',
  'Olive': '#808000',
  'Teal': '#008080',
};

export function ProductFiltersPanel({
  filters,
  onFiltersChange,
  maxPrice,
  availableSizes,
  availableColors,
  activeFiltersCount,
  onClearAll,
}: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    price: true,
    sizes: true,
    colors: true,
  });

  const sortedSizes = [...availableSizes].sort((a, b) => {
    const aIndex = SIZE_ORDER.indexOf(a);
    const bIndex = SIZE_ORDER.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]],
    });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    onFiltersChange({ ...filters, sizes: newSizes });
  };

  const handleColorToggle = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    onFiltersChange({ ...filters, colors: newColors });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
          <span className="font-medium text-foreground">Price Range</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="px-2">
            <Slider
              value={[filters.priceRange[0], filters.priceRange[1]]}
              min={0}
              max={maxPrice}
              step={100}
              onValueChange={handlePriceChange}
              className="mb-4"
            />
            <div className="flex items-center justify-between text-sm">
              <div className="bg-secondary px-3 py-1.5 rounded-lg">
                <span className="text-muted-foreground">Min: </span>
                <span className="font-medium">৳{filters.priceRange[0]}</span>
              </div>
              <div className="h-px w-4 bg-border" />
              <div className="bg-secondary px-3 py-1.5 rounded-lg">
                <span className="text-muted-foreground">Max: </span>
                <span className="font-medium">৳{filters.priceRange[1]}</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sizes */}
      {sortedSizes.length > 0 && (
        <Collapsible open={openSections.sizes} onOpenChange={() => toggleSection('sizes')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left border-t border-border pt-4">
            <span className="font-medium text-foreground">Sizes</span>
            <div className="flex items-center gap-2">
              {filters.sizes.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {filters.sizes.length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.sizes ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {sortedSizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    filters.sizes.includes(size)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary bg-background'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Colors */}
      {availableColors.length > 0 && (
        <Collapsible open={openSections.colors} onOpenChange={() => toggleSection('colors')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left border-t border-border pt-4">
            <span className="font-medium text-foreground">Colors</span>
            <div className="flex items-center gap-2">
              {filters.colors.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {filters.colors.length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.colors ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-2 gap-2">
              {availableColors.map(color => {
                const isSelected = filters.colors.includes(color);
                const colorHex = COLOR_MAP[color] || '#888888';
                const isLight = colorHex === '#FFFFFF' || colorHex === '#FFFDD0';
                
                return (
                  <button
                    key={color}
                    onClick={() => handleColorToggle(color)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isLight ? 'border-border' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: colorHex }}
                    >
                      {isSelected && (
                        <Check className={`h-3 w-3 ${isLight ? 'text-foreground' : 'text-white'}`} />
                      )}
                    </div>
                    <span className="text-sm">{color}</span>
                  </button>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive">
                  Clear all
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(100vh-180px)]">
            <FilterContent />
          </div>
          <SheetFooter className="mt-6">
            <Button className="w-full">Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Desktop Filters Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive text-xs h-8">
                Clear all
              </Button>
            )}
          </div>
          <FilterContent />
        </div>
      </div>
    </>
  );
}

// Active filter tags display
export function ActiveFilterTags({
  filters,
  onFiltersChange,
  maxPrice,
  onClearAll,
}: {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  maxPrice: number;
  onClearAll: () => void;
}) {
  const hasActiveFilters = 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < maxPrice ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0;

  if (!hasActiveFilters) return null;

  const removeSize = (size: string) => {
    onFiltersChange({
      ...filters,
      sizes: filters.sizes.filter(s => s !== size),
    });
  };

  const removeColor = (color: string) => {
    onFiltersChange({
      ...filters,
      colors: filters.colors.filter(c => c !== color),
    });
  };

  const removePriceFilter = () => {
    onFiltersChange({
      ...filters,
      priceRange: [0, maxPrice],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-4"
    >
      <span className="text-sm text-muted-foreground">Active filters:</span>
      
      {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
        <FilterTag 
          label={`৳${filters.priceRange[0]} - ৳${filters.priceRange[1]}`} 
          onRemove={removePriceFilter} 
        />
      )}
      
      {filters.sizes.map(size => (
        <FilterTag key={size} label={`Size: ${size}`} onRemove={() => removeSize(size)} />
      ))}
      
      {filters.colors.map(color => (
        <FilterTag key={color} label={color} onRemove={() => removeColor(color)} />
      ))}
      
      <Button variant="ghost" size="sm" onClick={onClearAll} className="text-destructive text-xs h-7">
        Clear all
      </Button>
    </motion.div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}