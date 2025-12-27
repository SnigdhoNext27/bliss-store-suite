import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, Clock, ChevronRight } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useNewOrdersCount } from '@/hooks/useNewOrdersCount';

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: {
    full_name?: string;
  };
}

export function OrdersDropdown() {
  const navigate = useNavigate();
  const { count, hasNewOrder, clearNewOrderIndicator } = useNewOrdersCount();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRecentOrders();
    }
  }, [isOpen]);

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentOrders(data as RecentOrder[]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      clearNewOrderIndicator();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-orange-500';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative p-2 rounded-lg transition-colors ${
            hasNewOrder 
              ? 'bg-primary/10 text-primary animate-pulse' 
              : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={`${count} pending orders`}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {count > 99 ? '99+' : count}
            </span>
          )}
          {hasNewOrder && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Recent Orders</span>
          {count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {count} pending
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {recentOrders.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent orders</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <DropdownMenuItem
                key={order.id}
                onClick={() => navigate('/admin/orders')}
                className="flex flex-col items-start p-3 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-medium text-sm">{order.order_number}</span>
                  <Badge className={`${getStatusColor(order.status)} text-white text-[10px] capitalize`}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <span className="truncate max-w-[150px]">
                    {order.shipping_address?.full_name || 'Guest'}
                  </span>
                  <span className="font-medium text-foreground">৳{order.total.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {getTimeAgo(order.created_at)}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/admin/orders')}
          className="justify-center text-primary cursor-pointer"
        >
          View All Orders
          <ChevronRight className="h-4 w-4 ml-1" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
