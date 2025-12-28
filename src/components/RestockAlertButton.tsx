import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRestockAlert } from '@/hooks/useRestockAlert';
import { useAuth } from '@/lib/auth';

interface RestockAlertButtonProps {
  productId: string;
  productName: string;
}

export function RestockAlertButton({ productId, productName }: RestockAlertButtonProps) {
  const { user } = useAuth();
  const { isAlertSet, loading: isLoading, setAlert, removeAlert, checkAlert } = useRestockAlert(productId);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check for existing alert on mount
  useEffect(() => {
    if (user) {
      checkAlert();
    }
  }, [user, checkAlert]);

  const handleSetAlert = async () => {
    if (!user && !email) return;
    
    setSubmitting(true);
    const success = await setAlert(email || undefined);
    setSubmitting(false);
    
    if (success) {
      setOpen(false);
      setEmail('');
    }
  };

  const handleRemoveAlert = async () => {
    setSubmitting(true);
    await removeAlert();
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAlertSet) {
    return (
      <Button
        variant="outline"
        onClick={handleRemoveAlert}
        disabled={submitting}
        className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        Cancel Restock Alert
      </Button>
    );
  }

  // If user is logged in, set alert directly
  if (user) {
    return (
      <Button
        variant="outline"
        onClick={() => setAlert()}
        disabled={submitting}
        className="w-full gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        Notify Me When Available
      </Button>
    );
  }

  // For guests, show email input dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <Bell className="h-4 w-4" />
          Notify Me When Available
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Notified When Back in Stock</DialogTitle>
          <DialogDescription>
            We'll email you when <strong>{productName}</strong> is available again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="restock-email">Email Address</Label>
            <Input
              id="restock-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSetAlert}
            disabled={!email || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting Alert...
              </>
            ) : (
              'Notify Me'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
