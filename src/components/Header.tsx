import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, LogOut, Settings, Package, Facebook, Instagram, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'About Us', href: '/shop#about' },
  { name: 'Contact', href: '/shop#contact' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { getTotalItems, openCart } = useCartStore();
  const { user, isAdmin, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = getTotalItems();

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: settings.social_facebook || 'https://www.facebook.com/profile.php?id=61584375982557' },
    { name: 'Instagram', icon: Instagram, href: settings.social_instagram || 'https://www.instagram.com/almans.bd' },
    { name: 'WhatsApp', href: `https://wa.me/${settings.social_whatsapp || '8801930278877'}`, isWhatsApp: true },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (location.pathname !== path && path) {
        navigate(href);
      } else {
        const element = document.querySelector(`#${hash}`);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  const handleSignOutClick = () => {
    setShowSignOutDialog(true);
  };

  const handleSignOutConfirm = async () => {
    await signOut();
    setShowSignOutDialog(false);
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary">
            <span className="font-display text-lg font-semibold text-primary">A</span>
          </div>
          <span className="hidden font-display text-xl font-semibold text-foreground sm:inline-block">
            ALMANS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.name}
            </button>
          ))}
          
          {/* Follow Us Section */}
          <div className="flex items-center gap-2 border-l border-border pl-6">
            <span className="text-xs text-muted-foreground">Follow us</span>
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10"
                  aria-label={social.name}
                >
                  {social.isWhatsApp ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  ) : (
                    <social.icon className="h-4 w-4" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* User Menu */}
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">Hi, {user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=orders')}>
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOutClick}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Dedicated Sign Out Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOutClick}
                    className="hidden sm:flex hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              <User className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="relative gap-2"
            onClick={openCart}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">My Bag</span>
            {totalItems > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border md:hidden"
          >
            <nav className="container flex flex-col gap-4 px-4 py-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="flex items-center gap-2 text-left text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  {link.name === 'Home' && <Home className="h-4 w-4" />}
                  {link.name}
                </button>
              ))}
              
              {/* Mobile Follow Us Section */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Follow us</span>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-label={social.name}
                    >
                      {social.isWhatsApp ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      ) : (
                        <social.icon className="h-5 w-5" />
                      )}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border">
                {user ? (
                  <>
                    {isAdmin && (
                      <Button variant="outline" className="flex-1" onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}>
                        Admin
                      </Button>
                    )}
                    <Button variant="default" className="flex-1" onClick={handleSignOutClick}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}>
                      Login
                    </Button>
                    <Button variant="default" className="flex-1" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}>
                      Signup
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOutConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
