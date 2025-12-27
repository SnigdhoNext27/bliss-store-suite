import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Package, User, MapPin, Lock, ChevronRight, Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: {
    full_name?: string;
    address?: string;
    area?: string;
  };
}

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string | null;
  postal_code: string | null;
  is_default: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Valid phone required').max(15).optional().or(z.literal('')),
});

const addressSchema = z.object({
  label: z.string().min(1, 'Label required'),
  full_name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Valid phone required'),
  address_line1: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Account() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    postal_code: '',
    is_default: false,
  });
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Fetch addresses
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (ordersData) setOrders(ordersData as Order[]);
      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
        });
      }
      if (addressesData) setAddresses(addressesData as Address[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const result = profileSchema.safeParse(profileForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast({ title: 'Profile updated successfully!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;
      toast({ title: 'Password changed successfully!' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({ title: 'Failed to change password', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    const result = addressSchema.safeParse(addressForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update({
            ...addressForm,
            address_line2: addressForm.address_line2 || null,
            district: addressForm.district || null,
            postal_code: addressForm.postal_code || null,
          })
          .eq('id', editingAddress);

        if (error) throw error;
        toast({ title: 'Address updated!' });
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user?.id,
            ...addressForm,
            address_line2: addressForm.address_line2 || null,
            district: addressForm.district || null,
            postal_code: addressForm.postal_code || null,
          });

        if (error) throw error;
        toast({ title: 'Address added!' });
      }

      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({
        label: 'Home',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        district: '',
        postal_code: '',
        is_default: false,
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to save address', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Address deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete address', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Account | Almans</title>
      </Helmet>

      <Header />
      <CartSlide />

      <main className="min-h-screen bg-background pt-20 pb-12">
        <div className="container px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground mb-8">Manage your orders, profile, and addresses</p>

            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="orders" className="gap-2">
                  <Package className="h-4 w-4 hidden sm:block" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4 hidden sm:block" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="addresses" className="gap-2">
                  <MapPin className="h-4 w-4 hidden sm:block" />
                  Addresses
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Lock className="h-4 w-4 hidden sm:block" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button onClick={() => navigate('/shop')} className="mt-4">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.order_number}`)}
                      className="bg-card rounded-xl p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(order.status)} text-white capitalize`}>
                            {order.status}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address?.address?.substring(0, 40)}...
                        </p>
                        <p className="font-bold">৳{order.total.toFixed(0)}</p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="bg-card rounded-xl p-6 max-w-lg">
                  <h2 className="font-display text-xl font-bold mb-6">Personal Information</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Your full name"
                      />
                      {errors.full_name && <p className="text-destructive text-sm">{errors.full_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+880 1XXX XXXXXX"
                      />
                      {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                    </div>

                    <Button onClick={handleUpdateProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-display text-xl font-bold">Saved Addresses</h2>
                    <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingAddress(null);
                          setAddressForm({
                            label: 'Home',
                            full_name: '',
                            phone: '',
                            address_line1: '',
                            address_line2: '',
                            city: '',
                            district: '',
                            postal_code: '',
                            is_default: false,
                          });
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Label</Label>
                              <Input
                                value={addressForm.label}
                                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                                placeholder="Home, Office, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Full Name</Label>
                              <Input
                                value={addressForm.full_name}
                                onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                              />
                              {errors.full_name && <p className="text-destructive text-sm">{errors.full_name}</p>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            />
                            {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Address Line 1</Label>
                            <Input
                              value={addressForm.address_line1}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                              placeholder="House, Street, Area"
                            />
                            {errors.address_line1 && <p className="text-destructive text-sm">{errors.address_line1}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Address Line 2 (Optional)</Label>
                            <Input
                              value={addressForm.address_line2}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>City</Label>
                              <Input
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              />
                              {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>District (Optional)</Label>
                              <Input
                                value={addressForm.district}
                                onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button onClick={handleSaveAddress} className="w-full" disabled={saving}>
                            {saving ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No saved addresses</p>
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="bg-card rounded-xl p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{address.label}</Badge>
                            {address.is_default && <Badge>Default</Badge>}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingAddress(address.id);
                                setAddressForm({
                                  label: address.label,
                                  full_name: address.full_name,
                                  phone: address.phone,
                                  address_line1: address.address_line1,
                                  address_line2: address.address_line2 || '',
                                  city: address.city,
                                  district: address.district || '',
                                  postal_code: address.postal_code || '',
                                  is_default: address.is_default,
                                });
                                setAddressDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="font-medium">{address.full_name}</p>
                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}{address.district && `, ${address.district}`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="bg-card rounded-xl p-6 max-w-lg">
                  <h2 className="font-display text-xl font-bold mb-6">Change Password</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                      />
                      {errors.newPassword && <p className="text-destructive text-sm">{errors.newPassword}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                      {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                    </div>

                    <Button onClick={handleChangePassword} disabled={saving}>
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
