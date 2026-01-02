import { useState } from 'react';
import { Plus, Minus, Trash2, Loader2, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  size: string | null;
  quantity: number;
  price: number;
}

interface OrderModificationProps {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  onUpdate: () => void;
}

export function OrderModification({ 
  orderId, 
  orderNumber, 
  items: initialItems, 
  subtotal: initialSubtotal,
  deliveryFee,
  onUpdate 
}: OrderModificationProps) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const { toast } = useToast();

  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = calculatedSubtotal + deliveryFee;

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
    setHasChanges(true);
  };

  const confirmRemoveItem = (itemId: string) => {
    setItemToRemove(itemId);
    setConfirmDialogOpen(true);
  };

  const removeItem = () => {
    if (!itemToRemove) return;
    
    if (items.length <= 1) {
      toast({
        title: 'Cannot remove',
        description: 'Order must have at least one item. Cancel the order instead.',
        variant: 'destructive'
      });
      setConfirmDialogOpen(false);
      return;
    }
    
    setItems(prev => prev.filter(item => item.id !== itemToRemove));
    setHasChanges(true);
    setConfirmDialogOpen(false);
    setItemToRemove(null);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Update each item's quantity
      for (const item of items) {
        const originalItem = initialItems.find(i => i.id === item.id);
        if (originalItem && originalItem.quantity !== item.quantity) {
          const { error } = await supabase
            .from('order_items')
            .update({ quantity: item.quantity })
            .eq('id', item.id);
          
          if (error) throw error;
        }
      }

      // Remove deleted items
      const removedItemIds = initialItems
        .filter(orig => !items.find(curr => curr.id === orig.id))
        .map(item => item.id);

      for (const itemId of removedItemIds) {
        const { error } = await supabase
          .from('order_items')
          .delete()
          .eq('id', itemId);
        
        if (error) throw error;
      }

      // Update order totals
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          subtotal: calculatedSubtotal,
          total: total
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      toast({
        title: 'Order updated',
        description: 'Your order has been successfully modified.'
      });
      
      setHasChanges(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Failed to update',
        description: 'Could not save changes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Modification Notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-sm">You can modify this order while it's still pending.</p>
      </div>

      {/* Editable Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {item.product_image ? (
              <img
                src={item.product_image}
                alt={item.product_name}
                className="w-14 h-14 object-cover rounded-lg"
              />
            ) : (
              <div className="w-14 h-14 bg-muted rounded-lg" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.product_name}</p>
              {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
              <p className="text-sm font-medium mt-1">৳{item.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => confirmRemoveItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Updated Totals */}
      {hasChanges && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium mb-2">Updated Order Total</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳{calculatedSubtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>৳{deliveryFee.toFixed(0)}</span>
            </div>
            <hr className="my-2 border-border" />
            <div className="flex justify-between font-bold">
              <span>New Total</span>
              <span className="text-primary">৳{total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <Button 
          onClick={saveChanges} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
