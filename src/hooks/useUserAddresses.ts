import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { UserAddress, AddressFormData } from '../types/address';

export const useUserAddresses = (userId: string | undefined) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user addresses
  const fetchAddresses = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new address
  const addAddress = async (addressData: AddressFormData) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .insert([
          {
            user_id: userId,
            ...addressData,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh addresses
      await fetchAddresses();
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // Update address
  const updateAddress = async (addressId: string, addressData: Partial<AddressFormData>) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .update({
          ...addressData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh addresses
      await fetchAddresses();
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // Delete address
  const deleteAddress = async (addressId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Refresh addresses
      await fetchAddresses();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh addresses
      await fetchAddresses();
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // Get default address
  const getDefaultAddress = () => {
    return addresses.find(addr => addr.is_default);
  };

  // Fetch addresses on component mount and when userId changes
  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
  };
};
