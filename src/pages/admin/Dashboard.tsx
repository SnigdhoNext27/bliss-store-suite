import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, Users, TrendingUp, Package, Clock, ArrowUpRight, ArrowDownRight, Activity, Zap, BarChart3, PieChart, Calendar, Trophy, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface Stats {
  ordersToday: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

interface OrderData {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_number: string;
}

interface OrderItemData {
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  order_id: string;
}

interface ProductData {
  id: string;
  name: string;
  category_id: string | null;
}

interface CategoryData {
  id: string;
  name: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const COLORS = ['hsl(24, 35%, 49%)', 'hsl(38, 60%, 55%)', 'hsl(30, 40%, 82%)', 'hsl(18, 22%, 27%)', 'hsl(200, 60%, 50%)', 'hsl(150, 50%, 45%)'];

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    ordersToday: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  });
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch orders, order items, products, and categories in parallel
      const [ordersRes, orderItemsRes, productsRes, categoriesRes, profilesRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, total, status, order_number')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('order_items')
          .select('product_id, product_name, quantity, price, order_id')
          .limit(1000),
        supabase
          .from('products')
          .select('id, name, category_id'),
        supabase
          .from('categories')
          .select('id, name'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
      ]);

      if (ordersRes.data) {
        setAllOrders(ordersRes.data as OrderData[]);
        const ordersToday = ordersRes.data.filter(
          o => new Date(o.created_at) >= today
        ).length;
        const pendingOrders = ordersRes.data.filter(o => o.status === 'pending').length;
        const totalRevenue = ordersRes.data.reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          ordersToday,
          pendingOrders,
          totalRevenue,
          totalCustomers: profilesRes.count || 0,
        });

        setRecentOrders(ordersRes.data.slice(0, 5));
      }

      if (orderItemsRes.data) {
        setOrderItems(orderItemsRes.data as OrderItemData[]);
      }

      if (productsRes.data) {
        setProducts(productsRes.data as ProductData[]);
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data as CategoryData[]);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return allOrders;
    
    return allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!),
      });
    });
  }, [allOrders, dateRange]);

  // Get order IDs in date range for filtering order items
  const filteredOrderIds = useMemo(() => {
    return new Set(filteredOrders.map(o => o.id));
  }, [filteredOrders]);

  // Process data for sales trend chart
  const salesTrendData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    const days: { date: string; revenue: number; orders: number }[] = [];
    const dayCount = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const step = dayCount > 30 ? Math.ceil(dayCount / 15) : 1;
    
    for (let i = 0; i <= dayCount; i += step) {
      const date = new Date(dateRange.from);
      date.setDate(date.getDate() + i);
      
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + step - 1);
      
      const dateStr = dayCount > 30 
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      
      const dayOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startOfDay(date) && orderDate <= endOfDay(endDate);
      });
      
      days.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
        orders: dayOrders.length,
      });
    }
    
    return days;
  }, [filteredOrders, dateRange]);

  // Process data for order status pie chart
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredOrders]);

  // Process data for hourly activity
  const hourlyActivityData = useMemo(() => {
    const hours: { hour: string; orders: number }[] = [];
    for (let i = 0; i < 24; i += 3) {
      const hourOrders = filteredOrders.filter(o => {
        const orderHour = new Date(o.created_at).getHours();
        return orderHour >= i && orderHour < i + 3;
      }).length;
      
      hours.push({
        hour: `${i}:00`,
        orders: hourOrders,
      });
    }
    return hours;
  }, [filteredOrders]);

  // Top selling products
  const topProductsData = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    orderItems
      .filter(item => filteredOrderIds.has(item.order_id))
      .forEach(item => {
        const key = item.product_name;
        if (!productSales[key]) {
          productSales[key] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += Number(item.price) * item.quantity;
      });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orderItems, filteredOrderIds]);

  // Category performance
  const categoryPerformanceData = useMemo(() => {
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const productCategoryMap = new Map(products.map(p => [p.id, p.category_id]));
    
    const categorySales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    orderItems
      .filter(item => filteredOrderIds.has(item.order_id))
      .forEach(item => {
        const categoryId = item.product_id ? productCategoryMap.get(item.product_id) : null;
        const categoryName = categoryId ? categoryMap.get(categoryId) || 'Uncategorized' : 'Uncategorized';
        
        if (!categorySales[categoryName]) {
          categorySales[categoryName] = { name: categoryName, quantity: 0, revenue: 0 };
        }
        categorySales[categoryName].quantity += item.quantity;
        categorySales[categoryName].revenue += Number(item.price) * item.quantity;
      });
    
    return Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue);
  }, [orderItems, products, categories, filteredOrderIds]);

  const handlePresetClick = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your system overview.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                    : 'Select dates'}
                </span>
                <span className="sm:hidden">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'M/d')} - ${format(dateRange.to, 'M/d')}`
                    : 'Dates'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b border-border">
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map(preset => (
                    <Button
                      key={preset.days}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handlePresetClick(preset.days)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Live</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
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
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Sales Trend</h3>
              <p className="text-sm text-muted-foreground">
                Revenue for selected period ({filteredOrders.length} orders)
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24, 35%, 49%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(24, 35%, 49%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `৳${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(24, 35%, 49%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Order Status</h3>
              <p className="text-sm text-muted-foreground">Distribution of order statuses</p>
            </div>
            <div className="p-2 rounded-lg bg-almans-gold/10">
              <PieChart className="h-5 w-5 text-almans-gold" />
            </div>
          </div>
          <div className="h-[250px]">
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
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
                    height={36}
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No order data available
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Product Sales Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Top Selling Products</h3>
              <p className="text-sm text-muted-foreground">Best performers by revenue</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          {topProductsData.length > 0 ? (
            <div className="space-y-4">
              {topProductsData.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    index === 2 ? 'bg-orange-600/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">৳{product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No sales data for this period</p>
            </div>
          )}
        </motion.div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Category Performance</h3>
              <p className="text-sm text-muted-foreground">Revenue by product category</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Layers className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          {categoryPerformanceData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `৳${value.toLocaleString()}`}
                  />
                  <YAxis 
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number, name) => [
                      name === 'revenue' ? `৳${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Quantity'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="hsl(24, 35%, 49%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Layers className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No category data for this period</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Hourly Activity & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Peak Hours</h3>
              <p className="text-sm text-muted-foreground">Customer activity by time</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Bar dataKey="orders" fill="hsl(24, 35%, 49%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
              <p className="text-sm text-muted-foreground">Latest transactions</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Real-time</span>
            </div>
          </div>
          <div className="p-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
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
                      <p className="font-semibold text-sm">৳{Number(order.total).toLocaleString()}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          order.status === 'pending'
                            ? 'bg-orange-500/10 text-orange-500'
                            : order.status === 'delivered'
                            ? 'bg-green-500/10 text-green-500'
                            : order.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full ${
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
    </div>
  );
}
