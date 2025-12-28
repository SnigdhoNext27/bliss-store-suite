import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface AnalyticsData {
  salesTrend: { date: string; revenue: number; orders: number }[];
  orderStatus: { name: string; value: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  categoryPerformance: { name: string; quantity: number; revenue: number }[];
  customerAnalytics?: {
    newCustomers: number;
    returningCustomers: number;
    avgOrderValue: number;
    avgLifetimeValue: number;
  };
  dateRange: { from: Date; to: Date };
}

interface AnalyticsExportProps {
  data: AnalyticsData;
}

export function AnalyticsExport({ data }: AnalyticsExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const exportCSV = () => {
    setExporting(true);
    try {
      let csvContent = '';
      
      // Header
      csvContent += `Analytics Report\n`;
      csvContent += `Period: ${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}\n\n`;
      
      // Sales Trend
      csvContent += `Sales Trend\n`;
      csvContent += `Date,Revenue,Orders\n`;
      data.salesTrend.forEach(row => {
        csvContent += `${row.date},${row.revenue},${row.orders}\n`;
      });
      csvContent += `\n`;
      
      // Order Status
      csvContent += `Order Status Distribution\n`;
      csvContent += `Status,Count\n`;
      data.orderStatus.forEach(row => {
        csvContent += `${row.name},${row.value}\n`;
      });
      csvContent += `\n`;
      
      // Top Products
      csvContent += `Top Selling Products\n`;
      csvContent += `Product,Quantity Sold,Revenue\n`;
      data.topProducts.forEach(row => {
        csvContent += `"${row.name}",${row.quantity},${row.revenue}\n`;
      });
      csvContent += `\n`;
      
      // Category Performance
      csvContent += `Category Performance\n`;
      csvContent += `Category,Quantity Sold,Revenue\n`;
      data.categoryPerformance.forEach(row => {
        csvContent += `"${row.name}",${row.quantity},${row.revenue}\n`;
      });
      csvContent += `\n`;
      
      // Customer Analytics
      if (data.customerAnalytics) {
        csvContent += `Customer Analytics\n`;
        csvContent += `New Customers,${data.customerAnalytics.newCustomers}\n`;
        csvContent += `Returning Customers,${data.customerAnalytics.returningCustomers}\n`;
        csvContent += `Avg Order Value,${data.customerAnalytics.avgOrderValue.toFixed(2)}\n`;
        csvContent += `Avg Lifetime Value,${data.customerAnalytics.avgLifetimeValue.toFixed(2)}\n`;
      }

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${formatDate(data.dateRange.from)}-to-${formatDate(data.dateRange.to)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: 'CSV exported successfully' });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
      const lineHeight = 7;
      const margin = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Analytics Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Date Range
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Sales Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Summary', margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const totalRevenue = data.salesTrend.reduce((sum, row) => sum + row.revenue, 0);
      const totalOrders = data.salesTrend.reduce((sum, row) => sum + row.orders, 0);
      doc.text(`Total Revenue: BDT ${totalRevenue.toLocaleString()}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Total Orders: ${totalOrders}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Average Order Value: BDT ${totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}`, margin, yPos);
      yPos += 15;

      // Order Status
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Order Status Distribution', margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      data.orderStatus.forEach(status => {
        doc.text(`${status.name}: ${status.value}`, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 8;

      // Top Products
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Selling Products', margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      data.topProducts.slice(0, 5).forEach((product, index) => {
        doc.text(`${index + 1}. ${product.name.substring(0, 40)} - ${product.quantity} sold - BDT ${product.revenue.toLocaleString()}`, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 8;

      // Category Performance
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Category Performance', margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      data.categoryPerformance.forEach(cat => {
        doc.text(`${cat.name}: ${cat.quantity} sold - BDT ${cat.revenue.toLocaleString()}`, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 8;

      // Customer Analytics
      if (data.customerAnalytics) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Analytics', margin, yPos);
        yPos += lineHeight;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`New Customers: ${data.customerAnalytics.newCustomers}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Returning Customers: ${data.customerAnalytics.returningCustomers}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Average Order Value: BDT ${data.customerAnalytics.avgOrderValue.toLocaleString()}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Average Customer Lifetime Value: BDT ${data.customerAnalytics.avgLifetimeValue.toLocaleString()}`, margin, yPos);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: 'center' });

      // Save
      doc.save(`analytics-${formatDate(data.dateRange.from)}-to-${formatDate(data.dateRange.to)}.pdf`);

      toast({ title: 'PDF exported successfully' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
