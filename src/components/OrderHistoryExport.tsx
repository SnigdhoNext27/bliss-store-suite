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

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  subtotal?: number;
  delivery_fee?: number;
  shipping_address: {
    full_name?: string;
    address?: string;
    area?: string;
    phone?: string;
  };
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
      
      let yPosition = 45;
      
      orders.forEach((order, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Order header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order #${order.order_number}`, 15, yPosition);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(format(new Date(order.created_at), 'PPP'), pageWidth - 15, yPosition, { align: 'right' });
        
        yPosition += 8;
        
        // Order details
        doc.setFontSize(10);
        doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 15, yPosition);
        yPosition += 6;
        
        if (order.shipping_address?.full_name) {
          doc.text(`Ship to: ${order.shipping_address.full_name}`, 15, yPosition);
          yPosition += 6;
        }
        
        if (order.shipping_address?.address) {
          const addressLines = doc.splitTextToSize(`Address: ${order.shipping_address.address}`, pageWidth - 30);
          doc.text(addressLines, 15, yPosition);
          yPosition += addressLines.length * 5;
        }
        
        // Total
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ৳${order.total.toLocaleString()}`, 15, yPosition);
        
        yPosition += 15;
        
        // Separator line
        if (index < orders.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(15, yPosition - 5, pageWidth - 15, yPosition - 5);
        }
      });
      
      // Summary footer
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`Total Orders: ${orders.length}`, 15, yPosition + 10);
      doc.text(`Total Spent: ৳${totalSpent.toLocaleString()}`, 15, yPosition + 18);
      
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
      const headers = ['Order Number', 'Date', 'Status', 'Recipient', 'Address', 'Area', 'Total'];
      
      const rows = orders.map(order => [
        order.order_number,
        format(new Date(order.created_at), 'yyyy-MM-dd'),
        order.status,
        order.shipping_address?.full_name || '',
        `"${(order.shipping_address?.address || '').replace(/"/g, '""')}"`,
        order.shipping_address?.area || '',
        order.total.toString(),
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
