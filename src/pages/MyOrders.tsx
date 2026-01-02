import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { EmptyState } from '@/components/EmptyState';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive', icon: XCircle },
};

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-orders');
      return;
    }
    if (user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_image,
            quantity,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Orders | Almans</title>
        <meta name="description" content="View and manage your orders at Almans" />
      </Helmet>

      <Header />
      <CartSlide />

      <main className="min-h-screen bg-background pt-20 pb-24">
        <div className="container px-4 py-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              Track and manage all your orders in one place
            </p>
          </div>

          {/* Filters */}
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            orders.length === 0 ? (
              <EmptyState
                type="orders"
                title="No orders yet"
                description="Start shopping to see your orders here"
                actionLabel="Browse Products"
                onAction={() => navigate('/shop')}
              />
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders match your search</p>
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const StatusIcon = statusConfig[order.status].icon;
                const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/orders/${order.order_number}`}>
                      <div className="bg-card rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all border border-border hover:border-primary/30 cursor-pointer">
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-bold text-primary">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusConfig[order.status].color} text-white`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[order.status].label}
                            </Badge>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {order.order_items.slice(0, 4).map((item) => (
                              <div key={item.id} className="shrink-0">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-14 h-14 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {order.order_items.length > 4 && (
                              <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-sm font-medium text-muted-foreground">
                                  +{order.order_items.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Order Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </p>
                          <p className="font-bold text-lg">৳{order.total.toFixed(0)}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
