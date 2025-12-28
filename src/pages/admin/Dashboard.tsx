import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, Users, TrendingUp, Package, Clock, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-react';
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
      trend: '+12%',
      trendUp: true,
      gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      trend: stats.pendingOrders > 0 ? 'Action needed' : 'All clear',
      trendUp: stats.pendingOrders === 0,
      gradient: 'from-orange-500/20 via-orange-500/10 to-transparent',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Total Revenue',
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: '+8%',
      trendUp: true,
      gradient: 'from-green-500/20 via-green-500/10 to-transparent',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      trend: '+24%',
      trendUp: true,
      gradient: 'from-purple-500/20 via-purple-500/10 to-transparent',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Initializing dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your system overview.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Live</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-card rounded-2xl p-6 border border-border overflow-hidden group hover:border-primary/30 transition-colors"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            {/* Scan line effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scanLine_3s_ease-in-out_infinite]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.iconBg} backdrop-blur-sm`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trendUp ? 'text-green-500' : 'text-orange-500'
                }`}>
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.trend}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Recent Orders</h2>
            <p className="text-sm text-muted-foreground">Latest transactions in your store</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Real-time</span>
          </div>
        </div>
        <div className="p-6">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground/60">Orders will appear here when customers start purchasing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">৳{Number(order.total).toLocaleString()}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                        order.status === 'pending'
                          ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                          : order.status === 'delivered'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : order.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'pending' ? 'bg-orange-500' :
                        order.status === 'delivered' ? 'bg-green-500' :
                        order.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
