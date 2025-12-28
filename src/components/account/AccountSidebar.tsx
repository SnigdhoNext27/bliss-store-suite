import { Link, useLocation } from 'react-router-dom';
import { User, MapPin, Lock, Package, Bell, Settings, Edit, Shield, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AccountSidebarProps {
  avatarUrl: string | null;
  fullName: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    group: 'My Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'addresses', label: 'Addresses', icon: MapPin },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'loyalty', label: 'Loyalty Points', icon: Award },
      { id: 'security', label: 'Security', icon: Shield },
    ],
  },
  {
    group: 'My Purchase',
    items: [
      { id: 'orders', label: 'My Orders', icon: Package },
    ],
  },
];

export function AccountSidebar({ avatarUrl, fullName, activeTab, onTabChange }: AccountSidebarProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* User Info */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl || undefined} alt={fullName || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{fullName || 'User'}</p>
          <button
            onClick={() => onTabChange('profile')}
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        {menuItems.map((group) => (
          <div key={group.group} className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground">
              {group.group === 'My Account' && <User className="h-4 w-4" />}
              {group.group === 'My Purchase' && <Package className="h-4 w-4" />}
              {group.group}
            </div>
            <div className="ml-6 space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    activeTab === item.id
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
