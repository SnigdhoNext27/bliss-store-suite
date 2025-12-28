import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface GiftWrapOptionProps {
  enabled: boolean;
  message: string;
  onToggle: (enabled: boolean) => void;
  onMessageChange: (message: string) => void;
  price?: number;
}

export function GiftWrapOption({
  enabled,
  message,
  onToggle,
  onMessageChange,
  price = 50,
}: GiftWrapOptionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-xl p-4 transition-colors",
        enabled ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <Label className="font-medium cursor-pointer" htmlFor="gift-wrap">
              Add Gift Wrapping
            </Label>
            <p className="text-sm text-muted-foreground">
              +৳{price} • Beautiful gift packaging with ribbon
            </p>
          </div>
        </div>
        <Switch
          id="gift-wrap"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="gift-message" className="text-sm">
                Gift Message (Optional)
              </Label>
            </div>
            <Textarea
              id="gift-message"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Write a personalized message for the recipient..."
              className="resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {message.length}/200 characters
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
