import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  PartyPopper, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  Copy, 
  Share2, 
  ChevronRight,
  Phone,
  MapPin,
  ShoppingBag,
  Home,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { InvoiceDownloadButton } from '@/components/InvoiceDownloadButton';

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
  shipping_address: {
    full_name?: string;
    phone?: string;
    address?: string;
    area?: string;
  };
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive', icon: Package },
};

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError || !orderData) {
        toast({
          title: 'Order not found',
          description: 'Unable to find your order. Please check your order history.',
          variant: 'destructive'
        });
        navigate('/account?tab=orders');
        return;
      }

      setOrder(orderData as Order);

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsData) {
        setOrderItems(itemsData as OrderItem[]);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
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
        text: `Track your Almans order: ${order.order_number}`,
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

  if (!order) {
    return null;
  }

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <>
      <Helmet>
        <title>Order Confirmed - {order.order_number} | Almans</title>
      </Helmet>

      <Header />
      <CartSlide />

      <main className="min-h-screen bg-background pt-20 pb-24">
        <div className="container px-4 py-8 max-w-3xl mx-auto">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <PartyPopper className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold mb-2">Order Confirmed! 🎉</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll start processing it right away.
            </p>
          </motion.div>

          {/* Order Number Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                <p className="font-display text-2xl font-bold text-primary">{order.order_number}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyOrderNumber}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={shareOrder}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
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
              </div>
            </div>
          </motion.div>

          {/* Order Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${statusConfig[order.status].color} flex items-center justify-center`}>
                  <StatusIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Order Status</p>
                  <Badge className={`${statusConfig[order.status].color} text-white mt-1`}>
                    {statusConfig[order.status].label}
                  </Badge>
                </div>
              </div>
              <Link to={`/orders/${order.order_number}`}>
                <Button variant="ghost" size="sm">
                  Track Order
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 mb-6"
          >
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Items ({orderItems.length})
            </h2>
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    {item.size && (
                      <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium whitespace-nowrap">৳{(item.price * item.quantity).toFixed(0)}</p>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <hr className="my-4 border-border" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{order.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>৳{order.delivery_fee.toFixed(0)}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-৳{order.discount.toFixed(0)}</span>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">৳{order.total.toFixed(0)}</span>
              </div>
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-6 mb-6"
          >
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </h2>
            <div className="space-y-2">
              <p className="font-medium">{order.shipping_address?.full_name}</p>
              {order.shipping_address?.phone && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.shipping_address.phone}
                </p>
              )}
              <p className="text-muted-foreground">{order.shipping_address?.address}</p>
              {order.shipping_address?.area && (
                <Badge variant="secondary" className="capitalize">
                  {order.shipping_address.area === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Link to={`/orders/${order.order_number}`} className="block">
              <Button size="lg" className="w-full">
                <Package className="h-5 w-5 mr-2" />
                Track Your Order
              </Button>
            </Link>
            <div className="flex gap-3">
              <Link to="/my-orders" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  My Orders
                </Button>
              </Link>
              <Link to="/shop" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  <Home className="h-5 w-5 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
