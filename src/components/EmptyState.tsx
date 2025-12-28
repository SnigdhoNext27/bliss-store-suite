import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Heart, 
  Package, 
  Search, 
  Bell,
  MessageCircle,
  Users,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateType = 'cart' | 'wishlist' | 'orders' | 'search' | 'notifications' | 'messages' | 'referrals' | 'reviews';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: typeof ShoppingBag;
  defaultTitle: string;
  defaultDescription: string;
  illustration: string;
}> = {
  cart: {
    icon: ShoppingBag,
    defaultTitle: 'Your bag is empty',
    defaultDescription: 'Looks like you haven\'t added any items to your bag yet.',
    illustration: '🛒',
  },
  wishlist: {
    icon: Heart,
    defaultTitle: 'Your wishlist is empty',
    defaultDescription: 'Save items you love by clicking the heart icon.',
    illustration: '💝',
  },
  orders: {
    icon: Package,
    defaultTitle: 'No orders yet',
    defaultDescription: 'Your order history will appear here after your first purchase.',
    illustration: '📦',
  },
  search: {
    icon: Search,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search or filter to find what you\'re looking for.',
    illustration: '🔍',
  },
  notifications: {
    icon: Bell,
    defaultTitle: 'No notifications',
    defaultDescription: 'You\'re all caught up! Check back later for updates.',
    illustration: '🔔',
  },
  messages: {
    icon: MessageCircle,
    defaultTitle: 'No messages',
    defaultDescription: 'Start a conversation or wait for replies.',
    illustration: '💬',
  },
  referrals: {
    icon: Users,
    defaultTitle: 'No referrals yet',
    defaultDescription: 'Share your referral link and start earning rewards!',
    illustration: '🤝',
  },
  reviews: {
    icon: Star,
    defaultTitle: 'No reviews yet',
    defaultDescription: 'Be the first to share your experience!',
    illustration: '⭐',
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      {/* Animated Illustration */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: 'reverse', 
          duration: 2,
          ease: 'easeInOut',
        }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-5xl">{config.illustration}</span>
        </div>
        
        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              y: [-10, -30, -10],
              x: [0, (i - 1) * 20, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
            }}
            className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-primary/30"
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-display text-xl font-bold mb-2">
          {title || config.defaultTitle}
        </h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          {description || config.defaultDescription}
        </p>

        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2">
            <Icon className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
