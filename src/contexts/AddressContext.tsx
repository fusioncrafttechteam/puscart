import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { 
  UserAddress, 
  AddressFormData, 
  AddressValidation,
  AddressContextType 
} from '../types/address';

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};

interface AddressProviderProps {
  children: ReactNode;
  userId?: string;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children, userId }) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<AddressValidation>({});

  // Validate address form data
  const validateAddress = useCallback((addressData: AddressFormData): boolean => {
    const errors: AddressValidation = {};

    // Name validation
    if (!addressData.full_name.trim()) {
      errors.full_name = 'Name is required';
    } else if (addressData.full_name.trim().length < 2) {
      errors.full_name = 'Name must be at least 2 characters';
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!addressData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!phoneRegex.test(addressData.phone_number.replace(/\s/g, ''))) {
      errors.phone_number = 'Please enter a valid 10-digit phone number';
    }

    // Address validation
    if (!addressData.address_line_1.trim()) {
      errors.address_line_1 = 'Address line 1 is required';
    }

    if (!addressData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!addressData.state.trim()) {
      errors.state = 'State is required';
    }

    // Pincode validation
    const pincodeRegex = /^\d{6}$/;
    if (!addressData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!pincodeRegex.test(addressData.pincode.replace(/\s/g, ''))) {
      errors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // Fetch user addresses
  const fetchAddresses = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
      
      // Auto-select default address if none selected
      if (!selectedAddressId && data && data.length > 0) {
        const defaultAddr = data.find(addr => addr.is_default);
        setSelectedAddressId(defaultAddr?.id || data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedAddressId]);

  // Add new address
  const addAddress = useCallback(async (addressData: AddressFormData): Promise<UserAddress> => {
    if (!userId) throw new Error('User not authenticated');

    // Validate address
    if (!validateAddress(addressData)) {
      throw new Error('Please fix validation errors');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If this is the first address or marked as default, make it default
      const shouldBeDefault = addressData.is_default || addresses.length === 0;
      
      // If setting as default, unset other defaults
      if (shouldBeDefault) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert([{
          user_id: user.id,
          ...addressData,
          is_default: shouldBeDefault,
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchAddresses();
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [userId, addresses.length, validateAddress, fetchAddresses]);

  // Update address
  const updateAddress = useCallback(async (addressId: string, addressData: Partial<AddressFormData>): Promise<UserAddress> => {
    if (!userId) throw new Error('User not authenticated');

    // Validate if all required fields are present
    const fullData = { ...addresses.find(a => a.id === addressId), ...addressData } as AddressFormData;
    if (!validateAddress(fullData)) {
      throw new Error('Please fix validation errors');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If setting as default, unset other defaults
      if (addressData.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
          .neq('id', addressId);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .update({
          ...addressData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchAddresses();
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [userId, addresses, validateAddress, fetchAddresses]);

  // Delete address
  const deleteAddress = useCallback(async (addressId: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Clear selection if deleted address was selected
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
      }
      
      await fetchAddresses();
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [userId, selectedAddressId, fetchAddresses]);

  // Set default address
  const setDefaultAddress = useCallback(async (addressId: string): Promise<UserAddress> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Unset all other defaults
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);

      // Set new default
      const { data, error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchAddresses();
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [userId, fetchAddresses]);

  // Select address
  const selectAddress = useCallback((addressId: string | null) => {
    setSelectedAddressId(addressId);
  }, []);

  // Get default address
  const getDefaultAddress = useCallback((): UserAddress | undefined => {
    return addresses.find(addr => addr.is_default);
  }, [addresses]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch addresses on mount and when userId changes
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const value: AddressContextType = {
    // State
    addresses,
    loading,
    error,
    selectedAddressId,
    validationErrors,
    
    // Actions
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    selectAddress,
    getDefaultAddress,
    clearError,
    setValidationErrors,
    validateAddress,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};
