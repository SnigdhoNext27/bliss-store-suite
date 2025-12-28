import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface OrderData {
  id: string;
  created_at: string;
  total: number;
  user_id: string | null;
}

interface CustomerAnalyticsProps {
  orders: OrderData[];
  filteredOrderIds: Set<string>;
}

const COLORS = ['hsl(150, 50%, 45%)', 'hsl(200, 60%, 50%)'];

export function CustomerAnalytics({ orders, filteredOrderIds }: CustomerAnalyticsProps) {
  // Filter orders in the selected date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => filteredOrderIds.has(o.id));
  }, [orders, filteredOrderIds]);

  // Analyze customer data
  const customerData = useMemo(() => {
    // Group orders by user_id
    const userOrders: Record<string, { orders: OrderData[]; firstOrderDate: string }> = {};
    
    orders.forEach(order => {
      const key = order.user_id || 'guest';
      if (!userOrders[key]) {
        userOrders[key] = { orders: [], firstOrderDate: order.created_at };
      }
      userOrders[key].orders.push(order);
      if (new Date(order.created_at) < new Date(userOrders[key].firstOrderDate)) {
        userOrders[key].firstOrderDate = order.created_at;
      }
    });

    // Calculate metrics for filtered period
    let newCustomers = 0;
    let returningCustomers = 0;
    const userIdsInPeriod = new Set<string>();

    filteredOrders.forEach(order => {
      const key = order.user_id || 'guest';
      if (key === 'guest') return; // Skip guest orders for customer metrics

      if (!userIdsInPeriod.has(key)) {
        userIdsInPeriod.add(key);
        const userData = userOrders[key];
        const firstOrderInPeriod = filteredOrders
          .filter(o => o.user_id === order.user_id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        
        // Check if this is their first ever order
        if (userData.firstOrderDate === firstOrderInPeriod?.created_at) {
          newCustomers++;
        } else {
          returningCustomers++;
        }
      }
    });

    // Calculate lifetime value
    const customerLTV: number[] = [];
    Object.entries(userOrders).forEach(([key, data]) => {
      if (key !== 'guest') {
        const ltv = data.orders.reduce((sum, o) => sum + Number(o.total), 0);
        customerLTV.push(ltv);
      }
    });

    const avgLifetimeValue = customerLTV.length > 0
      ? customerLTV.reduce((a, b) => a + b, 0) / customerLTV.length
      : 0;

    // Calculate average order value for period
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Orders per customer distribution
    const ordersPerCustomer: Record<string, number> = {};
    Object.entries(userOrders).forEach(([key, data]) => {
      if (key !== 'guest') {
        const count = data.orders.filter(o => filteredOrderIds.has(o.id)).length;
        if (count > 0) {
          const bucket = count === 1 ? '1 order' : count <= 3 ? '2-3 orders' : count <= 5 ? '4-5 orders' : '6+ orders';
          ordersPerCustomer[bucket] = (ordersPerCustomer[bucket] || 0) + 1;
        }
      }
    });

    const orderDistribution = [
      { name: '1 order', value: ordersPerCustomer['1 order'] || 0 },
      { name: '2-3 orders', value: ordersPerCustomer['2-3 orders'] || 0 },
      { name: '4-5 orders', value: ordersPerCustomer['4-5 orders'] || 0 },
      { name: '6+ orders', value: ordersPerCustomer['6+ orders'] || 0 },
    ].filter(d => d.value > 0);

    return {
      newCustomers,
      returningCustomers,
      avgOrderValue,
      avgLifetimeValue,
      totalCustomers: userIdsInPeriod.size,
      orderDistribution,
      guestOrders: filteredOrders.filter(o => !o.user_id).length,
    };
  }, [orders, filteredOrders, filteredOrderIds]);

  const newVsReturningData = [
    { name: 'New Customers', value: customerData.newCustomers },
    { name: 'Returning', value: customerData.returningCustomers },
  ];

  const stats = [
    {
      title: 'New Customers',
      value: customerData.newCustomers,
      icon: UserPlus,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Returning Customers',
      value: customerData.returningCustomers,
      icon: UserCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Avg Order Value',
      value: `৳${Math.round(customerData.avgOrderValue).toLocaleString()}`,
      icon: ShoppingBag,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Avg Lifetime Value',
      value: `৳${Math.round(customerData.avgLifetimeValue).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Customer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New vs Returning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">New vs Returning</h3>
              <p className="text-sm text-muted-foreground">Customer acquisition breakdown</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="h-[220px]">
            {newVsReturningData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={newVsReturningData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {newVsReturningData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No customer data for this period</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Customer Order Frequency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Order Frequency</h3>
              <p className="text-sm text-muted-foreground">Orders per customer distribution</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="h-[220px]">
            {customerData.orderDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData.orderDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [value, 'Customers']}
                  />
                  <Bar dataKey="value" fill="hsl(24, 35%, 49%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No order data for this period</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-secondary/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total unique customers:</span>
            <span className="font-semibold">{customerData.totalCustomers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Guest orders:</span>
            <span className="font-semibold">{customerData.guestOrders}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Retention rate:</span>
            <span className="font-semibold">
              {customerData.totalCustomers > 0 
                ? `${Math.round((customerData.returningCustomers / customerData.totalCustomers) * 100)}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
