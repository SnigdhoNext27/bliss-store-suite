import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, Users, TrendingUp, Package, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  ordersToday: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    ordersToday: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (orders) {
        const ordersToday = orders.filter(
          o => new Date(o.created_at) >= today
        ).length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          ordersToday,
          pendingOrders,
          totalRevenue,
          totalCustomers: 0,
        });

        setRecentOrders(orders.slice(0, 5));
      }

      // Fetch customer count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats(prev => ({ ...prev, totalCustomers: count || 0 }));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Orders Today',
      value: stats.ordersToday,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Total Revenue',
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="font-display text-xl font-semibold">Recent Orders</h2>
        </div>
        <div className="p-6">
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">৳{Number(order.total).toLocaleString()}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
