import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CategoryCard } from './CategoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

// Define static categories including coming soon ones
const STATIC_CATEGORIES = [
  { name: 'Shirts', slug: 'shirts' },
  { name: 'T-Shirts', slug: 't-shirts' },
  { name: 'Pants', slug: 'pants' },
  { name: 'Trousers', slug: 'trousers' },
  { name: 'Caps', slug: 'caps' },
  { name: 'Gadgets', slug: 'gadgets', isComingSoon: true },
  { name: 'Accessories', slug: 'accessories', isComingSoon: true },
];

export function ShopCategoriesGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { products } = useProducts();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, image_url');
      
      if (data) {
        setCategories(data);
      }
    };
    
    fetchCategories();
  }, []);

  // Merge static categories with database categories
  const displayCategories = STATIC_CATEGORIES.map((staticCat) => {
    const dbCategory = categories.find(
      c => c.slug === staticCat.slug || c.name.toLowerCase() === staticCat.name.toLowerCase()
    );
    
    const productCount = products.filter(
      p => p.category.toLowerCase() === staticCat.name.toLowerCase()
    ).length;

    return {
      id: dbCategory?.id || staticCat.slug,
      name: staticCat.name,
      slug: dbCategory?.slug || staticCat.slug,
      // Use database image_url if uploaded by admin, otherwise null (CategoryCard will use AI fallback)
      image_url: dbCategory?.image_url || null,
      productCount,
      isComingSoon: staticCat.isComingSoon || false,
    };
  });

  return (
    <section className="py-16 bg-gradient-to-b from-secondary/30 via-accent/10 to-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm tracking-widest uppercase mb-2 block">
            Explore Our Collection
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Shop By Category
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover premium fashion essentials organized by category. 
            Click on any category to explore our curated collection.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayCategories.map((cat, index) => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              image={cat.image_url}
              productCount={cat.productCount}
              isComingSoon={cat.isComingSoon}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
