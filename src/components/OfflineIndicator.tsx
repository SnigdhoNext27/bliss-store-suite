import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOfflineData';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-full shadow-lg md:top-20"
        >
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
