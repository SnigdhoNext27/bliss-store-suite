import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, Heart, User, Briefcase } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/lib/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// Account removed from bottom nav - it's in the header
const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: ShoppingBag, label: 'Shop', path: '/shop' },
  { icon: Briefcase, label: 'My Bag', path: 'cart' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist' },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleCart, items } = useCartStore();
  const { wishlistIds } = useWishlist();
  const { user } = useAuth();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistIds.length;

  const handleNavigation = (item: typeof navItems[0]) => {
    if (item.path === 'cart') {
      toggleCart();
    } else if (item.path === '/account' && !user) {
      navigate('/auth');
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path: string) => {
    if (path === 'cart') return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Don't show on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <TooltipProvider delayDuration={300}>
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-[60px] px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const showBadge = 
            (item.path === 'cart' && cartCount > 0) || 
            (item.path === '/wishlist' && wishlistCount > 0);
          const badgeCount = item.path === 'cart' ? cartCount : wishlistCount;

          const isCart = item.path === 'cart';
          const tooltipContent = isCart && cartCount > 0 
            ? `${cartCount} item${cartCount > 1 ? 's' : ''} in bag`
            : null;

          const buttonContent = (
            <button
              key={item.label}
              onClick={() => handleNavigation(item)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all active:scale-95"
            >
              <motion.div
                className={`relative p-2.5 rounded-2xl transition-all duration-200 ${
                  active 
                    ? 'bg-primary/12 text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon className={`h-5 w-5 transition-all ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                
                {/* Badge with pulse animation */}
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full shadow-sm"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </motion.span>
                )}
              </motion.div>
              
              <span className={`text-[10px] mt-0.5 font-medium transition-all ${
                active ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>

              {/* Active indicator pill */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0.5 w-8 h-1 bg-gradient-to-r from-primary to-primary/70 rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );

          if (tooltipContent) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-foreground text-background text-xs px-3 py-1.5 rounded-lg">
                  {tooltipContent}
                </TooltipContent>
              </Tooltip>
            );
          }

          return buttonContent;
        })}
      </div>
    </motion.nav>
    </TooltipProvider>
  );
}
