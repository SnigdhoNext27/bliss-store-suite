import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Phone, Truck, Check, PartyPopper, MessageCircle, Mail, AlertTriangle, Banknote, CreditCard, Smartphone, Award, Package, Wallet } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/lib/store';
import { useCartWithLivePrices } from '@/hooks/useCartWithLivePrices';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { LoyaltyPointsRedemption } from '@/components/LoyaltyPointsRedemption';
import { BulkDiscountBanner } from '@/components/BulkDiscountBanner';
import { useBulkDiscount } from '@/hooks/useBulkDiscount';
import { GiftWrapOption } from '@/components/GiftWrapOption';
import { SavedPaymentMethods } from '@/components/SavedPaymentMethods';
import { useSavedPaymentMethods } from '@/hooks/useSavedPaymentMethods';
import { SavedAddressSelector } from '@/components/SavedAddressSelector';
import { useSavedAddresses, SavedAddress } from '@/hooks/useSavedAddresses';

const deliverySchema = z.object({
  fullName: z.string().min(2, 'Name is required').max(100),
  phone: z.string().min(10, 'Valid phone number required').max(15),
  address: z.string().min(10, 'Please enter your full address').max(500),
  deliveryArea: z.enum(['dhaka', 'outside']),
});

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { clearCart } = useCartStore();
  const { 
    items, 
    liveSubtotal, 
    hasPriceChanges, 
    hasUnavailableProducts,
    removeUnavailableItems,
    loading: productsLoading 
  } = useCartWithLivePrices();
  const { settings } = useSiteSettings();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    deliveryArea: 'dhaka' as 'dhaka' | 'outside',
    paymentMethod: 'cod' as 'cod' | 'bkash' | 'nagad' | 'card',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedSavedPayment, setSelectedSavedPayment] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const { methods: savedPaymentMethods } = useSavedPaymentMethods();
  const { addresses: savedAddresses, loading: addressesLoading, getDefaultAddress } = useSavedAddresses();

  // Auto-select default address when addresses load
  useEffect(() => {
    if (!addressesLoading && savedAddresses.length > 0 && !selectedAddressId && !useNewAddress) {
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) {
        handleSelectSavedAddress(defaultAddr);
      }
    }
  }, [addressesLoading, savedAddresses]);

  const handleSelectSavedAddress = (address: SavedAddress | null) => {
    if (address) {
      setSelectedAddressId(address.id);
      setUseNewAddress(false);
      // Populate form with saved address data
      setFormData({
        ...formData,
        fullName: address.full_name,
        phone: address.phone,
        address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}${address.district ? ', ' + address.district : ''}`,
      });
    } else {
      setSelectedAddressId(null);
      setUseNewAddress(true);
      // Clear form for new address
      setFormData({
        ...formData,
        fullName: '',
        phone: '',
        address: '',
      });
    }
  };

  const subtotal = liveSubtotal;
  const { discountAmount: bulkDiscountAmount, applicableTier } = useBulkDiscount(items, subtotal);
  const deliveryFeeDhaka = parseInt(settings.delivery_fee_dhaka) || 60;
  const deliveryFeeOutside = parseInt(settings.delivery_fee_outside) || 120;
  const deliveryFee = formData.deliveryArea === 'dhaka' ? deliveryFeeDhaka : deliveryFeeOutside;
  const giftWrapFee = giftWrap ? 50 : 0;
  const total = subtotal + deliveryFee + giftWrapFee - pointsDiscount - bulkDiscountAmount;

  const handlePointsRedemption = (pointsUsed: number, discountAmount: number) => {
    setRedeemedPoints(pointsUsed);
    setPointsDiscount(discountAmount);
  };

  // Require login to checkout
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">Login Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in or create an account to complete your order. This helps us track your orders and provide better service.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/auth?redirect=/checkout')} size="lg">
              Sign In / Sign Up
            </Button>
            <Button variant="outline" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (step === 1 && items.length === 0) {
      toast({ title: 'Your bag is empty', variant: 'destructive' });
      return;
    }
    
    if (step === 2) {
      const result = deliverySchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
      setErrors({});
    }
    
    setStep(step + 1);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: 'Please sign in to place an order', variant: 'destructive' });
      navigate('/auth?redirect=/checkout');
      return;
    }

    setLoading(true);
    
    try {
      // Generate secure random order number
      const randomBytes = crypto.getRandomValues(new Uint8Array(6));
      const randomStr = Array.from(randomBytes)
        .map(b => b.toString(36))
        .join('')
        .toUpperCase()
        .substring(0, 8);
      const orderNum = `ALM-${randomStr}`;
      
      // Prepare order items for secure RPC function - use live prices
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images[0] || null,
        size: item.size,
        color: null,
        quantity: item.quantity,
        price: item.livePrice, // Use live price instead of stored price
      }));

      // Use secure database function for atomic order creation with price validation
      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_order_number: orderNum,
        p_subtotal: subtotal,
        p_delivery_fee: deliveryFee,
        p_total: total,
        p_shipping_address: {
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          area: formData.deliveryArea,
        },
        p_items: orderItems,
        p_user_id: user.id, // User is now required
        p_guest_phone: null,
        p_guest_email: null,
        p_notes: formData.notes || null,
      });

      if (error) throw error;

      // Type assertion for the RPC response
      const result = data as { success: boolean; order_number?: string; error?: string } | null;

      // Check if the function returned an error
      if (result && !result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      setOrderNumber(result?.order_number || orderNum);
      clearCart();
      setStep(4);
      
      // Send WhatsApp notification to admin
      try {
        const notificationPayload = {
          orderNumber: result?.order_number || orderNum,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          deliveryArea: formData.deliveryArea,
          items: items.map(item => ({
            name: item.product.name,
            size: item.size,
            quantity: item.quantity,
            price: item.livePrice,
          })),
          subtotal,
          deliveryFee,
          total,
          notes: formData.notes || undefined,
        };
        
        const { data: notifData } = await supabase.functions.invoke('order-notification', {
          body: notificationPayload,
        });
        
        // Open WhatsApp link in new tab for admin notification
        if (notifData?.whatsappUrl) {
          window.open(notifData.whatsappUrl, '_blank');
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Don't fail the order if notification fails
      }
      
      toast({ title: 'Order placed successfully!' });
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: 'Failed to place order',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const phone = settings.business_phone.replace(/[^0-9]/g, '');
    const itemsList = items.map(item => 
      `• ${item.product.name} — Size: ${item.size} — Qty: ${item.quantity} — Price: ৳${item.livePrice}`
    ).join('\n');

    const message = encodeURIComponent(
      `Hello Almans 👋\nI want to place an order:\n` +
      `• Phone: ${formData.phone}\n` +
      `• Address: ${formData.address}\n` +
      `• Delivery Area: ${formData.deliveryArea === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}\n` +
      `• Items:\n${itemsList}\n` +
      `Subtotal: ৳${subtotal}\n` +
      `Delivery Fee: ৳${deliveryFee}\n` +
      `Total: ৳${total}`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const openEmail = () => {
    const itemsList = items.map(item => 
      `• ${item.product.name} — Size: ${item.size} — Qty: ${item.quantity} — Price: ৳${item.livePrice}`
    ).join('\n');

    const subject = encodeURIComponent('New Order from Almans');
    const body = encodeURIComponent(
      `Hello Almans,\n\nI want to place an order:\n\n` +
      `Name: ${formData.fullName}\n` +
      `Phone: ${formData.phone}\n` +
      `Address: ${formData.address}\n` +
      `Delivery Area: ${formData.deliveryArea === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}\n\n` +
      `Items:\n${itemsList}\n\n` +
      `Subtotal: ৳${subtotal}\n` +
      `Delivery Fee: ৳${deliveryFee}\n` +
      `Total: ৳${total}\n\n` +
      `Please confirm my order.\nThank you!`
    );

    window.open(`mailto:${settings.business_email}?subject=${subject}&body=${body}`, '_blank');
  };

  if (items.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Your bag is empty</h2>
          <Button onClick={() => navigate('/')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Almans</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border py-4">
          <div className="container px-4 flex items-center justify-between">
            <button
              onClick={() => step > 1 && step < 4 ? setStep(step - 1) : navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
              {step === 1 ? 'Back to Shop' : 'Back'}
            </button>
            <h1 className="font-display text-xl font-bold">Checkout</h1>
            <div className="w-20" />
          </div>
        </header>

        {/* Progress Steps */}
        {step < 4 && (
          <div className="bg-card border-b border-border py-4">
            <div className="container px-4">
              <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        s <= step
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {s < step ? <Check className="h-4 w-4" /> : s}
                    </div>
                    <span className={`text-sm hidden sm:block ${s <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s === 1 ? 'Review' : s === 2 ? 'Delivery' : 'Confirm'}
                    </span>
                    {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="container px-4 py-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Review Bag */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="font-display text-2xl font-bold mb-6">Review Your Bag 👜</h2>
                
                {/* Price Change Warning */}
                {hasPriceChanges && !productsLoading && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 mb-4 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">Some prices have been updated. The amounts below reflect the current prices.</p>
                  </div>
                )}

                {/* Unavailable Products Warning */}
                {hasUnavailableProducts && !productsLoading && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 p-3 mb-4 text-destructive">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">Some items are no longer available.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeUnavailableItems}>
                      Remove
                    </Button>
                  </div>
                )}
                
                <div className="space-y-4 mb-8">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className={`flex gap-4 bg-card rounded-xl p-4 ${item.productUnavailable ? 'opacity-50' : ''}`}>
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-20 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        {item.productUnavailable && (
                          <p className="text-sm text-destructive">Unavailable</p>
                        )}
                        {item.priceChanged && !item.productUnavailable && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Price updated from ৳{item.originalStoredPrice.toFixed(0)}
                          </p>
                        )}
                        <p className="font-medium mt-1">৳{(item.livePrice * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-card rounded-xl p-6 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-sm text-muted-foreground">Select area in next step</span>
                  </div>
                </div>

                {/* Bulk Discount Banner */}
                <div className="mb-6">
                  <BulkDiscountBanner items={items} subtotal={subtotal} />
                </div>

                <Button onClick={handleNext} size="lg" className="w-full">
                  NEXT ➜
                </Button>
              </motion.div>
            )}

            {/* Step 2: Delivery Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="font-display text-2xl font-bold mb-6">Delivery Information</h2>
                
                <div className="space-y-5 mb-8">
                  {/* Saved Addresses Selector */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <SavedAddressSelector
                        addresses={savedAddresses}
                        loading={addressesLoading}
                        selectedAddressId={selectedAddressId}
                        onSelectAddress={handleSelectSavedAddress}
                        onAddNewAddress={() => handleSelectSavedAddress(null)}
                      />
                    </div>
                  )}

                  {/* Show form fields when using new address or no saved addresses */}
                  {(useNewAddress || savedAddresses.length === 0 || selectedAddressId === null) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Your full name"
                        />
                        {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" /> Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+880 1XXX XXXXXX"
                        />
                        {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Delivery Address *
                        </Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="House, Road, Area, City"
                          rows={3}
                        />
                        {errors.address && <p className="text-destructive text-sm">{errors.address}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Truck className="h-4 w-4" /> Delivery Area *
                    </Label>
                    <RadioGroup
                      value={formData.deliveryArea}
                      onValueChange={(val) => setFormData({ ...formData, deliveryArea: val as 'dhaka' | 'outside' })}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="dhaka"
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.deliveryArea === 'dhaka'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="dhaka" id="dhaka" />
                          <div>
                            <p className="font-medium">🏙️ Inside Dhaka</p>
                            <p className="text-sm text-muted-foreground">2-3 business days</p>
                          </div>
                        </div>
                        <span className="font-bold">৳{deliveryFeeDhaka}</span>
                      </Label>
                      <Label
                        htmlFor="outside"
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.deliveryArea === 'outside'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="outside" id="outside" />
                          <div>
                            <p className="font-medium">🌍 Outside Dhaka</p>
                            <p className="text-sm text-muted-foreground">3-5 business days</p>
                          </div>
                        </div>
                        <span className="font-bold">৳{deliveryFeeOutside}</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {/* Order Notes / Special Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <Package className="h-4 w-4" /> Special Instructions (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any special delivery instructions, preferred delivery time, landmarks, or other notes..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      E.g., "Leave at the gate", "Call before delivery", "Preferred time: After 5 PM"
                    </p>
                  </div>
                </div>

                <Button onClick={handleNext} size="lg" className="w-full">
                  NEXT ➜
                </Button>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <h2 className="font-display text-2xl font-bold mb-6">Confirm Your Order</h2>
                
                {/* Gift Wrap Option */}
                <GiftWrapOption
                  enabled={giftWrap}
                  message={giftMessage}
                  onToggle={setGiftWrap}
                  onMessageChange={setGiftMessage}
                  price={50}
                />
                
                {/* Loyalty Points Redemption */}
                <LoyaltyPointsRedemption
                  subtotal={subtotal}
                  onPointsRedemption={handlePointsRedemption}
                  redeemedPoints={redeemedPoints}
                />

                {/* Order Summary */}
                <div className="bg-card rounded-xl p-6 mb-6 space-y-4 mt-6">
                  <h3 className="font-medium">Order Summary</h3>
                  {items.filter(item => !item.productUnavailable).map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-sm">
                      <span>{item.product.name} × {item.quantity} ({item.size})</span>
                      <span>৳{(item.livePrice * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <hr className="border-border" />
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery ({formData.deliveryArea === 'dhaka' ? 'Dhaka' : 'Outside'})</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Points Discount ({redeemedPoints} pts)
                      </span>
                      <span>-৳{pointsDiscount}</span>
                    </div>
                  )}
                  {bulkDiscountAmount > 0 && applicableTier && (
                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Bulk Discount ({applicableTier.discountPercent}%)
                      </span>
                      <span>-৳{bulkDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {giftWrap && (
                    <div className="flex justify-between text-pink-600 dark:text-pink-400">
                      <span>Gift Wrap</span>
                      <span>+৳50</span>
                    </div>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Payable</span>
                    <span>৳{total.toFixed(0)}</span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-card rounded-xl p-6 mb-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </h3>
                  
                  {/* Saved Payment Methods */}
                  {savedPaymentMethods.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Your saved payment methods
                      </p>
                      <SavedPaymentMethods
                        selectedId={selectedSavedPayment}
                        onSelect={(id) => {
                          setSelectedSavedPayment(id);
                          const method = savedPaymentMethods.find(m => m.id === id);
                          if (method) {
                            setFormData({ ...formData, paymentMethod: method.method_type as 'cod' | 'bkash' | 'nagad' | 'card' });
                          }
                        }}
                        showAddButton={false}
                      />
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or pay with</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(val) => {
                      setFormData({ ...formData, paymentMethod: val as 'cod' | 'bkash' | 'nagad' | 'card' });
                      setSelectedSavedPayment(null);
                    }}
                    className="space-y-3"
                  >
                    {/* COD - Available */}
                    <Label
                      htmlFor="cod"
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.paymentMethod === 'cod' && !selectedSavedPayment
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="cod" id="cod" checked={formData.paymentMethod === 'cod' && !selectedSavedPayment} />
                        <div className="flex items-center gap-2">
                          <Banknote className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-xs text-muted-foreground">Pay when you receive</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-green-600">Available</span>
                    </Label>

                    {/* bKash - Coming Soon */}
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-muted/30 opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-pink-600" />
                          <div>
                            <p className="font-medium">bKash</p>
                            <p className="text-xs text-muted-foreground">Mobile payment</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Coming Soon</span>
                    </div>

                    {/* Nagad - Coming Soon */}
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-muted/30 opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Nagad</p>
                            <p className="text-xs text-muted-foreground">Mobile payment</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Coming Soon</span>
                    </div>

                    {/* Cards - Coming Soon */}
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-muted/30 opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Debit/Credit Card</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard, etc.</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Coming Soon</span>
                    </div>
                  </RadioGroup>
                </div>

                {/* Delivery Info */}
                <div className="bg-card rounded-xl p-6 mb-6">
                  <h3 className="font-medium mb-3">Delivery To</h3>
                  <p className="font-medium">{formData.fullName}</p>
                  <p className="text-muted-foreground text-sm">{formData.phone}</p>
                  <p className="text-muted-foreground text-sm">{formData.address}</p>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions..."
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  size="lg"
                  className="w-full text-lg"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : '🎉 PLACE MY ORDER'}
                </Button>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <PartyPopper className="h-10 w-10 text-primary" />
                </motion.div>

                <h2 className="font-display text-3xl font-bold mb-4">Thanks — Order Placed!</h2>
                <p className="text-muted-foreground mb-6">
                  Your order has been confirmed. We'll contact you shortly.
                </p>

                <div className="bg-card rounded-xl p-6 mb-6">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-display text-2xl font-bold text-primary">{orderNumber}</p>
                </div>

                <div className="space-y-3">
                  <Button onClick={openWhatsApp} size="lg" className="w-full bg-green-600 hover:bg-green-700 gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Send via WhatsApp
                  </Button>
                  <Button onClick={openEmail} size="lg" variant="outline" className="w-full gap-2">
                    <Mail className="h-5 w-5" />
                    Send via Email
                  </Button>
                  <Button onClick={() => navigate('/shop')} variant="ghost" size="lg" className="w-full">
                    Continue Shopping
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
