import { useState } from 'react';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface OrderCancelButtonProps {
  orderId: string;
  orderNumber: string;
  status: string;
  onCancelled?: () => void;
}

export function OrderCancelButton({ orderId, orderNumber, status, onCancelled }: OrderCancelButtonProps) {
  const [cancelling, setCancelling] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Only allow cancellation for pending orders
  const canCancel = status === 'pending';

  if (!canCancel) {
    return null;
  }

  const handleCancel = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to cancel orders',
        variant: 'destructive'
      });
      return;
    }

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .eq('status', 'pending'); // Extra check to ensure only pending orders can be cancelled

      if (error) throw error;

      toast({
        title: 'Order Cancelled',
        description: `Order #${orderNumber} has been cancelled successfully.`
      });
      
      setOpen(false);
      onCancelled?.();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Failed to cancel order',
        description: 'Please try again or contact support.',
        variant: 'destructive'
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Order #{orderNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your order will be cancelled and you will not receive the items.
            If you've already made a payment, please contact our support for a refund.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelling}>Keep Order</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel Order'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
