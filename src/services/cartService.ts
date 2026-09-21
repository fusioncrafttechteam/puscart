import { supabase } from './supabase';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    offer_price?: number;
    image: string;
    categories: {
      id: string;
      name: string;
    };
  };
}

export const getCartItems = async (): Promise<CartItem[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch cart items');
  }

  const result = await response.json();
  return result.data || [];
};

export const addCartItem = async (productId: string, quantity: number = 1): Promise<CartItem> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      quantity: quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add item to cart');
  }

  const result = await response.json();
  return result.data;
};

export const updateCartItem = async (cartItemId: string, quantity: number): Promise<CartItem> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/${cartItemId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quantity: quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update cart item');
  }

  const result = await response.json();
  return result.data;
};

export const removeCartItem = async (cartItemId: string): Promise<{ success: boolean }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/${cartItemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove item from cart');
  }

  return response.json();
};

export const clearCart = async (): Promise<{ success: boolean }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to clear cart');
  }

  return response.json();
};
