import jsPDF from 'jspdf';

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

export async function generateOrderInvoice(order: Order): Promise<void> {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = '#1a1a1a';
  const mutedColor = '#6b7280';
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text('ALMANS', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(mutedColor);
  doc.text('Premium Fashion Store', 20, 32);
  
  // Invoice Title
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.text('INVOICE', 150, 25);
  
  // Order Info
  doc.setFontSize(10);
  doc.setTextColor(mutedColor);
  doc.text(`Invoice #: ${order.order_number}`, 150, 35);
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 150, 42);
  doc.text(`Status: ${order.status.toUpperCase()}`, 150, 49);
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);
  
  // Billing Address
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.text('Bill To:', 20, 65);
  
  doc.setFontSize(10);
  doc.setTextColor(mutedColor);
  const address = order.shipping_address;
  doc.text(address.full_name || 'Customer', 20, 73);
  if (address.address) doc.text(address.address, 20, 80);
  if (address.city) doc.text(address.city, 20, 87);
  if (address.phone) doc.text(`Phone: ${address.phone}`, 20, 94);
  
  // Items Table Header
  let yPos = 110;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPos - 5, 170, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  doc.text('Item', 25, yPos);
  doc.text('Size', 100, yPos);
  doc.text('Qty', 130, yPos);
  doc.text('Price', 150, yPos);
  doc.text('Total', 175, yPos);
  
  yPos += 10;
  
  // Items
  doc.setTextColor(mutedColor);
  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      
      // Truncate long product names
      const productName = item.product_name.length > 35 
        ? item.product_name.substring(0, 35) + '...'
        : item.product_name;
      
      doc.text(productName, 25, yPos);
      doc.text(item.size || '-', 100, yPos);
      doc.text(item.quantity.toString(), 130, yPos);
      doc.text(`৳${item.price.toLocaleString()}`, 150, yPos);
      doc.text(`৳${itemTotal.toLocaleString()}`, 175, yPos);
      
      yPos += 8;
    });
  }
  
  // Divider before totals
  yPos += 5;
  doc.line(120, yPos, 190, yPos);
  yPos += 10;
  
  // Totals
  doc.setTextColor(mutedColor);
  doc.text('Subtotal:', 130, yPos);
  doc.text(`৳${order.subtotal.toLocaleString()}`, 175, yPos);
  
  yPos += 8;
  doc.text('Delivery:', 130, yPos);
  doc.text(`৳${order.delivery_fee.toLocaleString()}`, 175, yPos);
  
  if (order.discount && order.discount > 0) {
    yPos += 8;
    doc.setTextColor('#16a34a');
    doc.text('Discount:', 130, yPos);
    doc.text(`-৳${order.discount.toLocaleString()}`, 175, yPos);
  }
  
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(120, yPos, 190, yPos);
  yPos += 8;
  
  // Grand Total
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text('Total:', 130, yPos);
  doc.text(`৳${order.total.toLocaleString()}`, 175, yPos);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(mutedColor);
  doc.text('Thank you for shopping with Almans!', 105, 270, { align: 'center' });
  doc.text('www.almans.com | support@almans.com', 105, 277, { align: 'center' });
  
  // Save PDF
  doc.save(`almans-invoice-${order.order_number}.pdf`);
}
