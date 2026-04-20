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
  onSave: (address: AddressFormData) => void;
  editingAddress?: UserAddress | null;
}
