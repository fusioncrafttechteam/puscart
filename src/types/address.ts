export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  full_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
}

export interface AddressValidation {
  full_name?: string;
  phone_number?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface AddressState {
  addresses: UserAddress[];
  loading: boolean;
  error: string | null;
  selectedAddressId: string | null;
}

export interface AddressActions {
  fetchAddresses: () => Promise<void>;
  addAddress: (addressData: AddressFormData) => Promise<UserAddress>;
  updateAddress: (addressId: string, addressData: Partial<AddressFormData>) => Promise<UserAddress>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<UserAddress>;
  selectAddress: (addressId: string | null) => void;
  getDefaultAddress: () => UserAddress | undefined;
  clearError: () => void;
}

export interface AddressCardProps {
  address: UserAddress;
  isSelected: boolean;
  onSelect: (addressId: string) => void;
  onEdit: (address: UserAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}

export interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressFormData) => Promise<void>;
  editingAddress?: UserAddress | null;
}

export interface AddressContextType extends AddressState, AddressActions {
  validationErrors: AddressValidation;
  setValidationErrors: (errors: AddressValidation) => void;
  validateAddress: (addressData: AddressFormData) => boolean;
}
