import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import { usePerformance } from '@/hooks/usePerformance';

// Import AI-generated category banners
import categoryShirts from '@/assets/category-shirts.jpg';
import categoryTshirts from '@/assets/category-tshirts.jpg';
import categoryPants from '@/assets/category-pants.jpg';
import categoryTrousers from '@/assets/category-trousers.jpg';
import categoryCaps from '@/assets/category-caps.jpg';
import categoryGadgets from '@/assets/category-gadgets.jpg';
import categoryAccessories from '@/assets/category-accessories.jpg';

interface CategoryCardProps {
  name: string;
  slug: string;
  image?: string | null;
  productCount: number;
  isComingSoon?: boolean;
  index: number;
}

// Map slugs to imported banner images
const CATEGORY_BANNERS: Record<string, string> = {
  'shirts': categoryShirts,
  't-shirts': categoryTshirts,
  'pants': categoryPants,
  'trousers': categoryTrousers,
  'caps': categoryCaps,
  'gadgets': categoryGadgets,
  'accessories': categoryAccessories,
};

export const CategoryCard = memo(function CategoryCard({ 
  name, 
  slug, 
  image, 
  productCount, 
  isComingSoon, 
  index 
}: CategoryCardProps) {
  const navigate = useNavigate();
  const { shouldReduceAnimations, enableHoverEffects } = usePerformance();

  const handleClick = () => {
    if (!isComingSoon) {
      navigate(`/category/${slug}`);
    }
  };

  // Use database image first, then fallback to generated banners
  const bannerImage = image || CATEGORY_BANNERS[slug];

  // Use simplified wrapper on low-end devices
  const Wrapper = shouldReduceAnimations ? 'div' : motion.div;
  const wrapperProps = shouldReduceAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay: Math.min(index * 0.1, 0.3) },
    whileHover: enableHoverEffects ? { y: -8, scale: 1.02 } : undefined,
  };

  return (
    <Wrapper
      {...wrapperProps}
      onClick={handleClick}
      className={`
        relative group cursor-pointer rounded-2xl overflow-hidden
        bg-gradient-to-br from-card to-secondary/50
        border border-border/50 shadow-lg
        transition-all duration-300
        ${isComingSoon ? 'opacity-80' : 'hover:shadow-2xl hover:border-primary/30'}
      `}
    >
      {/* Background Image */}
      <div className="aspect-[4/3] relative overflow-hidden">
        <div className={`w-full h-full ${!shouldReduceAnimations ? 'transition-transform duration-500 group-hover:scale-110' : ''} ${isComingSoon ? 'grayscale' : ''}`}>
          <OptimizedImage
            src={bannerImage}
            alt={name}
            className="w-full h-full"
            preset="category"
          />
        </div>
        
        {/* Soft Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
        
        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <Clock className="h-3 w-3" />
            Coming Soon
          </div>
        )}
        
        {/* Product Count Badge */}
        {!isComingSoon && productCount > 0 && (
          <div className={`absolute top-3 right-3 bg-background/80 ${!shouldReduceAnimations ? 'backdrop-blur-sm' : ''} text-foreground px-3 py-1 rounded-full text-xs font-medium border border-border/50`}>
            {productCount} {productCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 bg-gradient-to-b from-card/80 to-card">
        <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isComingSoon 
            ? 'Exciting products coming soon!' 
            : `Explore our ${name.toLowerCase()} collection`
          }
        </p>
        
        {/* Hover Arrow - simplified on low-end */}
        {!isComingSoon && (
          <div className={`mt-3 flex items-center gap-2 text-primary ${shouldReduceAnimations ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
            <span className="text-sm font-medium">Shop Now</span>
            <span>→</span>
          </div>
        )}
      </div>
    </Wrapper>
  );
});
