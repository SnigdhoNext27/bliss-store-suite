import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Heart, Share2, ChevronLeft, Star, Truck, Shield, RefreshCw, Loader2, MessageCircle, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/store';
import { useProduct } from '@/hooks/useProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { RecentlyViewedProducts } from '@/components/RecentlyViewedProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const { product, loading, error } = useProduct(id);
  const { settings } = useSiteSettings();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [categoryHasSizes, setCategoryHasSizes] = useState(true);

  // Fetch category's has_sizes setting
  useEffect(() => {
    const fetchCategorySettings = async () => {
      if (!product?.category) return;
      
      const { data } = await supabase
        .from('categories')
        .select('has_sizes')
        .eq('name', product.category)
        .maybeSingle();
      
      if (data !== null) {
        setCategoryHasSizes(data.has_sizes ?? true);
      }
    };
    fetchCategorySettings();
  }, [product?.category]);

  useEffect(() => {
    if (product && categoryHasSizes) {
      setSelectedSize(product.sizes[0] || '');
    }
  }, [product, categoryHasSizes]);

  // Track recently viewed product
  useEffect(() => {
    if (id) {
      addToRecentlyViewed(id);
    }
  }, [id, addToRecentlyViewed]);

  const handleAddToCart = () => {
    if (!product) return;
    if (categoryHasSizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    addItem(product, selectedSize || 'One Size', quantity);
    toast({ title: 'Added to bag!' });
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (categoryHasSizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    addItem(product, selectedSize || 'One Size', quantity);
    navigate('/checkout');
  };

  const handleOrderViaWhatsApp = () => {
    if (!product) return;
    const phone = settings.business_phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello Almans! 👋\n\nI'd like to order:\n` +
      `• Product: ${product.name}\n` +
      `• Size: ${selectedSize || 'Not selected'}\n` +
      `• Quantity: ${quantity}\n` +
      `• Price: ৳${product.price * quantity}\n\n` +
      `Please confirm availability and provide payment details.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleOrderViaEmail = () => {
    if (!product) return;
    const subject = encodeURIComponent(`Order Inquiry: ${product.name}`);
    const body = encodeURIComponent(
      `Hello Almans,\n\nI'd like to order:\n\n` +
      `Product: ${product.name}\n` +
      `Size: ${selectedSize || 'Not selected'}\n` +
      `Quantity: ${quantity}\n` +
      `Price: ৳${product.price * quantity}\n\n` +
      `Please confirm availability and provide payment details.\n\n` +
      `Thank you!`
    );
    window.open(`mailto:${settings.business_email}?subject=${subject}&body=${body}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} | Almans</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <Header />
      <CartSlide />

      <main className="min-h-screen bg-background pt-20">
        <div className="container px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to shop
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="aspect-[4/5] bg-card rounded-2xl overflow-hidden">
                {product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <p className="text-muted-foreground">No image</p>
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm text-primary font-medium tracking-wider uppercase mb-2">
                  {product.category}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">(24 reviews)</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-foreground">
                    ৳{product.price.toFixed(0)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ৳{product.originalPrice.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}. Crafted with premium materials for lasting comfort and style.
              </p>

              {/* Size Selection - Only show if category has sizes */}
              {categoryHasSizes && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Size</span>
                    <button className="text-sm text-primary hover:underline">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3rem] h-12 px-4 rounded-lg font-medium transition-all ${
                          selectedSize === size
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground hover:bg-accent'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <span className="font-medium">Quantity</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-secondary transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-secondary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stock} items available
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleAddToCart} size="lg" variant="outline" className="flex-1">
                  ADD TO BAG
                </Button>
                <Button onClick={handleBuyNow} size="lg" className="flex-1">
                  BUY NOW
                </Button>
              </div>

              {/* WhatsApp / Email Order Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleOrderViaWhatsApp}
                  variant="outline"
                  className="flex-1 gap-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  Order via WhatsApp
                </Button>
                <Button
                  onClick={handleOrderViaEmail}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Mail className="h-5 w-5" />
                  Order via Email
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} />
                  Add to Wishlist
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>

              {/* Features */}
              <div className="border-t border-border pt-6 mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-sm">Free shipping on orders over ৳2000</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm">Secure payment & checkout</span>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span className="text-sm">Easy returns within 7 days</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Recently Viewed Products */}
      <RecentlyViewedProducts />

      <Footer />
    </>
  );
}
