import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const footerLinks = {
  'About Us': ['Our Story', 'Careers', 'Sustainability', 'Press'],
  'Shop': ['New Arrivals', 'Best Sellers', 'Sale', 'Gift Cards'],
  'Company': ['FAQ', 'Shipping', 'Returns', 'Size Guide'],
  'Legal': ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61584375982557' },
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/almans.bd?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/almans' },
];

export function Footer() {
  return (
    <footer className="bg-almans-chocolate text-almans-cream">
      {/* Brand Banner */}
      <div className="border-b border-almans-cream/10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-12"
        >
          <h2
            className="font-display text-[15vw] md:text-[12vw] font-bold text-center tracking-widest text-almans-cream/10 whitespace-nowrap"
            style={{ letterSpacing: '0.2em' }}
          >
            ALMANS
          </h2>
        </motion.div>
      </div>

      {/* Main Footer Content */}
      <div className="container px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-almans-cream/30">
                <span className="font-display text-lg font-semibold">A</span>
              </div>
              <span className="font-display text-xl font-semibold">ALMANS</span>
            </div>
            <p className="text-almans-cream/60 text-sm mb-6">
              Where your vibes meet our vision. Premium fashion essentials for the modern individual.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-almans-cream/20 text-almans-cream/60 transition-all hover:border-almans-cream hover:text-almans-cream"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-almans-cream/60 hover:text-almans-cream transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-almans-cream/10">
        <div className="container px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-almans-cream/60">
            ©2025 Almans. All rights reserved.
          </p>
          <a href="#" className="text-sm text-almans-cream/60 hover:text-almans-cream transition-colors">
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  );
}
