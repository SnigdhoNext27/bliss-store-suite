import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Heart, User, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Grid3X3, label: 'Shop', path: '/shop' },
  { icon: ShoppingBag, label: 'Cart', path: '/cart', isCart: true },
  { icon: Heart, label: 'Wishlist', path: '/wishlist', isWishlist: true },
  { icon: User, label: 'Account', path: '/account' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems, openCart } = useCartStore();
  const { wishlistIds } = useWishlist();
  const cartCount = getTotalItems();
  const wishlistCount = wishlistIds.length;

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isCart) {
      openCart();
    } else {
      navigate(item.path);
    }
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const badgeCount = item.isCart ? cartCount : item.isWishlist ? wishlistCount : 0;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 relative min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
