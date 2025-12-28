import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronLeft, Loader2, Copy, Share2, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { InvoiceDownloadButton } from '@/components/InvoiceDownloadButton';
import { DeliveryEstimation } from '@/components/DeliveryEstimation';
import { OrderCancelButton } from '@/components/OrderCancelButton';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  size: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  delivery_fee: number;
  discount: number | null;
  created_at: string;
  updated_at: string;
  tracking_number: string | null;
  notes: string | null;
  shipping_address: {
    full_name?: string;
    phone?: string;
    address?: string;
    city?: string;
    area?: string;
  };
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<{ status: string; timestamp: string }[]>([]);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrder(newOrder);
          
          // Add to status history if status changed
          if (newOrder.status !== order.status) {
            setStatusHistory(prev => [
              ...prev,
              { status: newOrder.status, timestamp: new Date().toISOString() }
            ]);
            toast({
              title: 'Order Updated',
              description: `Your order is now ${newOrder.status}!`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, order?.status, toast]);

  const fetchOrder = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Fetch order by order number
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError || !orderData) {
        setError('Order not found');
        return;
      }

      setOrder(orderData as Order);
      
      // Build status history from order data
      const history: { status: string; timestamp: string }[] = [];
      history.push({ status: 'pending', timestamp: orderData.created_at });
      
      if (['processing', 'shipped', 'delivered'].includes(orderData.status)) {
        history.push({ status: 'processing', timestamp: orderData.created_at });
      }
      if (['shipped', 'delivered'].includes(orderData.status)) {
        history.push({ status: 'shipped', timestamp: orderData.updated_at });
      }
      if (orderData.status === 'delivered') {
        history.push({ status: 'delivered', timestamp: orderData.updated_at });
      }
      if (orderData.status === 'cancelled') {
        history.push({ status: 'cancelled', timestamp: orderData.updated_at });
      }
      
      setStatusHistory(history);

      // Fetch order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsData) {
        setOrderItems(itemsData as OrderItem[]);
      }
      
      if (isRefresh) {
        toast({ title: 'Order refreshed!' });
      }
    } catch (err) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.order_number);
      toast({ title: 'Order number copied!' });
    }
  };

  const shareOrder = () => {
    if (navigator.share && order) {
      navigator.share({
        title: `Order ${order.order_number}`,
        text: `Track your order: ${order.order_number}`,
        url: window.location.href,
      });
    } else {
      copyOrderNumber();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find order #{orderNumber}
            </p>
            <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <>
      <Helmet>
        <title>Track Order {order.order_number} | Almans</title>
      </Helmet>

      <Header />
      <CartSlide />

      <main className="min-h-screen bg-background pt-20 pb-12">
        <div className="container px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* Order Header */}
            <div className="bg-card rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <h1 className="font-display text-2xl font-bold text-primary">{order.order_number}</h1>
                </div>
              <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchOrder(true)}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyOrderNumber}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareOrder}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {order && (
                    <InvoiceDownloadButton 
                      order={{
                        ...order,
                        items: orderItems.map(item => ({
                          product_name: item.product_name,
                          quantity: item.quantity,
                          price: item.price,
                          size: item.size
                        }))
                      }}
                    />
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              
              {/* Cancel Order Button - Only for pending orders */}
              {order.status === 'pending' && (
                <div className="mt-4">
                  <OrderCancelButton
                    orderId={order.id}
                    orderNumber={order.order_number}
                    status={order.status}
                    onCancelled={() => fetchOrder(true)}
                  />
                </div>
              )}
            </div>

            {/* Delivery Estimation */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="mb-6">
                <DeliveryEstimation
                  orderDate={order.created_at}
                  status={order.status}
                  area={order.shipping_address?.area}
                />
              </div>
            )}

            {/* Order Status Timeline */}
            {order.status === 'cancelled' ? (
              <div className="bg-destructive/10 rounded-xl p-6 mb-6 text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <h2 className="font-display text-xl font-bold text-destructive">Order Cancelled</h2>
                <p className="text-muted-foreground mt-2">This order has been cancelled.</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-bold">Order Status</h2>
                  <Badge variant="outline" className="text-xs">
                    Real-time updates enabled
                  </Badge>
                </div>
                
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
                  <motion.div 
                    className="absolute left-6 top-6 w-0.5 bg-primary"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />

                  {/* Status Steps */}
                  <div className="space-y-8">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStep;
                      const isCurrent = index === currentStep;
                      const StepIcon = step.icon;
                      const historyEntry = statusHistory.find(h => h.status === step.key);

                      return (
                        <motion.div 
                          key={step.key} 
                          className="flex items-start gap-4 relative"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <motion.div
                            className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-colors shrink-0 ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                            initial={false}
                            animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                          >
                            <StepIcon className="h-5 w-5" />
                          </motion.div>
                          <div className="pt-2.5">
                            <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <motion.p 
                                className="text-sm text-primary font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                Current Status
                              </motion.p>
                            )}
                            {historyEntry && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(historyEntry.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Tracking Number */}
                {order.tracking_number && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-medium">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-card rounded-xl p-6 mb-6">
              <h2 className="font-display text-lg font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">৳{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              <hr className="my-4 border-border" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳{order.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>৳{order.delivery_fee.toFixed(0)}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-৳{order.discount.toFixed(0)}</span>
                  </div>
                )}
                <hr className="border-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>৳{order.total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-card rounded-xl p-6">
              <h2 className="font-display text-lg font-bold mb-4">Delivery Address</h2>
              <p className="font-medium">{order.shipping_address?.full_name}</p>
              <p className="text-muted-foreground">{order.shipping_address?.phone}</p>
              <p className="text-muted-foreground">{order.shipping_address?.address}</p>
              <Badge variant="outline" className="mt-2">
                {order.shipping_address?.area === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
              </Badge>

              {order.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
