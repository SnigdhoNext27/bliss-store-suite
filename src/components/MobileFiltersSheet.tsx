import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Check, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ProductFilters } from './ProductFilters';

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

interface MobileFiltersSheetProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  maxPrice: number;
  availableSizes: string[];
  availableColors: string[];
  activeFiltersCount: number;
  onClearAll: () => void;
  onApply: () => void;
}

export function MobileFiltersSheet({
  filters,
  onFiltersChange,
  maxPrice,
  availableSizes,
  availableColors,
  activeFiltersCount,
  onClearAll,
  onApply,
}: MobileFiltersSheetProps) {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    price: true,
    sizes: true,
    colors: false,
  });

  // Local copy of filters for preview before apply
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);

  const sortedSizes = [...availableSizes].sort((a, b) => {
    const aIndex = SIZE_ORDER.indexOf(a);
    const bIndex = SIZE_ORDER.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalFilters(filters); // Sync on open
    }
    setOpen(isOpen);
  };

  const handlePriceChange = (value: number[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]],
    }));
  };

  const handleSizeToggle = (size: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleColorToggle = (color: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilters: ProductFilters = {
      priceRange: [0, maxPrice],
      sizes: [],
      colors: [],
    };
    setLocalFilters(resetFilters);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Count local filters for badge
  const localFiltersCount =
    (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < maxPrice ? 1 : 0) +
    localFilters.sizes.length +
    localFilters.colors.length;

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 lg:hidden relative">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        {/* Header */}
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2 text-lg font-display">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Filters
              {localFiltersCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {localFiltersCount}
                </span>
              )}
            </DrawerTitle>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </DrawerHeader>

        {/* Scrollable Filter Content */}
        <div className="overflow-y-auto max-h-[50vh] px-4 py-4 space-y-4">
          {/* Price Range */}
          <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left bg-muted/50 rounded-xl px-4">
              <span className="font-medium text-foreground">Price Range</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 px-2">
              <Slider
                value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
                min={0}
                max={maxPrice}
                step={100}
                onValueChange={handlePriceChange}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="bg-card px-4 py-2 rounded-lg border border-border">
                  <span className="text-muted-foreground">Min: </span>
                  <span className="font-semibold text-foreground">৳{localFilters.priceRange[0]}</span>
                </div>
                <div className="h-px w-4 bg-border" />
                <div className="bg-card px-4 py-2 rounded-lg border border-border">
                  <span className="text-muted-foreground">Max: </span>
                  <span className="font-semibold text-foreground">৳{localFilters.priceRange[1]}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Sizes */}
          {sortedSizes.length > 0 && (
            <Collapsible open={openSections.sizes} onOpenChange={() => toggleSection('sizes')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left bg-muted/50 rounded-xl px-4">
                <span className="font-medium text-foreground">Sizes</span>
                <div className="flex items-center gap-2">
                  {localFilters.sizes.length > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {localFilters.sizes.length}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.sizes ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {sortedSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        localFilters.sizes.includes(size)
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
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
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left bg-muted/50 rounded-xl px-4">
                <span className="font-medium text-foreground">Colors</span>
                <div className="flex items-center gap-2">
                  {localFilters.colors.length > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {localFilters.colors.length}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.colors ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {availableColors.map((color) => {
                    const isSelected = localFilters.colors.includes(color);
                    const colorHex = COLOR_MAP[color] || '#888888';
                    const isLight = colorHex === '#FFFFFF' || colorHex === '#FFFDD0';

                    return (
                      <button
                        key={color}
                        onClick={() => handleColorToggle(color)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                            isLight ? 'border-border' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: colorHex }}
                        >
                          {isSelected && (
                            <Check className={`h-3.5 w-3.5 ${isLight ? 'text-foreground' : 'text-white'}`} />
                          )}
                        </div>
                        <span className="text-sm font-medium">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Sticky Footer */}
        <DrawerFooter className="border-t border-border pt-4 bg-background">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 rounded-xl h-12">
                Cancel
              </Button>
            </DrawerClose>
            <Button onClick={handleApply} className="flex-1 rounded-xl h-12 gap-2">
              <Check className="h-4 w-4" />
              Apply Filters
              {localFiltersCount > 0 && (
                <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs">
                  {localFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
