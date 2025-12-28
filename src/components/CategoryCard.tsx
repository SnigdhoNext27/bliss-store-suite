import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shirt, Clock, Sparkles } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  slug: string;
  image?: string | null;
  productCount: number;
  isComingSoon?: boolean;
  index: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'shirts': <Shirt className="h-8 w-8" />,
  't-shirts': <Shirt className="h-8 w-8" />,
  'pants': <Shirt className="h-8 w-8 rotate-180" />,
  'trousers': <Shirt className="h-8 w-8 rotate-180" />,
  'caps': <Sparkles className="h-8 w-8" />,
  'accessories': <Sparkles className="h-8 w-8" />,
  'gadgets': <Sparkles className="h-8 w-8" />,
};

export function CategoryCard({ name, slug, image, productCount, isComingSoon, index }: CategoryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isComingSoon) {
      navigate(`/category/${slug}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={handleClick}
      className={`
        relative group cursor-pointer rounded-2xl overflow-hidden
        bg-gradient-to-br from-card to-secondary/50
        border border-border/50 shadow-lg
        transition-all duration-300
        ${isComingSoon ? 'opacity-80' : 'hover:shadow-2xl hover:border-primary/30'}
      `}
    >
      {/* Background Image or Gradient */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-accent/30 flex items-center justify-center">
            {CATEGORY_ICONS[slug] || <Sparkles className="h-12 w-12 text-primary/60" />}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        
        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <Clock className="h-3 w-3" />
            Coming Soon
          </div>
        )}
        
        {/* Product Count Badge */}
        {!isComingSoon && productCount > 0 && (
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs font-medium border border-border/50">
            {productCount} {productCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isComingSoon 
            ? 'Exciting products coming soon!' 
            : `Explore our ${name.toLowerCase()} collection`
          }
        </p>
        
        {/* Hover Arrow */}
        {!isComingSoon && (
          <div className="mt-3 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-sm font-medium">Shop Now</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
