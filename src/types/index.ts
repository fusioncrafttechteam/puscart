export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discount_price?: number;
  image: string;
  description: string;
  stock: number;
  unit: string;
  created_at: string;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  offer_price: number | null;
  discount_percentage: number;
  stock: number;
  unit: string | null;
  image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description?: string;
  display_order: number;
}

export interface CartItem {
  product: ProductWithCategory;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  products: CartItem[];
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  delivery_address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  addresses?: Address[];
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}
