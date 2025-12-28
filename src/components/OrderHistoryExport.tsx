import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  created_at: string;
  shipping_address: {
    full_name?: string;
    address?: string;
    area?: string;
    phone?: string;
  };
  order_items?: OrderItem[];
}

interface OrderHistoryExportProps {
  orders: Order[];
}

export function OrderHistoryExport({ orders }: OrderHistoryExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Order History', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${format(new Date(), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Total Orders: ${orders.length}`, pageWidth / 2, 34, { align: 'center' });
      
      let yPosition = 50;
      
      orders.forEach((order, index) => {
        // Check if we need a new page
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Order header with background
        doc.setFillColor(245, 245, 245);
        doc.rect(10, yPosition - 5, pageWidth - 20, 10, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order #${order.order_number}`, 15, yPosition);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const statusText = `${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | ${format(new Date(order.created_at), 'PPP')}`;
        doc.text(statusText, pageWidth - 15, yPosition, { align: 'right' });
        
        yPosition += 12;
        
        // Shipping info
        if (order.shipping_address?.full_name) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`Ship to: ${order.shipping_address.full_name}`, 15, yPosition);
          yPosition += 5;
        }
        
        if (order.shipping_address?.address) {
          const addressLines = doc.splitTextToSize(`${order.shipping_address.address}`, pageWidth - 30);
          doc.text(addressLines, 15, yPosition);
          yPosition += addressLines.length * 4;
        }
        
        doc.setTextColor(0, 0, 0);
        yPosition += 3;
        
        // Order items
        if (order.order_items && order.order_items.length > 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Items:', 15, yPosition);
          yPosition += 5;
          
          doc.setFont('helvetica', 'normal');
          order.order_items.forEach((item) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            
            const sizeColor = [item.size, item.color].filter(Boolean).join(', ');
            const itemText = `• ${item.product_name}${sizeColor ? ` (${sizeColor})` : ''} × ${item.quantity}`;
            const priceText = `৳${(item.price * item.quantity).toLocaleString()}`;
            
            doc.text(itemText, 20, yPosition);
            doc.text(priceText, pageWidth - 15, yPosition, { align: 'right' });
            yPosition += 5;
          });
        }
        
        yPosition += 3;
        
        // Order totals
        if (order.subtotal !== undefined) {
          doc.setFontSize(9);
          doc.text(`Subtotal: ৳${order.subtotal.toLocaleString()}`, pageWidth - 15, yPosition, { align: 'right' });
          yPosition += 4;
        }
        if (order.delivery_fee !== undefined) {
          doc.text(`Delivery: ৳${order.delivery_fee.toLocaleString()}`, pageWidth - 15, yPosition, { align: 'right' });
          yPosition += 4;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Total: ৳${order.total.toLocaleString()}`, pageWidth - 15, yPosition, { align: 'right' });
        
        yPosition += 12;
        
        // Separator line
        if (index < orders.length - 1) {
          doc.setDrawColor(220, 220, 220);
          doc.line(15, yPosition - 5, pageWidth - 15, yPosition - 5);
        }
      });
      
      // Summary footer
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      yPosition += 5;
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPosition - 3, pageWidth - 20, 16, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 15, yPosition + 4);
      doc.text(`${orders.length} Orders | Total Spent: ৳${totalSpent.toLocaleString()}`, pageWidth - 15, yPosition + 4, { align: 'right' });
      
      doc.save(`order-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'PDF downloaded successfully!' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Failed to export PDF', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Headers for order-level data
      const headers = [
        'Order Number',
        'Date',
        'Status',
        'Recipient',
        'Address',
        'Area',
        'Item Name',
        'Size',
        'Color',
        'Quantity',
        'Item Price',
        'Order Subtotal',
        'Delivery Fee',
        'Order Total'
      ];
      
      const rows: string[][] = [];
      
      orders.forEach(order => {
        if (order.order_items && order.order_items.length > 0) {
          // One row per item
          order.order_items.forEach((item, itemIndex) => {
            rows.push([
              itemIndex === 0 ? order.order_number : '', // Only show order number on first item
              itemIndex === 0 ? format(new Date(order.created_at), 'yyyy-MM-dd') : '',
              itemIndex === 0 ? order.status : '',
              itemIndex === 0 ? (order.shipping_address?.full_name || '') : '',
              itemIndex === 0 ? `"${(order.shipping_address?.address || '').replace(/"/g, '""')}"` : '',
              itemIndex === 0 ? (order.shipping_address?.area || '') : '',
              `"${item.product_name.replace(/"/g, '""')}"`,
              item.size || '',
              item.color || '',
              item.quantity.toString(),
              item.price.toString(),
              itemIndex === 0 ? (order.subtotal?.toString() || order.total.toString()) : '',
              itemIndex === 0 ? (order.delivery_fee?.toString() || '0') : '',
              itemIndex === 0 ? order.total.toString() : '',
            ]);
          });
        } else {
          // Order without items
          rows.push([
            order.order_number,
            format(new Date(order.created_at), 'yyyy-MM-dd'),
            order.status,
            order.shipping_address?.full_name || '',
            `"${(order.shipping_address?.address || '').replace(/"/g, '""')}"`,
            order.shipping_address?.area || '',
            '',
            '',
            '',
            '',
            '',
            order.subtotal?.toString() || order.total.toString(),
            order.delivery_fee?.toString() || '0',
            order.total.toString(),
          ]);
        }
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `order-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      
      toast({ title: 'CSV downloaded successfully!' });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({ title: 'Failed to export CSV', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  if (orders.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
