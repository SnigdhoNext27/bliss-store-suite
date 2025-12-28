import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Package, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { logAdminAction } from '@/lib/auditLog';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_fee: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address: any;
  notes: string | null;
  created_at: string;
}

const statusOptions: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    if (!printRef.current || !selectedOrder) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${selectedOrder.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #333; }
            .print-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #333; }
            .print-header h1 { font-size: 24px; margin-bottom: 4px; }
            .print-header p { color: #666; font-size: 14px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 600; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .info-item label { font-size: 12px; color: #666; display: block; }
            .info-item p { font-weight: 500; }
            .address-box { background: #f5f5f5; padding: 12px; border-radius: 4px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .items-table th { background: #f5f5f5; font-weight: 600; font-size: 12px; }
            .totals { margin-left: auto; width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; border-bottom: none; padding-top: 12px; }
            .notes { background: #fffde7; padding: 12px; border-radius: 4px; font-size: 14px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems((data || []) as OrderItem[]);
    } catch (error) {
      console.error('Fetch order items error:', error);
      toast({ title: 'Failed to load order items', variant: 'destructive' });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    await fetchOrderItems(order.id);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    const previousStatus = order?.status;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      await logAdminAction({ action: 'update', entityType: 'order', entityId: orderId, details: { order_number: order?.order_number, previous_status: previousStatus, new_status: status } });
      
      // Send order status change email notification
      try {
        await supabase.functions.invoke('order-status-notification', {
          body: {
            orderId: orderId,
            orderNumber: order?.order_number,
            newStatus: status,
            oldStatus: previousStatus,
          },
        });
        console.log('Status notification sent successfully');
      } catch (notifError) {
        console.error('Failed to send status notification:', notifError);
        // Don't fail the status update if notification fails
      }
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      toast({ title: 'Order status updated' });
    } catch (error) {
      console.error('Update status error:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping_address.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium">Order</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Total</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-border hover:bg-secondary/30"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.shipping_address.full_name}</p>
                        <p className="text-sm text-muted-foreground">{order.shipping_address.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={order.status}
                        onValueChange={(val) => updateOrderStatus(order.id, val as OrderStatus)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 font-medium">৳{Number(order.total).toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setOrderItems([]); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint} className="ml-auto mr-6">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogHeader>
          {selectedOrder && (
            <>
            {/* Printable content */}
            <div ref={printRef} className="hidden">
              <div className="print-header">
                <h1>Order #{selectedOrder.order_number}</h1>
                <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>Status</label>
                  <p style={{ textTransform: 'capitalize' }}>{selectedOrder.status}</p>
                </div>
                <div className="info-item">
                  <label>Order Date</label>
                  <p>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="section">
                <div className="section-title">Shipping Address</div>
                <div className="address-box">
                  <p style={{ fontWeight: 500 }}>{selectedOrder.shipping_address.full_name}</p>
                  <p>{selectedOrder.shipping_address.phone}</p>
                  <p>{selectedOrder.shipping_address.address}</p>
                  <p style={{ textTransform: 'capitalize' }}>{selectedOrder.shipping_address.area}</p>
                </div>
              </div>
              
              <div className="section">
                <div className="section-title">Order Items</div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.size || '-'}</td>
                        <td>{item.color || '-'}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>৳{(Number(item.price) * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>৳{Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Delivery Fee</span>
                  <span>৳{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                </div>
                <div className="total-row final">
                  <span>Total</span>
                  <span>৳{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="section" style={{ marginTop: 20 }}>
                  <div className="section-title">Notes</div>
                  <div className="notes">{selectedOrder.notes}</div>
                </div>
              )}
            </div>

            {/* Visible dialog content */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="font-medium">{selectedOrder.shipping_address.full_name}</p>
                  <p className="text-sm">{selectedOrder.shipping_address.phone}</p>
                  <p className="text-sm">{selectedOrder.shipping_address.address}</p>
                  <p className="text-sm capitalize">{selectedOrder.shipping_address.area}</p>
                </div>
              </div>

              {/* Order Items Section */}
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items ({orderItems.length})
                </p>
                {loadingItems ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading items...</p>
                ) : orderItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No items found</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex gap-3 bg-secondary/50 rounded-lg p-3">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product_name}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-0.5">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium">৳{Number(item.price).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            ৳{(Number(item.price) * item.quantity).toLocaleString()} total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>৳{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>৳{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-secondary/50 rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
