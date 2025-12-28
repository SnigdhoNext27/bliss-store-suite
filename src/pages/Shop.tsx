import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, Star, ArrowRight, MapPin, Phone, Mail, Clock, Send, Users, Award, Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { ShopCategoriesGrid } from '@/components/ShopCategoriesGrid';
import { ProductsSection } from '@/components/ProductsSection';
import { PromotionalBanner } from '@/components/PromotionalBanner';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { CollectionSection } from '@/components/CollectionSection';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Shop = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  const seasonBadges = [
    { icon: Sparkles, label: 'All Seasons', color: 'bg-primary/10 text-primary' },
    { icon: Zap, label: 'Trending', color: 'bg-almans-gold/20 text-almans-gold' },
    { icon: Star, label: 'Best Sellers', color: 'bg-accent text-foreground' },
  ];

  return (
    <>
      <Helmet>
        <title>Shop - Almans | Premium Fashion Collection 2026</title>
        <meta
          name="description"
          content="Browse Almans' complete collection of premium fashion essentials. Find your perfect style from our curated selection for all seasons."
        />
        <meta name="keywords" content="shop, fashion, clothing, premium clothes, almans collection, 2026 fashion" />
        <meta property="og:title" content="Shop - Almans Fashion" />
        <meta property="og:description" content="Discover our complete collection of premium fashion essentials." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://almans.com/shop" />
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh} />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Futuristic Shop Hero */}
          <section className="relative py-20 md:py-32 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent/20">
              {/* Floating orbs */}
              <motion.div
                className="absolute top-20 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
                animate={{
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute bottom-20 right-[15%] w-96 h-96 bg-almans-gold/10 rounded-full blur-3xl"
                animate={{
                  y: [0, -40, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }} />
            </div>

            <div className="container px-4 md:px-8 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                {/* Season badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-wrap justify-center gap-3 mb-8"
                >
                  {seasonBadges.map((badge, i) => (
                    <motion.div
                      key={badge.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${badge.color} backdrop-blur-sm border border-border/50`}
                    >
                      <badge.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{badge.label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Main heading */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6">
                    <span className="block">Discover</span>
                    <span className="bg-gradient-to-r from-primary via-almans-gold to-primary bg-clip-text text-transparent">
                      Your Style
                    </span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                  Premium fashion essentials crafted for comfort and elegance. 
                  Designed for all seasons, built for the future.
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <Button
                    size="lg"
                    className="gap-2 px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all"
                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Explore Collection
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 px-8 py-6 text-base rounded-full border-2 hover:bg-muted/50"
                    onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Browse Categories
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-border/50"
                >
                  {[
                    { value: '500+', label: 'Products' },
                    { value: '50K+', label: 'Happy Customers' },
                    { value: '4.9', label: 'Rating' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="font-display text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
              >
                <motion.div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
              </motion.div>
            </motion.div>
          </section>

          {/* Flash Sale Banner */}
          <PromotionalBanner />
          
          {/* Featured Products Carousel */}
          <FeaturedCarousel />
          
          {/* Shop By Category Section */}
          <div id="categories">
            <ShopCategoriesGrid />
          </div>
          
          {/* All Products Section */}
          <div id="products">
            <ProductsSection />
          </div>
          
          {/* Collection Section */}
          <CollectionSection />

          {/* About Us Section */}
          <section id="about" className="py-20 md:py-32 bg-secondary/30 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-20 right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
            </div>

            <div className="container px-4 md:px-8 relative z-10">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-16"
                >
                  <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                    About Almans
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    Crafting Style,{' '}
                    <span className="bg-gradient-to-r from-primary to-almans-gold bg-clip-text text-transparent">
                      Defining Elegance
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                    Born from a passion for premium fashion, Almans brings you carefully curated collections 
                    that blend timeless elegance with contemporary trends.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  {[
                    {
                      icon: Users,
                      title: 'Customer First',
                      description: 'We put our customers at the heart of everything we do, ensuring exceptional service and quality.',
                    },
                    {
                      icon: Award,
                      title: 'Premium Quality',
                      description: 'Every piece is crafted with attention to detail, using only the finest materials available.',
                    },
                    {
                      icon: Heart,
                      title: 'Passion Driven',
                      description: 'Our love for fashion drives us to constantly innovate and bring you the latest trends.',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 text-center hover:shadow-lg transition-shadow"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <item.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-3">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-gradient-to-r from-primary/10 via-almans-gold/10 to-primary/10 rounded-3xl p-8 md:p-12 text-center"
                >
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Our Mission
                  </h3>
                  <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                    To make premium fashion accessible to everyone, while maintaining the highest standards 
                    of quality and customer satisfaction. We believe everyone deserves to look and feel their best.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-20 md:py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute bottom-20 left-[10%] w-72 h-72 bg-almans-gold/5 rounded-full blur-3xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </div>

            <div className="container px-4 md:px-8 relative z-10">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-16"
                >
                  <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                    Get in Touch
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    Contact{' '}
                    <span className="bg-gradient-to-r from-primary to-almans-gold bg-clip-text text-transparent">
                      Us
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                    Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                  </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Contact Info */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                  >
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
                      <h3 className="font-display text-2xl font-bold text-foreground mb-6">Contact Information</h3>
                      <div className="space-y-6">
                        <a
                          href={`https://wa.me/${settings.social_whatsapp || '8801930278877'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-4 group"
                        >
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Phone className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">WhatsApp</p>
                            <p className="text-muted-foreground">+880 1930-278877</p>
                          </div>
                        </a>
                        <a
                          href="mailto:support@almans.com"
                          className="flex items-start gap-4 group"
                        >
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Email</p>
                            <p className="text-muted-foreground">support@almans.com</p>
                          </div>
                        </a>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Address</p>
                            <p className="text-muted-foreground">Dhaka, Bangladesh</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Business Hours</p>
                            <p className="text-muted-foreground">Sat - Thu: 10AM - 10PM</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
                      <h3 className="font-display text-xl font-bold text-foreground mb-4">Follow Us</h3>
                      <p className="text-muted-foreground mb-6">Stay connected with us on social media for updates and exclusive offers.</p>
                      <div className="flex gap-4">
                        <a
                          href={settings.social_facebook || 'https://www.facebook.com/profile.php?id=61584375982557'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a
                          href={settings.social_instagram || 'https://www.instagram.com/almans.bd'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                        </a>
                        <a
                          href={`https://wa.me/${settings.social_whatsapp || '8801930278877'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </motion.div>

                  {/* Contact Form */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 h-full">
                      <h3 className="font-display text-2xl font-bold text-foreground mb-6">Send us a Message</h3>
                      <form className="space-y-6" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get('name') as string;
                        const email = formData.get('email') as string;
                        const message = formData.get('message') as string;
                        const whatsappNumber = settings.social_whatsapp || '8801930278877';
                        const whatsappMessage = encodeURIComponent(`Hi, I'm ${name} (${email}).\n\n${message}`);
                        window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank');
                      }}>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-foreground">Your Name</label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="John Doe"
                              required
                              className="h-12 rounded-xl border-border/50 bg-background/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="you@example.com"
                              required
                              className="h-12 rounded-xl border-border/50 bg-background/50"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                          <Input
                            id="subject"
                            name="subject"
                            placeholder="How can we help?"
                            required
                            className="h-12 rounded-xl border-border/50 bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                          <Textarea
                            id="message"
                            name="message"
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            required
                            className="rounded-xl border-border/50 bg-background/50 resize-none"
                          />
                        </div>
                        <Button type="submit" size="lg" className="w-full gap-2 h-12 rounded-xl">
                          <Send className="w-4 h-4" />
                          Send Message via WhatsApp
                        </Button>
                      </form>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
        <CartSlide />
      </div>
    </>
  );
};

export default Shop;
