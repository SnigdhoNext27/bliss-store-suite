import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Palette, DollarSign, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface FiltersState {
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  onSale: boolean;
}

interface AdvancedFiltersProps {
  maxPrice?: number;
  availableColors?: string[];
  availableSizes?: string[];
  onFiltersChange: (filters: FiltersState) => void;
  activeFiltersCount?: number;
}

const defaultColors = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Brown', value: '#92400e' },
  { name: 'Beige', value: '#d4b896' },
  { name: 'Pink', value: '#ec4899' },
];

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function AdvancedFilters({
  maxPrice = 10000,
  availableColors = defaultColors.map(c => c.name),
  availableSizes = defaultSizes,
  onFiltersChange,
  activeFiltersCount = 0,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: [0, maxPrice],
    colors: [],
    sizes: [],
    inStock: false,
    onSale: false,
  });
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    color: true,
    size: true,
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleColor = (color: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color],
    }));
  };

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, maxPrice],
      colors: [],
      sizes: [],
      inStock: false,
      onSale: false,
    });
  };

  const getActiveCount = () => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) count++;
    count += filters.colors.length;
    count += filters.sizes.length;
    if (filters.inStock) count++;
    if (filters.onSale) count++;
    return count;
  };

  const activeCount = getActiveCount();

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <Collapsible open={expandedSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-medium">Price Range</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            expandedSections.price && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              min={0}
              max={maxPrice}
              step={100}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>৳{filters.priceRange[0].toLocaleString()}</span>
              <span>৳{filters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Colors */}
      <Collapsible open={expandedSections.color} onOpenChange={() => toggleSection('color')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="font-medium">Color</span>
            {filters.colors.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.colors.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            expandedSections.color && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {defaultColors.map((color) => (
              <motion.button
                key={color.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleColor(color.name)}
                className={cn(
                  "relative w-8 h-8 rounded-full border-2 transition-all",
                  filters.colors.includes(color.name)
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {filters.colors.includes(color.name) && (
                  <Check className={cn(
                    "h-4 w-4 absolute inset-0 m-auto",
                    color.name === 'White' || color.name === 'Beige' ? "text-gray-800" : "text-white"
                  )} />
                )}
              </motion.button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sizes */}
      <Collapsible open={expandedSections.size} onOpenChange={() => toggleSection('size')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Size</span>
            {filters.sizes.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.sizes.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            expandedSections.size && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <motion.button
                key={size}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSize(size)}
                className={cn(
                  "min-w-[3rem] px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  filters.sizes.includes(size)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {size}
              </motion.button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Availability */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label htmlFor="in-stock" className="cursor-pointer">In Stock Only</Label>
          <Checkbox
            id="in-stock"
            checked={filters.inStock}
            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: !!checked }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="on-sale" className="cursor-pointer">On Sale</Label>
          <Checkbox
            id="on-sale"
            checked={filters.onSale}
            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onSale: !!checked }))}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={clearFilters} className="flex-1">
          Clear All
        </Button>
        <Button onClick={() => setOpen(false)} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary">{activeCount} active</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          <FilterContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
