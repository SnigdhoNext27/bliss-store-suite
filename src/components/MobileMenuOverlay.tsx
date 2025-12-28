import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { Home, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

type NavLink = {
  name: string;
  href: string;
};

type SocialLink = {
  name: string;
  href: string;
  icon?: LucideIcon;
  isWhatsApp?: boolean;
};

interface MobileMenuOverlayProps {
  open: boolean;
  onClose: () => void;
  navLinks: NavLink[];
  onNavigate: (href: string) => void;
  socialLinks: SocialLink[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  onAdmin: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onSignOut: () => void;
}

export function MobileMenuOverlay({
  open,
  onClose,
  navLinks,
  onNavigate,
  socialLinks,
  isAuthenticated,
  isAdmin,
  onAdmin,
  onLogin,
  onSignup,
  onSignOut,
}: MobileMenuOverlayProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <motion.aside
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[130] w-[85%] max-w-sm overflow-y-auto border-l border-border bg-background shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <Logo size="sm" animate={false} />
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-2 p-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => onNavigate(link.href)}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 text-left text-lg font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  {link.name === 'Home' && <Home className="h-5 w-5" />}
                  {link.name}
                </button>
              ))}
            </nav>

            {/* Social */}
            <div className="flex items-center gap-3 border-t border-border px-4 py-4">
              <span className="text-sm text-muted-foreground">Follow us</span>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    aria-label={social.name}
                  >
                    {social.isWhatsApp ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    ) : (
                      social.icon && <social.icon className="h-5 w-5" />
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto border-t border-border px-4 py-4">
              <div className="flex gap-4">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Button variant="outline" className="flex-1" onClick={onAdmin}>
                        Admin
                      </Button>
                    )}
                    <Button variant="default" className="flex-1" onClick={onSignOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" onClick={onLogin}>
                      Login
                    </Button>
                    <Button variant="default" className="flex-1" onClick={onSignup}>
                      Signup
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
