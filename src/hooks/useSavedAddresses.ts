import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface SavedAddress {
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

export interface NewAddressData {
  label?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district?: string;
  postal_code?: string;
  is_default?: boolean;
}

export function useSavedAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.is_default) || addresses[0] || null;
  };

  const saveAddress = async (addressData: NewAddressData): Promise<SavedAddress | null> => {
    if (!user) return null;

    try {
      // If this is set as default, unset other defaults first
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          label: addressData.label || 'Home',
          full_name: addressData.full_name,
          phone: addressData.phone,
          address_line1: addressData.address_line1,
          address_line2: addressData.address_line2 || null,
          city: addressData.city,
          district: addressData.district || null,
          postal_code: addressData.postal_code || null,
          is_default: addressData.is_default || addresses.length === 0, // First address is default
        })
        .select()
        .single();

      if (error) throw error;
      await fetchAddresses();
      return data;
    } catch (error) {
      console.error('Error saving address:', error);
      return null;
    }
  };

  const updateAddress = async (id: string, addressData: Partial<NewAddressData>): Promise<boolean> => {
    if (!user) return false;

    try {
      // If setting as default, unset other defaults first
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('addresses')
        .update({
          ...(addressData.label && { label: addressData.label }),
          ...(addressData.full_name && { full_name: addressData.full_name }),
          ...(addressData.phone && { phone: addressData.phone }),
          ...(addressData.address_line1 && { address_line1: addressData.address_line1 }),
          ...(addressData.address_line2 !== undefined && { address_line2: addressData.address_line2 || null }),
          ...(addressData.city && { city: addressData.city }),
          ...(addressData.district !== undefined && { district: addressData.district || null }),
          ...(addressData.postal_code !== undefined && { postal_code: addressData.postal_code || null }),
          ...(addressData.is_default !== undefined && { is_default: addressData.is_default }),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAddresses();
      return true;
    } catch (error) {
      console.error('Error updating address:', error);
      return false;
    }
  };

  const setDefaultAddress = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Unset all defaults first
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set the new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAddresses();
      return true;
    } catch (error) {
      console.error('Error setting default address:', error);
      return false;
    }
  };

  const deleteAddress = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAddresses();
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      return false;
    }
  };

  return {
    addresses,
    loading,
    refetch: fetchAddresses,
    getDefaultAddress,
    saveAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
  };
}
