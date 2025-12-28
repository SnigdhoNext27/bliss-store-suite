import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateOrderInvoice } from '@/lib/invoiceGenerator';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  discount?: number | null;
  total: number;
  shipping_address: {
    full_name?: string;
    address?: string;
    phone?: string;
    city?: string;
  };
  items?: OrderItem[];
}

interface InvoiceDownloadButtonProps {
  order: Order;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function InvoiceDownloadButton({ 
  order, 
  variant = 'outline', 
  size = 'sm',
  showLabel = true 
}: InvoiceDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    
    try {
      await generateOrderInvoice(order);
      toast({ title: 'Invoice downloaded!' });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({ 
        title: 'Failed to generate invoice', 
        variant: 'destructive' 
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-2">Invoice</span>}
    </Button>
  );
}
