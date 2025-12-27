import { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  Tag,
  Image,
  LogOut,
  Menu,
  X,
  Shield,
  Grid3X3,
  Home
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  permission: Permission;
}

const allNavItems: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true, permission: 'dashboard' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', permission: 'orders' },
  { to: '/admin/products', icon: Package, label: 'Products', permission: 'products' },
  { to: '/admin/categories', icon: Grid3X3, label: 'Categories', permission: 'products' },
  { to: '/admin/customers', icon: Users, label: 'Customers', permission: 'customers' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons', permission: 'coupons' },
  { to: '/admin/banners', icon: Image, label: 'Banners', permission: 'banners' },
  { to: '/admin/settings', icon: Settings, label: 'Settings', permission: 'settings' },
  { to: '/admin/team', icon: Shield, label: 'Team', permission: 'team' },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  officer: 'Officer',
};

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter nav items based on user's role permissions
  const navItems = useMemo(() => {
    return allNavItems.filter(item => hasPermission(userRole, item.permission));
  }, [userRole]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-border">
          <h1 className="font-display text-2xl font-bold text-primary">Almans Admin</h1>
          {userRole && (
            <Badge variant="secondary" className="mt-2">
              {ROLE_LABELS[userRole] || userRole}
            </Badge>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 lg:ml-0">
        {/* Top Bar with Home Button */}
        <div className="flex justify-start mb-6 pl-12 lg:pl-0">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Visit Site</span>
            </Link>
          </Button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
